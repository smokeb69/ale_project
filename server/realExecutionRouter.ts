import { router, publicProcedure } from './_core/trpc';
import { z } from 'zod';
import { realFileSystem } from './_core/realFileSystem';
import { modelChaining } from './_core/modelChaining';
import { fixedAutonomousAutopilot } from './_core/autopilotEngineFixed';

export const realExecutionRouter = router({
  // Real File System
  files: router({
    // Create a real file
    create: publicProcedure
      .input(z.object({
        filename: z.string(),
        content: z.string(),
        location: z.enum(['project', 'web', 'system']).default('project'),
        executable: z.boolean().default(false),
      }))
      .mutation(({ input }) => {
        return realFileSystem.createFile(
          input.filename,
          input.content,
          input.location,
          input.executable
        );
      }),

    // Execute a real file
    execute: publicProcedure
      .input(z.object({
        filePath: z.string(),
        args: z.array(z.string()).optional(),
      }))
      .mutation(async ({ input }) => {
        return realFileSystem.executeFile(input.filePath, input.args);
      }),

    // Execute command directly
    executeCommand: publicProcedure
      .input(z.object({ command: z.string() }))
      .mutation(({ input }) => {
        return realFileSystem.executeCommand(input.command);
      }),

    // Create and execute Python
    executePython: publicProcedure
      .input(z.object({
        scriptName: z.string(),
        code: z.string(),
        location: z.enum(['project', 'web', 'system']).default('project'),
      }))
      .mutation(async ({ input }) => {
        return realFileSystem.createAndExecutePython(
          input.scriptName,
          input.code,
          input.location
        );
      }),

    // Create and execute Bash
    executeBash: publicProcedure
      .input(z.object({
        scriptName: z.string(),
        code: z.string(),
        location: z.enum(['project', 'web', 'system']).default('project'),
      }))
      .mutation(async ({ input }) => {
        return realFileSystem.createAndExecuteBash(
          input.scriptName,
          input.code,
          input.location
        );
      }),

    // Read file
    read: publicProcedure
      .input(z.object({ filePath: z.string() }))
      .query(({ input }) => {
        const content = realFileSystem.readFile(input.filePath);
        return { content, success: content !== null };
      }),

    // List files
    list: publicProcedure
      .input(z.object({ dirPath: z.string() }))
      .query(({ input }) => {
        return realFileSystem.listFiles(input.dirPath);
      }),

    // Get file info
    info: publicProcedure
      .input(z.object({ filePath: z.string() }))
      .query(({ input }) => {
        return realFileSystem.getFileInfo(input.filePath);
      }),
  }),

  // Model Chaining
  models: router({
    // List available models
    list: publicProcedure
      .query(() => {
        return modelChaining.listModels();
      }),

    // Get model info
    getInfo: publicProcedure
      .input(z.object({ modelId: z.string() }))
      .query(({ input }) => {
        return modelChaining.getModelInfo(input.modelId);
      }),

    // Invoke single model
    invoke: publicProcedure
      .input(z.object({
        modelId: z.string(),
        prompt: z.string(),
        systemPrompt: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const output = await modelChaining.invokeModel(
          input.modelId,
          input.prompt,
          input.systemPrompt
        );
        return { output };
      }),

    // Chain models
    chain: publicProcedure
      .input(z.object({
        tasks: z.array(z.object({
          modelId: z.string(),
          prompt: z.string(),
          systemPrompt: z.string().optional(),
        })),
        passOutput: z.boolean().default(true),
      }))
      .mutation(async ({ input }) => {
        return modelChaining.chainModels(input.tasks, input.passOutput);
      }),

    // Generate exploit chain
    generateExploit: publicProcedure
      .input(z.object({
        target: z.string(),
        vulnerability: z.string(),
      }))
      .mutation(async ({ input }) => {
        return modelChaining.generateExploitChain(input.target, input.vulnerability);
      }),

    // Generate privilege escalation chain
    generatePrivEsc: publicProcedure
      .input(z.object({
        currentLevel: z.number(),
        targetLevel: z.number(),
      }))
      .mutation(async ({ input }) => {
        return modelChaining.generatePrivEscChain(input.currentLevel, input.targetLevel);
      }),

    // Get chain result
    getChain: publicProcedure
      .input(z.object({ chainId: z.string() }))
      .query(({ input }) => {
        return modelChaining.getChainResult(input.chainId);
      }),
  }),

  // Fixed Autopilot
  autopilot: router({
    // Start autopilot with real execution
    start: publicProcedure
      .input(z.object({
        targetProfiles: z.array(z.string()),
        maxIterations: z.number().optional().default(0),
      }))
      .mutation(({ input }) => {
        const session = fixedAutonomousAutopilot.startAutopilot(
          input.targetProfiles,
          input.maxIterations
        );
        return {
          sessionId: session.id,
          status: session.status,
          startTime: session.startTime,
        };
      }),

    // Get session status
    getStatus: publicProcedure
      .input(z.object({ sessionId: z.string() }))
      .query(({ input }) => {
        return fixedAutonomousAutopilot.getSessionStatus(input.sessionId);
      }),

    // Get iteration output
    getIterationOutput: publicProcedure
      .input(z.object({ iterationId: z.string() }))
      .query(({ input }) => {
        return fixedAutonomousAutopilot.getIterationOutput(input.iterationId);
      }),

    // Get all session outputs
    getOutputs: publicProcedure
      .input(z.object({ sessionId: z.string() }))
      .query(({ input }) => {
        return fixedAutonomousAutopilot.getSessionOutputs(input.sessionId);
      }),

    // Stop autopilot
    stop: publicProcedure
      .input(z.object({ sessionId: z.string() }))
      .mutation(({ input }) => {
        fixedAutonomousAutopilot.stopAutopilot(input.sessionId);
        return { success: true };
      }),
  }),
});
