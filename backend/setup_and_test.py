"""
Quick Test Setup Script
Guides you through setting up and running the tests
"""

import subprocess
import sys
import os
from pathlib import Path


def run_command(cmd, description=""):
    """Run a shell command"""
    if description:
        print(f"\n{'='*60}")
        print(f"🔧 {description}")
        print(f"{'='*60}")
    
    print(f"Running: {cmd}\n")
    
    try:
        result = subprocess.run(cmd, shell=True, capture_output=False)
        return result.returncode == 0
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return False


def check_requirements():
    """Check if all requirements are met"""
    print("\n" + "="*60)
    print("✅ CHECKING REQUIREMENTS")
    print("="*60)
    
    # Check .env file
    print("\n1. Checking .env file...")
    if not Path(".env").exists():
        print("   ❌ .env file not found!")
        print("   📝 Creating .env from template...")
        
        if Path(".env.example").exists():
            with open(".env.example", "r") as f:
                content = f.read()
            with open(".env", "w") as f:
                f.write(content)
            print("   ✓ .env created (please add your GEMINI_API_KEY)")
        return False
    else:
        print("   ✓ .env file exists")
        
        # Check if API key is set
        with open(".env", "r") as f:
            if "your_gemini_api_key_here" in f.read():
                print("   ⚠️  GEMINI_API_KEY not configured!")
                print("      Please edit .env and add your API key from https://makersuite.google.com/app/apikey")
                return False
    
    print("   ✓ GEMINI_API_KEY configured")
    
    # Check reports directory
    print("\n2. Checking sample resumes directory...")
    resumes_dir = Path("data/sample_resumes")
    
    if not resumes_dir.exists():
        print(f"   ℹ️  Directory {resumes_dir} does not exist (will be created)")
    else:
        existing = list(resumes_dir.glob("*.pdf"))
        if existing:
            print(f"   ✓ Found {len(existing)} resume PDFs")
        else:
            print(f"   ⚠️  No PDFs found in {resumes_dir}")
    
    return True


def main():
    """Main setup and testing guide"""
    
    print("""
╔════════════════════════════════════════════════════════════════╗
║          RESUME RANKER - BACKEND TESTING SETUP               ║
╚════════════════════════════════════════════════════════════════╝
    """)
    
    # Check working directory
    if not Path("src/app.py").exists():
        print("❌ ERROR: Please run this script from the Model directory")
        print("   Current location should contain: src/, data/, requirements.txt")
        return
    
    # Check requirements
    if not check_requirements():
        print("\n❌ Requirements check failed!")
        print("   Please configure your environment before testing")
        return
    
    print("\n" + "="*60)
    print("✅ ALL REQUIREMENTS MET")
    print("="*60)
    
    # Generate sample resumes
    print("\nGenerating sample resumes...")
    if run_command("python gen_sample_resumes.py", "Generate Sample Resumes"):
        print("✓ Sample resumes generated successfully")
    else:
        print("❌ Failed to generate resumes")
        print("   Make sure reportlab is installed: pip install reportlab")
    
    # Start Flask app
    print("\n" + "="*60)
    print("🚀 STARTING FLASK BACKEND")
    print("="*60)
    print("\nThe Flask app will start on http://localhost:5000")
    print("Leave this running and open a NEW TERMINAL for testing")
    print("(Press Ctrl+C to stop the server)\n")
    
    input("Press Enter to start the Flask backend...")
    
    run_command("python -m src.app", "Starting Flask Backend")


if __name__ == "__main__":
    main()
