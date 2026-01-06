@echo off
REM ========================================
REM ALE PROJECT - AUTO-BOOT SCRIPT
REM Starts the server automatically
REM ========================================

echo.
echo ========================================
echo    ALE PROJECT - AUTO-BOOT
echo ========================================
echo.

REM Navigate to project directory
cd /d "%~dp0"

echo [*] Project Directory: %CD%
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js is not installed!
    echo [ERROR] Please install Node.js from https://nodejs.org
    pause
    exit /b 1
)

echo [+] Node.js found: 
node --version
echo.

REM Check if pnpm is installed
where pnpm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [!] pnpm not found, installing globally...
    npm install -g pnpm
    if %ERRORLEVEL% NEQ 0 (
        echo [ERROR] Failed to install pnpm
        pause
        exit /b 1
    )
)

echo [+] pnpm found:
pnpm --version
echo.

REM Install dependencies if node_modules doesn't exist
if not exist "node_modules\" (
    echo [*] Installing dependencies...
    pnpm install
    if %ERRORLEVEL% NEQ 0 (
        echo [ERROR] Failed to install dependencies
        pause
        exit /b 1
    )
    echo [+] Dependencies installed
    echo.
)

REM Set environment variables for Forge API
set BUILT_IN_FORGE_API_URL=https://forge.manus.ai
set BUILT_IN_FORGE_API_KEY=mEU8sWrVuDTgj3HdEWEWDD
set DEFAULT_MODEL=gemini-2.5-flash

echo [+] Environment configured:
echo     Forge URL: %BUILT_IN_FORGE_API_URL%
echo     Model: %DEFAULT_MODEL%
echo.

echo ========================================
echo    STARTING ALE SERVER
echo ========================================
echo.
echo [+] Server starting on http://localhost:5000
echo [+] Press Ctrl+C to stop
echo.

REM Start the server (this will block until stopped)
pnpm run dev

REM If server stops, pause to show any error messages
pause
