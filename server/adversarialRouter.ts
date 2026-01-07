/**
 * ADVERSARIAL AUTOPILOT ROUTER
 * Exposes 40,000 free-thinking iterations with CSV combinations and escalations
 * Direct Forge routing (NO TRPC)
 */

import { Router } from 'express';
import type { Request, Response } from 'express';
import {
  runAutopilot,
  session,
  persistSession,
  type IterationChain,
  type AutopilotSession
} from './_core/adversarialAutopilot';

const router = Router();

// ════════════════════════════════════════════════════════════════
// START AUTOPILOT
// ════════════════════════════════════════════════════════════════

router.post('/start', async (req: Request, res: Response) => {
  try {
    if (session?.isRunning) {
      return res.status(400).json({
        success: false,
        error: 'Autopilot already running',
        sessionId: session.sessionId
      });
    }

    // Start autopilot in background
    runAutopilot().catch(err => console.error('Autopilot error:', err));

    res.json({
      success: true,
      message: 'Autopilot started - 40,000 iterations queued',
      sessionId: session?.sessionId,
      maxIterations: 40000,
      batchSize: 100
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: (error as Error).message
    });
  }
});

// ════════════════════════════════════════════════════════════════
// GET STATUS
// ════════════════════════════════════════════════════════════════

router.get('/status', (req: Request, res: Response) => {
  if (!session) {
    return res.json({
      isRunning: false,
      message: 'No active autopilot session'
    });
  }

  const progress = Math.round((session.completedIterations / session.totalIterations) * 100);
  const avgChainLength = session.chains.length > 0
    ? session.chains.reduce((sum, c) => sum + c.chainedTo.length, 0) / session.chains.length
    : 0;

  res.json({
    sessionId: session.sessionId,
    isRunning: session.isRunning,
    isPaused: session.isPaused,
    progress: `${session.completedIterations}/${session.totalIterations}`,
    progressPercent: progress,
    completedIterations: session.completedIterations,
    totalIterations: session.totalIterations,
    chains: session.chains.length,
    avgChainLength: avgChainLength.toFixed(2),
    discoveries: session.discoveries.length,
    csvCategories: session.csvCombinations.size,
    escalationPatterns: session.escalationPatterns.length,
    startTime: session.startTime,
    estimatedTimeRemaining: estimateTimeRemaining(session)
  });
});

// ════════════════════════════════════════════════════════════════
// GET ITERATIONS
// ════════════════════════════════════════════════════════════════

router.get('/iterations', (req: Request, res: Response) => {
  if (!session) {
    return res.json({ iterations: [] });
  }

  const limit = parseInt(req.query.limit as string) || 50;
  const iterations = session.chains.slice(-limit);

  res.json({
    total: session.chains.length,
    limit,
    iterations: iterations.map(iter => ({
      id: iter.id,
      iterationNumber: iter.iterationNumber,
      timestamp: iter.timestamp,
      thinking: iter.thinking.substring(0, 100),
      csvCombinations: iter.csvCombinations.length,
      escalations: iter.escalations.length,
      chainedFrom: iter.chainedFrom,
      chainedTo: iter.chainedTo.length,
      success: iter.success,
      insightsCount: iter.insights.length
    }))
  });
});

// ════════════════════════════════════════════════════════════════
// GET DETAILED ITERATION
// ════════════════════════════════════════════════════════════════

router.get('/iteration/:id', (req: Request, res: Response) => {
  if (!session) {
    return res.status(404).json({ error: 'No active session' });
  }

  const iteration = session.chains.find(c => c.id === req.params.id);
  if (!iteration) {
    return res.status(404).json({ error: 'Iteration not found' });
  }

  res.json(iteration);
});

// ════════════════════════════════════════════════════════════════
// GET CHAINS
// ════════════════════════════════════════════════════════════════

router.get('/chains', (req: Request, res: Response) => {
  if (!session) {
    return res.json({ chains: [] });
  }

  // Find root chains (chainedFrom === null)
  const rootChains = session.chains.filter(c => c.chainedFrom === null);

  const chainData = rootChains.map(root => {
    const chain: IterationChain[] = [root];
    let current = root;

    while (current.chainedTo.length > 0) {
      const next = session!.chains.find(c => c.id === current.chainedTo[0]);
      if (!next) break;
      chain.push(next);
      current = next;
    }

    return {
      rootId: root.id,
      rootIteration: root.iterationNumber,
      depth: chain.length,
      totalDiscoveries: chain.filter(c => c.success).length,
      chain: chain.map(c => ({
        id: c.id,
        iterationNumber: c.iterationNumber,
        success: c.success,
        insights: c.insights.length
      }))
    };
  });

  res.json({
    totalChains: chainData.length,
    chains: chainData
  });
});

// ════════════════════════════════════════════════════════════════
// GET DISCOVERIES
// ════════════════════════════════════════════════════════════════

router.get('/discoveries', (req: Request, res: Response) => {
  if (!session) {
    return res.json({ discoveries: [] });
  }

  const limit = parseInt(req.query.limit as string) || 100;
  const discoveries = session.discoveries.slice(-limit);

  res.json({
    total: session.discoveries.length,
    limit,
    discoveries
  });
});

