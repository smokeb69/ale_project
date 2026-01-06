/**
 * AUTONOMOUS TARGET DISCOVERY
 * Finds targets automatically after host confirmation
 * Supports focus direction from user input
 */

import { invokeLLM } from './llm';
import * as dns from 'dns';
import { promisify } from 'util';

const dnsResolve = promisify(dns.resolve4);
const dnsReverse = promisify(dns.reverse);

export interface TargetHost {
  host: string;
  ip?: string;
  ports?: number[];
  services?: string[];
  confirmed: boolean;
  discoveredAt: string;
  focusArea?: string;
}

export interface DiscoverySession {
  id: string;
  baseHost: string;
  confirmedHost: string | null;
  targets: TargetHost[];
  focusDirection?: string;
  isActive: boolean;
  startTime: number;
  discoveryCount: number;
}

// Active discovery sessions
const sessions = new Map<string, DiscoverySession>();

/**
 * Start a new discovery session with host confirmation
 */
export async function startDiscovery(baseHost: string, focusDirection?: string): Promise<DiscoverySession> {
  const sessionId = `discovery-${Date.now()}`;
  
  const session: DiscoverySession = {
    id: sessionId,
    baseHost,
    confirmedHost: null,
    targets: [],
    focusDirection,
    isActive: true,
    startTime: Date.now(),
    discoveryCount: 0,
  };
  
  sessions.set(sessionId, session);
  
  console.log('\n🎯 TARGET DISCOVERY SESSION STARTED');
  console.log(`Session ID: ${sessionId}`);
  console.log(`Base Host: ${baseHost}`);
  if (focusDirection) {
    console.log(`Focus Direction: ${focusDirection}`);
  }
  console.log('Waiting for host confirmation...\n');
  
  return session;
}

/**
 * Confirm host and start autonomous target finding
 */
export async function confirmHost(sessionId: string, confirmedHost: string): Promise<void> {
  const session = sessions.get(sessionId);
  if (!session) {
    throw new Error(`Session ${sessionId} not found`);
  }
  
  session.confirmedHost = confirmedHost;
  
  console.log('\n✅ HOST CONFIRMED');
  console.log(`Confirmed Host: ${confirmedHost}`);
  console.log('Starting autonomous target discovery...\n');
  
  // Start autonomous discovery
  await autonomousDiscovery(sessionId);
}

/**
 * Update focus direction during active session
 */
export function updateFocus(sessionId: string, focusDirection: string): void {
  const session = sessions.get(sessionId);
  if (!session) {
    throw new Error(`Session ${sessionId} not found`);
  }
  
  session.focusDirection = focusDirection;
  console.log(`\n🎯 FOCUS UPDATED: ${focusDirection}\n`);
}

/**
 * Autonomous target discovery using AI
 */
async function autonomousDiscovery(sessionId: string): Promise<void> {
  const session = sessions.get(sessionId);
  if (!session || !session.confirmedHost) return;
  
  session.discoveryCount++;
  
  try {
    // Build discovery prompt
    const discoveryPrompt = buildDiscoveryPrompt(session);
    
    // Use LLM to suggest targets
    const messages = [
      {
        role: "system" as const,
        content: "You are an autonomous security testing target discovery system. Generate a JSON list of potential targets based on the confirmed host. Focus on common ports, services, and subdomains.",
      },
      {
        role: "user" as const,
        content: discoveryPrompt,
      },
    ];
    
    const response = await invokeLLM({
      messages,
      responseFormat: { type: "json_object" },
    });
    
    const content = typeof response.choices[0].message.content === 'string'
      ? response.choices[0].message.content
      : '';
    
    // Parse AI response
    const discovered = parseDiscoveryResponse(content);
    
    // Validate and add targets
    for (const target of discovered) {
      await addTarget(sessionId, target);
    }
    
    console.log(`\n🔍 Discovery Round #${session.discoveryCount} Complete`);
    console.log(`Total Targets Found: ${session.targets.length}\n`);
    
  } catch (error) {
    console.error('Discovery error:', error);
  }
}

/**
 * Build discovery prompt based on session context
 */
