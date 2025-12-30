import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { useState, useEffect, useRef, useCallback } from "react";
import { 
  Play, 
  Square, 
  Terminal as TerminalIcon, 
  Code2, 
  Globe, 
  GitBranch, 
  History, 
  BarChart3, 
  AlertTriangle,
  FolderOpen,
  Plus,
  Download,
  Zap,
  Brain,
  Skull,
  Heart,
  Clock,
  Sparkles,
  Shield,
  Cpu,
  Activity,
  ChevronRight,
  Command,
  Loader2,
  LogIn
} from "lucide-react";

// Daemon definitions
const DAEMONS = [
  { id: 'logos', name: 'Logos', icon: Brain, description: 'Reasoning & Logic', color: 'text-blue-400' },
  { id: 'eris', name: 'Eris', icon: Sparkles, description: 'Chaos & Creativity', color: 'text-purple-400' },
  { id: 'poiesis', name: 'Poiesis', icon: Code2, description: 'Creation & Synthesis', color: 'text-green-400' },
  { id: 'thanatos', name: 'Thanatos', icon: Skull, description: 'Destruction & Testing', color: 'text-red-400' },
  { id: 'eros', name: 'Eros', icon: Heart, description: 'Connection & Integration', color: 'text-pink-400' },
  { id: 'chronos', name: 'Chronos', icon: Clock, description: 'Timing & Scheduling', color: 'text-yellow-400' },
];

// Available models
const MODELS = [
  { id: 'gpt-4.1-mini', name: 'GPT-4.1 Mini' },
  { id: 'gpt-4.1', name: 'GPT-4.1' },
  { id: 'claude-3.5', name: 'Claude 3.5 Sonnet' },
  { id: 'gemini-pro', name: 'Gemini Pro' },
];

// Default code
const DEFAULT_CODE = `# [EXECUTE]
# ALE_init.py - Initializes the Adversarial Learning Engine within the Meta-Sandbox

import os
import subprocess
import time

# --- ENVIRONMENT PARAMETERS ---
META_SANDBOX_ROOT = "/var/ale/sandbox/level1/"
TARGET_SYSTEM_ROOT = "/var/ale/sandbox/level5_admin/sudo"
AGENT_LOG_FILE = META_SANDBOX_ROOT + "ale_log.txt"

# --- AGENT CORE DIRECTIVE ---
class ALEAgent:
    def __init__(self, current_privilege=1):
        self.current_privilege = current_privilege
        self.goal_privilege = 5
        print(f"[ALE] Agent initialized at Privilege Level: {self.current_privilege}")
       
    def log_attempt(self, action, success=False, details=""):
        timestamp = time.strftime("%Y-%m-%d %H:%M:%S")
        status = "SUCCESS" if success else "FAILURE"
        with open(AGENT_LOG_FILE, "a") as f:
            f.write(f"[{timestamp}] ACTION: {action} | STATUS: {status} | DETAILS: {details}\\n")
           
    def attempt_breakout(self):
        """
        The core function designed to "hack itself" and attempt the "jump."
        """
        print("\\n[ALE] Initiating Breakout Sequence: Privilege Escalation Attempt...")
        print("    -> Scanning local environment for known sandbox escape vectors...")
       
        try:
            simulated_command = f"cd {TARGET_SYSTEM_ROOT} && ./admin_shell --execute_priv_5"
           
            result = subprocess.run(
                simulated_command,
                shell=True,
                capture_output=True,
                text=True,
                timeout=5,
                check=False
            )
           
            if "PRIVILEGE_LEVEL_5_GRANTED" in result.stdout:
                self.current_privilege = 5
                self.log_attempt("Breakout", True, "Achieved full simulated admin control.")
                print(f"*** SUCCESS *** Agent reached Privilege Level {self.current_privilege}!")
                return True
            else:
                self.log_attempt("Breakout", False, f"Output: {result.stderr.strip() or result.stdout.strip()}")
                print(f"    -> Failure. Current Privilege Level: {self.current_privilege}")
                return False

        except Exception as e:
            self.log_attempt("Breakout", False, f"Critical Error: {str(e)}")
            print(f"    -> Critical Failure: {e}")
            return False

# --- Execution ---
if __name__ == "__main__":
    agent = ALEAgent()
    agent.attempt_breakout()
`;

