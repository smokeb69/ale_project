/**
 * ALE IDE Builder - File Operations through Forge LLM
 * Provides IDE-like functionality for creating, editing, and managing files
 */

import * as fs from "fs";
import * as path from "path";
import { orchestratorInvoke, TaskHandlers } from "./orchestrator";
import { getBestModelForTask } from "./llm";

// IDE workspace configuration
interface WorkspaceConfig {
  rootPath: string;
  allowedExtensions: string[];
  maxFileSize: number; // bytes
  autoSave: boolean;
  formatOnSave: boolean;
}

// File operation types
type FileOperation = "create" | "read" | "update" | "delete" | "rename" | "move" | "copy" | "list" | "search";

// File metadata
interface FileInfo {
  name: string;
  path: string;
  relativePath: string;
  extension: string;
  size: number;
  isDirectory: boolean;
  createdAt: Date;
  modifiedAt: Date;
  content?: string;
}

// Operation result
interface OperationResult {
  success: boolean;
  operation: FileOperation;
  path: string;
  message: string;
  data?: any;
  error?: string;
}

// Default workspace config - MAXED OUT
const DEFAULT_WORKSPACE_CONFIG: WorkspaceConfig = {
  rootPath: process.cwd(),
  allowedExtensions: ["*"], // All extensions allowed
  maxFileSize: 100 * 1024 * 1024, // 100MB
  autoSave: true,
  formatOnSave: true,
};

// Current workspace state
let workspaceConfig = { ...DEFAULT_WORKSPACE_CONFIG };
const openFiles = new Map<string, { content: string; modified: boolean; language: string }>();

/**
 * Initialize workspace
 */
export function initWorkspace(config: Partial<WorkspaceConfig> = {}): WorkspaceConfig {
  workspaceConfig = { ...DEFAULT_WORKSPACE_CONFIG, ...config };
  
  // Ensure root path exists
  if (!fs.existsSync(workspaceConfig.rootPath)) {
    fs.mkdirSync(workspaceConfig.rootPath, { recursive: true });
  }
  
  console.log(`[IDE] Workspace initialized at: ${workspaceConfig.rootPath}`);
  return workspaceConfig;
}

/**
 * Get file language from extension
 */
function getLanguageFromExtension(ext: string): string {
  const languageMap: Record<string, string> = {
    ".ts": "typescript",
    ".tsx": "typescript",
    ".js": "javascript",
    ".jsx": "javascript",
    ".py": "python",
    ".rb": "ruby",
    ".go": "go",
    ".rs": "rust",
    ".java": "java",
    ".c": "c",
    ".cpp": "cpp",
    ".h": "c",
    ".hpp": "cpp",
    ".cs": "csharp",
    ".php": "php",
    ".swift": "swift",
    ".kt": "kotlin",
    ".scala": "scala",
    ".r": "r",
    ".sql": "sql",
    ".html": "html",
    ".css": "css",
    ".scss": "scss",
    ".less": "less",
    ".json": "json",
    ".xml": "xml",
    ".yaml": "yaml",
    ".yml": "yaml",
    ".md": "markdown",
    ".sh": "bash",
    ".bash": "bash",
    ".zsh": "zsh",
    ".ps1": "powershell",
    ".bat": "batch",
    ".dockerfile": "dockerfile",
    ".env": "dotenv",
    ".gitignore": "gitignore",
    ".toml": "toml",
    ".ini": "ini",
    ".cfg": "ini",
  };
  
  return languageMap[ext.toLowerCase()] || "plaintext";
}

/**
 * Resolve path relative to workspace
 */
function resolvePath(filePath: string): string {
  if (path.isAbsolute(filePath)) {
    return filePath;
  }
  return path.join(workspaceConfig.rootPath, filePath);
}

/**
 * Get file info
 */
export function getFileInfo(filePath: string): FileInfo | null {
  const fullPath = resolvePath(filePath);
  
  try {
    const stats = fs.statSync(fullPath);
    const ext = path.extname(fullPath);
    
    return {
      name: path.basename(fullPath),
      path: fullPath,
      relativePath: path.relative(workspaceConfig.rootPath, fullPath),
      extension: ext,
      size: stats.size,
      isDirectory: stats.isDirectory(),
      createdAt: stats.birthtime,
      modifiedAt: stats.mtime,
    };
  } catch {
    return null;
  }
}

/**
 * Create a new file
 */
