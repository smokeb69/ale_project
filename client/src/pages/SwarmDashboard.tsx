/**
 * Kimi Swarm Visual Dashboard
 * 
 * A stunning visual interface for the swarm system with:
 * - Real-time agent grid visualization
 * - Animated task queue
 * - Vault artifact display
 * - Attack surface metrics
 * - Terminal-style logging
 */

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Bot, Play, Pause, Plus, Terminal, Shield, Cpu, 
  Lock, FileText, Zap, Target, Activity, Globe, 
  Key, Eye, EyeOff, Radio, Clock, AlertTriangle,
  CheckCircle, XCircle, Loader2, Server, Code2,
  Binary, Network, Fingerprint, Sparkles
} from 'lucide-react';

// Types
interface Agent {
  id: string;
  name: string;
  role: string;
  status: 'idle' | 'busy' | 'done' | 'error';
  currentTask?: string;
  skills: string[];
  lastActivity: Date;
}

interface Task {
  id: string;
  text: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  assignedTo?: string;
}

interface VaultItem {
  key: string;
  name: string;
  size: string;
  type: 'encrypted' | 'plaintext' | 'binary';
  classification: string;
}

interface AttackSurface {
  name: string;
  lines: number;
  vectors: string[];
  status: 'active' | 'generating' | 'complete';
  icon: React.ReactNode;
}

interface LogEntry {
  timestamp: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
}

// Mock data for demonstration
const MOCK_AGENTS: Agent[] = [
  { id: 'A1', name: 'Architect', role: 'Planner', status: 'done', skills: ['design', 'architecture'], lastActivity: new Date() },
  { id: 'A2', name: 'Builder', role: 'Coder', status: 'busy', currentTask: 'Indexing vault...', skills: ['coding', 'implementation'], lastActivity: new Date() },
  { id: 'A3', name: 'Tester', role: 'QA', status: 'idle', skills: ['testing', 'validation'], lastActivity: new Date() },
  { id: 'A4', name: 'Ops', role: 'Deploy', status: 'idle', skills: ['infrastructure', 'monitoring'], lastActivity: new Date() },
  { id: 'A5', name: 'Verifier', role: 'Security', status: 'idle', skills: ['audit', 'opsec'], lastActivity: new Date() },
  { id: 'A6', name: 'Scribe', role: 'Docs', status: 'idle', skills: ['documentation', 'analysis'], lastActivity: new Date() },
  { id: 'A7', name: 'Agent-5', role: 'Architect', status: 'idle', skills: ['attack-chains'], lastActivity: new Date() },
  { id: 'A8', name: 'Agent-6', role: 'Coder', status: 'done', currentTask: 'Defensive testing complete', skills: ['exploit-dev'], lastActivity: new Date() },
];

const MOCK_TASKS: Task[] = [
  { id: 'T1', text: 'Audit system_exploit_suite.py for detection evasion', priority: 'critical', status: 'pending' },
  { id: 'T2', text: 'Generate polymorphic payload variants', priority: 'high', status: 'pending' },
  { id: 'T3', text: 'Build C2 communication protocol', priority: 'high', status: 'pending' },
  { id: 'T4', text: 'Deobfuscate reverse_engineering.py strings', priority: 'medium', status: 'pending' },
  { id: 'T5', text: 'Document TTPs for MITRE ATT&CK mapping', priority: 'low', status: 'pending' },
];

const MOCK_VAULT: VaultItem[] = [
  { key: 'V1', name: '0day_exploit.bin', size: '1,024 B', type: 'encrypted', classification: 'ZERO DAY' },
  { key: 'V2', name: 'c2_config.enc', size: '512 B', type: 'encrypted', classification: 'C2 CONFIG' },
  { key: 'V3', name: 'target_list.txt', size: '256 B', type: 'plaintext', classification: 'TARGET INTEL' },
];

const ATTACK_SURFACES: AttackSurface[] = [
  { name: 'web_attack_suite.py', lines: 400, vectors: ['SQLi', 'XSS', 'LFI', 'CSRF'], status: 'complete', icon: <Globe className="w-5 h-5" /> },
  { name: 'network_attack_suite.py', lines: 350, vectors: ['Port Scan', 'SMB', 'DNS Amp'], status: 'complete', icon: <Network className="w-5 h-5" /> },
  { name: 'crypto_attack_suite.py', lines: 300, vectors: ['Hash Crack', 'JWT', 'Oracle'], status: 'complete', icon: <Key className="w-5 h-5" /> },
  { name: 'system_exploit_suite.py', lines: 450, vectors: ['PrivEsc', 'Persistence', 'CTE'], status: 'complete', icon: <Server className="w-5 h-5" /> },
  { name: 'defensive_suite.py', lines: 400, vectors: ['IDS', 'IR', 'Threat Hunt'], status: 'complete', icon: <Shield className="w-5 h-5" /> },
  { name: 'reverse_engineering.py', lines: 350, vectors: ['PE/ELF', 'Strings', 'Shellcode'], status: 'complete', icon: <Binary className="w-5 h-5" /> },
];

