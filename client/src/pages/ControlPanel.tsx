/**
 * CONTROL PANEL
 * Web UI for managing autopilot, safety, and execution settings
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { trpc } from '@/lib/trpc';

export default function ControlPanel() {
  // Safety configuration state
  const [safetyConfig, setSafetyConfig] = useState({
    allowRealExecution: true,
    allowReverseShells: true,
    allowRemoteConnections: true,
    allowFileSystemAccess: true,
    allowNetworkScanning: true,
    allowExploitExecution: true,
    allowLocalhostProxy: true,
    allowSSHTunneling: true,
    allowPortForwarding: true,
    useExploitDB: true,
    allowMetasploitModules: true,
    allowCustomPayloads: true,
    realInteractionMode: true,
    verboseExecution: true,
    confirmBeforeExecution: false,
  });

  // Target discovery state
  const [baseHost, setBaseHost] = useState('');
  const [confirmedHost, setConfirmedHost] = useState('');
  const [focusDirection, setFocusDirection] = useState('');
  const [targets, setTargets] = useState<any[]>([]);

  // Model selection
  const [selectedModel, setSelectedModel] = useState('gemini-2.5-flash');

  // Status
  const [autopilotStatus, setAutopilotStatus] = useState<any>(null);
  const [message, setMessage] = useState('');

  // TRPC mutations
  const updateSafety = trpc.autopilot.safety.updateConfig.useMutation();
  const enableOffensive = trpc.autopilot.safety.enableOffensive.useMutation();
  const enableSafe = trpc.autopilot.safety.enableSafe.useMutation();
  const startSession = trpc.autopilot.session.start.useMutation();
  const stopSession = trpc.autopilot.session.stop.useMutation();
  const confirmHostMutation = trpc.autopilot.discovery.confirmHost.useMutation();
  const updateFocusMutation = trpc.autopilot.discovery.updateFocus.useMutation();

  // Popular models
  const models = [
    { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash (Default)', category: 'Fast' },
    { id: 'gemini-2.0-flash-exp', name: 'Gemini 2.0 Flash Exp', category: 'Fast' },
    { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet', category: 'Advanced' },
    { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', category: 'Advanced' },
    { id: 'gpt-4o', name: 'GPT-4o', category: 'Advanced' },
    { id: 'deepseek-chat', name: 'DeepSeek Chat', category: 'Code' },
    { id: 'llama-3.3-70b', name: 'Llama 3.3 70B', category: 'Open Source' },
  ];

  const handleUpdateSafety = async () => {
    try {
      await updateSafety.mutateAsync(safetyConfig);
      setMessage('✅ Safety configuration updated');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage(`❌ Error: ${error}`);
    }
  };

  const handleEnableOffensive = async () => {
    try {
      await enableOffensive.mutateAsync();
      setMessage('🔴 FULL OFFENSIVE MODE ENABLED');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage(`❌ Error: ${error}`);
    }
  };

  const handleEnableSafe = async () => {
    try {
      await enableSafe.mutateAsync();
      setMessage('🟢 Safe mode enabled');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage(`❌ Error: ${error}`);
    }
  };

  const handleStartAutopilot = async () => {
    try {
      await startSession.mutateAsync({
        targetProfiles: [],
        strategyId: 'balanced',
        maxIterations: 1000,
      });
      setMessage('✅ Autopilot started');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage(`❌ Error: ${error}`);
    }
  };

  const handleStopAutopilot = async () => {
    try {
      await stopSession.mutateAsync({ sessionId: 'current' });
      setMessage('🛑 Autopilot stopped');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage(`❌ Error: ${error}`);
    }
  };

  const handleConfirmHost = async () => {
    try {
      await confirmHostMutation.mutateAsync({
        baseHost,
        confirmedHost,
        focusDirection: focusDirection || undefined,
      });
      setMessage('✅ Target discovery initialized');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage(`❌ Error: ${error}`);
    }
  };

  const handleUpdateFocus = async () => {
    try {
      await updateFocusMutation.mutateAsync({ focusDirection });
      setMessage('✅ Focus direction updated');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage(`❌ Error: ${error}`);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">ALE Control Panel</h1>
        <Badge variant="destructive" className="text-lg">
          🔴 REAL EXECUTION MODE
        </Badge>
      </div>

      {message && (
        <Alert>
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="autopilot" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="autopilot">Autopilot</TabsTrigger>
          <TabsTrigger value="safety">Safety</TabsTrigger>
          <TabsTrigger value="discovery">Target Discovery</TabsTrigger>
          <TabsTrigger value="model">Model Selection</TabsTrigger>
        </TabsList>

        {/* Autopilot Tab */}
        <TabsContent value="autopilot" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Autopilot Control</CardTitle>
              <CardDescription>Start and stop autonomous penetration testing</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <Button onClick={handleStartAutopilot} size="lg" className="flex-1">
                  🚀 Start Autopilot
                </Button>
                <Button onClick={handleStopAutopilot} variant="destructive" size="lg" className="flex-1">
                  🛑 Stop Autopilot
                </Button>
              </div>

              {autopilotStatus && (
                <div className="p-4 border rounded-lg space-y-2">
                  <div className="flex justify-between">
                    <span>Status:</span>
                    <Badge variant={autopilotStatus.isRunning ? 'default' : 'secondary'}>
                      {autopilotStatus.isRunning ? 'Running' : 'Stopped'}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Iterations:</span>
                    <span>{autopilotStatus.autopilotCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Targets Found:</span>
                    <span>{autopilotStatus.totalTargets}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Current Target:</span>
                    <span>{autopilotStatus.currentTarget || 'None'}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Safety Tab */}
        <TabsContent value="safety" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Safety Configuration</CardTitle>
              <CardDescription>Control real execution capabilities</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex gap-4 mb-6">
                <Button onClick={handleEnableOffensive} variant="destructive" className="flex-1">
                  🔴 Enable Full Offensive Mode
                </Button>
                <Button onClick={handleEnableSafe} variant="outline" className="flex-1">
                  🟢 Enable Safe Mode
                </Button>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold">Real Execution</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center justify-between space-x-2">
                    <Label htmlFor="realExec">Real Execution</Label>
                    <Switch
                      id="realExec"
                      checked={safetyConfig.allowRealExecution}
                      onCheckedChange={(checked) => 
                        setSafetyConfig({...safetyConfig, allowRealExecution: checked})
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between space-x-2">
                    <Label htmlFor="reverseShells">Reverse Shells</Label>
                    <Switch
                      id="reverseShells"
                      checked={safetyConfig.allowReverseShells}
                      onCheckedChange={(checked) => 
                        setSafetyConfig({...safetyConfig, allowReverseShells: checked})
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between space-x-2">
                    <Label htmlFor="remoteConn">Remote Connections</Label>
                    <Switch
                      id="remoteConn"
                      checked={safetyConfig.allowRemoteConnections}
                      onCheckedChange={(checked) => 
                        setSafetyConfig({...safetyConfig, allowRemoteConnections: checked})
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between space-x-2">
                    <Label htmlFor="fileSystem">File System Access</Label>
                    <Switch
                      id="fileSystem"
                      checked={safetyConfig.allowFileSystemAccess}
                      onCheckedChange={(checked) => 
                        setSafetyConfig({...safetyConfig, allowFileSystemAccess: checked})
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold">Network & Scanning</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center justify-between space-x-2">
                    <Label htmlFor="netScan">Network Scanning</Label>
                    <Switch
                      id="netScan"
                      checked={safetyConfig.allowNetworkScanning}
                      onCheckedChange={(checked) => 
                        setSafetyConfig({...safetyConfig, allowNetworkScanning: checked})
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between space-x-2">
                    <Label htmlFor="localhost">Localhost Proxy</Label>
                    <Switch
                      id="localhost"
                      checked={safetyConfig.allowLocalhostProxy}
                      onCheckedChange={(checked) => 
                        setSafetyConfig({...safetyConfig, allowLocalhostProxy: checked})
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between space-x-2">
                    <Label htmlFor="ssh">SSH Tunneling</Label>
                    <Switch
                      id="ssh"
                      checked={safetyConfig.allowSSHTunneling}
                      onCheckedChange={(checked) => 
                        setSafetyConfig({...safetyConfig, allowSSHTunneling: checked})
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold">Exploit Capabilities</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center justify-between space-x-2">
                    <Label htmlFor="exploitExec">Exploit Execution</Label>
                    <Switch
                      id="exploitExec"
                      checked={safetyConfig.allowExploitExecution}
                      onCheckedChange={(checked) => 
                        setSafetyConfig({...safetyConfig, allowExploitExecution: checked})
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between space-x-2">
                    <Label htmlFor="exploitDB">Exploit-DB Integration</Label>
                    <Switch
                      id="exploitDB"
                      checked={safetyConfig.useExploitDB}
                      onCheckedChange={(checked) => 
                        setSafetyConfig({...safetyConfig, useExploitDB: checked})
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between space-x-2">
                    <Label htmlFor="metasploit">Metasploit Modules</Label>
                    <Switch
                      id="metasploit"
                      checked={safetyConfig.allowMetasploitModules}
                      onCheckedChange={(checked) => 
                        setSafetyConfig({...safetyConfig, allowMetasploitModules: checked})
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between space-x-2">
                    <Label htmlFor="customPayloads">Custom Payloads</Label>
                    <Switch
                      id="customPayloads"
                      checked={safetyConfig.allowCustomPayloads}
                      onCheckedChange={(checked) => 
                        setSafetyConfig({...safetyConfig, allowCustomPayloads: checked})
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold">AI Behavior</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center justify-between space-x-2">
                    <Label htmlFor="realMode">Real Interaction Mode</Label>
                    <Switch
                      id="realMode"
                      checked={safetyConfig.realInteractionMode}
                      onCheckedChange={(checked) => 
                        setSafetyConfig({...safetyConfig, realInteractionMode: checked})
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between space-x-2">
                    <Label htmlFor="verbose">Verbose Execution</Label>
                    <Switch
                      id="verbose"
                      checked={safetyConfig.verboseExecution}
                      onCheckedChange={(checked) => 
                        setSafetyConfig({...safetyConfig, verboseExecution: checked})
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between space-x-2">
                    <Label htmlFor="confirm">Confirm Before Execution</Label>
                    <Switch
                      id="confirm"
                      checked={safetyConfig.confirmBeforeExecution}
                      onCheckedChange={(checked) => 
                        setSafetyConfig({...safetyConfig, confirmBeforeExecution: checked})
                      }
                    />
                  </div>
                </div>
              </div>

              <Button onClick={handleUpdateSafety} className="w-full" size="lg">
                💾 Save Safety Configuration
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Target Discovery Tab */}
        <TabsContent value="discovery" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Target Discovery</CardTitle>
              <CardDescription>Configure autonomous target finding</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="baseHost">Base Host</Label>
                <Input
                  id="baseHost"
                  placeholder="example.com"
                  value={baseHost}
                  onChange={(e) => setBaseHost(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmedHost">Confirmed Host / IP</Label>
                <Input
                  id="confirmedHost"
                  placeholder="192.168.1.100"
                  value={confirmedHost}
                  onChange={(e) => setConfirmedHost(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="focus">Focus Direction (Optional)</Label>
                <Textarea
                  id="focus"
                  placeholder="web applications and APIs with authentication"
                  value={focusDirection}
                  onChange={(e) => setFocusDirection(e.target.value)}
                  rows={3}
                />
              </div>

              <Button onClick={handleConfirmHost} className="w-full" size="lg">
                🎯 Start Target Discovery
              </Button>

              <Button onClick={handleUpdateFocus} variant="outline" className="w-full">
                🔄 Update Focus Direction
              </Button>

              {targets.length > 0 && (
                <div className="mt-6">
                  <h3 className="font-semibold mb-2">Discovered Targets ({targets.length})</h3>
                  <div className="space-y-2">
                    {targets.map((target, idx) => (
                      <div key={idx} className="p-3 border rounded-lg">
                        <div className="font-mono text-sm">{target.host}</div>
                        {target.ip && <div className="text-xs text-muted-foreground">{target.ip}</div>}
                        {target.ports && (
                          <div className="text-xs">Ports: {target.ports.join(', ')}</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Model Selection Tab */}
        <TabsContent value="model" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Model Selection</CardTitle>
              <CardDescription>Choose AI model for autopilot (100+ models supported)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Select Model</Label>
                <div className="grid gap-2">
                  {models.map((model) => (
                    <div
                      key={model.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedModel === model.id ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                      }`}
                      onClick={() => setSelectedModel(model.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{model.name}</div>
                          <div className="text-sm text-muted-foreground">{model.id}</div>
                        </div>
                        <Badge variant="outline">{model.category}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">
                  Selected: <span className="font-mono">{selectedModel}</span>
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  All 100+ Forge/Manus models are supported. The selected model will be used for all autopilot operations.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
