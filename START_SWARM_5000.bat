@echo off
chcp 65001 >nul
setlocal EnableDelayedExpansion

:: ==============================================================================
:: KIMI SWARM 5000 - ONE CLICK LAUNCHER
:: ==============================================================================
:: This batch file starts the entire Mega Swarm system on port 5000
:: Includes: Express server, 19 agents, 12 frameworks, interactive dashboard
:: ==============================================================================

title 🐝 KIMI SWARM 5000 🐝

echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║                                                              ║
echo ║           🐝 KIMI SWARM 5000 - ULTIMATE EDITION 🐝          ║
echo ║                                                              ║
echo ║     "Triple Down Dog Dare Accepted - 5000x Better"           ║
echo ║                                                              ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.

:: Check if we're in the right directory
if not exist "server_5000.js" (
    echo [ERROR] server_5000.js not found!
    echo [ERROR] Please run this batch file from the project root directory.
    pause
    exit /b 1
)

:: Check for Node.js
echo [*] Checking for Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js is not installed!
    echo [ERROR] Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)
for /f "tokens=*" %%a in ('node --version') do set NODE_VERSION=%%a
echo [✓] Node.js found: %NODE_VERSION%

:: Check for npm
echo [*] Checking for npm...
npm --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] npm is not installed!
    pause
    exit /b 1
)
for /f "tokens=*" %%a in ('npm --version') do set NPM_VERSION=%%a
echo [✓] npm found: %NPM_VERSION%

:: Check if express is installed
echo [*] Checking for Express...
node -e "require('express')" >nul 2>&1
if errorlevel 1 (
    echo [!] Express not found. Installing...
    npm install express --no-save
    if errorlevel 1 (
        echo [ERROR] Failed to install Express!
        pause
        exit /b 1
    )
    echo [✓] Express installed
) else (
    echo [✓] Express found
)

:: Kill any process using port 5000
echo [*] Checking port 5000...
netstat -ano | findstr :5000 | findstr LISTENING >nul
if not errorlevel 1 (
    echo [!] Port 5000 is in use. Attempting to free it...
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5000 ^| findstr LISTENING') do (
        taskkill /F /PID %%a >nul 2>&1
        echo [✓] Killed process using port 5000
    )
)

:: Check for SWARM_5000.html
echo [*] Checking for SWARM_5000.html...
if not exist "SWARM_5000.html" (
    echo [ERROR] SWARM_5000.html not found!
    pause
    exit /b 1
)
echo [✓] Dashboard HTML found

:: Start the server
echo.
echo [*] Starting KIMI SWARM 5000 Server...
echo [*] Port: 5000
echo [*] Agents: 19
echo [*] Frameworks: 12
echo.

:: Create a temporary VBS script to open browser silently
(
echo Set objShell = CreateObject^("WScript.Shell"^)
echo objShell.Run "http://localhost:5000", 1, False
) > "%TEMP%\open_swarm.vbs"

:: Start server in background
start /B node server_5000.js > swarm_5000.log 2>&1

:: Wait for server to start
echo [*] Waiting for server to initialize...
timeout /t 3 /nobreak >nul

:: Check if server started successfully
netstat -ano | findstr :5000 | findstr LISTENING >nul
if errorlevel 1 (
    echo [ERROR] Server failed to start! Check swarm_5000.log for details.
    pause
    exit /b 1
)

echo [✓] Server started successfully!
echo.

:: Open browser
echo [*] Opening browser...
cscript //nologo "%TEMP%\open_swarm.vbs"
del "%TEMP%\open_swarm.vbs"

echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║  🚀 SWARM IS LIVE!                                           ║
echo ║                                                              ║
echo ║  📍 http://localhost:5000                                    ║
echo ║                                                              ║
echo ║  Press Ctrl+C in this window to stop the server              ║
echo ║                                                              ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.
echo [*] Server logs are being written to: swarm_5000.log
echo [*] Press any key to stop the server...
echo.

:: Keep window open
pause >nul

:: Cleanup
echo.
echo [*] Stopping server...
taskkill /F /IM node.exe >nul 2>&1
echo [✓] Server stopped
echo.
echo [*] Thank you for using KIMI SWARM 5000!
echo.
timeout /t 2 /nobreak >nul
