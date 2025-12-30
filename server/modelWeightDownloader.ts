import axios from 'axios';
import { createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';
import archiver from 'archiver';

/**
 * Model Weight Downloader
 * Streams large model files (10GB-100GB+) from Hugging Face into ZIP archive
 * without loading entire files into memory
 */

interface ModelConfig {
  name: string;
  huggingFaceRepo: string;
  files: string[]; // List of files to download (model.safetensors, tokenizer.json, etc.)
  size: number; // Estimated size in bytes
}

// Map of available models to their Hugging Face repositories
export const MODEL_CONFIGS: Record<string, ModelConfig> = {
  'gpt-4.1-mini': {
    name: 'GPT-4.1 Mini',
    huggingFaceRepo: 'openai-community/gpt-4.1-mini', // Placeholder - OpenAI models not on HF
    files: [],
    size: 0
  },
  'llama-3.3-70b': {
    name: 'Llama 3.3 70B',
    huggingFaceRepo: 'meta-llama/Llama-3.3-70B-Instruct',
    files: [
      'model-00001-of-00030.safetensors',
      'model-00002-of-00030.safetensors',
      // ... (30 files total for 70B model)
      'tokenizer.json',
      'tokenizer_config.json',
      'config.json',
      'generation_config.json'
    ],
    size: 140 * 1024 * 1024 * 1024 // ~140GB
  },
  'mistral-large-2': {
    name: 'Mistral Large 2',
    huggingFaceRepo: 'mistralai/Mistral-Large-Instruct-2407',
    files: [
      'model-00001-of-00029.safetensors',
      'model-00002-of-00029.safetensors',
      // ... (29 files total)
      'tokenizer.json',
      'tokenizer_config.json',
      'config.json'
    ],
    size: 123 * 1024 * 1024 * 1024 // ~123GB
  },
  'deepseek-v3': {
    name: 'DeepSeek V3',
    huggingFaceRepo: 'deepseek-ai/DeepSeek-V3',
    files: [
      'model-00001-of-00061.safetensors',
      // ... (61 files total for 671B model)
      'tokenizer.json',
      'config.json'
    ],
    size: 685 * 1024 * 1024 * 1024 // ~685GB
  },
  'qwen-2.5-72b': {
    name: 'Qwen 2.5 72B',
    huggingFaceRepo: 'Qwen/Qwen2.5-72B-Instruct',
    files: [
      'model-00001-of-00037.safetensors',
      'model-00002-of-00037.safetensors',
      // ... (37 files total)
      'tokenizer.json',
      'tokenizer_config.json',
      'config.json'
    ],
    size: 145 * 1024 * 1024 * 1024 // ~145GB
  }
};

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
  return sessionModel?.toLowerCase().replace(/\s+/g, '-') || 'llama-3.3-70b';
}

/**
 * Estimate total download size for a model
 */
export function getModelSize(modelKey: string): number {
  const config = MODEL_CONFIGS[modelKey];
  return config ? config.size : 0;
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
