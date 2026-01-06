#!/usr/bin/env python3
"""
ALE Standalone Server Launcher
Starts the ALE server with proper logging and connection monitoring
"""

import subprocess
import sys
import os
import time
import signal
import threading
from datetime import datetime
from pathlib import Path

# ANSI color codes for terminal output
class Colors:
    HEADER = '\033[95m'
    OKBLUE = '\033[94m'
    OKCYAN = '\033[96m'
    OKGREEN = '\033[92m'
    WARNING = '\033[93m'
    FAIL = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'
    UNDERLINE = '\033[4m'

class ALEServerLauncher:
    def __init__(self):
        self.process = None
        self.log_file = None
        self.running = True
        self.start_time = None
        
    def print_banner(self):
        """Print ALE server banner"""
        banner = f"""
{Colors.OKCYAN}{'='*70}
   █████╗ ██╗     ███████╗    ███████╗ ██████╗ ██████╗  ██████╗ ███████╗
  ██╔══██╗██║     ██╔════╝    ██╔════╝██╔═══██╗██╔══██╗██╔════╝ ██╔════╝
  ███████║██║     █████╗      █████╗  ██║   ██║██████╔╝██║  ███╗█████╗  
  ██╔══██║██║     ██╔══╝      ██╔══╝  ██║   ██║██╔══██╗██║   ██║██╔══╝  
  ██║  ██║███████╗███████╗    ██║     ╚██████╔╝██║  ██║╚██████╔╝███████╗
  ╚═╝  ╚═╝╚══════╝╚══════╝    ╚═╝      ╚═════╝ ╚═╝  ╚═╝ ╚═════╝ ╚══════╝
                                                                          
            Autonomous Learning & Exploitation Framework
                    Standalone Server - Windows Edition
{'='*70}{Colors.ENDC}
"""
        print(banner)
        
    def setup_logging(self):
        """Setup logging to file"""
        log_dir = Path("logs")
        log_dir.mkdir(exist_ok=True)
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        log_filename = log_dir / f"ale_server_{timestamp}.log"
        
        self.log_file = open(log_filename, "w", encoding="utf-8")
        self.log(f"ALE Server Log Started - {datetime.now().isoformat()}")
        self.log(f"Log file: {log_filename}")
        
        return log_filename
        
    def log(self, message, level="INFO"):
        """Log message to file and console"""
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        log_message = f"[{timestamp}] [{level}] {message}"
        
        # Write to log file
        if self.log_file:
            self.log_file.write(log_message + "\n")
            self.log_file.flush()
        
        # Print to console with colors
        if level == "INFO":
            color = Colors.OKBLUE
        elif level == "SUCCESS":
            color = Colors.OKGREEN
        elif level == "WARNING":
            color = Colors.WARNING
        elif level == "ERROR":
            color = Colors.FAIL
        else:
            color = Colors.ENDC
            
        print(f"{color}{log_message}{Colors.ENDC}")
        
    def check_environment(self):
        """Check if environment is properly configured"""
        self.log("Checking environment configuration...")
        
        env_file = Path(".env")
        if not env_file.exists():
            self.log("WARNING: .env file not found. Creating template...", "WARNING")
            self.create_env_template()
            self.log("Please edit .env file with your configuration and restart.", "WARNING")
            return False
            
        # Check for required environment variables
        required_vars = ["BUILT_IN_FORGE_API_KEY"]
        missing_vars = []
        
        with open(env_file, "r") as f:
            env_content = f.read()
            for var in required_vars:
                if var not in env_content or f"{var}=" not in env_content:
                    missing_vars.append(var)
        
        if missing_vars:
            self.log(f"ERROR: Missing required environment variables: {', '.join(missing_vars)}", "ERROR")
            return False
            
        self.log("Environment configuration OK", "SUCCESS")
        return True
        
    def create_env_template(self):
        """Create .env template file"""
        template = """# ALE Forge Configuration
# Get your API key from https://forge.manus.ai

# REQUIRED: Your Forge API Key
BUILT_IN_FORGE_API_KEY=your_forge_api_key_here

# OPTIONAL: Custom Forge API URL (default: https://forge.manus.ai)
BUILT_IN_FORGE_API_URL=https://forge.manus.ai

# Server Configuration
PORT=3000
NODE_ENV=production

# Database Configuration (SQLite by default)
DATABASE_URL=file:./ale.db

# Session Secret (generate a random string)
JWT_SECRET=change_this_to_a_random_secret_string

# OAuth Configuration (optional)
OAUTH_SERVER_URL=
VITE_APP_ID=
OWNER_OPEN_ID=
"""
        with open(".env", "w") as f:
            f.write(template)
        
        self.log("Created .env template file", "SUCCESS")
        
    def check_dependencies(self):
        """Check if Node.js and pnpm are installed"""
        self.log("Checking dependencies...")
        
        # Check Node.js
        try:
            result = subprocess.run(["node", "--version"], 
                                  capture_output=True, 
                                  text=True, 
                                  check=True)
            node_version = result.stdout.strip()
            self.log(f"Node.js version: {node_version}", "SUCCESS")
        except (subprocess.CalledProcessError, FileNotFoundError):
            self.log("ERROR: Node.js not found. Please install Node.js 18+ from https://nodejs.org", "ERROR")
            return False
        
        # Check pnpm
        try:
            result = subprocess.run(["pnpm", "--version"], 
                                  capture_output=True, 
                                  text=True, 
                                  check=True)
            pnpm_version = result.stdout.strip()
            self.log(f"pnpm version: {pnpm_version}", "SUCCESS")
        except (subprocess.CalledProcessError, FileNotFoundError):
            self.log("WARNING: pnpm not found. Installing pnpm...", "WARNING")
            try:
                subprocess.run(["npm", "install", "-g", "pnpm"], check=True)
                self.log("pnpm installed successfully", "SUCCESS")
            except subprocess.CalledProcessError:
                self.log("ERROR: Failed to install pnpm. Please install manually: npm install -g pnpm", "ERROR")
                return False
        
        return True
        
    def install_packages(self):
        """Install npm packages"""
        self.log("Installing dependencies (this may take a few minutes)...")
        
        try:
            process = subprocess.Popen(
                ["pnpm", "install"],
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                text=True,
                bufsize=1
            )
            
            for line in process.stdout:
                line = line.strip()
                if line:
                    self.log(f"  {line}", "INFO")
            
            process.wait()
            
            if process.returncode == 0:
                self.log("Dependencies installed successfully", "SUCCESS")
                return True
            else:
                self.log("ERROR: Failed to install dependencies", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"ERROR: Failed to install dependencies: {e}", "ERROR")
            return False
            
    def build_server(self):
        """Build the server"""
        self.log("Building ALE server...")
        
        try:
            process = subprocess.Popen(
                ["pnpm", "build"],
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                text=True,
                bufsize=1
            )
            
            for line in process.stdout:
                line = line.strip()
                if line:
                    self.log(f"  {line}", "INFO")
            
            process.wait()
            
            if process.returncode == 0:
                self.log("Server built successfully", "SUCCESS")
                return True
            else:
                self.log("ERROR: Failed to build server", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"ERROR: Failed to build server: {e}", "ERROR")
            return False
            
    def start_server(self):
        """Start the ALE server"""
        self.log("Starting ALE server...")
        self.start_time = time.time()
        
        try:
            # Start the server process
            self.process = subprocess.Popen(
                ["pnpm", "start"],
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                text=True,
                bufsize=1
            )
            
            # Monitor server output
            self.monitor_server_output()
            
        except Exception as e:
            self.log(f"ERROR: Failed to start server: {e}", "ERROR")
            return False
            
    def monitor_server_output(self):
        """Monitor server output and log it"""
        server_started = False
        
        for line in self.process.stdout:
            line = line.strip()
            if not line:
                continue
                
            # Log the output
            if "error" in line.lower() or "failed" in line.lower():
                self.log(f"SERVER: {line}", "ERROR")
            elif "warning" in line.lower():
                self.log(f"SERVER: {line}", "WARNING")
            else:
                self.log(f"SERVER: {line}", "INFO")
            
            # Check if server started successfully
            if "Server running on" in line and not server_started:
                server_started = True
                self.log("=" * 70, "SUCCESS")
                self.log("ALE SERVER STARTED SUCCESSFULLY!", "SUCCESS")
                self.log(f"Server URL: {line.split('on')[1].strip()}", "SUCCESS")
                self.log("=" * 70, "SUCCESS")
                self.log_forge_connection()
                
    def log_forge_connection(self):
        """Log Forge API connection details"""
        self.log("=" * 70, "INFO")
        self.log("FORGE API CONNECTION", "INFO")
        self.log("=" * 70, "INFO")
        
        # Read .env file
        forge_url = "https://forge.manus.ai"
        forge_key_set = False
        
        env_file = Path(".env")
        if env_file.exists():
            with open(env_file, "r") as f:
                for line in f:
                    if line.startswith("BUILT_IN_FORGE_API_URL="):
                        url = line.split("=", 1)[1].strip()
                        if url:
                            forge_url = url
                    elif line.startswith("BUILT_IN_FORGE_API_KEY="):
                        key = line.split("=", 1)[1].strip()
                        if key and key != "your_forge_api_key_here":
                            forge_key_set = True
        
        self.log(f"Forge API URL: {forge_url}/v1/chat/completions", "INFO")
        self.log(f"API Key Status: {'✓ Configured' if forge_key_set else '✗ NOT CONFIGURED'}", 
                "SUCCESS" if forge_key_set else "ERROR")
        
        if forge_key_set:
            self.log("Available Models:", "INFO")
            models = [
                "gpt-4.1-mini", "gpt-4.1-nano", "gemini-2.5-flash",
                "gpt-4o", "claude-3.5-sonnet", "llama-3.3-70b",
                "and 25+ more models..."
            ]
            for model in models:
                self.log(f"  - {model}", "INFO")
        
        self.log("=" * 70, "INFO")
        
    def show_runtime_stats(self):
        """Show runtime statistics"""
        if self.start_time:
            uptime = int(time.time() - self.start_time)
            hours = uptime // 3600
            minutes = (uptime % 3600) // 60
            seconds = uptime % 60
            
            self.log("=" * 70, "INFO")
            self.log(f"Server Uptime: {hours:02d}:{minutes:02d}:{seconds:02d}", "INFO")
            self.log("=" * 70, "INFO")
            
    def handle_shutdown(self, signum=None, frame=None):
        """Handle graceful shutdown"""
        self.log("Shutting down ALE server...", "WARNING")
        self.running = False
        
        if self.process:
            self.process.terminate()
            try:
                self.process.wait(timeout=10)
                self.log("Server stopped gracefully", "SUCCESS")
            except subprocess.TimeoutExpired:
                self.log("Force killing server...", "WARNING")
                self.process.kill()
                
        self.show_runtime_stats()
        
        if self.log_file:
            self.log_file.close()
            
        self.log("ALE server shutdown complete", "SUCCESS")
        sys.exit(0)
        
    def run(self):
        """Main run method"""
        self.print_banner()
        
        # Setup logging
        log_file = self.setup_logging()
        print(f"\n{Colors.OKGREEN}Logging to: {log_file}{Colors.ENDC}\n")
        
        # Check environment
        if not self.check_environment():
            self.log("Please configure .env file and restart", "ERROR")
            input("\nPress Enter to exit...")
            return
            
        # Check dependencies
        if not self.check_dependencies():
            input("\nPress Enter to exit...")
            return
            
        # Check if node_modules exists
        if not Path("node_modules").exists():
            self.log("Dependencies not installed. Installing now...", "WARNING")
            if not self.install_packages():
                input("\nPress Enter to exit...")
                return
        else:
            self.log("Dependencies already installed", "SUCCESS")
            
        # Check if dist folder exists
        if not Path("dist").exists():
            self.log("Server not built. Building now...", "WARNING")
            if not self.build_server():
                input("\nPress Enter to exit...")
                return
        else:
            self.log("Server already built", "SUCCESS")
            
        # Setup signal handlers for graceful shutdown
        signal.signal(signal.SIGINT, self.handle_shutdown)
        signal.signal(signal.SIGTERM, self.handle_shutdown)
        
        # Start server
        self.start_server()
        
        # Keep the script running
        try:
            while self.running:
                time.sleep(1)
        except KeyboardInterrupt:
            self.handle_shutdown()

if __name__ == "__main__":
    launcher = ALEServerLauncher()
    launcher.run()
