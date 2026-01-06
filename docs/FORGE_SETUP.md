# ALE Forge - Cross-Platform Security Testing Setup

## ⚠️ CRITICAL SECURITY NOTICE

**THIS TOOL IS FOR AUTHORIZED PENETRATION TESTING ONLY**

You must have:
- Explicit written authorization to test target systems
- Clear scope definition with in-scope and out-of-scope items
- Legal documentation approving security testing activities
- Emergency contacts and incident response procedures

**UNAUTHORIZED USE IS ILLEGAL AND UNETHICAL**

## Overview

ALE Forge is a cross-platform, multi-terminal security testing orchestrator that works on:
- Windows (PowerShell, CMD)
- Linux (Bash, Sh)
- macOS (Zsh, Bash)

### Key Features

1. **Authorization Management**: Register targets with authorization documentation
2. **Self-Targeting Prevention**: Automatically prevents testing of the host system
3. **Multi-Terminal Execution**: Run commands across multiple terminal sessions simultaneously
4. **Cross-Platform Support**: Automatic command translation for different operating systems
5. **Structured Phases**: Organized reconnaissance, scanning, and exploitation phases
6. **Findings Tracking**: Automatic detection and classification of security findings

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
# or
pnpm install
```

### 2. Register a Target System

Before testing any system, you must register it with proper authorization:

```typescript
import { targetConfiguration } from './server/_core/targetConfiguration';

