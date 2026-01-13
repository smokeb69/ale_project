/**
 * Cross-Platform Terminal Manager
 * Supports multi-terminal execution on Windows, Linux, and macOS
 */

import { spawn, exec, ChildProcess } from 'child_process';
import { nanoid } from 'nanoid';
import * as os from 'os';
import * as path from 'path';

export interface TerminalSession {
  id: string;
  platform: 'windows' | 'linux' | 'macos' | 'unknown';
  shell: string;
  cwd: string;
  env: Record<string, string>;
  process?: ChildProcess;
  commandHistory: Array<{ 
    command: string; 
    output: string; 
    exitCode: number;
    timestamp: number;
    duration: number;
  }>;
  createdAt: string;
  targetHost?: string;
}

export interface ExecutionOptions {
  timeout?: number;
  maxBuffer?: number;
  interactive?: boolean;
  streamOutput?: boolean;
}

export interface CommandResult {
  output: string;
  exitCode: number;
  duration: number;
  timestamp: number;
}

class CrossPlatformTerminalManager {
  private sessions: Map<string, TerminalSession> = new Map();
  private platform: 'windows' | 'linux' | 'macos' | 'unknown';
  private defaultShell: string;
  
  constructor() {
    this.platform = this.detectPlatform();
    this.defaultShell = this.getDefaultShell();
    console.log(`Cross-platform terminal manager initialized for ${this.platform}`);
  }
  
  /**
   * Detect operating system platform
   */
  private detectPlatform(): 'windows' | 'linux' | 'macos' | 'unknown' {
    const platform = os.platform();
    switch (platform) {
      case 'win32':
        return 'windows';
      case 'linux':
        return 'linux';
      case 'darwin':
        return 'macos';
      default:
        return 'unknown';
    }
  }
  
  /**
   * Get default shell for platform
   */
  private getDefaultShell(): string {
    switch (this.platform) {
      case 'windows':
        // Check for PowerShell 7, PowerShell 5, then fallback to cmd
        if (process.env.PROGRAMFILES) {
          const pwsh7 = path.join(process.env.PROGRAMFILES, 'PowerShell', '7', 'pwsh.exe');
          const pwsh5 = path.join(process.env.SYSTEMROOT || 'C:\\Windows', 'System32', 'WindowsPowerShell', 'v1.0', 'powershell.exe');
          return 'powershell.exe'; // Default to PowerShell in PATH
        }
        return 'cmd.exe';
      case 'linux':
        return process.env.SHELL || '/bin/bash';
      case 'macos':
        return process.env.SHELL || '/bin/zsh';
      default:
        return '/bin/sh';
    }
  }
  
  /**
   * Create a new terminal session
   */
  createSession(targetHost?: string, customShell?: string): string {
    const id = nanoid(12);
    const cwd = process.cwd();
    
    const env: Record<string, string> = {
      ...process.env as Record<string, string>,
      TERM: 'xterm-256color',
      FORCE_COLOR: '1',
    };
    
    // Platform-specific environment setup
    if (this.platform === 'windows') {
      env.PATHEXT = '.COM;.EXE;.BAT;.CMD;.VBS;.VBE;.JS;.JSE;.WSF;.WSH;.MSC;.PY';
    }
    
    const session: TerminalSession = {
      id,
      platform: this.platform,
      shell: customShell || this.defaultShell,
      cwd,
      env,
      commandHistory: [],
      createdAt: new Date().toISOString(),
      targetHost,
    };
    
    this.sessions.set(id, session);
    console.log(`Created terminal session ${id} on ${this.platform} targeting ${targetHost || 'local'}`);
    
    return id;
  }
  
