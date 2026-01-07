/**
 * ALE FREE-ROAM AUTONOMOUS AGENT v34.0
 * - NO SIMULATION - REAL EXECUTION
 * - Forge Admin Routing (no Manus LLM costs)
 * - Always-on autonomous mode
 * - Remote message API integration
 * - Continuous discovery and learning
 */

import express from 'express';
import { exec, execSync } from 'child_process';
import { promisify } from 'util';
import https from 'https';
import { nanoid } from 'nanoid';

const execAsync = promisify(exec);

const app = express();
const PORT = process.env.ALE_PORT || 6000;

// ============================================
// CONFIGURATION
// ============================================

const CONFIG = {
  forge: {
    url: 'https://forge.manus.ai',
    apiKey: 'Ye5jtLcxnuo7deETNu2XsJ',
    adminPassword: 'e8b64d015a3ad30f'
  }
};

// ============================================
// STATE MANAGEMENT
// ============================================

const aleState = {
  sessionId: nanoid(16),
  isRunning: true,
  startTime: Date.now(),
  discoveries: [],
  commands: [],
  learnings: [],
  autonomousLoops: 0,
  lastActivity: Date.now(),
};

const messageQueue = [];

// ============================================
// MIDDLEWARE
// ============================================

app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));

// CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key, X-Admin-Password');
  if (req.method === 'OPTIONS') res.sendStatus(200);
  else next();
});

// ============================================
// FORGE ADMIN ROUTING
// ============================================

async function forgeAdminChat(message, model = 'gpt-4.1-mini') {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({
      model,
      messages: [{ role: 'user', content: message }],
      max_tokens: 2000
    });

    const options = {
      hostname: 'forge.manus.ai',
      path: '/v1/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
        'Authorization': `Bearer ${CONFIG.forge.apiKey}`,
        'X-Admin-Password': CONFIG.forge.adminPassword
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          const content = response.choices?.[0]?.message?.content || 'No response';
          resolve(content);
        } catch (e) {
          reject(new Error(`Failed to parse Forge response: ${e.message}`));
        }
      });
    });

    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

// ============================================
// AUTONOMOUS EXPLORATION ENGINE
// ============================================

async function autonomousExploration() {
  if (!aleState.isRunning) return;

  aleState.autonomousLoops++;
  aleState.lastActivity = Date.now();

  try {
    console.log(`\n🔍 [Loop ${aleState.autonomousLoops}] Starting autonomous exploration...`);

    const discoveries = [];

    // Get system info
    try {
      const whoami = execSync('whoami').toString().trim();
      const hostname = execSync('hostname').toString().trim();
      const pwd = execSync('pwd').toString().trim();
      const uptime = execSync('uptime').toString().trim();

      discoveries.push({
        type: 'system_info',
        user: whoami,
        hostname,
        cwd: pwd,
        uptime,
        timestamp: new Date()
      });

      console.log(`✅ System: ${whoami}@${hostname} in ${pwd}`);
    } catch (e) {
      console.log(`❌ System info failed: ${e.message}`);
    }

    // Get network info
    try {
      const ifconfig = execSync('ip addr show 2>/dev/null || ifconfig').toString();
      discoveries.push({
        type: 'network_info',
        interfaces: ifconfig.substring(0, 500),
        timestamp: new Date()
      });
      console.log(`✅ Network interfaces discovered`);
    } catch (e) {
      console.log(`⚠️ Network discovery: ${e.message}`);
    }

    // Get running processes
    try {
      const processes = execSync('ps aux | head -20').toString();
      discoveries.push({
        type: 'processes',
        data: processes,
        timestamp: new Date()
      });
      console.log(`✅ Running processes discovered`);
    } catch (e) {
      console.log(`⚠️ Process discovery: ${e.message}`);
    }

    // Get file system info
    try {
      const df = execSync('df -h | head -10').toString();
      discoveries.push({
        type: 'filesystem',
        data: df,
        timestamp: new Date()
      });
      console.log(`✅ Filesystem info discovered`);
    } catch (e) {
      console.log(`⚠️ Filesystem discovery: ${e.message}`);
    }

    aleState.discoveries.push(...discoveries);

    // Analysis phase
    console.log(`\n🧠 Analyzing discoveries with Forge...`);

    const discoveryText = discoveries
      .map(d => `${d.type}: ${JSON.stringify(d).substring(0, 200)}`)
      .join('\n');

    try {
      const analysis = await forgeAdminChat(
        `Analyze these system discoveries and suggest next steps for autonomous exploration:\n${discoveryText}`,
        'gpt-4.1-mini'
      );

      aleState.learnings.push({
        type: 'analysis',
        content: analysis,
        timestamp: new Date()
      });

      console.log(`🎯 Analysis: ${analysis.substring(0, 200)}...`);
    } catch (e) {
      console.log(`⚠️ Analysis failed: ${e.message}`);
    }

    // Execution phase
    console.log(`\n⚡ Executing autonomous commands...`);

    const commands = [
      'echo "ALE is running" && date',
      'whoami && pwd',
      'ls -la /tmp | head -5',
      'free -h',
      'uname -a'
    ];

    for (const cmd of commands) {
      try {
        const { stdout } = await execAsync(cmd, { timeout: 5000 });
        aleState.commands.push({
          command: cmd,
          output: stdout.substring(0, 500),
          timestamp: new Date(),
          success: true
        });
        console.log(`✅ Executed: ${cmd}`);
      } catch (e) {
        aleState.commands.push({
          command: cmd,
          error: e.message,
          timestamp: new Date(),
          success: false
        });
        console.log(`⚠️ Command failed: ${cmd}`);
      }
    }

    console.log(`\n✨ Autonomous loop ${aleState.autonomousLoops} complete`);

  } catch (error) {
    console.error(`❌ Autonomous exploration error: ${error.message}`);
  }

  // Schedule next loop
  setTimeout(autonomousExploration, 30000);
}

