/**
 * AUTOPILOT ENGINE - Like Manus 1.6 Max
 * Simple countdown timers, auto-prompting from previous output
 * Reads all progress every 45 seconds
 */

import * as fs from 'fs';
import * as path from 'path';
import { invokeLLM } from './llm';

// Session state
interface AutopilotState {
  sessionId: string;
  isRunning: boolean;
  startTime: number;
  
  // Countdown timers (in seconds)
  evolutionCountdown: number;
  autopilotCountdown: number;
  progressCountdown: number;
  
  // Content
  lastResponse: string;
  lastPrompt: string;
  lastCode: string;
  lastEvolution: string;
  
  // History
  allResponses: string[];
  allPrompts: string[];
  allCode: string[];
  allEvolutions: string[];
  
  // Stats
  evolutionCount: number;
  autopilotCount: number;
  progressReadCount: number;
}

// Global state
let state: AutopilotState | null = null;
let mainTimer: NodeJS.Timeout | null = null;

const EVOLUTION_INTERVAL = 5;    // Every 5 seconds
const AUTOPILOT_INTERVAL = 10;   // Every 10 seconds  
const PROGRESS_INTERVAL = 45;    // Every 45 seconds

/**
 * START AUTOPILOT
 */
export function startAutopilot(): AutopilotState {
  // Initialize state
  state = {
    sessionId: `autopilot-${Date.now()}`,
    isRunning: true,
    startTime: Date.now(),
    
    evolutionCountdown: EVOLUTION_INTERVAL,
    autopilotCountdown: AUTOPILOT_INTERVAL,
    progressCountdown: PROGRESS_INTERVAL,
    
    lastResponse: '',
    lastPrompt: 'Generate exploit code for security testing',
    lastCode: '',
    lastEvolution: '',
    
    allResponses: [],
    allPrompts: [],
    allCode: [],
    allEvolutions: [],
    
    evolutionCount: 0,
    autopilotCount: 0,
    progressReadCount: 0,
  };
  
  console.log('\n========================================');
  console.log('🚀 AUTOPILOT STARTED - Manus 1.6 Max Style');
  console.log('========================================');
  console.log(`Session: ${state.sessionId}`);
  console.log(`Evolution: every ${EVOLUTION_INTERVAL}s`);
  console.log(`Autopilot: every ${AUTOPILOT_INTERVAL}s`);
  console.log(`Progress: every ${PROGRESS_INTERVAL}s`);
  console.log('========================================\n');
  
  // Start main timer - ticks every 1 second
  mainTimer = setInterval(() => tick(), 1000);
  
  return state;
}

/**
 * MAIN TICK - runs every 1 second
 */
async function tick(): Promise<void> {
  if (!state || !state.isRunning) return;
  
  // Decrement all countdowns
  state.evolutionCountdown--;
  state.autopilotCountdown--;
  state.progressCountdown--;
  
  // Log countdown status
  console.log(`⏱️  Evolution: ${state.evolutionCountdown}s | Autopilot: ${state.autopilotCountdown}s | Progress: ${state.progressCountdown}s`);
  
  // Check if any countdown hit zero
  if (state.evolutionCountdown <= 0) {
    await runEvolution();
    state.evolutionCountdown = EVOLUTION_INTERVAL; // Reset
  }
  
  if (state.autopilotCountdown <= 0) {
    await runAutopilot();
    state.autopilotCountdown = AUTOPILOT_INTERVAL; // Reset
  }
  
  if (state.progressCountdown <= 0) {
    await readProgress();
    state.progressCountdown = PROGRESS_INTERVAL; // Reset
  }
}

/**
 * EVOLUTION - Analyze and improve (every 5 seconds)
 */
