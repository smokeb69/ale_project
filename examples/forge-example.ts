/**
 * ALE Forge - Example Usage
 * 
 * This example demonstrates how to use the cross-platform forge system
 * for authorized security testing.
 * 
 * IMPORTANT: Only run this against systems you are authorized to test!
 */

import { targetConfiguration } from '../server/_core/targetConfiguration';
import { forgeOrchestrator } from '../server/_core/forgeOrchestrator';
import { crossPlatformTerminal } from '../server/_core/crossPlatformTerminal';

async function exampleUsage() {
  console.log('=== ALE Forge Example ===\n');

  // Step 1: Register a target system
  console.log('Step 1: Registering target system...');
  
  try {
    const target = targetConfiguration.registerTarget({
      name: 'Test Lab Server',
      host: '192.168.1.100',
      port: 22,
      os: 'linux',
      authorized: true,
      authorizationDocument: '/path/to/authorization.pdf',
      authorizationDate: new Date().toISOString(),
      authorizedBy: 'Security Manager',
      scope: [
        '192.168.1.100',
        'Web application at http://192.168.1.100',
        'SSH service on port 22'
      ],
      outOfScope: [
        'Database server (192.168.1.101)',
        'Production systems',
        'User workstations'
      ],
      notes: 'Lab environment for security testing training'
    });
    
    console.log(`✓ Target registered: ${target.id}`);
    console.log(`  Name: ${target.name}`);
    console.log(`  Host: ${target.host}`);
    console.log(`  OS: ${target.os}\n`);

    // Step 2: Generate authorization template
    console.log('Step 2: Authorization template...');
    const template = targetConfiguration.generateAuthorizationTemplate(
      target.host,
      target.name
    );
    console.log('✓ Authorization template generated\n');

    // Step 3: Validate target (demonstrates self-protection)
    console.log('Step 3: Validating target...');
    const validation = targetConfiguration.validateTarget(target.host);
    console.log(`✓ Target validation result:`);
    console.log(`  Is Valid: ${validation.isValid}`);
    console.log(`  Is Self-Target: ${validation.isSelfTarget}`);
    console.log(`  Is Authorized: ${validation.isAuthorized}`);
    if (validation.warnings.length > 0) {
      console.log(`  Warnings: ${validation.warnings.join(', ')}`);
    }
    console.log();

    // Step 4: Start a forge session (safe mode)
    console.log('Step 4: Starting forge session in safe mode...');
    const session = await forgeOrchestrator.startSession({
      targetId: target.id,
      phases: ['recon', 'scan'],
      maxTerminals: 3,
      timeout: 30000,
      autoExploit: false,
      safeMode: true
    });
    
    console.log(`✓ Session started: ${session.id}`);
    console.log(`  Target: ${session.targetHost}`);
    console.log(`  Status: ${session.status}`);
    console.log(`  Phases: ${session.phases.map(p => p.name).join(', ')}\n`);

    // Step 5: Monitor session progress
    console.log('Step 5: Monitoring session...');
    
    // Wait for session to complete (with timeout)
    let attempts = 0;
    const maxAttempts = 60; // 60 seconds max
    
    while (attempts < maxAttempts) {
      const status = forgeOrchestrator.getSession(session.id);
      
      if (!status) {
        console.log('✗ Session not found');
        break;
      }
      
      console.log(`  Status: ${status.status}, Phase: ${status.currentPhase || 'none'}, Findings: ${status.findings.length}`);
      
      if (status.status === 'completed' || status.status === 'failed' || status.status === 'aborted') {
        console.log(`✓ Session ${status.status}\n`);
        break;
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      attempts++;
    }

    // Step 6: Generate report
    console.log('Step 6: Generating report...');
    const report = forgeOrchestrator.generateReport(session.id);
    console.log('✓ Report generated');
    console.log('\n--- Report Preview ---');
    console.log(report.substring(0, 500) + '...\n');

    // Step 7: Clean up
    console.log('Step 7: Cleaning up...');
    targetConfiguration.deleteTarget(target.id);
    console.log('✓ Target removed\n');

  } catch (error: any) {
    console.error('✗ Error:', error.message);
  }
}

// Example: Self-targeting prevention
async function exampleSelfTargetingPrevention() {
  console.log('\n=== Self-Targeting Prevention Example ===\n');

  try {
    // This should fail - attempting to target localhost
    const target = targetConfiguration.registerTarget({
      name: 'Localhost (SHOULD FAIL)',
      host: 'localhost',
      os: 'linux',
      authorized: true,
      authorizationDocument: '/fake/auth.pdf',
      authorizationDate: new Date().toISOString(),
      authorizedBy: 'Test',
      scope: ['localhost'],
      outOfScope: [],
      notes: 'This should be rejected'
    });
    
    console.log('✗ Self-targeting was not prevented! This is a security issue.');
  } catch (error: any) {
    console.log('✓ Self-targeting correctly prevented');
    console.log(`  Error: ${error.message}\n`);
  }
}

// Example: Multi-terminal execution
async function exampleMultiTerminal() {
  console.log('\n=== Multi-Terminal Execution Example ===\n');

  try {
    const platformInfo = crossPlatformTerminal.getPlatformInfo();
    console.log('Platform Information:');
    console.log(`  Platform: ${platformInfo.platform}`);
    console.log(`  Shell: ${platformInfo.defaultShell}`);
    console.log(`  Hostname: ${platformInfo.hostname}`);
    console.log(`  Architecture: ${platformInfo.arch}\n`);

    console.log('Creating terminal sessions...');
    const session1 = crossPlatformTerminal.createSession();
    const session2 = crossPlatformTerminal.createSession();
    const session3 = crossPlatformTerminal.createSession();
    console.log(`✓ Created 3 terminal sessions\n`);

    console.log('Executing commands in parallel...');
    const commands = [
      { sessionId: session1, command: platformInfo.platform === 'windows' ? 'echo Hello from terminal 1' : 'echo "Hello from terminal 1"' },
      { sessionId: session2, command: platformInfo.platform === 'windows' ? 'echo Hello from terminal 2' : 'echo "Hello from terminal 2"' },
      { sessionId: session3, command: platformInfo.platform === 'windows' ? 'echo Hello from terminal 3' : 'echo "Hello from terminal 3"' }
    ];

    const results = await Promise.all(
      commands.map(({ sessionId, command }) => 
        crossPlatformTerminal.executeCommand(sessionId, command)
      )
    );

    results.forEach((result, index) => {
      console.log(`  Terminal ${index + 1}: ${result.output.trim()} (${result.duration}ms)`);
    });
    console.log();

    // Cleanup
    crossPlatformTerminal.closeSession(session1);
    crossPlatformTerminal.closeSession(session2);
    crossPlatformTerminal.closeSession(session3);
    console.log('✓ Cleaned up terminal sessions\n');

  } catch (error: any) {
    console.error('✗ Error:', error.message);
  }
}

// Main execution
async function main() {
  console.log('\n╔══════════════════════════════════════════════════════════════════╗');
  console.log('║  ALE Forge - Cross-Platform Security Testing Framework          ║');
  console.log('║  FOR AUTHORIZED TESTING ONLY                                     ║');
  console.log('╚══════════════════════════════════════════════════════════════════╝\n');

  // Run examples
  await exampleSelfTargetingPrevention();
  await exampleMultiTerminal();
  await exampleUsage();

  console.log('═══════════════════════════════════════════════════════════════════\n');
  console.log('Examples completed. Remember: Authorization first, testing second!\n');
}

// Only run if executed directly
if (require.main === module) {
  main().catch(console.error);
}

export { exampleUsage, exampleSelfTargetingPrevention, exampleMultiTerminal };
