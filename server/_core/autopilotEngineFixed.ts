/**
 * Fixed Autonomous Autopilot Engine
 * Forces new iteration every 10 seconds, infinite output
 */

import * as fs from 'fs';
import * as path from 'path';
import { realFileSystem } from './realFileSystem';
import { modelChaining } from './modelChaining';

export interface AutopilotSession {
  id: string;
  status: 'running' | 'paused' | 'stopped' | 'completed';
  startTime: string;
  endTime?: string;
  chainsDiscovered: number;
  mutationsTested: number;
  successfulChains: number;
  failureRate: number;
  averageSuccessRate: number;
  targetProfiles: string[];
  explorationDepth: number;
  iterations: number;
  maxIterations: number;
  lastIterationTime: string;
  outputs: string[];
}

export interface AutopilotIteration {
  id: string;
  sessionId: string;
  iterationNumber: number;
  timestamp: string;
  output: string;
  executedCode: string;
  createdFiles: string[];
  success: boolean;
  duration: number;
}

class FixedAutonomousAutopilot {
  private activeSessions: Map<string, AutopilotSession> = new Map();
  private iterations: Map<string, AutopilotIteration> = new Map();
  private sessionTimeouts: Map<string, NodeJS.Timeout> = new Map();
  private persistenceDir: string = '/home/ubuntu/ale_project/autopilot_fixed';
  
  constructor() {
    this.initializePersistence();
  }
  
  private initializePersistence(): void {
    try {
      if (!fs.existsSync(this.persistenceDir)) {
        fs.mkdirSync(this.persistenceDir, { recursive: true });
      }
      console.log('Fixed autopilot persistence initialized');
    } catch (error) {
      console.error('Failed to initialize autopilot persistence:', error);
    }
  }
  
