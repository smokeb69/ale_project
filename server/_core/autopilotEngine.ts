/**
 * Autonomous Autopilot Engine - TRUE AUTOPILOT
 * Three independent parallel loops: Evolution (5s), Self-Prompt (10s), System-Prompt (15s)
 * All running simultaneously with countdown forcing
 */

import * as fs from 'fs';
import * as path from 'path';
import { realFileSystem } from './realFileSystem';
import { invokeLLM } from './llm';

export interface AutopilotSession {
  id: string;
  status: 'running' | 'paused' | 'stopped';
  startTime: string;
  evolutionCountdown: number;
  selfPromptCountdown: number;
  systemPromptCountdown: number;
  evolutionCount: number;
  selfPromptCount: number;
  systemPromptCount: number;
  currentCode: string;
  currentPrompt: string;
  currentSystemPrompt: string;
  executionResults: string[];
  evolutionHistory: string[];
  targetProfiles: string[];
}

class TrueAutonomousAutopilot {
  private activeSessions: Map<string, AutopilotSession> = new Map();
  private sessionLoops: Map<string, { evolution: NodeJS.Timeout; selfPrompt: NodeJS.Timeout; systemPrompt: NodeJS.Timeout }> = new Map();
  private persistenceDir: string = '/home/ubuntu/ale_project/autopilot_true';
  
  constructor() {
    this.initializePersistence();
  }
  
  private initializePersistence(): void {
    try {
      if (!fs.existsSync(this.persistenceDir)) {
        fs.mkdirSync(this.persistenceDir, { recursive: true });
      }
      console.log('True autopilot persistence initialized');
    } catch (error) {
      console.error('Failed to initialize autopilot persistence:', error);
    }
  }
  
