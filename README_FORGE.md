# ALE Forge - Cross-Platform Security Testing Framework

## ⚠️ CRITICAL LEGAL NOTICE

**THIS SOFTWARE IS FOR AUTHORIZED SECURITY TESTING ONLY**

Use of this software without proper authorization is **ILLEGAL** and may result in:
- Criminal prosecution under computer fraud and abuse laws
- Civil liability for damages
- Professional sanctions and loss of certifications
- Severe legal penalties including imprisonment

You are **SOLELY RESPONSIBLE** for:
1. Obtaining explicit written authorization before testing
2. Staying within defined scope boundaries
3. Complying with all applicable laws and regulations
4. Preventing unauthorized access or damage
5. Maintaining confidentiality of vulnerabilities discovered

## Overview

ALE Forge is a next-generation, cross-platform security testing orchestrator that enables authorized penetration testers to conduct comprehensive security assessments on Windows, Linux, and macOS systems.

### Key Features

✅ **Cross-Platform Support**
- Native Windows (PowerShell/CMD) support
- Linux (Bash/Sh) compatibility
- macOS (Zsh/Bash) support
- Automatic command translation between platforms

✅ **Authorization Management**
- Mandatory target registration with documentation
- Authorization expiration tracking
- Scope definition (in-scope and out-of-scope)
- Audit trail for all activities

✅ **Self-Targeting Prevention**
- Automatic detection of localhost/127.0.0.1
- Network interface IP detection
- Hostname-based protection
- Pattern matching for local system indicators

✅ **Multi-Terminal Orchestration**
- Execute commands across multiple terminals simultaneously
- Parallel execution for faster reconnaissance
- Session management and history tracking
- Platform-specific command libraries

✅ **Structured Testing Phases**
- **Reconnaissance**: Gather system information
- **Scanning**: Identify vulnerabilities and misconfigurations
- **Exploitation**: Attempt to exploit discovered issues (requires explicit authorization)
- **Post-Exploitation**: Maintain access and gather additional data

✅ **Automated Findings Detection**
- Credential discovery
- Vulnerability identification
- Misconfiguration detection
- Service enumeration
- Severity classification (Critical → Info)

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    ALE Forge Orchestrator                    │
│  (forgeOrchestrator.ts)                                     │
│  - Session management                                        │
│  - Phase execution                                           │
│  - Findings analysis                                         │
└───────────────┬─────────────────────────────┬───────────────┘
                │                             │
    ┌───────────▼─────────────┐   ┌──────────▼──────────────┐
    │ Target Configuration    │   │ Cross-Platform Terminal │
    │ (targetConfiguration.ts)│   │ (crossPlatformTerminal) │
    │ - Authorization checks  │   │ - Multi-terminal mgmt   │
    │ - Self-target prevention│   │ - Command translation   │
    │ - Scope validation      │   │ - Platform detection    │
    └─────────────────────────┘   └─────────────────────────┘
```

## Installation

```bash
# Clone the repository
git clone https://github.com/smokeb69/ale_project.git
cd ale_project

# Install dependencies
pnpm install

# Build the project
pnpm build
```

## Quick Start

### 1. Register an Authorized Target

```typescript
import { targetConfiguration } from './server/_core/targetConfiguration';

