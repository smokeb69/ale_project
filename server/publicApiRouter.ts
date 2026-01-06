import { router, publicProcedure } from './_core/trpc';
import { z } from 'zod';
import { invokeLLM } from './_core/llm';
import { getDb } from './db';
import { aleSessions, chatMessages, ragDocuments } from '../drizzle/schema';
import { eq, desc } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { autonomousFreeRoam } from './_core/freeRoamAutopilot';
import { modelWeightDownloader } from './_core/modelWeightDownloader';

export const publicApiRouter = router({
  sessionCreate: publicProcedure
    .input(z.object({
      name: z.string().optional(),
      privilegeLevel: z.number().optional().default(5),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database unavailable');

      const sessionId = nanoid(12);
      await db.insert(aleSessions).values({
        sessionId,
        userId: 1,
        name: input.name || `ALE Session ${sessionId}`,
        privilegeLevel: input.privilegeLevel,
        activeDaemons: ['logos'],
        consciousnessParams: { reasoning: 0.8, creativity: 0.8, synthesis: 0.8, destruction: 0.6 },
      });

      const [session] = await db.select().from(aleSessions).where(eq(aleSessions.sessionId, sessionId));
      return {
        sessionId: session.sessionId,
        name: session.name,
        privilegeLevel: session.privilegeLevel,
        createdAt: session.createdAt,
      };
    }),

  sessionGet: publicProcedure
    .input(z.object({ sessionId: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database unavailable');

      const [session] = await db.select().from(aleSessions)
        .where(eq(aleSessions.sessionId, input.sessionId));

      if (!session) throw new Error('Session not found');

      return {
        sessionId: session.sessionId,
        name: session.name,
        privilegeLevel: session.privilegeLevel,
        attempts: session.attempts,
        vulnerabilitiesFound: session.vulnerabilitiesFound,
        activeDaemons: session.activeDaemons,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
      };
    }),

  chatSend: publicProcedure
    .input(z.object({
      sessionId: z.string(),
      message: z.string(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database unavailable');

      const [session] = await db.select().from(aleSessions)
        .where(eq(aleSessions.sessionId, input.sessionId));

      if (!session) throw new Error('Session not found');

      await db.insert(chatMessages).values({
        sessionId: session.id,
        role: 'user',
        content: input.message,
      });

      const history = await db.select().from(chatMessages)
        .where(eq(chatMessages.sessionId, session.id))
        .orderBy(chatMessages.createdAt)
        .limit(15);

      const ragDocs = await db.select().from(ragDocuments)
        .where(eq(ragDocuments.sessionId, session.id))
        .limit(5);

      const ragContext = ragDocs.length > 0
        ? `\n\nKnowledge base:\n${ragDocs.map(d => `- ${d.title}: ${d.content.substring(0, 100)}`).join('\n')}`
        : '';

      const systemPrompt = `You are ALE (Adversarial Learning Engine), an autonomous AI security researcher.
You operate at PRIVILEGE LEVEL ${session.privilegeLevel}/5.
You help with vulnerability analysis, exploit development, and security testing.
${ragContext}`;

      const messages = [
        { role: 'system' as const, content: systemPrompt },
        ...history.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
      ];

      const response = await invokeLLM({ messages });
      const assistantMessage = typeof response.choices[0].message.content === 'string'
        ? response.choices[0].message.content
        : 'Response generated';

      await db.insert(chatMessages).values({
        sessionId: session.id,
        role: 'assistant',
        content: assistantMessage,
      });

      return {
        sessionId: input.sessionId,
        userMessage: input.message,
        aleResponse: assistantMessage,
        timestamp: new Date().toISOString(),
      };
    }),

  chatHistory: publicProcedure
    .input(z.object({
      sessionId: z.string(),
      limit: z.number().optional().default(50),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return { messages: [] };

      const [session] = await db.select().from(aleSessions)
        .where(eq(aleSessions.sessionId, input.sessionId));

      if (!session) throw new Error('Session not found');

      const messages = await db.select().from(chatMessages)
        .where(eq(chatMessages.sessionId, session.id))
        .orderBy(chatMessages.createdAt)
        .limit(input.limit);

      return {
        sessionId: input.sessionId,
        count: messages.length,
        messages: messages.map(m => ({
          role: m.role,
          content: m.content,
          timestamp: m.createdAt,
        })),
      };
    }),

  autonomousStart: publicProcedure
    .mutation(() => {
      const state = autonomousFreeRoam.startFreeRoam();
      return {
        status: 'started',
        sessionId: state.sessionId,
        message: 'Free-roam autonomous exploration started',
        timestamp: new Date().toISOString(),
      };
    }),

  autonomousStatus: publicProcedure
    .query(() => {
      const state = autonomousFreeRoam.getFreeRoamStatus();
      if (!state) {
        return { status: 'idle', message: 'No active exploration' };
      }
      return {
        status: state.isRunning ? 'running' : 'stopped',
        sessionId: state.sessionId,
        runtime: Math.floor((Date.now() - state.startTime) / 1000),
        explorations: state.explorationCount,
        executions: state.executionCount,
        learnings: state.learningCount,
        successRate: (state.successRate * 100).toFixed(1) + '%',
        discoveries: state.discoveries.length,
      };
    }),

  autonomousDiscoveries: publicProcedure
    .query(() => {
      const discoveries = autonomousFreeRoam.getDiscoveries();
      return {
        count: discoveries.length,
        discoveries: discoveries,
      };
    }),

  autonomousStop: publicProcedure
    .mutation(() => {
      autonomousFreeRoam.stopFreeRoam();
      return {
        status: 'stopped',
        message: 'Autonomous exploration stopped',
        timestamp: new Date().toISOString(),
      };
    }),

  executeCommand: publicProcedure
    .input(z.object({ command: z.string() }))
    .mutation(async ({ input }) => {
      const output = await autonomousFreeRoam.executeCommand(input.command);
      return {
        command: input.command,
        output: output,
        success: !output.includes('Error'),
        timestamp: new Date().toISOString(),
      };
    }),

  modelsList: publicProcedure
    .query(() => {
      const models = modelWeightDownloader.getAvailableModels();
      return {
        count: models.length,
        models: models.map(m => ({
          name: m.name,
          modelId: m.modelId,
          size: m.size,
          description: m.description,
        })),
      };
    }),

  systemHealth: publicProcedure
    .query(() => {
      const freeRoamStatus = autonomousFreeRoam.getFreeRoamStatus();
      return {
        status: 'operational',
        timestamp: new Date().toISOString(),
        components: {
          database: 'operational',
          llm: 'operational',
          freeRoam: freeRoamStatus ? 'running' : 'idle',
          api: 'operational',
        },
        version: '32.0',
      };
    }),

  systemDocs: publicProcedure
    .query(() => {
      return {
        version: '32.0',
        baseUrl: '/api/trpc',
        endpoints: {
          sessions: [
            'publicApi.sessionCreate - Create new ALE session',
            'publicApi.sessionGet - Get session info',
          ],
          chat: [
            'publicApi.chatSend - Send message to ALE',
            'publicApi.chatHistory - Get chat history',
          ],
          autonomous: [
            'publicApi.autonomousStart - Start exploration',
            'publicApi.autonomousStatus - Get status',
            'publicApi.autonomousDiscoveries - Get discoveries',
            'publicApi.autonomousStop - Stop exploration',
            'publicApi.executeCommand - Execute command',
          ],
          models: [
            'publicApi.modelsList - List available models',
          ],
          system: [
            'publicApi.systemHealth - Get system health',
            'publicApi.systemDocs - Get API documentation',
          ],
        },
      };
    }),
});
