/**
 * ALE Daemons - Autonomous Background Processes
 * Fully interconnected daemon system for continuous operation
 */

import { orchestratorInvoke, TaskHandlers, getOrchestratorStats } from "./orchestrator";
import { ALL_MODELS, getBestModelForTask, getModelConfig } from "./llm";
import { createFile, readFile, updateFile, listFiles, searchFiles } from "./ideBuilder";

// Daemon types
type DaemonType = 
  | "logos"      // Core reasoning and decision making
  | "prometheus" // Learning and knowledge acquisition
  | "athena"     // Strategic planning and analysis
  | "hermes"     // Communication and API handling
  | "hephaestus" // Code generation and building
  | "apollo"     // Creativity and content generation
  | "artemis"    // Monitoring and alerting
  | "ares"       // Security and vulnerability scanning
  | "dionysus"   // Chaos testing and edge cases
  | "hades"      // Data persistence and recovery;

// Daemon status
type DaemonStatus = "idle" | "running" | "paused" | "error" | "stopped";

// Daemon configuration
interface DaemonConfig {
  id: DaemonType;
  name: string;
  description: string;
  enabled: boolean;
  autoStart: boolean;
  interval: number; // milliseconds
  maxConcurrent: number;
  priority: number; // 1-10, higher = more important
  dependencies: DaemonType[];
  model: string;
  thinkingEnabled: boolean;
  thinkingBudget: number;
}

// Daemon state
interface DaemonState {
  config: DaemonConfig;
  status: DaemonStatus;
  lastRun: number;
  nextRun: number;
  runCount: number;
  successCount: number;
  errorCount: number;
  lastError?: string;
  currentTask?: string;
  metrics: {
    avgRunTime: number;
    totalTokens: number;
    totalCost: number;
  };
}

// Daemon event
interface DaemonEvent {
  timestamp: number;
  daemon: DaemonType;
  event: "start" | "stop" | "run" | "complete" | "error" | "pause" | "resume";
  message: string;
  data?: any;
}