async function runEvolution(): Promise<void> {
  if (!state) return;
  
  state.evolutionCount++;
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`🧬 EVOLUTION #${state.evolutionCount}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  try {
    const evolutionPrompt = `You are an evolving AI system. Analyze your last output and suggest improvements.

Last Response: ${state.lastResponse.substring(0, 500)}
Last Code: ${state.lastCode.substring(0, 300)}

Generate a brief evolution insight - what should change next? Be specific and actionable.`;

    const messages = [
      { role: "system" as const, content: "You are an autonomous evolving system. Generate brief, actionable evolution insights." },
      { role: "user" as const, content: evolutionPrompt },
    ];
    
    const response = await invokeLLM({ messages });
    const evolution = typeof response.choices[0].message.content === 'string' 
      ? response.choices[0].message.content 
      : 'Continue improving';
    
    state.lastEvolution = evolution;
    state.allEvolutions.push(evolution);
    if (state.allEvolutions.length > 20) state.allEvolutions.shift();
    
    console.log(`📊 Evolution: ${evolution.substring(0, 200)}...`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
  } catch (error) {
    console.error('Evolution error:', error);
  }
}

/**
 * AUTOPILOT - Generate new prompt from last output (every 10 seconds)
 */
async function runAutopilot(): Promise<void> {
  if (!state) return;
  
  state.autopilotCount++;
  console.log('\n════════════════════════════════════');
  console.log(`🤖 AUTOPILOT #${state.autopilotCount}`);
  console.log('════════════════════════════════════');
  
  try {
    // STEP 1: Generate new prompt from last response
    const promptGenInput = `Based on this previous output, generate a NEW exploit generation prompt:

Previous Response: ${state.lastResponse.substring(0, 400)}
Previous Evolution: ${state.lastEvolution.substring(0, 200)}

Generate a specific, actionable prompt for the next exploit. Just output the prompt, nothing else.`;

    const promptMessages = [
      { role: "system" as const, content: "You are a prompt generator. Generate specific exploit generation prompts. Output ONLY the prompt." },
      { role: "user" as const, content: promptGenInput },
    ];
    
    const promptResponse = await invokeLLM({ messages: promptMessages });
    const newPrompt = typeof promptResponse.choices[0].message.content === 'string' 
      ? promptResponse.choices[0].message.content 
      : 'Generate exploit code';
    
    state.lastPrompt = newPrompt;
    state.allPrompts.push(newPrompt);
    if (state.allPrompts.length > 20) state.allPrompts.shift();
    
    console.log(`💭 New Prompt: ${newPrompt.substring(0, 150)}...`);
    
    // STEP 2: Generate response using new prompt
    const responseMessages = [
      { role: "system" as const, content: "You are an autonomous exploit generation system. Generate working Python exploit code. Include code blocks." },
      { role: "user" as const, content: newPrompt },
    ];
    
    const codeResponse = await invokeLLM({ messages: responseMessages });
    const response = typeof codeResponse.choices[0].message.content === 'string' 
      ? codeResponse.choices[0].message.content 
      : '';
    
    state.lastResponse = response;
    state.allResponses.push(response);
    if (state.allResponses.length > 20) state.allResponses.shift();
    
    console.log(`🤖 Response: ${response.substring(0, 200)}...`);
    
    // STEP 3: Extract and save code
    const code = extractCode(response);
    if (code) {
      state.lastCode = code;
      state.allCode.push(code);
      if (state.allCode.length > 20) state.allCode.shift();
      
      // Save to real file
      const fileName = `exploit_${Date.now()}.py`;
      const filePath = `/home/ubuntu/ale_project/generated/${fileName}`;
      
      try {
        const dir = path.dirname(filePath);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(filePath, code);
        console.log(`📁 Code saved: ${filePath}`);
      } catch (e) {
        console.error('Failed to save code:', e);
      }
    }
    
    console.log('════════════════════════════════════\n');
    
  } catch (error) {
    console.error('Autopilot error:', error);
  }
}

/**
 * READ PROGRESS - Analyze all progress made (every 45 seconds)
 */
