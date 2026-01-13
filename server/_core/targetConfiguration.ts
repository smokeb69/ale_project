/**
 * Target Configuration System
 * Manages authorized target systems and prevents self-targeting
 * 
 * IMPORTANT: This system is for AUTHORIZED penetration testing only.
 * You must have explicit written permission to test any target system.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export interface TargetSystem {
  id: string;
  name: string;
  host: string;
  port?: number;
  os: 'windows' | 'linux' | 'macos' | 'unknown';
  authorized: boolean;
  authorizationDocument?: string;
  authorizationDate?: string;
  authorizedBy?: string;
  scope: string[];
  outOfScope: string[];
  notes: string;
  createdAt: string;
  lastVerified?: string;
}

export interface TargetValidationResult {
  isValid: boolean;
  isSelfTarget: boolean;
  isAuthorized: boolean;
  errors: string[];
  warnings: string[];
}

class TargetConfiguration {
  private targets: Map<string, TargetSystem> = new Map();
  private configPath: string = '/home/ubuntu/ale_project/targets';
  private selfIdentifiers: Set<string> = new Set();
  
  constructor() {
    this.initializeConfiguration();
    this.detectSelfIdentifiers();
  }
  
  /**
   * Initialize configuration directories
   */
  private initializeConfiguration(): void {
    try {
      if (!fs.existsSync(this.configPath)) {
        fs.mkdirSync(this.configPath, { recursive: true });
      }
      this.loadTargets();
      console.log('Target configuration system initialized');
    } catch (error) {
      console.error('Failed to initialize target configuration:', error);
    }
  }
  
  /**
   * Detect identifiers that represent this system
   * CRITICAL: Prevents self-targeting attacks
   */
  private detectSelfIdentifiers(): void {
    try {
      // Add localhost variations
      this.selfIdentifiers.add('localhost');
      this.selfIdentifiers.add('127.0.0.1');
      this.selfIdentifiers.add('::1');
      this.selfIdentifiers.add('0.0.0.0');
      
      // Add system hostname
      const hostname = os.hostname();
      this.selfIdentifiers.add(hostname);
      this.selfIdentifiers.add(hostname.toLowerCase());
      
      // Add network interfaces
      const interfaces = os.networkInterfaces();
      for (const [name, addrs] of Object.entries(interfaces)) {
        if (addrs && Array.isArray(addrs)) {
          for (const addr of addrs) {
            if (addr && addr.address) {
              this.selfIdentifiers.add(addr.address);
            }
          }
        }
      }
      
      console.log(`Self-identifiers detected: ${this.selfIdentifiers.size} unique identifiers`);
    } catch (error) {
      console.error('Failed to detect self-identifiers:', error);
    }
  }
  
  /**
   * Register a new target system
   * Requires authorization documentation
   */
  registerTarget(target: Omit<TargetSystem, 'id' | 'createdAt'>): TargetSystem {
    // Validate target is not self
    const validation = this.validateTarget(target.host);
    if (validation.isSelfTarget) {
      throw new Error('SECURITY ERROR: Cannot register self as target. Self-targeting is strictly prohibited.');
    }
    
    if (!target.authorized || !target.authorizationDocument) {
      throw new Error('AUTHORIZATION ERROR: Target must be authorized with documentation. Provide authorization document path or reference.');
    }
    
    const newTarget: TargetSystem = {
      ...target,
      id: `target-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
    };
    
    this.targets.set(newTarget.id, newTarget);
    this.persistTarget(newTarget);
    
    return newTarget;
  }
  
  /**
   * Validate target before any operations
   * CRITICAL SECURITY FUNCTION
   */
  validateTarget(host: string): TargetValidationResult {
    const result: TargetValidationResult = {
      isValid: false,
      isSelfTarget: false,
      isAuthorized: false,
      errors: [],
      warnings: [],
    };
    
    // Check if target is self
    const normalizedHost = host.toLowerCase().trim();
    if (this.selfIdentifiers.has(normalizedHost)) {
      result.isSelfTarget = true;
      result.errors.push('Target is identified as self-system. Self-targeting is prohibited.');
      return result;
    }
    
    // Check for localhost patterns
    const localhostPatterns = [
      /^localhost$/i,
      /^127\.\d+\.\d+\.\d+$/,
      /^::1$/,
      /^0\.0\.0\.0$/,
      /^local$/i,
    ];
    
    for (const pattern of localhostPatterns) {
      if (pattern.test(normalizedHost)) {
        result.isSelfTarget = true;
        result.errors.push('Target matches localhost pattern. Self-targeting is prohibited.');
        return result;
      }
    }
    
    // Check if target is registered and authorized
    const registeredTarget = this.findTargetByHost(host);
    if (!registeredTarget) {
      result.errors.push('Target is not registered. All targets must be registered with authorization.');
      return result;
    }
    
    if (!registeredTarget.authorized) {
      result.errors.push('Target is registered but not authorized. Authorization required.');
      return result;
    }
    
    // Verify authorization is not expired (if date provided)
    if (registeredTarget.authorizationDate) {
      const authDate = new Date(registeredTarget.authorizationDate);
      const daysSinceAuth = (Date.now() - authDate.getTime()) / (1000 * 60 * 60 * 24);
      
      if (daysSinceAuth > 90) {
        result.warnings.push('Authorization is older than 90 days. Consider re-verification.');
      }
    }
    
    result.isValid = true;
    result.isAuthorized = true;
    return result;
  }
  
  /**
   * Find target by host
   */
  private findTargetByHost(host: string): TargetSystem | undefined {
    const normalizedHost = host.toLowerCase().trim();
    return Array.from(this.targets.values()).find(
      t => t.host.toLowerCase().trim() === normalizedHost
    );
  }
  
  /**
   * Get target by ID
   */
  getTarget(targetId: string): TargetSystem | undefined {
    return this.targets.get(targetId);
  }
  
  /**
   * Get all registered targets
   */
  getAllTargets(): TargetSystem[] {
    return Array.from(this.targets.values());
  }
  
  /**
   * Get authorized targets only
   */
  getAuthorizedTargets(): TargetSystem[] {
    return Array.from(this.targets.values()).filter(t => t.authorized);
  }
  
  /**
   * Update target authorization
   */
  updateAuthorization(
    targetId: string, 
    authorizationDocument: string,
    authorizedBy: string
  ): void {
    const target = this.targets.get(targetId);
    if (!target) {
      throw new Error('Target not found');
    }
    
    target.authorized = true;
    target.authorizationDocument = authorizationDocument;
    target.authorizationDate = new Date().toISOString();
    target.authorizedBy = authorizedBy;
    target.lastVerified = new Date().toISOString();
    
    this.persistTarget(target);
  }
  
  /**
   * Revoke target authorization
   */
  revokeAuthorization(targetId: string, reason: string): void {
    const target = this.targets.get(targetId);
    if (!target) {
      throw new Error('Target not found');
    }
    
    target.authorized = false;
    target.notes = `Authorization revoked: ${reason}\n${target.notes}`;
    
    this.persistTarget(target);
  }
  
  /**
   * Delete target
   */
  deleteTarget(targetId: string): void {
    const target = this.targets.get(targetId);
    if (!target) {
      throw new Error('Target not found');
    }
    
    this.targets.delete(targetId);
    
    try {
      const targetPath = path.join(this.configPath, `target_${targetId}.json`);
      if (fs.existsSync(targetPath)) {
        fs.unlinkSync(targetPath);
      }
    } catch (error) {
      console.error('Failed to delete target file:', error);
    }
  }
  
  /**
   * Persist target to disk
   */
  private persistTarget(target: TargetSystem): void {
    try {
      const targetPath = path.join(this.configPath, `target_${target.id}.json`);
      fs.writeFileSync(targetPath, JSON.stringify(target, null, 2));
    } catch (error) {
      console.error('Failed to persist target:', error);
    }
  }
  
  /**
   * Load targets from disk
   */
  private loadTargets(): void {
    try {
      if (fs.existsSync(this.configPath)) {
        const files = fs.readdirSync(this.configPath);
        for (const file of files) {
          if (file.startsWith('target_') && file.endsWith('.json')) {
            const filePath = path.join(this.configPath, file);
            const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
            this.targets.set(data.id, data);
          }
        }
        console.log(`Loaded ${this.targets.size} target configurations`);
      }
    } catch (error) {
      console.error('Failed to load targets:', error);
    }
  }
  
  /**
   * Export targets for backup
   */
  exportTargets(): string {
    const targets = Array.from(this.targets.values());
    return JSON.stringify(targets, null, 2);
  }
  
  /**
   * Import targets from backup
   */
  importTargets(jsonData: string): number {
    try {
      const targets = JSON.parse(jsonData) as TargetSystem[];
      let imported = 0;
      
      for (const target of targets) {
        // Validate before import
        const validation = this.validateTarget(target.host);
        if (validation.isSelfTarget) {
          console.warn(`Skipping self-target: ${target.host}`);
          continue;
        }
        
        this.targets.set(target.id, target);
        this.persistTarget(target);
        imported++;
      }
      
      return imported;
    } catch (error) {
      console.error('Failed to import targets:', error);
      return 0;
    }
  }
  
  /**
   * Get self-identifiers for debugging
   */
  getSelfIdentifiers(): string[] {
    return Array.from(this.selfIdentifiers);
  }
  
  /**
   * Generate authorization template
   */
  generateAuthorizationTemplate(targetHost: string, targetName: string): string {
    return `# Penetration Testing Authorization

## Target Information
- **Target System**: ${targetName}
- **Target Host**: ${targetHost}
- **Authorization Date**: ${new Date().toISOString()}
- **Authorized By**: [Name and Title]
- **Organization**: [Organization Name]

## Scope
- [List specific systems, networks, or applications authorized for testing]
- [Include IP ranges, domains, or specific endpoints]

## Out of Scope
- [List systems, networks, or applications that are OFF-LIMITS]
- [Include any restricted areas or forbidden actions]

## Testing Window
- **Start Date**: [Date]
- **End Date**: [Date]
- **Time Restrictions**: [Any time-based restrictions]

## Authorized Actions
- [ ] Network scanning
- [ ] Vulnerability assessment
- [ ] Exploitation of discovered vulnerabilities
- [ ] Privilege escalation attempts
- [ ] Lateral movement (within scope)
- [ ] Data exfiltration simulation
- [ ] Denial of service testing (with restrictions)

## Restrictions
- No testing of production systems during business hours
- No data destruction or modification without approval
- All actions must be logged
- Immediate notification required for critical findings

## Contact Information
- **Primary Contact**: [Name, Email, Phone]
- **Emergency Contact**: [Name, Email, Phone]

## Legal Acknowledgment
This document authorizes the named penetration tester to conduct security testing
on the specified systems. All testing must comply with applicable laws and regulations.

**Authorized Signature**: ___________________________
**Date**: ___________________________
`;
  }
}

// Singleton instance
export const targetConfiguration = new TargetConfiguration();
