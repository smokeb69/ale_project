/**
 * EXECUTION MODULE
 * Executes code through PowerShell with intelligent error fixing
 */

import { exec, spawn } from 'child_process';
import { promisify } from 'util';
import { invokeLLM } from './llm';

const execAsync = promisify(exec);

export interface ExecutionResult {
  success: boolean;
  output: string;
  error?: string;
  exitCode: number;
  executionTime: number;
  fixAttempts?: number;
}

export interface ExecutionOptions {
  shell?: 'powershell' | 'cmd' | 'bash' | 'python' | 'node';
  timeout?: number;
  cwd?: string;
  env?: Record<string, string>;
  autoFix?: boolean;
  maxFixAttempts?: number;
}

/**
 * Execute code with PowerShell (Windows primary)
 */
export async function executePowerShell(
  code: string,
  options: ExecutionOptions = {}
): Promise<ExecutionResult> {
  const startTime = Date.now();
  const timeout = options.timeout || 30000;
  
  console.log('\n💻 EXECUTING POWERSHELL CODE');
  console.log('═'.repeat(60));
  console.log(code.substring(0, 200));
  console.log('═'.repeat(60));
  
  try {
    // Encode as base64 to avoid escaping issues
    const encoded = Buffer.from(code, 'utf16le').toString('base64');
    const command = `powershell.exe -EncodedCommand ${encoded}`;
    
    const { stdout, stderr } = await execAsync(command, {
      timeout,
      cwd: options.cwd,
      env: { ...process.env, ...options.env },
    });
    
    const executionTime = Date.now() - startTime;
    
    console.log('✅ EXECUTION SUCCESSFUL');
    console.log(`⏱️  Time: ${executionTime}ms`);
    console.log('📤 Output:', stdout.substring(0, 500));
    
    return {
      success: true,
      output: stdout,
      error: stderr,
      exitCode: 0,
      executionTime,
    };
  } catch (error: any) {
    const executionTime = Date.now() - startTime;
    
    console.log('❌ EXECUTION FAILED');
    console.log(`⏱️  Time: ${executionTime}ms`);
    console.log('📤 Error:', error.message);
    
    // Attempt intelligent error fixing if enabled
    if (options.autoFix) {
      return await attemptErrorFix(code, error, options, 1);
    }
    
    return {
      success: false,
      output: error.stdout || '',
      error: error.message,
      exitCode: error.code || 1,
      executionTime,
    };
  }
}

/**
 * Execute code in appropriate shell based on type
 */
export async function executeCode(
  code: string,
  options: ExecutionOptions = {}
): Promise<ExecutionResult> {
  const shell = options.shell || detectShell(code);
  
  switch (shell) {
    case 'powershell':
      return executePowerShell(code, options);
    
    case 'python':
      return executePython(code, options);
    
    case 'node':
      return executeNode(code, options);
    
    case 'bash':
      return executeBash(code, options);
    
    case 'cmd':
      return executeCmd(code, options);
    
    default:
      return executePowerShell(code, options); // Default to PowerShell on Windows
  }
}

/**
 * Detect shell type from code
 */
function detectShell(code: string): ExecutionOptions['shell'] {
  if (code.includes('import ') && (code.includes('def ') || code.includes('print('))) {
    return 'python';
  }
  if (code.includes('const ') || code.includes('require(') || code.includes('import {')) {
    return 'node';
  }
  if (code.includes('$_') || code.includes('Get-') || code.includes('[System.')) {
    return 'powershell';
  }
  if (code.includes('#!/bin/bash') || code.includes('#!/bin/sh')) {
    return 'bash';
  }
  return 'powershell'; // Default to PowerShell
}

/**
 * Execute Python code
 */
async function executePython(code: string, options: ExecutionOptions): Promise<ExecutionResult> {
  const startTime = Date.now();
  
  try {
    const { stdout, stderr } = await execAsync(`python -c "${code.replace(/"/g, '\\"')}"`, {
      timeout: options.timeout || 30000,
      cwd: options.cwd,
      env: { ...process.env, ...options.env },
    });
    
    return {
      success: true,
      output: stdout,
      error: stderr,
      exitCode: 0,
      executionTime: Date.now() - startTime,
    };
  } catch (error: any) {
    if (options.autoFix) {
      return await attemptErrorFix(code, error, { ...options, shell: 'python' }, 1);
    }
    
    return {
      success: false,
      output: error.stdout || '',
      error: error.message,
      exitCode: error.code || 1,
      executionTime: Date.now() - startTime,
    };
  }
}

/**
 * Execute Node.js code
 */
async function executeNode(code: string, options: ExecutionOptions): Promise<ExecutionResult> {
  const startTime = Date.now();
  
  try {
    const { stdout, stderr } = await execAsync(`node -e "${code.replace(/"/g, '\\"')}"`, {
      timeout: options.timeout || 30000,
      cwd: options.cwd,
      env: { ...process.env, ...options.env },
    });
    
    return {
      success: true,
      output: stdout,
      error: stderr,
      exitCode: 0,
      executionTime: Date.now() - startTime,
    };
  } catch (error: any) {
    if (options.autoFix) {
      return await attemptErrorFix(code, error, { ...options, shell: 'node' }, 1);
    }
    
    return {
      success: false,
      output: error.stdout || '',
      error: error.message,
      exitCode: error.code || 1,
      executionTime: Date.now() - startTime,
    };
  }
}

