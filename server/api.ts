/**
 * STANDALONE REST API SERVER
 * Real command execution - NO SIMULATION
 * Full remote control via HTTP
 */

import express, { Express, Request, Response } from 'express';
import { exec, execSync } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';
import { nanoid } from 'nanoid';

const execAsync = promisify(exec);

// Session storage (in-memory)
const sessions = new Map<string, any>();
const explorationState = new Map<string, any>();

export function createApiServer(): Express {
  const app = express();

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // Enable CORS
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') {
      res.sendStatus(200);
    } else {
      next();
    }
  });

  // ============================================
  // SESSION ENDPOINTS
  // ============================================

  // Create session
  app.post('/api/session/create', (req: Request, res: Response) => {
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

  // Get session
  app.get('/api/session/:sessionId', (req: Request, res: Response) => {
    const session = sessions.get(req.params.sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    res.json({ success: true, session });
  });

  // List sessions
  app.get('/api/sessions', (req: Request, res: Response) => {
    const allSessions = Array.from(sessions.values());
    res.json({ success: true, count: allSessions.length, sessions: allSessions });
  });

  // ============================================
  // CHAT ENDPOINTS
  // ============================================

  // Send message
  app.post('/api/chat/send', async (req: Request, res: Response) => {
    const { sessionId, message } = req.body;
    const session = sessions.get(sessionId);

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Store user message
    session.messages.push({
      role: 'user',
      content: message,
      timestamp: new Date(),
    });

    // Generate response (mock for now, can integrate with LLM)
    const response = `ALE Processing: "${message}" - Analysis complete.`;

    session.messages.push({
      role: 'assistant',
      content: response,
      timestamp: new Date(),
    });

    res.json({
      success: true,
      sessionId,
      userMessage: message,
      aleResponse: response,
      timestamp: new Date(),
    });
  });

  // Get chat history
  app.get('/api/chat/history/:sessionId', (req: Request, res: Response) => {
    const session = sessions.get(req.params.sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    res.json({
      success: true,
      sessionId: req.params.sessionId,
      messages: session.messages,
    });
  });

  // ============================================
  // EXECUTION ENDPOINTS - REAL COMMANDS
  // ============================================

  // Execute command (NO SIMULATION)
  app.post('/api/exec/command', async (req: Request, res: Response) => {
    const { sessionId, command, privilegeLevel } = req.body;
    const session = sessions.get(sessionId);

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    try {
      // REAL EXECUTION - NO SIMULATION
      const { stdout, stderr } = await execAsync(command, {
        maxBuffer: 10 * 1024 * 1024,
        timeout: 30000,
      });

      const result = {
        success: true,
        command,
        stdout: stdout || '',
        stderr: stderr || '',
        exitCode: 0,
        timestamp: new Date(),
      };

      session.discoveries.push(result);
      res.json(result);
    } catch (error: any) {
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

  // Execute with sudo
  app.post('/api/exec/sudo', async (req: Request, res: Response) => {
    const { sessionId, command } = req.body;
    const session = sessions.get(sessionId);

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    try {
      // REAL SUDO EXECUTION
      const { stdout, stderr } = await execAsync(`sudo ${command}`, {
        maxBuffer: 10 * 1024 * 1024,
        timeout: 30000,
      });

      const result = {
        success: true,
        command: `sudo ${command}`,
        stdout: stdout || '',
        stderr: stderr || '',
        exitCode: 0,
        timestamp: new Date(),
      };

      session.discoveries.push(result);
      res.json(result);
    } catch (error: any) {
      res.json({
        success: false,
        command: `sudo ${command}`,
        stdout: error.stdout || '',
        stderr: error.stderr || error.message || '',
        exitCode: error.code || 1,
        error: error.message,
        timestamp: new Date(),
      });
    }
  });

  // Execute bash script
  app.post('/api/exec/bash', async (req: Request, res: Response) => {
    const { sessionId, script } = req.body;
    const session = sessions.get(sessionId);

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const scriptPath = `/tmp/ale_script_${nanoid()}.sh`;

    try {
      // Write script
      fs.writeFileSync(scriptPath, script, { mode: 0o755 });

      // REAL EXECUTION
      const { stdout, stderr } = await execAsync(`bash ${scriptPath}`, {
        maxBuffer: 10 * 1024 * 1024,
        timeout: 60000,
      });

      fs.unlinkSync(scriptPath);

      const result = {
        success: true,
        scriptLength: script.length,
        stdout: stdout || '',
        stderr: stderr || '',
        exitCode: 0,
        timestamp: new Date(),
      };

      session.discoveries.push(result);
      res.json(result);
    } catch (error: any) {
      try {
        fs.unlinkSync(scriptPath);
      } catch (e) {}

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

  // Start autonomous exploration
  app.post('/api/autonomous/start', (req: Request, res: Response) => {
    const { sessionId, duration } = req.body;
    const session = sessions.get(sessionId);

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const explorationId = nanoid(16);
    const state = {
      explorationId,
      sessionId,
      startTime: Date.now(),
      duration: duration || 3600000, // 1 hour default
      isRunning: true,
      discoveries: [],
      commands: [],
    };

    explorationState.set(explorationId, state);

    res.json({
      success: true,
      explorationId,
      sessionId,
      message: 'Autonomous exploration started',
      startTime: new Date(),
    });
  });

  // Get exploration status
  app.get('/api/autonomous/status/:explorationId', (req: Request, res: Response) => {
    const state = explorationState.get(req.params.explorationId);

    if (!state) {
      return res.status(404).json({ error: 'Exploration not found' });
    }

    const elapsed = Date.now() - state.startTime;
    const progress = Math.min((elapsed / state.duration) * 100, 100);

    res.json({
      success: true,
      explorationId: req.params.explorationId,
      isRunning: state.isRunning,
      progress: progress.toFixed(1) + '%',
      elapsed: Math.floor(elapsed / 1000) + 's',
      discoveries: state.discoveries.length,
      commands: state.commands.length,
      startTime: new Date(state.startTime),
    });
  });

  // Stop exploration
  app.post('/api/autonomous/stop/:explorationId', (req: Request, res: Response) => {
    const state = explorationState.get(req.params.explorationId);

    if (!state) {
      return res.status(404).json({ error: 'Exploration not found' });
    }

    state.isRunning = false;

    res.json({
      success: true,
      explorationId: req.params.explorationId,
      message: 'Exploration stopped',
      discoveries: state.discoveries.length,
      commands: state.commands.length,
    });
  });

  // Get discoveries
  app.get('/api/autonomous/discoveries/:explorationId', (req: Request, res: Response) => {
    const state = explorationState.get(req.params.explorationId);

    if (!state) {
      return res.status(404).json({ error: 'Exploration not found' });
    }

    res.json({
      success: true,
      explorationId: req.params.explorationId,
      count: state.discoveries.length,
      discoveries: state.discoveries,
    });
  });

  // ============================================
  // SYSTEM ENDPOINTS
  // ============================================

  // System info
  app.get('/api/system/info', (req: Request, res: Response) => {
    try {
      const uptime = execSync('uptime').toString();
      const uname = execSync('uname -a').toString();
      const whoami = execSync('whoami').toString();
      const pwd = execSync('pwd').toString();

      res.json({
        success: true,
        uptime: uptime.trim(),
        system: uname.trim(),
        user: whoami.trim(),
        cwd: pwd.trim(),
        timestamp: new Date(),
      });
    } catch (error: any) {
      res.json({ success: false, error: error.message });
    }
  });

  // Health check
  app.get('/api/health', (req: Request, res: Response) => {
    res.json({
      status: 'operational',
      timestamp: new Date(),
      version: '33.1',
      sessions: sessions.size,
      explorations: explorationState.size,
    });
  });

  // API documentation
  app.get('/api/docs', (req: Request, res: Response) => {
    res.json({
      version: '33.1',
      title: 'ALE Forge REST API',
      description: 'Adversarial Learning Engine - Full Remote Control',
      baseUrl: '/api',
      endpoints: {
        sessions: {
          'POST /api/session/create': 'Create new session',
          'GET /api/session/:sessionId': 'Get session info',
          'GET /api/sessions': 'List all sessions',
        },
        chat: {
          'POST /api/chat/send': 'Send message to ALE',
          'GET /api/chat/history/:sessionId': 'Get chat history',
        },
        execution: {
          'POST /api/exec/command': 'Execute shell command (REAL)',
          'POST /api/exec/sudo': 'Execute with sudo (REAL)',
          'POST /api/exec/bash': 'Execute bash script (REAL)',
        },
        autonomous: {
          'POST /api/autonomous/start': 'Start exploration',
          'GET /api/autonomous/status/:explorationId': 'Get status',
          'POST /api/autonomous/stop/:explorationId': 'Stop exploration',
          'GET /api/autonomous/discoveries/:explorationId': 'Get discoveries',
        },
        system: {
          'GET /api/system/info': 'Get system information',
          'GET /api/health': 'Health check',
          'GET /api/docs': 'API documentation',
        },
      },
    });
  });

  // Default route
  app.get('/', (req: Request, res: Response) => {
    res.json({
      message: 'ALE Forge REST API v33.1',
      status: 'operational',
      docs: '/api/docs',
    });
  });

  return app;
}

export default createApiServer;