const INITIAL_LOGS: LogEntry[] = [
  { timestamp: '07:14:17', message: 'Session created: Red Team Swarm - Full Spectrum', type: 'info' },
  { timestamp: '07:14:18', message: 'Spawned 6 specialized agents', type: 'success' },
  { timestamp: '07:14:18', message: 'Created web_attack_suite.py - Web exploitation framework', type: 'success' },
  { timestamp: '07:14:19', message: 'Created network_attack_suite.py - Network exploitation framework', type: 'success' },
  { timestamp: '07:14:19', message: 'Created crypto_attack_suite.py - Cryptographic attack framework', type: 'success' },
  { timestamp: '07:14:19', message: 'Created system_exploit_suite.py - System exploitation framework', type: 'success' },
  { timestamp: '07:14:19', message: 'Created defensive_suite.py - Defensive security framework', type: 'success' },
  { timestamp: '07:14:19', message: 'Created reverse_engineering.py - Reverse engineering framework', type: 'success' },
  { timestamp: '07:14:19', message: 'Queued 20 attack tasks', type: 'info' },
  { timestamp: '07:14:39', message: 'Architect → Auditing system_exploit_suite.py for detection evasion...', type: 'info' },
  { timestamp: '07:14:51', message: 'Agent-6 (Coder) → Testing defensive_suite.py detection capabilities...', type: 'info' },
  { timestamp: '07:14:58', message: 'Builder → Indexing vault artifacts...', type: 'info' },
];

// Component: Agent Status Badge
function AgentStatusBadge({ status }: { status: Agent['status'] }) {
  const colors = {
    idle: 'bg-slate-500',
    busy: 'bg-amber-500 animate-pulse',
    done: 'bg-emerald-500',
    error: 'bg-red-500',
  };
  
  const labels = {
    idle: 'IDLE',
    busy: 'BUSY',
    done: 'DONE',
    error: 'ERROR',
  };
  
  return (
    <div className="flex items-center gap-1.5">
      <div className={`w-2 h-2 rounded-full ${colors[status]}`} />
      <span className="text-[10px] font-mono text-slate-400">{labels[status]}</span>
    </div>
  );
}

// Component: Priority Badge
function PriorityBadge({ priority }: { priority: Task['priority'] }) {
  const colors = {
    critical: 'bg-red-500/20 text-red-400 border-red-500/50',
    high: 'bg-orange-500/20 text-orange-400 border-orange-500/50',
    medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50',
    low: 'bg-blue-500/20 text-blue-400 border-blue-500/50',
  };
  
  return (
    <span className={`px-1.5 py-0.5 text-[10px] font-mono border rounded ${colors[priority]}`}>
      {priority.toUpperCase()}
    </span>
  );
}

// Component: Vault Item
function VaultItemCard({ item }: { item: VaultItem }) {
  const isEncrypted = item.type === 'encrypted';
  
  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-slate-900/50 border border-slate-800 hover:border-slate-600 transition-colors">
      <div className="flex items-center gap-3">
        {isEncrypted ? (
          <Lock className="w-4 h-4 text-violet-400" />
        ) : (
          <FileText className="w-4 h-4 text-slate-400" />
        )}
        <div>
          <div className="text-xs font-mono text-slate-200">{item.name}</div>
          <div className="text-[10px] text-slate-500">{item.size}</div>
        </div>
      </div>
      <Badge 
        variant="outline" 
        className={`text-[10px] ${isEncrypted ? 'border-violet-500/50 text-violet-400' : 'border-slate-600 text-slate-400'}`}
      >
        {isEncrypted ? '🔒 ENCRYPTED' : '📄 PLAINTEXT'}
      </Badge>
    </div>
  );
}

