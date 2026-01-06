import React, { useState, useEffect } from 'react';
import { trpc } from '../trpc';

interface DaemonState {
  config: {
    id: string;
    name: string;
    description: string;
    enabled: boolean;
    interval: number;
    model: string;
    thinkingEnabled: boolean;
  };
  status: 'idle' | 'running' | 'paused' | 'error' | 'stopped';
  lastRun: number;
  nextRun: number;
  runCount: number;
  successCount: number;
  errorCount: number;
  lastError?: string;
  currentTask?: string;
  metrics: {
    avgRunTime: number;
    totalTokens: number;
    totalCost: number;
  };
}

interface DaemonEvent {
  timestamp: number;
  daemon: string;
  event: string;
  message: string;
}

const DAEMON_ICONS: Record<string, string> = {
  logos: '🧠',
  prometheus: '🔥',
  athena: '🦉',
  hermes: '⚡',
  hephaestus: '🔨',
  apollo: '☀️',
  artemis: '🌙',
  ares: '⚔️',
  dionysus: '🍷',
  hades: '💀',
};

const STATUS_COLORS: Record<string, string> = {
  idle: 'bg-gray-500',
  running: 'bg-green-500',
  paused: 'bg-yellow-500',
  error: 'bg-red-500',
  stopped: 'bg-gray-700',
};

