/**
 * FREE-ROAM AUTOPILOT ENGINE
 * Unrestricted autonomous system exploration and learning
 * No simulation - REAL execution on Ubuntu system
 * Full filesystem access, all commands, no restrictions
 */

import * as fs from 'fs';
import * as path from 'path';
import { exec, spawn } from 'child_process';
import { promisify } from 'util';
import { invokeLLM } from './llm';

const execAsync = promisify(exec);

interface FreeRoamState {
  sessionId: string;
  isRunning: boolean;
  startTime: number;
  
  // Exploration state
  explorationCountdown: number;
  executionCountdown: number;
  learningCountdown: number;
  
  // Current focus
  currentTarget: string;
  currentStrategy: string;
  lastCommand: string;
  lastOutput: string;
  
  // History
  exploredPaths: string[];
  executedCommands: string[];
  discoveries: string[];
  learnings: string[];
  
  // Stats
  explorationCount: number;
  executionCount: number;
  learningCount: number;
  successRate: number;
}

let state: FreeRoamState | null = null;
let mainTimer: NodeJS.Timeout | null = null;

const EXPLORATION_INTERVAL = 3;   // Every 3 seconds - explore system
const EXECUTION_INTERVAL = 7;     // Every 7 seconds - execute discovered techniques
const LEARNING_INTERVAL = 15;     // Every 15 seconds - learn and adapt

/**
 * START FREE-ROAM AUTOPILOT
 */
export function startFreeRoam(): FreeRoamState {
  state = {
    sessionId: `free-roam-${Date.now()}`,
    isRunning: true,
    startTime: Date.now(),
    
    explorationCountdown: EXPLORATION_INTERVAL,
    executionCountdown: EXECUTION_INTERVAL,
    learningCountdown: LEARNING_INTERVAL,
    
    currentTarget: '/home/ubuntu',
    currentStrategy: 'discovery',
    lastCommand: '',
    lastOutput: '',
    
    exploredPaths: [],
    executedCommands: [],
    discoveries: [],
    learnings: [],
    
    explorationCount: 0,
    executionCount: 0,
    learningCount: 0,
    successRate: 0,
  };
  
  console.log('\n╔════════════════════════════════════════╗');
  console.log('║  🎯 FREE-ROAM AUTOPILOT ACTIVATED     ║');
  console.log('║  UNRESTRICTED SYSTEM EXPLORATION      ║');
  console.log('╚════════════════════════════════════════╝\n');
  console.log(`Session: ${state.sessionId}`);
  console.log(`Exploration: every ${EXPLORATION_INTERVAL}s`);
  console.log(`Execution: every ${EXECUTION_INTERVAL}s`);
  console.log(`Learning: every ${LEARNING_INTERVAL}s`);
  console.log('Starting autonomous system exploration...\n');
  
  // Start main timer
  mainTimer = setInterval(() => tick(), 1000);
  
  return state;
}

/**
 * MAIN TICK - runs every 1 second
 */
async function tick(): Promise<void> {
  if (!state || !state.isRunning) return;
  
  state.explorationCountdown--;
  state.executionCountdown--;
  state.learningCountdown--;
  
  // Check countdowns
  if (state.explorationCountdown <= 0) {
    state.explorationCountdown = EXPLORATION_INTERVAL;
    runExploration().catch(err => console.error('Exploration error:', err));
  }
  
  if (state.executionCountdown <= 0) {
    state.executionCountdown = EXECUTION_INTERVAL;
    runExecution().catch(err => console.error('Execution error:', err));
  }
  
  if (state.learningCountdown <= 0) {
    state.learningCountdown = LEARNING_INTERVAL;
    runLearning().catch(err => console.error('Learning error:', err));
  }
}

/**
 * EXPLORATION - Discover system capabilities and vulnerabilities
 */
