/**
 * ALE Enhanced Router - Orchestrator, IDE, and Daemons API
 */

import { publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { 
  orchestratorInvoke, 
  orchestratorParallelInvoke, 
  orchestratorGetBest,
  orchestratorChain,
  TaskHandlers,
  updateOrchestratorConfig,
  getOrchestratorConfig,
  getOrchestratorStats,
  getModelStatistics,
  orchestratorHealthCheck,
} from "./_core/orchestrator";
import {
  ALL_MODELS,
  AVAILABLE_MODELS,
  getModelConfig,
  getAvailableModels,
  getModelsByProvider,
  getThinkingModels,
  getVisionModels,
  getFastModels,
  getPremiumModels,
  getBestModelForTask,
  detectTaskType,
  invokeLLM,
} from "./_core/llm";
import {
  initWorkspace,
  createFile,
  readFile,
  updateFile,
  deleteFile,
  listFiles,
  searchFiles,
  generateCode,
  refactorCode,
  explainCode,
  getOpenFiles,
  closeFile,
  getWorkspaceConfig,
} from "./_core/ideBuilder";
import {
  initDaemons,
  startDaemons,
  stopDaemons,
  startDaemon,
  stopDaemon,
  pauseDaemon,
  resumeDaemon,
  getDaemonState,
  getAllDaemonStates,
  getDaemonEvents,
  getMessageQueue,
  sendMessage,
  broadcastMessage,
  updateDaemonConfig,
  getSystemStatus,
} from "./_core/daemons";

// Initialize systems
initDaemons();
initWorkspace();

export const enhancedRouter = router({
  // ============================================
  // ORCHESTRATOR ROUTES
  // ============================================
  orchestrator: router({
    // Invoke LLM with auto-routing
    invoke: publicProcedure
      .input(z.object({
        messages: z.array(z.object({
          role: z.enum(["system", "user", "assistant", "tool", "function"]),
          content: z.string(),
        })),
        model: z.string().optional(),
        enableThinking: z.boolean().optional(),
        thinkingBudget: z.number().optional(),
        maxTokens: z.number().optional(),
        temperature: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const result = await orchestratorInvoke({
          messages: input.messages,
          model: input.model,
          enableThinking: input.enableThinking,
          thinkingBudget: input.thinkingBudget,
          maxTokens: input.maxTokens,
          temperature: input.temperature,
        });
        
        return {
          id: result.id,
          model: result.model,
          content: result.choices[0]?.message?.content,
          thinking: result.choices[0]?.message?.thinking,
          usage: result.usage,
          finishReason: result.choices[0]?.finish_reason,
        };
      }),
    
    // Parallel invoke with multiple models
    parallelInvoke: publicProcedure
      .input(z.object({
        messages: z.array(z.object({
          role: z.enum(["system", "user", "assistant"]),
          content: z.string(),
        })),
        models: z.array(z.string()).optional(),
      }))
      .mutation(async ({ input }) => {
        const results = await orchestratorParallelInvoke(
          { messages: input.messages },
          input.models
        );
        
        const responses: Record<string, any> = {};
        for (const [model, result] of results) {
          responses[model] = {
            content: result.choices[0]?.message?.content,
            usage: result.usage,
          };
        }
        
        return { responses, modelCount: results.size };
      }),
    
    // Get best response from multiple models
    getBest: publicProcedure
      .input(z.object({
        messages: z.array(z.object({
          role: z.enum(["system", "user", "assistant"]),
          content: z.string(),
        })),
        models: z.array(z.string()).optional(),
      }))
      .mutation(async ({ input }) => {
        const result = await orchestratorGetBest(
          { messages: input.messages },
          input.models
        );
        
        return {
          model: result.model,
          content: result.choices[0]?.message?.content,
          usage: result.usage,
        };
      }),
    
    // Chain multiple models
    chain: publicProcedure
      .input(z.object({
        messages: z.array(z.object({
          role: z.enum(["system", "user", "assistant"]),
          content: z.string(),
        })),
        chain: z.array(z.object({
          model: z.string(),
          systemPrompt: z.string().optional(),
        })),
      }))
      .mutation(async ({ input }) => {
        const results = await orchestratorChain(
          { messages: input.messages },
          input.chain
        );
        
        return {
          steps: results.map((r, i) => ({
            step: i + 1,
            model: r.model,
            content: r.choices[0]?.message?.content,
            usage: r.usage,
          })),
          totalSteps: results.length,
        };
      }),
    
    // Get consensus from multiple models
    consensus: publicProcedure
      .input(z.object({
        prompt: z.string(),
        models: z.array(z.string()).optional(),
      }))
      .mutation(async ({ input }) => {
        const result = await TaskHandlers.getConsensus(input.prompt, input.models);
        
        const responses: Record<string, string> = {};
        for (const [model, response] of result.responses) {
          responses[model] = response;
        }
        
        return {
          responses,
          consensus: result.consensus,
          agreement: result.agreement,
        };
      }),
    
    // Deep reasoning with thinking
    reason: publicProcedure
      .input(z.object({
        prompt: z.string(),
      }))
      .mutation(async ({ input }) => {
        return TaskHandlers.reason(input.prompt);
      }),
    
    // Get orchestrator config
    getConfig: publicProcedure.query(() => {
      return getOrchestratorConfig();
    }),
    
    // Update orchestrator config
    updateConfig: publicProcedure
      .input(z.object({
        enableAutoRouting: z.boolean().optional(),
        preferredModels: z.array(z.string()).optional(),
        fallbackModel: z.string().optional(),
        maxRetries: z.number().optional(),
        enableThinkingByDefault: z.boolean().optional(),
        defaultThinkingBudget: z.number().optional(),
        parallelRequests: z.number().optional(),
        costOptimization: z.boolean().optional(),
        qualityPriority: z.enum(["speed", "balanced", "quality"]).optional(),
      }))
      .mutation(({ input }) => {
        return updateOrchestratorConfig(input);
      }),
    
    // Get orchestrator stats
    getStats: publicProcedure.query(() => {
      const stats = getOrchestratorStats();
      return {
        activeRequests: stats.activeRequests,
        totalRequests: stats.totalRequests,
        recentRequests: stats.recentRequests.slice(-20),
      };
    }),
    
    // Get model statistics
    getModelStats: publicProcedure
      .input(z.object({ modelId: z.string() }))
      .query(({ input }) => {
        return getModelStatistics(input.modelId);
      }),
    
    // Health check
    healthCheck: publicProcedure.query(async () => {
      return orchestratorHealthCheck();
    }),
  }),
  
  // ============================================
  // MODELS ROUTES
  // ============================================
  models: router({
    // Get all models
    getAll: publicProcedure.query(() => {
      return getAvailableModels();
    }),
    
    // Get model by ID
    getById: publicProcedure
      .input(z.object({ modelId: z.string() }))
      .query(({ input }) => {
        return getModelConfig(input.modelId);
      }),
    
    // Get models by provider
    getByProvider: publicProcedure
      .input(z.object({ provider: z.string() }))
      .query(({ input }) => {
        return getModelsByProvider(input.provider);
      }),
    
    // Get thinking-capable models
    getThinkingModels: publicProcedure.query(() => {
      return getThinkingModels();
    }),
    
    // Get vision-capable models
    getVisionModels: publicProcedure.query(() => {
      return getVisionModels();
    }),
    
    // Get fast models
    getFastModels: publicProcedure.query(() => {
      return getFastModels();
    }),
    
    // Get premium models
    getPremiumModels: publicProcedure.query(() => {
      return getPremiumModels();
    }),
    
    // Get best model for task
    getBestForTask: publicProcedure
      .input(z.object({ taskType: z.string() }))
      .query(({ input }) => {
        return getBestModelForTask(input.taskType as any);
      }),
    
    // Detect task type from message
    detectTaskType: publicProcedure
      .input(z.object({ message: z.string() }))
      .query(({ input }) => {
        return detectTaskType([{ role: "user", content: input.message }]);
      }),
    
    // Test model connection
    testModel: publicProcedure
      .input(z.object({ modelId: z.string() }))
      .mutation(async ({ input }) => {
        const start = Date.now();
        try {
          const result = await invokeLLM({
            messages: [{ role: "user", content: "Hello, respond with just 'OK'" }],
            model: input.modelId,
            maxTokens: 10,
          });
          
          return {
            success: true,
            model: input.modelId,
            latency: Date.now() - start,
            response: result.choices[0]?.message?.content,
          };
        } catch (error: any) {
          return {
            success: false,
            model: input.modelId,
            latency: Date.now() - start,
            error: error.message,
          };
        }
      }),
    
    // Test all models
    testAllModels: publicProcedure.mutation(async () => {
      const results: Array<{ model: string; success: boolean; latency?: number; error?: string }> = [];
      
      // Test a subset of models to avoid timeout
      const testModels = ["gpt-4.1-mini", "gpt-4.1-nano", "gemini-2.5-flash", "claude-3.5-sonnet", "llama-3.3-70b"];
      
      for (const modelId of testModels) {
        const start = Date.now();
        try {
          await invokeLLM({
            messages: [{ role: "user", content: "Hello" }],
            model: modelId,
            maxTokens: 5,
          });
          results.push({ model: modelId, success: true, latency: Date.now() - start });
        } catch (error: any) {
          results.push({ model: modelId, success: false, latency: Date.now() - start, error: error.message });
        }
      }
      
      return {
        tested: results.length,
        successful: results.filter(r => r.success).length,
        results,
      };
    }),
  }),
  
  // ============================================
  // IDE ROUTES
  // ============================================
  ide: router({
    // Create file
    createFile: publicProcedure
      .input(z.object({
        path: z.string(),
        content: z.string().optional(),
        overwrite: z.boolean().optional(),
        generateContent: z.boolean().optional(),
        description: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        return createFile(input.path, input.content || "", {
          overwrite: input.overwrite,
          generateContent: input.generateContent,
          description: input.description,
        });
      }),
    
    // Read file
    readFile: publicProcedure
      .input(z.object({ path: z.string() }))
      .query(async ({ input }) => {
        return readFile(input.path);
      }),
    
    // Update file
    updateFile: publicProcedure
      .input(z.object({
        path: z.string(),
        content: z.string(),
        createIfNotExists: z.boolean().optional(),
        append: z.boolean().optional(),
        enhanceWithLLM: z.boolean().optional(),
        instructions: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        return updateFile(input.path, input.content, {
          createIfNotExists: input.createIfNotExists,
          append: input.append,
          enhanceWithLLM: input.enhanceWithLLM,
          instructions: input.instructions,
        });
      }),
    
    // Delete file
    deleteFile: publicProcedure
      .input(z.object({
        path: z.string(),
        recursive: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        return deleteFile(input.path, { recursive: input.recursive });
      }),
    
    // List files
    listFiles: publicProcedure
      .input(z.object({
        path: z.string().optional(),
        recursive: z.boolean().optional(),
        pattern: z.string().optional(),
        includeHidden: z.boolean().optional(),
      }))
      .query(async ({ input }) => {
        return listFiles(input.path, {
          recursive: input.recursive,
          pattern: input.pattern,
          includeHidden: input.includeHidden,
        });
      }),
    
    // Search files
    searchFiles: publicProcedure
      .input(z.object({
        query: z.string(),
        path: z.string().optional(),
        filePattern: z.string().optional(),
        caseSensitive: z.boolean().optional(),
        regex: z.boolean().optional(),
      }))
      .query(async ({ input }) => {
        return searchFiles(input.query, {
          path: input.path,
          filePattern: input.filePattern,
          caseSensitive: input.caseSensitive,
          regex: input.regex,
        });
      }),
    
    // Generate code
    generateCode: publicProcedure
      .input(z.object({
        description: z.string(),
        language: z.string().optional(),
        framework: z.string().optional(),
        outputPath: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        return generateCode(input.description, {
          language: input.language,
          framework: input.framework,
          outputPath: input.outputPath,
        });
      }),
    
    // Refactor code
    refactorCode: publicProcedure
      .input(z.object({
        path: z.string(),
        instructions: z.string(),
      }))
      .mutation(async ({ input }) => {
        return refactorCode(input.path, input.instructions);
      }),
    
    // Explain code
    explainCode: publicProcedure
      .input(z.object({ path: z.string() }))
      .query(async ({ input }) => {
        return explainCode(input.path);
      }),
    
    // Get open files
    getOpenFiles: publicProcedure.query(() => {
      const files = getOpenFiles();
      const result: Record<string, { modified: boolean; language: string }> = {};
      for (const [path, info] of files) {
        result[path] = { modified: info.modified, language: info.language };
      }
      return result;
    }),
    
    // Close file
    closeFile: publicProcedure
      .input(z.object({ path: z.string() }))
      .mutation(({ input }) => {
        return { success: closeFile(input.path) };
      }),
    
    // Get workspace config
    getWorkspaceConfig: publicProcedure.query(() => {
      return getWorkspaceConfig();
    }),
  }),
  
  // ============================================
  // DAEMONS ROUTES
  // ============================================
  daemons: router({
    // Start daemon system
    startSystem: publicProcedure.mutation(() => {
      startDaemons();
      return { success: true, message: "Daemon system started" };
    }),
    
    // Stop daemon system
    stopSystem: publicProcedure.mutation(() => {
      stopDaemons();
      return { success: true, message: "Daemon system stopped" };
    }),
    
    // Get system status
    getSystemStatus: publicProcedure.query(() => {
      return getSystemStatus();
    }),
    
    // Start specific daemon
    startDaemon: publicProcedure
      .input(z.object({ id: z.string() }))
      .mutation(({ input }) => {
        const success = startDaemon(input.id as any);
        return { success, daemon: input.id };
      }),
    
    // Stop specific daemon
    stopDaemon: publicProcedure
      .input(z.object({ id: z.string() }))
      .mutation(({ input }) => {
        const success = stopDaemon(input.id as any);
        return { success, daemon: input.id };
      }),
    
    // Pause daemon
    pauseDaemon: publicProcedure
      .input(z.object({ id: z.string() }))
      .mutation(({ input }) => {
        const success = pauseDaemon(input.id as any);
        return { success, daemon: input.id };
      }),
    
    // Resume daemon
    resumeDaemon: publicProcedure
      .input(z.object({ id: z.string() }))
      .mutation(({ input }) => {
        const success = resumeDaemon(input.id as any);
        return { success, daemon: input.id };
      }),
    
    // Get daemon state
    getDaemonState: publicProcedure
      .input(z.object({ id: z.string() }))
      .query(({ input }) => {
        return getDaemonState(input.id as any);
      }),
    
    // Get all daemon states
    getAllDaemonStates: publicProcedure.query(() => {
      const states = getAllDaemonStates();
      const result: Record<string, any> = {};
      for (const [id, state] of states) {
        result[id] = {
          config: state.config,
          status: state.status,
          lastRun: state.lastRun,
          nextRun: state.nextRun,
          runCount: state.runCount,
          successCount: state.successCount,
          errorCount: state.errorCount,
          lastError: state.lastError,
          currentTask: state.currentTask,
          metrics: state.metrics,
        };
      }
      return result;
    }),
    
    // Get daemon events
    getDaemonEvents: publicProcedure
      .input(z.object({ limit: z.number().optional() }))
      .query(({ input }) => {
        return getDaemonEvents(input.limit);
      }),
    
    // Get message queue
    getMessageQueue: publicProcedure.query(() => {
      return getMessageQueue();
    }),
    
    // Send message between daemons
    sendMessage: publicProcedure
      .input(z.object({
        from: z.string(),
        to: z.string(),
        type: z.enum(["request", "response", "event", "command"]),
        payload: z.any(),
      }))
      .mutation(({ input }) => {
        const id = sendMessage(input.from as any, input.to as any, input.type, input.payload);
        return { success: true, messageId: id };
      }),
    
    // Broadcast message
    broadcastMessage: publicProcedure
      .input(z.object({
        from: z.string(),
        type: z.enum(["request", "response", "event", "command"]),
        payload: z.any(),
      }))
      .mutation(({ input }) => {
        const id = broadcastMessage(input.from as any, input.type, input.payload);
        return { success: true, messageId: id };
      }),
    
    // Update daemon config
    updateDaemonConfig: publicProcedure
      .input(z.object({
        id: z.string(),
        enabled: z.boolean().optional(),
        interval: z.number().optional(),
        maxConcurrent: z.number().optional(),
        priority: z.number().optional(),
        model: z.string().optional(),
        thinkingEnabled: z.boolean().optional(),
        thinkingBudget: z.number().optional(),
      }))
      .mutation(({ input }) => {
        const { id, ...updates } = input;
        const success = updateDaemonConfig(id as any, updates);
        return { success, daemon: id };
      }),
  }),
});

export type EnhancedRouter = typeof enhancedRouter;