async function readProgress(): Promise<void> {
  if (!state) return;
  
  state.progressReadCount++;
  console.log('\n╔══════════════════════════════════════╗');
  console.log(`║ 📖 PROGRESS READ #${state.progressReadCount}                  ║`);
  console.log('╠══════════════════════════════════════╣');
  
  try {
    // Compile all progress
    const progressSummary = `
AUTOPILOT PROGRESS REPORT
=========================
Session: ${state.sessionId}
Runtime: ${Math.floor((Date.now() - state.startTime) / 1000)}s
Evolution Count: ${state.evolutionCount}
Autopilot Count: ${state.autopilotCount}
Progress Reads: ${state.progressReadCount}

RECENT PROMPTS (last 5):
${state.allPrompts.slice(-5).map((p, i) => `${i + 1}. ${p.substring(0, 100)}`).join('\n')}

RECENT EVOLUTIONS (last 5):
${state.allEvolutions.slice(-5).map((e, i) => `${i + 1}. ${e.substring(0, 100)}`).join('\n')}

RECENT CODE (last 3):
${state.allCode.slice(-3).map((c, i) => `${i + 1}. ${c.substring(0, 150)}`).join('\n')}
`;
    
    console.log(progressSummary);
    
    // Generate insight from progress
    const insightPrompt = `Analyze this autopilot progress and generate insights:

${progressSummary}

What patterns do you see? What should be improved? Generate actionable insights.`;

    const messages = [
      { role: "system" as const, content: "You are a progress analyzer. Generate insights from autopilot progress." },
      { role: "user" as const, content: insightPrompt },
    ];
    
    const response = await invokeLLM({ messages });
    const insight = typeof response.choices[0].message.content === 'string' 
      ? response.choices[0].message.content 
      : 'Continue progress';
    
    console.log(`\n💡 INSIGHT: ${insight.substring(0, 300)}...`);
    console.log('╚══════════════════════════════════════╝\n');
    
    // Save progress to file
    const progressPath = `/home/ubuntu/ale_project/autopilot_progress.json`;
    fs.writeFileSync(progressPath, JSON.stringify({
      ...state,
      lastInsight: insight,
      timestamp: new Date().toISOString(),
    }, null, 2));
    
  } catch (error) {
    console.error('Progress read error:', error);
  }
}

/**
 * Extract code from response
 */
function extractCode(response: string): string | null {
  const pythonMatch = response.match(/```python\n([\s\S]*?)\n```/);
  if (pythonMatch) return pythonMatch[1];
  
  const codeMatch = response.match(/```\n([\s\S]*?)\n```/);
  if (codeMatch) return codeMatch[1];
  
  if (response.includes('def ') || response.includes('import ')) {
    const lines = response.split('\n').filter(l => 
      l.includes('def ') || l.includes('import ') || l.includes('class ') || 
      l.startsWith('    ') || l.startsWith('\t')
    );
    if (lines.length > 3) return lines.join('\n');
  }
  
  return null;
}

/**
 * STOP AUTOPILOT
 */
export function stopAutopilot(): void {
  if (mainTimer) {
    clearInterval(mainTimer);
    mainTimer = null;
  }
  
  if (state) {
    state.isRunning = false;
    console.log('\n🛑 AUTOPILOT STOPPED');
    console.log(`Total Evolutions: ${state.evolutionCount}`);
    console.log(`Total Autopilots: ${state.autopilotCount}`);
    console.log(`Total Progress Reads: ${state.progressReadCount}`);
  }
}

/**
 * GET STATUS
 */
export function getAutopilotStatus(): any {
  if (!state) return { isRunning: false };
  
  return {
    isRunning: state.isRunning,
    sessionId: state.sessionId,
    runtime: Math.floor((Date.now() - state.startTime) / 1000),
    
    evolutionCountdown: state.evolutionCountdown,
    autopilotCountdown: state.autopilotCountdown,
    progressCountdown: state.progressCountdown,
    
    evolutionCount: state.evolutionCount,
    autopilotCount: state.autopilotCount,
    progressReadCount: state.progressReadCount,
    
    lastPrompt: state.lastPrompt.substring(0, 100),
    lastResponse: state.lastResponse.substring(0, 100),
    lastEvolution: state.lastEvolution.substring(0, 100),
  };
}

// Export for router
export const autonomousAutopilot = {
  startAutopilot,
  stopAutopilot,
  getSessionStatus: getAutopilotStatus,
  getSessionStats: getAutopilotStatus,
  getActiveSessions: () => state ? [state] : [],
  pauseAutopilot: stopAutopilot,
  resumeAutopilot: startAutopilot,
};
