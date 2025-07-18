#!/usr/bin/env python3
"""
Local testing script for LeadFi CRM
This script will:
1. Initialize the database with SQLite
2. Run database migrations
3. Start the Flask server
"""

import os
import sys
import subprocess
from pathlib import Path

# Add project root to Python path
project_root = Path(__file__).parent
sys.path.append(str(project_root))

def setup_database():
    """Initialize the local SQLite database"""
    print("🗄️  Setting up local database...")
    
    from db.db_config import engine, get_db_url
    from api.app import app
    
    # Print database URL for verification
    print(f"Database URL: {get_db_url()}")
    
    # Create application context
    with app.app_context():
        from db.db_config import db
        
        # Create all tables (skip PostgreSQL-specific init.sql for SQLite)
        print("Creating database tables from SQLAlchemy models...")
        db.create_all()
        
        print("✅ Database setup complete!")
        print("Note: Using SQLite for local development. PostgreSQL-specific features are disabled.")

def check_dependencies():
    """Check if all required dependencies are installed"""
    print("📦 Checking dependencies...")
    
    try:
        import flask
        import flask_restful
        import flask_cors
        import flask_sqlalchemy
        import marshmallow
        import pandas
        print("✅ Python dependencies OK")
    except ImportError as e:
        print(f"❌ Missing Python dependency: {e}")
        print("Run: pip install -r requirements.txt")
        return False
    
    return True

def build_frontend():
    """Build the React frontend"""
    print("🏗️  Building frontend...")
    
    frontend_dir = project_root / "frontend"
    
    # Check if node_modules exists
    if not (frontend_dir / "node_modules").exists():
        print("Installing frontend dependencies...")
        result = subprocess.run(['npm', 'install'], cwd=frontend_dir, capture_output=True, text=True)
        if result.returncode != 0:
            print(f"❌ npm install failed: {result.stderr}")
            return False
    
    # Build the frontend
    print("Building React app...")
    result = subprocess.run(['npm', 'run', 'build'], cwd=frontend_dir, capture_output=True, text=True)
    if result.returncode != 0:
        print(f"❌ Frontend build failed: {result.stderr}")
        return False
    
    print("✅ Frontend build complete!")
    return True

def start_server():
    """Start the Flask development server"""
    print("🚀 Starting Flask server...")
    print("Server will be available at: http://127.0.0.1:5000")
    print("Health check: http://127.0.0.1:5000/api/health")
    print("Press Ctrl+C to stop the server")
    
    from api.app import app
    app.run(host='127.0.0.1', port=5000, debug=True)

def main():
    """Main function to run all setup steps"""
    print("🏁 LeadFi Local Setup")
    print("=" * 50)
    
    # Check dependencies
    if not check_dependencies():
        return
    
    # Setup database
    try:
        setup_database()
    except Exception as e:
        print(f"❌ Database setup failed: {e}")
        return
    
    # Build frontend
    if not build_frontend():
        return
    
    print("\n🎉 Setup complete! Starting server...")
    print("=" * 50)
    
    # Start server
    start_server()

if __name__ == "__main__":
    main() 