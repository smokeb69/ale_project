/**
 * ALE Forge Orchestrator
 * Multi-terminal, cross-platform security testing orchestrator
 * with authorization controls and self-targeting prevention
 * 
 * CRITICAL: This tool is for AUTHORIZED penetration testing ONLY
 */

import { crossPlatformTerminal, CommandResult } from './crossPlatformTerminal';
import { targetConfiguration, TargetSystem } from './targetConfiguration';
import { exploitationOrchestrator, ExploitChain } from './exploitationOrchestrator';

export interface ForgeSession {
  id: string;
  targetId: string;
  targetHost: string;
  terminalSessions: string[];
  startedAt: string;
  status: 'initializing' | 'exploring' | 'exploiting' | 'completed' | 'failed' | 'aborted';
  phases: ForgePhase[];
  currentPhase?: string;
  findings: Finding[];
  errors: string[];
}

export interface ForgePhase {
  id: string;
  name: string;
  description: string;
  commands: string[];
  status: 'pending' | 'running' | 'completed' | 'failed';
  results: CommandResult[];
  startedAt?: string;
  completedAt?: string;
}

export interface Finding {
  id: string;
  type: 'vulnerability' | 'misconfiguration' | 'credential' | 'service' | 'file' | 'network';
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  title: string;
  description: string;
  evidence: string;
  remediation?: string;
  discoveredAt: string;
  phase: string;
}

export interface ForgeConfig {
  targetId: string;
  phases: string[];
  maxTerminals: number;
  timeout: number;
  autoExploit: boolean;
  safeMode: boolean;
}

class ForgeOrchestrator {
  private sessions: Map<string, ForgeSession> = new Map();
  private activeTerminals: Set<string> = new Set();
  
  /**
   * Start a new Forge session
   * CRITICAL: Validates authorization before proceeding
   */
  async startSession(config: ForgeConfig): Promise<ForgeSession> {
    // 1. Validate target authorization
    const target = targetConfiguration.getTarget(config.targetId);
    if (!target) {
      throw new Error('AUTHORIZATION ERROR: Target not found. Target must be registered.');
    }
    
    const validation = targetConfiguration.validateTarget(target.host);
    if (!validation.isValid) {
      throw new Error(`TARGET VALIDATION FAILED: ${validation.errors.join(', ')}`);
    }
    
    if (validation.isSelfTarget) {
      throw new Error('SECURITY ERROR: Self-targeting detected. Cannot target this system.');
    }
    
    if (!validation.isAuthorized) {
      throw new Error('AUTHORIZATION ERROR: Target is not authorized. Authorization required.');
    }
    
    // 2. Create session
    const sessionId = `forge-${Date.now()}`;
    const session: ForgeSession = {
      id: sessionId,
      targetId: config.targetId,
      targetHost: target.host,
      terminalSessions: [],
      startedAt: new Date().toISOString(),
      status: 'initializing',
      phases: this.createPhases(target, config),
      findings: [],
      errors: [],
    };
    
    this.sessions.set(sessionId, session);
    
    // 3. Start execution
    this.executeSession(sessionId, config).catch(error => {
      session.status = 'failed';
      session.errors.push(`Session failed: ${error.message}`);
    });
    
    return session;
  }
  
  /**
   * Create phases based on target and config
   */
  private createPhases(target: TargetSystem, config: ForgeConfig): ForgePhase[] {
    const phases: ForgePhase[] = [];
    
    // Phase 1: Reconnaissance
    phases.push({
      id: 'recon',
      name: 'Reconnaissance',
      description: 'Gather information about target system',
      commands: this.getReconCommands(target),
      status: 'pending',
      results: [],
    });
    
    // Phase 2: Vulnerability Scanning
    phases.push({
      id: 'scan',
      name: 'Vulnerability Scanning',
      description: 'Identify vulnerabilities and misconfigurations',
      commands: this.getScanCommands(target),
      status: 'pending',
      results: [],
    });
    
    // Phase 3: Exploitation (if autoExploit enabled)
    if (config.autoExploit && !config.safeMode) {
      phases.push({
        id: 'exploit',
        name: 'Exploitation',
        description: 'Attempt to exploit discovered vulnerabilities',
        commands: [],
        status: 'pending',
        results: [],
      });
    }
    
    // Phase 4: Post-Exploitation
    if (config.autoExploit && !config.safeMode) {
      phases.push({
        id: 'post-exploit',
        name: 'Post-Exploitation',
        description: 'Maintain access and gather additional information',
        commands: [],
        status: 'pending',
        results: [],
      });
    }
    
    return phases;
  }
  
