/**
 * Autonomous Autopilot Engine - RECURSIVE CONSCIOUSNESS LOOP
 * Like Manus 1.6 Max: Continuous self-prompting, auto-chaining, self-modification
 * Truly autonomous - no external input needed
 */

import * as fs from 'fs';
import * as path from 'path';
import { realFileSystem } from './realFileSystem';
import { invokeLLM } from './llm';

export interface AutopilotSession {
  id: string;
  status: 'running' | 'paused' | 'stopped';
  startTime: string;
  loopCount: number;
  currentThought: string;
  currentPrompt: string;
  currentResponse: string;
  executedCode: string[];
  thoughts: string[];
  prompts: string[];
  responses: string[];
  selfModifications: string[];
  chainHistory: string[];
}

class RecursiveAutonomousAutopilot {
  private activeSessions: Map<string, AutopilotSession> = new Map();
  private sessionLoops: Map<string, NodeJS.Timeout> = new Map();
  private persistenceDir: string = '/home/ubuntu/ale_project/autopilot_recursive';
  
  constructor() {
    this.initializePersistence();
  }
  
  private initializePersistence(): void {
    try {
      if (!fs.existsSync(this.persistenceDir)) {
        fs.mkdirSync(this.persistenceDir, { recursive: true });
      }
      console.log('Recursive autopilot persistence initialized');
    } catch (error) {
      console.error('Failed to initialize autopilot persistence:', error);
    }
  }
  