  /**
   * Execute command in session
   */
  async executeCommand(
    sessionId: string, 
    command: string, 
    options: ExecutionOptions = {}
  ): Promise<CommandResult> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }
    
    const startTime = Date.now();
    const timeout = options.timeout || 60000; // 60 second default
    const maxBuffer = options.maxBuffer || 10 * 1024 * 1024; // 10MB
    
    // Normalize command for platform
    const normalizedCommand = this.normalizeCommand(command, session.platform);
    
    return new Promise((resolve) => {
      const execOptions = {
        cwd: session.cwd,
        env: session.env,
        timeout,
        maxBuffer,
        shell: session.shell,
        windowsHide: true,
      };
      
      exec(normalizedCommand, execOptions, (error, stdout, stderr) => {
        const duration = Date.now() - startTime;
        let output = '';
        let exitCode = 0;
        
        // Combine output
        if (stdout) output += stdout;
        if (stderr && stderr.trim()) {
          const filteredStderr = this.filterStderr(stderr);
          if (filteredStderr) {
            output += (output ? '\n' : '') + filteredStderr;
          }
        }
        
        if (error) {
          exitCode = error.code || 1;
          if (!output) {
            output = error.message;
          }
        }
        
        const result: CommandResult = {
          output: output || '[Command executed successfully]',
          exitCode,
          duration,
          timestamp: startTime,
        };
        
        // Store in history
        session.commandHistory.push({
          command: normalizedCommand,
          output: result.output,
          exitCode,
          timestamp: startTime,
          duration,
        });
        
        // Keep only last 1000 commands
        if (session.commandHistory.length > 1000) {
          session.commandHistory.shift();
        }
        
        resolve(result);
      });
    });
  }
  
  /**
   * Normalize command for platform
   */
  private normalizeCommand(command: string, platform: string): string {
    // Remove extra whitespace
    let normalized = command.trim();
    
    if (platform === 'windows') {
      // Convert Unix-style path separators to Windows
      // normalized = normalized.replace(/\//g, '\\');
      
      // Handle command chaining - use & or && for Windows
      normalized = normalized.replace(/;\s*/g, ' && ');
      
      // Convert common Unix commands to Windows equivalents
      const cmdMap: Record<string, string> = {
        'ls': 'dir',
        'cat': 'type',
        'rm': 'del',
        'cp': 'copy',
        'mv': 'move',
        'pwd': 'cd',
        'clear': 'cls',
        'ps aux': 'tasklist',
        'kill': 'taskkill /PID',
        'which': 'where',
      };
      
      // Only replace if command starts with these (exact match)
      for (const [unixCmd, winCmd] of Object.entries(cmdMap)) {
        const regex = new RegExp(`^${unixCmd}\\b`, 'i');
        if (regex.test(normalized)) {
          normalized = normalized.replace(regex, winCmd);
          break;
        }
      }
    } else {
      // Unix-like systems: handle multiline commands
      normalized = normalized
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0 && !line.startsWith('#'))
        .join(' && ');
    }
    
    return normalized;
  }
  
  /**
   * Filter stderr to remove noise
   */
  private filterStderr(stderr: string): string {
    const lines = stderr.split('\n');
    const filtered = lines.filter(line => {
      const trimmed = line.trim();
      if (!trimmed) return false;
      
      // Filter common warnings
      const ignorePatterns = [
        /deprecated/i,
        /warning:/i,
        /notice:/i,
        /npm warn/i,
        /^>\s/,
      ];
      
      return !ignorePatterns.some(pattern => pattern.test(trimmed));
    });
    
    return filtered.join('\n');
  }
  
  /**
   * Execute multiple commands sequentially
   */
  async executeSequence(
    sessionId: string,
    commands: string[],
    options: ExecutionOptions = {}
  ): Promise<CommandResult[]> {
    const results: CommandResult[] = [];
    
    for (const command of commands) {
      const result = await this.executeCommand(sessionId, command, options);
      results.push(result);
      
      // Stop on error unless continueOnError is set
      if (result.exitCode !== 0 && !options.streamOutput) {
        break;
      }
    }
    
    return results;
  }
  
  /**
   * Execute commands in parallel (multiple terminals)
   */
  async executeParallel(
    commands: Array<{ command: string; targetHost?: string }>,
    options: ExecutionOptions = {}
  ): Promise<Array<{ sessionId: string; result: CommandResult }>> {
    const promises = commands.map(async ({ command, targetHost }) => {
      const sessionId = this.createSession(targetHost);
      const result = await this.executeCommand(sessionId, command, options);
      return { sessionId, result };
    });
    
    return Promise.all(promises);
  }
  
  /**
   * Get session info
   */
  getSession(sessionId: string): TerminalSession | undefined {
    return this.sessions.get(sessionId);
  }
  
  /**
   * Get command history
   */
  getHistory(sessionId: string, limit: number = 50): Array<{
    command: string;
    output: string;
    exitCode: number;
    timestamp: number;
    duration: number;
  }> {
    const session = this.sessions.get(sessionId);
    if (!session) return [];
    
    return session.commandHistory.slice(-limit);
  }
  
  /**
   * List all sessions
   */
  listSessions(): Array<{
    id: string;
    platform: string;
    targetHost?: string;
    commandCount: number;
    createdAt: string;
  }> {
    return Array.from(this.sessions.values()).map(session => ({
      id: session.id,
      platform: session.platform,
      targetHost: session.targetHost,
      commandCount: session.commandHistory.length,
      createdAt: session.createdAt,
    }));
  }
  
  /**
   * Close session
   */
  closeSession(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (session && session.process) {
      session.process.kill();
    }
    this.sessions.delete(sessionId);
  }
  
  /**
   * Close all sessions
   */
  closeAllSessions(): void {
    for (const sessionId of this.sessions.keys()) {
      this.closeSession(sessionId);
    }
  }
  
  /**
   * Get platform info
   */
  getPlatformInfo(): {
    platform: string;
    defaultShell: string;
    totalSessions: number;
    hostname: string;
    arch: string;
    osVersion: string;
  } {
    return {
      platform: this.platform,
      defaultShell: this.defaultShell,
      totalSessions: this.sessions.size,
      hostname: os.hostname(),
      arch: os.arch(),
      osVersion: os.version(),
    };
  }
  
  /**
   * Get platform-specific command library
   */
  getPlatformCommands(): Record<string, string> {
    if (this.platform === 'windows') {
      return {
        // System information
        'sys-info': 'systeminfo',
        'whoami': 'whoami',
        'hostname': 'hostname',
        'env': 'set',
        
        // File operations
        'list-files': 'dir /a',
        'show-file': 'type {file}',
        'find-file': 'where /r . {pattern}',
        'search-text': 'findstr /s /i "{pattern}" *.*',
        
        // Network
        'network-info': 'ipconfig /all',
        'network-connections': 'netstat -ano',
        'network-routes': 'route print',
        'arp-table': 'arp -a',
        
        // Process management
        'list-processes': 'tasklist /v',
        'kill-process': 'taskkill /F /PID {pid}',
        
        // User and group
        'list-users': 'net user',
        'list-groups': 'net localgroup',
        'current-user': 'whoami /all',
        
        // Services
        'list-services': 'sc query',
        'service-info': 'sc qc {service}',
        
        // Registry (Windows-specific)
        'reg-query': 'reg query {key}',
        'reg-save': 'reg save {key} {file}',
      };
    } else {
      return {
        // System information
        'sys-info': 'uname -a',
        'whoami': 'whoami',
        'hostname': 'hostname',
        'env': 'env',
        
        // File operations
        'list-files': 'ls -la',
        'show-file': 'cat {file}',
        'find-file': 'find / -name "{pattern}" 2>/dev/null',
        'search-text': 'grep -r "{pattern}" .',
        
        // Network
        'network-info': 'ifconfig || ip addr',
        'network-connections': 'netstat -tulpn || ss -tulpn',
        'network-routes': 'route -n || ip route',
        'arp-table': 'arp -a',
        
        // Process management
        'list-processes': 'ps aux',
        'kill-process': 'kill -9 {pid}',
        
        // User and group
        'list-users': 'cat /etc/passwd',
        'list-groups': 'cat /etc/group',
        'current-user': 'id',
        
        // Services
        'list-services': 'systemctl list-units --type=service || service --status-all',
        'service-info': 'systemctl status {service} || service {service} status',
      };
    }
  }
}

// Singleton instance
export const crossPlatformTerminal = new CrossPlatformTerminalManager();