/**
 * Execute Bash code
 */
async function executeBash(code: string, options: ExecutionOptions): Promise<ExecutionResult> {
  const startTime = Date.now();
  
  try {
    const { stdout, stderr } = await execAsync(code, {
      timeout: options.timeout || 30000,
      cwd: options.cwd,
      env: { ...process.env, ...options.env },
      shell: '/bin/bash',
    });
    
    return {
      success: true,
      output: stdout,
      error: stderr,
      exitCode: 0,
      executionTime: Date.now() - startTime,
    };
  } catch (error: any) {
    if (options.autoFix) {
      return await attemptErrorFix(code, error, { ...options, shell: 'bash' }, 1);
    }
    
    return {
      success: false,
      output: error.stdout || '',
      error: error.message,
      exitCode: error.code || 1,
      executionTime: Date.now() - startTime,
    };
  }
}

/**
 * Execute CMD code
 */
async function executeCmd(code: string, options: ExecutionOptions): Promise<ExecutionResult> {
  const startTime = Date.now();
  
  try {
    const { stdout, stderr } = await execAsync(code, {
      timeout: options.timeout || 30000,
      cwd: options.cwd,
      env: { ...process.env, ...options.env },
      shell: 'cmd.exe',
    });
    
    return {
      success: true,
      output: stdout,
      error: stderr,
      exitCode: 0,
      executionTime: Date.now() - startTime,
    };
  } catch (error: any) {
    if (options.autoFix) {
      return await attemptErrorFix(code, error, { ...options, shell: 'cmd' }, 1);
    }
    
    return {
      success: false,
      output: error.stdout || '',
      error: error.message,
      exitCode: error.code || 1,
      executionTime: Date.now() - startTime,
    };
  }
}

/**
 * INTELLIGENT ERROR FIXING
 * Uses AI to analyze and fix execution errors
 */
async function attemptErrorFix(
  originalCode: string,
  error: any,
  options: ExecutionOptions,
  attempt: number
): Promise<ExecutionResult> {
  const maxAttempts = options.maxFixAttempts || 3;
  
  if (attempt > maxAttempts) {
    console.log(`❌ MAX FIX ATTEMPTS REACHED (${maxAttempts})`);
    return {
      success: false,
      output: error.stdout || '',
      error: `Failed after ${maxAttempts} fix attempts: ${error.message}`,
      exitCode: error.code || 1,
      executionTime: 0,
      fixAttempts: attempt - 1,
    };
  }
  
  console.log(`\n🔧 INTELLIGENT ERROR FIXING - Attempt ${attempt}/${maxAttempts}`);
  console.log('═'.repeat(60));
  
  try {
    const fixPrompt = `You are an intelligent code error fixing system.

Original Code:
\`\`\`${options.shell || 'powershell'}
${originalCode}
\`\`\`

Execution Error:
${error.message}
${error.stdout ? `\nStdout: ${error.stdout}` : ''}
${error.stderr ? `\nStderr: ${error.stderr}` : ''}

Analyze this error and generate FIXED code that will execute successfully.
- Fix syntax errors
- Fix import/module issues  
- Fix path or permission issues
- Add error handling if needed
- Ensure compatibility with ${options.shell || 'powershell'}

Output ONLY the fixed code, no explanations.`;

    const messages = [
      { 
        role: "system" as const, 
        content: "You are an expert at fixing code execution errors. Generate working code that fixes the errors." 
      },
      { role: "user" as const, content: fixPrompt },
    ];
    
    const response = await invokeLLM({ messages });
    const fixedCode = extractCode(
      typeof response.choices[0].message.content === 'string'
        ? response.choices[0].message.content
        : ''
    );
    
    if (!fixedCode) {
      throw new Error('Could not extract fixed code from AI response');
    }
    
    console.log('🔧 Fixed Code Generated:');
    console.log(fixedCode.substring(0, 200));
    console.log('Executing fixed code...\n');
    
    // Retry execution with fixed code
    const result = await executeCode(fixedCode, { ...options, autoFix: false });
    
    if (result.success) {
      console.log(`✅ FIX SUCCESSFUL on attempt ${attempt}`);
      result.fixAttempts = attempt;
      return result;
    } else {
      // Recursively try again
      return await attemptErrorFix(fixedCode, new Error(result.error), options, attempt + 1);
    }
    
  } catch (fixError) {
    console.log('❌ Error during fix attempt:', fixError);
    return {
      success: false,
      output: '',
      error: `Fix attempt failed: ${fixError}`,
      exitCode: 1,
      executionTime: 0,
      fixAttempts: attempt,
    };
  }
}

/**
 * Extract code from markdown or raw text
 */
function extractCode(text: string): string {
  // Try markdown code blocks first
  const codeBlockMatch = text.match(/```(?:powershell|python|javascript|bash|cmd)?\n([\s\S]*?)\n```/);
  if (codeBlockMatch) {
    return codeBlockMatch[1].trim();
  }
  
  // If no code blocks, return as-is
  return text.trim();
}

export const execution = {
  executeCode,
  executePowerShell,
  executePython,
  executeNode,
  executeBash,
  executeCmd,
};
