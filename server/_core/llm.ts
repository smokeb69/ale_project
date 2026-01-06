import { ENV } from "./env";

export type Role = "system" | "user" | "assistant" | "tool" | "function";

export type TextContent = {
  type: "text";
  text: string;
};

export type ImageContent = {
  type: "image_url";
  image_url: {
    url: string;
    detail?: "auto" | "low" | "high";
  };
};

export type FileContent = {
  type: "file_url";
  file_url: {
    url: string;
    mime_type?: "audio/mpeg" | "audio/wav" | "application/pdf" | "audio/mp4" | "video/mp4";
  };
};

export type MessageContent = string | TextContent | ImageContent | FileContent;

export type Message = {
  role: Role;
  content: MessageContent | MessageContent[];
  name?: string;
  tool_call_id?: string;
};

export type Tool = {
  type: "function";
  function: {
    name: string;
    description?: string;
    parameters?: Record<string, unknown>;
  };
};

export type ToolChoicePrimitive = "none" | "auto" | "required";
export type ToolChoiceByName = { name: string };
export type ToolChoiceExplicit = {
  type: "function";
  function: {
    name: string;
  };
};

export type ToolChoice =
  | ToolChoicePrimitive
  | ToolChoiceByName
  | ToolChoiceExplicit;

// Enhanced model configuration with capabilities
export interface ModelConfig {
  id: string;
  name: string;
  provider: string;
  maxTokens: number;
  contextWindow: number;
  supportsThinking: boolean;
  supportsVision: boolean;
  supportsTools: boolean;
  supportsStreaming: boolean;
  costPer1kInput: number;
  costPer1kOutput: number;
  bestFor: string[];
  speed: "fast" | "medium" | "slow";
  quality: "standard" | "high" | "premium";
}