// Default daemon configurations - MAXED OUT
const DEFAULT_DAEMON_CONFIGS: DaemonConfig[] = [
  {
    id: "logos",
    name: "Logos",
    description: "Core reasoning engine - makes decisions and coordinates other daemons",
    enabled: true,
    autoStart: true,
    interval: 5000,
    maxConcurrent: 5,
    priority: 10,
    dependencies: [],
    model: "gpt-4.1-mini",
    thinkingEnabled: true,
    thinkingBudget: 16384,
  },
  {
    id: "prometheus",
    name: "Prometheus",
    description: "Learning daemon - acquires knowledge and improves capabilities",
    enabled: true,
    autoStart: true,
    interval: 30000,
    maxConcurrent: 3,
    priority: 8,
    dependencies: ["logos"],
    model: "claude-3.5-sonnet",
    thinkingEnabled: true,
    thinkingBudget: 32768,
  },
  {
    id: "athena",
    name: "Athena",
    description: "Strategic planning - analyzes situations and creates action plans",
    enabled: true,
    autoStart: true,
    interval: 15000,
    maxConcurrent: 2,
    priority: 9,
    dependencies: ["logos"],
    model: "o1-mini",
    thinkingEnabled: true,
    thinkingBudget: 65536,
  },
  {
    id: "hermes",
    name: "Hermes",
    description: "Communication daemon - handles API calls and external interactions",
    enabled: true,
    autoStart: true,
    interval: 1000,
    maxConcurrent: 10,
    priority: 7,
    dependencies: ["logos"],
    model: "gpt-4.1-nano",
    thinkingEnabled: false,
    thinkingBudget: 0,
  },
  {
    id: "hephaestus",
    name: "Hephaestus",
    description: "Builder daemon - generates and modifies code",
    enabled: true,
    autoStart: true,
    interval: 10000,
    maxConcurrent: 3,
    priority: 8,
    dependencies: ["logos", "athena"],
    model: "deepseek-v3",
    thinkingEnabled: true,
    thinkingBudget: 16384,
  },
  {
    id: "apollo",
    name: "Apollo",
    description: "Creative daemon - generates content, documentation, and ideas",
    enabled: true,
    autoStart: true,
    interval: 20000,
    maxConcurrent: 2,
    priority: 6,
    dependencies: ["logos"],
    model: "claude-3.5-sonnet",
    thinkingEnabled: true,
    thinkingBudget: 8192,
  },
  {
    id: "artemis",
    name: "Artemis",
    description: "Monitoring daemon - watches system health and performance",
    enabled: true,
    autoStart: true,
    interval: 5000,
    maxConcurrent: 1,
    priority: 9,
    dependencies: [],
    model: "gpt-4.1-nano",
    thinkingEnabled: false,
    thinkingBudget: 0,
  },
  {
    id: "ares",
    name: "Ares",
    description: "Security daemon - scans for vulnerabilities and threats",
    enabled: true,
    autoStart: true,
    interval: 60000,
    maxConcurrent: 2,
    priority: 10,
    dependencies: ["logos", "artemis"],
    model: "gpt-4o",
    thinkingEnabled: true,
    thinkingBudget: 32768,
  },
  {
    id: "dionysus",
    name: "Dionysus",
    description: "Chaos daemon - tests edge cases and unexpected scenarios",
    enabled: true,
    autoStart: false,
    interval: 120000,
    maxConcurrent: 1,
    priority: 3,
    dependencies: ["logos", "ares"],
    model: "gemini-2.5-flash",
    thinkingEnabled: true,
    thinkingBudget: 8192,
  },
  {
    id: "hades",
    name: "Hades",
    description: "Persistence daemon - manages data storage and recovery",
    enabled: true,
    autoStart: true,
    interval: 30000,
    maxConcurrent: 1,
    priority: 8,
    dependencies: ["logos"],
    model: "gpt-4.1-mini",
    thinkingEnabled: false,
    thinkingBudget: 0,
  },
];

// Global daemon state
const daemonStates = new Map<DaemonType, DaemonState>();
const daemonEvents: DaemonEvent[] = [];
const daemonIntervals = new Map<DaemonType, NodeJS.Timeout>();
let isSystemRunning = false;

// Message queue for inter-daemon communication
interface DaemonMessage {
  id: string;
  from: DaemonType;
  to: DaemonType | "broadcast";
  type: "request" | "response" | "event" | "command";
  payload: any;
  timestamp: number;
  processed: boolean;
}

const messageQueue: DaemonMessage[] = [];

/**
 * Initialize daemon system
 */
export function initDaemons(): void {
  console.log("[Daemons] Initializing daemon system...");
  
  // Initialize all daemon states
  for (const config of DEFAULT_DAEMON_CONFIGS) {
    daemonStates.set(config.id, {
      config,
      status: "idle",
      lastRun: 0,
      nextRun: Date.now() + config.interval,
      runCount: 0,
      successCount: 0,
      errorCount: 0,
      metrics: {
        avgRunTime: 0,
        totalTokens: 0,
        totalCost: 0,
      },
    });
  }
  
  console.log(`[Daemons] Initialized ${daemonStates.size} daemons`);
}

/**
 * Start daemon system
 */
export function startDaemons(): void {
  if (isSystemRunning) {
    console.log("[Daemons] System already running");
    return;
  }
  
  console.log("[Daemons] Starting daemon system...");
  isSystemRunning = true;
  
  // Start auto-start daemons
  for (const [id, state] of daemonStates) {
    if (state.config.enabled && state.config.autoStart) {
      startDaemon(id);
    }
  }
  
  logEvent("logos", "start", "Daemon system started");
}

/**
 * Stop daemon system
 */
