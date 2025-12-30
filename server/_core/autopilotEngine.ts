/**
 * Autonomous Autopilot Engine - FIXED VERSION
 * Continuous exploration with prompt chaining and code improvement
 */

import * as fs from 'fs';
import * as path from 'path';
import { realFileSystem } from './realFileSystem';
import { modelChaining } from './modelChaining';
import { invokeLLM } from './llm';

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
  previousOutputs: string[]; // For prompt chaining
  generatedCode: string[]; // Code history
  executionResults: string[]; // Execution results
  improvements: string[]; // Improvement suggestions
}

export interface AutopilotIteration {
  id: string;
  sessionId: string;
  iterationNumber: number;
  timestamp: string;
  prompt: string;
  generatedCode: string;
  executionResult: string;
  improvement: string;
  createdFiles: string[];
  success: boolean;
  duration: number;
}

export interface AutopilotStrategy {
  id: string;
  name: string;
  explorationMode: 'aggressive' | 'balanced' | 'conservative';
  mutationRate: number;
  testingConcurrency: number;
  learningRate: number;
  targetSuccessRate: number;
  maxFailureRate: number;
}

class AutonomousAutopilot {
  private activeSessions: Map<string, AutopilotSession> = new Map();
  private iterations: Map<string, AutopilotIteration> = new Map();
  private strategies: Map<string, AutopilotStrategy> = new Map();
  private sessionTimeouts: Map<string, NodeJS.Timeout> = new Map();
  private persistenceDir: string = '/home/ubuntu/ale_project/autopilot';
  
  constructor() {
    this.initializePersistence();
    this.initializeDefaultStrategies();
  }
  
  private initializePersistence(): void {
    try {
      if (!fs.existsSync(this.persistenceDir)) {
        fs.mkdirSync(this.persistenceDir, { recursive: true });
      }
      console.log('Autopilot persistence initialized');
    } catch (error) {
      console.error('Failed to initialize autopilot persistence:', error);
    }
  }
  
  private initializeDefaultStrategies(): void {
    const strategies: AutopilotStrategy[] = [
      {
        id: 'aggressive',
        name: 'Aggressive Exploration',
        explorationMode: 'aggressive',
        mutationRate: 0.8,
        testingConcurrency: 10,
        learningRate: 0.9,
        targetSuccessRate: 0.7,
        maxFailureRate: 0.3
      },
      {
        id: 'balanced',
        name: 'Balanced Learning',
        explorationMode: 'balanced',
        mutationRate: 0.5,
        testingConcurrency: 5,
        learningRate: 0.6,
        targetSuccessRate: 0.6,
        maxFailureRate: 0.4
      },
      {
        id: 'conservative',
        name: 'Conservative Refinement',
        explorationMode: 'conservative',
        mutationRate: 0.2,
        testingConcurrency: 2,
        learningRate: 0.3,
        targetSuccessRate: 0.8,
        maxFailureRate: 0.2
      }
    ];
    
    for (const strategy of strategies) {
      this.strategies.set(strategy.id, strategy);
    }
  }
  
  /**
   * Start autopilot session - FIXED
   */
  startAutopilot(
    targetProfiles: string[],
    strategyId: string = 'balanced',
    maxIterations: number = 0
  ): AutopilotSession {
    const strategy = this.strategies.get(strategyId);
    if (!strategy) throw new Error('Strategy not found');
    
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
      previousOutputs: [],
      generatedCode: [],
      executionResults: [],
      improvements: [],
    };
    
    this.activeSessions.set(session.id, session);
    this.persistSession(session);
    
    // Start iteration loop - FIXED with recursive setTimeout
    this.scheduleNextIteration(session.id, strategy);
    
