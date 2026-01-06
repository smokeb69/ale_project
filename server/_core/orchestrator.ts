/**
 * ALE Orchestrator - Intelligent Multi-LLM Task Router
 * Manages model selection, task routing, and parallel processing
 */

import { 
  invokeLLM, 
  invokeMultipleLLMs, 
  getBestResponse,
  ALL_MODELS, 
  ModelConfig, 
  TaskType, 
  detectTaskType, 
  getBestModelForTask,
  getModelConfig,
  InvokeParams,
  InvokeResult,
  Message,
  Tool,
  DEFAULT_ORCHESTRATOR_CONFIG,
  OrchestratorConfig,
} from "./llm";
import { ENV } from "./env";

// Orchestrator state
interface OrchestratorState {
  config: OrchestratorConfig;
  activeRequests: Map<string, OrchestratorRequest>;
  requestHistory: OrchestratorRequest[];
  modelStats: Map<string, ModelStats>;
  isRunning: boolean;
}

interface OrchestratorRequest {
  id: string;
  taskType: TaskType;
  model: string;
  status: "pending" | "running" | "completed" | "failed";
  startTime: number;
  endTime?: number;
  tokens?: number;
  cost?: number;
  error?: string;
}

interface ModelStats {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  totalTokens: number;
  totalCost: number;
  averageLatency: number;
  lastUsed: number;
}

// Global orchestrator state
const state: OrchestratorState = {
  config: { ...DEFAULT_ORCHESTRATOR_CONFIG },
  activeRequests: new Map(),
  requestHistory: [],
  modelStats: new Map(),
  isRunning: true,
};

// Initialize model stats
ALL_MODELS.forEach(model => {
  state.modelStats.set(model.id, {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    totalTokens: 0,
    totalCost: 0,
    averageLatency: 0,
    lastUsed: 0,
  });
});

/**
 * Generate unique request ID
 */
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Update model statistics
 */
function updateModelStats(
  modelId: string, 
  success: boolean, 
  tokens: number, 
  latency: number,
  cost: number
): void {
  const stats = state.modelStats.get(modelId);
  if (!stats) return;

  stats.totalRequests++;
  if (success) {
    stats.successfulRequests++;
  } else {
    stats.failedRequests++;
  }
  stats.totalTokens += tokens;
  stats.totalCost += cost;
  stats.averageLatency = (stats.averageLatency * (stats.totalRequests - 1) + latency) / stats.totalRequests;
  stats.lastUsed = Date.now();
}

/**
 * Calculate cost for a request
 */
function calculateCost(modelId: string, inputTokens: number, outputTokens: number): number {
  const config = getModelConfig(modelId);
  if (!config) return 0;
  
  return (inputTokens * config.costPer1kInput / 1000) + (outputTokens * config.costPer1kOutput / 1000);
}

/**
 * Main orchestrator invoke function
 */
export async function orchestratorInvoke(params: InvokeParams): Promise<InvokeResult> {
  const requestId = generateRequestId();
  const taskType = detectTaskType(params.messages);
  const selectedModel = params.model || getBestModelForTask(taskType, state.config);
  
  const request: OrchestratorRequest = {
    id: requestId,
    taskType,
    model: selectedModel,
    status: "pending",
    startTime: Date.now(),
  };
  
  state.activeRequests.set(requestId, request);
  
  console.log(`[Orchestrator] Request ${requestId} started`);
  console.log(`[Orchestrator] Task type: ${taskType}, Model: ${selectedModel}`);
  
  try {
    request.status = "running";
    
    const result = await invokeLLM({
      ...params,
      model: selectedModel,
      enableThinking: state.config.enableThinkingByDefault,
      thinkingBudget: state.config.defaultThinkingBudget,
    });
    
    request.status = "completed";
    request.endTime = Date.now();
    request.tokens = result.usage?.total_tokens || 0;
    request.cost = calculateCost(
      selectedModel,
      result.usage?.prompt_tokens || 0,
      result.usage?.completion_tokens || 0
    );
    
    updateModelStats(
      selectedModel,
      true,
      request.tokens,
      request.endTime - request.startTime,
      request.cost
    );
    
    console.log(`[Orchestrator] Request ${requestId} completed in ${request.endTime - request.startTime}ms`);
    
    return result;
    
  } catch (error: any) {
    request.status = "failed";
    request.endTime = Date.now();
    request.error = error.message;
    
    updateModelStats(
      selectedModel,
      false,
      0,
      request.endTime - request.startTime,
      0
    );
    
    console.error(`[Orchestrator] Request ${requestId} failed:`, error.message);
    
    // Retry with fallback model
    if (selectedModel !== state.config.fallbackModel && state.config.maxRetries > 0) {
      console.log(`[Orchestrator] Retrying with fallback model: ${state.config.fallbackModel}`);
      return orchestratorInvoke({
        ...params,
        model: state.config.fallbackModel,
      });
    }
    
    throw error;
    
  } finally {
    state.activeRequests.delete(requestId);
    state.requestHistory.push(request);
    
    // Keep only last 1000 requests in history
    if (state.requestHistory.length > 1000) {
      state.requestHistory = state.requestHistory.slice(-1000);
    }
  }
}