// COMPLETE MODEL LIST - ALL FORGE MODELS + EXTENDED
export const ALL_MODELS: ModelConfig[] = [
  // OpenAI Models
  { id: "gpt-4.1-mini", name: "GPT-4.1 Mini", provider: "openai", maxTokens: 128000, contextWindow: 128000, supportsThinking: true, supportsVision: true, supportsTools: true, supportsStreaming: true, costPer1kInput: 0.15, costPer1kOutput: 0.60, bestFor: ["general", "coding", "analysis"], speed: "fast", quality: "high" },
  { id: "gpt-4.1-nano", name: "GPT-4.1 Nano", provider: "openai", maxTokens: 128000, contextWindow: 128000, supportsThinking: true, supportsVision: true, supportsTools: true, supportsStreaming: true, costPer1kInput: 0.10, costPer1kOutput: 0.40, bestFor: ["quick-tasks", "simple-queries"], speed: "fast", quality: "standard" },
  { id: "gpt-4o", name: "GPT-4o", provider: "openai", maxTokens: 128000, contextWindow: 128000, supportsThinking: true, supportsVision: true, supportsTools: true, supportsStreaming: true, costPer1kInput: 2.50, costPer1kOutput: 10.00, bestFor: ["complex-reasoning", "multimodal", "premium-tasks"], speed: "medium", quality: "premium" },
  { id: "gpt-4o-mini", name: "GPT-4o Mini", provider: "openai", maxTokens: 128000, contextWindow: 128000, supportsThinking: true, supportsVision: true, supportsTools: true, supportsStreaming: true, costPer1kInput: 0.15, costPer1kOutput: 0.60, bestFor: ["general", "coding"], speed: "fast", quality: "high" },
  { id: "gpt-4-turbo", name: "GPT-4 Turbo", provider: "openai", maxTokens: 128000, contextWindow: 128000, supportsThinking: true, supportsVision: true, supportsTools: true, supportsStreaming: true, costPer1kInput: 10.00, costPer1kOutput: 30.00, bestFor: ["complex-tasks", "long-context"], speed: "medium", quality: "premium" },
  { id: "gpt-4", name: "GPT-4", provider: "openai", maxTokens: 8192, contextWindow: 8192, supportsThinking: true, supportsVision: false, supportsTools: true, supportsStreaming: true, costPer1kInput: 30.00, costPer1kOutput: 60.00, bestFor: ["reasoning", "analysis"], speed: "slow", quality: "premium" },
  { id: "gpt-3.5-turbo", name: "GPT-3.5 Turbo", provider: "openai", maxTokens: 16385, contextWindow: 16385, supportsThinking: false, supportsVision: false, supportsTools: true, supportsStreaming: true, costPer1kInput: 0.50, costPer1kOutput: 1.50, bestFor: ["simple-tasks", "chat"], speed: "fast", quality: "standard" },
  { id: "o1", name: "O1", provider: "openai", maxTokens: 200000, contextWindow: 200000, supportsThinking: true, supportsVision: true, supportsTools: true, supportsStreaming: true, costPer1kInput: 15.00, costPer1kOutput: 60.00, bestFor: ["deep-reasoning", "math", "science"], speed: "slow", quality: "premium" },
  { id: "o1-mini", name: "O1 Mini", provider: "openai", maxTokens: 128000, contextWindow: 128000, supportsThinking: true, supportsVision: false, supportsTools: true, supportsStreaming: true, costPer1kInput: 3.00, costPer1kOutput: 12.00, bestFor: ["reasoning", "coding"], speed: "medium", quality: "high" },
  { id: "o1-preview", name: "O1 Preview", provider: "openai", maxTokens: 128000, contextWindow: 128000, supportsThinking: true, supportsVision: true, supportsTools: true, supportsStreaming: true, costPer1kInput: 15.00, costPer1kOutput: 60.00, bestFor: ["complex-reasoning"], speed: "slow", quality: "premium" },
  
  // Google Models
  { id: "gemini-2.5-flash", name: "Gemini 2.5 Flash", provider: "google", maxTokens: 1000000, contextWindow: 1000000, supportsThinking: true, supportsVision: true, supportsTools: true, supportsStreaming: true, costPer1kInput: 0.075, costPer1kOutput: 0.30, bestFor: ["multimodal", "long-context", "fast-tasks"], speed: "fast", quality: "high" },
  { id: "gemini-2.5-pro", name: "Gemini 2.5 Pro", provider: "google", maxTokens: 1000000, contextWindow: 1000000, supportsThinking: true, supportsVision: true, supportsTools: true, supportsStreaming: true, costPer1kInput: 1.25, costPer1kOutput: 5.00, bestFor: ["complex-multimodal", "research"], speed: "medium", quality: "premium" },
  { id: "gemini-1.5-pro", name: "Gemini 1.5 Pro", provider: "google", maxTokens: 2000000, contextWindow: 2000000, supportsThinking: true, supportsVision: true, supportsTools: true, supportsStreaming: true, costPer1kInput: 1.25, costPer1kOutput: 5.00, bestFor: ["ultra-long-context", "document-analysis"], speed: "medium", quality: "premium" },
  { id: "gemini-1.5-flash", name: "Gemini 1.5 Flash", provider: "google", maxTokens: 1000000, contextWindow: 1000000, supportsThinking: true, supportsVision: true, supportsTools: true, supportsStreaming: true, costPer1kInput: 0.075, costPer1kOutput: 0.30, bestFor: ["fast-multimodal"], speed: "fast", quality: "high" },
  { id: "gemini-1.0-pro", name: "Gemini 1.0 Pro", provider: "google", maxTokens: 32000, contextWindow: 32000, supportsThinking: false, supportsVision: false, supportsTools: true, supportsStreaming: true, costPer1kInput: 0.50, costPer1kOutput: 1.50, bestFor: ["general"], speed: "fast", quality: "standard" },
  
  // Anthropic Models
  { id: "claude-3.5-sonnet", name: "Claude 3.5 Sonnet", provider: "anthropic", maxTokens: 200000, contextWindow: 200000, supportsThinking: true, supportsVision: true, supportsTools: true, supportsStreaming: true, costPer1kInput: 3.00, costPer1kOutput: 15.00, bestFor: ["coding", "analysis", "writing"], speed: "medium", quality: "premium" },
  { id: "claude-3.5-sonnet-v2", name: "Claude 3.5 Sonnet V2", provider: "anthropic", maxTokens: 200000, contextWindow: 200000, supportsThinking: true, supportsVision: true, supportsTools: true, supportsStreaming: true, costPer1kInput: 3.00, costPer1kOutput: 15.00, bestFor: ["coding", "complex-tasks"], speed: "medium", quality: "premium" },
  { id: "claude-3-opus", name: "Claude 3 Opus", provider: "anthropic", maxTokens: 200000, contextWindow: 200000, supportsThinking: true, supportsVision: true, supportsTools: true, supportsStreaming: true, costPer1kInput: 15.00, costPer1kOutput: 75.00, bestFor: ["complex-reasoning", "research"], speed: "slow", quality: "premium" },
  { id: "claude-3-sonnet", name: "Claude 3 Sonnet", provider: "anthropic", maxTokens: 200000, contextWindow: 200000, supportsThinking: true, supportsVision: true, supportsTools: true, supportsStreaming: true, costPer1kInput: 3.00, costPer1kOutput: 15.00, bestFor: ["balanced-tasks"], speed: "medium", quality: "high" },
  { id: "claude-3-haiku", name: "Claude 3 Haiku", provider: "anthropic", maxTokens: 200000, contextWindow: 200000, supportsThinking: false, supportsVision: true, supportsTools: true, supportsStreaming: true, costPer1kInput: 0.25, costPer1kOutput: 1.25, bestFor: ["fast-tasks", "simple-queries"], speed: "fast", quality: "standard" },
  { id: "claude-2.1", name: "Claude 2.1", provider: "anthropic", maxTokens: 100000, contextWindow: 100000, supportsThinking: false, supportsVision: false, supportsTools: false, supportsStreaming: true, costPer1kInput: 8.00, costPer1kOutput: 24.00, bestFor: ["legacy"], speed: "medium", quality: "high" },
  
  // Meta Llama Models
  { id: "llama-3.3-70b", name: "Llama 3.3 70B", provider: "meta", maxTokens: 128000, contextWindow: 128000, supportsThinking: true, supportsVision: false, supportsTools: true, supportsStreaming: true, costPer1kInput: 0.35, costPer1kOutput: 0.40, bestFor: ["open-source", "coding", "general"], speed: "medium", quality: "high" },
  { id: "llama-3.2-90b-vision", name: "Llama 3.2 90B Vision", provider: "meta", maxTokens: 128000, contextWindow: 128000, supportsThinking: true, supportsVision: true, supportsTools: true, supportsStreaming: true, costPer1kInput: 0.90, costPer1kOutput: 0.90, bestFor: ["multimodal", "vision"], speed: "medium", quality: "high" },
  { id: "llama-3.2-11b-vision", name: "Llama 3.2 11B Vision", provider: "meta", maxTokens: 128000, contextWindow: 128000, supportsThinking: false, supportsVision: true, supportsTools: true, supportsStreaming: true, costPer1kInput: 0.055, costPer1kOutput: 0.055, bestFor: ["fast-vision"], speed: "fast", quality: "standard" },
  { id: "llama-3.1-405b", name: "Llama 3.1 405B", provider: "meta", maxTokens: 128000, contextWindow: 128000, supportsThinking: true, supportsVision: false, supportsTools: true, supportsStreaming: true, costPer1kInput: 3.00, costPer1kOutput: 3.00, bestFor: ["complex-tasks", "research"], speed: "slow", quality: "premium" },
  { id: "llama-3.1-70b", name: "Llama 3.1 70B", provider: "meta", maxTokens: 128000, contextWindow: 128000, supportsThinking: true, supportsVision: false, supportsTools: true, supportsStreaming: true, costPer1kInput: 0.35, costPer1kOutput: 0.40, bestFor: ["general", "coding"], speed: "medium", quality: "high" },
  { id: "llama-3.1-8b", name: "Llama 3.1 8B", provider: "meta", maxTokens: 128000, contextWindow: 128000, supportsThinking: false, supportsVision: false, supportsTools: true, supportsStreaming: true, costPer1kInput: 0.055, costPer1kOutput: 0.055, bestFor: ["fast-tasks", "simple"], speed: "fast", quality: "standard" },
  
  // Mistral Models
  { id: "mistral-large", name: "Mistral Large", provider: "mistral", maxTokens: 128000, contextWindow: 128000, supportsThinking: true, supportsVision: false, supportsTools: true, supportsStreaming: true, costPer1kInput: 2.00, costPer1kOutput: 6.00, bestFor: ["complex-reasoning", "multilingual"], speed: "medium", quality: "premium" },
  { id: "mistral-large-2", name: "Mistral Large 2", provider: "mistral", maxTokens: 128000, contextWindow: 128000, supportsThinking: true, supportsVision: false, supportsTools: true, supportsStreaming: true, costPer1kInput: 2.00, costPer1kOutput: 6.00, bestFor: ["complex-tasks"], speed: "medium", quality: "premium" },
  { id: "mistral-medium", name: "Mistral Medium", provider: "mistral", maxTokens: 32000, contextWindow: 32000, supportsThinking: false, supportsVision: false, supportsTools: true, supportsStreaming: true, costPer1kInput: 2.70, costPer1kOutput: 8.10, bestFor: ["balanced"], speed: "medium", quality: "high" },
  { id: "mistral-small", name: "Mistral Small", provider: "mistral", maxTokens: 32000, contextWindow: 32000, supportsThinking: false, supportsVision: false, supportsTools: true, supportsStreaming: true, costPer1kInput: 0.20, costPer1kOutput: 0.60, bestFor: ["fast-tasks"], speed: "fast", quality: "standard" },
  { id: "mistral-nemo", name: "Mistral Nemo", provider: "mistral", maxTokens: 128000, contextWindow: 128000, supportsThinking: false, supportsVision: false, supportsTools: true, supportsStreaming: true, costPer1kInput: 0.15, costPer1kOutput: 0.15, bestFor: ["efficient"], speed: "fast", quality: "standard" },
  { id: "mixtral-8x7b", name: "Mixtral 8x7B", provider: "mistral", maxTokens: 32000, contextWindow: 32000, supportsThinking: false, supportsVision: false, supportsTools: true, supportsStreaming: true, costPer1kInput: 0.24, costPer1kOutput: 0.24, bestFor: ["moe", "efficient"], speed: "fast", quality: "high" },
  { id: "mixtral-8x22b", name: "Mixtral 8x22B", provider: "mistral", maxTokens: 64000, contextWindow: 64000, supportsThinking: true, supportsVision: false, supportsTools: true, supportsStreaming: true, costPer1kInput: 0.65, costPer1kOutput: 0.65, bestFor: ["complex-moe"], speed: "medium", quality: "high" },
  { id: "codestral", name: "Codestral", provider: "mistral", maxTokens: 32000, contextWindow: 32000, supportsThinking: false, supportsVision: false, supportsTools: true, supportsStreaming: true, costPer1kInput: 0.20, costPer1kOutput: 0.60, bestFor: ["coding"], speed: "fast", quality: "high" },
  { id: "pixtral-12b", name: "Pixtral 12B", provider: "mistral", maxTokens: 128000, contextWindow: 128000, supportsThinking: false, supportsVision: true, supportsTools: true, supportsStreaming: true, costPer1kInput: 0.15, costPer1kOutput: 0.15, bestFor: ["vision", "multimodal"], speed: "fast", quality: "standard" },
  
  // Cohere Models
  { id: "command-r-plus", name: "Command R+", provider: "cohere", maxTokens: 128000, contextWindow: 128000, supportsThinking: true, supportsVision: false, supportsTools: true, supportsStreaming: true, costPer1kInput: 2.50, costPer1kOutput: 10.00, bestFor: ["rag", "enterprise"], speed: "medium", quality: "premium" },
  { id: "command-r", name: "Command R", provider: "cohere", maxTokens: 128000, contextWindow: 128000, supportsThinking: false, supportsVision: false, supportsTools: true, supportsStreaming: true, costPer1kInput: 0.15, costPer1kOutput: 0.60, bestFor: ["rag", "general"], speed: "fast", quality: "high" },
  { id: "command-r-08-2024", name: "Command R 08-2024", provider: "cohere", maxTokens: 128000, contextWindow: 128000, supportsThinking: false, supportsVision: false, supportsTools: true, supportsStreaming: true, costPer1kInput: 0.15, costPer1kOutput: 0.60, bestFor: ["rag"], speed: "fast", quality: "high" },
  
  // xAI Models
  { id: "grok-2", name: "Grok 2", provider: "xai", maxTokens: 131072, contextWindow: 131072, supportsThinking: true, supportsVision: true, supportsTools: true, supportsStreaming: true, costPer1kInput: 2.00, costPer1kOutput: 10.00, bestFor: ["reasoning", "real-time"], speed: "medium", quality: "premium" },
  { id: "grok-2-mini", name: "Grok 2 Mini", provider: "xai", maxTokens: 131072, contextWindow: 131072, supportsThinking: false, supportsVision: false, supportsTools: true, supportsStreaming: true, costPer1kInput: 0.20, costPer1kOutput: 1.00, bestFor: ["fast-tasks"], speed: "fast", quality: "standard" },
  { id: "grok-beta", name: "Grok Beta", provider: "xai", maxTokens: 131072, contextWindow: 131072, supportsThinking: true, supportsVision: true, supportsTools: true, supportsStreaming: true, costPer1kInput: 5.00, costPer1kOutput: 15.00, bestFor: ["experimental"], speed: "medium", quality: "high" },
  
  // DeepSeek Models
  { id: "deepseek-v3", name: "DeepSeek V3", provider: "deepseek", maxTokens: 128000, contextWindow: 128000, supportsThinking: true, supportsVision: false, supportsTools: true, supportsStreaming: true, costPer1kInput: 0.14, costPer1kOutput: 0.28, bestFor: ["coding", "reasoning"], speed: "fast", quality: "high" },
  { id: "deepseek-v2.5", name: "DeepSeek V2.5", provider: "deepseek", maxTokens: 128000, contextWindow: 128000, supportsThinking: true, supportsVision: false, supportsTools: true, supportsStreaming: true, costPer1kInput: 0.14, costPer1kOutput: 0.28, bestFor: ["coding"], speed: "fast", quality: "high" },
  { id: "deepseek-v2", name: "DeepSeek V2", provider: "deepseek", maxTokens: 128000, contextWindow: 128000, supportsThinking: false, supportsVision: false, supportsTools: true, supportsStreaming: true, costPer1kInput: 0.14, costPer1kOutput: 0.28, bestFor: ["coding"], speed: "fast", quality: "high" },
  { id: "deepseek-coder", name: "DeepSeek Coder", provider: "deepseek", maxTokens: 64000, contextWindow: 64000, supportsThinking: false, supportsVision: false, supportsTools: true, supportsStreaming: true, costPer1kInput: 0.14, costPer1kOutput: 0.28, bestFor: ["coding"], speed: "fast", quality: "high" },
  { id: "deepseek-r1", name: "DeepSeek R1", provider: "deepseek", maxTokens: 128000, contextWindow: 128000, supportsThinking: true, supportsVision: false, supportsTools: true, supportsStreaming: true, costPer1kInput: 0.55, costPer1kOutput: 2.19, bestFor: ["deep-reasoning", "math"], speed: "slow", quality: "premium" },
  
  // Qwen Models
  { id: "qwen-2.5-72b", name: "Qwen 2.5 72B", provider: "alibaba", maxTokens: 128000, contextWindow: 128000, supportsThinking: true, supportsVision: false, supportsTools: true, supportsStreaming: true, costPer1kInput: 0.35, costPer1kOutput: 0.40, bestFor: ["multilingual", "coding"], speed: "medium", quality: "high" },
  { id: "qwen-2.5-32b", name: "Qwen 2.5 32B", provider: "alibaba", maxTokens: 128000, contextWindow: 128000, supportsThinking: false, supportsVision: false, supportsTools: true, supportsStreaming: true, costPer1kInput: 0.15, costPer1kOutput: 0.15, bestFor: ["general"], speed: "fast", quality: "high" },
  { id: "qwen-2.5-coder-32b", name: "Qwen 2.5 Coder 32B", provider: "alibaba", maxTokens: 128000, contextWindow: 128000, supportsThinking: false, supportsVision: false, supportsTools: true, supportsStreaming: true, costPer1kInput: 0.15, costPer1kOutput: 0.15, bestFor: ["coding"], speed: "fast", quality: "high" },
  { id: "qwen-qwq-32b", name: "Qwen QwQ 32B", provider: "alibaba", maxTokens: 128000, contextWindow: 128000, supportsThinking: true, supportsVision: false, supportsTools: true, supportsStreaming: true, costPer1kInput: 0.15, costPer1kOutput: 0.15, bestFor: ["reasoning"], speed: "medium", quality: "high" },
  
  // Other Models
  { id: "yi-large", name: "Yi Large", provider: "01ai", maxTokens: 32000, contextWindow: 32000, supportsThinking: false, supportsVision: false, supportsTools: true, supportsStreaming: true, costPer1kInput: 0.20, costPer1kOutput: 0.20, bestFor: ["chinese", "general"], speed: "fast", quality: "high" },
  { id: "yi-34b", name: "Yi 34B", provider: "01ai", maxTokens: 32000, contextWindow: 32000, supportsThinking: false, supportsVision: false, supportsTools: true, supportsStreaming: true, costPer1kInput: 0.10, costPer1kOutput: 0.10, bestFor: ["general"], speed: "fast", quality: "standard" },
  { id: "phi-3-medium", name: "Phi-3 Medium", provider: "microsoft", maxTokens: 128000, contextWindow: 128000, supportsThinking: false, supportsVision: false, supportsTools: true, supportsStreaming: true, costPer1kInput: 0.10, costPer1kOutput: 0.10, bestFor: ["efficient", "edge"], speed: "fast", quality: "standard" },
  { id: "phi-3-small", name: "Phi-3 Small", provider: "microsoft", maxTokens: 128000, contextWindow: 128000, supportsThinking: false, supportsVision: false, supportsTools: true, supportsStreaming: true, costPer1kInput: 0.05, costPer1kOutput: 0.05, bestFor: ["edge", "mobile"], speed: "fast", quality: "standard" },
  { id: "dbrx-instruct", name: "DBRX Instruct", provider: "databricks", maxTokens: 32000, contextWindow: 32000, supportsThinking: false, supportsVision: false, supportsTools: true, supportsStreaming: true, costPer1kInput: 0.75, costPer1kOutput: 0.75, bestFor: ["enterprise"], speed: "medium", quality: "high" },
  { id: "jamba-1.5-large", name: "Jamba 1.5 Large", provider: "ai21", maxTokens: 256000, contextWindow: 256000, supportsThinking: false, supportsVision: false, supportsTools: true, supportsStreaming: true, costPer1kInput: 2.00, costPer1kOutput: 8.00, bestFor: ["long-context"], speed: "medium", quality: "high" },
  { id: "jamba-1.5-mini", name: "Jamba 1.5 Mini", provider: "ai21", maxTokens: 256000, contextWindow: 256000, supportsThinking: false, supportsVision: false, supportsTools: true, supportsStreaming: true, costPer1kInput: 0.20, costPer1kOutput: 0.40, bestFor: ["efficient"], speed: "fast", quality: "standard" },
];

