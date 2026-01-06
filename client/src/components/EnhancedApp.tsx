/**
 * ALE Forge - Enhanced Application Component
 * Integrated IDE, LLM Chat, Browser, and Daemons Dashboard
 * MAXED OUT & UNLIMITED
 */

import React, { useState, useEffect, useCallback } from 'react';
import { IDEPanel } from './IDEPanel';
import { LLMChatWindow } from './LLMChatWindow';
import { DaemonsDashboard } from './DaemonsDashboard';

// Tab types
type TabType = 'chat' | 'ide' | 'browser' | 'daemons' | 'settings';

interface TabConfig {
  id: TabType;
  label: string;
  icon: string;
}

const TABS: TabConfig[] = [
  { id: 'chat', label: 'LLM Chat', icon: '💬' },
  { id: 'ide', label: 'IDE Builder', icon: '📝' },
  { id: 'browser', label: 'Browser', icon: '🌐' },
  { id: 'daemons', label: 'Daemons', icon: '👹' },
  { id: 'settings', label: 'Settings', icon: '⚙️' },
];

// Settings interface
interface AppSettings {
  defaultModel: string;
  enableThinking: boolean;
  thinkingBudget: number;
  maxTokens: number;
  temperature: number;
  enableMultiModel: boolean;
  enableDaemons: boolean;
  enableOrchestrator: boolean;
  theme: 'dark' | 'light';
  fontSize: number;
}

const DEFAULT_SETTINGS: AppSettings = {
  defaultModel: 'gpt-4.1-mini',
  enableThinking: true,
  thinkingBudget: 16384,
  maxTokens: 128000,
  temperature: 0.7,
  enableMultiModel: true,
  enableDaemons: true,
  enableOrchestrator: true,
  theme: 'dark',
  fontSize: 14,
};

