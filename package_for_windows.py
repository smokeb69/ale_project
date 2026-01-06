#!/usr/bin/env python3
"""
Package ALE for Windows Distribution
Creates a ready-to-use ZIP package for Windows users
"""

import os
import shutil
import zipfile
from pathlib import Path
from datetime import datetime

def create_windows_package():
    """Create a Windows distribution package"""
    
    print("=" * 70)
    print("ALE Forge - Windows Package Creator")
    print("=" * 70)
    print()
    
    # Package name with timestamp
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    package_name = f"ALE_Forge_Windows_Standalone_{timestamp}"
    package_dir = Path(package_name)
    
    # Files and directories to include
    include_items = [
        "START_ALE_SERVER.bat",
        "start_ale_server.py",
        "README_WINDOWS_SETUP.md",
        ".env.example",
        "package.json",
        "pnpm-lock.yaml",
        "tsconfig.json",
        "tsconfig.node.json",
        "vite.config.ts",
        "vitest.config.ts",
        "components.json",
        "drizzle.config.ts",
        ".prettierrc",
        ".prettierignore",
        "server/",
        "client/",
        "shared/",
        "drizzle/",
        "patches/",
    ]
    
    # Files to exclude
    exclude_patterns = [
        "node_modules",
        "dist",
        ".git",
        ".manus",
        "*.log",
        "ale.db",
        "ale.db-journal",
        ".env",
        "__pycache__",
        "*.pyc",
        ".DS_Store",
        "Thumbs.db",
    ]
    
    print(f"Creating package directory: {package_dir}")
    
    # Create package directory
    if package_dir.exists():
        shutil.rmtree(package_dir)
    package_dir.mkdir()
    
    # Copy files
    print("\nCopying files...")
    for item in include_items:
        src = Path(item)
        if not src.exists():
            print(f"  ⚠ Skipping {item} (not found)")
            continue
            
        dst = package_dir / item
        
        if src.is_dir():
            print(f"  📁 Copying directory: {item}")
            shutil.copytree(src, dst, ignore=shutil.ignore_patterns(*exclude_patterns))
        else:
            print(f"  📄 Copying file: {item}")
            dst.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(src, dst)
    
    # Create additional files
    print("\nCreating additional files...")
    
    # Create INSTALL.txt
    install_txt = package_dir / "INSTALL.txt"
    with open(install_txt, "w") as f:
        f.write("""
╔══════════════════════════════════════════════════════════════════════╗
║                    ALE FORGE - INSTALLATION GUIDE                    ║
╚══════════════════════════════════════════════════════════════════════╝

QUICK START:
1. Install Python 3.8+ from https://www.python.org/downloads/
   (Make sure to check "Add Python to PATH" during installation)

2. Install Node.js 18+ from https://nodejs.org/

3. Double-click START_ALE_SERVER.bat

4. On first run, edit .env file with your Forge API key

5. Run START_ALE_SERVER.bat again

6. Open http://localhost:3000 in your browser

DETAILED INSTRUCTIONS:
See README_WINDOWS_SETUP.md for complete documentation

SUPPORT:
GitHub: https://github.com/smokeb69/ale_project
""")
    print(f"  ✓ Created {install_txt}")
    
    # Create VERSION.txt
    version_txt = package_dir / "VERSION.txt"
    with open(version_txt, "w") as f:
        f.write(f"""ALE Forge - Standalone Windows Edition
Version: 1.0.0
Build Date: {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}
Package: {package_name}

Features:
- Standalone operation (no VS Code required)
- 30+ AI models via Forge API
- Fixed session management
- Python booter with logging
- Windows-native launcher
- Auto-setup and dependency management

Changes from Original:
✓ Fixed Forge API routing (https://forge.manus.ai/v1/chat/completions)
✓ Fixed session fetch errors on Windows
✓ Added Python launcher with connection logging
✓ Added Windows batch file launcher
✓ Removed VS Code server dependency
✓ Added comprehensive documentation
✓ Added auto-setup for dependencies
""")
    print(f"  ✓ Created {version_txt}")
    
    # Create logs directory
    logs_dir = package_dir / "logs"
    logs_dir.mkdir(exist_ok=True)
    (logs_dir / ".gitkeep").touch()
    print(f"  ✓ Created logs directory")
    
    # Create ZIP archive
    print("\nCreating ZIP archive...")
    zip_filename = f"{package_name}.zip"
    
    with zipfile.ZipFile(zip_filename, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for root, dirs, files in os.walk(package_dir):
            # Filter out excluded patterns
            dirs[:] = [d for d in dirs if not any(pattern in d for pattern in exclude_patterns)]
            
            for file in files:
                file_path = Path(root) / file
                arcname = file_path.relative_to(package_dir.parent)
                zipf.write(file_path, arcname)
                
    print(f"  ✓ Created {zip_filename}")
    
    # Get package size
    zip_size = Path(zip_filename).stat().st_size / (1024 * 1024)  # MB
    
    # Cleanup temporary directory
    print("\nCleaning up...")
    shutil.rmtree(package_dir)
    print(f"  ✓ Removed temporary directory")
    
    # Summary
    print("\n" + "=" * 70)
    print("PACKAGE CREATED SUCCESSFULLY!")
    print("=" * 70)
    print(f"Package: {zip_filename}")
    print(f"Size: {zip_size:.2f} MB")
    print()
    print("DISTRIBUTION INSTRUCTIONS:")
    print("1. Upload the ZIP file to your distribution platform")
    print("2. Users should extract the ZIP to a folder")
    print("3. Users should read INSTALL.txt or README_WINDOWS_SETUP.md")
    print("4. Users should double-click START_ALE_SERVER.bat to run")
    print()
    print("=" * 70)

if __name__ == "__main__":
    try:
        create_windows_package()
    except Exception as e:
        print(f"\nERROR: {e}")
        import traceback
        traceback.print_exc()
        input("\nPress Enter to exit...")