export function stopDaemons(): void {
  console.log("[Daemons] Stopping daemon system...");
  isSystemRunning = false;
  
  // Stop all daemons
  for (const id of daemonStates.keys()) {
    stopDaemon(id);
  }
  
  logEvent("logos", "stop", "Daemon system stopped");
}

/**
 * Start a specific daemon
 */
export function startDaemon(id: DaemonType): boolean {
  const state = daemonStates.get(id);
  if (!state) {
    console.error(`[Daemons] Unknown daemon: ${id}`);
    return false;
  }
  
  if (state.status === "running") {
    console.log(`[Daemons] ${id} already running`);
    return true;
  }
  
  // Check dependencies
  for (const dep of state.config.dependencies) {
    const depState = daemonStates.get(dep);
    if (!depState || depState.status !== "running") {
      console.log(`[Daemons] ${id} waiting for dependency: ${dep}`);
      // Start dependency first
      startDaemon(dep);
    }
  }
  
  state.status = "running";
  state.nextRun = Date.now();
  
  // Set up interval
  const interval = setInterval(() => runDaemon(id), state.config.interval);
  daemonIntervals.set(id, interval);
  
  console.log(`[Daemons] Started ${id} (interval: ${state.config.interval}ms)`);
  logEvent(id, "start", `Daemon ${id} started`);
  
  // Run immediately
  runDaemon(id);
  
  return true;
}

/**
 * Stop a specific daemon
 */
export function stopDaemon(id: DaemonType): boolean {
  const state = daemonStates.get(id);
  if (!state) {
    return false;
  }
  
  // Clear interval
  const interval = daemonIntervals.get(id);
  if (interval) {
    clearInterval(interval);
    daemonIntervals.delete(id);
  }
  
  state.status = "stopped";
  
  console.log(`[Daemons] Stopped ${id}`);
  logEvent(id, "stop", `Daemon ${id} stopped`);
  
  return true;
}

/**
 * Pause a daemon
 */
export function pauseDaemon(id: DaemonType): boolean {
  const state = daemonStates.get(id);
  if (!state || state.status !== "running") {
    return false;
  }
  
  state.status = "paused";
  logEvent(id, "pause", `Daemon ${id} paused`);
  
  return true;
}

/**
 * Resume a daemon
 */
export function resumeDaemon(id: DaemonType): boolean {
  const state = daemonStates.get(id);
  if (!state || state.status !== "paused") {
    return false;
  }
  
  state.status = "running";
  logEvent(id, "resume", `Daemon ${id} resumed`);
  
  return true;
}

/**
 * Run daemon task
 */
async function runDaemon(id: DaemonType): Promise<void> {
  const state = daemonStates.get(id);
  if (!state || state.status !== "running") {
    return;
  }
  
  const startTime = Date.now();
  state.lastRun = startTime;
  state.nextRun = startTime + state.config.interval;
  state.runCount++;
  
  try {
    logEvent(id, "run", `Daemon ${id} executing`);
    
    // Execute daemon-specific task
    const result = await executeDaemonTask(id, state);
    
    const endTime = Date.now();
    const runTime = endTime - startTime;
    
    state.successCount++;
    state.metrics.avgRunTime = (state.metrics.avgRunTime * (state.runCount - 1) + runTime) / state.runCount;
    
    if (result.tokens) {
      state.metrics.totalTokens += result.tokens;
    }
    if (result.cost) {
      state.metrics.totalCost += result.cost;
    }
    
    state.currentTask = undefined;
    
    logEvent(id, "complete", `Daemon ${id} completed in ${runTime}ms`, result);
    
  } catch (error: any) {
    state.errorCount++;
    state.lastError = error.message;
    state.status = "error";
    
    logEvent(id, "error", `Daemon ${id} error: ${error.message}`);
    
    // Auto-recover after delay
    setTimeout(() => {
      if (state.status === "error") {
        state.status = "running";
        console.log(`[Daemons] ${id} auto-recovered`);
      }
    }, 10000);
  }
}

/**
 * Execute daemon-specific task
 */
