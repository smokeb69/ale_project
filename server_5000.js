/**
 * KIMI SWARM 5000 SERVER
 * 
 * Standalone Express server that:
 * - Serves the SWARM_5000.html on port 5000
 * - Provides API endpoints for the swarm
 * - Handles real-time updates via SSE
 * - Uses the MegaSwarmEngine for backend logic
 */

const express = require('express');
const path = require('path');
const fs = require('fs');
const http = require('http');

const app = express();
const server = http.createServer(app);
const PORT = 5000;

// Middleware
app.use(express.json());
app.use(express.static('.'));

// Store for active sessions
const sessions = new Map();
let taskCounter = 1;

// ============================================================================
// AGENT DATA - 19 ROLES
// ============================================================================

const AGENT_TEMPLATES = {
  // Core
  Architect: { skills: ['design', 'architecture'], spec: ['microservices', 'security'] },
  Builder: { skills: ['coding', 'implementation'], spec: ['rust', 'performance'] },
  Verifier: { skills: ['testing', 'audit'], spec: ['fuzzing', 'sast'] },
  Scribe: { skills: ['docs', 'analysis'], spec: ['threat-intel', 'reporting'] },
  // Red Team
  Infiltrator: { skills: ['recon', 'social-engineering'], spec: ['phishing', 'pretexting'] },
  ExploitDev: { skills: ['exploit-writing', 'shellcoding'], spec: ['0day', 'buffer-overflow'] },
  PayloadSmith: { skills: ['evasion', 'encoding'], spec: ['polymorphic', 'packing'] },
  C2Operator: { skills: ['c2', 'tunneling'], spec: ['dns-tunneling', 'domain-fronting'] },
  // Blue Team
  Sentinel: { skills: ['monitoring', 'detection'], spec: ['edr', 'siem'] },
  Forensics: { skills: ['memory-analysis', 'artifacts'], spec: ['volatility', 'timeline'] },
  ThreatHunter: { skills: ['hunting', 'ioc-analysis'], spec: ['mitre-attack', 'apt-tracking'] },
  BlueTeamLead: { skills: ['ir', 'coordination'], spec: ['tabletop', 'purple-team'] },
  // Analysis
  ReverseEngineer: { skills: ['disassembly', 'unpacking'], spec: ['ida-pro', 'ghidra'] },
  MalwareAnalyst: { skills: ['static-analysis', 'sandboxing'], spec: ['ransomware', 'banking-trojans'] },
  OSINTCollector: { skills: ['recon', 'correlation'], spec: ['shodan', 'maltego'] },
  // Support
  Optimizer: { skills: ['profiling', 'tuning'], spec: ['parallelization', 'caching'] },
  Refactorer: { skills: ['cleanup', 'migration'], spec: ['legacy', 'patterns'] },
  DocMaster: { skills: ['api-docs', 'diagrams'], spec: ['openapi', 'markdown'] },
  TestEngineer: { skills: ['unit-tests', 'chaos'], spec: ['tdd', 'property-testing'] },
};

// ============================================================================
// SWARM ENGINE
// ============================================================================

class SwarmSession {
  constructor(id, name) {
    this.id = id;
    this.name = name;
    this.agents = [];
    this.tasks = [];
    this.files = new Map();
    this.stats = {
      tasksCompleted: 0,
      tasksFailed: 0,
      linesGenerated: 0,
    };
    this.createdAt = new Date();
    
    // Spawn initial agents
    this.spawnAgent('Architect');
    this.spawnAgent('Builder');
    this.spawnAgent('Verifier');
    this.spawnAgent('ExploitDev');
    this.spawnAgent('Sentinel');
  }
  
  spawnAgent(role) {
    const template = AGENT_TEMPLATES[role];
    if (!template) return null;
    
    const agent = {
      id: `A${this.agents.length + 1}`,
      name: `${role}-${this.agents.filter(a => a.role === role).length + 1}`,
      role,
      status: 'idle',
      skills: template.skills,
      specialization: template.spec,
      performance: { tasksCompleted: 0, successRate: 1.0 },
      lastActivity: new Date(),
    };
    
    this.agents.push(agent);
    return agent;
  }
  
  enqueueTask(text, priority = 'medium', metadata = {}) {
    const task = {
      id: `T${taskCounter++}`,
      text,
      priority,
      status: 'pending',
      createdAt: new Date(),
      metadata,
    };
    
    // Priority queue insertion
    const priorityOrder = { emergency: 0, critical: 1, high: 2, medium: 3, low: 4 };
    const insertIndex = this.tasks.findIndex(t => priorityOrder[t.priority] > priorityOrder[priority]);
    
    if (insertIndex === -1) {
      this.tasks.push(task);
    } else {
      this.tasks.splice(insertIndex, 0, task);
    }
    
    return task;
  }
  
  processTask() {
    if (this.tasks.length === 0) return null;
    
    const task = this.tasks.shift();
    const agent = this.agents.find(a => a.status === 'idle') || this.agents[0];
    
    agent.status = 'busy';
    agent.currentTask = task.id;
    task.status = 'in_progress';
    task.startedAt = new Date();
    
    // Simulate processing
    setTimeout(() => {
      agent.status = 'done';
      task.status = 'completed';
      task.completedAt = new Date();
      this.stats.tasksCompleted++;
      
      setTimeout(() => {
        agent.status = 'idle';
        agent.currentTask = null;
      }, 1000);
    }, 2000);
    
    return { task, agent };
  }
  
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      agents: this.agents,
      tasks: this.tasks,
      stats: this.stats,
      createdAt: this.createdAt,
    };
  }
}

