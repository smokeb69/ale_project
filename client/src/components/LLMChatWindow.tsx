import React, { useState, useRef, useEffect } from 'react';
import { trpc } from '../trpc';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  model?: string;
  thinking?: string;
  timestamp: number;
  tokens?: number;
}

interface LLMChatWindowProps {
  sessionId?: string;
  onCodeGenerated?: (code: string) => void;
}

// All available models
const AVAILABLE_MODELS = [
  // OpenAI
  { id: 'gpt-4.1-mini', name: 'GPT-4.1 Mini', provider: 'OpenAI', fast: true, thinking: true },
  { id: 'gpt-4.1-nano', name: 'GPT-4.1 Nano', provider: 'OpenAI', fast: true, thinking: true },
  { id: 'gpt-4o', name: 'GPT-4o', provider: 'OpenAI', fast: false, thinking: true },
  { id: 'gpt-4o-mini', name: 'GPT-4o Mini', provider: 'OpenAI', fast: true, thinking: true },
  { id: 'o1', name: 'O1', provider: 'OpenAI', fast: false, thinking: true },
  { id: 'o1-mini', name: 'O1 Mini', provider: 'OpenAI', fast: false, thinking: true },
  // Google
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', provider: 'Google', fast: true, thinking: true },
  { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', provider: 'Google', fast: false, thinking: true },
  { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', provider: 'Google', fast: false, thinking: true },
  // Anthropic
  { id: 'claude-3.5-sonnet', name: 'Claude 3.5 Sonnet', provider: 'Anthropic', fast: false, thinking: true },
  { id: 'claude-3.5-sonnet-v2', name: 'Claude 3.5 Sonnet V2', provider: 'Anthropic', fast: false, thinking: true },
  { id: 'claude-3-opus', name: 'Claude 3 Opus', provider: 'Anthropic', fast: false, thinking: true },
  { id: 'claude-3-haiku', name: 'Claude 3 Haiku', provider: 'Anthropic', fast: true, thinking: false },
  // Meta
  { id: 'llama-3.3-70b', name: 'Llama 3.3 70B', provider: 'Meta', fast: false, thinking: true },
  { id: 'llama-3.1-405b', name: 'Llama 3.1 405B', provider: 'Meta', fast: false, thinking: true },
  { id: 'llama-3.1-70b', name: 'Llama 3.1 70B', provider: 'Meta', fast: false, thinking: true },
  // Mistral
  { id: 'mistral-large', name: 'Mistral Large', provider: 'Mistral', fast: false, thinking: true },
  { id: 'mixtral-8x22b', name: 'Mixtral 8x22B', provider: 'Mistral', fast: false, thinking: true },
  { id: 'codestral', name: 'Codestral', provider: 'Mistral', fast: true, thinking: false },
  // DeepSeek
  { id: 'deepseek-v3', name: 'DeepSeek V3', provider: 'DeepSeek', fast: true, thinking: true },
  { id: 'deepseek-r1', name: 'DeepSeek R1', provider: 'DeepSeek', fast: false, thinking: true },
  // Others
  { id: 'grok-2', name: 'Grok 2', provider: 'xAI', fast: false, thinking: true },
  { id: 'command-r-plus', name: 'Command R+', provider: 'Cohere', fast: false, thinking: true },
  { id: 'qwen-2.5-72b', name: 'Qwen 2.5 72B', provider: 'Alibaba', fast: false, thinking: true },
];

export function LLMChatWindow({ sessionId, onCodeGenerated }: LLMChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [selectedModel, setSelectedModel] = useState('gpt-4.1-mini');
  const [enableThinking, setEnableThinking] = useState(true);
  const [thinkingBudget, setThinkingBudget] = useState(16384);
  const [isLoading, setIsLoading] = useState(false);
  const [showThinking, setShowThinking] = useState(false);
  const [multiModelMode, setMultiModelMode] = useState(false);
  const [selectedModels, setSelectedModels] = useState<string[]>(['gpt-4.1-mini', 'claude-3.5-sonnet', 'gemini-2.5-flash']);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const invokeMutation = trpc.enhanced.orchestrator.invoke.useMutation();
  const parallelMutation = trpc.enhanced.orchestrator.parallelInvoke.useMutation();
  const consensusMutation = trpc.enhanced.orchestrator.consensus.useMutation();

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Send message
  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content: input,
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      if (multiModelMode) {
        // Multi-model mode - get responses from multiple models
        const result = await parallelMutation.mutateAsync({
          messages: [...messages, userMessage].map(m => ({
            role: m.role,
            content: m.content,
          })),
          models: selectedModels,
        });

        // Add responses from each model
        for (const [model, response] of Object.entries(result.responses)) {
          const assistantMessage: Message = {
            id: `msg_${Date.now()}_${model}`,
            role: 'assistant',
            content: (response as any).content || '',
            model,
            timestamp: Date.now(),
            tokens: (response as any).usage?.total_tokens,
          };
          setMessages(prev => [...prev, assistantMessage]);
        }
      } else {
        // Single model mode
        const result = await invokeMutation.mutateAsync({
          messages: [...messages, userMessage].map(m => ({
            role: m.role,
            content: m.content,
          })),
          model: selectedModel,
          enableThinking,
          thinkingBudget,
        });

        const assistantMessage: Message = {
          id: `msg_${Date.now()}`,
          role: 'assistant',
          content: result.content || '',
          model: result.model,
          thinking: result.thinking,
          timestamp: Date.now(),
          tokens: result.usage?.total_tokens,
        };

        setMessages(prev => [...prev, assistantMessage]);

        // Check if response contains code
        if (result.content && onCodeGenerated) {
          const codeMatch = result.content.match(/```[\w]*\n([\s\S]*?)```/);
          if (codeMatch) {
            onCodeGenerated(codeMatch[1]);
          }
        }
      }
    } catch (error: any) {
      const errorMessage: Message = {
        id: `msg_${Date.now()}_error`,
        role: 'assistant',
        content: `❌ Error: ${error.message}`,
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Get consensus
  const getConsensus = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content: `[CONSENSUS REQUEST] ${input}`,
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const result = await consensusMutation.mutateAsync({
        prompt: input,
        models: selectedModels,
      });

      // Add individual responses
      for (const [model, response] of Object.entries(result.responses)) {
        const assistantMessage: Message = {
          id: `msg_${Date.now()}_${model}`,
          role: 'assistant',
          content: `**${model}:**\n${response}`,
          model,
          timestamp: Date.now(),
        };
        setMessages(prev => [...prev, assistantMessage]);
      }

      // Add consensus
      const consensusMessage: Message = {
        id: `msg_${Date.now()}_consensus`,
        role: 'assistant',
        content: `**🎯 CONSENSUS (${(result.agreement * 100).toFixed(0)}% agreement):**\n${result.consensus}`,
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, consensusMessage]);
    } catch (error: any) {
      const errorMessage: Message = {
        id: `msg_${Date.now()}_error`,
        role: 'assistant',
        content: `❌ Error: ${error.message}`,
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Clear chat
  const clearChat = () => {
    setMessages([]);
  };

  // Toggle model selection for multi-model mode
  const toggleModelSelection = (modelId: string) => {
    setSelectedModels(prev => 
      prev.includes(modelId)
        ? prev.filter(m => m !== modelId)
        : [...prev, modelId]
    );
  };

  // Group models by provider
  const groupedModels = AVAILABLE_MODELS.reduce((acc, model) => {
    if (!acc[model.provider]) acc[model.provider] = [];
    acc[model.provider].push(model);
    return acc;
  }, {} as Record<string, typeof AVAILABLE_MODELS>);

  return (
    <div className="llm-chat flex flex-col h-full bg-gray-900 text-white">
      {/* Header */}
      <div className="chat-header p-3 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-blue-400">🤖 LLM Chat</span>
            <span className="text-sm text-gray-400">| Orchestrator</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMultiModelMode(!multiModelMode)}
              className={`px-3 py-1 rounded text-sm ${
                multiModelMode ? 'bg-purple-600' : 'bg-gray-600'
              }`}
            >
              {multiModelMode ? '🔀 Multi-Model' : '1️⃣ Single Model'}
            </button>
            <button
              onClick={clearChat}
              className="px-3 py-1 rounded text-sm bg-red-600 hover:bg-red-700"
            >
              🗑️ Clear
            </button>
          </div>
        </div>

        {/* Model selection */}
        <div className="flex flex-wrap items-center gap-2">
          {!multiModelMode ? (
            <>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="px-3 py-1 rounded bg-gray-700 text-white text-sm"
              >
                {Object.entries(groupedModels).map(([provider, models]) => (
                  <optgroup key={provider} label={provider}>
                    {models.map(model => (
                      <option key={model.id} value={model.id}>
                        {model.name} {model.fast ? '⚡' : ''} {model.thinking ? '🧠' : ''}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
              
              <label className="flex items-center gap-1 text-sm">
                <input
                  type="checkbox"
                  checked={enableThinking}
                  onChange={(e) => setEnableThinking(e.target.checked)}
                  className="rounded"
                />
                🧠 Thinking
              </label>
              
              {enableThinking && (
                <select
                  value={thinkingBudget}
                  onChange={(e) => setThinkingBudget(parseInt(e.target.value))}
                  className="px-2 py-1 rounded bg-gray-700 text-white text-xs"
                >
                  <option value={4096}>4K tokens</option>
                  <option value={8192}>8K tokens</option>
                  <option value={16384}>16K tokens</option>
                  <option value={32768}>32K tokens</option>
                  <option value={65536}>64K tokens</option>
                  <option value={131072}>128K tokens</option>
                </select>
              )}
            </>
          ) : (
            <div className="flex flex-wrap gap-1">
              {AVAILABLE_MODELS.slice(0, 12).map(model => (
                <button
                  key={model.id}
                  onClick={() => toggleModelSelection(model.id)}
                  className={`px-2 py-1 rounded text-xs ${
                    selectedModels.includes(model.id)
                      ? 'bg-blue-600'
                      : 'bg-gray-700'
                  }`}
                >
                  {model.name.split(' ')[0]}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 py-8">
            <div className="text-4xl mb-4">💬</div>
            <div>Start a conversation with the AI</div>
            <div className="text-sm mt-2">
              {multiModelMode 
                ? `Selected models: ${selectedModels.join(', ')}`
                : `Using: ${selectedModel}`
              }
            </div>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-3 ${
                message.role === 'user'
                  ? 'bg-blue-600'
                  : 'bg-gray-800 border border-gray-700'
              }`}
            >
              {/* Model badge */}
              {message.model && (
                <div className="text-xs text-gray-400 mb-1">
                  🤖 {message.model}
                  {message.tokens && ` • ${message.tokens} tokens`}
                </div>
              )}

              {/* Thinking (collapsible) */}
              {message.thinking && (
                <div className="mb-2">
                  <button
                    onClick={() => setShowThinking(!showThinking)}
                    className="text-xs text-purple-400 hover:text-purple-300"
                  >
                    {showThinking ? '🧠 Hide thinking' : '🧠 Show thinking'}
                  </button>
                  {showThinking && (
                    <div className="mt-1 p-2 bg-gray-900 rounded text-xs text-gray-400 whitespace-pre-wrap">
                      {message.thinking}
                    </div>
                  )}
                </div>
              )}

              {/* Content */}
              <div className="whitespace-pre-wrap">{message.content}</div>

              {/* Timestamp */}
              <div className="text-xs text-gray-500 mt-1">
                {new Date(message.timestamp).toLocaleTimeString()}
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <div className="animate-spin">⏳</div>
                <span className="text-gray-400">
                  {multiModelMode 
                    ? `Querying ${selectedModels.length} models...`
                    : `${selectedModel} is thinking...`
                  }
                </span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 bg-gray-800 border-t border-gray-700">
        <div className="flex gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            placeholder="Type your message... (Shift+Enter for new line)"
            className="flex-1 p-3 rounded bg-gray-700 text-white resize-none h-12"
            disabled={isLoading}
          />
          <div className="flex flex-col gap-1">
            <button
              onClick={sendMessage}
              disabled={isLoading || !input.trim()}
              className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600"
            >
              📤 Send
            </button>
            {multiModelMode && (
              <button
                onClick={getConsensus}
                disabled={isLoading || !input.trim()}
                className="px-4 py-1 rounded bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-xs"
              >
                🎯 Consensus
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default LLMChatWindow;
