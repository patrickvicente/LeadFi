#!/usr/bin/env python3
"""
Railway Database Initialization Script

This script initializes the PostgreSQL database on Railway with the required schema.
Run this once after deploying to set up all database tables.
"""

import os
import sys
from pathlib import Path

# Add project root to path
project_root = Path(__file__).parent.parent
sys.path.append(str(project_root))

def init_railway_database():
    """Initialize Railway PostgreSQL database with schema."""
    print("🚂 Initializing Railway PostgreSQL Database...")
    
    # Import after adding to path
    from db.db_config import engine, get_db_url
    from sqlalchemy import text
    
    # Verify we're using PostgreSQL (not SQLite)
    db_url = get_db_url()
    if 'postgresql://' not in db_url:
        print("❌ Error: This script is for PostgreSQL only")
        print(f"Current database: {db_url}")
        return False
    
    print(f"✅ Connected to PostgreSQL: {db_url.split('@')[0]}@***")
    
    # Read the init.sql file
    init_sql_path = project_root / "db" / "init.sql"
    if not init_sql_path.exists():
        print(f"❌ Error: init.sql not found at {init_sql_path}")
        return False
    
    print("📄 Reading database schema...")
    with open(init_sql_path, 'r') as f:
        sql_content = f.read()
    
    # Split into individual statements
    statements = [stmt.strip() for stmt in sql_content.split(';') if stmt.strip()]
    print(f"📝 Found {len(statements)} SQL statements")
    
    # Execute each statement
    successful = 0
    errors = 0
    
    try:
        with engine.connect() as conn:
            for i, statement in enumerate(statements, 1):
                if statement and not statement.upper().startswith('--'):
                    try:
                        conn.execute(text(statement))
                        conn.commit()
                        successful += 1
                        if i % 10 == 0:  # Progress indicator
                            print(f"⏳ Executed {i}/{len(statements)} statements...")
                    except Exception as e:
                        errors += 1
                        # Only show first few errors to avoid spam
                        if errors <= 3:
                            print(f"⚠️  Statement {i} warning: {str(e)[:100]}...")
                        elif errors == 4:
                            print("⚠️  (suppressing further warnings...)")
        
        print(f"\n✅ Database initialization completed!")
        print(f"📊 Results: {successful} successful, {errors} warnings/errors")
        
        # Verify tables were created
        with engine.connect() as conn:
            result = conn.execute(text("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'"))
            tables = [row[0] for row in result.fetchall()]
            
        print(f"🗄️  Created {len(tables)} tables: {', '.join(tables[:5])}{'...' if len(tables) > 5 else ''}")
        return True
        
    except Exception as e:
        print(f"❌ Critical error during initialization: {e}")
        return False

if __name__ == "__main__":
    print("🏁 Railway Database Setup")
    print("=" * 50)
    
    success = init_railway_database()
    
    if success:
        print("\n🎉 Database initialization successful!")
        print("Your Railway PostgreSQL database is now ready for use.")
    else:
        print("\n💥 Database initialization failed!")
        print("Please check the errors above and try again.")
    
    print("=" * 50) 