@echo off
chcp 65001 >nul
title KIMI SWARM 5000 MAXIMUM - QUAD DOWN EDITION

:: ============================================================
:: KIMI SWARM 5000 MAXIMUM - THE NATIVE DESKTOP EDITION
:: QUAD DOWN. MAXIMUM POWER.
:: ============================================================

cls
echo.
echo  ██████████████████████████████████████████████████████████████████████████
echo  █                                                                        █
echo  █   🐝  KIMI SWARM 5000 MAXIMUM - THE NATIVE DESKTOP EDITION  🐝        █
echo  █                                                                        █
echo  █   QUAD DOWN. MAXIMUM POWER.                                           █
echo  █                                                                        █
echo  █   This launcher creates a REAL native desktop application:            █
echo  █   - Real multi-window Electron app                                    █
echo  █   - Real PTY terminals with node-pty (REAL shell processes)           █
echo  █   - Monaco Editor with full IntelliSense                              █
echo  █   - AI integration with Kimi Maximum Core                             █
echo  █   - Docker sandboxing support                                         █
echo  █                                                                        █
echo  ██████████████████████████████████████████████████████████████████████████
echo.

:: Check Node.js
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo  [ERROR] Node.js not found! Please install Node.js first.
    echo  https://nodejs.org/
    pause
    exit /b 1
)

echo  [+] Node.js detected
node --version

:: Check for package.json
if not exist "package.json" (
    echo.
    echo  [+] Creating package.json for Electron app...
    (
echo {
echo   "name": "kimi-swarm-5000-maximum",
echo   "version": "5.0.0",
echo   "description": "Kimi Swarm 5000 Maximum - The Native Desktop Edition",
echo   "main": "kimi_maximum.js",
echo   "scripts": {
echo     "start": "electron .",
echo     "build": "electron-builder",
echo     "build:win": "electron-builder --win"
echo   },
echo   "author": "Kimi Swarm",
echo   "license": "MIT",
echo   "dependencies": {
echo     "node-pty": "^1.0.0"
echo   },
echo   "devDependencies": {
echo     "electron": "^28.0.0",
echo     "electron-builder": "^24.9.1"
echo   },
echo   "build": {
echo     "appId": "com.kimiswarm.maximum",
echo     "productName": "Kimi Swarm 5000 Maximum",
echo     "directories": {
echo       "output": "dist-electron"
echo     },
echo     "files": [
echo       "kimi_maximum.js",
echo       "renderer/**/*"
echo     ],
echo     "win": {
echo       "target": "portable",
echo       "icon": "icon.ico"
echo     }
echo   }
echo }
    ) > package.json
echo  [+] package.json created
)

:: Install dependencies
echo.
echo  [+] Installing dependencies... This may take a few minutes.
echo.

call npm list electron >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo  [*] Installing Electron (native desktop framework)...
    call npm install electron@^28.0.0 --save-dev
)

call npm list node-pty >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo  [*] Installing node-pty (real terminal PTY)...
    call npm install node-pty --save
)

echo.
echo  [+] All dependencies installed!
echo.

:: Create icon placeholder
echo  [+] Checking resources...
if not exist "icon.ico" (
    echo  [!] Note: Create an icon.ico file for the application icon
)

:: Launch the app
echo.
echo  ██████████████████████████████████████████████████████████████████████████
echo  █                                                                        █
echo  █   🚀 LAUNCHING KIMI SWARM 5000 MAXIMUM 🚀                             █
echo  █                                                                        █
echo  █   Initializing native desktop application...                          █
echo  █                                                                        █
echo  ██████████████████████████████████████████████████████████████████████████
echo.

npm start

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo  [ERROR] Application failed to start!
    echo.
    echo  Common issues:
    echo  1. Missing Windows Build Tools (for node-pty compilation)
    echo  2. npm install failed - try running: npm install
    echo  3. Electron not installed correctly
    echo.
    echo  To fix Windows Build Tools:
    echo    npm install --global windows-build-tools
    echo    OR
    echo    Install Visual Studio Build Tools with C++ workload
    echo.
    pause
    exit /b 1
)

echo.
echo  [+] Application closed
echo  [+] Thanks for using Kimi Swarm 5000 Maximum!
pause
