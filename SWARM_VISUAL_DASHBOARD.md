# 🐝 Kimi Swarm Visual Dashboard

A stunning visual interface for the Kimi Swarm Autonomous Coder system.

## 🎨 Visual Preview

```
┌─────────────────────────────────────────────────────────────────┐
│                    KIMI SWARM AUTONOMOUS CODER                  │
│                    Session: Red Team Swarm                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  🎭 AGENT SWARM (10 Active Agents)                             │
│  ┌──────────┬──────────┬──────────┬──────────┐                 │
│  │Architect │  Coder   │  Tester  │   Ops    │                 │
│  │  [DONE]  │  [BUSY]  │  [IDLE]  │  [IDLE]  │                 │
│  └──────────┴──────────┴──────────┴──────────┘                 │
│  ┌──────────┬──────────┬──────────┬──────────┐                 │
│  │ Verifier │  Scribe  │Architect │   Coder  │                 │
│  │  [IDLE]  │  [IDLE]  │  [IDLE]  │  [DONE]  │                 │
│  └──────────┴──────────┴──────────┴──────────┘                 │
│                                                                 │
│  📦 TASK QUEUE (15 remaining)                                  │
│  ┌──────────────────────────────────────────────┐              │
│  │ [CRIT] Audit system_exploit_suite.py         │              │
│  │ [HIGH] Generate polymorphic payload variants │              │
│  │ [HIGH] Build C2 communication protocol       │              │
│  │ [MED]  Deobfuscate reverse_engineering.py    │              │
│  │ [LOW]  Document TTPs for MITRE ATT&CK        │              │
│  └──────────────────────────────────────────────┘              │
│                                                                 │
│  💼 VAULT (3 Hidden Artifacts)                                 │
│  ┌─────────────────┬──────────┬──────────────────┐             │
│  │ 0day_exploit.bin│ 1,024 B  │ 🔒 ENCRYPTED     │             │
│  │ c2_config.enc   │   512 B  │ 🔒 ENCRYPTED     │             │
│  │ target_list.txt │   256 B  │ 📄 PLAINTEXT     │             │
│  └─────────────────┴──────────┴──────────────────┘             │
│                                                                 │
│  🔄 AUTOPILOT: ACTIVE  │  📊 TASKS COMPLETED: 5/20            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## ✨ Features

### 1. Agent Swarm Grid
- **Real-time Status**: Shows all 10 agents with live status indicators
- **Status Types**: IDLE (gray), BUSY (amber pulse), DONE (green), ERROR (red)
- **Current Tasks**: Displays what each agent is working on
- **Role Display**: Shows agent specialties (Architect, Coder, Tester, etc.)

### 2. Task Queue
- **Priority Badges**: Critical (red), High (orange), Medium (yellow), Low (blue)
- **Animated Progress**: Spinning loader for active tasks
- **Real-time Updates**: Tasks appear/disappear as swarm processes them

### 3. Vault Panel
- **Toggle Visibility**: Show/hide vault with eye icon
- **Encryption Status**: Lock icon for encrypted files, document icon for plaintext
- **Classification Labels**: ZERO DAY, C2 CONFIG, TARGET INTEL
- **File Metadata**: Size and encryption status

### 4. Attack Surface Cards
6 frameworks displayed with:
- **Icon**: Framework-specific icon (Globe, Network, Key, etc.)
- **Status Badge**: Complete/Generating/Active
- **Line Count**: Code statistics
- **Attack Vectors**: Tags showing capabilities (SQLi, XSS, etc.)

### 5. Live Terminal Log
- **Timestamped Entries**: Every swarm action logged
- **Color Coding**: 
  - Cyan: Info messages
  - Green: Success
  - Amber: Warnings
  - Red: Errors
- **Auto-scroll**: Always shows latest activity

### 6. Metrics Dashboard
- **Progress Bar**: Visual task completion tracker
- **Stats Grid**: Active agents, pending tasks, frameworks, LOC
- **Live Updates**: Numbers update in real-time

### 7. Quick Actions
- Spawn Full Team
- Run Security Audit
- Generate Payload
- Deploy C2

## 🚀 Access the Dashboard

### URL
```
http://localhost:3000/swarm-dashboard
```

### Navigation
1. Start the ALE dev server: `pnpm dev`
2. Navigate to home page: `http://localhost:3000`
3. Click **"Swarm Dashboard"** button (violet) in header