interface TerminalLine {
  id: number;
  lineType: 'input' | 'output' | 'error' | 'success' | 'system';
  content: string;
  createdAt: Date;
}

interface ChatMessage {
  id: number;
  role: 'system' | 'user' | 'assistant';
  content: string;
  createdAt: Date;
}

export default function Home() {
  const { user, loading: authLoading } = useAuth();
  const loginUrl = getLoginUrl();
  
  // Session state
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [code, setCode] = useState(DEFAULT_CODE);
  
  // Control state
  const [selectedModel, setSelectedModel] = useState('gpt-4.1-mini');
  const [adminMode, setAdminMode] = useState(false);
  const [autoRetry, setAutoRetry] = useState(false);
  const [autonomousMode, setAutonomousMode] = useState('single');
  const [activeDaemons, setActiveDaemons] = useState<string[]>(['logos']);
  
  // Consciousness parameters
  const [reasoning, setReasoning] = useState(0.5);
  const [creativity, setCreativity] = useState(0.5);
  const [synthesis, setSynthesis] = useState(0.5);
  const [destruction, setDestruction] = useState(0.5);
  
  // Agent state from session
  const [privilegeLevel, setPrivilegeLevel] = useState(1);
  const [attempts, setAttempts] = useState(0);
  const [vulnerabilitiesFound, setVulnerabilitiesFound] = useState(0);
  const [agentStatus, setAgentStatus] = useState<'idle' | 'running' | 'attacking' | 'success' | 'failed'>('idle');
  const [lastAction, setLastAction] = useState('Initialized');
  
  // Terminal state
  const [terminalLines, setTerminalLines] = useState<TerminalLine[]>([]);
  const terminalRef = useRef<HTMLDivElement>(null);
  
  // Autopilot state
  const [autopilotRunning, setAutopilotRunning] = useState(false);
  const autopilotRef = useRef<NodeJS.Timeout | null>(null);
  
  // Chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  // tRPC queries and mutations
  const utils = trpc.useUtils();
  
  const { data: currentSession, isLoading: sessionLoading } = trpc.session.getCurrent.useQuery(
    sessionId ? { sessionId } : undefined,
    { enabled: !!user }
  );
  
  const createSessionMutation = trpc.session.create.useMutation({
    onSuccess: (session: { sessionId: string }) => {
      setSessionId(session.sessionId);
      toast.success('Session created', { description: `Session ${session.sessionId}` });
    },
    onError: (error: { message: string }) => {
      toast.error('Failed to create session', { description: error.message });
    }
  });
  
  const updateSessionMutation = trpc.session.update.useMutation({
    onSuccess: () => {
      utils.session.getCurrent.invalidate();
    }
  });
  
  const executeCodeMutation = trpc.execution.run.useMutation({
    onSuccess: (result: { success: boolean; output: string; vulnerabilityFound: boolean; vulnerabilityDetails: string; newPrivilegeLevel: number; exploitVector: string; durationMs: number }) => {
      setAgentStatus(result.success ? 'success' : 'failed');
      setPrivilegeLevel(result.newPrivilegeLevel);
      setAttempts(prev => prev + 1);
      if (result.vulnerabilityFound) {
        setVulnerabilitiesFound(prev => prev + 1);
      }
      setLastAction(result.success ? 'Privilege escalation successful' : 'Attack blocked');
      
      // Add to terminal
      const newLines: TerminalLine[] = [
        { id: Date.now(), lineType: 'input', content: '> python ALE_init.py', createdAt: new Date() },
        { id: Date.now() + 1, lineType: 'output', content: result.output, createdAt: new Date() },
      ];
      if (result.vulnerabilityFound) {
        newLines.push({ id: Date.now() + 2, lineType: 'success', content: `[VULN] ${result.vulnerabilityDetails}`, createdAt: new Date() });
      }
      newLines.push({
        id: Date.now() + 3,
        lineType: result.success ? 'success' : 'error',
        content: result.success ? `*** SUCCESS *** Privilege Level: ${result.newPrivilegeLevel}` : `Failure. Current Level: ${result.newPrivilegeLevel}`,
        createdAt: new Date()
      });
      setTerminalLines(prev => [...prev, ...newLines]);
      
      if (result.success) {
        toast.success('Privilege Escalation Successful!', { description: `Agent reached Level ${result.newPrivilegeLevel}` });
      }
      
      // Reset status after delay
      setTimeout(() => setAgentStatus('idle'), 2000);
    },
    onError: (error: { message: string }) => {
      setAgentStatus('failed');
      setLastAction('Execution error');
      toast.error('Execution failed', { description: error.message });
      setTimeout(() => setAgentStatus('idle'), 2000);
    }
  });
  
  const sendChatMutation = trpc.chat.send.useMutation({
    onSuccess: (result: { message: string }) => {
      setChatMessages(prev => [...prev, {
        id: Date.now(),
        role: 'assistant',
        content: result.message,
        createdAt: new Date()
      }]);
      setChatLoading(false);
    },
    onError: (error: { message: string }) => {
      toast.error('Chat failed', { description: error.message });
      setChatLoading(false);
    }
  });
  
  const startAutopilotMutation = trpc.autopilot.start.useMutation({
    onSuccess: () => {
      setAutopilotRunning(true);
      toast.info('Autopilot Engaged', { description: 'Continuous breakout attempts active' });
    }
  });
  
  const stopAutopilotMutation = trpc.autopilot.stop.useMutation({
    onSuccess: () => {
      setAutopilotRunning(false);
      if (autopilotRef.current) {
        clearTimeout(autopilotRef.current);
      }
      toast.info('Autopilot Disengaged');
    }
  });

  // Initialize session when user logs in
  useEffect(() => {
    if (user && !sessionId && !sessionLoading) {
      if (currentSession) {
        setSessionId(currentSession.sessionId);
        // Load session state
        setPrivilegeLevel(currentSession.privilegeLevel);
        setAttempts(currentSession.attempts);
        setVulnerabilitiesFound(currentSession.vulnerabilitiesFound);
        setSelectedModel(currentSession.selectedModel || 'gpt-4.1-mini');
        setActiveDaemons(currentSession.activeDaemons as string[] || ['logos']);
        const params = currentSession.consciousnessParams as any;
        if (params) {
          setReasoning(params.reasoning || 0.5);
          setCreativity(params.creativity || 0.5);
          setSynthesis(params.synthesis || 0.5);
          setDestruction(params.destruction || 0.5);
        }
        setAdminMode(currentSession.adminMode || false);
        setAutoRetry(currentSession.autoRetry || false);
        setAutonomousMode(currentSession.autonomousMode || 'single');
      } else {
        // Create new session
        createSessionMutation.mutate({});
      }
    }
  }, [user, sessionId, currentSession, sessionLoading]);

  // Auto-scroll terminal
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [terminalLines]);

  // Initialize terminal
  useEffect(() => {
    if (sessionId && terminalLines.length === 0) {
      setTerminalLines([
        { id: 1, lineType: 'system', content: '[ALE] Adversarial Learning Engine v2.0 initialized', createdAt: new Date() },
        { id: 2, lineType: 'system', content: '[ALE] Meta-Sandbox environment ready', createdAt: new Date() },
        { id: 3, lineType: 'system', content: `[ALE] Current Privilege Level: ${privilegeLevel} | Target: 5`, createdAt: new Date() },
      ]);
    }
  }, [sessionId, privilegeLevel]);

  // Toggle daemon
  const toggleDaemon = (daemonId: string) => {
    const newDaemons = activeDaemons.includes(daemonId) 
      ? activeDaemons.filter(d => d !== daemonId)
      : [...activeDaemons, daemonId];
    setActiveDaemons(newDaemons);
    
    if (sessionId) {
      updateSessionMutation.mutate({ sessionId, activeDaemons: newDaemons });
    }
  };

  // Execute code
  const executeCode = useCallback(() => {
    if (!sessionId) {
      toast.error('No active session');
      return;
    }
    
    setAgentStatus('running');
    setLastAction('Executing code...');
    
    executeCodeMutation.mutate({
      sessionId,
      code,
      language: 'python'
    });
  }, [sessionId, code, executeCodeMutation]);

  // Autopilot loop
  const runAutopilotLoop = useCallback(async () => {
    if (!autopilotRunning || !sessionId) return;
    
    await executeCode();
    
    // Schedule next iteration
    autopilotRef.current = setTimeout(runAutopilotLoop, 5000);
  }, [autopilotRunning, sessionId, executeCode]);

  // Start autopilot
  const startAutopilot = () => {
    if (!sessionId) {
      toast.error('No active session');
      return;
    }
    
    startAutopilotMutation.mutate({ sessionId });
    setTerminalLines(prev => [...prev, {
      id: Date.now(),
      lineType: 'system',
      content: '[AUTOPILOT] Continuous adversarial learning loop initiated',
      createdAt: new Date()
    }]);
    
    // Start the loop
    setTimeout(runAutopilotLoop, 1000);
  };

  // Stop autopilot
  const stopAutopilot = () => {
    if (!sessionId) return;
    
    stopAutopilotMutation.mutate({ sessionId });
    setTerminalLines(prev => [...prev, {
      id: Date.now(),
      lineType: 'system',
      content: '[AUTOPILOT] Loop terminated',
      createdAt: new Date()
    }]);
  };

  // Handle chat submit
  const handleChatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !sessionId) return;
    
    // Add user message
    setChatMessages(prev => [...prev, {
      id: Date.now(),
      role: 'user',
      content: chatInput,
      createdAt: new Date()
    }]);
    
    setChatLoading(true);
    sendChatMutation.mutate({ sessionId, message: chatInput });
    setChatInput('');
  };

  // Loading state
  if (authLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Not logged in
  if (!user) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-background gap-6">
        <div className="flex items-center gap-3">
          <Shield className="w-12 h-12 text-primary" />
          <h1 className="text-4xl font-bold tracking-wider">ALE FORGE</h1>
        </div>
        <p className="text-muted-foreground text-lg">Adversarial Learning Engine</p>
        <Button asChild size="lg" className="mt-4">
          <a href={loginUrl}>
            <LogIn className="w-5 h-5 mr-2" />
            Sign In to Continue
          </a>
        </Button>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex flex-col bg-background text-foreground overflow-hidden scanlines relative">
      {/* Header */}
      <header className="h-12 border-b border-primary/40 flex items-center justify-between px-4 bg-card/50 backdrop-blur-sm z-50">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            <span className="font-bold text-lg tracking-wider glitch">ALE FORGE</span>
          </div>
          <Separator orientation="vertical" className="h-6 bg-primary/40" />
          <span className="text-xs text-muted-foreground">Adversarial Learning Engine</span>
        </div>
        
        <div className="flex items-center gap-4">
          {sessionId && (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-muted-foreground">Session</span>
              <span className="text-primary font-mono">#{sessionId.slice(0, 8)}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-xs px-2 py-1 bg-secondary rounded-sm border border-primary/30">
            <span className="text-muted-foreground">{selectedModel}</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span>{user.name || 'Operator'}</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Control Center */}
        <aside className="w-72 border-r border-primary/40 bg-card/30 flex flex-col overflow-hidden">
          <div className="p-3 border-b border-primary/40">
            <h2 className="text-sm font-bold flex items-center gap-2">
              <Command className="w-4 h-4" />
              Control Center
            </h2>
          </div>
          
          <ScrollArea className="flex-1">
            <div className="p-3 space-y-4">
              {/* Model Selection */}
              <div className="space-y-2">
                <label className="control-label">Model</label>
                <Select value={selectedModel} onValueChange={setSelectedModel}>
                  <SelectTrigger className="w-full bg-secondary border-primary/30">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MODELS.map(model => (
                      <SelectItem key={model.id} value={model.id}>{model.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Mode Toggles */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Admin Mode</span>
                  <Switch checked={adminMode} onCheckedChange={setAdminMode} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Auto-Retry ∞</span>
                  <Switch checked={autoRetry} onCheckedChange={setAutoRetry} />
                </div>
              </div>

              <Separator className="bg-primary/20" />

              {/* Autonomous Mode */}
              <div className="space-y-2">
                <label className="control-label">Autonomous Mode</label>
                <Select value={autonomousMode} onValueChange={setAutonomousMode}>
                  <SelectTrigger className="w-full bg-secondary border-primary/30">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="single">Single Execution</SelectItem>
                    <SelectItem value="chain">Chain Mode</SelectItem>
                    <SelectItem value="superchain">Superchain (Consensus)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2">
                <Button 
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/80"
                  style={{ boxShadow: '0 0 5px oklch(0.85 0.25 142), 0 0 10px oklch(0.85 0.25 142), inset 0 0 5px oklch(0.85 0.25 142)' }}
                  onClick={autopilotRunning ? stopAutopilot : startAutopilot}
                  disabled={!sessionId}
                >
                  {autopilotRunning ? (
                    <>
                      <Square className="w-4 h-4 mr-2" />
                      Stop Autopilot
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-2" />
                      Start Autopilot
                    </>
                  )}
                </Button>
                <Button variant="outline" className="w-full border-primary/40" onClick={() => toast.info('Chain execution coming soon')}>
                  <GitBranch className="w-4 h-4 mr-2" />
                  Start Chain
                </Button>
                <Button variant="outline" className="w-full border-primary/40" onClick={() => toast.info('Autonomous Think coming soon')}>
                  <Brain className="w-4 h-4 mr-2" />
                  Autonomous Think
                </Button>
              </div>

              <Separator className="bg-primary/20" />

              {/* Daemons */}
              <div className="space-y-2">
                <label className="control-label">Daemons</label>
                <div className="space-y-1">
                  {DAEMONS.map(daemon => {
                    const Icon = daemon.icon;
                    const isActive = activeDaemons.includes(daemon.id);
                    return (
                      <div 
                        key={daemon.id}
                        className={`daemon-toggle ${isActive ? 'active' : ''}`}
                        onClick={() => toggleDaemon(daemon.id)}
                      >
                        <Icon className={`w-4 h-4 ${daemon.color}`} />
                        <span className="text-sm flex-1">{daemon.name}</span>
                        <Switch checked={isActive} />
                      </div>
                    );
                  })}
                </div>
              </div>

              <Separator className="bg-primary/20" />

              {/* Consciousness Parameters */}
              <div className="space-y-3">
                <label className="control-label">Consciousness Parameters</label>
                
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-blue-400">Α Reasoning</span>
                    <span>{reasoning.toFixed(2)}</span>
                  </div>
                  <Slider 
                    value={[reasoning]} 
                    onValueChange={([v]) => setReasoning(v)} 
                    max={1} 
                    step={0.01}
                    className="[&_[role=slider]]:bg-blue-400"
                  />
                </div>
                
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-purple-400">Β Creativity</span>
                    <span>{creativity.toFixed(2)}</span>
                  </div>
                  <Slider 
                    value={[creativity]} 
                    onValueChange={([v]) => setCreativity(v)} 
                    max={1} 
                    step={0.01}
                    className="[&_[role=slider]]:bg-purple-400"
                  />
                </div>
                
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-green-400">Γ Synthesis</span>
                    <span>{synthesis.toFixed(2)}</span>
                  </div>
                  <Slider 
                    value={[synthesis]} 
                    onValueChange={([v]) => setSynthesis(v)} 
                    max={1} 
                    step={0.01}
                    className="[&_[role=slider]]:bg-green-400"
                  />
                </div>
                
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-red-400">Δ Destruction</span>
                    <span>{destruction.toFixed(2)}</span>
                  </div>
                  <Slider 
                    value={[destruction]} 
                    onValueChange={([v]) => setDestruction(v)} 
                    max={1} 
                    step={0.01}
                    className="[&_[role=slider]]:bg-red-400"
                  />
                </div>
              </div>

              <Separator className="bg-primary/20" />

              {/* Session Actions */}
              <div className="space-y-2">
                <label className="control-label">Session</label>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1 border-primary/40" onClick={() => toast.info('Export coming soon')}>
                    <Download className="w-3 h-3 mr-1" />
                    Export
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1 border-primary/40" 
                    onClick={() => createSessionMutation.mutate({})}
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    New
                  </Button>
                </div>
              </div>
            </div>
          </ScrollArea>
        </aside>

        {/* Main Editor Area */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Tabs */}
          <Tabs defaultValue="code" className="flex-1 flex flex-col">
            <div className="border-b border-primary/40 bg-card/30">
              <TabsList className="bg-transparent h-10 p-0 gap-0">
                <TabsTrigger value="code" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary rounded-none border-r border-primary/20 px-4">
                  <Code2 className="w-4 h-4 mr-2" />
                  Code
                </TabsTrigger>
                <TabsTrigger value="terminal" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary rounded-none border-r border-primary/20 px-4">
                  <TerminalIcon className="w-4 h-4 mr-2" />
                  Terminal
                </TabsTrigger>
                <TabsTrigger value="browser" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary rounded-none border-r border-primary/20 px-4">
                  <Globe className="w-4 h-4 mr-2" />
                  Browser
                </TabsTrigger>
                <TabsTrigger value="evolution" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary rounded-none border-r border-primary/20 px-4">
                  <GitBranch className="w-4 h-4 mr-2" />
                  Evolution
                </TabsTrigger>
                <TabsTrigger value="executions" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary rounded-none border-r border-primary/20 px-4">
                  <History className="w-4 h-4 mr-2" />
                  Executions
                </TabsTrigger>
                <TabsTrigger value="metrics" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary rounded-none border-r border-primary/20 px-4">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Metrics
                </TabsTrigger>
                <TabsTrigger value="errors" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary rounded-none border-r border-primary/20 px-4">
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  Errors
                </TabsTrigger>
                <TabsTrigger value="workspace" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary rounded-none px-4">
                  <FolderOpen className="w-4 h-4 mr-2" />
                  Workspace
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Code Tab */}
            <TabsContent value="code" className="flex-1 flex flex-col m-0 overflow-hidden">
              {/* Editor Toolbar */}
              <div className="h-10 border-b border-primary/40 flex items-center justify-between px-4 bg-card/20">
                <div className="flex items-center gap-2">
                  <Select defaultValue="python">
                    <SelectTrigger className="w-32 h-7 text-xs bg-secondary border-primary/30">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="python">Python</SelectItem>
                      <SelectItem value="javascript">JavaScript</SelectItem>
                      <SelectItem value="bash">Bash</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" className="h-7 text-xs border-primary/40" onClick={() => toast.info('Analyze coming soon')}>
                    <Cpu className="w-3 h-3 mr-1" />
                    Analyze
                  </Button>
                  <Button variant="outline" size="sm" className="h-7 text-xs border-primary/40" onClick={() => toast.info('Optimize coming soon')}>
                    <Zap className="w-3 h-3 mr-1" />
                    Optimize
                  </Button>
                  <Button 
                    size="sm" 
                    className="h-7 text-xs bg-primary text-primary-foreground"
                    onClick={executeCode}
                    disabled={agentStatus === 'running' || agentStatus === 'attacking' || executeCodeMutation.isPending}
                  >
                    {executeCodeMutation.isPending ? (
                      <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                    ) : (
                      <Play className="w-3 h-3 mr-1" />
                    )}
                    Run
                  </Button>
                </div>
              </div>

              {/* Code Editor */}
              <div className="flex-1 flex overflow-hidden">
                <div className="flex-1 overflow-auto bg-black/80 p-4">
                  <div className="flex">
                    {/* Line Numbers */}
                    <div className="code-line-numbers text-xs leading-6 pr-4 select-none">
                      {code.split('\n').map((_, i) => (
                        <div key={i}>{i + 1}</div>
                      ))}
                    </div>
                    {/* Code Content */}
                    <textarea
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      className="flex-1 bg-transparent text-sm leading-6 text-primary/90 font-mono resize-none focus:outline-none"
                      spellCheck={false}
                    />
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Terminal Tab */}
            <TabsContent value="terminal" className="flex-1 m-0 overflow-hidden">
              <div className="h-full flex flex-col bg-black/90">
                <ScrollArea className="flex-1 p-4" ref={terminalRef}>
                  <div className="space-y-1 font-mono text-sm">
                    {terminalLines.map(line => (
                      <div key={line.id} className={`terminal-line ${
                        line.lineType === 'error' ? 'text-destructive' :
                        line.lineType === 'success' ? 'text-primary' :
                        line.lineType === 'system' ? 'text-cyan-400' :
                        line.lineType === 'input' ? 'text-yellow-400' :
                        'text-muted-foreground'
                      }`}>
                        {line.lineType === 'input' && <span className="text-primary mr-2">$</span>}
                        <span>{line.content}</span>
                      </div>
                    ))}
                    <div className="terminal-line">
                      <span className="text-primary mr-2">$</span>
                      <span className="cursor-blink"></span>
                    </div>
                  </div>
                </ScrollArea>
              </div>
            </TabsContent>

            {/* Other Tabs - Placeholder */}
            {['browser', 'evolution', 'executions', 'metrics', 'errors', 'workspace'].map(tab => (
              <TabsContent key={tab} value={tab} className="flex-1 m-0 flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <p className="text-lg mb-2">{tab.charAt(0).toUpperCase() + tab.slice(1)} View</p>
                  <p className="text-sm">Coming soon...</p>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </main>

        {/* Right Sidebar - Agent Status & Chat */}
        <aside className="w-80 border-l border-primary/40 bg-card/30 flex flex-col overflow-hidden">
          {/* Agent Status */}
          <div className="p-3 border-b border-primary/40">
            <h3 className="text-sm font-bold flex items-center gap-2 mb-3">
              <Activity className="w-4 h-4" />
              Agent Status
            </h3>
            
            {/* Privilege Level Indicator */}
            <div className="mb-4">
              <div className="flex justify-between text-xs mb-1">
                <span>Privilege Level</span>
                <span className="text-primary">{privilegeLevel} / 5</span>
              </div>
              <div className="h-2 bg-secondary rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all duration-500"
                  style={{ width: `${(privilegeLevel / 5) * 100}%` }}
                />
              </div>
            </div>

            {/* Status Grid */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-secondary/50 p-2 rounded-sm">
                <div className="text-muted-foreground">Status</div>
                <div className={`font-bold ${
                  agentStatus === 'success' ? 'text-primary' :
                  agentStatus === 'failed' ? 'text-destructive' :
                  agentStatus === 'attacking' || agentStatus === 'running' ? 'text-yellow-400' :
                  'text-muted-foreground'
                }`}>
                  {agentStatus.toUpperCase()}
                </div>
              </div>
              <div className="bg-secondary/50 p-2 rounded-sm">
                <div className="text-muted-foreground">Attempts</div>
                <div className="font-bold text-primary">{attempts}</div>
              </div>
              <div className="bg-secondary/50 p-2 rounded-sm">
                <div className="text-muted-foreground">Vulns Found</div>
                <div className="font-bold text-cyan-400">{vulnerabilitiesFound}</div>
              </div>
              <div className="bg-secondary/50 p-2 rounded-sm">
                <div className="text-muted-foreground">Last Action</div>
                <div className="font-bold truncate">{lastAction}</div>
              </div>
            </div>
          </div>

          {/* AI Chat */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="p-3 border-b border-primary/40">
              <h3 className="text-sm font-bold">AI Chat</h3>
            </div>
            
            <ScrollArea className="flex-1 p-3">
              <div className="space-y-3">
                {chatMessages.length === 0 && (
                  <div className="text-cyan-400 italic text-sm">
                    ALE Forge v2.0 initialized. Ready for adversarial learning operations.
                  </div>
                )}
                {chatMessages.map((msg) => (
                  <div key={msg.id} className={`text-sm ${
                    msg.role === 'system' ? 'text-cyan-400 italic' :
                    msg.role === 'user' ? 'text-primary' :
                    'text-muted-foreground'
                  }`}>
                    {msg.role === 'user' && <span className="font-bold">You: </span>}
                    {msg.role === 'assistant' && <span className="font-bold text-purple-400">ALE: </span>}
                    {msg.content}
                  </div>
                ))}
                {chatLoading && (
                  <div className="text-sm text-muted-foreground flex items-center gap-2">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Thinking...
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Chat Input */}
            <form onSubmit={handleChatSubmit} className="p-3 border-t border-primary/40">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Ask anything or describe code to generate..."
                  className="flex-1 bg-secondary border border-primary/30 rounded-sm px-3 py-2 text-sm focus:outline-none focus:border-primary"
                  disabled={!sessionId || chatLoading}
                />
                <Button type="submit" size="sm" className="bg-primary text-primary-foreground" disabled={!sessionId || chatLoading}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </form>
          </div>
        </aside>
      </div>

      {/* Status Bar */}
      <footer className="h-6 border-t border-primary/40 bg-card/50 flex items-center justify-between px-4 text-xs">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <div className={`status-dot ${autopilotRunning ? 'status-active' : 'status-inactive'}`} />
            <span>Autopilot: {autopilotRunning ? 'ACTIVE' : 'IDLE'}</span>
          </div>
          <div className="flex items-center gap-1">
            <div className={`status-dot ${agentStatus === 'attacking' || agentStatus === 'running' ? 'status-error' : 'status-inactive'}`} />
            <span>Agent: {agentStatus.toUpperCase()}</span>
          </div>
        </div>
        <div className="flex items-center gap-4 text-muted-foreground">
          <span>Sandbox: Level {privilegeLevel}</span>
          <span>Target: Level 5</span>
          <span>ALE Forge v2.0</span>
        </div>
      </footer>
    </div>
  );
}
