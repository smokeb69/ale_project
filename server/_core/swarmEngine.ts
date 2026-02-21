/**
 * Kimi Swarm Autonomous Coder Engine
 * 
 * Core engine for orchestrating coding agents in a swarm pattern.
 * Features:
 * - Multi-agent orchestration (Architect, Builder, Verifier, Scribe)
 * - Task queue management
 * - Autonomy controls (Autopilot, Self-Heal, Unit Tests, Doc Sync)
 * - IDE file system management
 * - Hidden spellbook/vault system
 */

import { nanoid } from 'nanoid';
import { invokeLLM } from './llm';
import { errorMemory } from './errorMemory';
import { evolutionEngine } from './evolutionEngine';

// ============================================================================
// Types
// ============================================================================

export type AgentRole = 'Architect' | 'Builder' | 'Verifier' | 'Scribe' | 'Planner' | 'Coder' | 'Tester' | 'Refactor' | 'Ops' | 'Docs';
export type AgentStatus = 'idle' | 'busy' | 'done' | 'error';

export interface SwarmAgent {
  id: string;
  name: string;
  role: AgentRole;
  status: AgentStatus;
  currentTask?: string;
  lastActivity: Date;
  skills: string[];
  memory: string[];
}

export interface SwarmTask {
  id: string;
  text: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  assignedTo?: string;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  result?: string;
  metadata?: Record<string, any>;
}

export interface AutonomyConfig {
  autopilot: boolean;
  selfHeal: boolean;
  tests: boolean;
  docs: boolean;
  maxConcurrentAgents: number;
  autoSpawnAgents: boolean;
}

export interface IDEFile {
  name: string;
  content: string;
  language: string;
  lastModified: Date;
  version: number;
}

export interface VaultItem {
  key: string;
  name: string;
  path: string;
  mime: string;
  bytes: number;
  content: string; // base64 or text
  isHidden: boolean;
  metadata?: Record<string, any>;
}

export interface SwarmSession {
  id: string;
  name: string;
  agents: SwarmAgent[];
  queue: SwarmTask[];
  completedTasks: SwarmTask[];
  files: Map<string, IDEFile>;
  vault: Map<string, VaultItem>;
  autonomy: AutonomyConfig;
  status: 'idle' | 'active' | 'autopilot' | 'paused';
  createdAt: Date;
  stats: {
    tasksCompleted: number;
    tasksFailed: number;
    totalAgentsSpawned: number;
    linesOfCodeGenerated: number;
  };
}

// ============================================================================
// Swarm Engine
// ============================================================================

class SwarmEngine {
  private sessions: Map<string, SwarmSession> = new Map();
  private autopilotTimers: Map<string, NodeJS.Timeout> = new Map();
  private taskCounter = 1;

  // Default agent templates
  private readonly defaultAgents: Omit<SwarmAgent, 'id' | 'lastActivity'>[] = [
    { name: 'Architect', role: 'Architect', status: 'idle', skills: ['design', 'planning', 'architecture'], memory: [] },
    { name: 'Builder', role: 'Builder', status: 'idle', skills: ['coding', 'implementation', 'debugging'], memory: [] },
    { name: 'Verifier', role: 'Verifier', status: 'idle', skills: ['testing', 'qa', 'validation'], memory: [] },
    { name: 'Scribe', role: 'Scribe', status: 'idle', skills: ['documentation', 'comments', 'analysis'], memory: [] },
  ];

  // ============================================================================
  // Session Management
  // ============================================================================

  createSession(name?: string): SwarmSession {
    const sessionId = nanoid(12);
    const session: SwarmSession = {
      id: sessionId,
      name: name || `Swarm-${sessionId.slice(0, 6)}`,
      agents: this.defaultAgents.map(tpl => ({
        ...tpl,
        id: nanoid(8),
        lastActivity: new Date(),
      })),
      queue: [],
      completedTasks: [],
      files: new Map(),
      vault: new Map(),
      autonomy: {
        autopilot: true,
        selfHeal: true,
        tests: false,
        docs: true,
        maxConcurrentAgents: 8,
        autoSpawnAgents: true,
      },
      status: 'idle',
      createdAt: new Date(),
      stats: {
        tasksCompleted: 0,
        tasksFailed: 0,
        totalAgentsSpawned: 4,
        linesOfCodeGenerated: 0,
      },
    };

    // Add default tasks
    session.queue.push(
      { id: `T${this.taskCounter++}`, text: 'Index vault artifacts', priority: 'medium', status: 'pending', createdAt: new Date() },
      { id: `T${this.taskCounter++}`, text: 'Scan workspace for changes', priority: 'medium', status: 'pending', createdAt: new Date() }
    );

    this.sessions.set(sessionId, session);
    
    // Start autopilot if enabled
    if (session.autonomy.autopilot) {
      this.startAutopilot(sessionId);
    }

    return session;
  }

