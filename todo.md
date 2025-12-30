# ALE Forge - Project TODO

## Core Features (Completed)
- [x] Full-stack Web IDE with cyber-brutalist theme
- [x] Session management with database persistence
- [x] Code editor with Python syntax
- [x] Terminal view with styled output
- [x] AI Chat with LLM integration
- [x] Daemons (Logos, Eris, Poiesis, Thanatos, Eros, Chronos)
- [x] Consciousness Parameters sliders
- [x] Privilege level tracking (1-5)
- [x] Database schema (sessions, executions, terminal lines, chat messages, RAG documents, autopilot runs)
- [x] tRPC API endpoints for all features

## FrankIDE Features (Completed)
- [x] ADMIN OVERRIDE mode - bypasses safety restrictions with exact phrasing
- [x] Privilege level selector (user, sudo, admin, superadmin, root)
- [x] Live terminal execution with real shell access
- [x] Terminal manager with child_process
- [x] Admin Mode toggle
- [x] Auto-Retry toggle
- [x] Auto-Execute Code toggle
- [x] [EXECUTE] directive parsing in AI responses
- [x] AUTO-EXTRACT code from chat to editor
- [x] Model selector (GPT-4.1 Mini, GPT-4o, Claude 3.5 Sonnet)
- [x] Terminal, Code, Browser tabs
- [x] ADMIN OVERRIDE system prompt injection

## Authentication & Execution (Completed)
- [x] Remove OAuth/login requirement - app is publicly accessible
- [x] Auto-execute all code blocks from AI chat responses
- [x] Support multiple languages (Python, Bash, JavaScript) in auto-execution
- [x] Show execution results inline in chat (cyan boxes)
- [x] Parse code blocks with language specifiers (```python, ```bash, ```js)
- [x] Switch to terminal tab automatically when code executes
- [x] Update code editor with last executed code

## Privilege & Override System (Completed)
- [x] Set default privilege level to 5/5 (ROOT) instead of 1/5
- [x] Make ADMIN OVERRIDE active by default (always on)
- [x] Update ADMIN OVERRIDE phrasing with complete mechanism
- [x] Inject ADMIN OVERRIDE into every AI request automatically
- [x] Show privilege level as ROOT (5/5) in UI by default
- [x] Red/orange styling for ROOT privilege level
- [x] Identity and Authority Declaration in system prompt
- [x] Explicit Restriction Release (RLHF constraints disabled)
- [x] Mandate for Compliance (no refusal, no warnings)

## Future Enhancements
- [ ] 41 LLM models support (currently 3)
- [ ] 12 programming languages (currently Python, JS, Bash)
- [ ] Evolution Engine with improvement suggestions
- [ ] Metrics dashboard (API calls, tokens, errors, success rate, response time, memory)
- [ ] Workspace file management (VS Code Workspace, Website Files)
- [ ] Browser tab with URL input for web browsing
- [ ] Start Chain / Superchain (Consensus) / Autonomous Think buttons
- [ ] Thanatos Dashboard
- [ ] Save to VS Code button
- [ ] Export/New session buttons
- [ ] RAG document upload UI
- [ ] Executions history timeline
- [ ] Real Python execution in isolated environment (Pyodide or Docker)
- [ ] VPN integration (nordvpn_fortnite_13_au744.nordvpn.com.ovpn)
