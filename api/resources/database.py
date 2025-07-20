from flask_restful import Resource
from flask import request
from db.db_config import db
import os
from pathlib import Path
from api.utils.logging_config import get_logger

logger = get_logger('api.resources.database')

class DatabaseInitResource(Resource):
    """Resource for database initialization operations."""
    
    def get(self):
        """Check database initialization status."""
        try:
            from sqlalchemy import inspect
            inspector = inspect(db.engine)
            existing_tables = inspector.get_table_names()
            
            return {
                'status': 'info',
                'message': 'Database status check',
                'tables_found': len(existing_tables),
                'table_names': existing_tables[:10] if existing_tables else [],
                'initialized': len(existing_tables) > 0,
                'note': 'Use POST to this endpoint to initialize database if not initialized'
            }
            
        except Exception as e:
            logger.error(f"Database status check failed: {e}")
            return {
                'status': 'error',
                'message': 'Database status check failed', 
                'error': str(e)
            }, 500
    
    def post(self):
        """Initialize database with schema (one-time setup)."""
        try:
            # Check if tables already exist
            from sqlalchemy import inspect, text
            inspector = inspect(db.engine)
            existing_tables = inspector.get_table_names()
            
            if len(existing_tables) > 0:
                return {
                    'status': 'info',
                    'message': 'Database already initialized',
                    'existing_tables': len(existing_tables),
                    'table_names': existing_tables[:5]
                }
            
            # Read and execute init.sql
            project_root = Path(__file__).parent.parent.parent
            init_sql_path = project_root / "db" / "init.sql"
            
            if not init_sql_path.exists():
                return {
                    'status': 'error',
                    'message': 'init.sql file not found'
                }, 404
            
            with open(init_sql_path, 'r') as f:
                sql_content = f.read()
            
            # Execute SQL statements
            statements = [stmt.strip() for stmt in sql_content.split(';') if stmt.strip()]
            successful = 0
            errors = 0
            
            with db.engine.connect() as conn:
                for statement in statements:
                    if statement and not statement.upper().startswith('--'):
                        try:
                            conn.execute(text(statement))
                            conn.commit()
                            successful += 1
                        except Exception as e:
                            errors += 1
                            if errors <= 3:  # Only log first few errors
                                logger.warning(f"SQL execution warning: {str(e)[:100]}")
            
            # Verify tables were created
            inspector = inspect(db.engine)
            final_tables = inspector.get_table_names()
            
            logger.info(f"Database initialized: {successful} statements executed, {len(final_tables)} tables created")
            
            return {
                'status': 'success',
                'message': 'Database initialized successfully',
                'statements_executed': successful,
                'warnings': errors,
                'tables_created': len(final_tables),
                'table_names': final_tables
            }
            
        except Exception as e:
            logger.error(f"Database initialization failed: {e}")
            return {
                'status': 'error',
                'message': 'Database initialization failed',
                'error': str(e)
            }, 500 