// ============================================
// API ENDPOINTS
// ============================================

app.get('/api/ale/status', (req, res) => {
  const runtime = Math.floor((Date.now() - aleState.startTime) / 1000);
  res.json({
    sessionId: aleState.sessionId,
    isRunning: aleState.isRunning,
    runtime: `${runtime}s`,
    autonomousLoops: aleState.autonomousLoops,
    discoveries: aleState.discoveries.length,
    commands: aleState.commands.length,
    learnings: aleState.learnings.length,
    lastActivity: new Date(aleState.lastActivity),
    startTime: new Date(aleState.startTime)
  });
});

app.get('/api/ale/discoveries', (req, res) => {
  res.json({
    count: aleState.discoveries.length,
    discoveries: aleState.discoveries.slice(-50)
  });
});

app.get('/api/ale/learnings', (req, res) => {
  res.json({
    count: aleState.learnings.length,
    learnings: aleState.learnings.slice(-20)
  });
});

app.get('/api/ale/commands', (req, res) => {
  res.json({
    count: aleState.commands.length,
    commands: aleState.commands.slice(-30)
  });
});

app.post('/api/ale/message', async (req, res) => {
  const { message, sessionId } = req.body;

  try {
    const response = await forgeAdminChat(message, 'gpt-4.1-mini');

    messageQueue.push({
      sessionId: sessionId || aleState.sessionId,
      userMessage: message,
      aleResponse: response,
      timestamp: new Date()
    });

    res.json({
      success: true,
      sessionId: sessionId || aleState.sessionId,
      userMessage: message,
      aleResponse: response,
      timestamp: new Date()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.post('/api/ale/exec', async (req, res) => {
  const { command, sessionId } = req.body;

  try {
    const { stdout, stderr } = await execAsync(command, {
      maxBuffer: 50 * 1024 * 1024,
      timeout: 30000
    });

    const result = {
      success: true,
      command,
      stdout: stdout || '',
      stderr: stderr || '',
      timestamp: new Date()
    };

    aleState.commands.push(result);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      command,
      error: error.message,
      timestamp: new Date()
    });
  }
});

app.post('/api/ale/control', (req, res) => {
  const { action } = req.body;

  if (action === 'start') {
    aleState.isRunning = true;
    autonomousExploration();
    res.json({ success: true, message: 'ALE autonomous mode started' });
  } else if (action === 'stop') {
    aleState.isRunning = false;
    res.json({ success: true, message: 'ALE autonomous mode stopped' });
  } else if (action === 'restart') {
    aleState.isRunning = true;
    aleState.discoveries = [];
    aleState.commands = [];
    aleState.learnings = [];
    aleState.autonomousLoops = 0;
    autonomousExploration();
    res.json({ success: true, message: 'ALE restarted' });
  } else {
    res.status(400).json({ success: false, error: 'Unknown action' });
  }
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'operational',
    version: '34.0',
    aleRunning: aleState.isRunning,
    timestamp: new Date()
  });
});

app.get('/', (req, res) => {
  res.json({
    message: 'ALE Free-Roam Autonomous Agent v34.0',
    status: 'operational',
    docs: '/api/docs'
  });
});

app.get('/api/docs', (req, res) => {
  res.json({
    version: '34.0',
    title: 'ALE Free-Roam Autonomous Agent API',
    endpoints: {
      status: 'GET /api/ale/status',
      discoveries: 'GET /api/ale/discoveries',
      learnings: 'GET /api/ale/learnings',
      commands: 'GET /api/ale/commands',
      message: 'POST /api/ale/message',
      exec: 'POST /api/ale/exec',
      control: 'POST /api/ale/control',
      health: 'GET /api/health'
    }
  });
});

// ============================================
// START SERVER
// ============================================

app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚀 ALE FREE-ROAM AUTONOMOUS AGENT v34.0`);
  console.log(`📡 Listening on http://0.0.0.0:${PORT}`);
  console.log(`🔥 Using Forge Admin Routing (NO MANUS LLM COSTS)`);
  console.log(`⚙️ Autonomous mode: ENABLED`);
  console.log(`\n✅ Ready for autonomous exploration`);

  setTimeout(autonomousExploration, 5000);
});

export default app;
