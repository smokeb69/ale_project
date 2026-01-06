/**
 * ALE Settings - Centralized Configuration Management
 * All settings interconnected and maxed out
 */

import { ENV } from "./env";
import { DEFAULT_ORCHESTRATOR_CONFIG, OrchestratorConfig } from "./llm";

// Global settings interface
export interface ALESettings {
  // System
  system: {
    name: string;
    version: string;
    mode: "development" | "production" | "unlimited";
    debugMode: boolean;
    verboseLogging: boolean;
  };
  
  // API
  api: {
    forgeUrl: string;
    forgeApiKey: string;
    timeout: number;
    retries: number;
    rateLimit: number; // requests per minute, 0 = unlimited
  };
  
  // Models
  models: {
    defaultModel: string;
    fallbackModel: string;
    preferredModels: string[];
    enableAllModels: boolean;
    autoSelectBest: boolean;
  };
  
  // Thinking
  thinking: {
    enabled: boolean;
    defaultBudget: number;
    maxBudget: number;
    autoEnable: boolean;
  };
  
  // Orchestrator
  orchestrator: OrchestratorConfig;
  
  // IDE
  ide: {
    enabled: boolean;
    workspaceRoot: string;
    maxFileSize: number;
    allowedExtensions: string[];
    autoSave: boolean;
    formatOnSave: boolean;
  };
  
  // Daemons
  daemons: {
    enabled: boolean;
    autoStart: boolean;
    logLevel: "debug" | "info" | "warn" | "error";
    maxConcurrent: number;
    defaultInterval: number;
  };
  
  // Limits - MAXED OUT
  limits: {
    maxTokens: number;
    maxContextLength: number;
    maxConcurrentRequests: number;
    maxFileSize: number;
    maxUploadSize: number;
    requestTimeout: number;
  };
  
  // Features - ALL ENABLED
  features: {
    thinking: boolean;
    multiModel: boolean;
    parallel: boolean;
    daemons: boolean;
    ide: boolean;
    orchestrator: boolean;
    streaming: boolean;
    caching: boolean;
    consensus: boolean;
    chaining: boolean;
    autoRouting: boolean;
  };
  
  // Security
  security: {
    jwtSecret: string;
    sessionSecret: string;
    enableAuth: boolean;
    allowAnonymous: boolean;
  };
  
  // Logging
  logging: {
    level: "debug" | "info" | "warn" | "error";
    toFile: boolean;
    filePath: string;
    maxFileSize: number;
    rotateFiles: boolean;
  };
}

// Default settings - EVERYTHING MAXED OUT AND ENABLED
export const DEFAULT_SETTINGS: ALESettings = {
  system: {
    name: "ALE Forge",
    version: "2.0.0-unlimited",
    mode: "unlimited",
    debugMode: true,
    verboseLogging: true,
  },
  
  api: {
    forgeUrl: ENV.forgeApiUrl || "https://forge.manus.ai",
    forgeApiKey: ENV.forgeApiKey,
    timeout: 300000, // 5 minutes
    retries: 10,
    rateLimit: 0, // Unlimited
  },
  
  models: {
    defaultModel: "gpt-4.1-mini",
    fallbackModel: "gpt-4.1-nano",
    preferredModels: [
      "gpt-4.1-mini",
      "claude-3.5-sonnet",
      "gemini-2.5-flash",
      "deepseek-v3",
      "llama-3.3-70b",
    ],
    enableAllModels: true,
    autoSelectBest: true,
  },
  
  thinking: {
    enabled: true,
    defaultBudget: 32768,
    maxBudget: 131072,
    autoEnable: true,
  },
  
  orchestrator: DEFAULT_ORCHESTRATOR_CONFIG,
  
  ide: {
    enabled: true,
    workspaceRoot: process.cwd(),
    maxFileSize: 100 * 1024 * 1024, // 100MB
    allowedExtensions: ["*"], // All extensions
    autoSave: true,
    formatOnSave: true,
  },
  
  daemons: {
    enabled: true,
    autoStart: true,
    logLevel: "debug",
    maxConcurrent: 10,
    defaultInterval: 5000,
  },
  
  limits: {
    maxTokens: 1000000,
    maxContextLength: 2000000,
    maxConcurrentRequests: 100,
    maxFileSize: 100 * 1024 * 1024,
    maxUploadSize: 500 * 1024 * 1024,
    requestTimeout: 300000,
  },
  
  features: {
    thinking: true,
    multiModel: true,
    parallel: true,
    daemons: true,
    ide: true,
    orchestrator: true,
    streaming: true,
    caching: true,
    consensus: true,
    chaining: true,
    autoRouting: true,
  },
  
  security: {
    jwtSecret: ENV.cookieSecret || "ale-forge-jwt-secret",
    sessionSecret: "ale-forge-session-secret",
    enableAuth: false, // Disabled for easy access
    allowAnonymous: true,
  },
  
  logging: {
    level: "debug",
    toFile: true,
    filePath: "./logs/ale.log",
    maxFileSize: 50 * 1024 * 1024, // 50MB
    rotateFiles: true,
  },
};

