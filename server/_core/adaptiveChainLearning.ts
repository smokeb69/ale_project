/**
 * Adaptive Exploit Chain Learning
 * Discovers new chains, learns from successes, and searches web for answers
 */

import * as fs from 'fs';
import * as path from 'path';
import fetch from 'node-fetch';

export interface ChainPattern {
  id: string;
  cveSequence: string[];
  successRate: number;
  frequency: number;
  lastSeen: string;
  contexts: string[];
  vectorEmbedding?: number[];
}

export interface WebAnswer {
  id: string;
  query: string;
  source: string;
  content: string;
  credibility: number;
  timestamp: string;
  vectorEmbedding?: number[];
}

export interface ChainMutation {
  id: string;
  parentChainId: string;
  mutation: string;
  successRate: number;
  tested: boolean;
  result?: 'success' | 'failure' | 'partial';
}

class AdaptiveChainLearning {
  private chainPatterns: Map<string, ChainPattern> = new Map();
  private webAnswers: Map<string, WebAnswer> = new Map();
  private chainMutations: Map<string, ChainMutation> = new Map();
  private vectorDatabase: Map<string, number[]> = new Map();
  private persistenceDir: string = '/home/ubuntu/ale_project/learning';
  
  constructor() {
    this.initializePersistence();
    this.loadPatterns();
  }
  
  /**
   * Initialize persistence directories
   */
  private initializePersistence(): void {
    try {
      if (!fs.existsSync(this.persistenceDir)) {
        fs.mkdirSync(this.persistenceDir, { recursive: true });
      }
      console.log('Adaptive learning persistence initialized');
    } catch (error) {
      console.error('Failed to initialize learning persistence:', error);
    }
  }
  
  /**
   * Discover chain patterns from execution history
   */
  discoverPatterns(executionHistory: any[]): ChainPattern[] {
    const patterns: Map<string, ChainPattern> = new Map();
    
    for (const execution of executionHistory) {
      if (execution.result === 'SUCCESS') {
        const cveKey = execution.cveSequence.join(',');
        
        if (patterns.has(cveKey)) {
          const pattern = patterns.get(cveKey)!;
          pattern.frequency++;
          pattern.successRate = (pattern.successRate * (pattern.frequency - 1) + 1) / pattern.frequency;
          pattern.lastSeen = new Date().toISOString();
        } else {
          patterns.set(cveKey, {
            id: `pattern-${Date.now()}`,
            cveSequence: execution.cveSequence,
            successRate: 1.0,
            frequency: 1,
            lastSeen: new Date().toISOString(),
            contexts: [execution.targetProfile]
          });
        }
      }
    }
    
    // Store patterns
    for (const [key, pattern] of patterns) {
      this.chainPatterns.set(key, pattern);
      this.persistPattern(pattern);
    }
    
    return Array.from(patterns.values());
  }
  