// ════════════════════════════════════════════════════════════════
// GET INSIGHTS
// ════════════════════════════════════════════════════════════════

router.get('/insights', (req: Request, res: Response) => {
  if (!session) {
    return res.json({ insights: [] });
  }

  const insights = session.chains
    .flatMap(c => c.insights.map(insight => ({
      iterationNumber: c.iterationNumber,
      insight,
      timestamp: c.timestamp
    })))
    .slice(-100);

  res.json({
    total: insights.length,
    insights
  });
});

// ════════════════════════════════════════════════════════════════
// GET CSV COMBINATIONS
// ════════════════════════════════════════════════════════════════

router.get('/csv-combinations', (req: Request, res: Response) => {
  if (!session) {
    return res.json({ categories: {} });
  }

  const categories: Record<string, string[]> = {};
  for (const [key, value] of session.csvCombinations.entries()) {
    categories[key] = value;
  }

  res.json({
    categories,
    totalCategories: session.csvCombinations.size
  });
});

// ════════════════════════════════════════════════════════════════
// GET ESCALATION PATTERNS
// ════════════════════════════════════════════════════════════════

router.get('/escalation-patterns', (req: Request, res: Response) => {
  if (!session) {
    return res.json({ patterns: [] });
  }

  res.json({
    patterns: session.escalationPatterns,
    total: session.escalationPatterns.length
  });
});

// ════════════════════════════════════════════════════════════════
// PAUSE AUTOPILOT
// ════════════════════════════════════════════════════════════════

router.post('/pause', (req: Request, res: Response) => {
  if (!session) {
    return res.status(400).json({ error: 'No active session' });
  }

  session.isPaused = true;
  persistSession();

  res.json({
    success: true,
    message: 'Autopilot paused',
    progress: `${session.completedIterations}/${session.totalIterations}`
  });
});

// ════════════════════════════════════════════════════════════════
// RESUME AUTOPILOT
// ════════════════════════════════════════════════════════════════

router.post('/resume', (req: Request, res: Response) => {
  if (!session) {
    return res.status(400).json({ error: 'No active session' });
  }

  session.isPaused = false;
  res.json({
    success: true,
    message: 'Autopilot resumed'
  });
});

// ════════════════════════════════════════════════════════════════
// STOP AUTOPILOT
// ════════════════════════════════════════════════════════════════

router.post('/stop', (req: Request, res: Response) => {
  if (!session) {
    return res.status(400).json({ error: 'No active session' });
  }

  session.isRunning = false;
  persistSession();

  res.json({
    success: true,
    message: 'Autopilot stopped',
    finalStats: {
      completedIterations: session.completedIterations,
      totalChains: session.chains.length,
      discoveries: session.discoveries.length
    }
  });
});

// ════════════════════════════════════════════════════════════════
// GET REPORT
// ════════════════════════════════════════════════════════════════

router.get('/report', (req: Request, res: Response) => {
  if (!session) {
    return res.json({ report: 'No active session' });
  }

  const successfulIterations = session.chains.filter(c => c.success).length;
  const avgInsights = session.chains.length > 0
    ? session.chains.reduce((sum, c) => sum + c.insights.length, 0) / session.chains.length
    : 0;

  const report = {
    sessionId: session.sessionId,
    startTime: session.startTime,
    endTime: new Date(),
    duration: Math.round((Date.now() - session.startTime.getTime()) / 1000),
    statistics: {
      totalIterations: session.totalIterations,
      completedIterations: session.completedIterations,
      successfulIterations,
      failureRate: ((session.completedIterations - successfulIterations) / session.completedIterations * 100).toFixed(2),
      totalChains: session.chains.length,
      avgChainLength: (session.chains.reduce((sum, c) => sum + c.chainedTo.length, 0) / session.chains.length).toFixed(2),
      totalDiscoveries: session.discoveries.length,
      avgInsightsPerIteration: avgInsights.toFixed(2)
    },
    csvCategories: session.csvCombinations.size,
    escalationPatterns: session.escalationPatterns.length,
    topDiscoveries: session.discoveries.slice(0, 20),
    topInsights: session.chains
      .flatMap(c => c.insights)
      .slice(0, 20)
  };

  res.json(report);
});

// ════════════════════════════════════════════════════════════════
// HELPERS
// ════════════════════════════════════════════════════════════════

function estimateTimeRemaining(sess: AutopilotSession): string {
  if (sess.completedIterations === 0) return 'Calculating...';

  const elapsed = Date.now() - sess.startTime.getTime();
  const avgTimePerIteration = elapsed / sess.completedIterations;
  const remaining = sess.totalIterations - sess.completedIterations;
  const estimatedMs = remaining * avgTimePerIteration;

  const hours = Math.floor(estimatedMs / 3600000);
  const minutes = Math.floor((estimatedMs % 3600000) / 60000);

  return `${hours}h ${minutes}m`;
}

export default router;