  /**
   * Start autopilot session - FIXED VERSION
   */
  startAutopilot(
    targetProfiles: string[],
    maxIterations: number = 0
  ): AutopilotSession {
    const session: AutopilotSession = {
      id: `autopilot-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      status: 'running',
      startTime: new Date().toISOString(),
      chainsDiscovered: 0,
      mutationsTested: 0,
      successfulChains: 0,
      failureRate: 0,
      averageSuccessRate: 0,
      targetProfiles,
      explorationDepth: 0,
      iterations: 0,
      maxIterations,
      lastIterationTime: new Date().toISOString(),
      outputs: [],
    };
    
    this.activeSessions.set(session.id, session);
    this.persistSession(session);
    
    // FIXED: Force iteration every 10 seconds IMMEDIATELY
    this.forceNextIteration(session.id);
    
    return session;
  }
  
  /**
   * Force next iteration every 10 seconds - FIXED
   */
  private forceNextIteration(sessionId: string): void {
    const timeout = setTimeout(async () => {
      const session = this.activeSessions.get(sessionId);
      
      if (!session || session.status !== 'running') {
        this.sessionTimeouts.delete(sessionId);
        return;
      }
      
      if (session.maxIterations > 0 && session.iterations >= session.maxIterations) {
        session.status = 'completed';
        session.endTime = new Date().toISOString();
        this.persistSession(session);
        this.sessionTimeouts.delete(sessionId);
        return;
      }
      
      try {
        // Run iteration and output immediately
        await this.runIterationWithOutput(sessionId);
      } catch (error) {
        console.error('Autopilot iteration error:', error);
      }
      
      // FORCE next iteration in 10 seconds regardless of completion
      this.forceNextIteration(sessionId);
    }, 10000); // 10 seconds
    
    this.sessionTimeouts.set(sessionId, timeout);
  }
  
  /**
   * Run iteration with real execution and output
   */
  private async runIterationWithOutput(sessionId: string): Promise<void> {
    const session = this.activeSessions.get(sessionId);
    if (!session) return;
    
    const iterationNumber = session.iterations + 1;
    const iterationId = `iteration-${Date.now()}`;
    const startTime = Date.now();
    
    try {
      // Generate real exploit code using model chaining
      const chain = await modelChaining.generateExploitChain(
        session.targetProfiles[0] || 'generic_target',
        'CVE-2024-XXXX'
      );
      
      const generatedCode = chain.finalOutput;
      const createdFiles: string[] = [];
      
      // Create real file
      const fileName = `exploit_${iterationNumber}_${Date.now()}.py`;
      const fileResult = realFileSystem.createFile(
        fileName,
        generatedCode,
        'project',
        true
      );
      
      if (fileResult.success) {
        createdFiles.push(fileResult.path);
      }
      
      // Execute real code
      let executionOutput = '';
      try {
        const execResult = await realFileSystem.executeFile(fileResult.path);
        executionOutput = execResult.stdout || execResult.stderr;
      } catch (error) {
        executionOutput = `Execution error: ${String(error)}`;
      }
      
      // Create output
      const output = `
=== AUTOPILOT ITERATION ${iterationNumber} ===
Timestamp: ${new Date().toISOString()}
Target: ${session.targetProfiles.join(', ')}

GENERATED CODE:
${generatedCode}

EXECUTION OUTPUT:
${executionOutput}

FILES CREATED:
${createdFiles.join('\n')}

CHAIN STEPS: ${chain.steps.length}
TOTAL DURATION: ${chain.totalDuration}ms
===================================
`;
      
      // Save iteration
      const iteration: AutopilotIteration = {
        id: iterationId,
        sessionId,
        iterationNumber,
        timestamp: new Date().toISOString(),
        output,
        executedCode: generatedCode,
        createdFiles,
        success: true,
        duration: Date.now() - startTime,
      };
      
      this.iterations.set(iterationId, iteration);
      this.persistIteration(iteration);
      
      // Update session
      session.iterations++;
      session.lastIterationTime = new Date().toISOString();
      session.outputs.push(output);
      session.chainsDiscovered++;
      session.successfulChains++;
      
      // Output to console/logs
      console.log(output);
      
      // Save to file
      const outputFile = path.join(
        this.persistenceDir,
        `iteration_${iterationNumber}_output.txt`
      );
      fs.writeFileSync(outputFile, output);
      
      this.persistSession(session);
      
    } catch (error) {
      console.error(`Iteration ${iterationNumber} failed:`, error);
      session.iterations++;
      session.failureRate = (session.failureRate * (session.iterations - 1) + 1) / session.iterations;
      this.persistSession(session);
    }
  }
  
  /**
   * Get session status
   */
  getSessionStatus(sessionId: string): AutopilotSession | undefined {
    return this.activeSessions.get(sessionId);
  }
  
  /**
   * Get iteration output
   */
  getIterationOutput(iterationId: string): string {
    const iteration = this.iterations.get(iterationId);
    return iteration?.output || '';
  }
  
  /**
   * Get all session outputs
   */
  getSessionOutputs(sessionId: string): string[] {
    const session = this.activeSessions.get(sessionId);
    return session?.outputs || [];
  }
  
  /**
   * Stop autopilot
   */
  stopAutopilot(sessionId: string): void {
    const session = this.activeSessions.get(sessionId);
    if (session) {
      session.status = 'stopped';
      session.endTime = new Date().toISOString();
      this.persistSession(session);
      
      const timeout = this.sessionTimeouts.get(sessionId);
      if (timeout) {
        clearTimeout(timeout);
        this.sessionTimeouts.delete(sessionId);
      }
    }
  }
  
  /**
   * Persist session
   */
  private persistSession(session: AutopilotSession): void {
    try {
      const sessionPath = path.join(this.persistenceDir, `session_${session.id}.json`);
      fs.writeFileSync(sessionPath, JSON.stringify(session, null, 2));
    } catch (error) {
      console.error('Failed to persist session:', error);
    }
  }
  
  /**
   * Persist iteration
   */
  private persistIteration(iteration: AutopilotIteration): void {
    try {
      const iterationPath = path.join(this.persistenceDir, `iteration_${iteration.id}.json`);
      fs.writeFileSync(iterationPath, JSON.stringify(iteration, null, 2));
    } catch (error) {
      console.error('Failed to persist iteration:', error);
    }
  }
}

export const fixedAutonomousAutopilot = new FixedAutonomousAutopilot();
