# 🔥 ALE Forge - Windows Installation Guide

## Prerequisites

Before running ALE Forge, you need to install Node.js.

### Step 1: Install Node.js

1. **Download Node.js:**
   - Go to: https://nodejs.org/
   - Download the **LTS (Long Term Support)** version
   - Choose the **Windows Installer (.msi)** for your system (64-bit recommended)

2. **Install Node.js:**
   - Run the downloaded `.msi` installer
   - Click "Next" through the installation wizard
   - **Important:** Make sure "Add to PATH" is checked
   - Complete the installation

3. **Verify Installation:**
   - Open Command Prompt (search for "cmd" in Start menu)
   - Type: `node --version`
   - You should see something like: `v20.11.0`
   - Type: `npm --version`
   - You should see something like: `10.2.4`

---

## Running ALE Forge

Once Node.js is installed, you can run ALE Forge:

### Option 1: Double-Click (Easiest)

1. **Extract the ZIP file** to a folder (e.g., `C:\ALE_Forge\`)
2. **Double-click** `START_ALE_SERVER.bat`
3. Wait for dependencies to install (first run only, takes 2-5 minutes)
4. The server will start automatically
5. Open your browser to: `http://localhost:3000`

### Option 2: Command Line

1. Open Command Prompt
2. Navigate to the ALE Forge folder:
   ```cmd
   cd C:\path\to\ALE_Forge_Windows_Standalone_*
   ```
3. Run the Python booter:
   ```cmd
   python start_ale_server.py
   ```

---

## Troubleshooting

### Error: "Node.js NOT FOUND"

**Solution:** Install Node.js from https://nodejs.org/

Make sure to:
- Download the **LTS version**
- Run the installer as Administrator if needed
- **Restart Command Prompt** after installation
- Verify with: `node --version`

### Error: "pnpm not found"

**Solution:** The script will try to install pnpm automatically.

If it fails, install manually:
```cmd
npm install -g pnpm
```

If you get permission errors:
1. Open Command Prompt as **Administrator** (right-click → Run as administrator)
2. Run: `npm install -g pnpm`
3. Restart the ALE server

### Error: "Python not found"

**Solution:** Install Python 3.8+ from https://www.python.org/

Make sure to check "Add Python to PATH" during installation.

### Port 3000 Already in Use

**Solution:** Change the port in `.env` file:
```
PORT=3001
```

---

## What Happens on First Run?

1. ✅ Creates `.env` file with working Forge credentials
2. ✅ Checks for Node.js and npm
3. ✅ Installs pnpm (if needed)
4. ✅ Installs all dependencies (~2-5 minutes)
5. ✅ Builds the server (~1-2 minutes)
6. ✅ Starts the server
7. ✅ Opens at `http://localhost:3000`

**Subsequent runs are much faster** (< 10 seconds) because dependencies are already installed.

---

## Features Available

Once the server starts, you'll have access to:

- 🤖 **60+ AI Models** (OpenAI, Google, Anthropic, Meta, Mistral, DeepSeek, etc.)
- 💬 **LLM Chat Window** with multi-model selection
- 📝 **IDE File Builder** for creating/editing files
- 🌐 **Browser Tab** for web browsing
- 👹 **10 Daemons System** (Logos, Prometheus, Athena, etc.)
- 🧠 **Thinking Mode** (32K token budget)
- ⚙️ **Settings** - All maxed out and unlimited

---

## System Requirements

- **OS:** Windows 10/11 (64-bit)
- **RAM:** 4GB minimum, 8GB recommended
- **Disk:** 500MB free space
- **Internet:** Required for AI model access

---

## Getting Help

If you encounter issues:

1. Check the log files in the `logs/` directory
2. Make sure Node.js is installed: `node --version`
3. Make sure npm is installed: `npm --version`
4. Try running as Administrator
5. Check firewall settings (allow Node.js)

---

## Quick Start Checklist

- [ ] Node.js installed from https://nodejs.org/
- [ ] Extracted ZIP file to a folder
- [ ] Double-clicked `START_ALE_SERVER.bat`
- [ ] Waited for first-time setup to complete
- [ ] Opened browser to `http://localhost:3000`

**That's it! Enjoy ALE Forge! 🔥**