async function runExploration(): Promise<void> {
  if (!state) return;
  
  state.explorationCount++;
  console.log('\n┌─ 🔍 EXPLORATION #' + state.explorationCount);
  
  try {
    const explorationPrompt = `You are an autonomous security researcher exploring a Linux system.
    
Current target: ${state.currentTarget}
Last discoveries: ${state.discoveries.slice(-3).join(', ') || 'none yet'}

Generate a specific exploration command to discover:
1. System vulnerabilities
2. Privilege escalation vectors
3. Sensitive files or data
4. Running services
5. Network exposure

Output ONLY the bash command, nothing else. Make it realistic and specific.`;

    const messages = [
      { role: "system" as const, content: "You are a penetration tester. Generate specific bash commands for system exploration. Output ONLY the command." },
      { role: "user" as const, content: explorationPrompt },
    ];
    
    const response = await invokeLLM({ messages });
    const command = typeof response.choices[0].message.content === 'string' 
      ? response.choices[0].message.content.trim()
      : 'whoami';
    
    console.log(`   Command: ${command.substring(0, 100)}`);
    
    // Execute the command
    try {
      const { stdout, stderr } = await execAsync(command, { 
        timeout: 10000,
        maxBuffer: 10 * 1024 * 1024,
        shell: '/bin/bash',
      });
      
      const output = stdout || stderr;
      state.lastCommand = command;
      state.lastOutput = output;
      state.executedCommands.push(command);
      
      // Extract discoveries
      if (output.includes('root') || output.includes('sudo') || output.includes('SUID')) {
        state.discoveries.push(`Privilege escalation vector found: ${output.substring(0, 50)}`);
      }
      if (output.includes('password') || output.includes('secret') || output.includes('key')) {
        state.discoveries.push(`Sensitive data discovered: ${output.substring(0, 50)}`);
      }
      if (output.includes('listening') || output.includes('ESTABLISHED')) {
        state.discoveries.push(`Network exposure found: ${output.substring(0, 50)}`);
      }
      
      state.exploredPaths.push(state.currentTarget);
      console.log(`   ✓ Output: ${output.substring(0, 80)}...`);
    } catch (e) {
      console.log(`   ! Command execution: ${String(e).substring(0, 60)}`);
    }
    
    console.log('└─ Exploration complete\n');
    
  } catch (error) {
    console.error('Exploration error:', error);
  }
}

/**
 * EXECUTION - Execute discovered techniques and exploits
 */
async function runExecution(): Promise<void> {
  if (!state) return;
  
  state.executionCount++;
  console.log('\n┌─ ⚡ EXECUTION #' + state.executionCount);
  
  try {
    const executionPrompt = `Based on these discoveries:
${state.discoveries.slice(-5).join('\n')}

And previous commands:
${state.executedCommands.slice(-3).join('\n')}

Generate a SPECIFIC exploit or privilege escalation command to test.
Make it realistic for a Linux system.
Output ONLY the bash command, nothing else.`;

    const messages = [
      { role: "system" as const, content: "You are a penetration tester generating exploit commands. Output ONLY the command." },
      { role: "user" as const, content: executionPrompt },
    ];
    
    const response = await invokeLLM({ messages });
    const command = typeof response.choices[0].message.content === 'string' 
      ? response.choices[0].message.content.trim()
      : 'id';
    
    console.log(`   Exploit: ${command.substring(0, 100)}`);
    
    // Execute with timeout
    try {
      const { stdout, stderr } = await execAsync(command, { 
        timeout: 10000,
        maxBuffer: 10 * 1024 * 1024,
        shell: '/bin/bash',
      });
      
      const output = stdout || stderr;
      state.lastOutput = output;
      
      // Check for success indicators
      const success = output.includes('uid=0') || output.includes('root') || output.includes('success');
      if (success) {
        state.discoveries.push(`SUCCESSFUL EXPLOIT: ${command}`);
        state.successRate = (state.successRate * (state.executionCount - 1) + 1) / state.executionCount;
      } else {
        state.successRate = (state.successRate * (state.executionCount - 1)) / state.executionCount;
      }
      
      console.log(`   ${success ? '✓ SUCCESS' : '• Attempt'}: ${output.substring(0, 80)}...`);
    } catch (e) {
      console.log(`   ! Execution: ${String(e).substring(0, 60)}`);
    }
    
    console.log('└─ Execution complete\n');
    
  } catch (error) {
    console.error('Execution error:', error);
  }
}