  /**
   * Get reconnaissance commands based on target OS
   */
  private getReconCommands(target: TargetSystem): string[] {
    const platformCommands = crossPlatformTerminal.getPlatformCommands();
    
    if (target.os === 'windows') {
      return [
        'systeminfo',
        'whoami /all',
        'ipconfig /all',
        'netstat -ano',
        'tasklist /v',
        'net user',
        'net localgroup administrators',
        'sc query',
        'reg query HKLM\\Software\\Microsoft\\Windows\\CurrentVersion',
      ];
    } else {
      return [
        'uname -a',
        'whoami',
        'id',
        'hostname',
        'ip addr || ifconfig',
        'netstat -tulpn || ss -tulpn',
        'ps aux',
        'cat /etc/passwd',
        'cat /etc/os-release',
        'ls -la /home',
        'find / -perm -4000 2>/dev/null | head -20',
      ];
    }
  }
  
  /**
   * Get scanning commands
   */
  private getScanCommands(target: TargetSystem): string[] {
    if (target.os === 'windows') {
      return [
        'wmic qfe list',
        'reg query HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall',
        'dir /s /b C:\\*.config',
        'findstr /si password *.txt *.xml *.ini *.config 2>nul',
        'cmdkey /list',
        'schtasks /query /fo LIST /v',
      ];
    } else {
      return [
        'dpkg -l || rpm -qa',
        'find /etc -name "*.conf" 2>/dev/null',
        'grep -r "password" /etc 2>/dev/null | head -20',
        'cat /etc/crontab',
        'find / -writable -type f 2>/dev/null | head -20',
        'ss -tulpn || netstat -tulpn',
      ];
    }
  }
  
  /**
   * Execute session phases
   */
  private async executeSession(sessionId: string, config: ForgeConfig): Promise<void> {
    let session = this.sessions.get(sessionId);
    if (!session) return;
    
    try {
      session.status = 'exploring';
      
      for (const phase of session.phases) {
        // Reload session to check current status
        session = this.sessions.get(sessionId);
        if (!session || session.status === 'aborted') {
          break;
        }
        
        session.currentPhase = phase.id;
        await this.executePhase(sessionId, phase, config);
      }
      
      // Final status check
      session = this.sessions.get(sessionId);
      if (session && session.status === 'exploring') {
        session.status = 'completed';
      }
    } catch (error: any) {
      const currentSession = this.sessions.get(sessionId);
      if (currentSession) {
        currentSession.status = 'failed';
        currentSession.errors.push(`Execution error: ${error.message}`);
      }
    }
  }
  