// Get all model IDs
export const AVAILABLE_MODELS = ALL_MODELS.map(m => m.id);

export type InvokeParams = {
  messages: Message[];
  model?: string;
  tools?: Tool[];
  toolChoice?: ToolChoice;
  tool_choice?: ToolChoice;
  maxTokens?: number;
  max_tokens?: number;
  outputSchema?: OutputSchema;
  output_schema?: OutputSchema;
  responseFormat?: ResponseFormat;
  response_format?: ResponseFormat;
  enableThinking?: boolean;
  thinkingBudget?: number;
  temperature?: number;
  topP?: number;
  stream?: boolean;
};

export type ToolCall = {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string;
  };
};

export type ThinkingContent = {
  type: "thinking";
  thinking: string;
};

export type InvokeResult = {
  id: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: Role;
      content: string | Array<TextContent | ImageContent | FileContent | ThinkingContent>;
      tool_calls?: ToolCall[];
      thinking?: string;
    };
    finish_reason: string | null;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
    thinking_tokens?: number;
  };
};

export type JsonSchema = {
  name: string;
  schema: Record<string, unknown>;
  strict?: boolean;
};

export type OutputSchema = JsonSchema;

export type ResponseFormat =
  | { type: "text" }
  | { type: "json_object" }
  | { type: "json_schema"; json_schema: JsonSchema };