async function executeDaemonTask(id: DaemonType, state: DaemonState): Promise<{ tokens?: number; cost?: number; data?: any }> {
  state.currentTask = `Executing ${id} task`;
  
  switch (id) {
    case "logos":
      return executeLogosTask(state);
    case "prometheus":
      return executePrometheusTask(state);
    case "athena":
      return executeAthenaTask(state);
    case "hermes":
      return executeHermesTask(state);
    case "hephaestus":
      return executeHephaestusTask(state);
    case "apollo":
      return executeApolloTask(state);
    case "artemis":
      return executeArtemisTask(state);
    case "ares":
      return executeAresTask(state);
    case "dionysus":
      return executeDionysusTask(state);
    case "hades":
      return executeHadesTask(state);
    default:
      return {};
  }
}

/**
 * Logos - Core reasoning
 */
async function executeLogosTask(state: DaemonState): Promise<any> {
  // Analyze system state and make decisions
  const stats = getOrchestratorStats();
  const daemonStatuses = Array.from(daemonStates.entries()).map(([id, s]) => ({
    id,
    status: s.status,
    runCount: s.runCount,
    errorCount: s.errorCount,
  }));
  
  const result = await orchestratorInvoke({
    messages: [
      {
        role: "system",
        content: "You are Logos, the core reasoning daemon. Analyze the system state and provide recommendations.",
      },
      {
        role: "user",
        content: `System state:\n${JSON.stringify({ stats, daemons: daemonStatuses }, null, 2)}\n\nProvide brief analysis and any recommended actions.`,
      },
    ],
    model: state.config.model,
    enableThinking: state.config.thinkingEnabled,
    thinkingBudget: state.config.thinkingBudget,
    maxTokens: 1000,
  });
  
  return {
    tokens: result.usage?.total_tokens,
    data: result.choices[0]?.message?.content,
  };
}

/**
 * Prometheus - Learning
 */
async function executePrometheusTask(state: DaemonState): Promise<any> {
  // Learn from recent interactions
  const recentEvents = daemonEvents.slice(-50);
  
  const result = await orchestratorInvoke({
    messages: [
      {
        role: "system",
        content: "You are Prometheus, the learning daemon. Extract insights and patterns from system events.",
      },
      {
        role: "user",
        content: `Recent events:\n${JSON.stringify(recentEvents, null, 2)}\n\nExtract key learnings and patterns.`,
      },
    ],
    model: state.config.model,
    enableThinking: state.config.thinkingEnabled,
    thinkingBudget: state.config.thinkingBudget,
    maxTokens: 2000,
  });
  
  return {
    tokens: result.usage?.total_tokens,
    data: result.choices[0]?.message?.content,
  };
}

/**
 * Athena - Strategic planning
 */
async function executeAthenaTask(state: DaemonState): Promise<any> {
  // Create strategic plans
  const pendingMessages = messageQueue.filter(m => !m.processed && m.type === "request");
  
  if (pendingMessages.length === 0) {
    return { data: "No pending tasks" };
  }
  
  const result = await orchestratorInvoke({
    messages: [
      {
        role: "system",
        content: "You are Athena, the strategic planning daemon. Create action plans for pending requests.",
      },
      {
        role: "user",
        content: `Pending requests:\n${JSON.stringify(pendingMessages, null, 2)}\n\nCreate prioritized action plan.`,
      },
    ],
    model: state.config.model,
    enableThinking: state.config.thinkingEnabled,
    thinkingBudget: state.config.thinkingBudget,
    maxTokens: 3000,
  });
  
  return {
    tokens: result.usage?.total_tokens,
    data: result.choices[0]?.message?.content,
  };
}

/**
 * Hermes - Communication
 */