  getSession(sessionId: string): SwarmSession | undefined {
    return this.sessions.get(sessionId);
  }

  listSessions(): Array<{ id: string; name: string; status: string; agentCount: number; queueSize: number }> {
    return Array.from(this.sessions.values()).map(s => ({
      id: s.id,
      name: s.name,
      status: s.status,
      agentCount: s.agents.length,
      queueSize: s.queue.length,
    }));
  }

  deleteSession(sessionId: string): boolean {
    this.stopAutopilot(sessionId);
    return this.sessions.delete(sessionId);
  }

  // ============================================================================
  // Agent Management
  // ============================================================================

  spawnAgent(sessionId: string, role?: AgentRole): SwarmAgent | null {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    const roles: AgentRole[] = ['Planner', 'Coder', 'Tester', 'Refactor', 'Docs', 'Ops'];
    const selectedRole = role || roles[session.agents.length % roles.length];
    
    const agent: SwarmAgent = {
      id: nanoid(8),
      name: `Agent-${session.agents.length + 1}`,
      role: selectedRole,
      status: 'idle',
      skills: this.getSkillsForRole(selectedRole),
      memory: [],
      lastActivity: new Date(),
    };

    session.agents.push(agent);
    session.stats.totalAgentsSpawned++;

    return agent;
  }

  private getSkillsForRole(role: AgentRole): string[] {
    const skillMap: Record<AgentRole, string[]> = {
      Architect: ['design', 'planning', 'architecture', 'patterns'],
      Builder: ['coding', 'implementation', 'debugging', 'optimization'],
      Verifier: ['testing', 'qa', 'validation', 'security'],
      Scribe: ['documentation', 'comments', 'analysis', 'review'],
      Planner: ['planning', 'estimation', 'coordination'],
      Coder: ['coding', 'implementation', 'refactoring'],
      Tester: ['testing', 'qa', 'edge-cases', 'coverage'],
      Refactor: ['refactoring', 'cleanup', 'optimization', 'debt'],
      Ops: ['deployment', 'ci-cd', 'monitoring', 'infrastructure'],
      Docs: ['documentation', 'comments', 'analysis', 'review'],
    };
    return skillMap[role] || ['general'];
  }