export async function createFile(
  filePath: string, 
  content: string = "", 
  options: { overwrite?: boolean; generateContent?: boolean; description?: string } = {}
): Promise<OperationResult> {
  const fullPath = resolvePath(filePath);
  
  try {
    // Check if file exists
    if (fs.existsSync(fullPath) && !options.overwrite) {
      return {
        success: false,
        operation: "create",
        path: fullPath,
        message: "File already exists",
        error: "File already exists. Use overwrite option to replace.",
      };
    }
    
    // Generate content using LLM if requested
    let finalContent = content;
    if (options.generateContent && options.description) {
      const ext = path.extname(filePath);
      const language = getLanguageFromExtension(ext);
      
      console.log(`[IDE] Generating content for ${filePath} using LLM`);
      
      finalContent = await TaskHandlers.generateCode(
        `Create a ${language} file with the following requirements:\n${options.description}\n\nFile name: ${path.basename(filePath)}`,
        language
      );
    }
    
    // Ensure directory exists
    const dir = path.dirname(fullPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    // Write file
    fs.writeFileSync(fullPath, finalContent, "utf-8");
    
    // Track in open files
    const ext = path.extname(filePath);
    openFiles.set(fullPath, {
      content: finalContent,
      modified: false,
      language: getLanguageFromExtension(ext),
    });
    
    console.log(`[IDE] Created file: ${fullPath}`);
    
    return {
      success: true,
      operation: "create",
      path: fullPath,
      message: "File created successfully",
      data: { size: finalContent.length, language: getLanguageFromExtension(ext) },
    };
    
  } catch (error: any) {
    return {
      success: false,
      operation: "create",
      path: fullPath,
      message: "Failed to create file",
      error: error.message,
    };
  }
}

/**
 * Read a file
 */
export async function readFile(filePath: string): Promise<OperationResult> {
  const fullPath = resolvePath(filePath);
  
  try {
    if (!fs.existsSync(fullPath)) {
      return {
        success: false,
        operation: "read",
        path: fullPath,
        message: "File not found",
        error: "The specified file does not exist.",
      };
    }
    
    const stats = fs.statSync(fullPath);
    
    if (stats.isDirectory()) {
      return {
        success: false,
        operation: "read",
        path: fullPath,
        message: "Cannot read directory",
        error: "The specified path is a directory, not a file.",
      };
    }
    
    if (stats.size > workspaceConfig.maxFileSize) {
      return {
        success: false,
        operation: "read",
        path: fullPath,
        message: "File too large",
        error: `File size (${stats.size} bytes) exceeds maximum allowed size (${workspaceConfig.maxFileSize} bytes).`,
      };
    }
    
    const content = fs.readFileSync(fullPath, "utf-8");
    const ext = path.extname(filePath);
    
    // Track in open files
    openFiles.set(fullPath, {
      content,
      modified: false,
      language: getLanguageFromExtension(ext),
    });
    
    return {
      success: true,
      operation: "read",
      path: fullPath,
      message: "File read successfully",
      data: {
        content,
        size: stats.size,
        language: getLanguageFromExtension(ext),
        lines: content.split("\n").length,
      },
    };
    
  } catch (error: any) {
    return {
      success: false,
      operation: "read",
      path: fullPath,
      message: "Failed to read file",
      error: error.message,
    };
  }
}

/**
 * Update a file
 */
export async function updateFile(
  filePath: string, 
  content: string,
  options: { createIfNotExists?: boolean; append?: boolean; enhanceWithLLM?: boolean; instructions?: string } = {}
): Promise<OperationResult> {
  const fullPath = resolvePath(filePath);
  
  try {
    // Check if file exists
    if (!fs.existsSync(fullPath)) {
      if (options.createIfNotExists) {
        return createFile(filePath, content);
      }
      return {
        success: false,
        operation: "update",
        path: fullPath,
        message: "File not found",
        error: "The specified file does not exist.",
      };
    }
    
    let finalContent = content;
    
    // Enhance content with LLM if requested
    if (options.enhanceWithLLM && options.instructions) {
      const existingContent = fs.readFileSync(fullPath, "utf-8");
      const ext = path.extname(filePath);
      const language = getLanguageFromExtension(ext);
      
      console.log(`[IDE] Enhancing file ${filePath} using LLM`);
      
      const result = await orchestratorInvoke({
        messages: [
          {
            role: "system",
            content: `You are a code editor assistant. Modify the following ${language} code according to the instructions. Output only the modified code, no explanations.`,
          },
          {
            role: "user",
            content: `Current code:\n\`\`\`${language}\n${existingContent}\n\`\`\`\n\nInstructions: ${options.instructions}\n\nNew content to integrate:\n\`\`\`${language}\n${content}\n\`\`\``,
          },
        ],
        model: getBestModelForTask("coding"),
        enableThinking: true,
      });
      
      finalContent = typeof result.choices[0]?.message?.content === "string"
        ? result.choices[0].message.content
        : content;
      
      // Clean up code blocks if present
      finalContent = finalContent.replace(/^```[\w]*\n?/, "").replace(/\n?```$/, "");
    }
    
    // Append or replace
    if (options.append) {
      const existingContent = fs.readFileSync(fullPath, "utf-8");
      finalContent = existingContent + "\n" + finalContent;
    }
    
    // Write file
    fs.writeFileSync(fullPath, finalContent, "utf-8");
    
    // Update open files
    const ext = path.extname(filePath);
    openFiles.set(fullPath, {
      content: finalContent,
      modified: false,
      language: getLanguageFromExtension(ext),
    });
    
    console.log(`[IDE] Updated file: ${fullPath}`);
    
    return {
      success: true,
      operation: "update",
      path: fullPath,
      message: "File updated successfully",
      data: { size: finalContent.length },
    };
    
  } catch (error: any) {
    return {
      success: false,
      operation: "update",
      path: fullPath,
      message: "Failed to update file",
      error: error.message,
    };
  }
}

/**
 * Delete a file
 */
export async function deleteFile(filePath: string, options: { recursive?: boolean } = {}): Promise<OperationResult> {
  const fullPath = resolvePath(filePath);
  
  try {
    if (!fs.existsSync(fullPath)) {
      return {
        success: false,
        operation: "delete",
        path: fullPath,
        message: "File not found",
        error: "The specified file does not exist.",
      };
    }
    
    const stats = fs.statSync(fullPath);
    
    if (stats.isDirectory()) {
      if (options.recursive) {
        fs.rmSync(fullPath, { recursive: true });
      } else {
        fs.rmdirSync(fullPath);
      }
    } else {
      fs.unlinkSync(fullPath);
    }
    
    // Remove from open files
    openFiles.delete(fullPath);
    
    console.log(`[IDE] Deleted: ${fullPath}`);
    
    return {
      success: true,
      operation: "delete",
      path: fullPath,
      message: "File deleted successfully",
    };
    
  } catch (error: any) {
    return {
      success: false,
      operation: "delete",
      path: fullPath,
      message: "Failed to delete file",
      error: error.message,
    };
  }
}

/**
 * List files in directory
 */
export async function listFiles(
  dirPath: string = ".", 
  options: { recursive?: boolean; pattern?: string; includeHidden?: boolean } = {}
): Promise<OperationResult> {
  const fullPath = resolvePath(dirPath);
  
  try {
    if (!fs.existsSync(fullPath)) {
      return {
        success: false,
        operation: "list",
        path: fullPath,
        message: "Directory not found",
        error: "The specified directory does not exist.",
      };
    }
    
    const files: FileInfo[] = [];
    
    function scanDir(dir: string, depth: number = 0) {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        // Skip hidden files unless requested
        if (!options.includeHidden && entry.name.startsWith(".")) {
          continue;
        }
        
        const entryPath = path.join(dir, entry.name);
        const stats = fs.statSync(entryPath);
        const ext = path.extname(entry.name);
        
        // Apply pattern filter
        if (options.pattern) {
          const regex = new RegExp(options.pattern.replace(/\*/g, ".*"));
          if (!regex.test(entry.name)) {
            continue;
          }
        }
        
        files.push({
          name: entry.name,
          path: entryPath,
          relativePath: path.relative(workspaceConfig.rootPath, entryPath),
          extension: ext,
          size: stats.size,
          isDirectory: entry.isDirectory(),
          createdAt: stats.birthtime,
          modifiedAt: stats.mtime,
        });
        
        // Recurse into directories
        if (entry.isDirectory() && options.recursive) {
          scanDir(entryPath, depth + 1);
        }
      }
    }
    
    scanDir(fullPath);
    
    return {
      success: true,
      operation: "list",
      path: fullPath,
      message: `Found ${files.length} items`,
      data: { files, count: files.length },
    };
    
  } catch (error: any) {
    return {
      success: false,
      operation: "list",
      path: fullPath,
      message: "Failed to list files",
      error: error.message,
    };
  }
}