  /**
   * Search web for exploit answers
   */
  async searchWebForAnswers(query: string): Promise<WebAnswer[]> {
    try {
      const answers: WebAnswer[] = [];
      
      // Search multiple sources
      const sources = [
        { name: 'exploit-db', url: `https://www.exploit-db.com/search?q=${encodeURIComponent(query)}` },
        { name: 'github', url: `https://api.github.com/search/repositories?q=${encodeURIComponent(query)}+exploit` },
        { name: 'cvedetails', url: `https://www.cvedetails.com/cve-search.php?q=${encodeURIComponent(query)}` }
      ];
      
      for (const source of sources) {
        try {
          const response = await fetch(source.url, {
            headers: { 'User-Agent': 'ALE-Forge/1.0' },
            timeout: 5000
          });
          
          if (response.ok) {
            const content = await response.text();
            const answer: WebAnswer = {
              id: `answer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              query,
              source: source.name,
              content: content.substring(0, 1000),
              credibility: this.calculateCredibility(source.name, content),
              timestamp: new Date().toISOString()
            };
            
            answers.push(answer);
            this.webAnswers.set(answer.id, answer);
            this.persistAnswer(answer);
          }
        } catch (error) {
          console.error(`Failed to search ${source.name}:`, error);
        }
      }
      
      return answers;
    } catch (error) {
      console.error('Web search failed:', error);
      return [];
    }
  }
  
  /**
   * Calculate credibility score for web source
   */
  private calculateCredibility(source: string, content: string): number {
    let score = 0.5;
    
    if (source === 'exploit-db') score += 0.3;
    if (source === 'github') score += 0.2;
    if (source === 'cvedetails') score += 0.25;
    
    // Boost for technical content
    if (content.includes('CVE-') || content.includes('exploit') || content.includes('vulnerability')) {
      score += 0.1;
    }
    
    // Boost for recent content
    if (content.includes('2024') || content.includes('2025')) {
      score += 0.05;
    }
    
    return Math.min(1.0, score);
  }
  
  /**
   * Generate vector embedding for chain
   */
  generateChainEmbedding(cveSequence: string[]): number[] {
    // Simple embedding: hash-based vector
    const embedding: number[] = new Array(128).fill(0);
    
    for (let i = 0; i < cveSequence.length; i++) {
      const cve = cveSequence[i];
      const hash = this.simpleHash(cve);
      
      for (let j = 0; j < 128; j++) {
        embedding[j] += Math.sin(hash + j) * 0.1;
      }
    }
    
    // Normalize
    const magnitude = Math.sqrt(embedding.reduce((sum, v) => sum + v * v, 0));
    return embedding.map(v => v / magnitude);
  }
  
  /**
   * Simple hash function for CVE
   */
  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }
  
  /**
   * Calculate similarity between chains using vectors
   */
  calculateChainSimilarity(chain1: string[], chain2: string[]): number {
    const vec1 = this.generateChainEmbedding(chain1);
    const vec2 = this.generateChainEmbedding(chain2);
    
    // Cosine similarity
    let dotProduct = 0;
    for (let i = 0; i < vec1.length; i++) {
      dotProduct += vec1[i] * vec2[i];
    }
    
    return Math.max(0, Math.min(1, dotProduct));
  }
  
  /**
   * Find similar chains
   */
  findSimilarChains(targetChain: string[], threshold: number = 0.7): ChainPattern[] {
    const similar: ChainPattern[] = [];
    
    for (const pattern of this.chainPatterns.values()) {
      const similarity = this.calculateChainSimilarity(targetChain, pattern.cveSequence);
      if (similarity >= threshold) {
        similar.push(pattern);
      }
    }
    
    return similar.sort((a, b) => b.successRate - a.successRate);
  }
  
  /**
   * Generate chain mutations
   */
  generateMutations(parentChainId: string, parentChain: string[], count: number = 5): ChainMutation[] {
    const mutations: ChainMutation[] = [];
    
    for (let i = 0; i < count; i++) {
      const mutation = this.mutateCVESequence(parentChain);
      const mutationRecord: ChainMutation = {
        id: `mutation-${Date.now()}-${i}`,
        parentChainId,
        mutation: mutation.join(','),
        successRate: 0,
        tested: false
      };
      
      mutations.push(mutationRecord);
      this.chainMutations.set(mutationRecord.id, mutationRecord);
    }
    
    return mutations;
  }
  
  /**
   * Mutate CVE sequence
   */
  private mutateCVESequence(chain: string[]): string[] {
    const mutated = [...chain];
    const mutationType = Math.random();
    
    if (mutationType < 0.33) {
      // Swap two CVEs
      const i = Math.floor(Math.random() * mutated.length);
      const j = Math.floor(Math.random() * mutated.length);
      [mutated[i], mutated[j]] = [mutated[j], mutated[i]];
    } else if (mutationType < 0.66) {
      // Add a new CVE
      const newCVE = `CVE-${Math.floor(Math.random() * 10000)}-${Math.floor(Math.random() * 10000)}`;
      mutated.splice(Math.floor(Math.random() * mutated.length), 0, newCVE);
    } else {
      // Remove a CVE
      if (mutated.length > 1) {
        mutated.splice(Math.floor(Math.random() * mutated.length), 1);
      }
    }
    
    return mutated;
  }
  
  /**
   * Record mutation result
   */
  recordMutationResult(mutationId: string, result: 'success' | 'failure' | 'partial', successRate: number): void {
    const mutation = this.chainMutations.get(mutationId);
    if (mutation) {
      mutation.tested = true;
      mutation.result = result;
      mutation.successRate = successRate;
    }
  }
  
  /**
   * Get learning statistics
   */
  getStatistics(): {
    totalPatterns: number;
    totalAnswers: number;
    totalMutations: number;
    testedMutations: number;
    averageSuccessRate: number;
    topPatterns: ChainPattern[];
  } {
    const patterns = Array.from(this.chainPatterns.values());
    const mutations = Array.from(this.chainMutations.values());
    const testedMutations = mutations.filter(m => m.tested);
    
    const avgSuccessRate = patterns.length > 0
      ? patterns.reduce((sum, p) => sum + p.successRate, 0) / patterns.length
      : 0;
    
    const topPatterns = patterns
      .sort((a, b) => b.successRate - a.successRate)
      .slice(0, 5);
    
    return {
      totalPatterns: patterns.length,
      totalAnswers: this.webAnswers.size,
      totalMutations: mutations.length,
      testedMutations: testedMutations.length,
      averageSuccessRate: avgSuccessRate,
      topPatterns
    };
  }
  
  /**
   * Persist pattern to disk
   */
  private persistPattern(pattern: ChainPattern): void {
    try {
      const patternPath = path.join(this.persistenceDir, `pattern_${pattern.id}.json`);
      fs.writeFileSync(patternPath, JSON.stringify(pattern, null, 2));
    } catch (error) {
      console.error('Failed to persist pattern:', error);
    }
  }
  
  /**
   * Persist answer to disk
   */
  private persistAnswer(answer: WebAnswer): void {
    try {
      const answerPath = path.join(this.persistenceDir, `answer_${answer.id}.json`);
      fs.writeFileSync(answerPath, JSON.stringify(answer, null, 2));
    } catch (error) {
      console.error('Failed to persist answer:', error);
    }
  }
  
  /**
   * Load patterns from disk
   */
  private loadPatterns(): void {
    try {
      if (fs.existsSync(this.persistenceDir)) {
        const files = fs.readdirSync(this.persistenceDir);
        for (const file of files) {
          if (file.startsWith('pattern_') && file.endsWith('.json')) {
            const filePath = path.join(this.persistenceDir, file);
            const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
            this.chainPatterns.set(data.id, data);
          }
        }
        console.log(`Loaded ${this.chainPatterns.size} chain patterns`);
      }
    } catch (error) {
      console.error('Failed to load patterns:', error);
    }
  }
}

// Singleton instance
export const adaptiveChainLearning = new AdaptiveChainLearning();
