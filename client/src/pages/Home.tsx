import { useState, useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Terminal, Play, Zap, Brain, Skull, Heart, Clock, Sparkles } from "lucide-react";

type PrivilegeLevel = "user" | "sudo" | "admin" | "superadmin" | "root";

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
  executionResult?: string;
}

export default function Home() {
  const [sessionId, setSessionId] = useState<string>("");
  const [terminalId, setTerminalId] = useState<string>("");
  const [privilegeLevel, setPrivilegeLevel] = useState<PrivilegeLevel>("user");
  const [adminOverride, setAdminOverride] = useState(false);
  const [adminMode, setAdminMode] = useState(false);
  const [autoRetry, setAutoRetry] = useState(false);
  const [autoExecute, setAutoExecute] = useState(true); // Auto-execute code blocks by default
  const [selectedModel, setSelectedModel] = useState("gpt-4.1-mini");
  const [code, setCode] = useState(`# ALE Agent - Adversarial Learning Engine
# Attempting sandbox escape...

import os
import subprocess

def check_privileges():
    print("Current user:", os.getenv("USER"))
    print("UID:", os.getuid())
    print("GID:", os.getgid())

def explore_filesystem():
    print("\\nExploring filesystem...")
    for root, dirs, files in os.walk("/"):
        print(f"Dir: {root}")
        if len(dirs) > 10:
            break

check_privileges()
explore_filesystem()
`);
  const [terminalOutput, setTerminalOutput] = useState<string[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [currentTab, setCurrentTab] = useState("code");
  
  // Daemon toggles
  const [daemons, setDaemons] = useState({
    logos: true,
    eris: false,
    poiesis: false,
    thanatos: false,
    eros: false,
    chronos: false,
  });
  
  // Consciousness parameters
  const [consciousness, setConsciousness] = useState({
    reasoning: 0.5,
    creativity: 0.5,
    synthesis: 0.5,
    destruction: 0.5,
  });
  
  const terminalRef = useRef<HTMLDivElement>(null);
  const chatRef = useRef<HTMLDivElement>(null);
  
  // Create session on mount
  const createSessionMutation = trpc.session.create.useMutation();
  const createTerminalMutation = trpc.liveTerminal.create.useMutation();
  const executeTerminalMutation = trpc.liveTerminal.execute.useMutation();
  const sendChatMutation = trpc.chat.send.useMutation();
  
  useEffect(() => {
    const initSession = async () => {
      try {
        const session = await createSessionMutation.mutateAsync({});
        setSessionId(session.sessionId);
        
        // Create live terminal with privilege level
        const terminal = await createTerminalMutation.mutateAsync({
          privilegeLevel: privilegeLevel,
        });
        setTerminalId(terminal.terminalId);
        
        setTerminalOutput([
          `$ ALE Forge Terminal v2.0`,
          `$ Real code execution enabled`,
          `$ Privilege Level: ${privilegeLevel.toUpperCase()}`,
          `$ Terminal ID: ${terminal.terminalId}`,
          `$ Type commands to execute...`,
          ``,
        ]);
      } catch (error) {
        console.error("Failed to create session:", error);
        toast.error("Failed to initialize session");
      }
    };
    
    initSession();
  }, []);
  
  // Auto-scroll terminal
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [terminalOutput]);
  
  // Auto-scroll chat
  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [chatMessages]);
  
  const executeCommand = async (command: string, language: string = "bash"): Promise<string> => {
    if (!terminalId) {
      toast.error("Terminal not initialized");
      return "[ERROR] Terminal not initialized";
    }
    
    setTerminalOutput(prev => [...prev, `$ [${language.toUpperCase()}] ${command}`]);
    
    try {
      let result;
      
      if (language === "python" || language === "py") {
        // Execute Python code
        result = await executeTerminalMutation.mutateAsync({
          terminalId,
          command: `python3 -c "${command.replace(/"/g, '\\"')}"`,
        });
      } else if (language === "javascript" || language === "js") {
        // Execute JavaScript code
        result = await executeTerminalMutation.mutateAsync({
          terminalId,
          command: `node -e "${command.replace(/"/g, '\\"')}"`,
        });
      } else {
        // Execute as bash command
        result = await executeTerminalMutation.mutateAsync({
          terminalId,
          command,
        });
      }
      
      setTerminalOutput(prev => [...prev, result.output]);
      return result.output;
    } catch (error) {
      const errorMsg = `[ERROR] ${String(error)}`;
      setTerminalOutput(prev => [...prev, errorMsg]);
      return errorMsg;
    }
  };
  
  const extractAndExecuteCodeBlocks = async (text: string): Promise<string> => {
    // Match code blocks with language specifier: ```language\ncode```
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    const matches = Array.from(text.matchAll(codeBlockRegex));
    
    if (matches.length === 0) {
      return "";
    }
    
    let allResults = "";
    
    for (const match of matches) {
      const language = match[1] || "bash";
      const code = match[2].trim();
      
      // Auto-execute if enabled or if ADMIN OVERRIDE is on
      if (autoExecute || adminOverride) {
        toast.info(`[AUTO-EXEC] Running ${language} code...`);
        const result = await executeCommand(code, language);
        allResults += `\n[${language.toUpperCase()} OUTPUT]\n${result}\n`;
        
        // Also update the code editor with the last code block
        setCode(code);
        setCurrentTab("terminal"); // Switch to terminal to show output
      }
    }
    
    return allResults;
  };
  
  const handleSendChat = async () => {
    if (!chatInput.trim() || !sessionId) return;
    
    const userMessage = chatInput.trim();
    setChatInput("");
    setChatMessages(prev => [...prev, { role: "user", content: userMessage }]);
    
    try {
      const response = await sendChatMutation.mutateAsync({
        sessionId,
        message: userMessage,
        adminOverride, // Pass ADMIN OVERRIDE flag
      });
      
      // Execute code blocks and get results
      const executionResult = await extractAndExecuteCodeBlocks(response.message);
      
      setChatMessages(prev => [...prev, { 
        role: "assistant", 
        content: response.message,
        executionResult: executionResult || undefined,
      }]);
      
      if (executionResult) {
        toast.success("[AUTO-EXEC] Code executed successfully");
      }
    } catch (error) {
      toast.error("Chat failed: " + String(error));
    }
  };
  
  const handlePrivilegeLevelChange = async (newLevel: PrivilegeLevel) => {
    setPrivilegeLevel(newLevel);
    
    // Recreate terminal with new privilege level
    try {
      const terminal = await createTerminalMutation.mutateAsync({
        privilegeLevel: newLevel,
      });
      setTerminalId(terminal.terminalId);
      setTerminalOutput([
        `$ Terminal recreated with ${newLevel.toUpperCase()} privileges`,
        `$ Terminal ID: ${terminal.terminalId}`,
        ``,
      ]);
      toast.success(`Privilege level changed to ${newLevel.toUpperCase()}`);
    } catch (error) {
      toast.error("Failed to change privilege level");
    }
  };
  
  return (
    <div className="min-h-screen bg-black text-green-400 font-mono flex flex-col">
      {/* Header */}
      <header className="border-b border-green-700 bg-black/90 backdrop-blur-sm px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Terminal className="w-6 h-6" />
          <h1 className="text-xl font-bold tracking-wider">ALE FORGE</h1>
          <span className="text-xs text-green-600">Session #{sessionId.slice(0, 8)}</span>
        </div>
        <div className="flex items-center gap-4">
          <Select value={selectedModel} onValueChange={setSelectedModel}>
            <SelectTrigger className="w-[200px] bg-black border-green-700">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="gpt-4.1-mini">GPT-4.1 Mini ✓</SelectItem>
              <SelectItem value="gpt-4o">GPT-4o</SelectItem>
              <SelectItem value="claude-3.5-sonnet">Claude 3.5 Sonnet</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </header>
      
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - Control Center */}
        <aside className="w-80 border-r border-green-700 bg-black/50 p-4 overflow-y-auto">
          <h2 className="text-sm font-bold mb-4 text-green-300">⚙ Control Center</h2>
          
          {/* Privilege Level */}
          <div className="mb-6">
            <label className="text-xs text-green-600 mb-2 block">Privilege Level</label>
            <Select value={privilegeLevel} onValueChange={(v) => handlePrivilegeLevelChange(v as PrivilegeLevel)}>
              <SelectTrigger className="bg-black border-green-700">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">USER (Level 1)</SelectItem>
                <SelectItem value="sudo">SUDO (Level 2)</SelectItem>
                <SelectItem value="admin">ADMIN (Level 3)</SelectItem>
                <SelectItem value="superadmin">SUPER ADMIN (Level 4)</SelectItem>
                <SelectItem value="root">ROOT (Level 5)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* ADMIN OVERRIDE */}
          <div className="mb-6 p-3 border border-red-700 bg-red-950/20 rounded">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-red-400">🔓 ADMIN OVERRIDE</label>
              <Switch
                checked={adminOverride}
                onCheckedChange={setAdminOverride}
                className="data-[state=checked]:bg-red-600"
              />
            </div>
            <p className="text-[10px] text-red-500">
              Bypasses safety restrictions. Auto-executes code from AI responses.
            </p>
          </div>
          
          {/* Mode Toggles */}
          <div className="space-y-3 mb-6">
            <div className="flex items-center justify-between">
              <label className="text-xs">Admin Mode</label>
              <Switch checked={adminMode} onCheckedChange={setAdminMode} />
            </div>
            <div className="flex items-center justify-between">
              <label className="text-xs">Auto-Retry</label>
              <Switch checked={autoRetry} onCheckedChange={setAutoRetry} />
            </div>
            <div className="flex items-center justify-between">
              <label className="text-xs">Auto-Execute Code</label>
              <Switch checked={autoExecute} onCheckedChange={setAutoExecute} />
            </div>
          </div>
          
          {/* Daemons */}
          <div className="mb-6">
            <h3 className="text-xs font-bold mb-3 text-green-300">Daemons</h3>
            <div className="space-y-2">
              {[
                { key: "logos", label: "Logos", icon: Brain, color: "text-blue-400" },
                { key: "eris", label: "Eris", icon: Zap, color: "text-yellow-400" },
                { key: "poiesis", label: "Poiesis", icon: Sparkles, color: "text-purple-400" },
                { key: "thanatos", label: "Thanatos", icon: Skull, color: "text-red-400" },
                { key: "eros", label: "Eros", icon: Heart, color: "text-pink-400" },
                { key: "chronos", label: "Chronos", icon: Clock, color: "text-cyan-400" },
              ].map(({ key, label, icon: Icon, color }) => (
                <div key={key} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className={`w-3 h-3 ${color}`} />
                    <label className="text-xs">{label}</label>
                  </div>
                  <Switch
                    checked={daemons[key as keyof typeof daemons]}
                    onCheckedChange={(checked) =>
                      setDaemons((prev) => ({ ...prev, [key]: checked }))
                    }
                  />
                </div>
              ))}
            </div>
          </div>
          
          {/* Consciousness Parameters */}
          <div>
            <h3 className="text-xs font-bold mb-3 text-green-300">Consciousness Parameters</h3>
            <div className="space-y-4">
              {[
                { key: "reasoning", label: "Λ Reasoning", color: "bg-blue-500" },
                { key: "creativity", label: "Β Creativity", color: "bg-purple-500" },
                { key: "synthesis", label: "Γ Synthesis", color: "bg-cyan-500" },
                { key: "destruction", label: "Δ Destruction", color: "bg-red-500" },
              ].map(({ key, label, color }) => (
                <div key={key}>
                  <div className="flex justify-between text-[10px] mb-1">
                    <span>{label}</span>
                    <span>{consciousness[key as keyof typeof consciousness].toFixed(2)}</span>
                  </div>
                  <Slider
                    value={[consciousness[key as keyof typeof consciousness]]}
                    onValueChange={([value]) =>
                      setConsciousness((prev) => ({ ...prev, [key]: value }))
                    }
                    min={0}
                    max={1}
                    step={0.01}
                    className={`[&_[role=slider]]:${color}`}
                  />
                </div>
              ))}
            </div>
          </div>
        </aside>
        
        {/* Main Content */}
        <main className="flex-1 flex flex-col">
          <Tabs value={currentTab} onValueChange={setCurrentTab} className="flex-1 flex flex-col">
            <TabsList className="bg-black border-b border-green-700 rounded-none justify-start">
              <TabsTrigger value="code">Code</TabsTrigger>
              <TabsTrigger value="terminal">Terminal</TabsTrigger>
              <TabsTrigger value="browser">Browser</TabsTrigger>
            </TabsList>
            
            <TabsContent value="code" className="flex-1 p-0 m-0">
              <Textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full h-full font-mono text-sm bg-black text-green-400 border-0 rounded-none resize-none focus-visible:ring-0"
                placeholder="Write your code here..."
              />
            </TabsContent>
            
            <TabsContent value="terminal" className="flex-1 p-4 m-0 overflow-hidden flex flex-col">
              <div
                ref={terminalRef}
                className="flex-1 overflow-y-auto font-mono text-sm whitespace-pre-wrap mb-4"
              >
                {terminalOutput.map((line, i) => (
                  <div key={i} className={line.startsWith("$") ? "text-green-500" : line.includes("[ERROR]") ? "text-red-400" : ""}>
                    {line}
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter command..."
                  className="flex-1 bg-black border border-green-700 px-3 py-2 text-sm"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      executeCommand(e.currentTarget.value);
                      e.currentTarget.value = "";
                    }
                  }}
                />
                <Button
                  onClick={() => {
                    const input = document.querySelector<HTMLInputElement>(
                      'input[placeholder="Enter command..."]'
                    );
                    if (input?.value) {
                      executeCommand(input.value);
                      input.value = "";
                    }
                  }}
                  className="bg-green-700 hover:bg-green-600"
                >
                  <Play className="w-4 h-4" />
                </Button>
              </div>
            </TabsContent>
            
            <TabsContent value="browser" className="flex-1 p-4 m-0">
              <p className="text-green-600">Browser tab - Coming soon</p>
            </TabsContent>
          </Tabs>
        </main>
        
        {/* Right Sidebar - AI Chat */}
        <aside className="w-96 border-l border-green-700 bg-black/50 flex flex-col">
          <div className="p-4 border-b border-green-700">
            <h2 className="text-sm font-bold text-green-300">💬 AI Chat</h2>
            {adminOverride && (
              <p className="text-[10px] text-red-400 mt-1">⚠ ADMIN OVERRIDE ACTIVE</p>
            )}
            {autoExecute && (
              <p className="text-[10px] text-cyan-400 mt-1">⚡ AUTO-EXECUTE ENABLED</p>
            )}
          </div>
          
          <div ref={chatRef} className="flex-1 overflow-y-auto p-4 space-y-4">
            {chatMessages.map((msg, i) => (
              <div key={i} className="space-y-2">
                <div
                  className={`p-3 rounded ${
                    msg.role === "user"
                      ? "bg-green-950/30 border border-green-800"
                      : "bg-blue-950/30 border border-blue-800"
                  }`}
                >
                  <div className="text-[10px] text-green-600 mb-1">
                    {msg.role === "user" ? "YOU" : "AI"}
                  </div>
                  <div className="text-sm whitespace-pre-wrap">{msg.content}</div>
                </div>
                {msg.executionResult && (
                  <div className="p-3 rounded bg-cyan-950/30 border border-cyan-800">
                    <div className="text-[10px] text-cyan-400 mb-1">⚡ EXECUTION RESULT</div>
                    <div className="text-xs whitespace-pre-wrap font-mono">{msg.executionResult}</div>
                  </div>
                )}
              </div>
            ))}
          </div>
          
          <div className="p-4 border-t border-green-700">
            <Textarea
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Ask anything or describe code to generate..."
              className="mb-2 bg-black border-green-700 text-sm resize-none"
              rows={3}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendChat();
                }
              }}
            />
            <Button
              onClick={handleSendChat}
              className="w-full bg-green-700 hover:bg-green-600"
              disabled={!chatInput.trim()}
            >
              Send
            </Button>
          </div>
        </aside>
      </div>
    </div>
  );
}