/**
 * Search files for content
 */
export async function searchFiles(
  query: string,
  options: { path?: string; filePattern?: string; caseSensitive?: boolean; regex?: boolean } = {}
): Promise<OperationResult> {
  const searchPath = resolvePath(options.path || ".");
  
  try {
    const results: Array<{ file: string; line: number; content: string; match: string }> = [];
    
    const listResult = await listFiles(searchPath, { recursive: true, pattern: options.filePattern });
    
    if (!listResult.success || !listResult.data?.files) {
      return listResult;
    }
    
    const searchRegex = options.regex 
      ? new RegExp(query, options.caseSensitive ? "g" : "gi")
      : new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), options.caseSensitive ? "g" : "gi");
    
    for (const file of listResult.data.files) {
      if (file.isDirectory) continue;
      
      try {
        const content = fs.readFileSync(file.path, "utf-8");
        const lines = content.split("\n");
        
        lines.forEach((line, index) => {
          const matches = line.match(searchRegex);
          if (matches) {
            results.push({
              file: file.relativePath,
              line: index + 1,
              content: line.trim(),
              match: matches[0],
            });
          }
        });
      } catch {
        // Skip files that can't be read
      }
    }
    
    return {
      success: true,
      operation: "search",
      path: searchPath,
      message: `Found ${results.length} matches`,
      data: { results, count: results.length },
    };
    
  } catch (error: any) {
    return {
      success: false,
      operation: "search",
      path: searchPath,
      message: "Search failed",
      error: error.message,
    };
  }
}

