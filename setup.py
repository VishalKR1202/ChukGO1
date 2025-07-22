#!/usr/bin/env python3
"""
Setup script for ChukChukGO
"""

import subprocess
import sys
import os

def install_requirements():
    """Install Python requirements"""
    try:
        subprocess.check_call([sys.executable, '-m', 'pip', 'install', '-r', 'requirements.txt'])
        print("✅ Python dependencies installed successfully!")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Failed to install Python dependencies: {e}")
        return False

def setup_database():
    """Setup database configuration"""
    env_file = '.env'
    if not os.path.exists(env_file):
        print("⚠️  .env file not found. Please create one with your database configuration.")
        print("Example .env content:")
        print("""
DB_HOST=localhost
DB_NAME=chukchukgo
DB_USER=postgres
DB_PASSWORD=your_password
DB_PORT=5432
FLASK_ENV=development
SECRET_KEY=your-secret-key
DEBUG=True
PORT=5000
        """)
        return False
    
    print("✅ Environment configuration found!")
    return True

def main():
    print("🚂 ChukChukGO Setup")
    print("=" * 50)
    
    # Install Python dependencies
    if not install_requirements():
        sys.exit(1)
    
    # Check database configuration
    if not setup_database():
        print("⚠️  Please configure your database settings in .env file")
    
    print("\n🎉 Setup completed!")
    print("\nNext steps:")
    print("1. Configure your PostgreSQL database")
    print("2. Update .env file with your database credentials")
    print("3. Run: python run.py")
    print("4. Open http://localhost:5000 in your browser")

if __name__ == '__main__':
    main()