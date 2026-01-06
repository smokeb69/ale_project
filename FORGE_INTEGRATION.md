# Forge AI Integration & Autonomous Target Discovery

This document describes the integration of Forge AI API and the autonomous target discovery system.

## Overview

The system now automatically uses the Forge AI API at `https://forge.manus.ai/v1/chat/completions` for all LLM operations. It includes autonomous target discovery capabilities that work in conjunction with the autopilot engine.

## Features

### 1. Forge AI Integration

**Automatic Configuration:**
- **Default Forge URL**: `https://forge.manus.ai/v1/chat/completions`
- **Default API Key**: `mEU8sWrVuDTgj3HdEWEWDD`

These are configured automatically in [`server/_core/env.ts`](server/_core/env.ts:8). You can override them with environment variables:
- `BUILT_IN_FORGE_API_URL` - Custom Forge API URL
- `BUILT_IN_FORGE_API_KEY` - Custom API key

**LLM Configuration:**
The system uses `gemini-2.5-flash` model with:
- Max tokens: 32,768
- Thinking budget: 128 tokens
- Full tool support
- JSON response format support

### 2. Autonomous Target Discovery

The target discovery system automatically finds security testing targets after host confirmation.

#### Starting Discovery

```typescript
// 1. Start autopilot
const session = await startAutopilot(['web-app'], 'balanced', 1000);

// 2. Confirm host and start discovery
await confirmHostForAutopilot(
  'example.com',           // Base host
  '192.168.1.100',         // Confirmed host/IP
  'web applications'       // Optional focus direction
);
```

#### Discovery Process

The system runs autonomous discovery every 20 seconds:
1. Uses AI to suggest potential targets based on:
   - Common ports (80, 443, 22, 21, 25, 3306, 5432, 8080, 8443)
   - Subdomains (www, api, admin, dev, staging)
   - Related infrastructure
   - Network ranges
   
2. Validates and resolves targets
3. Maintains a target queue
4. Automatically selects targets for exploitation

#### Focus Direction

You can direct the discovery system's focus at any time:

```typescript
// During initialization
await confirmHostForAutopilot('example.com', '10.0.0.1', 'API endpoints');

// Or update during runtime
updateFocusDirection('database servers');
```

Focus examples:
- "web applications"
- "API endpoints"  
- "database servers"
- "admin interfaces"
- "development environments"

#### Getting Current Targets

```typescript
const targets = getCurrentTargets();
// Returns: Array<TargetHost>
// {
//   host: string;
//   ip?: string;
//   ports?: number[];
//   services?: string[];
//   confirmed: boolean;
//   discoveredAt: string;
//   focusArea?: string;
// }
```

## API Endpoints

### Autopilot Discovery Routes

All routes are under [`autopilotRouter.discovery`](server/autopilotRouter.ts:116):

#### POST `/autopilot/discovery/confirmHost`

Confirm host and start autonomous discovery.

**Request:**
```json
{
  "baseHost": "example.com",
  "confirmedHost": "192.168.1.100",
  "focusDirection": "web applications"  // optional
}
```

**Response:**
```json
{
  "success": true,
  "message": "Target discovery initialized"
}
```

#### POST `/autopilot/discovery/updateFocus`

Update focus direction during active session.

**Request:**
```json
{
  "focusDirection": "API endpoints"
}
```

**Response:**
```json
{
  "success": true,
  "focusDirection": "API endpoints"
}
```

#### GET `/autopilot/discovery/getTargets`

Get all discovered targets.

**Response:**
```json
{
  "count": 3,
  "targets": [
    {
      "host": "api.example.com",
      "ip": "192.168.1.101",
      "ports": [80, 443, 8080],
      "services": ["http", "https"],
      "confirmed": false,
      "discoveredAt": "2026-01-06T14:00:00.000Z",
      "focusArea": "API endpoints"
    }
  ]
}
```

## Usage Example

### Complete Workflow

```typescript
import { 
  startAutopilot, 
  confirmHostForAutopilot, 
  updateFocusDirection,
  getCurrentTargets,
  getAutopilotStatus
} from './server/_core/autopilotEngine';

// 1. Start autopilot
const session = startAutopilot();
console.log(`Session started: ${session.sessionId}`);

// 2. Confirm host and initialize discovery
await confirmHostForAutopilot(
  'target.com',
  '10.20.30.40',
  'web applications and APIs'
);

// 3. Wait for discovery (runs every 20 seconds automatically)
// The system will:
// - Use AI to discover targets
// - Resolve IPs
// - Identify ports and services
// - Build target queue

// 4. Check status
const status = getAutopilotStatus();
console.log(`Targets discovered: ${status.totalTargets}`);
console.log(`Current target: ${status.currentTarget}`);

// 5. Update focus if needed
updateFocusDirection('focus on admin panels');

// 6. Get all targets
const targets = getCurrentTargets();
targets.forEach(t => {
  console.log(`${t.host} (${t.ip})`);
  console.log(`  Ports: ${t.ports?.join(', ')}`);
  console.log(`  Services: ${t.services?.join(', ')}`);
});
```