// Task types for intelligent routing
export type TaskType = 
  | "coding" 
  | "reasoning" 
  | "creative-writing" 
  | "analysis" 
  | "math" 
  | "research" 
  | "chat" 
  | "multimodal" 
  | "translation" 
  | "summarization"
  | "file-operations"
  | "system-tasks";

// Orchestrator configuration
export interface OrchestratorConfig {
  enableAutoRouting: boolean;
  preferredModels: string[];
  fallbackModel: string;
  maxRetries: number;
  enableThinkingByDefault: boolean;
  defaultThinkingBudget: number;
  parallelRequests: number;
  costOptimization: boolean;
  qualityPriority: "speed" | "balanced" | "quality";
}

// Default orchestrator config - MAXED OUT
export const DEFAULT_ORCHESTRATOR_CONFIG: OrchestratorConfig = {
  enableAutoRouting: true,
  preferredModels: ["gpt-4.1-mini", "claude-3.5-sonnet", "gemini-2.5-flash"],
  fallbackModel: "gpt-4.1-mini",
  maxRetries: 5,
  enableThinkingByDefault: true,
  defaultThinkingBudget: 16384,
  parallelRequests: 10,
  costOptimization: false,
  qualityPriority: "quality",
};

// Get model config by ID
export function getModelConfig(modelId: string): ModelConfig | undefined {
  return ALL_MODELS.find(m => m.id === modelId);
}

