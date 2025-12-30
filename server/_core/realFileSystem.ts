/**
 * Real File System Manager
 * Creates actual files in the system, not simulated
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync, spawn } from 'child_process';

export interface FileCreationResult {
  success: boolean;
  path: string;
  content: string;
  timestamp: string;
  executable: boolean;
  error?: string;
}

export interface ExecutionResult {
  success: boolean;
  stdout: string;
  stderr: string;
  exitCode: number;
  timestamp: string;
  duration: number;
}

class RealFileSystem {
  private baseDir: string = '/home/ubuntu/ale_project';
  private webDir: string = '/home/ubuntu/ale_project/client/public';
  private systemDir: string = '/home/ubuntu';
  
  constructor() {
    this.ensureDirectories();
  }
  
  /**
   * Ensure all required directories exist
   */
  private ensureDirectories(): void {
    const dirs = [
      path.join(this.baseDir, 'generated_files'),
      path.join(this.baseDir, 'executed_scripts'),
      path.join(this.webDir, 'generated'),
      path.join(this.systemDir, 'ale_generated'),
    ];
    
    for (const dir of dirs) {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    }
  }
  
  /**
   * Create a real file in the system
   */
  createFile(
    filename: string,
    content: string,
    location: 'project' | 'web' | 'system' = 'project',
    executable: boolean = false
  ): FileCreationResult {
    try {
      let targetDir: string;
      
      switch (location) {
        case 'web':
          targetDir = path.join(this.webDir, 'generated');
          break;
        case 'system':
          targetDir = path.join(this.systemDir, 'ale_generated');
          break;
        case 'project':
        default:
          targetDir = path.join(this.baseDir, 'generated_files');
          break;
      }
      
      const filePath = path.join(targetDir, filename);
      
      // Write file
      fs.writeFileSync(filePath, content, 'utf8');
      
      // Make executable if needed
      if (executable) {
        fs.chmodSync(filePath, 0o755);
      }
      
      return {
        success: true,
        path: filePath,
        content,
        timestamp: new Date().toISOString(),
        executable,
      };
    } catch (error) {
      return {
        success: false,
        path: '',
        content,
        timestamp: new Date().toISOString(),
        executable,
        error: String(error),
      };
    }
  }
  
  /**
   * Execute a real file
   */
  executeFile(filePath: string, args: string[] = []): Promise<ExecutionResult> {
    return new Promise((resolve) => {
      const startTime = Date.now();
      
      try {
        const process = spawn('bash', [filePath, ...args], {
          cwd: path.dirname(filePath),
          timeout: 30000,
        });
        
        let stdout = '';
        let stderr = '';
        
        process.stdout.on('data', (data) => {
          stdout += data.toString();
        });
        
        process.stderr.on('data', (data) => {
          stderr += data.toString();
        });
        
        process.on('close', (code) => {
          const duration = Date.now() - startTime;
          resolve({
            success: code === 0,
            stdout,
            stderr,
            exitCode: code || 0,
            timestamp: new Date().toISOString(),
            duration,
          });
        });
        
        process.on('error', (error) => {
          const duration = Date.now() - startTime;
          resolve({
            success: false,
            stdout,
            stderr: error.message,
            exitCode: 1,
            timestamp: new Date().toISOString(),
            duration,
          });
        });
      } catch (error) {
        const duration = Date.now() - startTime;
        resolve({
          success: false,
          stdout: '',
          stderr: String(error),
          exitCode: 1,
          timestamp: new Date().toISOString(),
          duration,
        });
      }
    });
  }
  
  /**
   * Execute command directly (no file)
   */
  executeCommand(command: string): ExecutionResult {
    const startTime = Date.now();
    
    try {
      const stdout = execSync(command, { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 });
      const duration = Date.now() - startTime;
      
      return {
        success: true,
        stdout,
        stderr: '',
        exitCode: 0,
        timestamp: new Date().toISOString(),
        duration,
      };
    } catch (error: any) {
      const duration = Date.now() - startTime;
      
      return {
        success: false,
        stdout: error.stdout ? error.stdout.toString() : '',
        stderr: error.stderr ? error.stderr.toString() : error.message,
        exitCode: error.status || 1,
        timestamp: new Date().toISOString(),
        duration,
      };
    }
  }
  
  /**
   * Create and execute a Python script
   */
  async createAndExecutePython(
    scriptName: string,
    pythonCode: string,
    location: 'project' | 'web' | 'system' = 'project'
  ): Promise<ExecutionResult> {
    // Create the file
    const result = this.createFile(scriptName, pythonCode, location, true);
    
    if (!result.success) {
      return {
        success: false,
        stdout: '',
        stderr: result.error || 'Failed to create file',
        exitCode: 1,
        timestamp: new Date().toISOString(),
        duration: 0,
      };
    }
    
    // Execute it
    return this.executeFile(result.path);
  }
  
  /**
   * Create and execute a Bash script
   */
  async createAndExecuteBash(
    scriptName: string,
    bashCode: string,
    location: 'project' | 'web' | 'system' = 'project'
  ): Promise<ExecutionResult> {
    // Add shebang if not present
    const code = bashCode.startsWith('#!/') ? bashCode : `#!/bin/bash\n${bashCode}`;
    
    // Create the file
    const result = this.createFile(scriptName, code, location, true);
    
    if (!result.success) {
      return {
        success: false,
        stdout: '',
        stderr: result.error || 'Failed to create file',
        exitCode: 1,
        timestamp: new Date().toISOString(),
        duration: 0,
      };
    }
    
    // Execute it
    return this.executeFile(result.path);
  }
  
  /**
   * Read a real file
   */
  readFile(filePath: string): string | null {
    try {
      return fs.readFileSync(filePath, 'utf8');
    } catch (error) {
      return null;
    }
  }
  
  /**
   * List files in directory
   */
  listFiles(dirPath: string): string[] {
    try {
      return fs.readdirSync(dirPath);
    } catch (error) {
      return [];
    }
  }
  
  /**
   * Delete a file
   */
  deleteFile(filePath: string): boolean {
    try {
      fs.unlinkSync(filePath);
      return true;
    } catch (error) {
      return false;
    }
  }
  
  /**
   * Get file info
   */
  getFileInfo(filePath: string): any {
    try {
      const stats = fs.statSync(filePath);
      return {
        size: stats.size,
        created: stats.birthtime,
        modified: stats.mtime,
        isFile: stats.isFile(),
        isDirectory: stats.isDirectory(),
        isExecutable: (stats.mode & 0o111) !== 0,
      };
    } catch (error) {
      return null;
    }
  }
}

export const realFileSystem = new RealFileSystem();