function buildDiscoveryPrompt(session: DiscoverySession): string {
  let prompt = `Confirmed Host: ${session.confirmedHost}

Discover potential security testing targets. Generate a JSON object with this structure:
{
  "targets": [
    {
      "host": "target.example.com or IP",
      "ports": [80, 443, 8080],
      "services": ["http", "https", "ssh"],
      "reasoning": "Why this target is relevant"
    }
  ]
}

Consider:
- Common ports (80, 443, 22, 21, 25, 3306, 5432, 8080, 8443)
- Subdomains (www, api, admin, dev, staging)
- Related infrastructure
- Network ranges`;
  
  if (session.focusDirection) {
    prompt += `\n\nFOCUS DIRECTION: ${session.focusDirection}
Focus your discovery on targets related to: ${session.focusDirection}`;
  }
  
  if (session.targets.length > 0) {
    prompt += `\n\nPreviously discovered targets (find NEW ones):
${session.targets.slice(0, 5).map(t => `- ${t.host}`).join('\n')}`;
  }
  
  return prompt;
}

/**
 * Parse AI discovery response
 */
function parseDiscoveryResponse(content: string): Partial<TargetHost>[] {
  try {
    const parsed = JSON.parse(content);
    if (parsed.targets && Array.isArray(parsed.targets)) {
      return parsed.targets.map((t: any) => ({
        host: t.host || t.hostname || '',
        ports: Array.isArray(t.ports) ? t.ports : [],
        services: Array.isArray(t.services) ? t.services : [],
      }));
    }
  } catch (e) {
    console.error('Failed to parse discovery response:', e);
  }
  return [];
}

/**
 * Add target to session
 */
async function addTarget(sessionId: string, target: Partial<TargetHost>): Promise<void> {
  const session = sessions.get(sessionId);
  if (!session || !target.host) return;
  
  // Check for duplicates
  const exists = session.targets.some(t => t.host === target.host);
  if (exists) return;
  
  // Try to resolve IP
  let ip: string | undefined;
  try {
    const addresses = await dnsResolve(target.host);
    ip = addresses[0];
  } catch (e) {
    // Not resolvable, might be IP already
    ip = target.host;
  }
  
  const newTarget: TargetHost = {
    host: target.host,
    ip,
    ports: target.ports || [],
    services: target.services || [],
    confirmed: false,
    discoveredAt: new Date().toISOString(),
    focusArea: session.focusDirection,
  };
  
  session.targets.push(newTarget);
  
  console.log(`➕ New Target: ${newTarget.host} (${newTarget.ip || 'unresolved'})`);
  if (newTarget.ports.length > 0) {
    console.log(`   Ports: ${newTarget.ports.join(', ')}`);
  }
  if (newTarget.services.length > 0) {
    console.log(`   Services: ${newTarget.services.join(', ')}`);
  }
}

/**
 * Continue autonomous discovery (call this periodically)
 */
export async function continueDiscovery(sessionId: string): Promise<void> {
  const session = sessions.get(sessionId);
  if (!session || !session.isActive || !session.confirmedHost) return;
  
  await autonomousDiscovery(sessionId);
}

/**
 * Stop discovery session
 */
export function stopDiscovery(sessionId: string): void {
  const session = sessions.get(sessionId);
  if (session) {
    session.isActive = false;
    console.log(`\n🛑 Discovery session ${sessionId} stopped`);
    console.log(`Total targets discovered: ${session.targets.length}\n`);
  }
}

/**
 * Get session status
 */
export function getSessionStatus(sessionId: string): DiscoverySession | null {
  return sessions.get(sessionId) || null;
}

/**
 * Get all active sessions
 */
export function getActiveSessions(): DiscoverySession[] {
  return Array.from(sessions.values()).filter(s => s.isActive);
}

/**
 * Get targets from session
 */
export function getTargets(sessionId: string): TargetHost[] {
  const session = sessions.get(sessionId);
  return session ? session.targets : [];
}

/**
 * Confirm a discovered target
 */
export function confirmTarget(sessionId: string, host: string): boolean {
  const session = sessions.get(sessionId);
  if (!session) return false;
  
  const target = session.targets.find(t => t.host === host);
  if (target) {
    target.confirmed = true;
    console.log(`✅ Target confirmed: ${host}`);
    return true;
  }
  
  return false;
}

/**
 * Quick scan ports on a target
 */
export async function quickScan(host: string, ports: number[]): Promise<{ port: number; open: boolean }[]> {
  // Note: In a real implementation, you'd use actual port scanning
  // For now, return mock data
  console.log(`\n🔍 Quick scanning ${host}...`);
  
  return ports.map(port => ({
    port,
    open: Math.random() > 0.5, // Mock: randomly mark as open/closed
  }));
}

export const targetDiscovery = {
  startDiscovery,
  confirmHost,
  updateFocus,
  continueDiscovery,
  stopDiscovery,
  getSessionStatus,
  getActiveSessions,
  getTargets,
  confirmTarget,
  quickScan,
};