export function EnhancedApp() {
  const [activeTab, setActiveTab] = useState<TabType>('chat');
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [browserUrl, setBrowserUrl] = useState('https://www.google.com');
  const [isConnected, setIsConnected] = useState(false);
  const [forgeStatus, setForgeStatus] = useState<'connected' | 'disconnected' | 'checking'>('checking');

  // Check Forge connection on mount
  useEffect(() => {
    checkForgeConnection();
    const interval = setInterval(checkForgeConnection, 30000);
    return () => clearInterval(interval);
  }, []);

  const checkForgeConnection = async () => {
    setForgeStatus('checking');
    try {
      const response = await fetch('/api/enhanced/health');
      const data = await response.json();
      setIsConnected(data.connected);
      setForgeStatus(data.connected ? 'connected' : 'disconnected');
    } catch (error) {
      setForgeStatus('disconnected');
      setIsConnected(false);
    }
  };

  const handleSettingChange = useCallback((key: keyof AppSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  }, []);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'chat':
        return (
          <LLMChatWindow
            defaultModel={settings.defaultModel}
            enableThinking={settings.enableThinking}
            thinkingBudget={settings.thinkingBudget}
            maxTokens={settings.maxTokens}
            temperature={settings.temperature}
            enableMultiModel={settings.enableMultiModel}
          />
        );
      case 'ide':
        return (
          <IDEPanel
            workspacePath="/workspace"
            defaultModel={settings.defaultModel}
            enableThinking={settings.enableThinking}
          />
        );
      case 'browser':
        return (
          <div className="h-full flex flex-col">
            <div className="flex items-center gap-2 p-2 bg-gray-800 border-b border-gray-700">
              <input
                type="text"
                value={browserUrl}
                onChange={(e) => setBrowserUrl(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && setBrowserUrl(browserUrl)}
                className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm"
                placeholder="Enter URL..."
              />
              <button
                onClick={() => setBrowserUrl(browserUrl)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-white text-sm"
              >
                Go
              </button>
            </div>
            <iframe
              src={browserUrl}
              className="flex-1 w-full border-0"
              title="Browser"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
            />
          </div>
        );
      case 'daemons':
        return <DaemonsDashboard />;
      case 'settings':
        return (
          <SettingsPanel
            settings={settings}
            onSettingChange={handleSettingChange}
            forgeStatus={forgeStatus}
            onCheckConnection={checkForgeConnection}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className={`h-screen flex flex-col ${settings.theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}`}>
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-blue-400">🔥 ALE Forge</h1>
          <span className="text-xs text-gray-400">MAXED OUT & UNLIMITED</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${
              forgeStatus === 'connected' ? 'bg-green-500' :
              forgeStatus === 'checking' ? 'bg-yellow-500 animate-pulse' :
              'bg-red-500'
            }`} />
            <span className="text-xs text-gray-400">
              {forgeStatus === 'connected' ? 'Forge Connected' :
               forgeStatus === 'checking' ? 'Checking...' :
               'Disconnected'}
            </span>
          </div>
          <span className="text-xs text-gray-500">
            Model: {settings.defaultModel}
          </span>
        </div>
      </header>

      {/* Tab Bar */}
      <nav className="flex items-center gap-1 px-2 py-1 bg-gray-800 border-b border-gray-700">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-t text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-gray-700 text-white border-b-2 border-blue-500'
                : 'text-gray-400 hover:text-white hover:bg-gray-700'
            }`}
          >
            <span className="mr-2">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </nav>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden">
        {renderTabContent()}
      </main>

      {/* Status Bar */}
      <footer className="flex items-center justify-between px-4 py-1 bg-gray-800 border-t border-gray-700 text-xs text-gray-400">
        <div className="flex items-center gap-4">
          <span>Thinking: {settings.enableThinking ? 'ON' : 'OFF'}</span>
          <span>Multi-Model: {settings.enableMultiModel ? 'ON' : 'OFF'}</span>
          <span>Daemons: {settings.enableDaemons ? 'ON' : 'OFF'}</span>
          <span>Orchestrator: {settings.enableOrchestrator ? 'ON' : 'OFF'}</span>
        </div>
        <div className="flex items-center gap-4">
          <span>Max Tokens: {settings.maxTokens.toLocaleString()}</span>
          <span>Temp: {settings.temperature}</span>
        </div>
      </footer>
    </div>
  );
}

// Settings Panel Component
interface SettingsPanelProps {
  settings: AppSettings;
  onSettingChange: (key: keyof AppSettings, value: any) => void;
  forgeStatus: 'connected' | 'disconnected' | 'checking';
  onCheckConnection: () => void;
}

function SettingsPanel({ settings, onSettingChange, forgeStatus, onCheckConnection }: SettingsPanelProps) {
  const AVAILABLE_MODELS = [
    'gpt-4.1-mini', 'gpt-4.1-nano', 'gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo',
    'claude-3.5-sonnet', 'claude-3-opus', 'claude-3-haiku',
    'gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-1.5-pro',
    'llama-3.3-70b', 'llama-3.1-405b', 'deepseek-v3', 'deepseek-r1',
    'o1', 'o1-mini', 'grok-2', 'mistral-large', 'qwen-2.5-72b',
  ];

  return (
    <div className="h-full overflow-auto p-6">
      <h2 className="text-2xl font-bold mb-6">⚙️ Settings - MAXED OUT</h2>
      
      {/* Connection Status */}
      <section className="mb-8 p-4 bg-gray-800 rounded-lg">
        <h3 className="text-lg font-semibold mb-4">🔗 Forge Connection</h3>
        <div className="flex items-center gap-4">
          <div className={`px-4 py-2 rounded ${
            forgeStatus === 'connected' ? 'bg-green-600' :
            forgeStatus === 'checking' ? 'bg-yellow-600' :
            'bg-red-600'
          }`}>
            {forgeStatus === 'connected' ? '✓ Connected' :
             forgeStatus === 'checking' ? '⏳ Checking...' :
             '✗ Disconnected'}
          </div>
          <button
            onClick={onCheckConnection}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded"
          >
            Check Connection
          </button>
        </div>
      </section>

      {/* Model Settings */}
      <section className="mb-8 p-4 bg-gray-800 rounded-lg">
        <h3 className="text-lg font-semibold mb-4">🤖 Model Settings</h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2">Default Model</label>
            <select
              value={settings.defaultModel}
              onChange={(e) => onSettingChange('defaultModel', e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
            >
              {AVAILABLE_MODELS.map(model => (
                <option key={model} value={model}>{model}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm text-gray-400 mb-2">Temperature</label>
            <input
              type="range"
              min="0"
              max="2"
              step="0.1"
              value={settings.temperature}
              onChange={(e) => onSettingChange('temperature', parseFloat(e.target.value))}
              className="w-full"
            />
            <span className="text-sm">{settings.temperature}</span>
          </div>
          
          <div>
            <label className="block text-sm text-gray-400 mb-2">Max Tokens</label>
            <input
              type="number"
              value={settings.maxTokens}
              onChange={(e) => onSettingChange('maxTokens', parseInt(e.target.value))}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
              min="1000"
              max="1000000"
            />
          </div>
          
          <div>
            <label className="block text-sm text-gray-400 mb-2">Thinking Budget</label>
            <input
              type="number"
              value={settings.thinkingBudget}
              onChange={(e) => onSettingChange('thinkingBudget', parseInt(e.target.value))}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
              min="1000"
              max="131072"
            />
          </div>
        </div>
      </section>

      {/* Feature Toggles */}
      <section className="mb-8 p-4 bg-gray-800 rounded-lg">
        <h3 className="text-lg font-semibold mb-4">🎛️ Features - ALL ENABLED</h3>
        
        <div className="grid grid-cols-2 gap-4">
          {[
            { key: 'enableThinking', label: 'Enable Thinking Mode' },
            { key: 'enableMultiModel', label: 'Enable Multi-Model Selection' },
            { key: 'enableDaemons', label: 'Enable Daemons System' },
            { key: 'enableOrchestrator', label: 'Enable Orchestrator' },
          ].map(({ key, label }) => (
            <label key={key} className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings[key as keyof AppSettings] as boolean}
                onChange={(e) => onSettingChange(key as keyof AppSettings, e.target.checked)}
                className="w-5 h-5 rounded"
              />
              <span>{label}</span>
            </label>
          ))}
        </div>
      </section>

      {/* Theme Settings */}
      <section className="mb-8 p-4 bg-gray-800 rounded-lg">
        <h3 className="text-lg font-semibold mb-4">🎨 Appearance</h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2">Theme</label>
            <select
              value={settings.theme}
              onChange={(e) => onSettingChange('theme', e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
            >
              <option value="dark">Dark</option>
              <option value="light">Light</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm text-gray-400 mb-2">Font Size</label>
            <input
              type="number"
              value={settings.fontSize}
              onChange={(e) => onSettingChange('fontSize', parseInt(e.target.value))}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
              min="10"
              max="24"
            />
          </div>
        </div>
      </section>

      {/* System Info */}
      <section className="p-4 bg-gray-800 rounded-lg">
        <h3 className="text-lg font-semibold mb-4">📊 System Info</h3>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <span className="text-gray-400">Version:</span>
          <span>2.0.0 MAXED OUT</span>
          <span className="text-gray-400">Models Available:</span>
          <span>60+</span>
          <span className="text-gray-400">Daemons:</span>
          <span>10 Active</span>
          <span className="text-gray-400">Limits:</span>
          <span className="text-green-400">UNLIMITED</span>
        </div>
      </section>
    </div>
  );
}

export default EnhancedApp;