// Current settings (mutable)
let currentSettings: ALESettings = { ...DEFAULT_SETTINGS };

// Get current settings
export function getSettings(): ALESettings {
  return { ...currentSettings };
}

// Update settings
export function updateSettings(updates: Partial<ALESettings>): ALESettings {
  currentSettings = deepMerge(currentSettings, updates);
  console.log("[Settings] Updated:", JSON.stringify(updates, null, 2));
  return currentSettings;
}

// Reset to defaults
export function resetSettings(): ALESettings {
  currentSettings = { ...DEFAULT_SETTINGS };
  console.log("[Settings] Reset to defaults");
  return currentSettings;
}

// Deep merge helper
function deepMerge<T extends Record<string, any>>(target: T, source: Partial<T>): T {
  const result = { ...target };
  
  for (const key in source) {
    if (source[key] !== undefined) {
      if (
        typeof source[key] === "object" &&
        source[key] !== null &&
        !Array.isArray(source[key]) &&
        typeof target[key] === "object" &&
        target[key] !== null
      ) {
        result[key] = deepMerge(target[key], source[key] as any);
      } else {
        result[key] = source[key] as any;
      }
    }
  }
  
  return result;
}

// Validate settings
export function validateSettings(settings: ALESettings): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!settings.api.forgeApiKey) {
    errors.push("Forge API key is required");
  }
  
  if (settings.limits.maxTokens < 1) {
    errors.push("Max tokens must be at least 1");
  }
  
  if (settings.thinking.defaultBudget > settings.thinking.maxBudget) {
    errors.push("Default thinking budget cannot exceed max budget");
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

// Export settings as JSON
export function exportSettings(): string {
  return JSON.stringify(currentSettings, null, 2);
}

// Import settings from JSON
export function importSettings(json: string): ALESettings {
  try {
    const imported = JSON.parse(json);
    currentSettings = deepMerge(DEFAULT_SETTINGS, imported);
    return currentSettings;
  } catch (error) {
    console.error("[Settings] Failed to import:", error);
    return currentSettings;
  }
}

// Print settings summary
export function printSettingsSummary(): void {
  console.log("=".repeat(60));
  console.log("ALE FORGE SETTINGS - MAXED OUT");
  console.log("=".repeat(60));
  console.log(`System: ${currentSettings.system.name} v${currentSettings.system.version}`);
  console.log(`Mode: ${currentSettings.system.mode.toUpperCase()}`);
  console.log("-".repeat(60));
  console.log("FEATURES ENABLED:");
  Object.entries(currentSettings.features).forEach(([key, value]) => {
    console.log(`  ${value ? "✓" : "✗"} ${key}`);
  });
  console.log("-".repeat(60));
  console.log("LIMITS:");
  console.log(`  Max Tokens: ${currentSettings.limits.maxTokens.toLocaleString()}`);
  console.log(`  Max Context: ${currentSettings.limits.maxContextLength.toLocaleString()}`);
  console.log(`  Concurrent Requests: ${currentSettings.limits.maxConcurrentRequests}`);
  console.log("-".repeat(60));
  console.log("MODELS:");
  console.log(`  Default: ${currentSettings.models.defaultModel}`);
  console.log(`  Preferred: ${currentSettings.models.preferredModels.join(", ")}`);
  console.log("=".repeat(60));
}

// Initialize settings on module load
printSettingsSummary();