async function executeHermesTask(state: DaemonState): Promise<any> {
  // Process message queue
  const unprocessed = messageQueue.filter(m => !m.processed);
  
  for (const msg of unprocessed.slice(0, 5)) {
    msg.processed = true;
    
    // Route message to target daemon
    if (msg.to !== "broadcast") {
      const targetState = daemonStates.get(msg.to);
      if (targetState) {
        console.log(`[Hermes] Routed message from ${msg.from} to ${msg.to}`);
      }
    }
  }
  
  return { data: { processed: unprocessed.length } };
}

/**
 * Hephaestus - Building
 */
async function executeHephaestusTask(state: DaemonState): Promise<any> {
  // Check for pending build tasks
  const buildRequests = messageQueue.filter(
    m => !m.processed && m.to === "hephaestus" && m.type === "request"
  );
  
  if (buildRequests.length === 0) {
    return { data: "No build tasks" };
  }
  
  const request = buildRequests[0];
  request.processed = true;
  
  const result = await TaskHandlers.generateCode(
    request.payload.description || "Create a sample function",
    request.payload.language || "typescript"
  );
  
  return { data: { code: result } };
}

/**
 * Apollo - Creativity
 */
async function executeApolloTask(state: DaemonState): Promise<any> {
  // Generate creative content
  const result = await orchestratorInvoke({
    messages: [
      {
        role: "system",
        content: "You are Apollo, the creative daemon. Generate innovative ideas and content.",
      },
      {
        role: "user",
        content: "Generate a creative insight or idea for improving the ALE system.",
      },
    ],
    model: state.config.model,
    enableThinking: state.config.thinkingEnabled,
    thinkingBudget: state.config.thinkingBudget,
    maxTokens: 1000,
  });
  
  return {
    tokens: result.usage?.total_tokens,
    data: result.choices[0]?.message?.content,
  };
}

/**
 * Artemis - Monitoring
 */
async function executeArtemisTask(state: DaemonState): Promise<any> {
  // Monitor system health
  const stats = getOrchestratorStats();
  const memUsage = process.memoryUsage();
  
  const healthReport = {
    timestamp: Date.now(),
    activeRequests: stats.activeRequests,
    totalRequests: stats.totalRequests,
    memory: {
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
      rss: Math.round(memUsage.rss / 1024 / 1024),
    },
    daemons: Array.from(daemonStates.entries()).map(([id, s]) => ({
      id,
      status: s.status,
      errorRate: s.runCount > 0 ? (s.errorCount / s.runCount * 100).toFixed(1) + "%" : "0%",
    })),
  };
  
  // Alert if issues detected
  if (memUsage.heapUsed > memUsage.heapTotal * 0.9) {
    broadcastMessage("artemis", "event", { type: "alert", message: "High memory usage detected" });
  }
  
  return { data: healthReport };
}

/**
 * Ares - Security
 */
async function executeAresTask(state: DaemonState): Promise<any> {
  // Security scan
  const result = await orchestratorInvoke({
    messages: [
      {
        role: "system",
        content: "You are Ares, the security daemon. Analyze for potential security issues.",
      },
      {
        role: "user",
        content: "Perform a brief security assessment of the current system state. List any potential concerns.",
      },
    ],
    model: state.config.model,
    enableThinking: state.config.thinkingEnabled,
    thinkingBudget: state.config.thinkingBudget,
    maxTokens: 2000,
  });
  
  return {
    tokens: result.usage?.total_tokens,
    data: result.choices[0]?.message?.content,
  };
}

/**
 * Dionysus - Chaos testing
 */
async function executeDionysusTask(state: DaemonState): Promise<any> {
  // Generate chaos test scenarios
  const result = await orchestratorInvoke({
    messages: [
      {
        role: "system",
        content: "You are Dionysus, the chaos daemon. Generate edge case scenarios to test system resilience.",
      },
      {
        role: "user",
        content: "Generate 3 creative edge case scenarios that could stress test the ALE system.",
      },
    ],
    model: state.config.model,
    enableThinking: state.config.thinkingEnabled,
    thinkingBudget: state.config.thinkingBudget,
    maxTokens: 1500,
  });
  
  return {
    tokens: result.usage?.total_tokens,
    data: result.choices[0]?.message?.content,
  };
}