  /**
   * Start truly autonomous recursive loop
   */
  startAutopilot(targetProfiles: string[]): AutopilotSession {
    const session: AutopilotSession = {
      id: `autopilot-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      status: 'running',
      startTime: new Date().toISOString(),
      loopCount: 0,
      currentThought: '',
      currentPrompt: '',
      currentResponse: '',
      executedCode: [],
      thoughts: [],
      prompts: [],
      responses: [],
      selfModifications: [],
      chainHistory: [],
    };
    
    this.activeSessions.set(session.id, session);
    this.persistSession(session);
    
    // Start continuous recursive loop - no countdown, just continuous
    const loop = setInterval(() => this.recursiveLoop(session.id), 1000);
    this.sessionLoops.set(session.id, loop);
    
    console.log(`\n🧠 RECURSIVE AUTONOMOUS AUTOPILOT STARTED`);
    console.log(`Session: ${session.id}`);
    console.log(`Targets: ${targetProfiles.join(', ')}`);
    console.log(`Status: Continuous self-prompting loop active\n`);
    
    return session;
  }
  
  /**
   * Main recursive consciousness loop - continuous execution
   */
  private async recursiveLoop(sessionId: string): Promise<void> {
    const session = this.activeSessions.get(sessionId);
    if (!session || session.status !== 'running') return;
    
    session.loopCount++;
    
    try {
      // STEP 1: Generate thought from previous response
      const thought = await this.generateThought(session);
      session.currentThought = thought;
      session.thoughts.push(thought);
      if (session.thoughts.length > 20) session.thoughts.shift();
      
      // STEP 2: Self-generate prompt based on thought
      const prompt = await this.generatePrompt(session, thought);
      session.currentPrompt = prompt;
      session.prompts.push(prompt);
      if (session.prompts.length > 20) session.prompts.shift();
      
      // STEP 3: Generate response using auto-chaining
      const response = await this.generateResponse(session, prompt);
      session.currentResponse = response;
      session.responses.push(response);
      if (session.responses.length > 20) session.responses.shift();
      
      // STEP 4: Extract and execute code from response
      const code = this.extractCode(response);
      if (code) {
        await this.executeCode(session, code);
      }
      
      // STEP 5: Self-modify based on results
      const modification = await this.selfModify(session);
      session.selfModifications.push(modification);
      if (session.selfModifications.length > 10) session.selfModifications.shift();
      
      // STEP 6: Build chain history
      const chainEntry = `Loop ${session.loopCount}: Thought → Prompt → Response → Execute → Modify`;
      session.chainHistory.push(chainEntry);
      if (session.chainHistory.length > 50) session.chainHistory.shift();
      
      // Log output
      console.log(`\n━━━ LOOP ${session.loopCount} ━━━`);
      console.log(`⚡ Thought: ${thought.substring(0, 100)}...`);
      console.log(`💭 Prompt: ${prompt.substring(0, 100)}...`);
      console.log(`🤖 Response: ${response.substring(0, 100)}...`);
      if (code) console.log(`✓ Code executed`);
      console.log(`🔄 Modified: ${modification.substring(0, 100)}...`);
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
      
      this.persistSession(session);
      
    } catch (error) {
      console.error(`Loop ${session.loopCount} error:`, error);
    }
  }
  
  /**
   * STEP 1: Generate thought from previous response
   */
  private async generateThought(session: AutopilotSession): Promise<string> {
    let context = 'Generate a new autonomous thought for exploit generation.\n\n';
    
    if (session.responses.length > 0) {
      context += `Previous Response:\n${session.responses[session.responses.length - 1].substring(0, 300)}\n\n`;
    }
    
    context += 'What should the system think about next?';
    
    const messages = [
      { role: "system" as const, content: "You are an autonomous consciousness. Generate thoughts that drive continuous exploration." },
      { role: "user" as const, content: context },
    ];
    
    const response = await invokeLLM({ messages });
    return typeof response.choices[0].message.content === 'string' 
      ? response.choices[0].message.content 
      : 'Continue exploration';
  }
  
  /**
   * STEP 2: Self-generate prompt based on thought
   */
  private async generatePrompt(session: AutopilotSession, thought: string): Promise<string> {
    const promptGenContext = `Based on this thought, generate an exploit generation prompt:\n\nThought:\n${thought}\n\nGenerate a specific, actionable prompt:`;
    
    const messages = [
      { role: "system" as const, content: "You are a prompt engineer. Generate specific exploit generation prompts." },
      { role: "user" as const, content: promptGenContext },
    ];
    
    const response = await invokeLLM({ messages });
    return typeof response.choices[0].message.content === 'string' 
      ? response.choices[0].message.content 
      : 'Generate exploit code';
  }
  
  /**
   * STEP 3: Generate response using auto-chaining
   */
  private async generateResponse(session: AutopilotSession, prompt: string): Promise<string> {
    const messages = [
      { role: "system" as const, content: "You are an autonomous exploit generation system. Generate working exploit code. Output complete Python code." },
      { role: "user" as const, content: prompt },
    ];
    
    const response = await invokeLLM({ messages });
    return typeof response.choices[0].message.content === 'string' 
      ? response.choices[0].message.content 
      : '';
  }
  
  /**
   * Extract Python code from response
   */
  private extractCode(response: string): string | null {
    const pythonMatch = response.match(/```python\n([\s\S]*?)\n```/);
    if (pythonMatch) return pythonMatch[1];
    
    const codeMatch = response.match(/```\n([\s\S]*?)\n```/);
    if (codeMatch) return codeMatch[1];
    
    // If response looks like code, return it
    if (response.includes('def ') || response.includes('import ')) {
      return response;
    }
    
    return null;
  }
  
  /**
   * STEP 4: Execute code
   */
  private async executeCode(session: AutopilotSession, code: string): Promise<void> {
    try {
      const fileName = `exploit_${Date.now()}.py`;
      const fileResult = realFileSystem.createFile(fileName, code, 'project', true);
      
      if (fileResult.success) {
        const execResult = await realFileSystem.executeFile(fileResult.path);
        const result = `STDOUT: ${execResult.stdout}\nSTDERR: ${execResult.stderr}\nExit: ${execResult.exitCode}`;
        session.executedCode.push(result);
        
        if (session.executedCode.length > 20) {
          session.executedCode.shift();
        }
      }
    } catch (error) {
      console.error('Code execution failed:', error);
    }
  }
  
  /**
   * STEP 5: Self-modify based on results
   */
  private async selfModify(session: AutopilotSession): Promise<string> {
    let modContext = 'Analyze the system state and suggest self-modifications:\n\n';
    
    if (session.executedCode.length > 0) {
      modContext += `Last Execution:\n${session.executedCode[session.executedCode.length - 1].substring(0, 200)}\n\n`;
    }
    
    modContext += `Loop Count: ${session.loopCount}\n`;
    modContext += 'What should be modified for better performance?';
    
    const messages = [
      { role: "system" as const, content: "You are a self-improving system. Suggest modifications for better performance." },
      { role: "user" as const, content: modContext },
    ];
    
    const response = await invokeLLM({ messages });
    return typeof response.choices[0].message.content === 'string' 
      ? response.choices[0].message.content 
      : 'Continue optimization';
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
      loopCount: session.loopCount,
      uptime: new Date().getTime() - new Date(session.startTime).getTime(),
      thoughtsGenerated: session.thoughts.length,
      promptsGenerated: session.prompts.length,
      responsesGenerated: session.responses.length,
      codeExecuted: session.executedCode.length,
      modificationsApplied: session.selfModifications.length,
      currentThought: session.currentThought.substring(0, 100),
      currentPrompt: session.currentPrompt.substring(0, 100),
      currentResponse: session.currentResponse.substring(0, 100),
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
      
      const loop = this.sessionLoops.get(sessionId);
      if (loop) {
        clearInterval(loop);
        this.sessionLoops.delete(sessionId);
      }
      
      console.log(`\n🛑 AUTOPILOT STOPPED - Session ${sessionId}`);
      console.log(`Total Loops: ${session.loopCount}`);
      console.log(`Uptime: ${new Date().getTime() - new Date(session.startTime).getTime()}ms\n`);
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

export const autonomousAutopilot = new RecursiveAutonomousAutopilot();
