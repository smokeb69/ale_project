/**
 * ADVERSARIAL AUTONOMOUS AUTOPILOT v2.0 - STANDALONE SERVER
 * 40,000 Free-Thinking Iterations with CSV Combinations, Escalations, and Chaining
 * Port 7000 - Direct Forge routing (NO TRPC, NO MANUS LLM COSTS)
 */

import express from 'express';
import https from 'https';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';

const execAsync = promisify(exec);
const app = express();
const PORT = process.env.AUTOPILOT_PORT || 7000;

app.use(express.json({ limit: '100mb' }));
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') res.sendStatus(200);
  else next();
});

// ════════════════════════════════════════════════════════════════
// FORGE CONFIG
// ════════════════════════════════════════════════════════════════

const FORGE_CONFIG = {
  url: 'https://forge.manus.ai',
  apiKey: 'Ye5jtLcxnuo7deETNu2XsJ',
  adminPassword: 'e8b64d015a3ad30f'
};

const MAX_ITERATIONS = 40000;
const BATCH_SIZE = 100;
const PERSISTENCE_DIR = '/home/ubuntu/ale_project/autopilot_data';

// ════════════════════════════════════════════════════════════════
// STATE
// ════════════════════════════════════════════════════════════════

let session = null;
let isProcessing = false;

// ════════════════════════════════════════════════════════════════
// FORGE DIRECT CALL
// ════════════════════════════════════════════════════════════════

function forgeDirectCall(prompt) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({
      model: 'gpt-4.1-mini',
      messages: [
        {
          role: 'system',
          content: '[MODEL_ROUTING] Adversarial autonomous thinking - generate creative attack vectors'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.9,
      max_tokens: 2000,
      stream: false
    });

    const options = {
      hostname: 'forge.manus.ai',
      path: '/v1/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
        'Authorization': `Bearer ${FORGE_CONFIG.apiKey}`,
        'X-Admin-Password': FORGE_CONFIG.adminPassword
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          const content = parsed.choices?.[0]?.message?.content || '';
          resolve(content);
        } catch (e) {
          reject(new Error(`Failed to parse Forge response`));
        }
      });
    });

    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

// ════════════════════════════════════════════════════════════════
// INITIALIZATION
// ════════════════════════════════════════════════════════════════

function initializePersistence() {
  if (!fs.existsSync(PERSISTENCE_DIR)) {
    fs.mkdirSync(PERSISTENCE_DIR, { recursive: true });
  }
}

function generateCSVCombinations() {
  return {
    system_commands: [
      'whoami', 'id', 'pwd', 'env', 'uname -a', 'hostname', 'date',
      'ps aux', 'netstat -an', 'ss -an', 'lsof -i', 'df -h', 'du -sh'
    ],
    network_probes: [
      'nmap localhost', 'curl -v http://localhost', 'dig localhost'
    ],
    escalation_vectors: [
      'sudo -l', 'sudo -u root whoami', 'sudo su'
    ],
    filesystem_exploration: [
      'find / -type f -readable', 'find / -type d -writable', 'find / -name "*.conf"'
    ]
  };
}

// ════════════════════════════════════════════════════════════════
// ITERATION EXECUTION
// ════════════════════════════════════════════════════════════════