/**
 * Parallel multi-model invoke
 */
export async function orchestratorParallelInvoke(
  params: InvokeParams,
  models?: string[]
): Promise<Map<string, InvokeResult>> {
  const targetModels = models || state.config.preferredModels;
  
  console.log(`[Orchestrator] Parallel invoke with ${targetModels.length} models`);
  
  return invokeMultipleLLMs(params, targetModels);
}

/**
 * Get best response from multiple models
 */
export async function orchestratorGetBest(
  params: InvokeParams,
  models?: string[]
): Promise<InvokeResult> {
  const targetModels = models || state.config.preferredModels;
  
  console.log(`[Orchestrator] Getting best response from ${targetModels.length} models`);
  
  return getBestResponse(params, targetModels);
}

/**
 * Chain multiple models for complex tasks
 */
export async function orchestratorChain(
  initialParams: InvokeParams,
  chainConfig: Array<{
    model: string;
    systemPrompt?: string;
    processOutput?: (output: string) => string;
  }>
): Promise<InvokeResult[]> {
  const results: InvokeResult[] = [];
  let currentMessages = [...initialParams.messages];
  
  console.log(`[Orchestrator] Starting chain with ${chainConfig.length} steps`);
  
  for (let i = 0; i < chainConfig.length; i++) {
    const step = chainConfig[i];
    
    console.log(`[Orchestrator] Chain step ${i + 1}/${chainConfig.length}: ${step.model}`);
    
    // Add system prompt if specified
    if (step.systemPrompt) {
      currentMessages = [
        { role: "system" as const, content: step.systemPrompt },
        ...currentMessages.filter(m => m.role !== "system"),
      ];
    }
    
    const result = await orchestratorInvoke({
      ...initialParams,
      messages: currentMessages,
      model: step.model,
    });
    
    results.push(result);
    
    // Process output for next step
    let output = typeof result.choices[0]?.message?.content === "string"
      ? result.choices[0].message.content
      : JSON.stringify(result.choices[0]?.message?.content);
    
    if (step.processOutput) {
      output = step.processOutput(output);
    }
    
    // Add assistant response to messages for next step
    currentMessages.push({
      role: "assistant" as const,
      content: output,
    });
  }
  
  console.log(`[Orchestrator] Chain completed with ${results.length} results`);
  
  return results;
}

/**
 * Specialized task handlers
 */