// ============================================================================
// ROUTES
// ============================================================================

// Main HTML page
app.get('/', (req, res) => {
  const htmlPath = path.join(__dirname, 'SWARM_5000.html');
  if (fs.existsSync(htmlPath)) {
    res.sendFile(htmlPath);
  } else {
    res.status(404).send('SWARM_5000.html not found');
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'operational',
    port: PORT,
    version: '5000.0.1',
    timestamp: new Date().toISOString(),
  });
});

// Session management
app.post('/api/session/create', (req, res) => {
  const id = `session-${Date.now()}`;
  const name = req.body.name || `Swarm-${id.slice(-6)}`;
  const session = new SwarmSession(id, name);
  sessions.set(id, session);
  
  console.log(`[SWARM] Session created: ${name} (${id})`);
  res.json(session.toJSON());
});

app.get('/api/session/:id', (req, res) => {
  const session = sessions.get(req.params.id);
  if (!session) return res.status(404).json({ error: 'Session not found' });
  res.json(session.toJSON());
});

// Agent management
app.post('/api/session/:id/agent/spawn', (req, res) => {
  const session = sessions.get(req.params.id);
  if (!session) return res.status(404).json({ error: 'Session not found' });
  
  const { role } = req.body;
  const agent = session.spawnAgent(role);
  if (!agent) return res.status(400).json({ error: 'Invalid role' });
  
  console.log(`[SWARM] Agent spawned: ${agent.name} (${agent.role})`);
  res.json(agent);
});

// Task management
app.post('/api/session/:id/task/enqueue', (req, res) => {
  const session = sessions.get(req.params.id);
  if (!session) return res.status(404).json({ error: 'Session not found' });
  
  const { text, priority, metadata } = req.body;
  const task = session.enqueueTask(text, priority, metadata);
  
  console.log(`[SWARM] Task enqueued: ${text} [${priority}]`);
  res.json(task);
});

app.post('/api/session/:id/task/process', (req, res) => {
  const session = sessions.get(req.params.id);
  if (!session) return res.status(404).json({ error: 'Session not found' });
  
  const result = session.processTask();
  if (!result) return res.json({ message: 'No tasks in queue' });
  
  res.json(result);
});

// File management
app.post('/api/session/:id/file/create', (req, res) => {
  const session = sessions.get(req.params.id);
  if (!session) return res.status(404).json({ error: 'Session not found' });
  
  const { name, content } = req.body;
  const ext = name.split('.').pop();
  const langMap = {
    js: 'javascript', py: 'python', ts: 'typescript', rs: 'rust',
    go: 'go', cpp: 'cpp', c: 'c', java: 'java',
    html: 'html', css: 'css', json: 'json', md: 'markdown',
  };
  
  const file = {
    name,
    content,
    language: langMap[ext] || 'text',
    createdAt: new Date(),
    version: 1,
  };
  
  session.files.set(name, file);
  session.stats.linesGenerated += content.split('\n').length;
  
  console.log(`[SWARM] File created: ${name}`);
  res.json(file);
});

// Global stats
app.get('/api/stats', (req, res) => {
  const stats = {
    sessions: sessions.size,
    totalAgents: Array.from(sessions.values()).reduce((sum, s) => sum + s.agents.length, 0),
    totalTasks: Array.from(sessions.values()).reduce((sum, s) => sum + s.stats.tasksCompleted, 0),
    totalLines: Array.from(sessions.values()).reduce((sum, s) => sum + s.stats.linesGenerated, 0),
    uptime: process.uptime(),
  };
  res.json(stats);
});

// SSE for real-time updates
app.get('/api/events/:sessionId', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  
  const sessionId = req.params.sessionId;
  
  const interval = setInterval(() => {
    const session = sessions.get(sessionId);
    if (session) {
      res.write(`data: ${JSON.stringify({
        timestamp: new Date().toISOString(),
        agents: session.agents.map(a => ({ id: a.id, status: a.status })),
        tasks: session.tasks.length,
      })}\n\n`);
    }
  }, 2000);
  
  req.on('close', () => {
    clearInterval(interval);
  });
});

// ============================================================================
// START SERVER
// ============================================================================

server.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║           🐝 KIMI SWARM 5000 - ULTIMATE EDITION 🐝          ║
║                                                              ║
║                    Server running on port ${PORT}               ║
║                                                              ║
║  📍 http://localhost:${PORT}                                ║
║                                                              ║
║  Features:                                                   ║
║  • 19 Agent Roles                                            ║
║  • 12 Attack Frameworks                                      ║
║  • Real-time Swarm Engine                                    ║
║  • Interactive Dashboard                                     ║
║  • ~4,600 lines of attack code                               ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
  `);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('\n[SWARM] Shutting down gracefully...');
  server.close(() => {
    console.log('[SWARM] Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('\n[SWARM] Shutting down gracefully...');
  server.close(() => {
    console.log('[SWARM] Server closed');
    process.exit(0);
  });
});
