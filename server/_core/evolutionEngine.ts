/**
 * Evolution Engine - Autonomous Learning System
 * Tracks execution attempts, learns from successes/failures, and improves strategies
 */

export interface ExecutionAttempt {
  id: string;
  timestamp: string;
  cveId: string;
  targetHost: string;
  targetPort?: number;
  command: string;
  result: 'SUCCESS' | 'FAILED' | 'PARTIAL';
  outputLength: number;
  executionTime: number;
  errorMessage?: string;
  learningPoints: string[];
}

export interface SuccessfulExploit {
  id: string;
  cveId: string;
  exploitCommand: string;
  targetSoftware: string;
  targetVersion: string;
  successRate: number;
  timesSuccessful: number;
  timesFailed: number;
  averageExecutionTime: number;
  prerequisites: string[];
  notes: string;
}

export interface LearningProgress {
  totalAttempts: number;
  successfulAttempts: number;
  failedAttempts: number;
  successRate: number;
  mostSuccessfulCVE: string;
  leastSuccessfulCVE: string;
  averageExecutionTime: number;
  improvementTrend: number;
  learnedPatterns: string[];
}

class EvolutionEngine {
  private executionHistory: Map<string, ExecutionAttempt> = new Map();
  private successfulExploits: Map<string, SuccessfulExploit> = new Map();
  private learningDatabase: Map<string, string[]> = new Map();
  private performanceMetrics: Map<string, number[]> = new Map();
  