export const TaskHandlers = {
  // Code generation with specialized model
  async generateCode(prompt: string, language: string = "typescript"): Promise<string> {
    const result = await orchestratorInvoke({
      messages: [
        {
          role: "system",
          content: `You are an expert ${language} programmer. Generate clean, efficient, well-documented code. Only output the code, no explanations.`,
        },
        { role: "user", content: prompt },
      ],
      model: getBestModelForTask("coding"),
      enableThinking: true,
      thinkingBudget: 8192,
    });
    
    return typeof result.choices[0]?.message?.content === "string"
      ? result.choices[0].message.content
      : "";
  },
  
  // Deep reasoning with thinking enabled
  async reason(prompt: string): Promise<{ thinking: string; answer: string }> {
    const result = await orchestratorInvoke({
      messages: [
        {
          role: "system",
          content: "You are a deep reasoning AI. Think step by step and provide thorough analysis.",
        },
        { role: "user", content: prompt },
      ],
      model: getBestModelForTask("reasoning"),
      enableThinking: true,
      thinkingBudget: 16384,
    });
    
    const content = result.choices[0]?.message?.content;
    const thinking = result.choices[0]?.message?.thinking || "";
    
    return {
      thinking,
      answer: typeof content === "string" ? content : JSON.stringify(content),
    };
  },
  
  // File operations
  async fileOperation(operation: string, params: any): Promise<any> {
    const result = await orchestratorInvoke({
      messages: [
        {
          role: "system",
          content: `You are a file system assistant. Perform the requested file operation and return the result as JSON.
          
Available operations:
- create: Create a new file with content
- read: Read file contents
- update: Update file contents
- delete: Delete a file
- list: List files in directory

Always respond with valid JSON in this format:
{
  "success": boolean,
  "operation": string,
  "path": string,
  "content": string (optional),
  "error": string (optional)
}`,
        },
        {
          role: "user",
          content: JSON.stringify({ operation, ...params }),
        },
      ],
      model: getBestModelForTask("file-operations"),
      responseFormat: { type: "json_object" },
    });
    
    const content = result.choices[0]?.message?.content;
    return typeof content === "string" ? JSON.parse(content) : content;
  },
  
  // Multi-model consensus
  async getConsensus(prompt: string, models: string[] = ["gpt-4.1-mini", "claude-3.5-sonnet", "gemini-2.5-flash"]): Promise<{
    responses: Map<string, string>;
    consensus: string;
    agreement: number;
  }> {
    const results = await orchestratorParallelInvoke(
      {
        messages: [{ role: "user", content: prompt }],
      },
      models
    );
    
    const responses = new Map<string, string>();
    for (const [model, result] of results) {
      const content = result.choices[0]?.message?.content;
      responses.set(model, typeof content === "string" ? content : JSON.stringify(content));
    }
    
    // Get consensus using another model
    const consensusResult = await orchestratorInvoke({
      messages: [
        {
          role: "system",
          content: "Analyze the following responses from different AI models and provide a consensus answer that combines the best insights from each.",
        },
        {
          role: "user",
          content: Array.from(responses.entries())
            .map(([model, response]) => `${model}:\n${response}`)
            .join("\n\n---\n\n"),
        },
      ],
      model: "gpt-4o",
    });
    
    const consensus = typeof consensusResult.choices[0]?.message?.content === "string"
      ? consensusResult.choices[0].message.content
      : "";
    
    // Calculate simple agreement score (placeholder)
    const agreement = 0.85;
    
    return { responses, consensus, agreement };
  },
};

/**
 * Configuration management
 */
export function updateOrchestratorConfig(updates: Partial<OrchestratorConfig>): OrchestratorConfig {
  state.config = { ...state.config, ...updates };
  console.log("[Orchestrator] Config updated:", state.config);
  return state.config;
}

export function getOrchestratorConfig(): OrchestratorConfig {
  return { ...state.config };
}

/**
 * Statistics and monitoring
 */
export function getOrchestratorStats(): {
  activeRequests: number;
  totalRequests: number;
  modelStats: Map<string, ModelStats>;
  recentRequests: OrchestratorRequest[];
} {
  return {
    activeRequests: state.activeRequests.size,
    totalRequests: state.requestHistory.length,
    modelStats: new Map(state.modelStats),
    recentRequests: state.requestHistory.slice(-100),
  };
}

export function getModelStatistics(modelId: string): ModelStats | undefined {
  return state.modelStats.get(modelId);
}

/**
 * Health check
 */
export async function orchestratorHealthCheck(): Promise<{
  status: "healthy" | "degraded" | "unhealthy";
  models: Array<{ id: string; status: "ok" | "error"; latency?: number }>;
}> {
  const testModels = ["gpt-4.1-mini", "claude-3.5-sonnet", "gemini-2.5-flash"];
  const results: Array<{ id: string; status: "ok" | "error"; latency?: number }> = [];
  
  for (const modelId of testModels) {
    const start = Date.now();
    try {
      await invokeLLM({
        messages: [{ role: "user", content: "Hello" }],
        model: modelId,
        maxTokens: 10,
      });
      results.push({ id: modelId, status: "ok", latency: Date.now() - start });
    } catch {
      results.push({ id: modelId, status: "error" });
    }
  }
  
  const okCount = results.filter(r => r.status === "ok").length;
  const status = okCount === testModels.length ? "healthy" : okCount > 0 ? "degraded" : "unhealthy";
  
  return { status, models: results };
}

// Export for use in routers
export {
  state as orchestratorState,
  OrchestratorState,
  OrchestratorRequest,
  ModelStats,
};