    return session;
  }
  
  /**
   * Schedule next iteration - FIXED to run every 10 seconds
   */
  private scheduleNextIteration(sessionId: string, strategy: AutopilotStrategy): void {
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
        // Run iteration with prompt chaining and code improvement
        await this.runIterationWithChaining(sessionId, strategy);
      } catch (error) {
        console.error('Autopilot iteration error:', error);
      }
      
      // Schedule next iteration in 10 seconds
      this.scheduleNextIteration(sessionId, strategy);
    }, 10000); // 10 seconds
    
    this.sessionTimeouts.set(sessionId, timeout);
  }
  
  /**
   * Run iteration with prompt chaining and code improvement
   */
  private async runIterationWithChaining(sessionId: string, strategy: AutopilotStrategy): Promise<void> {
    const session = this.activeSessions.get(sessionId);
    if (!session) return;
    
    const iterationNumber = session.iterations + 1;
    const startTime = Date.now();
    
    try {
      // Build prompt with chaining from previous iterations
      const prompt = this.buildChainedPrompt(session, iterationNumber);
      
      // Generate code using LLM with full context
      const generatedCode = await this.generateCodeWithImprovement(prompt, session);
      
      // Create real file
      const fileName = `exploit_iteration_${iterationNumber}_${Date.now()}.py`;
      const fileResult = realFileSystem.createFile(fileName, generatedCode, 'project', true);
      
      const createdFiles: string[] = fileResult.success ? [fileResult.path] : [];
      
      // Execute real code
      let executionResult = '';
      let success = false;
      
      if (fileResult.success) {
        try {
          const execResult = await realFileSystem.executeFile(fileResult.path);
          executionResult = `STDOUT:\n${execResult.stdout}\n\nSTDERR:\n${execResult.stderr}\n\nExit Code: ${execResult.exitCode}`;
          success = execResult.success;
        } catch (error) {
          executionResult = `Execution error: ${String(error)}`;
        }
      } else {
        executionResult = `File creation failed: ${fileResult.error}`;
      }
      
      // Analyze execution and generate improvement
      const improvement = await this.analyzeAndImprove(generatedCode, executionResult, session);
      
      // Create iteration record
      const iteration: AutopilotIteration = {
        id: `iteration-${Date.now()}`,
        sessionId,
        iterationNumber,
        timestamp: new Date().toISOString(),
        prompt,
        generatedCode,
        executionResult,
        improvement,
        createdFiles,
        success,
        duration: Date.now() - startTime,
      };
      
      // Update session with chaining data
      session.iterations++;
      session.previousOutputs.push(executionResult);
      session.generatedCode.push(generatedCode);
      session.executionResults.push(executionResult);
      session.improvements.push(improvement);
      
      // Keep only last 5 for memory efficiency
      if (session.previousOutputs.length > 5) {
        session.previousOutputs.shift();
        session.generatedCode.shift();
        session.executionResults.shift();
        session.improvements.shift();
      }
      
      if (success) {
        session.successfulChains++;
      }
      
      session.chainsDiscovered++;
      
      // Calculate failure rate
      session.failureRate = 1 - (session.successfulChains / session.chainsDiscovered);
      
      // Save iteration
      this.iterations.set(iteration.id, iteration);
      this.persistIteration(iteration);
      this.persistSession(session);
      
      // Log output
      console.log(`\n=== AUTOPILOT ITERATION ${iterationNumber} ===`);
      console.log(`Timestamp: ${iteration.timestamp}`);
      console.log(`Success: ${success}`);
      console.log(`Files Created: ${createdFiles.join(', ')}`);
      console.log(`Duration: ${iteration.duration}ms`);
      console.log(`\nGENERATED CODE:\n${generatedCode.substring(0, 500)}...`);
      console.log(`\nEXECUTION RESULT:\n${executionResult.substring(0, 500)}...`);
      console.log(`\nIMPROVEMENT:\n${improvement.substring(0, 500)}...`);
      console.log(`===================================\n`);
      
    } catch (error) {
      console.error(`Iteration ${iterationNumber} failed:`, error);
      session.iterations++;
      this.persistSession(session);
    }
  }
  
  /**
   * Build chained prompt from previous iterations
   */
  private buildChainedPrompt(session: AutopilotSession, iterationNumber: number): string {
    let prompt = `You are an autonomous exploit generation system. Generate working exploit code for: ${session.targetProfiles.join(', ')}.\n\n`;
    
    if (session.previousOutputs.length > 0) {
      prompt += `PREVIOUS ITERATIONS:\n\n`;
      
      for (let i = 0; i < session.previousOutputs.length; i++) {
        prompt += `Iteration ${session.iterations - session.previousOutputs.length + i + 1}:\n`;
        prompt += `Code:\n${session.generatedCode[i].substring(0, 300)}...\n\n`;
        prompt += `Result:\n${session.executionResults[i].substring(0, 300)}...\n\n`;
        prompt += `Improvement:\n${session.improvements[i].substring(0, 300)}...\n\n`;
        prompt += `---\n\n`;
      }
      
      prompt += `\nBased on the above iterations, generate IMPROVED exploit code that fixes previous issues and implements suggested improvements.\n`;
    } else {
      prompt += `This is iteration 1. Generate initial exploit code.\n`;
    }
    
    prompt += `\nRequirements:
- Generate complete, executable Python code
- Include all necessary imports
- Add error handling
- Make it production-ready
- Output only the code, no explanations

Generate the exploit code now:`;
    
    return prompt;
  }
  
  /**
   * Generate code with improvement using LLM
   */
  private async generateCodeWithImprovement(prompt: string, session: AutopilotSession): Promise<string> {
    const messages = [
      { role: "system" as const, content: "You are an expert exploit developer. Generate working, executable code only. No explanations." },
      { role: "user" as const, content: prompt },
    ];
    
    const response = await invokeLLM({ messages });
    const content = response.choices[0].message.content;
    
    return typeof content === 'string' ? content : '';
  }
  
  /**
   * Analyze execution and generate improvement
   */
  private async analyzeAndImprove(code: string, executionResult: string, session: AutopilotSession): Promise<string> {
    const analysisPrompt = `Analyze this exploit code execution:

CODE:
${code}

EXECUTION RESULT:
${executionResult}

Provide specific improvements for the next iteration. Focus on:
1. Fixing errors
2. Improving reliability
3. Enhancing effectiveness
4. Optimizing performance

Generate improvement suggestions:`;
    
    const messages = [
      { role: "system" as const, content: "You are an expert code analyst. Provide specific, actionable improvements." },
      { role: "user" as const, content: analysisPrompt },
    ];
    
    try {
      const response = await invokeLLM({ messages });
      const content = response.choices[0].message.content;
      return typeof content === 'string' ? content : 'No improvements generated';
    } catch (error) {
      return `Analysis failed: ${String(error)}`;
    }
  }
  
  /**
   * Pause autopilot
   */
  pauseAutopilot(sessionId: string): void {
    const session = this.activeSessions.get(sessionId);
    if (session) {
      session.status = 'paused';
      this.persistSession(session);
      
      const timeout = this.sessionTimeouts.get(sessionId);
      if (timeout) {
        clearTimeout(timeout);
        this.sessionTimeouts.delete(sessionId);
      }
    }
  }
  
  /**
   * Resume autopilot
   */
  resumeAutopilot(sessionId: string): void {
    const session = this.activeSessions.get(sessionId);
    if (session) {
      session.status = 'running';
      this.persistSession(session);
      
      const strategy = this.strategies.get('balanced')!;
      this.scheduleNextIteration(sessionId, strategy);
    }
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
   * Get session status
   */
  getSessionStatus(sessionId: string): AutopilotSession | undefined {
    return this.activeSessions.get(sessionId);
  }
  
  /**
   * Get all active sessions
   */
  getActiveSessions(): AutopilotSession[] {
    return Array.from(this.activeSessions.values());
  }
  
  /**
   * Get iteration history
   */
  getIterationHistory(sessionId: string, limit: number = 50): AutopilotIteration[] {
    return Array.from(this.iterations.values())
      .filter(i => i.sessionId === sessionId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }
  
  /**
   * Get autopilot statistics
   */
  getAutopilotStats(): {
    activeSessions: number;
    totalChainsDiscovered: number;
    totalMutationsTested: number;
    averageSuccessRate: number;
    totalIterations: number;
  } {
    const sessions = Array.from(this.activeSessions.values());
    
    const totalChains = sessions.reduce((sum, s) => sum + s.chainsDiscovered, 0);
    const totalMutations = sessions.reduce((sum, s) => sum + s.mutationsTested, 0);
    const totalSuccessful = sessions.reduce((sum, s) => sum + s.successfulChains, 0);
    const totalTests = totalChains + totalMutations;
    
    return {
      activeSessions: sessions.filter(s => s.status === 'running').length,
      totalChainsDiscovered: totalChains,
      totalMutationsTested: totalMutations,
      averageSuccessRate: totalTests > 0 ? (totalSuccessful / totalTests) : 0,
      totalIterations: sessions.reduce((sum, s) => sum + s.iterations, 0)
    };
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

export const autonomousAutopilot = new AutonomousAutopilot();
