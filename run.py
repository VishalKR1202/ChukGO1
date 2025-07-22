#!/usr/bin/env python3
"""
ChukChukGO - Train Ticket Booking System
Python Flask Backend Server
"""

import os
import sys

# Add the current directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import app

if __name__ == '__main__':
    print("=" * 50)
    print("ChukChukGO - Train Ticket Booking System")
    print("=" * 50)
    print("Starting server...")
    print("Frontend: HTML/CSS/JavaScript")
    print("Backend: Python Flask")
    print("Database: PostgreSQL")
    print("=" * 50)
    
    # Run the Flask application
    app.run(
        host='0.0.0.0',
        port=int(os.getenv('PORT', 5000)),
        debug=os.getenv('DEBUG', 'True').lower() == 'true'
    )