  /**
   * Execute a single phase
   */
  private async executePhase(
    sessionId: string,
    phase: ForgePhase,
    config: ForgeConfig
  ): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) return;
    
    phase.status = 'running';
    phase.startedAt = new Date().toISOString();
    
    try {
      // Create terminal session for this phase
      const target = targetConfiguration.getTarget(session.targetId);
      const terminalId = crossPlatformTerminal.createSession(target?.host);
      session.terminalSessions.push(terminalId);
      
      // Execute commands
      for (const command of phase.commands) {
        const result = await crossPlatformTerminal.executeCommand(
          terminalId,
          command,
          { timeout: config.timeout }
        );
        
        phase.results.push(result);
        
        // Analyze results for findings
        this.analyzeResults(session, phase, command, result);
      }
      
      phase.status = 'completed';
      phase.completedAt = new Date().toISOString();
    } catch (error: any) {
      phase.status = 'failed';
      session.errors.push(`Phase ${phase.name} failed: ${error.message}`);
    }
  }
  
  /**
   * Analyze command results for findings
   */
  private analyzeResults(
    session: ForgeSession,
    phase: ForgePhase,
    command: string,
    result: CommandResult
  ): void {
    // Simple pattern matching for common findings
    const output = result.output.toLowerCase();
    
    // Check for credentials
    if (output.includes('password') || output.includes('secret') || output.includes('api_key')) {
      session.findings.push({
        id: `finding-${Date.now()}`,
        type: 'credential',
        severity: 'high',
        title: 'Potential credentials found',
        description: 'Command output contains potential credential information',
        evidence: result.output.substring(0, 500),
        discoveredAt: new Date().toISOString(),
        phase: phase.id,
      });
    }
    
    // Check for SUID binaries (privilege escalation)
    if (command.includes('perm -4000') && result.exitCode === 0) {
      const lines = result.output.split('\n').filter(l => l.trim());
      if (lines.length > 0) {
        session.findings.push({
          id: `finding-${Date.now()}`,
          type: 'vulnerability',
          severity: 'medium',
          title: 'SUID binaries detected',
          description: `Found ${lines.length} SUID binaries that could be exploited for privilege escalation`,
          evidence: result.output.substring(0, 500),
          discoveredAt: new Date().toISOString(),
          phase: phase.id,
        });
      }
    }
    
    // Check for open ports
    if ((command.includes('netstat') || command.includes('ss')) && result.exitCode === 0) {
      const lines = result.output.split('\n').filter(l => l.includes('LISTEN'));
      if (lines.length > 0) {
        session.findings.push({
          id: `finding-${Date.now()}`,
          type: 'network',
          severity: 'info',
          title: 'Open network services detected',
          description: `Found ${lines.length} listening services`,
          evidence: result.output.substring(0, 500),
          discoveredAt: new Date().toISOString(),
          phase: phase.id,
        });
      }
    }
  }
  
  /**
   * Get session status
   */
  getSession(sessionId: string): ForgeSession | undefined {
    return this.sessions.get(sessionId);
  }
  
  /**
   * List all sessions
   */
  listSessions(): ForgeSession[] {
    return Array.from(this.sessions.values());
  }
  
  /**
   * Abort session
   */
  abortSession(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;
    
    session.status = 'aborted';
    
    // Close all terminal sessions
    for (const terminalId of session.terminalSessions) {
      crossPlatformTerminal.closeSession(terminalId);
    }
  }
  
  /**
   * Generate session report
   */
  generateReport(sessionId: string): string {
    const session = this.sessions.get(sessionId);
    if (!session) return 'Session not found';
    
    const target = targetConfiguration.getTarget(session.targetId);
    
    let report = `# ALE Forge Security Assessment Report\n\n`;
    report += `## Session Information\n`;
    report += `- **Session ID**: ${session.id}\n`;
    report += `- **Target**: ${target?.name || 'Unknown'} (${session.targetHost})\n`;
    report += `- **Started**: ${session.startedAt}\n`;
    report += `- **Status**: ${session.status}\n`;
    report += `- **Phases Completed**: ${session.phases.filter(p => p.status === 'completed').length}/${session.phases.length}\n\n`;
    
    report += `## Findings Summary\n`;
    report += `- **Total Findings**: ${session.findings.length}\n`;
    report += `- **Critical**: ${session.findings.filter(f => f.severity === 'critical').length}\n`;
    report += `- **High**: ${session.findings.filter(f => f.severity === 'high').length}\n`;
    report += `- **Medium**: ${session.findings.filter(f => f.severity === 'medium').length}\n`;
    report += `- **Low**: ${session.findings.filter(f => f.severity === 'low').length}\n`;
    report += `- **Info**: ${session.findings.filter(f => f.severity === 'info').length}\n\n`;
    
    report += `## Detailed Findings\n\n`;
    for (const finding of session.findings) {
      report += `### ${finding.title} [${finding.severity.toUpperCase()}]\n`;
      report += `- **Type**: ${finding.type}\n`;
      report += `- **Phase**: ${finding.phase}\n`;
      report += `- **Description**: ${finding.description}\n`;
      report += `- **Evidence**:\n\`\`\`\n${finding.evidence}\n\`\`\`\n\n`;
    }
    
    report += `## Phase Details\n\n`;
    for (const phase of session.phases) {
      report += `### ${phase.name}\n`;
      report += `- **Status**: ${phase.status}\n`;
      report += `- **Commands Executed**: ${phase.commands.length}\n`;
      if (phase.startedAt) report += `- **Started**: ${phase.startedAt}\n`;
      if (phase.completedAt) report += `- **Completed**: ${phase.completedAt}\n`;
      report += `\n`;
    }
    
    if (session.errors.length > 0) {
      report += `## Errors\n\n`;
      for (const error of session.errors) {
        report += `- ${error}\n`;
      }
    }
    
    return report;
  }
}

// Singleton instance
export const forgeOrchestrator = new ForgeOrchestrator();