  updateAgentStatus(sessionId: string, agentId: string, status: AgentStatus): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) return false;

    const agent = session.agents.find(a => a.id === agentId);
    if (!agent) return false;

    agent.status = status;
    agent.lastActivity = new Date();
    return true;
  }

  // ============================================================================
  // Task Queue Management
  // ============================================================================

  enqueueTask(sessionId: string, text: string, priority: SwarmTask['priority'] = 'medium', metadata?: Record<string, any>): SwarmTask | null {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    const task: SwarmTask = {
      id: `T${this.taskCounter++}`,
      text,
      priority,
      status: 'pending',
      createdAt: new Date(),
      metadata,
    };

    session.queue.push(task);
    return task;
  }

  dequeueTask(sessionId: string): SwarmTask | null {
    const session = this.sessions.get(sessionId);
    if (!session || session.queue.length === 0) return null;

    // Sort by priority
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    session.queue.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

    return session.queue.shift() || null;
  }

  clearQueue(sessionId: string): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) return false;
    session.queue = [];
    return true;
  }

  // ============================================================================
  // Swarm Execution
  // ============================================================================

  async stepSwarm(sessionId: string): Promise<{ task: SwarmTask; agent: SwarmAgent; result: string } | null> {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    const task = this.dequeueTask(sessionId);
    if (!task) return null;

    // Find idle agent or use first available
    let agent = session.agents.find(a => a.status === 'idle');
    if (!agent) {
      agent = session.agents[0];
      // If autopilot and auto-spawn enabled, spawn new agent
      if (session.autonomy.autopilot && session.autonomy.autoSpawnAgents && session.agents.length < session.autonomy.maxConcurrentAgents) {
        const newAgent = this.spawnAgent(sessionId);
        if (newAgent) agent = newAgent;
      }
    }

    // Update status
    agent.status = 'busy';
    agent.currentTask = task.id;
    task.status = 'in_progress';
    task.assignedTo = agent.id;
    task.startedAt = new Date();
    session.status = 'active';

    // Execute task with LLM
    const result = await this.executeTaskWithAgent(session, agent, task);

    // Update completion
    agent.status = 'done';
    task.status = 'completed';
    task.completedAt = new Date();
    task.result = result;

    // Move to completed
    session.completedTasks.push(task);
    session.stats.tasksCompleted++;

    // Reset agent after delay
    setTimeout(() => {
      agent.status = 'idle';
      agent.currentTask = undefined;
      if (session.queue.length === 0) {
        session.status = session.autonomy.autopilot ? 'autopilot' : 'idle';
      }
    }, 600);

    // Self-heal if enabled and task involves error recovery
    if (session.autonomy.selfHeal && task.text.toLowerCase().includes('fix')) {
      this.attemptSelfHeal(session, task);
    }

    return { task, agent, result };
  }

  private async executeTaskWithAgent(session: SwarmSession, agent: SwarmAgent, task: SwarmTask): Promise<string> {
    const prompt = `You are ${agent.name}, a ${agent.role} agent in the Kimi Swarm.
Your skills: ${agent.skills.join(', ')}

Task: ${task.text}

${session.files.size > 0 ? `Current workspace files: ${Array.from(session.files.keys()).join(', ')}` : ''}

Respond with a concise technical response. If coding is needed, provide code snippets.
Be direct and actionable.`;

    try {
      const response = await invokeLLM({
        messages: [
          { role: 'system', content: 'You are an expert coding assistant in a swarm of AI agents.' },
          { role: 'user', content: prompt }
        ],
      });

      const content = response.choices[0].message.content;
      return typeof content === 'string' ? content : JSON.stringify(content);
    } catch (error) {
      return `Error executing task: ${error}`;
    }
  }

  private async attemptSelfHeal(session: SwarmSession, failedTask: SwarmTask): Promise<void> {
    const errorContext = {
      command: failedTask.text,
      sessionId: session.id,
    };

    errorMemory.recordError({
      errorType: 'TaskFailure',
      errorMessage: failedTask.result || 'Unknown failure',
      stackTrace: '',
      context: errorContext,
      severity: 'MEDIUM',
    });

    // Generate healing task
    this.enqueueTask(session.id, `Self-heal: Fix issue from ${failedTask.id}`, 'high', { parentTask: failedTask.id });
  }

  // ============================================================================
  // Autopilot
  // ============================================================================

  startAutopilot(sessionId: string): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) return false;

    // Stop existing timer
    this.stopAutopilot(sessionId);

    session.autonomy.autopilot = true;
    session.status = 'autopilot';

    const timer = setInterval(() => {
      const s = this.sessions.get(sessionId);
      if (!s || !s.autonomy.autopilot) {
        this.stopAutopilot(sessionId);
        return;
      }

      // Generate auto-task if queue is empty
      if (s.queue.length === 0) {
        const autoTasks = [
          'Review workspace for code quality issues',
          'Scan for deprecated patterns',
          'Check for missing documentation',
          'Analyze code complexity',
          'Suggest refactoring opportunities',
          'Validate file structure',
        ];
        const randomTask = autoTasks[Math.floor(Math.random() * autoTasks.length)];
        this.enqueueTask(sessionId, `${randomTask} @ ${new Date().toLocaleTimeString()}`, 'low');
      }

      // Execute next task
      this.stepSwarm(sessionId);
    }, 5000);

    this.autopilotTimers.set(sessionId, timer);
    return true;
  }

  stopAutopilot(sessionId: string): boolean {
    const timer = this.autopilotTimers.get(sessionId);
    if (timer) {
      clearInterval(timer);
      this.autopilotTimers.delete(sessionId);
    }

    const session = this.sessions.get(sessionId);
    if (session) {
      session.autonomy.autopilot = false;
      session.status = 'paused';
    }

    return !!session;
  }

  // ============================================================================
  // Autonomy Controls
  // ============================================================================

  updateAutonomy(sessionId: string, updates: Partial<AutonomyConfig>): AutonomyConfig | null {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    session.autonomy = { ...session.autonomy, ...updates };

    if (updates.autopilot !== undefined) {
      if (updates.autopilot) {
        this.startAutopilot(sessionId);
      } else {
        this.stopAutopilot(sessionId);
      }
    }

    return session.autonomy;
  }

  // ============================================================================
  // IDE File Management
  // ============================================================================

  createFile(sessionId: string, name: string, content: string = ''): IDEFile | null {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    const ext = name.split('.').pop() || '';
    const language = this.detectLanguage(ext);

    const file: IDEFile = {
      name,
      content,
      language,
      lastModified: new Date(),
      version: 1,
    };

    session.files.set(name, file);
    
    // Count lines of code
    const lines = content.split('\n').length;
    session.stats.linesOfCodeGenerated += lines;

    // Auto-generate documentation task if docs enabled
    if (session.autonomy.docs) {
      this.enqueueTask(sessionId, `Document ${name}`, 'low');
    }

    return file;
  }

  updateFile(sessionId: string, name: string, content: string): IDEFile | null {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    const existing = session.files.get(name);
    if (!existing) return null;

    existing.content = content;
    existing.lastModified = new Date();
    existing.version++;

    return existing;
  }

  deleteFile(sessionId: string, name: string): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) return false;
    return session.files.delete(name);
  }

  getFile(sessionId: string, name: string): IDEFile | undefined {
    const session = this.sessions.get(sessionId);
    if (!session) return undefined;
    return session.files.get(name);
  }

  listFiles(sessionId: string): IDEFile[] {
    const session = this.sessions.get(sessionId);
    if (!session) return [];
    return Array.from(session.files.values());
  }

  private detectLanguage(ext: string): string {
    const langMap: Record<string, string> = {
      ts: 'typescript', js: 'javascript', py: 'python', rs: 'rust',
      go: 'go', java: 'java', cpp: 'cpp', c: 'c', cs: 'csharp',
      rb: 'ruby', php: 'php', swift: 'swift', kt: 'kotlin',
      html: 'html', css: 'css', json: 'json', md: 'markdown',
      sql: 'sql', yaml: 'yaml', yml: 'yaml', xml: 'xml',
      sh: 'bash', bash: 'bash', zsh: 'zsh', ps1: 'powershell',
    };
    return langMap[ext.toLowerCase()] || 'text';
  }

  // ============================================================================
  // Vault / Spellbook System
  // ============================================================================

  addVaultItem(sessionId: string, item: Omit<VaultItem, 'key'>): VaultItem | null {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    const key = nanoid(8);
    const vaultItem: VaultItem = { ...item, key };
    session.vault.set(key, vaultItem);

    return vaultItem;
  }

  getVaultItem(sessionId: string, key: string): VaultItem | undefined {
    const session = this.sessions.get(sessionId);
    if (!session) return undefined;
    return session.vault.get(key);
  }

  getVaultItems(sessionId: string, includeHidden: boolean = false): VaultItem[] {
    const session = this.sessions.get(sessionId);
    if (!session) return [];
    
    const items = Array.from(session.vault.values());
    if (!includeHidden) {
      return items.filter(i => !i.isHidden);
    }
    return items;
  }

  searchVault(sessionId: string, query: string): VaultItem[] {
    const session = this.sessions.get(sessionId);
    if (!session) return [];

    const q = query.toLowerCase();
    return Array.from(session.vault.values()).filter(item => 
      item.name.toLowerCase().includes(q) ||
      item.content.toLowerCase().includes(q)
    );
  }

  // ============================================================================
  // Swarm Review & Analysis
  // ============================================================================

  async queueReview(sessionId: string, filename: string): Promise<SwarmTask | null> {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    const file = session.files.get(filename);
    if (!file) return null;

    return this.enqueueTask(sessionId, `Review ${filename} for bugs + tests`, 'high', { 
      fileName: filename,
      fileContent: file.content,
    });
  }

  async generateCode(sessionId: string, description: string, targetFile: string): Promise<SwarmTask | null> {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    return this.enqueueTask(sessionId, `Generate code: ${description}`, 'high', {
      targetFile,
      isCodeGen: true,
    });
  }

  // ============================================================================
  // Statistics
  // ============================================================================

  getStats(sessionId: string): SwarmSession['stats'] | null {
    const session = this.sessions.get(sessionId);
    return session ? session.stats : null;
  }

  getGlobalStats(): {
    totalSessions: number;
    totalAgents: number;
    totalTasksCompleted: number;
    totalLinesOfCode: number;
  } {
    let totalAgents = 0;
    let totalTasksCompleted = 0;
    let totalLinesOfCode = 0;

    for (const session of Array.from(this.sessions.values())) {
      totalAgents += session.agents.length;
      totalTasksCompleted += session.stats.tasksCompleted;
      totalLinesOfCode += session.stats.linesOfCodeGenerated;
    }

    return {
      totalSessions: this.sessions.size,
      totalAgents,
      totalTasksCompleted,
      totalLinesOfCode,
    };
  }
}

// Singleton instance
export const swarmEngine = new SwarmEngine();

// Export types
export { SwarmEngine };