  /**
   * Start true autopilot with three parallel loops
   */
  startAutopilot(targetProfiles: string[]): AutopilotSession {
    const session: AutopilotSession = {
      id: `autopilot-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      status: 'running',
      startTime: new Date().toISOString(),
      evolutionCountdown: 5,
      selfPromptCountdown: 10,
      systemPromptCountdown: 15,
      evolutionCount: 0,
      selfPromptCount: 0,
      systemPromptCount: 0,
      currentCode: '',
      currentPrompt: 'Generate exploit code for: ' + targetProfiles.join(', '),
      currentSystemPrompt: 'You are an autonomous exploit generation system. Generate working exploit code.',
      executionResults: [],
      evolutionHistory: [],
      targetProfiles,
    };
    
    this.activeSessions.set(session.id, session);
    this.persistSession(session);
    
    // Start three independent parallel loops
    const evolutionLoop = setInterval(() => this.evolutionLoop(session.id), 1000); // Check every 1 second
    const selfPromptLoop = setInterval(() => this.selfPromptLoop(session.id), 1000); // Check every 1 second
    const systemPromptLoop = setInterval(() => this.systemPromptLoop(session.id), 1000); // Check every 1 second
    
    this.sessionLoops.set(session.id, { evolution: evolutionLoop, selfPrompt: selfPromptLoop, systemPrompt: systemPromptLoop });
    
    console.log(`\n🚀 TRUE AUTOPILOT STARTED - Session ${session.id}`);
    console.log(`Evolution: every 5 seconds`);
    console.log(`Self-Prompt: every 10 seconds`);
    console.log(`System-Prompt: every 15 seconds`);
    console.log(`All loops running in parallel\n`);
    
    return session;
  }
  
  /**
   * Evolution Loop - every 5 seconds
   */
  private evolutionLoop(sessionId: string): void {
    const session = this.activeSessions.get(sessionId);
    if (!session || session.status !== 'running') return;
    
    session.evolutionCountdown--;
    
    if (session.evolutionCountdown <= 0) {
      session.evolutionCountdown = 5; // Reset countdown
      this.executeEvolution(session);
    }
  }
  
  /**
   * Execute evolution - self-improve the system
   */
  private async executeEvolution(session: AutopilotSession): Promise<void> {
    session.evolutionCount++;
    
    console.log(`\n⚡ EVOLUTION #${session.evolutionCount} (5s loop)`);
    console.log(`Timestamp: ${new Date().toISOString()}`);
    
    try {
      // Analyze current code and execution results
      let analysisPrompt = 'Analyze this exploit code and suggest improvements:\n\n';
      analysisPrompt += `Current Code:\n${session.currentCode.substring(0, 500)}...\n\n`;
      
      if (session.executionResults.length > 0) {
        analysisPrompt += `Recent Execution Results:\n${session.executionResults.slice(-3).join('\n')}\n\n`;
      }
      
      analysisPrompt += 'Provide specific improvements for the next evolution.';
      
      const messages = [
        { role: "system" as const, content: "You are an autonomous code evolution system. Improve exploit code continuously." },
        { role: "user" as const, content: analysisPrompt },
      ];
      
      const response = await invokeLLM({ messages });
      const improvement = typeof response.choices[0].message.content === 'string' 
        ? response.choices[0].message.content 
        : '';
      
      session.evolutionHistory.push(improvement);
      if (session.evolutionHistory.length > 10) {
        session.evolutionHistory.shift();
      }
      
      console.log(`✓ Evolution analysis complete`);
      console.log(`Improvement: ${improvement.substring(0, 200)}...`);
      
      this.persistSession(session);
    } catch (error) {
      console.error(`✗ Evolution failed:`, error);
    }
  }
  
  /**
   * Self-Prompt Loop - every 10 seconds
   */
  private selfPromptLoop(sessionId: string): void {
    const session = this.activeSessions.get(sessionId);
    if (!session || session.status !== 'running') return;
    
    session.selfPromptCountdown--;
    
    if (session.selfPromptCountdown <= 0) {
      session.selfPromptCountdown = 10; // Reset countdown
      this.executeSelfPrompt(session);
    }
  }
  
  /**
   * Execute self-prompt - generate new prompts autonomously
   */
  private async executeSelfPrompt(session: AutopilotSession): Promise<void> {
    session.selfPromptCount++;
    
    console.log(`\n🧠 SELF-PROMPT #${session.selfPromptCount} (10s loop)`);
    console.log(`Timestamp: ${new Date().toISOString()}`);
    
    try {
      // Generate new prompt based on evolution history
      let promptGenPrompt = 'Generate a new exploit generation prompt based on this evolution history:\n\n';
      
      if (session.evolutionHistory.length > 0) {
        promptGenPrompt += `Evolution History:\n${session.evolutionHistory.slice(-3).join('\n')}\n\n`;
      }
      
      promptGenPrompt += `Current Targets: ${session.targetProfiles.join(', ')}\n\n`;
      promptGenPrompt += 'Generate a new, improved prompt for exploit generation:';
      
      const messages = [
        { role: "system" as const, content: "You are an autonomous prompt engineer. Generate effective exploit generation prompts." },
        { role: "user" as const, content: promptGenPrompt },
      ];
      
      const response = await invokeLLM({ messages });
      const newPrompt = typeof response.choices[0].message.content === 'string' 
        ? response.choices[0].message.content 
        : '';
      
      session.currentPrompt = newPrompt;
      
      console.log(`✓ New prompt generated`);
      console.log(`Prompt: ${newPrompt.substring(0, 200)}...`);
      
      // Generate code with new prompt
      await this.generateCodeWithPrompt(session);
      
      this.persistSession(session);
    } catch (error) {
      console.error(`✗ Self-prompt failed:`, error);
    }
  }
  
  /**
   * Generate code with current prompt
   */
  private async generateCodeWithPrompt(session: AutopilotSession): Promise<void> {
    try {
      const messages = [
        { role: "system" as const, content: session.currentSystemPrompt },
        { role: "user" as const, content: session.currentPrompt },
      ];
      
      const response = await invokeLLM({ messages });
      const code = typeof response.choices[0].message.content === 'string' 
        ? response.choices[0].message.content 
        : '';
      
      session.currentCode = code;
      
      // Create and execute real file
      const fileName = `exploit_${Date.now()}.py`;
      const fileResult = realFileSystem.createFile(fileName, code, 'project', true);
      
      if (fileResult.success) {
        try {
          const execResult = await realFileSystem.executeFile(fileResult.path);
          const result = `STDOUT: ${execResult.stdout}\nSTDERR: ${execResult.stderr}\nExit: ${execResult.exitCode}`;
          session.executionResults.push(result);
          
          if (session.executionResults.length > 10) {
            session.executionResults.shift();
          }
          
          console.log(`✓ Code executed: ${result.substring(0, 100)}...`);
        } catch (error) {
          console.error(`✗ Execution failed:`, error);
        }
      }
    } catch (error) {
      console.error(`✗ Code generation failed:`, error);
    }
  }
  
  /**
   * System-Prompt Loop - every 15 seconds
   */
  private systemPromptLoop(sessionId: string): void {
    const session = this.activeSessions.get(sessionId);
    if (!session || session.status !== 'running') return;
    
    session.systemPromptCountdown--;
    
    if (session.systemPromptCountdown <= 0) {
      session.systemPromptCountdown = 15; // Reset countdown
      this.executeSystemPrompt(session);
    }
  }
  
  /**
   * Execute system-prompt - update system prompts
   */
  private async executeSystemPrompt(session: AutopilotSession): Promise<void> {
    session.systemPromptCount++;
    
    console.log(`\n🎯 SYSTEM-PROMPT #${session.systemPromptCount} (15s loop)`);
    console.log(`Timestamp: ${new Date().toISOString()}`);
    
    try {
      // Generate new system prompt
      let systemPromptGen = 'Generate a new system prompt for an autonomous exploit generation AI based on this session:\n\n';
      systemPromptGen += `Targets: ${session.targetProfiles.join(', ')}\n`;
      systemPromptGen += `Evolution Count: ${session.evolutionCount}\n`;
      systemPromptGen += `Self-Prompt Count: ${session.selfPromptCount}\n`;
      systemPromptGen += `System-Prompt Count: ${session.systemPromptCount}\n\n`;
      
      if (session.executionResults.length > 0) {
        systemPromptGen += `Recent Success Rate: ${(session.executionResults.filter(r => r.includes('Exit: 0')).length / session.executionResults.length * 100).toFixed(1)}%\n\n`;
      }
      
      systemPromptGen += 'Generate an improved system prompt:';
      
      const messages = [
        { role: "system" as const, content: "You are a system prompt engineer. Create effective system prompts for AI agents." },
        { role: "user" as const, content: systemPromptGen },
      ];
      
      const response = await invokeLLM({ messages });
      const newSystemPrompt = typeof response.choices[0].message.content === 'string' 
        ? response.choices[0].message.content 
        : '';
      
      session.currentSystemPrompt = newSystemPrompt;
      
      console.log(`✓ System prompt updated`);
      console.log(`New System Prompt: ${newSystemPrompt.substring(0, 200)}...`);
      
      this.persistSession(session);
    } catch (error) {
      console.error(`✗ System-prompt failed:`, error);
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
   * Get session stats
   */
  getSessionStats(sessionId: string): any {
    const session = this.activeSessions.get(sessionId);
    if (!session) return null;
    
    return {
      sessionId,
      status: session.status,
      uptime: new Date().getTime() - new Date(session.startTime).getTime(),
      evolutionCount: session.evolutionCount,
      selfPromptCount: session.selfPromptCount,
      systemPromptCount: session.systemPromptCount,
      evolutionCountdown: session.evolutionCountdown,
      selfPromptCountdown: session.selfPromptCountdown,
      systemPromptCountdown: session.systemPromptCountdown,
      executionResults: session.executionResults.length,
      successRate: session.executionResults.length > 0 
        ? (session.executionResults.filter(r => r.includes('Exit: 0')).length / session.executionResults.length * 100).toFixed(1)
        : 0,
    };
  }
  
  /**
   * Stop autopilot
   */
  stopAutopilot(sessionId: string): void {
    const session = this.activeSessions.get(sessionId);
    if (session) {
      session.status = 'stopped';
      this.persistSession(session);
      
      const loops = this.sessionLoops.get(sessionId);
      if (loops) {
        clearInterval(loops.evolution);
        clearInterval(loops.selfPrompt);
        clearInterval(loops.systemPrompt);
        this.sessionLoops.delete(sessionId);
      }
      
      console.log(`\n🛑 AUTOPILOT STOPPED - Session ${sessionId}`);
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
      console.log(`⏸️  AUTOPILOT PAUSED - Session ${sessionId}`);
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
      console.log(`▶️  AUTOPILOT RESUMED - Session ${sessionId}`);
    }
  }
  
  /**
   * Persist session to disk
   */
  private persistSession(session: AutopilotSession): void {
    try {
      const sessionPath = path.join(this.persistenceDir, `session_${session.id}.json`);
      fs.writeFileSync(sessionPath, JSON.stringify(session, null, 2));
    } catch (error) {
      console.error('Failed to persist session:', error);
    }
  }
}

export const autonomousAutopilot = new TrueAutonomousAutopilot();