// Register a target
const target = targetConfiguration.registerTarget({
  name: 'Test Lab Server',
  host: '192.168.1.100',
  port: 22,
  os: 'linux',
  authorized: true,
  authorizationDocument: '/path/to/authorization.pdf',
  authorizationDate: '2026-01-06',
  authorizedBy: 'Security Manager Name',
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

console.log('Target registered:', target.id);
```

### 3. Generate Authorization Template

Use the built-in template generator to create proper authorization documentation:

```typescript
const template = targetConfiguration.generateAuthorizationTemplate(
  '192.168.1.100',
  'Test Lab Server'
);

console.log(template);
// Save to file and have it signed by authorized personnel
```

### 4. Start a Forge Session

Once authorization is in place, start a testing session:

```typescript
import { forgeOrchestrator } from './server/_core/forgeOrchestrator';

const session = await forgeOrchestrator.startSession({
  targetId: 'target-xxxxx', // ID from registration
  phases: ['recon', 'scan'],
  maxTerminals: 5,
  timeout: 60000,
  autoExploit: false, // Set to false for safe mode
  safeMode: true      // Prevents exploitation phase
});

console.log('Session started:', session.id);
```

### 5. Monitor Session Progress

```typescript
// Get session status
const status = forgeOrchestrator.getSession(session.id);
console.log('Current phase:', status?.currentPhase);
console.log('Status:', status?.status);
console.log('Findings:', status?.findings.length);

// Generate report
const report = forgeOrchestrator.generateReport(session.id);
console.log(report);
```

## Safety Features

### Self-Targeting Prevention

The system automatically detects and prevents targeting of:
- localhost / 127.0.0.1 / ::1
- System hostname
- All network interface IP addresses
- Common localhost aliases

Attempts to target the host system will result in immediate rejection:

```
SECURITY ERROR: Self-targeting detected. Cannot target this system.
```

### Authorization Validation

Every session start validates:
1. Target is registered
2. Target has authorization documentation
3. Authorization is not expired (warning at 90+ days)
4. Target is not the host system

### Abort Capability

Sessions can be aborted at any time:

```typescript
forgeOrchestrator.abortSession(session.id);
```

This immediately:
- Changes session status to 'aborted'
- Stops all running phases
- Closes all terminal sessions

## Cross-Platform Command Translation

Commands are automatically translated based on target OS:

| Linux/macOS | Windows | Description |
|-------------|---------|-------------|
| `ls -la` | `dir /a` | List files |
| `cat file.txt` | `type file.txt` | Show file contents |
| `ps aux` | `tasklist /v` | List processes |
| `ifconfig` | `ipconfig` | Network interfaces |
| `whoami` | `whoami` | Current user |

## Multi-Terminal Execution

Execute commands across multiple terminals simultaneously:

```typescript
import { crossPlatformTerminal } from './server/_core/crossPlatformTerminal';

// Parallel execution
const results = await crossPlatformTerminal.executeParallel([
  { command: 'systeminfo', targetHost: '192.168.1.100' },
  { command: 'netstat -ano', targetHost: '192.168.1.100' },
  { command: 'tasklist /v', targetHost: '192.168.1.100' }
]);

results.forEach(({ sessionId, result }) => {
  console.log(`Session ${sessionId}:`, result.output);
});
```

## Configuration Examples

### Example 1: Basic Reconnaissance

```typescript
const config = {
  targetId: 'target-123',
  phases: ['recon'],
  maxTerminals: 3,
  timeout: 30000,
  autoExploit: false,
  safeMode: true
};
```

### Example 2: Full Assessment (Authorized Only)

```typescript
const config = {
  targetId: 'target-123',
  phases: ['recon', 'scan', 'exploit', 'post-exploit'],
  maxTerminals: 10,
  timeout: 120000,
  autoExploit: true,
  safeMode: false
};
```

## Findings Classification

Findings are automatically classified by:

### Severity Levels
- **Critical**: Immediate exploitation possible, severe impact
- **High**: Exploitation likely, significant impact
- **Medium**: Exploitation possible with conditions, moderate impact
- **Low**: Minor security issue, limited impact
- **Info**: Informational finding, no immediate risk

### Finding Types
- **vulnerability**: Exploitable security weakness
- **misconfiguration**: Insecure configuration
- **credential**: Exposed credentials or secrets
- **service**: Running service information
- **file**: Sensitive file access
- **network**: Network configuration or connectivity

## Reporting

Generate comprehensive reports after testing:

```typescript
const report = forgeOrchestrator.generateReport(session.id);

// Save to file
import * as fs from 'fs';
fs.writeFileSync('security-report.md', report);
```

Reports include:
- Session information and timeline
- Findings summary with severity breakdown
- Detailed findings with evidence
- Phase execution details
- Errors and warnings

## Best Practices

### Before Testing

1. ✅ Obtain written authorization
2. ✅ Define clear scope boundaries
3. ✅ Register target with documentation
4. ✅ Test in isolated/lab environment first
5. ✅ Have incident response plan ready

### During Testing

1. ✅ Monitor session progress
2. ✅ Document all findings
3. ✅ Stay within defined scope
4. ✅ Use safe mode for initial reconnaissance
5. ✅ Have emergency abort ready

### After Testing

1. ✅ Generate and review reports
2. ✅ Archive session data securely
3. ✅ Provide findings to stakeholders
4. ✅ Recommend remediation steps
5. ✅ Clean up any test artifacts

## Troubleshooting

### "Target not found" Error

Ensure target is registered:
```typescript
const targets = targetConfiguration.getAllTargets();
console.log(targets);
```

### "Self-targeting detected" Error

You cannot target the system running ALE Forge. Use a separate target system.

### Command Failures

Check platform compatibility:
```typescript
const platformInfo = crossPlatformTerminal.getPlatformInfo();
console.log(platformInfo);
```

## Legal Disclaimer

This tool is designed for authorized security testing and research purposes only. Users are solely responsible for:

- Obtaining proper authorization before testing
- Complying with all applicable laws and regulations
- Ensuring testing activities remain within defined scope
- Preventing unauthorized access or damage to systems
- Maintaining confidentiality of discovered vulnerabilities

Misuse of this tool may result in criminal prosecution, civil liability, and professional sanctions.

## Support

For questions or issues:
1. Review this documentation
2. Check error messages carefully
3. Verify authorization and scope
4. Contact your security team lead

---

**Remember: Authorization first, testing second, responsibility always.**