// CRITICAL: Only register systems you are AUTHORIZED to test
const target = targetConfiguration.registerTarget({
  name: 'Test Lab Server',
  host: '192.168.1.100',
  port: 22,
  os: 'linux',
  authorized: true,
  authorizationDocument: '/path/to/signed-authorization.pdf',
  authorizationDate: new Date().toISOString(),
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

console.log('Target ID:', target.id);
```

### 2. Start a Security Assessment

```typescript
import { forgeOrchestrator } from './server/_core/forgeOrchestrator';

const session = await forgeOrchestrator.startSession({
  targetId: target.id,
  phases: ['recon', 'scan'],
  maxTerminals: 5,
  timeout: 60000,
  autoExploit: false,
  safeMode: true  // Recommended for initial assessment
});

console.log('Session started:', session.id);
```

### 3. Monitor Progress and Generate Report

```typescript
// Check session status
const status = forgeOrchestrator.getSession(session.id);
console.log('Status:', status?.status);
console.log('Findings:', status?.findings.length);

// Generate detailed report
const report = forgeOrchestrator.generateReport(session.id);
console.log(report);
```

## Component Details

### Target Configuration System

**Purpose**: Manage authorized targets and prevent self-targeting

**Key Functions**:
- `registerTarget()`: Register a new target with authorization
- `validateTarget()`: Validate target before operations
- `getAuthorizedTargets()`: List all authorized targets
- `revokeAuthorization()`: Revoke target authorization
- `generateAuthorizationTemplate()`: Create authorization document template

**Self-Targeting Prevention**:
```typescript
// These will ALL be rejected:
- localhost
- 127.0.0.1
- ::1
- System hostname
- All network interface IPs
```

### Cross-Platform Terminal Manager

**Purpose**: Execute commands across Windows, Linux, and macOS

**Key Functions**:
- `createSession()`: Create a new terminal session
- `executeCommand()`: Execute a single command
- `executeSequence()`: Execute commands sequentially
- `executeParallel()`: Execute commands in parallel
- `getPlatformCommands()`: Get platform-specific command library

**Command Translation Example**:
```typescript
// Linux/macOS → Windows
'ls -la'         → 'dir /a'
'cat file.txt'   → 'type file.txt'
'ps aux'         → 'tasklist /v'
'ifconfig'       → 'ipconfig'
```

### Forge Orchestrator

**Purpose**: Coordinate multi-phase security assessments

**Phases**:
1. **Reconnaissance** - System information gathering
2. **Scanning** - Vulnerability identification
3. **Exploitation** - Exploit attempts (requires authorization)
4. **Post-Exploitation** - Access maintenance and data collection

**Safety Controls**:
- Authorization validation before session start
- Self-targeting prevention
- Scope boundary enforcement
- Safe mode option (disables exploitation)
- Session abort capability

## API Endpoints (tRPC)

### Target Management
- `forge.registerTarget` - Register a new target
- `forge.listTargets` - List all targets
- `forge.validateTarget` - Validate a target
- `forge.deleteTarget` - Remove a target
- `forge.generateAuthTemplate` - Generate authorization template

### Session Management
- `forge.startSession` - Start a new assessment session
- `forge.getSession` - Get session status
- `forge.listSessions` - List all sessions
- `forge.abortSession` - Abort a running session
- `forge.generateReport` - Generate assessment report

### Terminal Operations
- `forge.createTerminal` - Create a new terminal session
- `forge.executeCommand` - Execute a command
- `forge.executeParallel` - Execute commands in parallel
- `forge.getTerminalHistory` - Get command history
- `forge.closeTerminal` - Close a terminal session

## Configuration Options

### Forge Session Config

```typescript
interface ForgeConfig {
  targetId: string;        // Target system ID
  phases: string[];        // Phases to execute
  maxTerminals: number;    // Max concurrent terminals
  timeout: number;         // Command timeout (ms)
  autoExploit: boolean;    // Enable exploitation phase
  safeMode: boolean;       // Disable dangerous operations
}
```

### Recommended Settings

**Initial Reconnaissance** (Safest):
```typescript
{
  phases: ['recon'],
  maxTerminals: 3,
  timeout: 30000,
  autoExploit: false,
  safeMode: true
}
```

**Full Assessment** (Requires Authorization):
```typescript
{
  phases: ['recon', 'scan', 'exploit', 'post-exploit'],
  maxTerminals: 10,
  timeout: 120000,
  autoExploit: true,
  safeMode: false
}
```

## Security Best Practices

### Before Testing

1. ✅ Obtain written authorization
2. ✅ Define clear scope with in-scope and out-of-scope items
3. ✅ Review and understand legal restrictions
4. ✅ Set up incident response procedures
5. ✅ Test in isolated lab environment first

### During Testing

1. ✅ Stay within defined scope
2. ✅ Monitor session progress
3. ✅ Document all findings
4. ✅ Use safe mode initially
5. ✅ Have abort capability ready

### After Testing

1. ✅ Generate and review reports
2. ✅ Provide findings to stakeholders
3. ✅ Recommend remediation steps
4. ✅ Archive data securely
5. ✅ Clean up test artifacts

## Examples

See [`examples/forge-example.ts`](examples/forge-example.ts) for complete working examples including:
- Target registration
- Self-targeting prevention demonstration
- Multi-terminal execution
- Full assessment workflow

## Documentation

- [`docs/FORGE_SETUP.md`](docs/FORGE_SETUP.md) - Detailed setup guide
- [`examples/forge-example.ts`](examples/forge-example.ts) - Working code examples
- API documentation in source files

## Platform Compatibility

| Platform | Tested | Shell Support | Command Translation |
|----------|--------|---------------|---------------------|
| Windows 10/11 | ✅ | PowerShell, CMD | ✅ |
| Ubuntu 20.04+ | ✅ | Bash, Sh | ✅ |
| Debian 10+ | ✅ | Bash, Sh | ✅ |
| macOS 11+ | ✅ | Zsh, Bash | ✅ |

## Troubleshooting

### "Target not found" Error
Target must be registered before use. Check with `targetConfiguration.getAllTargets()`.

### "Self-targeting detected" Error
You cannot target the system running ALE Forge. Use a separate target system.

### "Authorization required" Error
Target must have `authorized: true` and `authorizationDocument` set.

### Command Execution Failures
Check platform compatibility and use `getPlatformInfo()` to verify environment.

## Contributing

Contributions are welcome! Please:
1. Follow the existing code style
2. Add tests for new features
3. Update documentation
4. Ensure security controls remain intact

## License

MIT License - See LICENSE file

## Disclaimer

This software is provided "as is" without warranty of any kind. The authors and contributors are not responsible for any misuse, damage, or legal consequences resulting from the use of this software. Users assume all responsibility and liability for their actions.

## Support

For issues, questions, or feature requests:
- Open an issue on GitHub
- Review documentation in `docs/` directory
- Check examples in `examples/` directory

---

**Remember: With great power comes great responsibility. Always obtain proper authorization before testing any system.**
