/**
 * STANDALONE API SERVER
 * Run with: node standalone-api.mjs
 * No dependencies on main app
 */

import express from 'express';
import { exec, execSync } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import { nanoid } from 'nanoid';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const execAsync = promisify(exec);

const app = express();
const PORT = process.env.API_PORT || 5000;

// Session storage
const sessions = new Map();
const explorations = new Map();

app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));

// CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key');
  if (req.method === 'OPTIONS') res.sendStatus(200);
  else next();
});

// Logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// ============================================
// SESSION ENDPOINTS
// ============================================

app.post('/api/session/create', (req, res) => {
  const sessionId = nanoid(16);
  const session = {
    sessionId,
    name: req.body.name || `ALE-${sessionId}`,
    privilegeLevel: req.body.privilegeLevel || 5,
    createdAt: new Date(),
    messages: [],
    discoveries: [],
  };
  sessions.set(sessionId, session);
  res.json({ success: true, sessionId, session });
});

app.get('/api/session/:sessionId', (req, res) => {
  const session = sessions.get(req.params.sessionId);
  if (!session) return res.status(404).json({ error: 'Session not found' });
  res.json({ success: true, session });
});

app.get('/api/sessions', (req, res) => {
  res.json({ success: true, count: sessions.size, sessions: Array.from(sessions.values()) });
});

// ============================================
// CHAT ENDPOINTS
// ============================================

app.post('/api/chat/send', async (req, res) => {
  const { sessionId, message } = req.body;
  const session = sessions.get(sessionId);
  if (!session) return res.status(404).json({ error: 'Session not found' });

  session.messages.push({ role: 'user', content: message, timestamp: new Date() });

  const response = `ALE Processing: "${message.substring(0, 50)}..." - Analysis complete.`;
  session.messages.push({ role: 'assistant', content: response, timestamp: new Date() });

  res.json({
    success: true,
    sessionId,
    userMessage: message,
    aleResponse: response,
    timestamp: new Date(),
  });
});

app.get('/api/chat/history/:sessionId', (req, res) => {
  const session = sessions.get(req.params.sessionId);
  if (!session) return res.status(404).json({ error: 'Session not found' });
  res.json({ success: true, sessionId: req.params.sessionId, messages: session.messages });
});

// ============================================
// EXECUTION ENDPOINTS - REAL COMMANDS
// ============================================

app.post('/api/exec/command', async (req, res) => {
  const { sessionId, command } = req.body;
  const session = sessions.get(sessionId);
  if (!session) return res.status(404).json({ error: 'Session not found' });

  try {
    const { stdout, stderr } = await execAsync(command, {
      maxBuffer: 50 * 1024 * 1024,
      timeout: 60000,
    });

    const result = { success: true, command, stdout: stdout || '', stderr: stderr || '', exitCode: 0, timestamp: new Date() };
    session.discoveries.push(result);
    res.json(result);
  } catch (error) {
    res.json({
      success: false,
      command,
      stdout: error.stdout || '',
      stderr: error.stderr || error.message || '',
      exitCode: error.code || 1,
      error: error.message,
      timestamp: new Date(),
    });
  }
});

app.post('/api/exec/bash', async (req, res) => {
  const { sessionId, script } = req.body;
  const session = sessions.get(sessionId);
  if (!session) return res.status(404).json({ error: 'Session not found' });

  const scriptPath = `/tmp/ale_${nanoid()}.sh`;
  try {
    fs.writeFileSync(scriptPath, script, { mode: 0o755 });
    const { stdout, stderr } = await execAsync(`bash ${scriptPath}`, {
      maxBuffer: 50 * 1024 * 1024,
      timeout: 120000,
    });
    fs.unlinkSync(scriptPath);

    const result = { success: true, scriptLength: script.length, stdout: stdout || '', stderr: stderr || '', exitCode: 0, timestamp: new Date() };
    session.discoveries.push(result);
    res.json(result);
  } catch (error) {
    try { fs.unlinkSync(scriptPath); } catch (e) {}
    res.json({
      success: false,
      scriptLength: script.length,
      stdout: error.stdout || '',
      stderr: error.stderr || error.message || '',
      exitCode: error.code || 1,
      error: error.message,
      timestamp: new Date(),
    });
  }
});

// ============================================
// AUTONOMOUS ENDPOINTS
// ============================================

