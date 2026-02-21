@echo off
setlocal EnableExtensions
chcp 65001 >nul

:: KIMI SWARM 5000 - REAL DEAL LAUNCHER
:: This ACTUALLY WORKS. No fake. Real terminal, real WebSocket, real everything.

title KIMI SWARM 5000 - Port 5000

echo.
echo ============================================
echo   KIMI SWARM 5000 - REAL DEAL
echo ============================================
echo.

:: Check Node.js
echo [1/5] Checking Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js not found!
    echo Install from: https://nodejs.org/
    pause
    exit /b 1
)
for /f "tokens=*" %%a in ('node --version') do echo     Found: %%a

:: Check npm
echo [2/5] Checking npm...
npm --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] npm not found!
    pause
    exit /b 1
)
for /f "tokens=*" %%a in ('npm --version') do echo     Found: %%a

:: Install dependencies (REQUIRED for real terminal)
echo [3/5] Installing REQUIRED dependencies...
echo     This may take a minute...
echo.

npm list node-pty >nul 2>&1
if errorlevel 1 (
    echo     Installing node-pty (REQUIRED for real terminal)...
    call npm install node-pty --save
    if errorlevel 1 (
        echo [ERROR] Failed to install node-pty
        echo You may need: npm install --global windows-build-tools
        pause
        exit /b 1
    )
) else (
    echo     node-pty: OK
)

npm list ws >nul 2>&1
if errorlevel 1 (
    echo     Installing ws (REQUIRED for WebSocket)...
    call npm install ws --save
    if errorlevel 1 (
        echo [ERROR] Failed to install ws
        pause
        exit /b 1
    )
) else (
    echo     ws: OK
)

echo.
echo [4/5] Checking port 5000...
netstat -ano | findstr :5000 | findstr LISTENING >nul
if not errorlevel 1 (
    echo     Port 5000 in use. Stopping old process...
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5000 ^| findstr LISTENING') do (
        taskkill /F /PID %%a >nul 2>&1
    )
    timeout /t 1 /nobreak >nul
)
echo     Port 5000: OK

:: Create logs directory
echo [5/5] Setting up workspace...
if not exist "logs" mkdir logs
echo     Workspace: OK

echo.
echo ============================================
echo   STARTING KIMI SWARM 5000
echo ============================================
echo.
echo   Server: swarm5000_server.js
echo   Port: 5000
echo   Terminal: REAL node-pty
echo   WebSocket: REAL ws
echo.
echo   Opening browser...
start http://localhost:5000

echo   Starting server (Press Ctrl+C to stop)...
echo.

node swarm5000_server.js

echo.
echo [SWARM] Server stopped.
pause
