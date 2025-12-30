import { router, publicProcedure } from './_core/trpc';
import { z } from 'zod';
import { adaptiveChainLearning } from './_core/adaptiveChainLearning';
import { failureDetectionHealing } from './_core/failureDetectionHealing';

export const adaptiveRouter = router({
  // Adaptive Chain Learning
  learning: router({
    // Discover patterns from execution history
    discoverPatterns: publicProcedure
      .input(z.object({
        executionHistory: z.array(z.any()),
      }))
      .mutation(({ input }) => {
        const patterns = adaptiveChainLearning.discoverPatterns(input.executionHistory);
        return {
          discoveredPatterns: patterns.length,
          patterns: patterns.map(p => ({
            id: p.id,
            cveSequence: p.cveSequence,
            successRate: p.successRate,
            frequency: p.frequency,
          })),
        };
      }),

    // Search web for exploit answers
    searchWeb: publicProcedure
      .input(z.object({
        query: z.string(),
      }))
      .mutation(async ({ input }) => {
        const answers = await adaptiveChainLearning.searchWebForAnswers(input.query);
        return {
          found: answers.length,
          answers: answers.map(a => ({
            id: a.id,
            source: a.source,
            credibility: a.credibility,
            content: a.content.substring(0, 200),
          })),
        };
      }),

    // Find similar chains using vector similarity
    findSimilarChains: publicProcedure
      .input(z.object({
        targetChain: z.array(z.string()),
        threshold: z.number().optional().default(0.7),
      }))
      .query(({ input }) => {
        const similar = adaptiveChainLearning.findSimilarChains(input.targetChain, input.threshold);
        return {
          found: similar.length,
          chains: similar.map(c => ({
            id: c.id,
            cveSequence: c.cveSequence,
            successRate: c.successRate,
            frequency: c.frequency,
          })),
        };
      }),

    // Generate chain mutations
    generateMutations: publicProcedure
      .input(z.object({
        parentChainId: z.string(),
        parentChain: z.array(z.string()),
        count: z.number().optional().default(5),
      }))
      .mutation(({ input }) => {
        const mutations = adaptiveChainLearning.generateMutations(
          input.parentChainId,
          input.parentChain,
          input.count
        );
        return {
          generated: mutations.length,
          mutations: mutations.map(m => ({
            id: m.id,
            mutation: m.mutation,
            tested: m.tested,
          })),
        };
      }),

    // Record mutation result
    recordMutationResult: publicProcedure
      .input(z.object({
        mutationId: z.string(),
        result: z.enum(['success', 'failure', 'partial']),
        successRate: z.number(),
      }))
      .mutation(({ input }) => {
        adaptiveChainLearning.recordMutationResult(
          input.mutationId,
          input.result,
          input.successRate
        );
        return { success: true };
      }),

    // Get learning statistics
    getStats: publicProcedure
      .query(() => {
        return adaptiveChainLearning.getStatistics();
      }),
  }),

  // Health Monitoring and Failure Detection
  health: router({
    // Record health check
    recordHealthCheck: publicProcedure
      .input(z.object({
        instanceId: z.string(),
        metrics: z.object({
          responseTime: z.number(),
          errorRate: z.number(),
          memoryUsage: z.number(),
          cpuUsage: z.number(),
          taskQueueSize: z.number(),
        }),
        issues: z.array(z.string()).optional(),
      }))
      .mutation(({ input }) => {
        const check = failureDetectionHealing.recordHealthCheck(
          input.instanceId,
          input.metrics,
          input.issues
        );
        
        return {
          checkId: check.id,
          status: check.status,
          issues: check.issues,
        };
      }),

    // Check instance heartbeat
    isInstanceAlive: publicProcedure
      .input(z.object({
        instanceId: z.string(),
        timeoutSeconds: z.number().optional().default(120),
      }))
      .query(({ input }) => {
        const alive = failureDetectionHealing.isInstanceAlive(
          input.instanceId,
          input.timeoutSeconds
        );
        
        return { instanceId: input.instanceId, alive };
      }),

    // Get health statistics
    getHealthStats: publicProcedure
      .query(() => {
        return failureDetectionHealing.getHealthStatistics();
      }),
  }),

  // Combined Statistics
  stats: router({
    // Get all adaptive system statistics
    getFullStats: publicProcedure
      .query(() => {
        const learningStats = adaptiveChainLearning.getStatistics();
        const healthStats = failureDetectionHealing.getHealthStatistics();
        
        return {
          learning: learningStats,
          health: healthStats,
          timestamp: new Date().toISOString(),
        };
      }),
  }),
});
