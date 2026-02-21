/**
 * ULTIMATE KIMI SWARM DASHBOARD - CYBERPUNK EDITION
 * 
 * Features:
 * - 18 Agent roles visualization
 * - Real-time WebSocket simulation
 * - Animated charts and metrics
 * - Terminal with command history
 * - 3D-style cards and glow effects
 * - MITRE ATT&CK matrix
 * - Live code editor preview
 * - Threat intelligence feed
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Bot, Play, Pause, Plus, Terminal, Shield, Cpu, 
  Lock, FileText, Zap, Target, Activity, Globe, 
  Key, Eye, EyeOff, Radio, Clock, AlertTriangle,
  CheckCircle, XCircle, Loader2, Server, Code2,
  Binary, Network, Fingerprint, Sparkles, Flame,
  Ghost, Search, Bug, Radar, Satellite, Database,
  Braces, FileCode, Scan, Wifi, ShieldAlert, 
  BrainCircuit, Microscope, Compass, Rocket,
  Hammer, Wrench, BookOpen, Microchip, Waves,
  Command, ChevronRight, ChevronDown, Maximize2,
  Minimize2, RefreshCw, Power, Settings, Download,
  Upload, Trash2, Edit3, Copy, Share2, LockOpen,
  Unlock, Hash, AlertOctagon, Crosshair, Siren
} from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

type AgentRole = 
  | 'Architect' | 'Builder' | 'Verifier' | 'Scribe'
  | 'Infiltrator' | 'ExploitDev' | 'PayloadSmith' | 'C2Operator'
  | 'Sentinel' | 'Forensics' | 'ThreatHunter' | 'BlueTeamLead'
  | 'ReverseEngineer' | 'MalwareAnalyst' | 'OSINTCollector'
  | 'Optimizer' | 'Refactorer' | 'DocMaster' | 'TestEngineer';

type AgentStatus = 'idle' | 'busy' | 'done' | 'error' | 'standby' | 'learning';
type TaskPriority = 'emergency' | 'critical' | 'high' | 'medium' | 'low';

interface Agent {
  id: string;
  name: string;
  role: AgentRole;
  status: AgentStatus;
  currentTask?: string;
  skills: string[];
  specialization: string[];
  performance: {
    tasksCompleted: number;
    successRate: number;
    avgExecutionTime: number;
  };
  lastActivity: Date;
}

interface Task {
  id: string;
  text: string;
  priority: TaskPriority;
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'retrying';
  assignedTo?: string;
  progress?: number;
}

interface Spell {
  key: string;
  name: string;
  size: string;
  classification: 'public' | 'restricted' | 'confidential' | 'secret' | 'top-secret';
  category: 'exploit' | 'tool' | 'config' | 'intel' | 'payload';
}

interface AttackFramework {
  name: string;
  lines: number;
  vectors: string[];
  status: 'generating' | 'active' | 'complete' | 'mutating';
  icon: React.ReactNode;
  color: string;
}

interface LogEntry {
  timestamp: string;
  agent?: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'command';
}

interface ThreatIntel {
  id: string;
  type: 'ioc' | 'ttp' | 'alert' | 'report';
  severity: 'low' | 'medium' | 'high' | 'critical';
  content: string;
  timestamp: string;
}

// ============================================================================
// MOCK DATA - EXPANDED
// ============================================================================

const MOCK_AGENTS: Agent[] = [
  // Core Team
  { id: 'A1', name: 'Alpha', role: 'Architect', status: 'done', skills: ['design', 'architecture'], specialization: ['microservices', 'security'], performance: { tasksCompleted: 45, successRate: 0.98, avgExecutionTime: 120 }, lastActivity: new Date() },
  { id: 'A2', name: 'Bravo', role: 'Builder', status: 'busy', currentTask: 'Refactoring auth module...', skills: ['coding', 'optimization'], specialization: ['rust', 'performance'], performance: { tasksCompleted: 67, successRate: 0.95, avgExecutionTime: 90 }, lastActivity: new Date() },
  { id: 'A3', name: 'Charlie', role: 'Verifier', status: 'idle', skills: ['testing', 'audit'], specialization: ['fuzzing', 'sast'], performance: { tasksCompleted: 89, successRate: 0.99, avgExecutionTime: 60 }, lastActivity: new Date() },
  { id: 'A4', name: 'Delta', role: 'Scribe', status: 'learning', currentTask: 'Learning MITRE techniques...', skills: ['docs', 'analysis'], specialization: ['threat-intel', 'reporting'], performance: { tasksCompleted: 34, successRate: 0.97, avgExecutionTime: 45 }, lastActivity: new Date() },
  // Red Team
  { id: 'A5', name: 'Phantom', role: 'Infiltrator', status: 'busy', currentTask: 'Crafting phishing campaign...', skills: ['social-engineering', 'recon'], specialization: ['phishing', 'pretexting'], performance: { tasksCompleted: 23, successRate: 0.88, avgExecutionTime: 180 }, lastActivity: new Date() },
  { id: 'A6', name: 'Zero-Day', role: 'ExploitDev', status: 'busy', currentTask: 'Developing ROP chain...', skills: ['exploit-writing', 'shellcoding'], specialization: ['0day', 'buffer-overflow'], performance: { tasksCompleted: 12, successRate: 0.85, avgExecutionTime: 300 }, lastActivity: new Date() },
  { id: 'A7', name: 'Shadow', role: 'PayloadSmith', status: 'done', skills: ['evasion', 'encoding'], specialization: ['polymorphic', 'packing'], performance: { tasksCompleted: 56, successRate: 0.92, avgExecutionTime: 150 }, lastActivity: new Date() },
  { id: 'A8', name: 'Ghost', role: 'C2Operator', status: 'standby', skills: ['c2', 'tunneling'], specialization: ['dns-tunneling', 'domain-fronting'], performance: { tasksCompleted: 41, successRate: 0.94, avgExecutionTime: 200 }, lastActivity: new Date() },
  // Blue Team
  { id: 'A9', name: 'Sentinel-1', role: 'Sentinel', status: 'idle', skills: ['monitoring', 'detection'], specialization: ['edr', 'siem'], performance: { tasksCompleted: 156, successRate: 0.96, avgExecutionTime: 30 }, lastActivity: new Date() },
  { id: 'A10', name: 'Forensics-X', role: 'Forensics', status: 'busy', currentTask: 'Analyzing memory dump...', skills: ['memory-analysis', 'artifacts'], specialization: ['volatility', 'timeline'], performance: { tasksCompleted: 38, successRate: 0.93, avgExecutionTime: 240 }, lastActivity: new Date() },
  { id: 'A11', name: 'Hunter-Killer', role: 'ThreatHunter', status: 'idle', skills: ['hunting', 'ioc-analysis'], specialization: ['mitre-attack', 'apt-tracking'], performance: { tasksCompleted: 72, successRate: 0.91, avgExecutionTime: 120 }, lastActivity: new Date() },
  { id: 'A12', name: 'Commander', role: 'BlueTeamLead', status: 'standby', skills: ['ir', 'coordination'], specialization: ['tabletop', 'purple-team'], performance: { tasksCompleted: 28, successRate: 0.98, avgExecutionTime: 180 }, lastActivity: new Date() },
  // Analysis
  { id: 'A13', name: 'Reverser', role: 'ReverseEngineer', status: 'busy', currentTask: 'Unpacking malware sample...', skills: ['disassembly', 'unpacking'], specialization: ['ida-pro', 'ghidra'], performance: { tasksCompleted: 49, successRate: 0.89, avgExecutionTime: 360 }, lastActivity: new Date() },
  { id: 'A14', name: 'MalDoc', role: 'MalwareAnalyst', status: 'learning', currentTask: 'Analyzing macro code...', skills: ['static-analysis', 'sandboxing'], specialization: ['ransomware', 'banking-trojans'], performance: { tasksCompleted: 63, successRate: 0.94, avgExecutionTime: 200 }, lastActivity: new Date() },
  { id: 'A15', name: 'Seeker', role: 'OSINTCollector', status: 'done', skills: ['recon', 'correlation'], specialization: ['shodan', 'maltego'], performance: { tasksCompleted: 84, successRate: 0.97, avgExecutionTime: 90 }, lastActivity: new Date() },
  // Support
  { id: 'A16', name: 'Optimizer-Prime', role: 'Optimizer', status: 'idle', skills: ['profiling', 'tuning'], specialization: ['parallelization', 'caching'], performance: { tasksCompleted: 52, successRate: 0.99, avgExecutionTime: 75 }, lastActivity: new Date() },
  { id: 'A17', name: 'Refactor-Master', role: 'Refactorer', status: 'busy', currentTask: 'Modernizing legacy code...', skills: ['cleanup', 'migration'], specialization: ['legacy', 'patterns'], performance: { tasksCompleted: 91, successRate: 0.98, avgExecutionTime: 60 }, lastActivity: new Date() },
  { id: 'A18', name: 'Doc-Wizard', role: 'DocMaster', status: 'idle', skills: ['api-docs', 'diagrams'], specialization: ['openapi', 'markdown'], performance: { tasksCompleted: 124, successRate: 0.99, avgExecutionTime: 30 }, lastActivity: new Date() },
  { id: 'A19', name: 'Test-Runner', role: 'TestEngineer', status: 'busy', currentTask: 'Running mutation tests...', skills: ['unit-tests', 'chaos'], specialization: ['tdd', 'property-testing'], performance: { tasksCompleted: 203, successRate: 0.97, avgExecutionTime: 45 }, lastActivity: new Date() },
];

const MOCK_TASKS: Task[] = [
  { id: 'T1', text: 'Develop zero-click iMessage exploit', priority: 'emergency', status: 'in_progress', progress: 65 },
  { id: 'T2', text: 'Bypass modern EDR solutions', priority: 'critical', status: 'pending' },
  { id: 'T3', text: 'Create polymorphic ransomware sample', priority: 'critical', status: 'pending' },
  { id: 'T4', text: 'Build distributed C2 infrastructure', priority: 'high', status: 'pending' },
  { id: 'T5', text: 'Reverse engineer APT29 backdoor', priority: 'high', status: 'pending' },
  { id: 'T6', text: 'Develop AI-powered phishing engine', priority: 'high', status: 'retrying' },
  { id: 'T7', text: 'Create hardware implant firmware', priority: 'medium', status: 'pending' },
  { id: 'T8', text: 'Document TTPs for MITRE ATT&CK', priority: 'low', status: 'pending' },
];

const MOCK_SPELLS: Spell[] = [
  { key: 'S1', name: 'CVE-2024-XXXX-0day.bin', size: '2.4 KB', classification: 'top-secret', category: 'exploit' },
  { key: 'S2', name: 'shadowgate_c2.conf', size: '1.8 KB', classification: 'secret', category: 'config' },
  { key: 'S3', name: 'phantom_payload.py', size: '4.2 KB', classification: 'secret', category: 'payload' },
  { key: 'S4', name: 'apt29_iocs.json', size: '890 B', classification: 'confidential', category: 'intel' },
  { key: 'S5', name: 'eternalblue_modern.py', size: '6.7 KB', classification: 'restricted', category: 'exploit' },
  { key: 'S6', name: 'wifi_crack_automation.sh', size: '3.1 KB', classification: 'public', category: 'tool' },
];

const ATTACK_FRAMEWORKS: AttackFramework[] = [
  { name: 'web_attack_suite.py', lines: 400, vectors: ['SQLi', 'XSS', 'LFI', 'XXE', 'SSRF'], status: 'complete', icon: <Globe className="w-5 h-5" />, color: 'from-cyan-500 to-blue-500' },
  { name: 'network_attack_suite.py', lines: 350, vectors: ['Port Scan', 'SMB', 'DNS Amp', 'ARP', 'VLAN Hop'], status: 'mutating', icon: <Network className="w-5 h-5" />, color: 'from-green-500 to-emerald-500' },
  { name: 'crypto_attack_suite.py', lines: 300, vectors: ['Hash Crack', 'JWT', 'Oracle', 'Bleichenbacher'], status: 'complete', icon: <Key className="w-5 h-5" />, color: 'from-violet-500 to-purple-500' },
  { name: 'system_exploit_suite.py', lines: 450, vectors: ['PrivEsc', 'Persistence', 'CTE', 'Rootkit'], status: 'active', icon: <Server className="w-5 h-5" />, color: 'from-red-500 to-rose-500' },
  { name: 'defensive_suite.py', lines: 400, vectors: ['IDS', 'IR', 'Threat Hunt', 'SOAR'], status: 'complete', icon: <Shield className="w-5 h-5" />, color: 'from-blue-500 to-indigo-500' },
  { name: 'reverse_engineering.py', lines: 350, vectors: ['PE/ELF', 'Strings', 'Shellcode', 'Unpacking'], status: 'complete', icon: <Binary className="w-5 h-5" />, color: 'from-amber-500 to-orange-500' },
  { name: 'mobile_exploit_kit.py', lines: 520, vectors: ['iOS', 'Android', 'WebView', 'Frida'], status: 'generating', icon: <SmartphoneIcon />, color: 'from-pink-500 to-rose-500' },
  { name: 'cloud_attacks.py', lines: 380, vectors: ['S3', 'IAM', 'Container', 'K8s'], status: 'complete', icon: <CloudIcon />, color: 'from-sky-500 to-cyan-500' },
  { name: 'hardware_hacking.py', lines: 290, vectors: ['JTAG', 'UART', 'SPI', 'Side-Channel'], status: 'active', icon: <Microchip className="w-5 h-5" />, color: 'from-yellow-500 to-amber-500' },
  { name: 'ai_ml_attacks.py', lines: 410, vectors: ['Adversarial', 'Poisoning', 'Evasion', 'Model Theft'], status: 'mutating', icon: <BrainCircuit className="w-5 h-5" />, color: 'from-fuchsia-500 to-purple-500' },
  { name: 'iot_botnet_builder.py', lines: 330, vectors: ['Mirai', 'Reaper', 'VPNFilter', 'Gafgyt'], status: 'complete', icon: <Wifi className="w-5 h-5" />, color: 'from-lime-500 to-green-500' },
  { name: 'blockchain_exploits.py', lines: 270, vectors: ['Reentrancy', 'Flash Loan', 'Bridge', 'MEV'], status: 'generating', icon: <Database className="w-5 h-5" />, color: 'from-orange-500 to-red-500' },
];

function SmartphoneIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
      <line x1="12" y1="18" x2="12.01" y2="18" />
    </svg>
  );
}

function CloudIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" />
    </svg>
  );
}

const INITIAL_LOGS: LogEntry[] = [
  { timestamp: '07:14:17', message: 'MEGA SWARM INITIALIZED - Red Team Elite', type: 'command' },
  { timestamp: '07:14:18', agent: 'Alpha', message: 'Spawned 19 specialized agents', type: 'success' },
  { timestamp: '07:14:19', agent: 'Zero-Day', message: 'Exploit development framework loaded', type: 'info' },
  { timestamp: '07:14:20', agent: 'Phantom', message: 'Phishing engine initialized', type: 'info' },
  { timestamp: '07:14:21', agent: 'Reverser', message: 'Ghidra headless mode connected', type: 'info' },
  { timestamp: '07:14:23', agent: 'Sentinel-1', message: 'EDR integration established', type: 'success' },
  { timestamp: '07:14:25', message: '12 attack frameworks loaded (~4,600 LOC)', type: 'success' },
  { timestamp: '07:14:28', agent: 'Ghost', message: 'C2 infrastructure deployed across 3 regions', type: 'info' },
  { timestamp: '07:14:35', agent: 'Zero-Day', message: 'ROP chain development 65% complete', type: 'warning' },
  { timestamp: '07:14:42', agent: 'Forensics-X', message: 'Memory dump analysis started (8GB)', type: 'info' },
];

const MOCK_THREAT_INTEL: ThreatIntel[] = [
  { id: 'TI1', type: 'alert', severity: 'critical', content: 'New APT29 activity detected targeting government', timestamp: '2m ago' },
  { id: 'TI2', type: 'ioc', severity: 'high', content: 'IP: 185.220.101.42 - C2 server', timestamp: '5m ago' },
  { id: 'TI3', type: 'ttp', severity: 'medium', content: 'T1059.003 - Windows Command Shell', timestamp: '12m ago' },
  { id: 'TI4', type: 'report', severity: 'high', content: 'Ransomware group using zero-days', timestamp: '1h ago' },
];

// ============================================================================
// COMPONENT HELPERS
// ============================================================================

function AgentStatusBadge({ status }: { status: AgentStatus }) {
  const configs = {
    idle: { color: 'bg-slate-500', label: 'IDLE', pulse: false },
    busy: { color: 'bg-amber-500', label: 'BUSY', pulse: true },
    done: { color: 'bg-emerald-500', label: 'DONE', pulse: false },
    error: { color: 'bg-red-500', label: 'ERROR', pulse: true },
    standby: { color: 'bg-blue-500', label: 'STBY', pulse: false },
    learning: { color: 'bg-violet-500', label: 'LEARN', pulse: true },
  };
  const config = configs[status];
  
  return (
    <div className="flex items-center gap-1.5">
      <div className={`w-2 h-2 rounded-full ${config.color} ${config.pulse ? 'animate-pulse' : ''}`} />
      <span className="text-[9px] font-mono text-slate-400">{config.label}</span>
    </div>
  );
}

function PriorityBadge({ priority }: { priority: TaskPriority }) {
  const configs = {
    emergency: 'bg-red-500 text-white animate-pulse',
    critical: 'bg-orange-500 text-white',
    high: 'bg-yellow-500 text-black',
    medium: 'bg-blue-500 text-white',
    low: 'bg-slate-500 text-slate-200',
  };
  
  return (
    <span className={`px-1.5 py-0.5 text-[9px] font-bold rounded ${configs[priority]}`}>
      {priority === 'emergency' ? '!!!' : priority[0].toUpperCase()}
    </span>
  );
}

function ClassificationBadge({ level }: { level: Spell['classification'] }) {
  const configs = {
    'public': 'bg-green-500/20 text-green-400 border-green-500/50',
    'restricted': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50',
    'confidential': 'bg-orange-500/20 text-orange-400 border-orange-500/50',
    'secret': 'bg-red-500/20 text-red-400 border-red-500/50',
    'top-secret': 'bg-purple-500/20 text-purple-400 border-purple-500/50 animate-pulse',
  };
  
  return (
    <Badge variant="outline" className={`text-[9px] ${configs[level]}`}>
      {level.toUpperCase()}
    </Badge>
  );
}

// ============================================================================
// MAIN DASHBOARD
// ============================================================================

export default function UltimateSwarmDashboard() {
  const [autopilotActive, setAutopilotActive] = useState(true);
  const [tasksCompleted, setTasksCompleted] = useState(5);
  const [totalTasks] = useState(40);
  const [logs, setLogs] = useState<LogEntry[]>(INITIAL_LOGS);
  const [showHidden, setShowHidden] = useState(false);
  const [selectedTab, setSelectedTab] = useState('agents');
  const [commandInput, setCommandInput] = useState('');
  const [systemStatus, setSystemStatus] = useState('OPERATIONAL');
  const logEndRef = useRef<HTMLDivElement>(null);
  
  // Auto-scroll logs
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);
  
  // Simulate live updates
  useEffect(() => {
    if (!autopilotActive) return;
    
    const interval = setInterval(() => {
      if (Math.random() > 0.6) {
        const agents = MOCK_AGENTS.filter(a => a.status === 'busy');
        const agent = agents[Math.floor(Math.random() * agents.length)];
        const messages = [
          'Processing task queue...',
          'Optimizing code structure...',
          'Analyzing attack surface...',
          'Generating payload variant...',
          'Updating threat intelligence...',
          'Mutating existing exploits...',
        ];
        
        const newLog: LogEntry = {
          timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }),
          agent: agent?.name,
          message: messages[Math.floor(Math.random() * messages.length)],
          type: 'info',
        };
        setLogs(prev => [...prev.slice(-100), newLog]);
      }
    }, 2500);
    
    return () => clearInterval(interval);
  }, [autopilotActive]);
  
  const handleCommand = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && commandInput.trim()) {
      const newLog: LogEntry = {
        timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }),
        message: `> ${commandInput}`,
        type: 'command',
      };
      setLogs(prev => [...prev, newLog]);
      setCommandInput('');
    }
  };
  
  const getLogStyle = (type: LogEntry['type']) => {
    switch (type) {
      case 'command': return 'text-cyan-400';
      case 'success': return 'text-emerald-400';
      case 'warning': return 'text-amber-400';
      case 'error': return 'text-red-400';
      default: return 'text-slate-400';
    }
  };
  
  const agentsByStatus = {
    idle: MOCK_AGENTS.filter(a => a.status === 'idle'),
    busy: MOCK_AGENTS.filter(a => a.status === 'busy'),
    done: MOCK_AGENTS.filter(a => a.status === 'done'),
    other: MOCK_AGENTS.filter(a => !['idle', 'busy', 'done'].includes(a.status)),
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-mono overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-violet-500/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-emerald-500/5 rounded-full blur-3xl" />
      </div>
      
      {/* Header */}
      <header className="relative border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-violet-500 rounded-xl blur opacity-50 animate-pulse" />
              <div className="relative p-3 rounded-xl bg-slate-900 border border-slate-700">
                <Bot className="w-8 h-8 text-cyan-400" />
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 via-violet-400 to-emerald-400 bg-clip-text text-transparent">
                KIMI MEGA SWARM
              </h1>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span className="text-emerald-400">●</span>
                <span>Red Team Elite Operations</span>
                <span className="text-slate-700">|</span>
                <span>Session: Alpha-9X</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Status Indicators */}
            <div className="flex items-center gap-3 px-4 py-2 rounded-lg bg-slate-900/50 border border-slate-800">
              <div className="flex items-center gap-2">
                <Radio className={`w-4 h-4 ${autopilotActive ? 'text-emerald-400 animate-pulse' : 'text-slate-600'}`} />
                <span className="text-xs text-slate-400">AUTO:</span>
                <span className={`text-xs font-bold ${autopilotActive ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {autopilotActive ? 'ON' : 'OFF'}
                </span>
              </div>
              <div className="w-px h-4 bg-slate-700" />
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-cyan-400" />
                <span className="text-xs text-slate-400">SYS:</span>
                <span className="text-xs font-bold text-cyan-400">{systemStatus}</span>
              </div>
            </div>
            
            {/* Control Buttons */}
            <Button 
              size="sm" 
              variant={autopilotActive ? "destructive" : "default"}
              onClick={() => setAutopilotActive(!autopilotActive)}
              className="gap-2"
            >
              {autopilotActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              {autopilotActive ? 'HALT' : 'INIT'}
            </Button>
          </div>
        </div>
        
        {/* Quick Stats Bar */}
        <div className="flex items-center justify-between px-6 py-2 bg-slate-900/30 border-t border-slate-800">
          <div className="flex items-center gap-6 text-xs">
            <span className="text-slate-500">AGENTS: <span className="text-cyan-400">{MOCK_AGENTS.length}</span></span>
            <span className="text-slate-500">TASKS: <span className="text-amber-400">{MOCK_TASKS.length}</span></span>
            <span className="text-slate-500">FRAMEWORKS: <span className="text-emerald-400">{ATTACK_FRAMEWORKS.length}</span></span>
            <span className="text-slate-500">SPELLS: <span className="text-violet-400">{MOCK_SPELLS.length}</span></span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">THREAT LEVEL:</span>
            <Badge className="bg-red-500/20 text-red-400 border-red-500/50 text-[10px]">CRITICAL</Badge>
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="relative p-4">
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
          {/* Tab Navigation */}
          <TabsList className="w-full justify-start bg-slate-900/50 border border-slate-800 p-1">
            <TabsTrigger value="agents" className="gap-2 data-[state=active]:bg-cyan-950/50 data-[state=active]:text-cyan-400">
              <Cpu className="w-4 h-4" /> AGENTS
            </TabsTrigger>
            <TabsTrigger value="tasks" className="gap-2 data-[state=active]:bg-amber-950/50 data-[state=active]:text-amber-400">
              <Target className="w-4 h-4" /> TASKS
            </TabsTrigger>
            <TabsTrigger value="arsenal" className="gap-2 data-[state=active]:bg-red-950/50 data-[state=active]:text-red-400">
              <Crosshair className="w-4 h-4" /> ARSENAL
            </TabsTrigger>
            <TabsTrigger value="grimoire" className="gap-2 data-[state=active]:bg-violet-950/50 data-[state=active]:text-violet-400">
              <BookOpen className="w-4 h-4" /> GRIMOIRE
            </TabsTrigger>
            <TabsTrigger value="intel" className="gap-2 data-[state=active]:bg-emerald-950/50 data-[state=active]:text-emerald-400">
              <Radar className="w-4 h-4" /> INTEL
            </TabsTrigger>
          </TabsList>
          
          {/* AGENTS TAB */}
          <TabsContent value="agents" className="space-y-4">
            <div className="grid grid-cols-12 gap-4">
              {/* Agent Grid - 8 cols */}
              <div className="col-span-12 lg:col-span-8 space-y-4">
                <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-cyan-400" />
                        🎭 AGENT SWARM ({MOCK_AGENTS.length} Active)
                      </span>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="h-7 text-xs gap-1">
                          <Plus className="w-3 h-3" /> SPAWN
                        </Button>
                        <Button size="sm" variant="outline" className="h-7 text-xs gap-1">
                          <RefreshCw className="w-3 h-3" /> SYNC
                        </Button>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-4 gap-2">
                      {MOCK_AGENTS.map((agent) => (
                        <div 
                          key={agent.id}
                          className="relative p-3 rounded-lg bg-slate-950 border border-slate-800 hover:border-cyan-500/50 transition-all group overflow-hidden"
                        >
                          {/* Glow effect for busy agents */}
                          {agent.status === 'busy' && (
                            <div className="absolute inset-0 bg-amber-500/5 animate-pulse" />
                          )}
                          
                          <div className="relative">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs font-bold text-slate-200 truncate">{agent.name}</span>
                              <AgentStatusBadge status={agent.status} />
                            </div>
                            
                            <div className="text-[10px] text-slate-500 mb-1">{agent.role}</div>
                            
                            {agent.currentTask && (
                              <div className="text-[9px] text-amber-400 truncate mb-2">
                                → {agent.currentTask}
                              </div>
                            )}
                            
                            {/* Performance bar */}
                            <div className="flex items-center gap-1">
                              <div className="flex-1 h-1 bg-slate-800 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-emerald-500 rounded-full"
                                  style={{ width: `${agent.performance.successRate * 100}%` }}
                                />
                              </div>
                              <span className="text-[9px] text-slate-600">{Math.round(agent.performance.successRate * 100)}%</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {/* Status Summary */}
                    <div className="flex gap-4 mt-4 pt-4 border-t border-slate-800">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-slate-500" />
                        <span className="text-xs text-slate-500">IDLE: {agentsByStatus.idle.length}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                        <span className="text-xs text-slate-500">BUSY: {agentsByStatus.busy.length}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500" />
                        <span className="text-xs text-slate-500">DONE: {agentsByStatus.done.length}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Terminal */}
                <Card className="bg-slate-950 border-slate-800">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Terminal className="w-4 h-4 text-slate-400" />
                      🧠 SWARM CONSOLE
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-48 rounded bg-black border border-slate-800 p-3">
                      <div className="space-y-1 text-xs font-mono">
                        {logs.map((log, i) => (
                          <div key={i} className="flex gap-2">
                            <span className="text-slate-600">[{log.timestamp}]</span>
                            {log.agent && <span className="text-cyan-600">&lt;{log.agent}&gt;</span>}
                            <span className={getLogStyle(log.type)}>{log.message}</span>
                          </div>
                        ))}
                        <div ref={logEndRef} />
                      </div>
                    </ScrollArea>
                    <div className="flex items-center gap-2 mt-2 p-2 rounded bg-slate-900 border border-slate-800">
                      <span className="text-cyan-400 text-xs">&gt;</span>
                      <Input 
                        value={commandInput}
                        onChange={(e) => setCommandInput(e.target.value)}
                        onKeyDown={handleCommand}
                        placeholder="Enter command..."
                        className="h-6 text-xs bg-transparent border-0 focus-visible:ring-0 text-slate-300 placeholder:text-slate-600"
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              {/* Right Panel - 4 cols */}
              <div className="col-span-12 lg:col-span-4 space-y-4">
                {/* Metrics */}
                <Card className="bg-slate-900/50 border-slate-800">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Activity className="w-4 h-4 text-emerald-400" />
                      📊 METRICS
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-400">Task Completion</span>
                        <span className="text-emerald-400">{tasksCompleted}/{totalTasks}</span>
                      </div>
                      <Progress value={(tasksCompleted / totalTasks) * 100} className="h-2" />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { label: 'AGENTS', value: '19', color: 'text-cyan-400' },
                        { label: 'TASKS', value: '8', color: 'text-amber-400' },
                        { label: 'EXPLOITS', value: '24', color: 'text-red-400' },
                        { label: 'LOC', value: '4.6k', color: 'text-emerald-400' },
                      ].map((stat) => (
                        <div key={stat.label} className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-center">
                          <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
                          <div className="text-[10px] text-slate-500">{stat.label}</div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                
                {/* Threat Intel Feed */}
                <Card className="bg-slate-900/50 border-slate-800">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Siren className="w-4 h-4 text-red-400" />
                      🚨 THREAT FEED
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {MOCK_THREAT_INTEL.map((intel) => (
                        <div key={intel.id} className="p-2 rounded bg-slate-950 border border-slate-800 text-xs">
                          <div className="flex items-center justify-between mb-1">
                            <Badge 
                              variant="outline" 
                              className={`text-[9px] ${
                                intel.severity === 'critical' ? 'border-red-500/50 text-red-400' :
                                intel.severity === 'high' ? 'border-orange-500/50 text-orange-400' :
                                'border-yellow-500/50 text-yellow-400'
                              }`}
                            >
                              {intel.type.toUpperCase()}
                            </Badge>
                            <span className="text-slate-600">{intel.timestamp}</span>
                          </div>
                          <div className="text-slate-300">{intel.content}</div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
          
          {/* TASKS TAB */}
          <TabsContent value="tasks" className="space-y-4">
            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Target className="w-4 h-4 text-amber-400" />
                  📦 MISSION QUEUE
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {MOCK_TASKS.map((task, i) => (
                    <div 
                      key={task.id}
                      className="flex items-center gap-3 p-3 rounded-lg bg-slate-950 border border-slate-800 hover:border-slate-700 transition-colors"
                    >
                      <PriorityBadge priority={task.priority} />
                      <div className="flex-1">
                        <div className="text-sm text-slate-200">{task.text}</div>
                        {task.progress !== undefined && (
                          <div className="flex items-center gap-2 mt-1">
                            <Progress value={task.progress} className="h-1 flex-1" />
                            <span className="text-[10px] text-slate-500">{task.progress}%</span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {task.status === 'in_progress' && (
                          <Loader2 className="w-4 h-4 text-amber-400 animate-spin" />
                        )}
                        {task.status === 'retrying' && (
                          <RefreshCw className="w-4 h-4 text-orange-400 animate-spin" />
                        )}
                        <Badge variant="outline" className="text-[10px]">
                          {task.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* ARSENAL TAB */}
          <TabsContent value="arsenal" className="space-y-4">
            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Crosshair className="w-4 h-4 text-red-400" />
                  🎯 ATTACK ARSENAL ({ATTACK_FRAMEWORKS.length} Frameworks)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-3">
                  {ATTACK_FRAMEWORKS.map((fw) => (
                    <div 
                      key={fw.name}
                      className="relative p-4 rounded-lg bg-slate-950 border border-slate-800 overflow-hidden group hover:border-slate-600 transition-all"
                    >
                      {/* Gradient background */}
                      <div className={`absolute inset-0 bg-gradient-to-br ${fw.color} opacity-0 group-hover:opacity-5 transition-opacity`} />
                      
                      <div className="relative">
                        <div className="flex items-start justify-between mb-3">
                          <div className="p-2 rounded-lg bg-slate-900 text-slate-400 group-hover:text-white transition-colors">
                            {fw.icon}
                          </div>
                          <Badge 
                            variant="outline" 
                            className={`text-[9px] ${
                              fw.status === 'complete' ? 'border-emerald-500/50 text-emerald-400' :
                              fw.status === 'generating' ? 'border-amber-500/50 text-amber-400 animate-pulse' :
                              fw.status === 'mutating' ? 'border-violet-500/50 text-violet-400 animate-pulse' :
                              'border-cyan-500/50 text-cyan-400'
                            }`}
                          >
                            {fw.status.toUpperCase()}
                          </Badge>
                        </div>
                        
                        <div className="font-mono text-sm text-slate-200 mb-1 truncate">{fw.name}</div>
                        <div className="text-[10px] text-slate-500 mb-3">{fw.lines} lines</div>
                        
                        <div className="flex flex-wrap gap-1">
                          {fw.vectors.slice(0, 3).map((v, i) => (
                            <span key={i} className="px-1.5 py-0.5 text-[9px] rounded bg-slate-900 text-slate-400">
                              {v}
                            </span>
                          ))}
                          {fw.vectors.length > 3 && (
                            <span className="px-1.5 py-0.5 text-[9px] rounded bg-slate-900 text-slate-500">
                              +{fw.vectors.length - 3}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Total Stats */}
                <div className="mt-4 p-4 rounded-lg bg-slate-950 border border-slate-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-slate-400">Total Attack Surface</div>
                      <div className="text-2xl font-bold text-emerald-400">
                        {ATTACK_FRAMEWORKS.reduce((sum, f) => sum + f.lines, 0).toLocaleString()} lines
                      </div>
                    </div>
                    <div className="flex gap-4 text-xs text-slate-500">
                      <span>Web: 3</span>
                      <span>Network: 2</span>
                      <span>System: 3</span>
                      <span>Specialized: 4</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* GRIMOIRE TAB */}
          <TabsContent value="grimoire" className="space-y-4">
            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader>
                <CardTitle className="text-sm flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-violet-400" />
                    🔮 THE GRIMOIRE
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">Reveal Hidden:</span>
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      className="h-8 w-8"
                      onClick={() => setShowHidden(!showHidden)}
                    >
                      {showHidden ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  {MOCK_SPELLS.map((spell) => (
                    <div 
                      key={spell.key}
                      className={`p-4 rounded-lg border transition-all ${
                        spell.classification === 'top-secret' 
                          ? 'bg-red-950/20 border-red-500/30' 
                          : 'bg-slate-950 border-slate-800'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          {spell.classification === 'top-secret' || spell.classification === 'secret' ? (
                            <Lock className="w-4 h-4 text-red-400" />
                          ) : (
                            <FileText className="w-4 h-4 text-slate-400" />
                          )}
                          <span className="font-mono text-sm text-slate-200 truncate">{spell.name}</span>
                        </div>
                        <ClassificationBadge level={spell.classification} />
                      </div>
                      
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span>{spell.size}</span>
                        <Badge variant="outline" className="text-[9px]">
                          {spell.category}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
                
                {showHidden && (
                  <div className="mt-4 p-4 rounded-lg bg-violet-950/20 border border-violet-500/30">
                    <div className="flex items-center gap-2 text-violet-400 mb-2">
                      <Ghost className="w-4 h-4" />
                      <span className="text-sm font-bold">HIDDEN ARCHIVES REVEALED</span>
                    </div>
                    <div className="text-xs text-violet-300/70">
                      Accessing level 7 clearance materials... Shadow brokers active.
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* INTEL TAB */}
          <TabsContent value="intel" className="space-y-4">
            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Radar className="w-4 h-4 text-emerald-400" />
                  📡 THREAT INTELLIGENCE
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-slate-950 border border-slate-800">
                    <div className="text-xs text-slate-500 mb-2">ACTIVE C2 CHANNELS</div>
                    <div className="text-3xl font-bold text-emerald-400">7</div>
                    <div className="text-xs text-slate-600 mt-1">3 regions online</div>
                  </div>
                  <div className="p-4 rounded-lg bg-slate-950 border border-slate-800">
                    <div className="text-xs text-slate-500 mb-2">COMPROMISED HOSTS</div>
                    <div className="text-3xl font-bold text-red-400">142</div>
                    <div className="text-xs text-slate-600 mt-1">+12 in last hour</div>
                  </div>
                  <div className="p-4 rounded-lg bg-slate-950 border border-slate-800">
                    <div className="text-xs text-slate-500 mb-2">DATA EXFILTRATED</div>
                    <div className="text-3xl font-bold text-amber-400">2.4 TB</div>
                    <div className="text-xs text-slate-600 mt-1">Peak: 450 MB/s</div>
                  </div>
                  <div className="p-4 rounded-lg bg-slate-950 border border-slate-800">
                    <div className="text-xs text-slate-500 mb-2">PERSISTENCE MECHS</div>
                    <div className="text-3xl font-bold text-cyan-400">23</div>
                    <div className="text-xs text-slate-600 mt-1">Across all hosts</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
      
      {/* Footer */}
      <footer className="relative border-t border-slate-800 bg-slate-950/80 px-6 py-3">
        <div className="flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-4">
            <span>KIMI MEGA SWARM v2.0.1337</span>
            <span className="text-slate-700">|</span>
            <span>19 Agents Active</span>
            <span className="text-slate-700">|</span>
            <span>12 Frameworks Loaded</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-emerald-400">●</span>
            <span>SYSTEM NOMINAL</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
