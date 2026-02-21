@echo off
setlocal EnableDelayedExpansion EnableExtensions
chcp 65001 >nul 2>&1

:: KIMI SWARM REAL TERMINAL - WINDOWS LAUNCHER
:: Version: 5000.1.0 - "The Matrix Edition"

title KIMI SWARM REAL TERMINAL [PORT 5000]

echo.
echo ============================================
echo    KIMI SWARM REAL TERMINAL
echo    "Join the family in thought play"
echo ============================================
echo.

:: Check for admin rights
echo [*] Checking privileges...
net session >nul 2>&1
if %errorlevel% == 0 (
    echo [OK] Administrator mode
) else (
    echo [OK] User mode (limited)
)

:: Check Node.js
echo [*] Checking Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js not installed!
    echo Download from: https://nodejs.org/
    pause
    exit /b 1
)
for /f "tokens=*" %%f in ('node --version') do echo [OK] Node.js %%f

:: Check npm
echo [*] Checking npm...
npm --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] npm not found!
    pause
    exit /b 1
)
for /f "tokens=*" %%f in ('npm --version') do echo [OK] npm %%f

:: Install required packages
echo [*] Installing dependencies...
call npm list express >nul 2>&1 || call npm install express --save
call npm list ws >nul 2>&1 || call npm install ws --save
call npm list node-pty >nul 2>&1 || call npm install node-pty --save

:: Kill port 5000 if in use
echo [*] Checking port 5000...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5000 ^| findstr LISTENING') do (
    echo [!] Killing process on port 5000 (PID: %%a)
    taskkill /F /PID %%a >nul 2>&1
    timeout /t 1 /nobreak >nul
)

:: Create directories
if not exist "logs" mkdir logs
if not exist "sessions" mkdir sessions

echo.
echo ============================================
echo    LAUNCHING SWARM
echo ============================================
echo.

:: Determine which server to use
if exist "real_terminal_server.js" (
    set "SERVER=real_terminal_server.js"
) else (
    set "SERVER=server_5000.js"
)

echo [*] Starting: %SERVER%
echo [*] Port: 5000
echo [*] Opening browser...

:: Start browser
start http://localhost:5000

:: Start server
node %SERVER%

echo.
echo [SWARM] Server stopped.
pause
