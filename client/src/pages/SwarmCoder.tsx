/**
 * Kimi Swarm Autonomous Coder
 * 
 * A comprehensive IDE interface with swarm orchestration capabilities.
 * Features:
 * - Swarm Orchestrator: Agent management, task queue, autonomy controls
 * - IDE Core: File explorer, code editor, preview
 * - Ops & Vault: Control API, embedded vault system
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { trpc } from '@/lib/trpc';
import { 
  Bot, Play, Pause, Plus, Trash2, RefreshCw, FileCode, 
  Save, FolderOpen, Search, Terminal, Shield, Sparkles,
  Cpu, ListTodo, Settings, Lock, FileText, X, ChevronRight
} from 'lucide-react';

// Types
interface Agent {
  id: string;
  name: string;
  role: string;
  status: 'idle' | 'busy' | 'done' | 'error';
  currentTask?: string;
  skills: string[];
}

interface Task {
  id: string;
  text: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: string;
}

interface IDEFile {
  name: string;
  language: string;
  content: string;
  lastModified: Date;
  version: number;
}

interface VaultItem {
  key: string;
  name: string;
  path: string;
  mime: string;
  bytes: number;
  isHidden: boolean;
}

export default function SwarmCoder() {
  // Session state
  const [sessionId, setSessionId] = useState<string>('');
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  
  // Swarm state
  const [agents, setAgents] = useState<Agent[]>([]);
  const [queue, setQueue] = useState<Task[]>([]);
  const [completedTasks, setCompletedTasks] = useState<Task[]>([]);
  const [autonomy, setAutonomy] = useState({
    autopilot: true,
    selfHeal: true,
    tests: false,
    docs: true,
    maxConcurrentAgents: 8,
    autoSpawnAgents: true,
  });
  const [swarmStatus, setSwarmStatus] = useState<'idle' | 'active' | 'autopilot' | 'paused'>('idle');
  
  // IDE state
  const [files, setFiles] = useState<IDEFile[]>([]);
  const [currentFile, setCurrentFile] = useState<IDEFile | null>(null);
  const [editorContent, setEditorContent] = useState('');
  const [fileSearch, setFileSearch] = useState('');
  const [output, setOutput] = useState('Console output will appear here...\n');
  const [previewHtml, setPreviewHtml] = useState('');
  
  // Vault state
  const [vaultItems, setVaultItems] = useState<VaultItem[]>([]);
  const [showHiddenVault, setShowHiddenVault] = useState(false);
  const [selectedVaultItem, setSelectedVaultItem] = useState<VaultItem | null>(null);
  
  // Logs
  const [logs, setLogs] = useState<string[]>([]);
  const logEndRef = useRef<HTMLDivElement>(null);

  // TRPC hooks
  const createSessionMutation = trpc.swarm.session.create.useMutation();
  const getSessionQuery = trpc.swarm.session.get.useQuery({ sessionId }, { enabled: !!sessionId });
  const spawnAgentMutation = trpc.swarm.agents.spawn.useMutation();
  const enqueueTaskMutation = trpc.swarm.tasks.enqueue.useMutation();
  const stepMutation = trpc.swarm.tasks.step.useMutation();
  const clearQueueMutation = trpc.swarm.tasks.clear.useMutation();
  const updateAutonomyMutation = trpc.swarm.autonomy.update.useMutation();
  const startAutopilotMutation = trpc.swarm.autonomy.startAutopilot.useMutation();
  const stopAutopilotMutation = trpc.swarm.autonomy.stopAutopilot.useMutation();
  const createFileMutation = trpc.swarm.files.create.useMutation();
  const updateFileMutation = trpc.swarm.files.update.useMutation();
  const listFilesQuery = trpc.swarm.files.list.useQuery({ sessionId }, { enabled: !!sessionId });
  const listVaultQuery = trpc.swarm.vault.list.useQuery({ sessionId, includeHidden: showHiddenVault }, { enabled: !!sessionId });

  // Initialize session
  const createSession = async () => {
    setIsCreatingSession(true);
    try {
      const result = await createSessionMutation.mutateAsync({ name: 'Kimi Swarm Session' });
      setSessionId(result.id);
      addLog(`Session created: ${result.name} (${result.id})`);
    } catch (error) {
      addLog(`Error creating session: ${error}`);
    }
    setIsCreatingSession(false);
  };

  // Log helper
  const addLog = useCallback((msg: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${timestamp}] ${msg}`].slice(-100));
  }, []);

  // Scroll logs to bottom
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  // Poll session data
  useEffect(() => {
    if (!sessionId) return;
    
    const interval = setInterval(() => {
      getSessionQuery.refetch();
      listFilesQuery.refetch();
      listVaultQuery.refetch();
    }, 2000);

    return () => clearInterval(interval);
  }, [sessionId]);

  // Update state from query
  useEffect(() => {
    if (getSessionQuery.data && 'agents' in getSessionQuery.data) {
      const data = getSessionQuery.data;
      setAgents(data.agents as Agent[]);
      setQueue(data.queue as Task[]);
      setAutonomy(data.autonomy as typeof autonomy);
      setSwarmStatus(data.status as typeof swarmStatus);
    }
  }, [getSessionQuery.data]);

  useEffect(() => {
    if (listFilesQuery.data) {
      setFiles(listFilesQuery.data as IDEFile[]);
    }
  }, [listFilesQuery.data]);

  useEffect(() => {
    if (listVaultQuery.data) {
      setVaultItems(listVaultQuery.data as VaultItem[]);
    }
  }, [listVaultQuery.data]);

  // Swarm actions
  const spawnAgent = async (role?: string) => {
    if (!sessionId) return;
    try {
      const result = await spawnAgentMutation.mutateAsync({ sessionId, role: role as any });
      if ('error' in result) {
        addLog(`Error: ${result.error}`);
      } else {
        addLog(`Spawned ${result.name} (${result.role})`);
      }
    } catch (error) {
      addLog(`Error spawning agent: ${error}`);
    }
  };

  const enqueueTask = async () => {
    if (!sessionId) return;
    const text = prompt('Task for swarm:');
    if (!text) return;
    try {
      const result = await enqueueTaskMutation.mutateAsync({ sessionId, text, priority: 'medium' });
      if ('error' in result) {
        addLog(`Error: ${result.error}`);
      } else {
        addLog(`Queued task: ${result.text}`);
      }
    } catch (error) {
      addLog(`Error enqueuing task: ${error}`);
    }
  };

  const stepSwarm = async () => {
    if (!sessionId) return;
    try {
      const result = await stepMutation.mutateAsync({ sessionId });
      if ('error' in result) {
        addLog(`Step: ${result.error}`);
      } else {
        addLog(`${result.agent.name} completed: ${result.task.text.slice(0, 50)}...`);
        setOutput(prev => prev + `\n[${result.agent.name}] ${result.result.slice(0, 500)}`);
      }
    } catch (error) {
      addLog(`Error stepping swarm: ${error}`);
    }
  };

  const clearQueue = async () => {
    if (!sessionId) return;
    try {
      await clearQueueMutation.mutateAsync({ sessionId });
      addLog('Queue cleared');
    } catch (error) {
      addLog(`Error clearing queue: ${error}`);
    }
  };

  const toggleAutonomy = async (key: keyof typeof autonomy) => {
    if (!sessionId) return;
    const updates = { [key]: !autonomy[key] };
    try {
      await updateAutonomyMutation.mutateAsync({ sessionId, ...updates });
      setAutonomy(prev => ({ ...prev, ...updates }));
      addLog(`${key} set to ${updates[key]}`);
    } catch (error) {
      addLog(`Error updating autonomy: ${error}`);
    }
  };

  const toggleAutopilot = async () => {
    if (!sessionId) return;
    try {
      if (autonomy.autopilot) {
        await stopAutopilotMutation.mutateAsync({ sessionId });
        addLog('Autopilot stopped');
      } else {
        await startAutopilotMutation.mutateAsync({ sessionId });
        addLog('Autopilot started');
      }
    } catch (error) {
      addLog(`Error toggling autopilot: ${error}`);
    }
  };

  // IDE actions
  const createFile = async () => {
    if (!sessionId) return;
    const name = prompt('Enter file name (e.g., script.js, page.html):');
    if (!name) return;
    try {
      await createFileMutation.mutateAsync({ sessionId, name, content: '' });
      addLog(`Created file: ${name}`);
      listFilesQuery.refetch();
    } catch (error) {
      addLog(`Error creating file: ${error}`);
    }
  };

  const openFile = (file: IDEFile) => {
    setCurrentFile(file);
    setEditorContent(file.content);
    
    // Auto-preview HTML/CSS
    if (file.language === 'html') {
      setPreviewHtml(file.content);
    } else if (file.language === 'css') {
      setPreviewHtml(`<html><head><style>${file.content}</style></head><body><div style="padding:20px">CSS Preview</div></body></html>`);
    }
  };

  const saveFile = async () => {
    if (!sessionId || !currentFile) return;
    try {
      await updateFileMutation.mutateAsync({ sessionId, name: currentFile.name, content: editorContent });
      addLog(`Saved: ${currentFile.name}`);
      listFilesQuery.refetch();
    } catch (error) {
      addLog(`Error saving file: ${error}`);
    }
  };

  const runCode = () => {
    if (!currentFile) return;
    
    if (currentFile.language === 'javascript') {
      setOutput('');
      const originalLog = console.log;
      const logs: string[] = [];
      console.log = (...args) => logs.push(args.join(' '));
      
      try {
        eval(editorContent);
        setOutput(logs.join('\n') || 'Code executed successfully');
      } catch (e: any) {
        setOutput(`Error: ${e.message}`);
      } finally {
        console.log = originalLog;
      }
      setPreviewHtml('');
    } else if (currentFile.language === 'html') {
      setPreviewHtml(editorContent);
      setOutput('HTML preview updated');
    } else if (currentFile.language === 'css') {
      setPreviewHtml(`<html><head><style>${editorContent}</style></head><body><div style="padding:20px">CSS Preview</div></body></html>`);
      setOutput('CSS preview updated');
    } else {
      setOutput(`Cannot run ${currentFile.language} files directly`);
    }
  };

  const queueReview = () => {
    if (!currentFile) {
      addLog('No file loaded for review');
      return;
    }
    enqueueTaskMutation.mutateAsync({ 
      sessionId, 
      text: `Review ${currentFile.name} for bugs + tests`, 
      priority: 'high' 
    });
    addLog(`Queued review for ${currentFile.name}`);
  };

  const filteredFiles = files.filter(f => 
    f.name.toLowerCase().includes(fileSearch.toLowerCase())
  );

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'idle': return 'bg-slate-500';
      case 'busy': return 'bg-amber-500';
      case 'done': return 'bg-emerald-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-slate-500';
    }
  };

  if (!sessionId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <Card className="w-96">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="w-6 h-6" />
              Kimi Swarm Coder
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={createSession} 
              disabled={isCreatingSession}
              className="w-full"
              size="lg"
            >
              {isCreatingSession ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4 mr-2" />
              )}
              Initialize Swarm Session
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Top Bar */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Bot className="w-6 h-6 text-cyan-400" />
            <div>
              <h1 className="font-bold text-sm">Kimi Swarm Coder</h1>
              <p className="text-xs text-slate-400">Orchestrated agents + embedded vault</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Badge variant={swarmStatus === 'autopilot' ? 'default' : 'secondary'} className="text-xs">
              {swarmStatus}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {agents.length} agents
            </Badge>
            <Badge variant="outline" className="text-xs">
              {queue.length} tasks
            </Badge>
          </div>
        </div>
      </header>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 p-4 h-[calc(100vh-64px)]">
        
        {/* Left Panel - Swarm Orchestrator */}
        <div className="lg:col-span-1 space-y-4">
          <Tabs defaultValue="agents" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="agents"><Bot className="w-4 h-4" /></TabsTrigger>
              <TabsTrigger value="queue"><ListTodo className="w-4 h-4" /></TabsTrigger>
              <TabsTrigger value="settings"><Settings className="w-4 h-4" /></TabsTrigger>
            </TabsList>

            {/* Agents Tab */}
            <TabsContent value="agents" className="space-y-2">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs uppercase tracking-wider text-cyan-400 flex items-center justify-between">
                    Agents
                    <Button size="sm" variant="ghost" onClick={() => spawnAgent()}>
                      <Plus className="w-4 h-4" />
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <ScrollArea className="h-[200px]">
                    {agents.map(agent => (
                      <div 
                        key={agent.id} 
                        className="flex items-center gap-2 p-2 rounded border border-slate-800 bg-slate-900/50 mb-2"
                      >
                        <div className={`w-2 h-2 rounded-full ${getStatusColor(agent.status)}`} />
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-medium truncate">{agent.name}</div>
                          <div className="text-[10px] text-slate-500">{agent.role}</div>
                        </div>
                        <div className="text-[10px] text-slate-500 uppercase">{agent.status}</div>
                      </div>
                    ))}
                  </ScrollArea>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="flex-1 text-xs" onClick={enqueueTask}>
                      Assign Task
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Queue Tab */}
            <TabsContent value="queue" className="space-y-2">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs uppercase tracking-wider text-emerald-400 flex items-center justify-between">
                    Queue
                    <Button size="sm" variant="ghost" onClick={clearQueue}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <ScrollArea className="h-[200px]">
                    {queue.length === 0 ? (
                      <div className="text-xs text-slate-500 text-center py-4">Queue empty</div>
                    ) : (
                      queue.map(task => (
                        <div 
                          key={task.id} 
                          className="p-2 rounded border border-slate-800 bg-slate-900/50 mb-2"
                        >
                          <div className="flex items-center gap-2">
                            <Badge variant={task.priority === 'critical' ? 'destructive' : 'outline'} className="text-[10px]">
                              {task.priority}
                            </Badge>
                            <span className="text-[10px] text-slate-400">{task.id}</span>
                          </div>
                          <div className="text-xs mt-1 truncate">{task.text}</div>
                        </div>
                      ))
                    )}
                  </ScrollArea>
                  <div className="flex gap-2">
                    <Button size="sm" className="flex-1 text-xs" onClick={stepSwarm}>
                      <Play className="w-3 h-3 mr-1" /> Run Step
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings" className="space-y-2">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs uppercase tracking-wider text-amber-400">
                    Autonomy
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs">Autopilot</span>
                    <Switch 
                      checked={autonomy.autopilot} 
                      onCheckedChange={() => toggleAutonomy('autopilot')}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs">Self-Heal</span>
                    <Switch 
                      checked={autonomy.selfHeal} 
                      onCheckedChange={() => toggleAutonomy('selfHeal')}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs">Unit Tests</span>
                    <Switch 
                      checked={autonomy.tests} 
                      onCheckedChange={() => toggleAutonomy('tests')}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs">Doc Sync</span>
                    <Switch 
                      checked={autonomy.docs} 
                      onCheckedChange={() => toggleAutonomy('docs')}
                    />
                  </div>
                  <Button 
                    size="sm" 
                    variant={autonomy.autopilot ? "destructive" : "default"}
                    className="w-full text-xs"
                    onClick={toggleAutopilot}
                  >
                    {autonomy.autopilot ? <Pause className="w-3 h-3 mr-1" /> : <Play className="w-3 h-3 mr-1" />}
                    {autonomy.autopilot ? 'Stop Autopilot' : 'Start Autopilot'}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Status Log */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs uppercase tracking-wider text-slate-400">
                <Terminal className="w-4 h-4 inline mr-1" /> Logs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[150px] bg-slate-950 rounded border border-slate-800 p-2">
                <div className="text-[10px] font-mono space-y-1">
                  {logs.map((log, i) => (
                    <div key={i} className="text-slate-400">{log}</div>
                  ))}
                  <div ref={logEndRef} />
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Center Panel - IDE Core */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="h-full flex flex-col">
            <CardHeader className="pb-2 border-b border-slate-800">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs uppercase tracking-wider flex items-center gap-2">
                  <FileCode className="w-4 h-4" />
                  IDE Core
                </CardTitle>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={createFile}>
                    <Plus className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={queueReview}>
                    <Bot className="w-4 h-4 mr-1" /> Swarm Review
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex-1 p-0 flex flex-col">
              <div className="grid grid-cols-4 h-full">
                {/* File Explorer */}
                <div className="col-span-1 border-r border-slate-800 p-2">
                  <div className="flex items-center gap-2 mb-2">
                    <Search className="w-3 h-3 text-slate-500" />
                    <Input 
                      placeholder="Search..." 
                      value={fileSearch}
                      onChange={(e) => setFileSearch(e.target.value)}
                      className="h-7 text-xs"
                    />
                  </div>
                  <ScrollArea className="h-[calc(100%-40px)]">
                    {filteredFiles.map(file => (
                      <div 
                        key={file.name}
                        onClick={() => openFile(file)}
                        className={`flex items-center gap-2 p-2 rounded cursor-pointer text-xs ${
                          currentFile?.name === file.name 
                            ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30' 
                            : 'hover:bg-slate-800/50'
                        }`}
                      >
                        <FileText className="w-3 h-3" />
                        <span className="truncate">{file.name}</span>
                      </div>
                    ))}
                  </ScrollArea>
                </div>

                {/* Editor */}
                <div className="col-span-3 flex flex-col">
                  {currentFile ? (
                    <>
                      <div className="flex items-center justify-between px-3 py-2 border-b border-slate-800 bg-slate-900/30">
                        <span className="text-xs font-mono">{currentFile.name}</span>
                        <div className="flex gap-2">
                          <Button size="sm" variant="ghost" onClick={runCode}>
                            <Play className="w-3 h-3 mr-1" /> Run
                          </Button>
                          <Button size="sm" variant="ghost" onClick={saveFile}>
                            <Save className="w-3 h-3 mr-1" /> Save
                          </Button>
                        </div>
                      </div>
                      <Textarea
                        value={editorContent}
                        onChange={(e) => setEditorContent(e.target.value)}
                        className="flex-1 font-mono text-sm resize-none border-0 rounded-none focus-visible:ring-0 bg-slate-950/50"
                        placeholder="Type your code here..."
                      />
                      
                      {/* Bottom Panel - Output & Preview */}
                      <div className="h-48 border-t border-slate-800 grid grid-cols-2">
                        <div className="border-r border-slate-800 p-2 bg-slate-950">
                          <div className="text-[10px] uppercase text-slate-500 mb-1">Output</div>
                          <ScrollArea className="h-[calc(100%-20px)]">
                            <pre className="text-xs font-mono text-slate-300 whitespace-pre-wrap">
                              {output}
                            </pre>
                          </ScrollArea>
                        </div>
                        <div className="p-2 bg-white">
                          <div className="text-[10px] uppercase text-slate-500 mb-1">Preview</div>
                          {previewHtml ? (
                            <iframe 
                              srcDoc={previewHtml} 
                              className="w-full h-[calc(100%-20px)] border-0"
                              sandbox="allow-scripts"
                            />
                          ) : (
                            <div className="text-xs text-slate-400 text-center pt-8">
                              HTML/CSS preview will appear here
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="flex-1 flex items-center justify-center text-slate-500">
                      <div className="text-center">
                        <FolderOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p className="text-sm">Select or create a file to begin</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Panel - Ops & Vault */}
        <div className="lg:col-span-1 space-y-4">
          {/* Vault */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs uppercase tracking-wider text-violet-400 flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <Lock className="w-4 h-4" /> Vault
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-500">Hidden</span>
                  <Switch 
                    checked={showHiddenVault} 
                    onCheckedChange={setShowHiddenVault}
                    className="scale-75"
                  />
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[150px]">
                {vaultItems.length === 0 ? (
                  <div className="text-xs text-slate-500 text-center py-4">Vault empty</div>
                ) : (
                  vaultItems.map(item => (
                    <Dialog key={item.key}>
                      <DialogTrigger asChild>
                        <div 
                          className="p-2 rounded border border-slate-800 bg-slate-900/50 mb-2 cursor-pointer hover:border-slate-600"
                          onClick={() => setSelectedVaultItem(item)}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium truncate">{item.name}</span>
                            <span className="text-[10px] text-slate-500">{item.mime}</span>
                          </div>
                          <div className="text-[10px] text-slate-500">{item.bytes} bytes</div>
                        </div>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl max-h-[80vh]">
                        <DialogHeader>
                          <DialogTitle className="text-sm flex items-center gap-2">
                            <FileText className="w-4 h-4" />
                            {item.name}
                          </DialogTitle>
                        </DialogHeader>
                        <ScrollArea className="h-[60vh]">
                          <div className="text-xs font-mono bg-slate-950 p-4 rounded">
                            <div className="text-slate-500 mb-2">Path: {item.path}</div>
                            <div className="text-slate-500 mb-4">MIME: {item.mime}</div>
                            <pre className="text-slate-300 whitespace-pre-wrap break-all">
                              {/* Content would be fetched from API */}
                              [Vault item content - Use API to fetch full content]
                            </pre>
                          </div>
                        </ScrollArea>
                      </DialogContent>
                    </Dialog>
                  ))
                )}
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Stats */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs uppercase tracking-wider text-slate-400">
                <Cpu className="w-4 h-4 inline mr-1" /> Stats
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Files</span>
                <span>{files.length}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Agents</span>
                <span>{agents.length}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Tasks</span>
                <span>{queue.length}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Vault</span>
                <span>{vaultItems.length}</span>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs uppercase tracking-wider text-slate-400">
                <Shield className="w-4 h-4 inline mr-1" /> Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button size="sm" variant="outline" className="w-full text-xs" onClick={() => {
                spawnAgent('Architect');
                spawnAgent('Builder');
                spawnAgent('Verifier');
              }}>
                Spawn Full Team
              </Button>
              <Button size="sm" variant="outline" className="w-full text-xs" onClick={queueReview}>
                Review Current File
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