  /**
   * Record an execution attempt
   */
  recordAttempt(attempt: Omit<ExecutionAttempt, 'id' | 'timestamp'>): ExecutionAttempt {
    const record: ExecutionAttempt = {
      ...attempt,
      id: `exec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString()
    };
    
    this.executionHistory.set(record.id, record);
    this.updatePerformanceMetrics(record);
    
    if (record.result === 'SUCCESS') {
      this.storeSuccessfulExploit(record);
    }
    
    return record;
  }
  
  /**
   * Update performance metrics
   */
  private updatePerformanceMetrics(attempt: ExecutionAttempt): void {
    const key = `${attempt.cveId}:${attempt.targetHost}`;
    
    if (!this.performanceMetrics.has(key)) {
      this.performanceMetrics.set(key, []);
    }
    
    this.performanceMetrics.get(key)!.push(attempt.executionTime);
  }
  
  /**
   * Store successful exploit for future reuse
   */
  private storeSuccessfulExploit(attempt: ExecutionAttempt): void {
    const exploitKey = `${attempt.cveId}:${attempt.command}`;
    
    if (this.successfulExploits.has(exploitKey)) {
      const exploit = this.successfulExploits.get(exploitKey)!;
      exploit.timesSuccessful++;
      exploit.successRate = exploit.timesSuccessful / (exploit.timesSuccessful + exploit.timesFailed);
      exploit.averageExecutionTime = (exploit.averageExecutionTime + attempt.executionTime) / 2;
    } else {
      this.successfulExploits.set(exploitKey, {
        id: `exploit-${Date.now()}`,
        cveId: attempt.cveId,
        exploitCommand: attempt.command,
        targetSoftware: attempt.targetHost,
        targetVersion: '1.0',
        successRate: 1.0,
        timesSuccessful: 1,
        timesFailed: 0,
        averageExecutionTime: attempt.executionTime,
        prerequisites: attempt.learningPoints,
        notes: `First successful execution at ${attempt.timestamp}`
      });
    }
  }
  
  /**
   * Get successful exploits for a CVE
   */
  getSuccessfulExploits(cveId: string): SuccessfulExploit[] {
    return Array.from(this.successfulExploits.values())
      .filter(exploit => exploit.cveId === cveId)
      .sort((a, b) => b.successRate - a.successRate);
  }
  
  /**
   * Get learning progress
   */
  getLearningProgress(): LearningProgress {
    const attempts = Array.from(this.executionHistory.values());
    const successful = attempts.filter(a => a.result === 'SUCCESS').length;
    const failed = attempts.filter(a => a.result === 'FAILED').length;
    const total = attempts.length;
    
    // Calculate success rate
    const successRate = total > 0 ? (successful / total) * 100 : 0;
    
    // Find most and least successful CVEs
    const cveStats = new Map<string, { success: number; total: number }>();
    for (const attempt of attempts) {
      if (!cveStats.has(attempt.cveId)) {
        cveStats.set(attempt.cveId, { success: 0, total: 0 });
      }
      const stat = cveStats.get(attempt.cveId)!;
      stat.total++;
      if (attempt.result === 'SUCCESS') stat.success++;
    }
    
    const cveRates = Array.from(cveStats.entries())
      .map(([cve, stat]) => ({ cve, rate: stat.success / stat.total }))
      .sort((a, b) => b.rate - a.rate);
    
    const mostSuccessfulCVE = cveRates[0]?.cve || 'unknown';
    const leastSuccessfulCVE = cveRates[cveRates.length - 1]?.cve || 'unknown';
    
    // Calculate average execution time
    const avgTime = attempts.length > 0
      ? attempts.reduce((sum, a) => sum + a.executionTime, 0) / attempts.length
      : 0;
    
    // Calculate improvement trend (compare first 10 to last 10)
    const firstTen = attempts.slice(0, 10);
    const lastTen = attempts.slice(-10);
    const firstAvgSuccess = firstTen.filter(a => a.result === 'SUCCESS').length / firstTen.length;
    const lastAvgSuccess = lastTen.filter(a => a.result === 'SUCCESS').length / lastTen.length;
    const improvementTrend = (lastAvgSuccess - firstAvgSuccess) * 100;
    
    // Extract learned patterns
    const learnedPatterns = Array.from(new Set(
      attempts.flatMap(a => a.learningPoints)
    )).slice(0, 10);
    
    return {
      totalAttempts: total,
      successfulAttempts: successful,
      failedAttempts: failed,
      successRate,
      mostSuccessfulCVE,
      leastSuccessfulCVE,
      averageExecutionTime: avgTime,
      improvementTrend,
      learnedPatterns
    };
  }
  
  /**
   * Generate code improvement suggestions
   */
  generateCodeImprovements(): string[] {
    const progress = this.getLearningProgress();
    const suggestions: string[] = [];
    
    if (progress.successRate < 50) {
      suggestions.push('Success rate is below 50%. Review exploit commands and dependencies.');
    }
    
    if (progress.successRate > 80) {
      suggestions.push('Excellent success rate! Consider expanding to more CVEs.');
    }
    
    if (progress.improvementTrend > 10) {
      suggestions.push('System is improving! Continue current strategy.');
    }
    
    if (progress.improvementTrend < -10) {
      suggestions.push('Performance degrading. Review recent changes and rollback if needed.');
    }
    
    if (progress.averageExecutionTime > 5000) {
      suggestions.push('Execution times are high. Optimize command execution and reduce overhead.');
    }
    
    // CVE-specific suggestions
    const exploits = Array.from(this.successfulExploits.values());
    if (exploits.length > 0) {
      const topExploit = exploits.sort((a, b) => b.successRate - a.successRate)[0];
      suggestions.push(`Top performing exploit: ${topExploit.cveId} (${(topExploit.successRate * 100).toFixed(1)}% success rate)`);
    }
    
    return suggestions;
  }
  
  /**
   * Get execution history for analysis
   */
  getExecutionHistory(limit: number = 100): ExecutionAttempt[] {
    return Array.from(this.executionHistory.values())
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }
  
  /**
   * Analyze execution patterns
   */
  analyzePatterns(): {
    mostUsedCommands: Array<{ command: string; count: number }>;
    bestTimeToExecute: string;
    commonFailureReasons: string[];
    exploitationChains: string[][];
  } {
    const attempts = Array.from(this.executionHistory.values());
    
    // Most used commands
    const commandMap = new Map<string, number>();
    for (const attempt of attempts) {
      commandMap.set(attempt.command, (commandMap.get(attempt.command) || 0) + 1);
    }
    
    const mostUsedCommands = Array.from(commandMap.entries())
      .map(([command, count]) => ({ command, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
    
    // Best time to execute (based on success rate by hour)
    const hourMap = new Map<number, { success: number; total: number }>();
    for (const attempt of attempts) {
      const hour = new Date(attempt.timestamp).getHours();
      if (!hourMap.has(hour)) {
        hourMap.set(hour, { success: 0, total: 0 });
      }
      const stat = hourMap.get(hour)!;
      stat.total++;
      if (attempt.result === 'SUCCESS') stat.success++;
    }
    
    const bestHour = Array.from(hourMap.entries())
      .map(([hour, stat]) => ({ hour, rate: stat.success / stat.total }))
      .sort((a, b) => b.rate - a.rate)[0];
    
    const bestTimeToExecute = bestHour ? `${bestHour.hour}:00` : 'Unknown';
    
    // Common failure reasons
    const failureReasons = attempts
      .filter(a => a.result === 'FAILED' && a.errorMessage)
      .map(a => a.errorMessage!)
      .slice(0, 5);
    
    // Exploitation chains (sequences of successful exploits)
    const chains: string[][] = [];
    let currentChain: string[] = [];
    
    for (const attempt of attempts) {
      if (attempt.result === 'SUCCESS') {
        currentChain.push(attempt.cveId);
      } else if (currentChain.length > 0) {
        if (currentChain.length > 1) {
          chains.push([...currentChain]);
        }
        currentChain = [];
      }
    }
    
    return {
      mostUsedCommands,
      bestTimeToExecute,
      commonFailureReasons: failureReasons,
      exploitationChains: chains.slice(0, 5)
    };
  }
  
  /**
   * Get visualization data
   */
  getVisualizationData(): {
    successRateOverTime: Array<{ timestamp: string; rate: number }>;
    executionTimeOverTime: Array<{ timestamp: string; time: number }>;
    cveSuccessRates: Array<{ cve: string; rate: number }>;
  } {
    const attempts = Array.from(this.executionHistory.values())
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    
    // Success rate over time (rolling average)
    const successRateOverTime: Array<{ timestamp: string; rate: number }> = [];
    for (let i = 0; i < attempts.length; i += Math.max(1, Math.floor(attempts.length / 20))) {
      const window = attempts.slice(Math.max(0, i - 10), i + 1);
      const rate = window.filter(a => a.result === 'SUCCESS').length / window.length;
      successRateOverTime.push({
        timestamp: attempts[i].timestamp,
        rate: rate * 100
      });
    }
    
    // Execution time over time
    const executionTimeOverTime = attempts.map(a => ({
      timestamp: a.timestamp,
      time: a.executionTime
    }));
    
    // CVE success rates
    const cveStats = new Map<string, { success: number; total: number }>();
    for (const attempt of attempts) {
      if (!cveStats.has(attempt.cveId)) {
        cveStats.set(attempt.cveId, { success: 0, total: 0 });
      }
      const stat = cveStats.get(attempt.cveId)!;
      stat.total++;
      if (attempt.result === 'SUCCESS') stat.success++;
    }
    
    const cveSuccessRates = Array.from(cveStats.entries())
      .map(([cve, stat]) => ({
        cve,
        rate: (stat.success / stat.total) * 100
      }))
      .sort((a, b) => b.rate - a.rate);
    
    return {
      successRateOverTime,
      executionTimeOverTime,
      cveSuccessRates
    };
  }
}

// Singleton instance
export const evolutionEngine = new EvolutionEngine();