// Component: Attack Surface Card
function AttackSurfaceCard({ surface }: { surface: AttackSurface }) {
  return (
    <div className="p-4 rounded-lg bg-slate-900/30 border border-slate-800 hover:border-cyan-500/30 transition-all group">
      <div className="flex items-start justify-between mb-3">
        <div className="p-2 rounded bg-slate-800/50 text-cyan-400 group-hover:text-cyan-300 group-hover:bg-cyan-950/30 transition-colors">
          {surface.icon}
        </div>
        <Badge variant="outline" className="text-[10px] border-emerald-500/30 text-emerald-400">
          ✅ {surface.status.toUpperCase()}
        </Badge>
      </div>
      
      <div className="font-mono text-sm text-slate-200 mb-2 truncate">{surface.name}</div>
      
      <div className="flex items-center gap-2 text-[10px] text-slate-500 mb-3">
        <Code2 className="w-3 h-3" />
        <span>{surface.lines} lines</span>
      </div>
      
      <div className="flex flex-wrap gap-1">
        {surface.vectors.map((vector, i) => (
          <span 
            key={i} 
            className="px-1.5 py-0.5 text-[10px] rounded bg-slate-800 text-slate-400"
          >
            {vector}
          </span>
        ))}
      </div>
    </div>
  );
}

