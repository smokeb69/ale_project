import { spawn, ChildProcess } from 'child_process';
import { nanoid } from 'nanoid';

interface TerminalSession {
  id: string;
  process: ChildProcess;
  buffer: string[];
  cwd: string;
  env: Record<string, string>;
  privilegeLevel: 'user' | 'sudo' | 'admin' | 'superadmin' | 'root';
}

class TerminalManager {
  private sessions: Map<string, TerminalSession> = new Map();
  
  createSession(privilegeLevel: 'user' | 'sudo' | 'admin' | 'superadmin' | 'root' = 'user'): string {
    const id = nanoid(12);
    const cwd = '/home/ubuntu/ale_project';
    
    // Determine shell and environment based on privilege level
    let shell = '/bin/bash';
    let env: Record<string, string> = { ...process.env, PS1: '$ ', TERM: 'xterm-256color' };
    
    if (privilegeLevel === 'root' || privilegeLevel === 'superadmin') {
      env.USER = 'root';
      env.HOME = '/root';
    }
    
    const proc = spawn(shell, ['-i'], {
      cwd,
      env,
      shell: true,
    });
    
    const buffer: string[] = [];
    
    proc.stdout?.on('data', (data) => {
      const output = data.toString();
      buffer.push(output);
      // Keep last 1000 lines
      if (buffer.length > 1000) {
        buffer.shift();
      }
    });
    
    proc.stderr?.on('data', (data) => {
      const output = `[ERROR] ${data.toString()}`;
      buffer.push(output);
      if (buffer.length > 1000) {
        buffer.shift();
      }
    });
    
    proc.on('exit', (code) => {
      buffer.push(`[PROCESS EXITED WITH CODE ${code}]`);
    });
    
    this.sessions.set(id, {
      id,
      process: proc,
      buffer,
      cwd,
      env,
      privilegeLevel,
    });
    
    return id;
  }
  
  executeCommand(sessionId: string, command: string): Promise<{ output: string; exitCode: number | null }> {
    return new Promise((resolve) => {
      const session = this.sessions.get(sessionId);
      if (!session) {
        resolve({ output: '[ERROR] Session not found', exitCode: 1 });
        return;
      }
      
      const startBufferLength = session.buffer.length;
      
      // Write command to stdin
      session.process.stdin?.write(command + '\n');
      
      // Wait for output (with timeout)
      setTimeout(() => {
        const newOutput = session.buffer.slice(startBufferLength).join('');
        resolve({
          output: newOutput || '[No output]',
          exitCode: session.process.exitCode,
        });
      }, 1000); // 1 second timeout for command execution
    });
  }
  
  getBuffer(sessionId: string, lines: number = 100): string[] {
    const session = this.sessions.get(sessionId);
    if (!session) return ['[ERROR] Session not found'];
    
    return session.buffer.slice(-lines);
  }
  
  clearBuffer(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.buffer = [];
    }
  }
  
  killSession(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.process.kill();
      this.sessions.delete(sessionId);
    }
  }
  
  listSessions(): string[] {
    return Array.from(this.sessions.keys());
  }
  
  getSessionInfo(sessionId: string): { cwd: string; privilegeLevel: string } | null {
    const session = this.sessions.get(sessionId);
    if (!session) return null;
    
    return {
      cwd: session.cwd,
      privilegeLevel: session.privilegeLevel,
    };
  }
}

// Singleton instance
export const terminalManager = new TerminalManager();
