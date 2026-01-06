# ALE Forge - Complete Deployment Guide

## 📦 What You Have

You now have a **complete standalone ALE server** that:

✅ **Works on Windows** without VS Code  
✅ **Routes correctly** to Forge API at `https://forge.manus.ai/v1/chat/completions`  
✅ **Supports 30+ AI models** (gpt-4.1-mini, gemini-2.5-flash, claude-3.5-sonnet, etc.)  
✅ **Fixed session management** - no more "session not found" errors  
✅ **Python booter** with real-time connection logging  
✅ **Auto-setup** - installs dependencies and builds automatically  
✅ **Production-ready** - optimized and bundled  

---

## 🚀 Quick Deployment (3 Steps)

### For End Users (Windows)

1. **Extract** `ALE_Forge_Windows_Standalone_XXXXXXXX_XXXXXX.zip` to a folder
2. **Double-click** `START_ALE_SERVER.bat`
3. **Configure** `.env` with your Forge API key (created on first run)

That's it! The server will:
- Check Python and Node.js installation
- Install dependencies automatically
- Build the server
- Start on `http://localhost:3000`
- Log all Forge connections

---

## 🔧 Detailed Setup

### Prerequisites

**Required:**
- **Python 3.8+** - [Download](https://www.python.org/downloads/)
  - ⚠️ Check "Add Python to PATH" during installation
- **Node.js 18+** - [Download](https://nodejs.org/)
  - Recommended: LTS version

**Optional:**
- Git (for cloning from GitHub)

### Installation Methods

#### Method 1: Use Pre-Packaged ZIP (Recommended)

```bash
# 1. Extract the ZIP file
# 2. Navigate to extracted folder
cd ALE_Forge_Windows_Standalone_XXXXXXXX_XXXXXX

# 3. Run the launcher
START_ALE_SERVER.bat
```

#### Method 2: Clone from GitHub

```bash
# 1. Clone the repository
git clone https://github.com/smokeb69/ale_project.git
cd ale_project

# 2. Copy environment template
copy .env.example .env

# 3. Edit .env with your API key
notepad .env

# 4. Run the launcher
START_ALE_SERVER.bat
```

#### Method 3: Manual Setup (Advanced)

```bash
# 1. Install dependencies
pnpm install

# 2. Build the server
pnpm build

# 3. Configure .env
copy .env.example .env
notepad .env

# 4. Start the server
pnpm start
```

---

## ⚙️ Configuration

### Getting Forge API Key

1. Visit **https://forge.manus.ai**
2. Sign up or log in
3. Navigate to **API Keys** section
4. Click **Create New Key**
5. Copy the key

### Edit `.env` File

Open `.env` in any text editor:

```env
# REQUIRED: Add your Forge API key here
BUILT_IN_FORGE_API_KEY=sk-forge-xxxxxxxxxxxxxxxxxxxxx

# OPTIONAL: Change these if needed
BUILT_IN_FORGE_API_URL=https://forge.manus.ai
PORT=3000
NODE_ENV=production
DATABASE_URL=file:./ale.db
JWT_SECRET=your_random_secret_string_here
```

**Important:**
- Never share your API key
- Change `JWT_SECRET` to a random string
- Keep `.env` file private (don't commit to Git)

---

## 🎯 Features & Fixes

### What Was Fixed

| Issue | Status | Solution |
|-------|--------|----------|
| VS Code dependency | ✅ Fixed | Standalone Node.js server |
| Hardcoded model | ✅ Fixed | 30+ models via Forge API |
| Session errors | ✅ Fixed | Proper SQLite database handling |
| No logging | ✅ Fixed | Python booter with real-time logs |
| Complex setup | ✅ Fixed | Auto-install dependencies |
| Windows compatibility | ✅ Fixed | Native .bat launcher |

### Available Models

The server supports **30+ AI models**:

**Top Tier:**
- `gpt-4.1-mini` ⭐ (Default - Fast & Smart)
- `gpt-4.1-nano` (Ultra-fast)
- `gemini-2.5-flash` (Google's latest)
- `gpt-4o` (OpenAI's best)
- `claude-3.5-sonnet` (Anthropic's best)
- `llama-3.3-70b` (Open source)

**Full List:**
- GPT: 4.1-mini, 4.1-nano, 4o, 4-turbo, 4, 3.5-turbo
- Claude: 3.5-sonnet, 3-opus, 3-haiku
- Gemini: 2.5-flash, 1.5-pro, 1.5-flash
- Llama: 3.3-70b, 3.1-405b, 3.1-70b, 3.1-8b
- Mistral: large, medium, small, mixtral-8x7b, mixtral-8x22b
- Others: Command R+, Grok 2, DeepSeek V2, Qwen 2.5, and more

---

## 📊 Monitoring & Logs

### Python Booter Output

The launcher displays:
```
======================================================================
   █████╗ ██╗     ███████╗    ███████╗ ██████╗ ██████╗  ██████╗ ███████╗
  ██╔══██╗██║     ██╔════╝    ██╔════╝██╔═══██╗██╔══██╗██╔════╝ ██╔════╝
  ...
            Autonomous Learning & Exploitation Framework
                    Standalone Server - Windows Edition
======================================================================

[2026-01-06 11:44:32] [INFO] Checking environment configuration...
[2026-01-06 11:44:32] [SUCCESS] Environment configuration OK
[2026-01-06 11:44:33] [SUCCESS] Node.js version: v18.17.0
[2026-01-06 11:44:33] [SUCCESS] pnpm version: 8.6.12
[2026-01-06 11:44:35] [SUCCESS] Dependencies installed successfully
[2026-01-06 11:44:40] [SUCCESS] Server built successfully
[2026-01-06 11:44:42] [INFO] Starting ALE server...
[2026-01-06 11:44:45] [INFO] SERVER: Server running on http://localhost:3000/
======================================================================
                    ALE SERVER STARTED SUCCESSFULLY!
                    Server URL: http://localhost:3000/
======================================================================
                        FORGE API CONNECTION
======================================================================
Forge API URL: https://forge.manus.ai/v1/chat/completions
API Key Status: ✓ Configured
Available Models:
  - gpt-4.1-mini
  - gpt-4.1-nano
  - gemini-2.5-flash
  - gpt-4o
  - claude-3.5-sonnet
  - llama-3.3-70b
  - and 25+ more models...
======================================================================
```

### Log Files

All activity is logged to `logs/ale_server_YYYYMMDD_HHMMSS.log`

Example log entries:
```
[2026-01-06 11:44:45] [INFO] Server running on http://localhost:3000/
[2026-01-06 11:45:12] [INFO] [LLM] Invoking gpt-4.1-mini at https://forge.manus.ai/v1/chat/completions
[2026-01-06 11:45:14] [INFO] [LLM] Response received from gpt-4.1-mini (1234 tokens)
```

---

## 🔍 Troubleshooting

### Common Issues

#### 1. "Python not found"

**Symptom:** Error when running `START_ALE_SERVER.bat`

**Solution:**
1. Install Python from https://www.python.org/downloads/
2. ⚠️ Check "Add Python to PATH" during installation
3. Restart command prompt
4. Run `python --version` to verify

#### 2. "Node.js not found"

**Symptom:** Error when checking dependencies

**Solution:**
1. Install Node.js from https://nodejs.org/
2. Restart command prompt
3. Run `node --version` to verify

#### 3. "Port 3000 is busy"

**Symptom:** Server fails to start, port already in use

**Solution:**
Edit `.env` and change port:
```env
PORT=3001
```

#### 4. "BUILT_IN_FORGE_API_KEY is not configured"

**Symptom:** Server starts but API calls fail

**Solution:**
1. Get API key from https://forge.manus.ai
2. Edit `.env` file
3. Add key: `BUILT_IN_FORGE_API_KEY=sk-forge-your-key-here`
4. Restart server

#### 5. "Session not found" errors

**Symptom:** Frontend shows session errors

**Solution:**
This is now fixed! If you still see this:
1. Stop the server
2. Delete `ale.db` file
3. Restart server (will create fresh database)

#### 6. "LLM invoke failed: 401 Unauthorized"

**Symptom:** API calls return 401 error

**Solution:**
- Your API key is invalid or expired
- Get a new key from https://forge.manus.ai
- Update `.env` file

#### 7. "Failed to install dependencies"

**Symptom:** pnpm install fails

**Solution:**
```bash
# Clear cache and retry
pnpm store prune
pnpm install --force
```

---

## 🛡️ Security Best Practices

### Production Deployment

1. **Use HTTPS** - Set up reverse proxy (nginx, Caddy)
2. **Strong secrets** - Generate random `JWT_SECRET`
3. **Firewall** - Restrict access to trusted IPs
4. **Keep updated** - Regularly update dependencies
5. **Monitor logs** - Check `logs/` directory regularly

### API Key Security

- ✅ Keep `.env` file private
- ✅ Never commit `.env` to Git
- ✅ Use environment variables in production
- ✅ Rotate keys periodically
- ❌ Don't share API keys
- ❌ Don't hardcode keys in source code

### Database Security

**SQLite (Default):**
- File-based: `ale.db`
- Suitable for single-user or small teams
- Backup regularly

**MySQL/PostgreSQL (Production):**
```env
DATABASE_URL=mysql://user:password@localhost:3306/ale_db
```
- Better for multi-user environments
- Supports concurrent connections
- Better backup/restore tools

---

## 📁 Project Structure

```
ALE_Forge_Windows_Standalone_XXXXXXXX_XXXXXX/
├── START_ALE_SERVER.bat       # 👈 Double-click this to start!
├── start_ale_server.py         # Python launcher with logging
├── INSTALL.txt                 # Quick start guide
├── README_WINDOWS_SETUP.md     # Full documentation
├── VERSION.txt                 # Build information
├── .env.example                # Configuration template
├── .env                        # Your config (created on first run)
├── package.json                # Node.js dependencies
├── pnpm-lock.yaml              # Dependency lock file
├── tsconfig.json               # TypeScript config
├── vite.config.ts              # Vite bundler config
├── components.json             # UI components config
├── drizzle.config.ts           # Database config
├── server/                     # Backend code
│   ├── _core/
│   │   ├── index.ts           # Server entry point
│   │   ├── llm.ts             # ✅ Fixed Forge API integration
│   │   ├── env.ts             # Environment variables
│   │   └── ...
│   ├── routers.ts             # API routes
│   └── ...
├── client/                     # Frontend React app
│   ├── src/
│   │   ├── App.tsx
│   │   └── ...
│   └── ...
├── shared/                     # Shared types/utils
├── drizzle/                    # Database schema
├── logs/                       # Server logs (auto-created)
│   └── ale_server_*.log
├── dist/                       # Built server (auto-created)
└── node_modules/               # Dependencies (auto-installed)
```

---

## 🔄 Updating

### Update from GitHub

```bash
# Backup your .env file
copy .env .env.backup

# Pull latest changes
git pull origin main

# Reinstall dependencies
pnpm install

# Rebuild server
pnpm build

# Restore your .env
copy .env.backup .env

# Restart server
START_ALE_SERVER.bat
```

### Update Dependencies

```bash
# Update all dependencies
pnpm update

# Rebuild
pnpm build
```

---

## 🎓 Advanced Usage

### Custom Model Configuration

Edit `server/_core/llm.ts`:

```typescript
export const AVAILABLE_MODELS = [
  "gpt-4.1-mini",  // Default
  "your-custom-model",
  // Add more models here
];
```

### Database Migration

**SQLite to MySQL:**

```bash
# 1. Export data from SQLite
# 2. Update .env
DATABASE_URL=mysql://user:password@localhost:3306/ale_db

# 3. Restart server (will create tables)
```

### Custom Port

```env
# .env
PORT=8080
```

### Development Mode

```bash
# Hot-reload for development
pnpm dev
```

### Running as Windows Service

Use **NSSM** (Non-Sucking Service Manager):

```bash
# 1. Download NSSM from https://nssm.cc/
# 2. Install service
nssm install ALE_Forge "C:\path\to\node.exe" "C:\path\to\ale_project\dist\index.js"

# 3. Start service
nssm start ALE_Forge
```

---

## 📞 Support

### Resources

- **GitHub:** https://github.com/smokeb69/ale_project
- **Forge API:** https://forge.manus.ai
- **Documentation:** README_WINDOWS_SETUP.md

### Getting Help

1. Check logs in `logs/` directory
2. Review troubleshooting section above
3. Search GitHub issues
4. Open new issue with:
   - Log file contents
   - Error messages
   - Steps to reproduce

---

## 📝 License

MIT License - See LICENSE file for details

---

## 🎉 Success Checklist

Before going live, verify:

- [ ] Python 3.8+ installed
- [ ] Node.js 18+ installed
- [ ] `.env` file configured with valid API key
- [ ] `JWT_SECRET` changed to random string
- [ ] Server starts without errors
- [ ] Can access `http://localhost:3000`
- [ ] Can send messages and get AI responses
- [ ] Logs are being written to `logs/` directory
- [ ] Forge API connection shows "✓ Configured"

---

**You're all set! Enjoy your standalone ALE Forge server! 🚀**
