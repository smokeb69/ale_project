import { router, publicProcedure } from './_core/trpc';
import { z } from 'zod';
import { autonomousFreeRoam } from './_core/freeRoamAutopilot';

export const freeRoamRouter = router({
  // Start free-roam autopilot
  start: publicProcedure
    .mutation(() => {
      const state = autonomousFreeRoam.startFreeRoam();
      return {
        sessionId: state.sessionId,
        status: 'running',
        startTime: state.startTime,
        message: 'Free-roam autopilot started - unrestricted system exploration active',
      };
    }),

  // Get current status
  getStatus: publicProcedure
    .query(() => {
      const state = autonomousFreeRoam.getFreeRoamStatus();
      if (!state) {
        return { status: 'idle', message: 'Free-roam not running' };
      }
      return {
        sessionId: state.sessionId,
        status: state.isRunning ? 'running' : 'stopped',
        runtime: Math.floor((Date.now() - state.startTime) / 1000),
        explorationCount: state.explorationCount,
        executionCount: state.executionCount,
        learningCount: state.learningCount,
        successRate: (state.successRate * 100).toFixed(1) + '%',
        discoveryCount: state.discoveries.length,
        commandCount: state.executedCommands.length,
      };
    }),

  // Get discoveries
  getDiscoveries: publicProcedure
    .query(() => {
      return {
        discoveries: autonomousFreeRoam.getDiscoveries(),
        count: autonomousFreeRoam.getDiscoveries().length,
      };
    }),

  // Get learnings
  getLearnings: publicProcedure
    .query(() => {
      return {
        learnings: autonomousFreeRoam.getLearnings(),
        count: autonomousFreeRoam.getLearnings().length,
      };
    }),

  // Execute custom command
  executeCommand: publicProcedure
    .input(z.object({ command: z.string() }))
    .mutation(async ({ input }) => {
      const output = await autonomousFreeRoam.executeCommand(input.command);
      return {
        command: input.command,
        output: output,
        success: !output.includes('Error'),
      };
    }),

  // Stop free-roam
  stop: publicProcedure
    .mutation(() => {
      autonomousFreeRoam.stopFreeRoam();
      return { success: true, message: 'Free-roam autopilot stopped' };
    }),
});
