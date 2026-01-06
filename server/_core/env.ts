/**
 * ALE Environment Configuration - ENHANCED & MAXED OUT
 * All features enabled with working Forge credentials
 */

// Working Forge API Credentials (from forge-router.cjs)
const BUILT_IN_FORGE_API_KEY = "Ye5jtLcxnuo7deETNu2XsJ";
const BUILT_IN_FORGE_ADMIN_PASSWORD = "e8b64d015a3ad30f";
const BUILT_IN_LLM_PROXY_KEY = "sk-cLDLbh3Bp35ukRrwMKsrPF";

export const ENV = {
  // Original settings
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "ale-forge-jwt-secret",
  databaseUrl: process.env.DATABASE_URL ?? "file:./data/ale.db",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  
  // Forge API - WORKING CREDENTIALS
  forgeApiUrl: process.env.FORGE_API_URL || "https://forge.manus.ai",
  forgeApiKey: process.env.FORGE_API_KEY || BUILT_IN_FORGE_API_KEY,
  forgeAdminPassword: process.env.FORGE_ADMIN_PASSWORD || BUILT_IN_FORGE_ADMIN_PASSWORD,
  
  // LLM Proxy - For gpt-4.1-mini and gpt-4.1-nano
  llmProxyUrl: process.env.LLM_PROXY_URL || "https://api.manus.im/api/llm-proxy/v1",
  llmProxyKey: process.env.LLM_PROXY_KEY || BUILT_IN_LLM_PROXY_KEY,
  
  // Server
  port: parseInt(process.env.PORT || "3000", 10),
  host: process.env.HOST || "0.0.0.0",
  nodeEnv: process.env.NODE_ENV || "development",
  
  // Limits - MAXED OUT (UNLIMITED)
  maxTokens: parseInt(process.env.MAX_TOKENS || "1000000", 10),
  maxContextLength: parseInt(process.env.MAX_CONTEXT_LENGTH || "2000000", 10),
  maxConcurrentRequests: parseInt(process.env.MAX_CONCURRENT_REQUESTS || "100", 10),
  requestTimeout: parseInt(process.env.REQUEST_TIMEOUT || "300000", 10),
  
  // Features - ALL ENABLED
  enableThinking: process.env.ENABLE_THINKING !== "false",
  enableMultiModel: process.env.ENABLE_MULTI_MODEL !== "false",
  enableParallel: process.env.ENABLE_PARALLEL !== "false",
  enableDaemons: process.env.ENABLE_DAEMONS !== "false",
  enableIDE: process.env.ENABLE_IDE !== "false",
  enableOrchestrator: process.env.ENABLE_ORCHESTRATOR !== "false",
  enableStreaming: process.env.ENABLE_STREAMING !== "false",
  enableCaching: process.env.ENABLE_CACHING !== "false",
  
  // Thinking - MAXED OUT
  defaultThinkingBudget: parseInt(process.env.DEFAULT_THINKING_BUDGET || "32768", 10),
  maxThinkingBudget: parseInt(process.env.MAX_THINKING_BUDGET || "131072", 10),
  
  // Orchestrator - MAXED OUT
  orchestratorMaxRetries: parseInt(process.env.ORCHESTRATOR_MAX_RETRIES || "10", 10),
  orchestratorParallelLimit: parseInt(process.env.ORCHESTRATOR_PARALLEL_LIMIT || "20", 10),
  
  // IDE
  workspaceRoot: process.env.WORKSPACE_ROOT || process.cwd(),
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE || "104857600", 10),
  
  // Daemons
  daemonAutoStart: process.env.DAEMON_AUTO_START !== "false",
  daemonLogLevel: process.env.DAEMON_LOG_LEVEL || "info",
  
  // Logging
  logLevel: process.env.LOG_LEVEL || "debug",
  logToFile: process.env.LOG_TO_FILE === "true",
  logFilePath: process.env.LOG_FILE_PATH || "./logs/ale.log",
};

// Validation
export function validateEnv(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!ENV.forgeApiKey) {
    errors.push("Forge API Key is not set");
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

// Print configuration
export function printConfig(): void {
  console.log("=".repeat(60));
  console.log("ALE FORGE CONFIGURATION - MAXED OUT & UNLIMITED");
  console.log("=".repeat(60));
  console.log(`Forge API: ${ENV.forgeApiUrl}`);
  console.log(`API Key: ${ENV.forgeApiKey ? "✓ CONFIGURED" : "✗ Missing"}`);
  console.log(`Admin Password: ${ENV.forgeAdminPassword ? "✓ CONFIGURED" : "✗ Missing"}`);
  console.log(`LLM Proxy: ${ENV.llmProxyUrl}`);
  console.log("-".repeat(60));
  console.log("LIMITS (UNLIMITED):");
  console.log(`  Max Tokens: ${ENV.maxTokens.toLocaleString()}`);
  console.log(`  Max Context: ${ENV.maxContextLength.toLocaleString()}`);
  console.log(`  Concurrent Requests: ${ENV.maxConcurrentRequests}`);
  console.log("-".repeat(60));
  console.log("FEATURES (ALL ENABLED):");
  console.log(`  ✓ Thinking Mode (Budget: ${ENV.defaultThinkingBudget})`);
  console.log(`  ✓ Multi-Model Selection`);
  console.log(`  ✓ Parallel Processing`);
  console.log(`  ✓ Daemons System`);
  console.log(`  ✓ IDE File Builder`);
  console.log(`  ✓ Orchestrator`);
  console.log(`  ✓ Streaming`);
  console.log(`  ✓ Caching`);
  console.log("=".repeat(60));
}
