import { router, publicProcedure } from './_core/trpc';
import { z } from 'zod';
import { errorMemory } from './_core/errorMemory';
import { scannerIntegration, ScannerCredentials } from './_core/scannerIntegration';
import { evolutionEngine } from './_core/evolutionEngine';

export const autonomousRouter = router({
  // Error Memory System
  error: router({
    // Record an error
    recordError: publicProcedure
      .input(z.object({
        errorType: z.string(),
        errorMessage: z.string(),
        stackTrace: z.string(),
        context: z.object({
          command: z.string().optional(),
          cveId: z.string().optional(),
          sessionId: z.string().optional(),
          exploitType: z.string().optional(),
          targetSoftware: z.string().optional(),
        }).optional(),
        severity: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']),
      }))
      .mutation(({ input }) => {
        const error = errorMemory.recordError({
          errorType: input.errorType,
          errorMessage: input.errorMessage,
          stackTrace: input.stackTrace,
          context: input.context || {},
          severity: input.severity,
        });
        
        return {
          errorId: error.id,
          resolved: error.resolved,
          autoFixAttempted: error.autoFixAttempted,
          autoFixSuccess: error.autoFixSuccess,
          resolution: error.resolution,
        };
      }),

    // Get error statistics
    getStats: publicProcedure
      .query(() => {
        return errorMemory.getErrorStats();
      }),

    // Get learning insights
    getLearningInsights: publicProcedure
      .query(() => {
        return errorMemory.getLearningInsights();
      }),

    // Get self-healing patch
    getSelfHealingPatch: publicProcedure
      .input(z.object({
        errorType: z.string(),
        errorMessage: z.string(),
      }))
      .query(({ input }) => {
        const patch = errorMemory.generateSelfHealingPatch({
          id: 'temp',
          timestamp: new Date().toISOString(),
          errorType: input.errorType,
          errorMessage: input.errorMessage,
          stackTrace: '',
          context: {},
          severity: 'HIGH',
          resolved: false,
          autoFixAttempted: false,
          learningInsights: []
        });
        
        return patch;
      }),
  }),

  // Vulnerability Scanner Integration
  scanner: router({
    // Initialize Nessus
    initializeNessus: publicProcedure
      .input(z.object({
        apiUrl: z.string(),
        apiKey: z.string(),
      }))
      .mutation(async ({ input }) => {
        const success = await scannerIntegration.initializeNessus({
          scannerType: 'nessus',
          apiUrl: input.apiUrl,
          apiKey: input.apiKey,
        });
        
        return { success, message: success ? 'Nessus initialized' : 'Failed to initialize Nessus' };
      }),

    // Initialize OpenVAS
    initializeOpenVAS: publicProcedure
      .input(z.object({
        apiUrl: z.string(),
        apiKey: z.string(),
      }))
      .mutation(async ({ input }) => {
        const success = await scannerIntegration.initializeOpenVAS({
          scannerType: 'openvas',
          apiUrl: input.apiUrl,
          apiKey: input.apiKey,
        });
        
        return { success, message: success ? 'OpenVAS initialized' : 'Failed to initialize OpenVAS' };
      }),

    // Start scan
    startScan: publicProcedure
      .input(z.object({
        scannerType: z.enum(['nessus', 'openvas']),
        targetHost: z.string(),
        scanName: z.string(),
      }))
      .mutation(async ({ input }) => {
        const scanId = await scannerIntegration.startScan(
          input.scannerType,
          input.targetHost,
          input.scanName
        );
        
        return { scanId, status: 'started' };
      }),

    // Get scan results
    getScanResults: publicProcedure
      .input(z.object({
        scanId: z.string(),
      }))
      .query(async ({ input }) => {
        const results = await scannerIntegration.getScanResults(input.scanId);
        return {
          scanId: input.scanId,
          vulnerabilityCount: results.length,
          results: results.map(r => ({
            id: r.id,
            targetHost: r.targetHost,
            severity: r.severity,
            description: r.description,
            cvssScore: r.cvssScore,
            cveIds: r.cveIds,
          })),
        };
      }),

    // Get exploitation guidance
    getExploitationGuidance: publicProcedure
      .input(z.object({
        scanResultId: z.string(),
      }))
      .query(({ input }) => {
        const guidance = scannerIntegration.getExploitationGuidance(input.scanResultId);
        
        if (!guidance) {
          return { error: 'Guidance not found' };
        }
        
        return {
          scanResult: guidance.scanResult,
          matchedCVEs: guidance.matchedCVEs,
          exploitCommands: guidance.exploitCommands.slice(0, 5),
          dependencies: guidance.dependencies,
          estimatedSuccessRate: (guidance.estimatedSuccessRate * 100).toFixed(1),
          mitigationSteps: guidance.mitigationSteps.slice(0, 5),
          detectionSignatures: guidance.detectionSignatures.slice(0, 5),
        };
      }),

    // Get all exploitation guidance
    getAllGuidance: publicProcedure
      .query(() => {
        const guidance = scannerIntegration.getAllExploitationGuidance();
        
        return {
          count: guidance.length,
          guidance: guidance.map(g => ({
            scanResultId: g.scanResult.id,
            targetHost: g.scanResult.targetHost,
            severity: g.scanResult.severity,
            cvssScore: g.scanResult.cvssScore,
            successRate: (g.estimatedSuccessRate * 100).toFixed(1),
            matchedCVEs: g.matchedCVEs.length,
          })),
        };
      }),

    // Generate remediation plan
    getRemediationPlan: publicProcedure
      .input(z.object({
        scanId: z.string(),
      }))
      .query(async ({ input }) => {
        const results = await scannerIntegration.getScanResults(input.scanId);
        const plan = scannerIntegration.generateRemediationPlan(results);
        
        return {
          prioritizedCount: plan.prioritizedVulnerabilities.length,
          estimatedTime: plan.estimatedTime,
          riskReduction: (plan.riskReduction * 100).toFixed(1),
          steps: plan.remediationSteps.slice(0, 20),
        };
      }),

    // Get scan statistics
    getStatistics: publicProcedure
      .query(() => {
        return scannerIntegration.getScanStatistics();
      }),
  }),

  // Evolution Engine
  evolution: router({
    // Record execution attempt
    recordAttempt: publicProcedure
      .input(z.object({
        cveId: z.string(),
        targetHost: z.string(),
        targetPort: z.number().optional(),
        command: z.string(),
        result: z.enum(['SUCCESS', 'FAILED', 'PARTIAL']),
        outputLength: z.number(),
        executionTime: z.number(),
        errorMessage: z.string().optional(),
        learningPoints: z.array(z.string()),
      }))
      .mutation(({ input }) => {
        const attempt = evolutionEngine.recordAttempt({
          cveId: input.cveId,
          targetHost: input.targetHost,
          targetPort: input.targetPort,
          command: input.command,
          result: input.result,
          outputLength: input.outputLength,
          executionTime: input.executionTime,
          errorMessage: input.errorMessage,
          learningPoints: input.learningPoints,
        });
        
        return {
          attemptId: attempt.id,
          recorded: true,
          timestamp: attempt.timestamp,
        };
      }),

    // Get learning progress
    getLearningProgress: publicProcedure
      .query(() => {
        return evolutionEngine.getLearningProgress();
      }),

    // Get code improvement suggestions
    getImprovements: publicProcedure
      .query(() => {
        const suggestions = evolutionEngine.generateCodeImprovements();
        return { suggestions };
      }),

    // Get execution history
    getHistory: publicProcedure
      .input(z.object({
        limit: z.number().optional().default(50),
      }))
      .query(({ input }) => {
        const history = evolutionEngine.getExecutionHistory(input.limit);
        return {
          count: history.length,
          history: history.map(h => ({
            id: h.id,
            cveId: h.cveId,
            result: h.result,
            executionTime: h.executionTime,
            timestamp: h.timestamp,
          })),
        };
      }),

    // Analyze patterns
    analyzePatterns: publicProcedure
      .query(() => {
        return evolutionEngine.analyzePatterns();
      }),

    // Get successful exploits
    getSuccessfulExploits: publicProcedure
      .input(z.object({
        cveId: z.string(),
      }))
      .query(({ input }) => {
        const exploits = evolutionEngine.getSuccessfulExploits(input.cveId);
        return {
          cveId: input.cveId,
          count: exploits.length,
          exploits: exploits.map(e => ({
            command: e.exploitCommand,
            successRate: (e.successRate * 100).toFixed(1),
            timesSuccessful: e.timesSuccessful,
            averageTime: e.averageExecutionTime.toFixed(2),
          })),
        };
      }),

    // Get visualization data
    getVisualization: publicProcedure
      .query(() => {
        return evolutionEngine.getVisualizationData();
      }),
  }),
});