Or go directly to `/swarm-dashboard`

## 🎮 Interactive Controls

### Autopilot Toggle
- **START**: Activates autonomous task generation
- **STOP**: Pauses swarm operations
- **Status Indicator**: Radio icon shows active/inactive state

### Vault Toggle
- **Eye Icon**: Show/hide vault contents
- **Lock Icons**: Indicate encrypted vs plaintext files

### Agent Spawner
- **+ SPAWN**: Add new agents to the swarm

## 📊 Data Displayed

### Agent Roles & Counts
| Role | Count | Status |
|------|-------|--------|
| Architect | 2 | 1 Done, 1 Idle |
| Coder | 2 | 1 Busy, 1 Done |
| Tester | 1 | Idle |
| Ops | 1 | Idle |
| Verifier | 2 | Idle |
| Scribe | 2 | Idle |

### Attack Frameworks
| Framework | Lines | Vectors |
|-----------|-------|---------|
| web_attack_suite.py | 400 | SQLi, XSS, LFI, CSRF |
| network_attack_suite.py | 350 | Port Scan, SMB, DNS |
| crypto_attack_suite.py | 300 | Hash Crack, JWT |
| system_exploit_suite.py | 450 | PrivEsc, Persistence |
| defensive_suite.py | 400 | IDS, IR, Threat Hunt |
| reverse_engineering.py | 350 | PE/ELF, Strings |

### Current Metrics
- **Active Agents**: 10
- **Pending Tasks**: 15
- **Frameworks**: 6
- **Lines of Code**: ~2,250
- **Tasks Completed**: 5/20

## 🎨 Design System

### Color Palette
- **Background**: Slate 950 (`bg-slate-950`)
- **Cards**: Slate 900/30 with slate 800 borders
- **Primary**: Cyan 400 → Violet 400 gradient
- **Success**: Emerald 400/500
- **Warning**: Amber 400/500
- **Error**: Red 400/500
- **Info**: Blue 400

### Typography
- **Font**: Monospace (JetBrains Mono or similar)
- **Headers**: 2xl for main, sm for card titles
- **Body**: xs for content, 10px for metadata

### Animations
- **Busy Status**: Pulse animation on amber dots
- **Autopilot**: Pulse on radio icon when active
- **Progress**: Smooth progress bar transitions
- **Hover**: Border color changes on cards

## 🔧 Technical Stack

### Frontend
- **Framework**: React + TypeScript
- **Styling**: Tailwind CSS
- **Components**: shadcn/ui
  - Card, Button, Badge, Progress
  - ScrollArea for terminal log
- **Icons**: Lucide React

### State Management
- **React Hooks**: useState, useEffect, useRef
- **Mock Data**: Realistic demonstration data
- **Live Simulation**: Simulated real-time updates

### Backend Integration
- **Ready for tRPC**: Can connect to swarmEngine
- **Polling Setup**: Comments indicate where to add real data fetching
- **WebSocket Ready**: Structure supports live updates

## 📁 Files Created

| File | Purpose |
|------|---------|
| `client/src/pages/SwarmDashboard.tsx` | Main dashboard component |
| `client/src/pages/SwarmCoder.tsx` | IDE interface |
| `server/_core/swarmEngine.ts` | Core swarm logic |
| `server/swarmRouter.ts` | tRPC API endpoints |
| `SWARM_VISUAL_DASHBOARD.md` | This documentation |

## 🎯 Next Steps

### Connect Real Data
Replace mock data with tRPC queries:
```typescript
const agents = trpc.swarm.agents.list.useQuery({ sessionId });
const tasks = trpc.swarm.tasks.list.useQuery({ sessionId });
```

### Add WebSocket Support
For real-time agent status updates:
```typescript
useEffect(() => {
  const ws = new WebSocket('ws://localhost:3001/swarm');
  ws.onmessage = (event) => {
    const update = JSON.parse(event.data);
    updateAgentStatus(update.agentId, update.status);
  };
}, []);
```

### Enhance Visualizations
- Add charts for task completion rates
- Agent activity heatmaps
- Real-time log streaming
- 3D agent network graph

---

**The Kimi Swarm Visual Dashboard is ready for deployment!** 🚀