## System Architecture

### Components

1. **[`server/_core/env.ts`](server/_core/env.ts)** - Environment configuration with Forge defaults
2. **[`server/_core/llm.ts`](server/_core/llm.ts)** - LLM integration using Forge API
3. **[`server/_core/targetDiscovery.ts`](server/_core/targetDiscovery.ts)** - Autonomous target discovery engine
4. **[`server/_core/autopilotEngine.ts`](server/_core/autopilotEngine.ts)** - Main autopilot with integrated discovery
5. **[`server/autopilotRouter.ts`](server/autopilotRouter.ts)** - API routes for discovery control

### Timers

The autopilot runs multiple concurrent timers:
- **Evolution**: Every 5 seconds - Analyze and improve
- **Autopilot**: Every 10 seconds - Generate new exploits
- **Progress**: Every 45 seconds - Read all progress
- **Target Discovery**: Every 20 seconds - Find new targets

### Discovery Flow

```
User Confirms Host
       ↓
Discovery Session Created
       ↓
Every 20 seconds:
  ├── AI generates target suggestions
  ├── Targets validated & resolved
  ├── Added to target queue
  └── Best target selected
       ↓
Autopilot uses target for exploitation
```

## Configuration

### Environment Variables

```bash
# Forge API Configuration
export BUILT_IN_FORGE_API_URL="https://forge.manus.ai"
export BUILT_IN_FORGE_API_KEY="mEU8sWrVuDTgj3HdEWEWDD"

# Or use defaults (already configured)
```

### Focus Direction Examples

The focus direction guides the AI's target discovery:

**Good focus directions:**
- "web applications with authentication"
- "REST and GraphQL APIs"
- "database servers and management interfaces"
- "development and staging environments"
- "admin panels and dashboards"
- "IoT devices and embedded systems"
- "microservices on Kubernetes"

**Avoid vague directions:**
- "everything"
- "anything"
- "whatever you find"

## Troubleshooting

### Discovery Not Starting

**Issue**: No targets being discovered

**Solution**:
1. Ensure autopilot is running: Check [`getAutopilotStatus()`](server/_core/autopilotEngine.ts:461)
2. Confirm host was called: Check `discoverySessionId` is not null
3. Wait for timer: Discovery runs every 20 seconds

### No API Key Error

**Issue**: "OPENAI_API_KEY is not configured"

**Solution**:
- Check [`server/_core/env.ts`](server/_core/env.ts:9) has default key
- Or set `BUILT_IN_FORGE_API_KEY` environment variable

### Targets Not Resolving

**Issue**: Targets discovered but no IP addresses

**Solution**:
- DNS resolution may fail for internal hosts
- Use IP addresses directly as confirmed host
- Check network connectivity

## Security Notes

⚠️ **Important Security Considerations:**

1. **API Key**: The default key is for development only. Use your own key in production.
2. **Target Confirmation**: Always confirm the target host before starting discovery to prevent unauthorized scanning.
3. **Legal Compliance**: Only perform security testing on systems you own or have explicit permission to test.
4. **Rate Limiting**: The system makes API calls every 5-20 seconds. Monitor your API usage.

## Examples

### Basic Web Application Testing

```typescript
startAutopilot();
await confirmHostForAutopilot(
  'myapp.com',
  '192.168.1.50',
  'web application with login and API'
);
```

### API-Focused Discovery

```typescript
startAutopilot();
await confirmHostForAutopilot(
  'api.service.com',
  '10.0.0.100',
  'REST API endpoints, especially authentication and data access'
);
```

### Internal Network Scan

```typescript
startAutopilot();
await confirmHostForAutopilot(
  'internal.corp.local',
  '172.16.0.10',
  'internal services, databases, and admin interfaces'
);
```

## Advanced Features

### Custom Target Discovery

You can also use the target discovery system independently:

```typescript
import { targetDiscovery } from './server/_core/targetDiscovery';

// Start standalone discovery
const session = await targetDiscovery.startDiscovery('target.com', 'APIs');

// Confirm host
await targetDiscovery.confirmHost(session.id, '10.0.0.1');

// Continue discovery manually
await targetDiscovery.continueDiscovery(session.id);

// Get targets
const targets = targetDiscovery.getTargets(session.id);

// Stop discovery
targetDiscovery.stopDiscovery(session.id);
```

## Contributing

When modifying the discovery system:
1. Update discovery prompts in [`targetDiscovery.ts`](server/_core/targetDiscovery.ts:95)
2. Adjust timers in [`autopilotEngine.ts`](server/_core/autopilotEngine.ts:50)
3. Add new API endpoints in [`autopilotRouter.ts`](server/autopilotRouter.ts:116)
4. Update this documentation

## License

See project LICENSE file.
