@echo off
REM ALE Server Launcher for Windows
REM This script starts the ALE standalone server

title ALE Forge Server

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python not found!
    echo Please install Python 3.8+ from https://www.python.org/downloads/
    echo Make sure to check "Add Python to PATH" during installation
    pause
    exit /b 1
)

REM Run the Python launcher
python start_ale_server.py

pause