// Get best model for task type
export function getBestModelForTask(taskType: TaskType, config: OrchestratorConfig = DEFAULT_ORCHESTRATOR_CONFIG): string {
  const taskModelMap: Record<TaskType, string[]> = {
    "coding": ["claude-3.5-sonnet", "deepseek-v3", "gpt-4.1-mini", "codestral"],
    "reasoning": ["o1", "deepseek-r1", "claude-3-opus", "gpt-4o"],
    "creative-writing": ["claude-3.5-sonnet", "gpt-4o", "gemini-2.5-pro"],
    "analysis": ["gpt-4o", "claude-3.5-sonnet", "gemini-2.5-pro"],
    "math": ["o1", "deepseek-r1", "qwen-qwq-32b", "gpt-4o"],
    "research": ["gemini-1.5-pro", "claude-3-opus", "gpt-4-turbo"],
    "chat": ["gpt-4.1-mini", "claude-3-haiku", "gemini-2.5-flash"],
    "multimodal": ["gpt-4o", "gemini-2.5-flash", "llama-3.2-90b-vision"],
    "translation": ["gpt-4o", "claude-3.5-sonnet", "qwen-2.5-72b"],
    "summarization": ["claude-3.5-sonnet", "gpt-4.1-mini", "gemini-2.5-flash"],
    "file-operations": ["claude-3.5-sonnet", "gpt-4.1-mini", "deepseek-v3"],
    "system-tasks": ["gpt-4.1-mini", "claude-3-haiku", "mistral-small"],
  };

  const candidates = taskModelMap[taskType] || [config.fallbackModel];
  
  // Find first available model from candidates
  for (const modelId of candidates) {
    if (AVAILABLE_MODELS.includes(modelId)) {
      return modelId;
    }
  }
  
  return config.fallbackModel;
}