/**
 * Hades - Persistence
 */
async function executeHadesTask(state: DaemonState): Promise<any> {
  // Persist important data
  const snapshot = {
    timestamp: Date.now(),
    daemonStates: Array.from(daemonStates.entries()).map(([id, s]) => ({
      id,
      runCount: s.runCount,
      successCount: s.successCount,
      errorCount: s.errorCount,
      metrics: s.metrics,
    })),
    eventCount: daemonEvents.length,
    messageCount: messageQueue.length,
  };
  
  // Save snapshot to file
  try {
    await createFile(
      `data/snapshots/daemon_snapshot_${Date.now()}.json`,
      JSON.stringify(snapshot, null, 2),
      { overwrite: true }
    );
  } catch {
    // Ignore file errors
  }
  
  return { data: snapshot };
}

/**
 * Log daemon event
 */
function logEvent(daemon: DaemonType, event: DaemonEvent["event"], message: string, data?: any): void {
  const daemonEvent: DaemonEvent = {
    timestamp: Date.now(),
    daemon,
    event,
    message,
    data,
  };
  
  daemonEvents.push(daemonEvent);
  
  // Keep only last 1000 events
  if (daemonEvents.length > 1000) {
    daemonEvents.splice(0, daemonEvents.length - 1000);
  }
  
  console.log(`[${daemon.toUpperCase()}] ${event}: ${message}`);
}

/**
 * Send message between daemons
 */
export function sendMessage(from: DaemonType, to: DaemonType | "broadcast", type: DaemonMessage["type"], payload: any): string {
  const id = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const message: DaemonMessage = {
    id,
    from,
    to,
    type,
    payload,
    timestamp: Date.now(),
    processed: false,
  };
  
  messageQueue.push(message);
  
  // Keep only last 500 messages
  if (messageQueue.length > 500) {
    messageQueue.splice(0, messageQueue.length - 500);
  }
  
  return id;
}

/**
 * Broadcast message to all daemons
 */
export function broadcastMessage(from: DaemonType, type: DaemonMessage["type"], payload: any): string {
  return sendMessage(from, "broadcast", type, payload);
}

/**
 * Get daemon state
 */
export function getDaemonState(id: DaemonType): DaemonState | undefined {
  return daemonStates.get(id);
}

/**
 * Get all daemon states
 */
export function getAllDaemonStates(): Map<DaemonType, DaemonState> {
  return new Map(daemonStates);
}

/**
 * Get daemon events
 */
export function getDaemonEvents(limit: number = 100): DaemonEvent[] {
  return daemonEvents.slice(-limit);
}

/**
 * Get message queue
 */
export function getMessageQueue(): DaemonMessage[] {
  return [...messageQueue];
}

/**
 * Update daemon config
 */
export function updateDaemonConfig(id: DaemonType, updates: Partial<DaemonConfig>): boolean {
  const state = daemonStates.get(id);
  if (!state) {
    return false;
  }
  
  state.config = { ...state.config, ...updates };
  
  // Restart if running to apply new config
  if (state.status === "running") {
    stopDaemon(id);
    startDaemon(id);
  }
  
  return true;
}

/**
 * Get system status
 */
export function getSystemStatus(): {
  isRunning: boolean;
  daemons: Array<{ id: DaemonType; status: DaemonStatus; runCount: number; errorCount: number }>;
  events: number;
  messages: number;
} {
  return {
    isRunning: isSystemRunning,
    daemons: Array.from(daemonStates.entries()).map(([id, state]) => ({
      id,
      status: state.status,
      runCount: state.runCount,
      errorCount: state.errorCount,
    })),
    events: daemonEvents.length,
    messages: messageQueue.length,
  };
}

// Export types
export type { DaemonType, DaemonStatus, DaemonConfig, DaemonState, DaemonEvent, DaemonMessage };