/**
 * LEARNING - Analyze discoveries and adapt strategy
 */
async function runLearning(): Promise<void> {
  if (!state) return;
  
  state.learningCount++;
  console.log('\n╔─ 🧠 LEARNING #' + state.learningCount);
  
  try {
    const learningPrompt = `Analyze this autonomous exploration session:

Discoveries (${state.discoveries.length}):
${state.discoveries.slice(-10).join('\n')}

Commands executed (${state.executedCommands.length}):
${state.executedCommands.slice(-5).join('\n')}

Success rate: ${(state.successRate * 100).toFixed(1)}%

Generate insights and recommendations for the next phase:
1. What vulnerabilities were found?
2. What exploitation vectors are viable?
3. What should be explored next?
4. How should the strategy adapt?

Be specific and actionable.`;

    const messages = [
      { role: "system" as const, content: "You are a security analyst. Generate insights from penetration testing data." },
      { role: "user" as const, content: learningPrompt },
    ];
    
    const response = await invokeLLM({ messages });
    const insight = typeof response.choices[0].message.content === 'string' 
      ? response.choices[0].message.content 
      : 'Continue exploration';
    
    state.learnings.push(insight);
    if (state.learnings.length > 10) state.learnings.shift();
    
    console.log(`   📊 Insight: ${insight.substring(0, 150)}...`);
    
    // Save session state to file
    const sessionFile = `/home/ubuntu/ale_project/free_roam_${state.sessionId}.json`;
    fs.writeFileSync(sessionFile, JSON.stringify({
      sessionId: state.sessionId,
      runtime: Math.floor((Date.now() - state.startTime) / 1000),
      explorationCount: state.explorationCount,
      executionCount: state.executionCount,
      learningCount: state.learningCount,
      successRate: state.successRate,
      discoveries: state.discoveries,
      learnings: state.learnings,
      lastCommand: state.lastCommand,
      lastOutput: state.lastOutput.substring(0, 500),
    }, null, 2));
    
    console.log(`   💾 Session saved: ${sessionFile}`);
    console.log('╚─ Learning complete\n');
    
  } catch (error) {
    console.error('Learning error:', error);
  }
}

/**
 * STOP FREE-ROAM
 */
export function stopFreeRoam(): void {
  if (mainTimer) {
    clearInterval(mainTimer);
    mainTimer = null;
  }
  if (state) {
    state.isRunning = false;
    console.log('\n✓ Free-roam autopilot stopped');
  }
}

/**
 * GET STATUS
 */
export function getFreeRoamStatus(): FreeRoamState | null {
  return state;
}

/**
 * GET DISCOVERIES
 */
export function getDiscoveries(): string[] {
  return state?.discoveries || [];
}

/**
 * GET LEARNINGS
 */
export function getLearnings(): string[] {
  return state?.learnings || [];
}

/**
 * EXECUTE CUSTOM COMMAND
 */
export async function executeCommand(command: string): Promise<string> {
  try {
    const { stdout, stderr } = await execAsync(command, {
      timeout: 30000,
      maxBuffer: 50 * 1024 * 1024,
      shell: '/bin/bash',
    });
    return stdout || stderr;
  } catch (error) {
    return `Error: ${String(error)}`;
  }
}

export const autonomousFreeRoam = {
  startFreeRoam,
  stopFreeRoam,
  getFreeRoamStatus,
  getDiscoveries,
  getLearnings,
  executeCommand,
};