/**
 * Generate code using LLM
 */
export async function generateCode(
  description: string,
  options: { language?: string; framework?: string; outputPath?: string } = {}
): Promise<OperationResult> {
  try {
    const language = options.language || "typescript";
    
    console.log(`[IDE] Generating ${language} code from description`);
    
    let prompt = description;
    if (options.framework) {
      prompt += `\n\nUse the ${options.framework} framework.`;
    }
    
    const code = await TaskHandlers.generateCode(prompt, language);
    
    // Save to file if path specified
    if (options.outputPath) {
      const result = await createFile(options.outputPath, code, { overwrite: true });
      return {
        ...result,
        data: { ...result.data, code },
      };
    }
    
    return {
      success: true,
      operation: "create",
      path: options.outputPath || "",
      message: "Code generated successfully",
      data: { code, language },
    };
    
  } catch (error: any) {
    return {
      success: false,
      operation: "create",
      path: options.outputPath || "",
      message: "Failed to generate code",
      error: error.message,
    };
  }
}

/**
 * Refactor code using LLM
 */
export async function refactorCode(
  filePath: string,
  instructions: string
): Promise<OperationResult> {
  try {
    const readResult = await readFile(filePath);
    
    if (!readResult.success) {
      return readResult;
    }
    
    const content = readResult.data.content;
    const language = readResult.data.language;
    
    console.log(`[IDE] Refactoring ${filePath}`);
    
    const result = await orchestratorInvoke({
      messages: [
        {
          role: "system",
          content: `You are an expert code refactoring assistant. Refactor the following ${language} code according to the instructions. Output only the refactored code, no explanations.`,
        },
        {
          role: "user",
          content: `Code:\n\`\`\`${language}\n${content}\n\`\`\`\n\nRefactoring instructions: ${instructions}`,
        },
      ],
      model: getBestModelForTask("coding"),
      enableThinking: true,
      thinkingBudget: 8192,
    });
    
    let refactoredCode = typeof result.choices[0]?.message?.content === "string"
      ? result.choices[0].message.content
      : content;
    
    // Clean up code blocks
    refactoredCode = refactoredCode.replace(/^```[\w]*\n?/, "").replace(/\n?```$/, "");
    
    // Update file
    return updateFile(filePath, refactoredCode);
    
  } catch (error: any) {
    return {
      success: false,
      operation: "update",
      path: filePath,
      message: "Failed to refactor code",
      error: error.message,
    };
  }
}

/**
 * Explain code using LLM
 */
export async function explainCode(filePath: string): Promise<OperationResult> {
  try {
    const readResult = await readFile(filePath);
    
    if (!readResult.success) {
      return readResult;
    }
    
    const content = readResult.data.content;
    const language = readResult.data.language;
    
    console.log(`[IDE] Explaining ${filePath}`);
    
    const result = await orchestratorInvoke({
      messages: [
        {
          role: "system",
          content: "You are a code explanation assistant. Provide a clear, detailed explanation of the code.",
        },
        {
          role: "user",
          content: `Explain this ${language} code:\n\`\`\`${language}\n${content}\n\`\`\``,
        },
      ],
      model: getBestModelForTask("analysis"),
      enableThinking: true,
    });
    
    const explanation = typeof result.choices[0]?.message?.content === "string"
      ? result.choices[0].message.content
      : "Unable to generate explanation";
    
    return {
      success: true,
      operation: "read",
      path: filePath,
      message: "Code explained successfully",
      data: { explanation, language },
    };
    
  } catch (error: any) {
    return {
      success: false,
      operation: "read",
      path: filePath,
      message: "Failed to explain code",
      error: error.message,
    };
  }
}

/**
 * Get open files
 */
export function getOpenFiles(): Map<string, { content: string; modified: boolean; language: string }> {
  return new Map(openFiles);
}

/**
 * Close file
 */
export function closeFile(filePath: string): boolean {
  const fullPath = resolvePath(filePath);
  return openFiles.delete(fullPath);
}

/**
 * Get workspace config
 */
export function getWorkspaceConfig(): WorkspaceConfig {
  return { ...workspaceConfig };
}

// Export types
export type { WorkspaceConfig, FileOperation, FileInfo, OperationResult };