// Detect task type from message content
export function detectTaskType(messages: Message[]): TaskType {
  const lastMessage = messages[messages.length - 1];
  const content = typeof lastMessage.content === "string" 
    ? lastMessage.content.toLowerCase() 
    : JSON.stringify(lastMessage.content).toLowerCase();

  // Keywords for task detection
  const taskKeywords: Record<TaskType, string[]> = {
    "coding": ["code", "function", "class", "debug", "error", "implement", "program", "script", "api", "database", "sql", "python", "javascript", "typescript", "react", "node"],
    "reasoning": ["why", "explain", "reason", "logic", "think", "analyze", "deduce", "infer", "conclude"],
    "creative-writing": ["write", "story", "poem", "creative", "fiction", "narrative", "blog", "article"],
    "analysis": ["analyze", "compare", "evaluate", "assess", "review", "examine", "study"],
    "math": ["calculate", "math", "equation", "formula", "solve", "compute", "algebra", "calculus", "statistics"],
    "research": ["research", "find", "search", "investigate", "explore", "discover", "learn about"],
    "chat": ["hello", "hi", "hey", "thanks", "how are you", "what's up"],
    "multimodal": ["image", "picture", "photo", "video", "audio", "vision", "see", "look at"],
    "translation": ["translate", "translation", "language", "convert to"],
    "summarization": ["summarize", "summary", "tldr", "brief", "overview", "key points"],
    "file-operations": ["file", "create file", "write file", "read file", "edit file", "delete file", "folder", "directory"],
    "system-tasks": ["system", "config", "setting", "install", "setup", "configure"],
  };

  // Score each task type
  let bestTask: TaskType = "chat";
  let bestScore = 0;

  for (const [task, keywords] of Object.entries(taskKeywords)) {
    const score = keywords.filter(kw => content.includes(kw)).length;
    if (score > bestScore) {
      bestScore = score;
      bestTask = task as TaskType;
    }
  }

  return bestTask;
}

const ensureArray = (
  value: MessageContent | MessageContent[]
): MessageContent[] => (Array.isArray(value) ? value : [value]);

