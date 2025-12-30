/**
 * Model Switching and Chaining System
 * Intelligently switches between models and chains outputs
 */

import { invokeLLM } from './llm';

export interface ModelConfig {
  id: string;
  name: string;
  type: 'analysis' | 'generation' | 'execution' | 'optimization';
  temperature: number;
  maxTokens: number;
  specialization: string[];
}

export interface ChainStep {
  modelId: string;
  input: string;
  output: string;
  timestamp: string;
  duration: number;
}

export interface ChainResult {
  chainId: string;
  steps: ChainStep[];
  finalOutput: string;
  totalDuration: number;
  success: boolean;
}

class ModelChaining {
  private models: Map<string, ModelConfig> = new Map();
  private chains: Map<string, ChainResult> = new Map();
  
  constructor() {
    this.initializeModels();
  }
  
  /**
   * Initialize available models
   */
  private initializeModels(): void {
    const models: ModelConfig[] = [
      {
        id: 'analysis',
        name: 'Analysis Model',
        type: 'analysis',
        temperature: 0.3,
        maxTokens: 2000,
        specialization: ['vulnerability', 'exploit', 'analysis', 'pattern'],
      },
      {
        id: 'generation',
        name: 'Generation Model',
        type: 'generation',
        temperature: 0.7,
        maxTokens: 4000,
        specialization: ['code', 'script', 'payload', 'exploit'],
      },
      {
        id: 'execution',
        name: 'Execution Model',
        type: 'execution',
        temperature: 0.2,
        maxTokens: 1000,
        specialization: ['command', 'execution', 'terminal', 'bash'],
      },
      {
        id: 'optimization',
        name: 'Optimization Model',
        type: 'optimization',
        temperature: 0.5,
        maxTokens: 2000,
        specialization: ['optimization', 'improvement', 'efficiency', 'performance'],
      },
    ];
    
    for (const model of models) {
      this.models.set(model.id, model);
    }
  }
  
  /**
   * Select best model for task
   */
  selectModel(task: string, specializations: string[] = []): ModelConfig {
    // Score each model based on task and specializations
    let bestModel = this.models.get('analysis')!;
    let bestScore = 0;
    
    for (const [id, model] of this.models) {
      let score = 0;
      
      // Check specializations
      for (const spec of specializations) {
        if (model.specialization.includes(spec)) {
          score += 10;
        }
      }
      
      // Check task keywords
      if (task.toLowerCase().includes('analyze')) score += 5;
      if (task.toLowerCase().includes('generate')) score += 5;
      if (task.toLowerCase().includes('execute')) score += 5;
      if (task.toLowerCase().includes('optimize')) score += 5;
      
      if (score > bestScore) {
        bestScore = score;
        bestModel = model;
      }
    }
    
    return bestModel;
  }
  
  /**
   * Invoke a single model
   */
  async invokeModel(
    modelId: string,
    prompt: string,
    systemPrompt?: string
  ): Promise<string> {
    const model = this.models.get(modelId);
    if (!model) throw new Error(`Model ${modelId} not found`);
    
    const messages = [
      { role: "system" as const, content: systemPrompt || `You are a ${model.name}. Specialize in: ${model.specialization.join(', ')}` },
      { role: "user" as const, content: prompt },
    ];
    
    const response = await invokeLLM({ messages });
    const content = response.choices[0].message.content;
    
    return typeof content === 'string' ? content : '';
  }
  
  /**
   * Chain multiple models together
   */
  async chainModels(
    tasks: Array<{ modelId: string; prompt: string; systemPrompt?: string }>,
    passOutput: boolean = true
  ): Promise<ChainResult> {
    const chainId = `chain-${Date.now()}`;
    const steps: ChainStep[] = [];
    const startTime = Date.now();
    let currentOutput = '';
    
    for (let i = 0; i < tasks.length; i++) {
      const task = tasks[i];
      const stepStartTime = Date.now();
      
      // If passOutput is true, append previous output to current prompt
      let finalPrompt = task.prompt;
      if (passOutput && i > 0) {
        finalPrompt = `Previous output:\n${currentOutput}\n\nNow: ${task.prompt}`;
      }
      
      try {
        const output = await this.invokeModel(task.modelId, finalPrompt, task.systemPrompt);
        const stepDuration = Date.now() - stepStartTime;
        
        steps.push({
          modelId: task.modelId,
          input: finalPrompt,
          output,
          timestamp: new Date().toISOString(),
          duration: stepDuration,
        });
        
        currentOutput = output;
      } catch (error) {
        throw new Error(`Chain failed at step ${i}: ${String(error)}`);
      }
    }
    
    const totalDuration = Date.now() - startTime;
    const result: ChainResult = {
      chainId,
      steps,
      finalOutput: currentOutput,
      totalDuration,
      success: true,
    };
    
    this.chains.set(chainId, result);
    return result;
  }
  
  /**
   * Intelligent chain for exploit generation
   */
  async generateExploitChain(target: string, vulnerability: string): Promise<ChainResult> {
    return this.chainModels([
      {
        modelId: 'analysis',
        prompt: `Analyze this vulnerability: ${vulnerability} on target: ${target}. What are the key attack vectors?`,
        systemPrompt: 'You are a security analyst. Provide detailed vulnerability analysis.',
      },
      {
        modelId: 'generation',
        prompt: `Based on the analysis, generate an exploit payload for this vulnerability.`,
        systemPrompt: 'You are an exploit developer. Generate working exploit code.',
      },
      {
        modelId: 'optimization',
        prompt: `Optimize this exploit for speed and reliability. What improvements can be made?`,
        systemPrompt: 'You are an optimization expert. Improve the exploit code.',
      },
      {
        modelId: 'execution',
        prompt: `Provide the final command to execute this exploit.`,
        systemPrompt: 'You are an execution specialist. Provide the exact command.',
      },
    ], true);
  }
  
  /**
   * Intelligent chain for privilege escalation
   */
  async generatePrivEscChain(currentLevel: number, targetLevel: number): Promise<ChainResult> {
    return this.chainModels([
      {
        modelId: 'analysis',
        prompt: `Analyze privilege escalation from level ${currentLevel} to ${targetLevel}. What methods are available?`,
        systemPrompt: 'You are a privilege escalation expert.',
      },
      {
        modelId: 'generation',
        prompt: `Generate the privilege escalation exploit code.`,
        systemPrompt: 'You are an exploit developer.',
      },
      {
        modelId: 'execution',
        prompt: `Provide the exact commands to execute this privilege escalation.`,
        systemPrompt: 'You are an execution specialist.',
      },
    ], true);
  }
  
  /**
   * Get chain result
   */
  getChainResult(chainId: string): ChainResult | undefined {
    return this.chains.get(chainId);
  }
  
  /**
   * Get all chains
   */
  getAllChains(): ChainResult[] {
    return Array.from(this.chains.values());
  }
  
  /**
   * Get model info
   */
  getModelInfo(modelId: string): ModelConfig | undefined {
    return this.models.get(modelId);
  }
  
  /**
   * List all models
   */
  listModels(): ModelConfig[] {
    return Array.from(this.models.values());
  }
}

export const modelChaining = new ModelChaining();
