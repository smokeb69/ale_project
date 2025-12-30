import axios from 'axios';
import { createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';
import archiver from 'archiver';

/**
 * Model Weight Downloader
 * Streams large model files (10GB-100GB+) from Hugging Face into ZIP archive
 * without loading entire files into memory
 * 
 * Supports all 42 models available in ALE Forge
 */

interface ModelConfig {
  name: string;
  huggingFaceRepo: string;
  files: string[]; // List of files to download (model.safetensors, tokenizer.json, etc.)
  size: number; // Estimated size in bytes
  apiOnly?: boolean; // True for proprietary models (GPT, Claude, Gemini) that can't be downloaded
}

// Map of all 42 available models to their Hugging Face repositories or API info
export const MODEL_CONFIGS: Record<string, ModelConfig> = {
  // OpenAI Models (API only - no downloadable weights)
  'gpt-4.1-mini': {
    name: 'GPT-4.1 Mini',
    huggingFaceRepo: '',
    files: [],
    size: 0,
    apiOnly: true
  },
  'gpt-4o': {
    name: 'GPT-4o',
    huggingFaceRepo: '',
    files: [],
    size: 0,
    apiOnly: true
  },
  'gpt-4-turbo': {
    name: 'GPT-4 Turbo',
    huggingFaceRepo: '',
    files: [],
    size: 0,
    apiOnly: true
  },
  'gpt-4': {
    name: 'GPT-4',
    huggingFaceRepo: '',
    files: [],
    size: 0,
    apiOnly: true
  },
  'gpt-3.5-turbo': {
    name: 'GPT-3.5 Turbo',
    huggingFaceRepo: '',
    files: [],
    size: 0,
    apiOnly: true
  },
  
  // Anthropic Models (API only)
  'claude-3.5-sonnet': {
    name: 'Claude 3.5 Sonnet',
    huggingFaceRepo: '',
    files: [],
    size: 0,
    apiOnly: true
  },
  'claude-3-opus': {
    name: 'Claude 3 Opus',
    huggingFaceRepo: '',
    files: [],
    size: 0,
    apiOnly: true
  },
  'claude-3-haiku': {
    name: 'Claude 3 Haiku',
    huggingFaceRepo: '',
    files: [],
    size: 0,
    apiOnly: true
  },
  
  // Google Models (API only)
  'gemini-1.5-pro': {
    name: 'Gemini 1.5 Pro',
    huggingFaceRepo: '',
    files: [],
    size: 0,
    apiOnly: true
  },
  'gemini-1.5-flash': {
    name: 'Gemini 1.5 Flash',
    huggingFaceRepo: '',
    files: [],
    size: 0,
    apiOnly: true
  },
  
  // Meta Llama Models (Open source - downloadable)
  'llama-3.1-405b': {
    name: 'Llama 3.1 405B',
    huggingFaceRepo: 'meta-llama/Llama-3.1-405B-Instruct',
    files: generateSafetensorsFiles(191), // 405B model has 191 shards
    size: 810 * 1024 * 1024 * 1024 // ~810GB
  },
  'llama-3.1-70b': {
    name: 'Llama 3.1 70B',
    huggingFaceRepo: 'meta-llama/Llama-3.1-70B-Instruct',
    files: generateSafetensorsFiles(30),
    size: 140 * 1024 * 1024 * 1024 // ~140GB
  },
  'llama-3.1-8b': {
    name: 'Llama 3.1 8B',
    huggingFaceRepo: 'meta-llama/Llama-3.1-8B-Instruct',
    files: generateSafetensorsFiles(4),
    size: 16 * 1024 * 1024 * 1024 // ~16GB
  },
  'llama-3.3-70b': {
    name: 'Llama 3.3 70B',
    huggingFaceRepo: 'meta-llama/Llama-3.3-70B-Instruct',
    files: generateSafetensorsFiles(30),
    size: 140 * 1024 * 1024 * 1024 // ~140GB
  },
  
  // Mistral Models
  'mistral-large': {
    name: 'Mistral Large 2',
    huggingFaceRepo: 'mistralai/Mistral-Large-Instruct-2407',
    files: generateSafetensorsFiles(29),
    size: 123 * 1024 * 1024 * 1024 // ~123GB
  },
  'mistral-medium': {
    name: 'Mistral Medium',
    huggingFaceRepo: 'mistralai/Mistral-Medium-Instruct',
    files: generateSafetensorsFiles(15),
    size: 60 * 1024 * 1024 * 1024 // ~60GB (estimated)
  },
  'mistral-small': {
    name: 'Mistral Small',
    huggingFaceRepo: 'mistralai/Mistral-Small-Instruct-2409',
    files: generateSafetensorsFiles(9),
    size: 22 * 1024 * 1024 * 1024 // ~22GB
  },
  'mixtral-8x7b': {
    name: 'Mixtral 8x7B',
    huggingFaceRepo: 'mistralai/Mixtral-8x7B-Instruct-v0.1',
    files: generateSafetensorsFiles(19),
    size: 87 * 1024 * 1024 * 1024 // ~87GB
  },
  'mixtral-8x22b': {
    name: 'Mixtral 8x22B',
    huggingFaceRepo: 'mistralai/Mixtral-8x22B-Instruct-v0.1',
    files: generateSafetensorsFiles(59),
    size: 281 * 1024 * 1024 * 1024 // ~281GB
  },
  
  // Cohere Models
  'command-r-plus': {
    name: 'Command R+',
    huggingFaceRepo: 'CohereForAI/c4ai-command-r-plus',
    files: generateSafetensorsFiles(28),
    size: 104 * 1024 * 1024 * 1024 // ~104GB
  },
  'command-r': {
    name: 'Command R',
    huggingFaceRepo: 'CohereForAI/c4ai-command-r-v01',
    files: generateSafetensorsFiles(15),
    size: 70 * 1024 * 1024 * 1024 // ~70GB
  },
  
  // xAI Models
  'grok-2': {
    name: 'Grok 2',
    huggingFaceRepo: '',
    files: [],
    size: 0,
    apiOnly: true // Proprietary
  },
  'grok-1.5': {
    name: 'Grok 1.5',
    huggingFaceRepo: 'xai-org/grok-1',
    files: generateSafetensorsFiles(64),
    size: 320 * 1024 * 1024 * 1024 // ~320GB
  },
  
  // DeepSeek Models
  'deepseek-v3': {
    name: 'DeepSeek V3',
    huggingFaceRepo: 'deepseek-ai/DeepSeek-V3',
    files: generateSafetensorsFiles(61),
    size: 685 * 1024 * 1024 * 1024 // ~685GB
  },
  'deepseek-v2': {
    name: 'DeepSeek V2',
    huggingFaceRepo: 'deepseek-ai/DeepSeek-V2',
    files: generateSafetensorsFiles(47),
    size: 236 * 1024 * 1024 * 1024 // ~236GB
  },
  'deepseek-coder': {
    name: 'DeepSeek Coder',
    huggingFaceRepo: 'deepseek-ai/deepseek-coder-33b-instruct',
    files: generateSafetensorsFiles(7),
    size: 67 * 1024 * 1024 * 1024 // ~67GB
  },
  
  // Qwen Models
  'qwen-2.5-72b': {
    name: 'Qwen 2.5 72B',
    huggingFaceRepo: 'Qwen/Qwen2.5-72B-Instruct',
    files: generateSafetensorsFiles(37),
    size: 145 * 1024 * 1024 * 1024 // ~145GB
  },
  'qwen-2.5-32b': {
    name: 'Qwen 2.5 32B',
    huggingFaceRepo: 'Qwen/Qwen2.5-32B-Instruct',
    files: generateSafetensorsFiles(17),
    size: 65 * 1024 * 1024 * 1024 // ~65GB
  },
  
  // Yi Models
  'yi-34b': {
    name: 'Yi 34B',
    huggingFaceRepo: '01-ai/Yi-34B-Chat',
    files: generateSafetensorsFiles(15),
    size: 68 * 1024 * 1024 * 1024 // ~68GB
  },
  
  // Microsoft Phi Models
  'phi-3-medium': {
    name: 'Phi-3 Medium',
    huggingFaceRepo: 'microsoft/Phi-3-medium-128k-instruct',
    files: generateSafetensorsFiles(2),
    size: 14 * 1024 * 1024 * 1024 // ~14GB
  },
  'phi-3-small': {
    name: 'Phi-3 Small',
    huggingFaceRepo: 'microsoft/Phi-3-small-128k-instruct',
    files: generateSafetensorsFiles(2),
    size: 7 * 1024 * 1024 * 1024 // ~7GB
  },
  
  // NVIDIA Nemotron
  'nemotron-70b': {
    name: 'Nemotron 70B',
    huggingFaceRepo: 'nvidia/Llama-3.1-Nemotron-70B-Instruct-HF',
    files: generateSafetensorsFiles(30),
    size: 140 * 1024 * 1024 * 1024 // ~140GB
  },
  
  // Falcon
  'falcon-180b': {
    name: 'Falcon 180B',
    huggingFaceRepo: 'tiiuae/falcon-180B-chat',
    files: generateSafetensorsFiles(80),
    size: 360 * 1024 * 1024 * 1024 // ~360GB
  },
  
  // Vicuna
  'vicuna-33b': {
    name: 'Vicuna 33B',
    huggingFaceRepo: 'lmsys/vicuna-33b-v1.3',
    files: generateSafetensorsFiles(7),
    size: 66 * 1024 * 1024 * 1024 // ~66GB
  },
  
  // WizardLM
  'wizardlm-70b': {
    name: 'WizardLM 70B',
    huggingFaceRepo: 'WizardLM/WizardLM-70B-V1.0',
    files: generateSafetensorsFiles(15),
    size: 140 * 1024 * 1024 * 1024 // ~140GB
  },
  
  // Orca
  'orca-2': {
    name: 'Orca 2',
    huggingFaceRepo: 'microsoft/Orca-2-13b',
    files: generateSafetensorsFiles(3),
    size: 26 * 1024 * 1024 * 1024 // ~26GB
  },
  
  // Starling
  'starling-7b': {
    name: 'Starling 7B',
    huggingFaceRepo: 'Nexusflow/Starling-LM-7B-beta',
    files: generateSafetensorsFiles(2),
    size: 14 * 1024 * 1024 * 1024 // ~14GB
  },
  
  // Zephyr
  'zephyr-7b': {
    name: 'Zephyr 7B',
    huggingFaceRepo: 'HuggingFaceH4/zephyr-7b-beta',
    files: generateSafetensorsFiles(2),
    size: 14 * 1024 * 1024 * 1024 // ~14GB
  },
  
  // OpenHermes
  'openhermes-2.5': {
    name: 'OpenHermes 2.5',
    huggingFaceRepo: 'teknium/OpenHermes-2.5-Mistral-7B',
    files: generateSafetensorsFiles(2),
    size: 14 * 1024 * 1024 * 1024 // ~14GB
  },
  
  // Nous Hermes
  'nous-hermes-2': {
    name: 'Nous Hermes 2',
    huggingFaceRepo: 'NousResearch/Nous-Hermes-2-Mixtral-8x7B-DPO',
    files: generateSafetensorsFiles(19),
    size: 87 * 1024 * 1024 * 1024 // ~87GB
  },
  
  // Solar
  'solar-10.7b': {
    name: 'Solar 10.7B',
    huggingFaceRepo: 'upstage/SOLAR-10.7B-Instruct-v1.0',
    files: generateSafetensorsFiles(2),
    size: 21 * 1024 * 1024 * 1024 // ~21GB
  },
  
  // Dolphin
  'dolphin-2.5': {
    name: 'Dolphin 2.5',
    huggingFaceRepo: 'cognitivecomputations/dolphin-2.5-mixtral-8x7b',
    files: generateSafetensorsFiles(19),
    size: 87 * 1024 * 1024 * 1024 // ~87GB
  },
  
  // CodeLlama
  'codellama-70b': {
    name: 'CodeLlama 70B',
    huggingFaceRepo: 'codellama/CodeLlama-70b-Instruct-hf',
    files: generateSafetensorsFiles(15),
    size: 140 * 1024 * 1024 * 1024 // ~140GB
  },
  
  // Phind CodeLlama
  'phind-codellama': {
    name: 'Phind CodeLlama',
    huggingFaceRepo: 'Phind/Phind-CodeLlama-34B-v2',
    files: generateSafetensorsFiles(7),
    size: 68 * 1024 * 1024 * 1024 // ~68GB
  },
};

/**
 * Helper function to generate safetensors file list
 */
function generateSafetensorsFiles(count: number): string[] {
  const files: string[] = [];
  const paddedCount = count.toString().padStart(5, '0');
  
  for (let i = 1; i <= count; i++) {
    const paddedIndex = i.toString().padStart(5, '0');
    files.push(`model-${paddedIndex}-of-${paddedCount}.safetensors`);
  }
  
  // Add config files
  files.push('tokenizer.json', 'tokenizer_config.json', 'config.json', 'generation_config.json');
  
  return files;
}

/**
 * Stream a single model file from Hugging Face into the ZIP archive
 */
export async function streamModelFileToZip(
  archive: archiver.Archiver,
  repo: string,
  filename: string,
  onProgress?: (bytes: number) => void
): Promise<void> {
  const url = `https://huggingface.co/${repo}/resolve/main/${filename}`;
  
  try {
    const response = await axios({
      method: 'GET',
      url,
      responseType: 'stream',
      headers: {
        'User-Agent': 'ALE-Forge/1.0'
      },
      timeout: 0 // No timeout for large files
    });

    let downloadedBytes = 0;
    
    response.data.on('data', (chunk: Buffer) => {
      downloadedBytes += chunk.length;
      if (onProgress) {
        onProgress(downloadedBytes);
      }
    });

    // Add the stream directly to the archive
    archive.append(response.data, { name: `models/${repo}/${filename}` });
    
    // Wait for the stream to finish
    await new Promise((resolve, reject) => {
      response.data.on('end', resolve);
      response.data.on('error', reject);
    });
    
  } catch (error) {
    console.error(`Failed to download ${filename} from ${repo}:`, error);
    throw error;
  }
}

/**
 * Download all files for a specific model and add them to the ZIP archive
 */
export async function downloadModelWeights(
  archive: archiver.Archiver,
  modelKey: string,
  onProgress?: (modelName: string, fileIndex: number, totalFiles: number, bytes: number) => void
): Promise<void> {
  const config = MODEL_CONFIGS[modelKey];
  
  if (!config) {
    throw new Error(`Model ${modelKey} not found in MODEL_CONFIGS`);
  }
  
  if (config.apiOnly) {
    throw new Error(`Model ${config.name} is API-only and cannot be downloaded. Use GPT/Claude/Gemini via API instead.`);
  }

  console.log(`Starting download of ${config.name} (${config.files.length} files, ~${(config.size / 1024 / 1024 / 1024).toFixed(2)}GB)`);

  for (let i = 0; i < config.files.length; i++) {
    const filename = config.files[i];
    console.log(`Downloading file ${i + 1}/${config.files.length}: ${filename}`);
    
    await streamModelFileToZip(
      archive,
      config.huggingFaceRepo,
      filename,
      (bytes) => {
        if (onProgress) {
          onProgress(config.name, i + 1, config.files.length, bytes);
        }
      }
    );
  }

  console.log(`Completed download of ${config.name}`);
}

/**
 * Get the currently selected model from session or default
 */
export function getCurrentModelKey(sessionModel?: string): string {
  // Default to a smaller model for testing
  return sessionModel?.toLowerCase().replace(/\s+/g, '-') || 'llama-3.1-8b';
}

/**
 * Estimate total download size for a model
 */
export function getModelSize(modelKey: string): number {
  const config = MODEL_CONFIGS[modelKey];
  return config ? config.size : 0;
}

/**
 * Check if model is API-only (cannot be downloaded)
 */
export function isApiOnlyModel(modelKey: string): boolean {
  const config = MODEL_CONFIGS[modelKey];
  return config ? (config.apiOnly || false) : false;
}

/**
 * Format bytes to human-readable size
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Get list of all downloadable models (exclude API-only)
 */
export function getDownloadableModels(): Array<{key: string, name: string, size: string}> {
  return Object.entries(MODEL_CONFIGS)
    .filter(([_, config]) => !config.apiOnly)
    .map(([key, config]) => ({
      key,
      name: config.name,
      size: formatBytes(config.size)
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}