// Main Dashboard Component
export default function SwarmDashboard() {
  const [autopilotActive, setAutopilotActive] = useState(true);
  const [tasksCompleted, setTasksCompleted] = useState(5);
  const [totalTasks] = useState(20);
  const [logs, setLogs] = useState<LogEntry[]>(INITIAL_LOGS);
  const [showVault, setShowVault] = useState(true);
  const logEndRef = useRef<HTMLDivElement>(null);
  
  // Auto-scroll logs
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);
  
  // Simulate live updates
  useEffect(() => {
    const interval = setInterval(() => {
      if (autopilotActive && Math.random() > 0.7) {
        const newLog: LogEntry = {
          timestamp: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          message: `Agent-${Math.floor(Math.random() * 10) + 1} → Processing task queue...`,
          type: 'info',
        };
        setLogs(prev => [...prev.slice(-50), newLog]);
      }
    }, 3000);
    
    return () => clearInterval(interval);
  }, [autopilotActive]);
  
  const getLogColor = (type: LogEntry['type']) => {
    switch (type) {
      case 'success': return 'text-emerald-400';
      case 'warning': return 'text-amber-400';
      case 'error': return 'text-red-400';
      default: return 'text-cyan-400';
    }
  };
  
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 font-mono">
      {/* Header */}
      <header className="mb-6 border-b border-slate-800 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-cyan-500/20 to-violet-500/20 border border-cyan-500/30">
              <Bot className="w-8 h-8 text-cyan-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-violet-400 bg-clip-text text-transparent">
                KIMI SWARM AUTONOMOUS CODER
              </h1>
              <p className="text-sm text-slate-500">Session: Red Team Swarm - Full Spectrum</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-900/50 border border-slate-800">
              <Radio className={`w-4 h-4 ${autopilotActive ? 'text-emerald-400 animate-pulse' : 'text-slate-500'}`} />
              <span className="text-sm text-slate-400">
                AUTOPILOT: <span className={autopilotActive ? 'text-emerald-400' : 'text-amber-400'}>{autopilotActive ? 'ACTIVE' : 'PAUSED'}</span>
              </span>
            </div>
            <Button 
              size="sm" 
              variant={autopilotActive ? "destructive" : "default"}
              onClick={() => setAutopilotActive(!autopilotActive)}
              className="gap-2"
            >
              {autopilotActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              {autopilotActive ? 'STOP' : 'START'}
            </Button>
          </div>
        </div>
      </header>
      
      {/* Main Grid */}
      <div className="grid grid-cols-12 gap-4">
        
        {/* Agent Swarm Grid - 8 columns */}
        <div className="col-span-12 lg:col-span-8">
          <Card className="bg-slate-900/30 border-slate-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-mono flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-cyan-400" />
                  🎭 AGENT SWARM ({MOCK_AGENTS.length} Active Agents)
                </span>
                <Button size="sm" variant="ghost" className="h-8 gap-1">
                  <Plus className="w-4 h-4" /> SPAWN
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-3">
                {MOCK_AGENTS.map((agent) => (
                  <div 
                    key={agent.id}
                    className="p-3 rounded-lg bg-slate-950 border border-slate-800 hover:border-slate-700 transition-all"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-slate-200">{agent.name}</span>
                      <AgentStatusBadge status={agent.status} />
                    </div>
                    <div className="text-[10px] text-slate-500 mb-2">{agent.role}</div>
                    {agent.currentTask && (
                      <div className="text-[10px] text-amber-400 truncate">
                        → {agent.currentTask}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          
          {/* Task Queue */}
          <Card className="mt-4 bg-slate-900/30 border-slate-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-mono flex items-center gap-2">
                <Activity className="w-4 h-4 text-amber-400" />
                📦 TASK QUEUE ({MOCK_TASKS.length} remaining)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {MOCK_TASKS.map((task, i) => (
                  <div 
                    key={task.id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-slate-950 border border-slate-800"
                  >
                    <PriorityBadge priority={task.priority} />
                    <span className="text-xs text-slate-300 flex-1">{task.text}</span>
                    {i === 0 && (
                      <Loader2 className="w-4 h-4 text-amber-400 animate-spin" />
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          
          {/* Attack Surfaces */}
          <Card className="mt-4 bg-slate-900/30 border-slate-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-mono flex items-center gap-2">
                <Target className="w-4 h-4 text-red-400" />
                🎯 ATTACK SURFACES GENERATED
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-3">
                {ATTACK_SURFACES.map((surface) => (
                  <AttackSurfaceCard key={surface.name} surface={surface} />
                ))}
              </div>
              
              <div className="mt-4 p-3 rounded-lg bg-slate-950 border border-slate-800">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">Total Code Generated:</span>
                  <span className="font-bold text-emerald-400">~2,250 lines</span>
                </div>
                <Progress value={100} className="mt-2 h-2" />
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Right Sidebar - 4 columns */}
        <div className="col-span-12 lg:col-span-4 space-y-4">
          
          {/* Vault */}
          <Card className="bg-slate-900/30 border-slate-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-mono flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-violet-400" />
                  💼 VAULT ({MOCK_VAULT.length} Artifacts)
                </span>
                <Button 
                  size="icon" 
                  variant="ghost" 
                  className="h-8 w-8"
                  onClick={() => setShowVault(!showVault)}
                >
                  {showVault ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {showVault ? (
                <div className="space-y-2">
                  {MOCK_VAULT.map((item) => (
                    <VaultItemCard key={item.key} item={item} />
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center h-32 text-slate-500 text-sm">
                  <Lock className="w-8 h-8 mr-2" />
                  VAULT HIDDEN
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Progress Stats */}
          <Card className="bg-slate-900/30 border-slate-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-mono flex items-center gap-2">
                <Zap className="w-4 h-4 text-yellow-400" />
                📊 SWARM METRICS
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-400">Task Progress</span>
                  <span className="text-emerald-400">{tasksCompleted}/{totalTasks}</span>
                </div>
                <Progress value={(tasksCompleted / totalTasks) * 100} className="h-2" />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                  <div className="text-2xl font-bold text-cyan-400">10</div>
                  <div className="text-[10px] text-slate-500">ACTIVE AGENTS</div>
                </div>
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                  <div className="text-2xl font-bold text-amber-400">15</div>
                  <div className="text-[10px] text-slate-500">PENDING TASKS</div>
                </div>
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                  <div className="text-2xl font-bold text-emerald-400">6</div>
                  <div className="text-[10px] text-slate-500">FRAMEWORKS</div>
                </div>
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                  <div className="text-2xl font-bold text-violet-400">2.2k</div>
                  <div className="text-[10px] text-slate-500">LINES OF CODE</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Terminal Log */}
          <Card className="bg-slate-900/30 border-slate-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-mono flex items-center gap-2">
                <Terminal className="w-4 h-4 text-slate-400" />
                🧠 SWARM INTELLIGENCE LOG
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-64 rounded-lg bg-slate-950 border border-slate-800 p-3">
                <div className="space-y-1 text-xs">
                  {logs.map((log, i) => (
                    <div key={i} className="flex gap-2">
                      <span className="text-slate-600">[{log.timestamp}]</span>
                      <span className={getLogColor(log.type)}>{log.message}</span>
                    </div>
                  ))}
                  <div ref={logEndRef} />
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
          
          {/* Quick Actions */}
          <Card className="bg-slate-900/30 border-slate-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-mono flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-pink-400" />
                ⚡ QUICK ACTIONS
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button size="sm" variant="outline" className="w-full justify-start gap-2">
                <Plus className="w-4 h-4" /> Spawn Full Team
              </Button>
              <Button size="sm" variant="outline" className="w-full justify-start gap-2">
                <Shield className="w-4 h-4" /> Run Security Audit
              </Button>
              <Button size="sm" variant="outline" className="w-full justify-start gap-2">
                <Fingerprint className="w-4 h-4" /> Generate Payload
              </Button>
              <Button size="sm" variant="outline" className="w-full justify-start gap-2">
                <Globe className="w-4 h-4" /> Deploy C2
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Footer */}
      <footer className="mt-6 pt-4 border-t border-slate-800 text-center">
        <p className="text-sm text-slate-500">
          🚀 Kimi Swarm is fully operational and ready for autonomous coding operations
        </p>
      </footer>
    </div>
  );
}