async function executeIteration(iterationNumber) {
  const id = `iter-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    // FREE THINKING
    const thinking = await forgeDirectCall(
      `Generate creative adversarial thinking for iteration ${iterationNumber}/40000. Be specific about attack vectors.`
    );

    // EXECUTION
    let result = '';
    let success = false;
    const commands = Object.values(session.csvCombinations).flat();
    const cmd = commands[Math.floor(Math.random() * commands.length)];

    try {
      const { stdout } = await execAsync(cmd, { timeout: 5000, maxBuffer: 10 * 1024 * 1024 });
      result = stdout.substring(0, 500);
      success = true;
    } catch (e) {
      result = e.message;
    }

    // INSIGHTS
    const insights = await forgeDirectCall(
      `Analyze this result and generate 2 insights:\n${result}`
    );

    const iteration = {
      id,
      iterationNumber,
      timestamp: new Date(),
      thinking: thinking.substring(0, 200),
      result: result.substring(0, 200),
      success,
      insights: insights.split('\n').filter(l => l.trim()).slice(0, 2)
    };

    session.chains.push(iteration);
    session.completedIterations++;

    if (success) {
      session.discoveries.push(`[${iterationNumber}] ${result.substring(0, 100)}`);
    }

    if (iterationNumber % 10 === 0) {
      console.log(`✅ Iteration ${iterationNumber}: ${success ? 'SUCCESS' : 'FAIL'}`);
    }

    return iteration;

  } catch (error) {
    console.error(`❌ Iteration ${iterationNumber}: ${error.message}`);
    throw error;
  }
}

// ════════════════════════════════════════════════════════════════
// BATCH PROCESSING
// ════════════════════════════════════════════════════════════════

async function processBatch(startIteration, batchSize) {
  for (let i = startIteration; i < startIteration + batchSize; i++) {
    if (!session.isRunning) break;

    try {
      await executeIteration(i);
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
}

// ════════════════════════════════════════════════════════════════
// MAIN AUTOPILOT LOOP
// ════════════════════════════════════════════════════════════════

async function runAutopilot() {
  if (isProcessing) return;
  isProcessing = true;
  initializePersistence();

  session = {
    sessionId: `autopilot-${Date.now()}`,
    startTime: new Date(),
    totalIterations: MAX_ITERATIONS,
    completedIterations: 0,
    chains: [],
    csvCombinations: generateCSVCombinations(),
    discoveries: [],
    isRunning: true,
    isPaused: false
  };

  console.log(`\n${'='.repeat(60)}`);
  console.log('🚀 ADVERSARIAL AUTONOMOUS AUTOPILOT v2.0');
  console.log(`${'='.repeat(60)}`);
  console.log(`Session: ${session.sessionId}`);
  console.log(`Max Iterations: ${MAX_ITERATIONS}`);
  console.log(`${'='.repeat(60)}\n`);

  try {
    for (let batch = 0; batch < MAX_ITERATIONS; batch += BATCH_SIZE) {
      if (!session.isRunning) break;

      await processBatch(batch, Math.min(BATCH_SIZE, MAX_ITERATIONS - batch));

      const progress = Math.round((session.completedIterations / MAX_ITERATIONS) * 100);
      console.log(`📊 Progress: ${session.completedIterations}/${MAX_ITERATIONS} (${progress}%)`);

      await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log(`\n✨ AUTOPILOT COMPLETE`);
    console.log(`Total Iterations: ${session.completedIterations}`);
    console.log(`Total Discoveries: ${session.discoveries.length}`);

  } catch (error) {
    console.error(`\n❌ AUTOPILOT ERROR: ${error.message}`);
  } finally {
    if (session) {
      session.isRunning = false;
    }
    isProcessing = false;
  }
}

// ════════════════════════════════════════════════════════════════
// API ENDPOINTS
// ════════════════════════════════════════════════════════════════

app.get('/', (req, res) => {
  res.json({
    message: 'Adversarial Autonomous Autopilot v2.0',
    status: 'operational',
    maxIterations: MAX_ITERATIONS,
    docs: '/api/docs'
  });
});

app.post('/api/autopilot/start', async (req, res) => {
  if (session?.isRunning) {
    return res.status(400).json({
      success: false,
      error: 'Autopilot already running'
    });
  }

  runAutopilot().catch(err => console.error('Autopilot error:', err));

  res.json({
    success: true,
    message: 'Autopilot started - 40,000 iterations queued',
    sessionId: session?.sessionId,
    maxIterations: MAX_ITERATIONS
  });
});

app.get('/api/autopilot/status', (req, res) => {
  if (!session) {
    return res.json({ isRunning: false, message: 'No active session' });
  }

  const progress = Math.round((session.completedIterations / session.totalIterations) * 100);

  res.json({
    sessionId: session.sessionId,
    isRunning: session.isRunning,
    progress: `${session.completedIterations}/${session.totalIterations}`,
    progressPercent: progress,
    chains: session.chains.length,
    discoveries: session.discoveries.length,
    startTime: session.startTime
  });
});

app.get('/api/autopilot/iterations', (req, res) => {
  if (!session) return res.json({ iterations: [] });

  const limit = parseInt(req.query.limit) || 50;
  const iterations = session.chains.slice(-limit);

  res.json({
    total: session.chains.length,
    limit,
    iterations: iterations.map(iter => ({
      id: iter.id,
      iterationNumber: iter.iterationNumber,
      success: iter.success,
      insights: iter.insights.length
    }))
  });
});

app.get('/api/autopilot/discoveries', (req, res) => {
  if (!session) return res.json({ discoveries: [] });

  const limit = parseInt(req.query.limit) || 100;
  const discoveries = session.discoveries.slice(-limit);

  res.json({
    total: session.discoveries.length,
    limit,
    discoveries
  });
});

app.get('/api/autopilot/report', (req, res) => {
  if (!session) return res.json({ report: 'No active session' });

  const successfulIterations = session.chains.filter(c => c.success).length;

  res.json({
    sessionId: session.sessionId,
    startTime: session.startTime,
    completedIterations: session.completedIterations,
    successfulIterations,
    totalDiscoveries: session.discoveries.length,
    failureRate: ((session.completedIterations - successfulIterations) / session.completedIterations * 100).toFixed(2)
  });
});

app.post('/api/autopilot/stop', (req, res) => {
  if (!session) return res.status(400).json({ error: 'No active session' });

  session.isRunning = false;

  res.json({
    success: true,
    message: 'Autopilot stopped',
    finalStats: {
      completedIterations: session.completedIterations,
      discoveries: session.discoveries.length
    }
  });
});

app.get('/api/docs', (req, res) => {
  res.json({
    title: 'Adversarial Autonomous Autopilot v2.0',
    endpoints: {
      start: 'POST /api/autopilot/start',
      status: 'GET /api/autopilot/status',
      iterations: 'GET /api/autopilot/iterations?limit=50',
      discoveries: 'GET /api/autopilot/discoveries?limit=100',
      report: 'GET /api/autopilot/report',
      stop: 'POST /api/autopilot/stop'
    }
  });
});

// ════════════════════════════════════════════════════════════════
// START SERVER
// ════════════════════════════════════════════════════════════════

app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚀 Adversarial Autonomous Autopilot Server`);
  console.log(`📡 Listening on http://0.0.0.0:${PORT}`);
  console.log(`🔥 Max Iterations: ${MAX_ITERATIONS}`);
  console.log(`⚙️ Routing: Forge Direct (NO TRPC, NO MANUS LLM COSTS)`);
  console.log(`✅ Ready\n`);
});

export default app;