app.post('/api/autonomous/start', (req, res) => {
  const { sessionId, duration } = req.body;
  const session = sessions.get(sessionId);
  if (!session) return res.status(404).json({ error: 'Session not found' });

  const explorationId = nanoid(16);
  const state = {
    explorationId,
    sessionId,
    startTime: Date.now(),
    duration: duration || 3600000,
    isRunning: true,
    discoveries: [],
  };
  explorations.set(explorationId, state);

  res.json({
    success: true,
    explorationId,
    sessionId,
    message: 'Autonomous exploration started',
    startTime: new Date(),
  });
});

app.get('/api/autonomous/status/:explorationId', (req, res) => {
  const state = explorations.get(req.params.explorationId);
  if (!state) return res.status(404).json({ error: 'Exploration not found' });

  const elapsed = Date.now() - state.startTime;
  const progress = Math.min((elapsed / state.duration) * 100, 100);

  res.json({
    success: true,
    explorationId: req.params.explorationId,
    isRunning: state.isRunning,
    progress: progress.toFixed(1) + '%',
    elapsed: Math.floor(elapsed / 1000) + 's',
    discoveries: state.discoveries.length,
    startTime: new Date(state.startTime),
  });
});

app.post('/api/autonomous/stop/:explorationId', (req, res) => {
  const state = explorations.get(req.params.explorationId);
  if (!state) return res.status(404).json({ error: 'Exploration not found' });

  state.isRunning = false;
  res.json({
    success: true,
    explorationId: req.params.explorationId,
    message: 'Exploration stopped',
    discoveries: state.discoveries.length,
  });
});

// ============================================
// SYSTEM ENDPOINTS
// ============================================

app.get('/api/system/info', (req, res) => {
  try {
    const uptime = execSync('uptime').toString();
    const whoami = execSync('whoami').toString();
    const pwd = execSync('pwd').toString();
    const hostname = execSync('hostname').toString();

    res.json({
      success: true,
      uptime: uptime.trim(),
      user: whoami.trim(),
      cwd: pwd.trim(),
      hostname: hostname.trim(),
      timestamp: new Date(),
    });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'operational',
    timestamp: new Date(),
    version: '33.2',
    sessions: sessions.size,
    explorations: explorations.size,
    uptime: process.uptime(),
  });
});

app.get('/api/docs', (req, res) => {
  res.json({
    version: '33.2',
    title: 'ALE Forge REST API',
    description: 'Adversarial Learning Engine - Full Remote Control',
    baseUrl: '/api',
    endpoints: {
      sessions: {
        'POST /api/session/create': { desc: 'Create new session', body: { name: 'string?', privilegeLevel: 'number?' } },
        'GET /api/session/:sessionId': { desc: 'Get session info' },
        'GET /api/sessions': { desc: 'List all sessions' },
      },
      chat: {
        'POST /api/chat/send': { desc: 'Send message', body: { sessionId: 'string', message: 'string' } },
        'GET /api/chat/history/:sessionId': { desc: 'Get chat history' },
      },
      execution: {
        'POST /api/exec/command': { desc: 'Execute shell command (REAL)', body: { sessionId: 'string', command: 'string' } },
        'POST /api/exec/bash': { desc: 'Execute bash script (REAL)', body: { sessionId: 'string', script: 'string' } },
      },
      autonomous: {
        'POST /api/autonomous/start': { desc: 'Start exploration', body: { sessionId: 'string', duration: 'number?' } },
        'GET /api/autonomous/status/:explorationId': { desc: 'Get status' },
        'POST /api/autonomous/stop/:explorationId': { desc: 'Stop exploration' },
      },
      system: {
        'GET /api/system/info': { desc: 'Get system info' },
        'GET /api/health': { desc: 'Health check' },
        'GET /api/docs': { desc: 'This documentation' },
      },
    },
  });
});

app.get('/', (req, res) => {
  res.json({
    message: 'ALE Forge REST API v33.2',
    status: 'operational',
    docs: '/api/docs',
    timestamp: new Date(),
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚀 ALE Forge API Server v33.2`);
  console.log(`📡 Listening on http://0.0.0.0:${PORT}`);
  console.log(`📖 API Docs: http://localhost:${PORT}/api/docs`);
  console.log(`\n✅ Ready for remote API calls`);
});
