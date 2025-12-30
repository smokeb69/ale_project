import { router, publicProcedure } from './_core/trpc';
import { z } from 'zod';
import { autonomousAutopilot } from './_core/autopilotEngine';

export const autopilotRouter = router({
  // Session Management
  session: router({
    // Start autopilot
    start: publicProcedure
      .input(z.object({
        targetProfiles: z.array(z.string()),
        strategyId: z.string().optional().default('balanced'),
        maxIterations: z.number().optional().default(1000),
      }))
      .mutation(({ input }) => {
        const session = autonomousAutopilot.startAutopilot(
          input.targetProfiles,
          input.strategyId,
          input.maxIterations
        );
        
        return {
          sessionId: session.id,
          status: session.status,
          startTime: session.startTime,
          targetProfiles: session.targetProfiles,
        };
      }),

    // Get session status
    getStatus: publicProcedure
      .input(z.object({ sessionId: z.string() }))
      .query(({ input }) => {
        const session = autonomousAutopilot.getSessionStatus(input.sessionId);
        return session || { error: 'Session not found' };
      }),

    // Pause autopilot
    pause: publicProcedure
      .input(z.object({ sessionId: z.string() }))
      .mutation(({ input }) => {
        autonomousAutopilot.pauseAutopilot(input.sessionId);
        return { success: true };
      }),

    // Resume autopilot
    resume: publicProcedure
      .input(z.object({ sessionId: z.string() }))
      .mutation(({ input }) => {
        autonomousAutopilot.resumeAutopilot(input.sessionId);
        return { success: true };
      }),

    // Stop autopilot
    stop: publicProcedure
      .input(z.object({ sessionId: z.string() }))
      .mutation(({ input }) => {
        autonomousAutopilot.stopAutopilot(input.sessionId);
        return { success: true };
      }),

    // List active sessions
    listActive: publicProcedure
      .query(() => {
        const sessions = autonomousAutopilot.getActiveSessions();
        return {
          count: sessions.length,
          sessions: sessions.map(s => ({
            id: s.id,
            status: s.status,
            iterations: s.iterations,
            chainsDiscovered: s.chainsDiscovered,
            successRate: s.averageSuccessRate,
          })),
        };
      }),
  }),

  // Iteration History
  history: router({
    // Get iteration history
    getIterations: publicProcedure
      .input(z.object({
        sessionId: z.string(),
        limit: z.number().optional().default(50),
      }))
      .query(({ input }) => {
        const iterations = autonomousAutopilot.getIterationHistory(input.sessionId, input.limit);
        return {
          count: iterations.length,
          iterations: iterations.map(i => ({
            id: i.id,
            iterationNumber: i.iterationNumber,
            timestamp: i.timestamp,
            chainsTestedThisIteration: i.chainsTestedThisIteration,
            mutationsTestedThisIteration: i.mutationsTestedThisIteration,
            successfulDiscoveries: i.successfulDiscoveries,
            failureRate: i.failureRate,
            insights: i.insights,
          })),
        };
      }),
  }),

  // Statistics
  stats: router({
    // Get autopilot statistics
    getStats: publicProcedure
      .query(() => {
        return autonomousAutopilot.getAutopilotStats();
      }),
  }),
});