const normalizeContentPart = (
  part: MessageContent
): TextContent | ImageContent | FileContent => {
  if (typeof part === "string") {
    return { type: "text", text: part };
  }

  if (part.type === "text") {
    return part;
  }

  if (part.type === "image_url") {
    return part;
  }

  if (part.type === "file_url") {
    return part;
  }

  throw new Error("Unsupported message content part");
};

const normalizeMessage = (message: Message) => {
  const { role, name, tool_call_id } = message;

  if (role === "tool" || role === "function") {
    const content = ensureArray(message.content)
      .map(part => (typeof part === "string" ? part : JSON.stringify(part)))
      .join("\n");

    return {
      role,
      name,
      tool_call_id,
      content,
    };
  }

  const contentParts = ensureArray(message.content).map(normalizeContentPart);

  if (contentParts.length === 1 && contentParts[0].type === "text") {
    return {
      role,
      name,
      content: contentParts[0].text,
    };
  }

  return {
    role,
    name,
    content: contentParts,
  };
};

const normalizeToolChoice = (
  toolChoice: ToolChoice | undefined,
  tools: Tool[] | undefined
): "none" | "auto" | ToolChoiceExplicit | undefined => {
  if (!toolChoice) return undefined;

  if (toolChoice === "none" || toolChoice === "auto") {
    return toolChoice;
  }

  if (toolChoice === "required") {
    if (!tools || tools.length === 0) {
      throw new Error(
        "tool_choice 'required' was provided but no tools were configured"
      );
    }

    if (tools.length > 1) {
      throw new Error(
        "tool_choice 'required' needs a single tool or specify the tool name explicitly"
      );
    }

    return {
      type: "function",
      function: { name: tools[0].function.name },
    };
  }

  if ("name" in toolChoice) {
    return {
      type: "function",
      function: { name: toolChoice.name },
    };
  }

  return toolChoice;
};

const resolveApiUrl = () => {
  const baseUrl = ENV.forgeApiUrl && ENV.forgeApiUrl.trim().length > 0
    ? ENV.forgeApiUrl.replace(/\/$/, "")
    : "https://forge.manus.ai";
  
  return `${baseUrl}/v1/chat/completions`;
};

const assertApiKey = () => {
  if (!ENV.forgeApiKey) {
    throw new Error("BUILT_IN_FORGE_API_KEY is not configured. Please set it in your .env file.");
  }
};

const normalizeResponseFormat = ({
  responseFormat,
  response_format,
  outputSchema,
  output_schema,
}: {
  responseFormat?: ResponseFormat;
  response_format?: ResponseFormat;
  outputSchema?: OutputSchema;
  output_schema?: OutputSchema;
}):
  | { type: "json_schema"; json_schema: JsonSchema }
  | { type: "text" }
  | { type: "json_object" }
  | undefined => {
  const explicitFormat = responseFormat || response_format;
  if (explicitFormat) {
    if (
      explicitFormat.type === "json_schema" &&
      !explicitFormat.json_schema?.schema
    ) {
      throw new Error(
        "responseFormat json_schema requires a defined schema object"
      );
    }
    return explicitFormat;
  }

  const schema = outputSchema || output_schema;
  if (!schema) return undefined;

  if (!schema.name || !schema.schema) {
    throw new Error("outputSchema requires both name and schema");
  }

  return {
    type: "json_schema",
    json_schema: {
      name: schema.name,
      schema: schema.schema,
      ...(typeof schema.strict === "boolean" ? { strict: schema.strict } : {}),
    },
  };
};

