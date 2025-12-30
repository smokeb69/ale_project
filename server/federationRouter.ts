import { router, publicProcedure } from './_core/trpc';
import { z } from 'zod';
import { instanceFederation } from './_core/instanceFederation';
import { exploitationOrchestrator } from './_core/exploitationOrchestrator';
import { distributedCoordinator } from './_core/distributedCoordinator';

export const federationRouter = router({
  // Instance Management
  instance: router({
    // Register new instance
    register: publicProcedure
      .input(z.object({
        name: z.string(),
        url: z.string(),
      }))
      .mutation(({ input }) => {
        const instance = instanceFederation.registerInstance({
          name: input.name,
          url: input.url,
          status: 'inactive',
          learningProgress: 0,
          exploitsDiscovered: 0,
          vulnerabilitiesFound: 0,
          successRate: 0,
          metadata: {},
        });
        
        return {
          id: instance.id,
          name: instance.name,
          status: instance.status,
          createdAt: instance.createdAt,
        };
      }),

    // Get instance
    get: publicProcedure
      .input(z.object({ instanceId: z.string() }))
      .query(({ input }) => {
        const instance = instanceFederation.getInstance(input.instanceId);
        return instance || { error: 'Instance not found' };
      }),

    // Get all instances
    list: publicProcedure
      .query(() => {
        const instances = instanceFederation.getAllInstances();
        return {
          count: instances.length,
          instances: instances.map(i => ({
            id: i.id,
            name: i.name,
            status: i.status,
            learningProgress: i.learningProgress,
            exploitsDiscovered: i.exploitsDiscovered,
            successRate: i.successRate,
            lastActive: i.lastActive,
          })),
        };
      }),

    // Update instance status
    updateStatus: publicProcedure
      .input(z.object({
        instanceId: z.string(),
        status: z.enum(['active', 'inactive', 'learning', 'exploring']),
      }))
      .mutation(({ input }) => {
        instanceFederation.updateInstanceStatus(input.instanceId, input.status);
        return { success: true };
      }),

    // Clone instance
    clone: publicProcedure
      .input(z.object({
        sourceInstanceId: z.string(),
        newName: z.string(),
      }))
      .mutation(({ input }) => {
        const cloned = instanceFederation.cloneInstance(input.sourceInstanceId, input.newName);
        return {
          id: cloned.id,
          name: cloned.name,
          status: cloned.status,
        };
      }),

    // Export instance data
    export: publicProcedure
      .input(z.object({ instanceId: z.string() }))
      .query(({ input }) => {
        const exportPath = instanceFederation.exportInstanceData(input.instanceId);
        return { exportPath, message: 'Instance data exported' };
      }),
  }),

  // Knowledge Sharing
  knowledge: router({
    // Share knowledge between instances
    share: publicProcedure
      .input(z.object({
        sourceInstanceId: z.string(),
        targetInstanceId: z.string(),
        knowledgeType: z.enum(['cve', 'exploit', 'pattern', 'vulnerability']),
        data: z.any(),
      }))
      .mutation(({ input }) => {
        const share = instanceFederation.shareKnowledge(
          input.sourceInstanceId,
          input.targetInstanceId,
          input.knowledgeType,
          input.data
        );
        
        return {
          shareId: share.id,
          status: 'shared',
          timestamp: share.timestamp,
        };
      }),

    // Broadcast knowledge to all instances
    broadcast: publicProcedure
      .input(z.object({
        sourceInstanceId: z.string(),
        knowledgeType: z.enum(['cve', 'exploit', 'pattern', 'vulnerability']),
        data: z.any(),
      }))
      .mutation(({ input }) => {
        const shares = instanceFederation.broadcastKnowledge(
          input.sourceInstanceId,
          input.knowledgeType,
          input.data
        );
        
        return {
          broadcastCount: shares.length,
          status: 'broadcasted',
        };
      }),

    // Get pending knowledge
    getPending: publicProcedure
      .input(z.object({ instanceId: z.string() }))
      .query(({ input }) => {
        const pending = instanceFederation.getPendingKnowledge(input.instanceId);
        return {
          count: pending.length,
          knowledge: pending.map(k => ({
            id: k.id,
            type: k.knowledgeType,
            source: k.sourceInstanceId,
            timestamp: k.timestamp,
          })),
        };
      }),

    // Apply knowledge
    applyKnowledge: publicProcedure
      .input(z.object({ shareId: z.string() }))
      .mutation(({ input }) => {
        instanceFederation.applyKnowledge(input.shareId);
        return { success: true };
      }),
  }),

  // Exploitation Orchestration
  orchestration: router({
    // Create exploit chain
    createChain: publicProcedure
      .input(z.object({
        name: z.string(),
        cveSequence: z.array(z.string()),
        commands: z.array(z.string()),
        targetProfile: z.string(),
        prerequisites: z.array(z.string()).optional(),
      }))
      .mutation(({ input }) => {
        const chain = exploitationOrchestrator.createChain(
          input.name,
          input.cveSequence,
          input.commands,
          input.targetProfile,
          input.prerequisites
        );
        
        return {
          chainId: chain.id,
          name: chain.name,
          successProbability: chain.successProbability,
          estimatedTime: chain.executionTime,
        };
      }),

    // Get chain
    getChain: publicProcedure
      .input(z.object({ chainId: z.string() }))
      .query(({ input }) => {
        const chain = exploitationOrchestrator.getChain(input.chainId);
        return chain || { error: 'Chain not found' };
      }),

    // List all chains
    listChains: publicProcedure
      .query(() => {
        const chains = exploitationOrchestrator.getAllChains();
        return {
          count: chains.length,
          chains: chains.map(c => ({
            id: c.id,
            name: c.name,
            targetProfile: c.targetProfile,
            successProbability: c.successProbability,
            timesSuccessful: c.timesSuccessful,
          })),
        };
      }),

    // Find optimal chain
    findOptimal: publicProcedure
      .input(z.object({
        targetProfile: z.string(),
        vulnerabilities: z.array(z.string()),
      }))
      .query(({ input }) => {
        const chain = exploitationOrchestrator.findOptimalChain(
          input.targetProfile,
          input.vulnerabilities
        );
        
        if (!chain) {
          return { error: 'No suitable chain found' };
        }
        
        return {
          chainId: chain.id,
          name: chain.name,
          successProbability: chain.successProbability,
          estimatedTime: chain.executionTime,
        };
      }),

    // Execute chain
    execute: publicProcedure
      .input(z.object({
        chainId: z.string(),
        targetHost: z.string(),
      }))
      .mutation(async ({ input }) => {
        const execution = await exploitationOrchestrator.executeChain(
          input.chainId,
          input.targetHost
        );
        
        return {
          executionId: execution.id,
          status: execution.status,
          result: execution.result,
          executionTime: execution.executionTime,
        };
      }),

    // Get recommendations
    getRecommendations: publicProcedure
      .input(z.object({
        targetProfile: z.string(),
        vulnerabilities: z.array(z.string()),
      }))
      .query(({ input }) => {
        const recommendations = exploitationOrchestrator.getRecommendations(
          input.targetProfile,
          input.vulnerabilities
        );
        
        return {
          recommendedChains: recommendations.recommendedChains.length,
          estimatedSuccessRate: (recommendations.estimatedSuccessRate * 100).toFixed(1),
          estimatedTime: recommendations.estimatedTime.toFixed(2),
          riskLevel: recommendations.riskLevel,
        };
      }),
  }),

  // Distributed Coordination
  coordination: router({
    // Create exploration task
    createTask: publicProcedure
      .input(z.object({
        targetHost: z.string(),
        taskType: z.enum(['scan', 'exploit', 'enumerate', 'analyze']),
        targetPort: z.number().optional(),
        priority: z.number().optional(),
      }))
      .mutation(({ input }) => {
        const task = distributedCoordinator.createTask(
          input.targetHost,
          input.taskType,
          input.targetPort,
          input.priority
        );
        
        return {
          taskId: task.id,
          status: task.status,
          priority: task.priority,
        };
      }),

    // Get next task
    getNextTask: publicProcedure
      .input(z.object({ instanceId: z.string() }))
      .query(({ input }) => {
        const task = distributedCoordinator.getNextTask(input.instanceId);
        return task || { error: 'No tasks available' };
      }),

    // Complete task
    completeTask: publicProcedure
      .input(z.object({
        taskId: z.string(),
        result: z.any(),
        executionTime: z.number(),
      }))
      .mutation(({ input }) => {
        distributedCoordinator.completeTask(input.taskId, input.result, input.executionTime);
        return { success: true };
      }),

    // Fail task
    failTask: publicProcedure
      .input(z.object({
        taskId: z.string(),
        error: z.string(),
      }))
      .mutation(({ input }) => {
        distributedCoordinator.failTask(input.taskId, input.error);
        return { success: true };
      }),

    // Get queue statistics
    getQueueStats: publicProcedure
      .query(() => {
        return distributedCoordinator.getQueueStatistics();
      }),

    // Get workload
    getWorkload: publicProcedure
      .input(z.object({ instanceId: z.string() }))
      .query(({ input }) => {
        return distributedCoordinator.getInstanceWorkload(input.instanceId);
      }),

    // Get all workloads
    getAllWorkloads: publicProcedure
      .query(() => {
        const workloads = distributedCoordinator.getAllWorkloads();
        return {
          count: workloads.length,
          workloads,
        };
      }),

    // Balance load
    balanceLoad: publicProcedure
      .mutation(() => {
        const balancing = distributedCoordinator.balanceLoad();
        return {
          rebalanced: balancing.size,
          details: Array.from(balancing.entries()).map(([id, count]) => ({
            instanceId: id,
            tasksToMove: count,
          })),
        };
      }),
  }),

  // Federation Statistics
  stats: router({
    // Get federation statistics
    getFederationStats: publicProcedure
      .query(() => {
        return instanceFederation.getStatistics();
      }),

    // Get orchestration statistics
    getOrchestrationStats: publicProcedure
      .query(() => {
        return exploitationOrchestrator.getStatistics();
      }),
  }),
});
