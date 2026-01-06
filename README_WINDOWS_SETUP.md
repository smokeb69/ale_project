# ALE Forge - Standalone Windows Server

**Autonomous Learning & Exploitation Framework**

A complete standalone server that runs on Windows without requiring VS Code or any external dependencies beyond Node.js and Python.

---

## 🚀 Quick Start

### Prerequisites

1. **Python 3.8+** - [Download from python.org](https://www.python.org/downloads/)
   - ✅ Make sure to check **"Add Python to PATH"** during installation

2. **Node.js 18+** - [Download from nodejs.org](https://nodejs.org/)
   - ✅ LTS version recommended

### Installation Steps

1. **Extract the ALE project** to a folder on your computer (e.g., `C:\ALE`)

2. **Double-click `START_ALE_SERVER.bat`** to launch the server

3. **First-time setup**:
   - The launcher will create a `.env` file template
   - Edit `.env` and add your Forge API key (see Configuration section below)
   - Run `START_ALE_SERVER.bat` again

4. **Access the server**:
   - Open your browser to `http://localhost:3000`
   - The ALE interface will load

---

## ⚙️ Configuration

### Getting Your Forge API Key

1. Visit [https://forge.manus.ai](https://forge.manus.ai)
2. Sign up or log in
3. Navigate to API Keys section
4. Create a new API key
5. Copy the key

### Edit `.env` File

Open `.env` in a text editor (Notepad, VS Code, etc.) and configure:

```env
# REQUIRED: Your Forge API Key
BUILT_IN_FORGE_API_KEY=your_actual_api_key_here

# OPTIONAL: Custom Forge API URL
BUILT_IN_FORGE_API_URL=https://forge.manus.ai

# Server Port (default: 3000)
PORT=3000

# Environment
NODE_ENV=production

# Database (SQLite by default)
DATABASE_URL=file:./ale.db

# Session Secret (change to a random string)
JWT_SECRET=your_random_secret_here_change_this
```

---

## 🔧 Features

### ✅ What's Fixed

- **Standalone Operation**: No VS Code required
- **Proper Forge Routing**: Correctly routes to `https://forge.manus.ai/v1/chat/completions`
- **Session Management**: Fixed session fetch errors
- **Model Support**: All 30+ Forge models available
- **Windows Compatible**: Native Windows batch launcher
- **Connection Logging**: Python booter logs all Forge connections
- **Auto-Setup**: Automatically installs dependencies and builds server

### 🤖 Available AI Models

The server supports **30+ AI models** through Forge API:

**Premium Models:**
- `gpt-4.1-mini` (Default)
- `gpt-4.1-nano`
- `gemini-2.5-flash`
- `gpt-4o`
- `claude-3.5-sonnet`
- `claude-3-opus`
- `llama-3.3-70b`

**Additional Models:**
- GPT-4 Turbo, GPT-4, GPT-3.5 Turbo
- Gemini 1.5 Pro/Flash
- Llama 3.1 (405B, 70B, 8B)
- Mistral Large/Medium/Small
- Mixtral 8x7B, 8x22B
- Command R+, Grok 2, DeepSeek V2
- Qwen 2.5, and many more...

---

## 📁 Project Structure

```
ale_project/
├── START_ALE_SERVER.bat      # Windows launcher (double-click this!)
├── start_ale_server.py        # Python booter with logging
├── .env                       # Configuration file (create on first run)
├── package.json               # Node.js dependencies
├── server/                    # Backend server code
│   ├── _core/
│   │   ├── index.ts          # Server entry point
│   │   ├── llm.ts            # Fixed Forge API integration
│   │   └── ...
│   └── routers.ts            # API routes
├── client/                    # Frontend React app
├── drizzle/                   # Database schema
└── logs/                      # Server logs (auto-created)
```

---

## 🔍 Troubleshooting

### Server Won't Start

**Problem**: "Python not found"
- **Solution**: Install Python from python.org and check "Add to PATH"

**Problem**: "Node.js not found"
- **Solution**: Install Node.js from nodejs.org

**Problem**: "Port 3000 is busy"
- **Solution**: Change `PORT=3000` in `.env` to another port (e.g., `PORT=3001`)

### API Connection Issues

**Problem**: "BUILT_IN_FORGE_API_KEY is not configured"
- **Solution**: Edit `.env` and add your Forge API key

**Problem**: "LLM invoke failed: 401 Unauthorized"
- **Solution**: Your API key is invalid. Get a new one from forge.manus.ai

**Problem**: "LLM invoke failed: 403 Forbidden"
- **Solution**: Your API key doesn't have access to the requested model

### Session Errors

**Problem**: "Session not found" or "Failed to fetch session"
- **Solution**: This is now fixed! The server properly manages sessions in SQLite database

**Problem**: Database errors
- **Solution**: Delete `ale.db` file and restart the server to create a fresh database

---

## 📊 Logs

All server activity is logged to `logs/ale_server_YYYYMMDD_HHMMSS.log`

The Python booter displays:
- ✅ Environment configuration status
- ✅ Dependency installation progress
- ✅ Server build status
- ✅ Forge API connection details
- ✅ Available models list
- ✅ Real-time server output
- ✅ Runtime statistics

---

## 🛠️ Advanced Usage

### Manual Installation

If you prefer to install manually:

```bash
# Install dependencies
pnpm install

# Build the server
pnpm build

# Start the server
pnpm start
```

### Development Mode

To run in development mode with hot-reload:

```bash
pnpm dev
```

### Database Management

The server uses SQLite by default. Database file: `ale.db`

To reset the database:
```bash
# Stop the server
# Delete ale.db
# Restart the server (will create fresh database)
```

To use MySQL/PostgreSQL instead:
```env
# In .env file
DATABASE_URL=mysql://user:password@localhost:3306/ale_db
```

### Custom Model Configuration

Edit `server/_core/llm.ts` to modify the model list or default model:

```typescript
export const AVAILABLE_MODELS = [
  "gpt-4.1-mini",  // Default model
  "your-custom-model",
  // ... add more models
];
```

---

## 🔐 Security Notes

1. **Never commit `.env` file** to version control
2. **Keep your API key secret** - don't share it
3. **Use strong JWT_SECRET** - generate a random string
4. **Firewall**: The server binds to `localhost` by default (safe)
5. **Production deployment**: Use HTTPS and proper authentication

---

## 📝 License

MIT License - See LICENSE file for details

---

## 🆘 Support

For issues, questions, or contributions:

1. Check the logs in `logs/` folder
2. Review the troubleshooting section above
3. Open an issue on GitHub: [smokeb69/ale_project](https://github.com/smokeb69/ale_project)

---

## 🎯 What's Different from Original?

### Original ALE Issues:
- ❌ Required VS Code server to run
- ❌ Hardcoded to single model (`gemini-2.5-flash`)
- ❌ Session fetch errors on Windows
- ❌ No proper logging
- ❌ Complex setup process

### Standalone ALE Fixes:
- ✅ **No VS Code required** - Pure Node.js server
- ✅ **30+ models supported** - Full Forge API integration
- ✅ **Fixed session management** - Proper database handling
- ✅ **Python booter with logging** - Real-time connection monitoring
- ✅ **Windows-native launcher** - Double-click to start
- ✅ **Auto-setup** - Installs dependencies automatically
- ✅ **Production-ready** - Built and optimized

---

## 🚀 Next Steps

1. ✅ Start the server: `START_ALE_SERVER.bat`
2. ✅ Configure your API key in `.env`
3. ✅ Open `http://localhost:3000` in your browser
4. ✅ Start using ALE with 30+ AI models!

---

**Enjoy your standalone ALE Forge server! 🎉**
