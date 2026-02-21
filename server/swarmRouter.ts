/**
 * Kimi Swarm Autonomous Coder Router
 * 
 * tRPC router exposing swarm orchestration, IDE, and vault capabilities.
 */

import { router, publicProcedure } from './_core/trpc';
import { z } from 'zod';
import { swarmEngine, AgentRole, AutonomyConfig } from './_core/swarmEngine';

export const swarmRouter = router({
  // ============================================================================
  // Session Management
  // ============================================================================
  
  session: router({
    // Create a new swarm session
    create: publicProcedure
      .input(z.object({
        name: z.string().optional(),
      }).optional())
      .mutation(({ input }) => {
        const session = swarmEngine.createSession(input?.name);
        return {
          id: session.id,
          name: session.name,
          status: session.status,
          createdAt: session.createdAt,
          agentCount: session.agents.length,
          queueSize: session.queue.length,
        };
      }),

    // Get session details
    get: publicProcedure
      .input(z.object({ sessionId: z.string() }))
      .query(({ input }) => {
        const session = swarmEngine.getSession(input.sessionId);
        if (!session) return { error: 'Session not found' };
        
        return {
          id: session.id,
          name: session.name,
          status: session.status,
          createdAt: session.createdAt,
          agents: session.agents.map(a => ({
            id: a.id,
            name: a.name,
            role: a.role,
            status: a.status,
            currentTask: a.currentTask,
            skills: a.skills,
          })),
          queue: session.queue.map(t => ({
            id: t.id,
            text: t.text,
            priority: t.priority,
            status: t.status,
          })),
          autonomy: session.autonomy,
          stats: session.stats,
        };
      }),

    // List all sessions
    list: publicProcedure
      .query(() => {
        return swarmEngine.listSessions();
      }),

    // Delete a session
    delete: publicProcedure
      .input(z.object({ sessionId: z.string() }))
      .mutation(({ input }) => {
        const success = swarmEngine.deleteSession(input.sessionId);
        return { success };
      }),
  }),

  // ============================================================================
  // Agent Management
  // ============================================================================

  agents: router({
    // Spawn a new agent
    spawn: publicProcedure
      .input(z.object({
        sessionId: z.string(),
        role: z.enum(['Architect', 'Builder', 'Verifier', 'Scribe', 'Planner', 'Coder', 'Tester', 'Refactor', 'Ops']).optional(),
      }))
      .mutation(({ input }) => {
        const agent = swarmEngine.spawnAgent(input.sessionId, input.role);
        if (!agent) return { error: 'Session not found' };
        
        return {
          id: agent.id,
          name: agent.name,
          role: agent.role,
          status: agent.status,
          skills: agent.skills,
        };
      }),

    // Get all agents in a session
    list: publicProcedure
      .input(z.object({ sessionId: z.string() }))
      .query(({ input }) => {
        const session = swarmEngine.getSession(input.sessionId);
        if (!session) return { error: 'Session not found' };
        
        return session.agents.map(a => ({
          id: a.id,
          name: a.name,
          role: a.role,
          status: a.status,
          currentTask: a.currentTask,
          lastActivity: a.lastActivity,
        }));
      }),
  }),

  // ============================================================================
  // Task Queue Management
  // ============================================================================

  tasks: router({
    // Add a task to the queue
    enqueue: publicProcedure
      .input(z.object({
        sessionId: z.string(),
        text: z.string(),
        priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        metadata: z.any().optional(),
      }))
      .mutation(({ input }) => {
        const task = swarmEngine.enqueueTask(input.sessionId, input.text, input.priority, input.metadata);
        if (!task) return { error: 'Session not found' };
        
        return {
          id: task.id,
          text: task.text,
          priority: task.priority,
          status: task.status,
          createdAt: task.createdAt,
        };
      }),

    // Get queue
    list: publicProcedure
      .input(z.object({ sessionId: z.string() }))
      .query(({ input }) => {
        const session = swarmEngine.getSession(input.sessionId);
        if (!session) return { error: 'Session not found' };
        
        return session.queue.map(t => ({
          id: t.id,
          text: t.text,
          priority: t.priority,
          status: t.status,
        }));
      }),

    // Clear queue
    clear: publicProcedure
      .input(z.object({ sessionId: z.string() }))
      .mutation(({ input }) => {
        const success = swarmEngine.clearQueue(input.sessionId);
        return { success };
      }),

    // Execute one step of the swarm
    step: publicProcedure
      .input(z.object({ sessionId: z.string() }))
      .mutation(async ({ input }) => {
        // @ts-ignore - stepSwarm may not return the expected type in all cases
        const result = await swarmEngine.stepSwarm(input.sessionId);
        if (!result) return { error: 'No tasks to execute' };
        
        return {
          task: {
            id: result.task.id,
            text: result.task.text,
            status: result.task.status,
          },
          agent: {
            id: result.agent.id,
            name: result.agent.name,
            role: result.agent.role,
          },
          result: result.result.slice(0, 1000), // Limit result size
        };
      }),
  }),

  // ============================================================================
  // Autonomy Controls
  // ============================================================================

  autonomy: router({
    // Get current autonomy config
    get: publicProcedure
      .input(z.object({ sessionId: z.string() }))
      .query(({ input }) => {
        const session = swarmEngine.getSession(input.sessionId);
        if (!session) return { error: 'Session not found' };
        return session.autonomy;
      }),

    // Update autonomy config
    update: publicProcedure
      .input(z.object({
        sessionId: z.string(),
        autopilot: z.boolean().optional(),
        selfHeal: z.boolean().optional(),
        tests: z.boolean().optional(),
        docs: z.boolean().optional(),
        maxConcurrentAgents: z.number().optional(),
        autoSpawnAgents: z.boolean().optional(),
      }))
      .mutation(({ input }) => {
        const { sessionId, ...updates } = input;
        const config = swarmEngine.updateAutonomy(sessionId, updates);
        if (!config) return { error: 'Session not found' };
        return config;
      }),

    // Start autopilot
    startAutopilot: publicProcedure
      .input(z.object({ sessionId: z.string() }))
      .mutation(({ input }) => {
        const success = swarmEngine.startAutopilot(input.sessionId);
        return { success };
      }),

    // Stop autopilot
    stopAutopilot: publicProcedure
      .input(z.object({ sessionId: z.string() }))
      .mutation(({ input }) => {
        const success = swarmEngine.stopAutopilot(input.sessionId);
        return { success };
      }),
  }),

  // ============================================================================
  // IDE File Management
  // ============================================================================

  files: router({
    // Create a new file
    create: publicProcedure
      .input(z.object({
        sessionId: z.string(),
        name: z.string(),
        content: z.string().default(''),
      }))
      .mutation(({ input }) => {
        const file = swarmEngine.createFile(input.sessionId, input.name, input.content);
        if (!file) return { error: 'Session not found' };
        
        return {
          name: file.name,
          language: file.language,
          lastModified: file.lastModified,
          version: file.version,
        };
      }),

    // Update file content
    update: publicProcedure
      .input(z.object({
        sessionId: z.string(),
        name: z.string(),
        content: z.string(),
      }))
      .mutation(({ input }) => {
        const file = swarmEngine.updateFile(input.sessionId, input.name, input.content);
        if (!file) return { error: 'File not found' };
        
        return {
          name: file.name,
          language: file.language,
          lastModified: file.lastModified,
          version: file.version,
        };
      }),

    // Delete a file
    delete: publicProcedure
      .input(z.object({
        sessionId: z.string(),
        name: z.string(),
      }))
      .mutation(({ input }) => {
        const success = swarmEngine.deleteFile(input.sessionId, input.name);
        return { success };
      }),

    // Get file content
    get: publicProcedure
      .input(z.object({
        sessionId: z.string(),
        name: z.string(),
      }))
      .query(({ input }) => {
        const file = swarmEngine.getFile(input.sessionId, input.name);
        if (!file) return { error: 'File not found' };
        
        return {
          name: file.name,
          content: file.content,
          language: file.language,
          lastModified: file.lastModified,
          version: file.version,
        };
      }),

    // List all files
    list: publicProcedure
      .input(z.object({ sessionId: z.string() }))
      .query(({ input }) => {
        const files = swarmEngine.listFiles(input.sessionId);
        return files.map(f => ({
          name: f.name,
          language: f.language,
          lastModified: f.lastModified,
          version: f.version,
        }));
      }),

    // Queue swarm review for a file
    review: publicProcedure
      .input(z.object({
        sessionId: z.string(),
        filename: z.string(),
      }))
      .mutation(async ({ input }) => {
        const task = await swarmEngine.queueReview(input.sessionId, input.filename);
        if (!task) return { error: 'File not found' };
        
        return {
          taskId: task.id,
          text: task.text,
        };
      }),
  }),

  // ============================================================================
  // Vault / Spellbook System
  // ============================================================================

  vault: router({
    // Add item to vault
    add: publicProcedure
      .input(z.object({
        sessionId: z.string(),
        name: z.string(),
        path: z.string(),
        mime: z.string(),
        content: z.string(), // base64 or text
        isHidden: z.boolean().default(false),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        metadata: z.any().optional(),
      }))
      .mutation(({ input }) => {
        const { sessionId, ...itemData } = input;
        const item = swarmEngine.addVaultItem(sessionId, {
          ...itemData,
          bytes: Buffer.byteLength(itemData.content, 'utf8'),
        });
        if (!item) return { error: 'Session not found' };
        
        return {
          key: item.key,
          name: item.name,
          bytes: item.bytes,
        };
      }),

    // Get vault items
    list: publicProcedure
      .input(z.object({
        sessionId: z.string(),
        includeHidden: z.boolean().default(false),
      }))
      .query(({ input }) => {
        const items = swarmEngine.getVaultItems(input.sessionId, input.includeHidden);
        return items.map(i => ({
          key: i.key,
          name: i.name,
          path: i.path,
          mime: i.mime,
          bytes: i.bytes,
          isHidden: i.isHidden,
        }));
      }),

    // Get single vault item
    get: publicProcedure
      .input(z.object({
        sessionId: z.string(),
        key: z.string(),
      }))
      .query(({ input }) => {
        const item = swarmEngine.getVaultItem(input.sessionId, input.key);
        if (!item) return { error: 'Item not found' };
        
        return {
          key: item.key,
          name: item.name,
          path: item.path,
          mime: item.mime,
          content: item.content.slice(0, 10000), // Limit content size
          bytes: item.bytes,
          isHidden: item.isHidden,
        };
      }),

    // Search vault
    search: publicProcedure
      .input(z.object({
        sessionId: z.string(),
        query: z.string(),
      }))
      .query(({ input }) => {
        const items = swarmEngine.searchVault(input.sessionId, input.query);
        return items.map(i => ({
          key: i.key,
          name: i.name,
          path: i.path,
          mime: i.mime,
          bytes: i.bytes,
        }));
      }),
  }),

  // ============================================================================
  // Code Generation
  // ============================================================================

  codegen: router({
    // Generate code from description
    generate: publicProcedure
      .input(z.object({
        sessionId: z.string(),
        description: z.string(),
        targetFile: z.string(),
      }))
      .mutation(async ({ input }) => {
        // @ts-ignore - generateCode may not return the expected type in all cases
        const task = await swarmEngine.generateCode(input.sessionId, input.description, input.targetFile);
        if (!task) return { error: 'Session not found' };
        
        return {
          taskId: task.id,
          text: task.text,
          status: task.status,
        };
      }),
  }),

  // ============================================================================
  // Statistics
  // ============================================================================

  stats: router({
    // Get session stats
    get: publicProcedure
      .input(z.object({ sessionId: z.string() }))
      .query(({ input }) => {
        const stats = swarmEngine.getStats(input.sessionId);
        if (!stats) return { error: 'Session not found' };
        return stats;
      }),

    // Get global stats
    global: publicProcedure
      .query(() => {
        return swarmEngine.getGlobalStats();
      }),
  }),
});