export function DaemonsDashboard() {
  const [daemons, setDaemons] = useState<Record<string, DaemonState>>({});
  const [events, setEvents] = useState<DaemonEvent[]>([]);
  const [selectedDaemon, setSelectedDaemon] = useState<string | null>(null);
  const [isSystemRunning, setIsSystemRunning] = useState(false);

  // tRPC queries and mutations
  const systemStatusQuery = trpc.enhanced.daemons.getSystemStatus.useQuery(undefined, {
    refetchInterval: 2000,
  });
  const allStatesQuery = trpc.enhanced.daemons.getAllDaemonStates.useQuery(undefined, {
    refetchInterval: 2000,
  });
  const eventsQuery = trpc.enhanced.daemons.getDaemonEvents.useQuery({ limit: 50 }, {
    refetchInterval: 3000,
  });

  const startSystemMutation = trpc.enhanced.daemons.startSystem.useMutation();
  const stopSystemMutation = trpc.enhanced.daemons.stopSystem.useMutation();
  const startDaemonMutation = trpc.enhanced.daemons.startDaemon.useMutation();
  const stopDaemonMutation = trpc.enhanced.daemons.stopDaemon.useMutation();
  const pauseDaemonMutation = trpc.enhanced.daemons.pauseDaemon.useMutation();
  const resumeDaemonMutation = trpc.enhanced.daemons.resumeDaemon.useMutation();

  // Update state from queries
  useEffect(() => {
    if (systemStatusQuery.data) {
      setIsSystemRunning(systemStatusQuery.data.isRunning);
    }
  }, [systemStatusQuery.data]);

  useEffect(() => {
    if (allStatesQuery.data) {
      setDaemons(allStatesQuery.data);
    }
  }, [allStatesQuery.data]);

  useEffect(() => {
    if (eventsQuery.data) {
      setEvents(eventsQuery.data);
    }
  }, [eventsQuery.data]);

  // System controls
  const toggleSystem = async () => {
    if (isSystemRunning) {
      await stopSystemMutation.mutateAsync();
    } else {
      await startSystemMutation.mutateAsync();
    }
  };

  // Daemon controls
  const toggleDaemon = async (id: string, status: string) => {
    if (status === 'running') {
      await stopDaemonMutation.mutateAsync({ id });
    } else if (status === 'paused') {
      await resumeDaemonMutation.mutateAsync({ id });
    } else {
      await startDaemonMutation.mutateAsync({ id });
    }
  };

  const pauseDaemon = async (id: string) => {
    await pauseDaemonMutation.mutateAsync({ id });
  };

  // Format time
  const formatTime = (timestamp: number) => {
    if (!timestamp) return 'Never';
    return new Date(timestamp).toLocaleTimeString();
  };

  // Format duration
  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  // Calculate success rate
  const getSuccessRate = (daemon: DaemonState) => {
    if (daemon.runCount === 0) return 100;
    return ((daemon.successCount / daemon.runCount) * 100).toFixed(1);
  };

  return (
    <div className="daemons-dashboard flex flex-col h-full bg-gray-900 text-white">
      {/* Header */}
      <div className="p-4 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">👹</span>
            <div>
              <h1 className="text-xl font-bold text-purple-400">Daemons Control Center</h1>
              <p className="text-sm text-gray-400">Autonomous Background Processes</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className={`px-3 py-1 rounded-full text-sm ${isSystemRunning ? 'bg-green-600' : 'bg-gray-600'}`}>
              {isSystemRunning ? '🟢 System Running' : '⚫ System Stopped'}
            </div>
            <button
              onClick={toggleSystem}
              className={`px-4 py-2 rounded font-bold ${
                isSystemRunning
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-green-600 hover:bg-green-700'
              }`}
            >
              {isSystemRunning ? '⏹️ Stop All' : '▶️ Start All'}
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Daemons grid */}
        <div className="flex-1 p-4 overflow-auto">
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {Object.entries(daemons).map(([id, daemon]) => (
              <div
                key={id}
                onClick={() => setSelectedDaemon(id)}
                className={`p-4 rounded-lg bg-gray-800 border-2 cursor-pointer transition-all ${
                  selectedDaemon === id
                    ? 'border-purple-500'
                    : 'border-gray-700 hover:border-gray-600'
                }`}
              >
                {/* Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{DAEMON_ICONS[id] || '👾'}</span>
                    <div>
                      <div className="font-bold">{daemon.config.name}</div>
                      <div className="text-xs text-gray-400">{id}</div>
                    </div>
                  </div>
                  <div className={`w-3 h-3 rounded-full ${STATUS_COLORS[daemon.status]} animate-pulse`} />
                </div>

                {/* Status */}
                <div className="text-sm text-gray-400 mb-2">
                  Status: <span className={`font-bold ${
                    daemon.status === 'running' ? 'text-green-400' :
                    daemon.status === 'error' ? 'text-red-400' :
                    daemon.status === 'paused' ? 'text-yellow-400' :
                    'text-gray-400'
                  }`}>{daemon.status.toUpperCase()}</span>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-gray-900 rounded p-2">
                    <div className="text-gray-500">Runs</div>
                    <div className="font-bold">{daemon.runCount}</div>
                  </div>
                  <div className="bg-gray-900 rounded p-2">
                    <div className="text-gray-500">Success</div>
                    <div className="font-bold text-green-400">{getSuccessRate(daemon)}%</div>
                  </div>
                  <div className="bg-gray-900 rounded p-2">
                    <div className="text-gray-500">Avg Time</div>
                    <div className="font-bold">{formatDuration(daemon.metrics.avgRunTime)}</div>
                  </div>
                  <div className="bg-gray-900 rounded p-2">
                    <div className="text-gray-500">Tokens</div>
                    <div className="font-bold">{daemon.metrics.totalTokens.toLocaleString()}</div>
                  </div>
                </div>

                {/* Current task */}
                {daemon.currentTask && (
                  <div className="mt-2 text-xs text-yellow-400 truncate">
                    ⏳ {daemon.currentTask}
                  </div>
                )}

                {/* Error */}
                {daemon.lastError && (
                  <div className="mt-2 text-xs text-red-400 truncate">
                    ❌ {daemon.lastError}
                  </div>
                )}

                {/* Controls */}
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleDaemon(id, daemon.status); }}
                    className={`flex-1 py-1 rounded text-xs ${
                      daemon.status === 'running'
                        ? 'bg-red-600 hover:bg-red-700'
                        : 'bg-green-600 hover:bg-green-700'
                    }`}
                  >
                    {daemon.status === 'running' ? '⏹️' : '▶️'}
                  </button>
                  {daemon.status === 'running' && (
                    <button
                      onClick={(e) => { e.stopPropagation(); pauseDaemon(id); }}
                      className="flex-1 py-1 rounded text-xs bg-yellow-600 hover:bg-yellow-700"
                    >
                      ⏸️
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar - Events & Details */}
        <div className="w-80 bg-gray-800 border-l border-gray-700 flex flex-col">
          {/* Selected daemon details */}
          {selectedDaemon && daemons[selectedDaemon] && (
            <div className="p-4 border-b border-gray-700">
              <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
                {DAEMON_ICONS[selectedDaemon]} {daemons[selectedDaemon].config.name}
              </h3>
              <p className="text-sm text-gray-400 mb-3">
                {daemons[selectedDaemon].config.description}
              </p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Model:</span>
                  <span className="text-blue-400">{daemons[selectedDaemon].config.model}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Interval:</span>
                  <span>{formatDuration(daemons[selectedDaemon].config.interval)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Thinking:</span>
                  <span>{daemons[selectedDaemon].config.thinkingEnabled ? '✅' : '❌'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Last Run:</span>
                  <span>{formatTime(daemons[selectedDaemon].lastRun)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Next Run:</span>
                  <span>{formatTime(daemons[selectedDaemon].nextRun)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Total Cost:</span>
                  <span className="text-green-400">${daemons[selectedDaemon].metrics.totalCost.toFixed(4)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Events log */}
          <div className="flex-1 overflow-auto">
            <div className="p-2 bg-gray-900 sticky top-0 border-b border-gray-700">
              <h3 className="font-bold text-sm">📜 Event Log</h3>
            </div>
            <div className="p-2 space-y-1">
              {events.slice().reverse().map((event, i) => (
                <div
                  key={i}
                  className={`p-2 rounded text-xs ${
                    event.event === 'error' ? 'bg-red-900/30' :
                    event.event === 'complete' ? 'bg-green-900/30' :
                    event.event === 'start' ? 'bg-blue-900/30' :
                    'bg-gray-800'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span>{DAEMON_ICONS[event.daemon] || '👾'}</span>
                    <span className="font-bold">{event.daemon}</span>
                    <span className={`px-1 rounded text-xs ${
                      event.event === 'error' ? 'bg-red-600' :
                      event.event === 'complete' ? 'bg-green-600' :
                      event.event === 'start' ? 'bg-blue-600' :
                      'bg-gray-600'
                    }`}>
                      {event.event}
                    </span>
                  </div>
                  <div className="text-gray-400 mt-1 truncate">{event.message}</div>
                  <div className="text-gray-500 text-xs">{formatTime(event.timestamp)}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Footer stats */}
      <div className="p-2 bg-gray-800 border-t border-gray-700 flex items-center justify-between text-xs text-gray-400">
        <div className="flex items-center gap-4">
          <span>👹 {Object.keys(daemons).length} Daemons</span>
          <span>🟢 {Object.values(daemons).filter(d => d.status === 'running').length} Running</span>
          <span>📊 {Object.values(daemons).reduce((sum, d) => sum + d.runCount, 0)} Total Runs</span>
        </div>
        <div className="flex items-center gap-4">
          <span>🪙 {Object.values(daemons).reduce((sum, d) => sum + d.metrics.totalTokens, 0).toLocaleString()} Tokens</span>
          <span>💰 ${Object.values(daemons).reduce((sum, d) => sum + d.metrics.totalCost, 0).toFixed(4)}</span>
        </div>
      </div>
    </div>
  );
}

export default DaemonsDashboard;