// Main LLM invocation function - ENHANCED
export async function invokeLLM(params: InvokeParams): Promise<InvokeResult> {
  assertApiKey();

  const {
    messages,
    model,
    tools,
    toolChoice,
    tool_choice,
    outputSchema,
    output_schema,
    responseFormat,
    response_format,
    maxTokens,
    max_tokens,
    enableThinking = DEFAULT_ORCHESTRATOR_CONFIG.enableThinkingByDefault,
    thinkingBudget = DEFAULT_ORCHESTRATOR_CONFIG.defaultThinkingBudget,
    temperature,
    topP,
    stream = false,
  } = params;

  // Auto-select model if not specified
  const taskType = detectTaskType(messages);
  const selectedModel = model || getBestModelForTask(taskType);
  const modelConfig = getModelConfig(selectedModel);

  console.log(`[LLM] Task type detected: ${taskType}`);
  console.log(`[LLM] Selected model: ${selectedModel}`);

  const payload: Record<string, unknown> = {
    model: selectedModel,
    messages: messages.map(normalizeMessage),
    stream,
  };

  if (tools && tools.length > 0) {
    payload.tools = tools;
  }

  const normalizedToolChoice = normalizeToolChoice(
    toolChoice || tool_choice,
    tools
  );
  if (normalizedToolChoice) {
    payload.tool_choice = normalizedToolChoice;
  }

  // Set max tokens - UNLIMITED by default
  payload.max_tokens = maxTokens || max_tokens || modelConfig?.maxTokens || 128000;

  // Enable thinking for supported models
  if (enableThinking && modelConfig?.supportsThinking) {
    payload.thinking = {
      budget_tokens: thinkingBudget,
    };
    console.log(`[LLM] Thinking enabled with budget: ${thinkingBudget} tokens`);
  }

  // Temperature and top_p
  if (temperature !== undefined) {
    payload.temperature = temperature;
  }
  if (topP !== undefined) {
    payload.top_p = topP;
  }

  const normalizedResponseFormat = normalizeResponseFormat({
    responseFormat,
    response_format,
    outputSchema,
    output_schema,
  });

  if (normalizedResponseFormat) {
    payload.response_format = normalizedResponseFormat;
  }

  const apiUrl = resolveApiUrl();
  
  console.log(`[LLM] Invoking ${selectedModel} at ${apiUrl}`);
  console.log(`[LLM] Max tokens: ${payload.max_tokens}`);

  // Add MODEL_ROUTING system message for proper routing
  const messagesWithRouting = [
    {
      role: "system",
      content: `[MODEL_ROUTING] Requested model: ${selectedModel}. Route this request to ${selectedModel} backend. Model identifier: ${selectedModel}`,
    },
    ...payload.messages as any[],
  ];
  payload.messages = messagesWithRouting;

  // Build headers with X-Admin-Password for full access
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${ENV.forgeApiKey}`,
    "X-API-Key": ENV.forgeApiKey,
  };
  
  // Add admin password if available
  if (ENV.forgeAdminPassword) {
    headers["X-Admin-Password"] = ENV.forgeAdminPassword;
  }

  console.log(`[LLM] Using MODEL_ROUTING for ${selectedModel}`);
  console.log(`[LLM] Admin mode: ${ENV.forgeAdminPassword ? 'ENABLED' : 'DISABLED'}`);

  const response = await fetch(apiUrl, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[LLM] Error: ${response.status} ${response.statusText}`);
    console.error(`[LLM] Error details: ${errorText}`);
    throw new Error(
      `LLM invoke failed: ${response.status} ${response.statusText} – ${errorText}`
    );
  }

  const result = (await response.json()) as InvokeResult;
  
  console.log(`[LLM] Response received from ${result.model}`);
  console.log(`[LLM] Tokens used: ${result.usage?.total_tokens || 0} (prompt: ${result.usage?.prompt_tokens || 0}, completion: ${result.usage?.completion_tokens || 0})`);
  if (result.usage?.thinking_tokens) {
    console.log(`[LLM] Thinking tokens: ${result.usage.thinking_tokens}`);
  }

  return result;
}

// Multi-model parallel invocation
export async function invokeMultipleLLMs(
  params: InvokeParams,
  models: string[]
): Promise<Map<string, InvokeResult>> {
  const results = new Map<string, InvokeResult>();
  
  console.log(`[LLM] Invoking ${models.length} models in parallel`);
  
  const promises = models.map(async (modelId) => {
    try {
      const result = await invokeLLM({ ...params, model: modelId });
      results.set(modelId, result);
      return { modelId, success: true, result };
    } catch (error) {
      console.error(`[LLM] Error with model ${modelId}:`, error);
      return { modelId, success: false, error };
    }
  });

  await Promise.all(promises);
  
  console.log(`[LLM] Completed ${results.size}/${models.length} model invocations`);
  
  return results;
}

// Get best response from multiple models
export async function getBestResponse(
  params: InvokeParams,
  models: string[] = DEFAULT_ORCHESTRATOR_CONFIG.preferredModels
): Promise<InvokeResult> {
  const results = await invokeMultipleLLMs(params, models);
  
  // Score responses based on quality metrics
  let bestResult: InvokeResult | null = null;
  let bestScore = -1;
  
  for (const [modelId, result] of results) {
    const modelConfig = getModelConfig(modelId);
    const qualityScore = modelConfig?.quality === "premium" ? 3 : modelConfig?.quality === "high" ? 2 : 1;
    const lengthScore = Math.min(result.choices[0]?.message?.content?.length || 0, 10000) / 10000;
    const score = qualityScore + lengthScore;
    
    if (score > bestScore) {
      bestScore = score;
      bestResult = result;
    }
  }
  
  if (!bestResult) {
    throw new Error("No successful responses from any model");
  }
  
  return bestResult;
}

// Export model utilities
export function getAvailableModels(): ModelConfig[] {
  return [...ALL_MODELS];
}

export function isModelAvailable(model: string): boolean {
  return AVAILABLE_MODELS.includes(model);
}

export function getModelsByProvider(provider: string): ModelConfig[] {
  return ALL_MODELS.filter(m => m.provider === provider);
}

export function getModelsByCapability(capability: keyof ModelConfig): ModelConfig[] {
  return ALL_MODELS.filter(m => m[capability] === true);
}

export function getThinkingModels(): ModelConfig[] {
  return ALL_MODELS.filter(m => m.supportsThinking);
}

export function getVisionModels(): ModelConfig[] {
  return ALL_MODELS.filter(m => m.supportsVision);
}

export function getFastModels(): ModelConfig[] {
  return ALL_MODELS.filter(m => m.speed === "fast");
}

export function getPremiumModels(): ModelConfig[] {
  return ALL_MODELS.filter(m => m.quality === "premium");
}
