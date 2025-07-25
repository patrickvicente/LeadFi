from flask_restful import Resource
from flask import request
from db.db_config import db
import os
from pathlib import Path
from api.utils.logging_config import get_logger
import subprocess
import sys
from sqlalchemy import inspect, text

logger = get_logger('api.resources.database')

class DatabaseInitResource(Resource):
    """Resource for database initialization operations."""
    
    def get(self):
        """Check database initialization status."""
        try:
            inspector = inspect(db.engine)
            existing_tables = inspector.get_table_names()
            
            # Check if test data exists
            test_data_exists = False
            if existing_tables:
                try:
                    with db.engine.connect() as conn:
                        result = conn.execute("SELECT COUNT(*) as count FROM lead")
                        lead_count = result.fetchone()[0]
                        test_data_exists = lead_count > 0
                except:
                    pass
            
            return {
                'status': 'info',
                'message': 'Database status check',
                'tables_found': len(existing_tables),
                'table_names': existing_tables[:10] if existing_tables else [],
                'initialized': len(existing_tables) > 0,
                'test_data_exists': test_data_exists,
                'note': 'Use POST to this endpoint to initialize database. Add ?mode=test_data to generate test data.'
            }
            
        except Exception as e:
            logger.error(f"Database status check failed: {e}")
            return {
                'status': 'error',
                'message': 'Database status check failed', 
                'error': str(e)
            }, 500
    
    def post(self):
        """Initialize database with schema and optionally test data."""
        try:
            # Get initialization mode from query parameters
            mode = request.args.get('mode', 'schema_only')  # schema_only, test_data, full_demo
            
            # Set DEMO_MODE environment variable if in full_demo mode
            if mode == 'full_demo':
                os.environ['DEMO_MODE'] = 'true'
                logger.info("DEMO_MODE set to true for full_demo initialization")
            
            # Check if tables already exist
            inspector = inspect(db.engine)
            existing_tables = inspector.get_table_names()
            
            if len(existing_tables) > 0 and mode == 'schema_only':
                return {
                    'status': 'info',
                    'message': 'Database already initialized',
                    'existing_tables': len(existing_tables),
                    'table_names': existing_tables[:5]
                }
            
            # Initialize schema first
            schema_result = self._initialize_schema()
            if schema_result.get('status') != 'success':
                return schema_result
            
            # Verify tables were actually created
            inspector = inspect(db.engine)
            final_tables = inspector.get_table_names()
            logger.info(f"Tables after schema initialization: {final_tables}")
            
            if len(final_tables) == 0:
                return {
                    'status': 'error',
                    'message': 'Schema initialization completed but no tables were created',
                    'schema_result': schema_result
                }
            
            # Handle different modes
            if mode == 'test_data':
                test_data_result = self._generate_test_data()
                return {
                    'status': 'success',
                    'message': 'Database initialized with test data',
                    'schema': schema_result,
                    'test_data': test_data_result
                }
            elif mode == 'full_demo':
                demo_result = self._setup_demo_environment()
                return {
                    'status': 'success', 
                    'message': 'Database initialized for full demo',
                    'schema': schema_result,
                    'demo_setup': demo_result
                }
            else:
                return schema_result
            
        except Exception as e:
            logger.error(f"Database initialization failed: {e}")
            return {
                'status': 'error',
                'message': 'Database initialization failed',
                'error': str(e)
            }, 500
    
    def _parse_sql_statements(self, sql_content):
        """Parse SQL content into individual statements, handling PostgreSQL functions."""
        # Use a more robust approach - execute the entire SQL file as one transaction
        # This ensures proper order and handles all PostgreSQL syntax correctly
        return [sql_content]
    
    def _initialize_schema(self):
        """Initialize database schema."""
        try:
            # Read and execute init.sql
            project_root = Path(__file__).parent.parent.parent
            init_sql_path = project_root / "db" / "init.sql"
            
            if not init_sql_path.exists():
                return {
                    'status': 'error',
                    'message': 'init.sql file not found'
                }
            
            with open(init_sql_path, 'r') as f:
                sql_content = f.read()
            
            logger.info(f"Read SQL file: {len(sql_content)} characters")
            
            # Parse SQL statements properly (handle functions, comments, etc.)
            statements = self._parse_sql_statements(sql_content)
            logger.info(f"Parsed {len(statements)} SQL statements")
            
            if len(statements) == 0:
                return {
                    'status': 'error',
                    'message': 'No SQL statements found in init.sql',
                    'sql_file_size': len(sql_content)
                }
            successful = 0
            errors = 0
            
            # Execute SQL statements in order using SQLAlchemy
            with db.engine.connect() as conn:
                # Start a transaction
                trans = conn.begin()
                try:
                    # Execute the entire SQL content as one statement
                    # This ensures proper order and handles functions correctly
                    conn.execute(text(sql_content))
                    trans.commit()
                    successful = 1
                    logger.info("SQL file executed successfully as one transaction")
                except Exception as e:
                    trans.rollback()
                    errors = 1
                    logger.error(f"SQL execution failed: {str(e)}")
                    return {
                        'status': 'error',
                        'message': 'SQL execution failed',
                        'error': str(e)
                    }
            
            # Verify tables were created
            inspector = inspect(db.engine)
            final_tables = inspector.get_table_names()
            
            logger.info(f"Database schema initialized: {successful} statements executed, {len(final_tables)} tables created")
            
            # Only return success if we actually executed statements and created tables
            if successful == 0:
                return {
                    'status': 'error',
                    'message': 'No SQL statements were executed successfully',
                    'statements_executed': successful,
                    'errors': errors,
                    'tables_created': len(final_tables),
                    'table_names': final_tables
                }
            
            if len(final_tables) == 0:
                return {
                    'status': 'error',
                    'message': 'SQL statements executed but no tables were created',
                    'statements_executed': successful,
                    'errors': errors,
                    'tables_created': len(final_tables),
                    'table_names': final_tables
                }
            
            return {
                'status': 'success',
                'message': 'Schema initialized successfully',
                'statements_executed': successful,
                'errors': errors,
                'tables_created': len(final_tables),
                'table_names': final_tables
            }
            
        except Exception as e:
            logger.error(f"Schema initialization failed: {e}")
            return {
                'status': 'error',
                'message': 'Schema initialization failed',
                'error': str(e)
            }
    
    def _generate_test_data(self):
        """Generate test data using the test data script."""
        try:
            project_root = Path(__file__).parent.parent.parent
            script_path = project_root / "scripts" / "generate_test_data.py"
            
            if not script_path.exists():
                return {
                    'status': 'error',
                    'message': 'Test data generation script not found'
                }
            
            # Set environment variables for test data generation
            env = os.environ.copy()
            env['DATA_VOLUME'] = 'medium'  # small, medium, large
            env['CLEAR_EXISTING_DATA'] = 'false'  # Don't clear existing data
            
            # Run the test data generation script
            result = subprocess.run(
                [sys.executable, str(script_path)],
                capture_output=True,
                text=True,
                env=env,
                cwd=project_root
            )
            
            if result.returncode == 0:
                return {
                    'status': 'success',
                    'message': 'Test data generated successfully',
                    'output': result.stdout[-500:]  # Last 500 chars of output
                }
            else:
                return {
                    'status': 'error',
                    'message': 'Test data generation failed',
                    'error': result.stderr
                }
                
        except Exception as e:
            logger.error(f"Test data generation failed: {e}")
            return {
                'status': 'error',
                'message': 'Test data generation failed',
                'error': str(e)
            }
    
    def _setup_demo_environment(self):
        """Setup full demo environment with RBAC and extended test data."""
        try:
            # Verify tables exist before proceeding
            inspector = inspect(db.engine)
            tables = inspector.get_table_names()
            logger.info(f"Tables before demo setup: {tables}")
            
            if 'lead' not in tables:
                return {
                    'status': 'error',
                    'message': 'Lead table not found. Schema may not be properly initialized.',
                    'available_tables': tables
                }
            
            # Generate extended test data (6 months)
            env = os.environ.copy()
            env['DATA_VOLUME'] = 'large'
            env['CLEAR_EXISTING_DATA'] = 'true'
            env['DEMO_MODE'] = 'true'
            
            project_root = Path(__file__).parent.parent.parent
            script_path = project_root / "scripts" / "generate_test_data.py"
            
            result = subprocess.run(
                [sys.executable, str(script_path)],
                capture_output=True,
                text=True,
                env=env,
                cwd=project_root
            )
            
            if result.returncode != 0:
                return {
                    'status': 'error',
                    'message': 'Demo data generation failed',
                    'error': result.stderr
                }
            
            # Setup RBAC (we'll implement this next)
            rbac_result = self._setup_rbac()
            
            return {
                'status': 'success',
                'message': 'Demo environment setup complete',
                'data_generation': 'success',
                'rbac_setup': rbac_result
            }
            
        except Exception as e:
            logger.error(f"Demo setup failed: {e}")
            return {
                'status': 'error',
                'message': 'Demo setup failed',
                'error': str(e)
            }
    
    def _setup_rbac(self):
        """Setup Role-Based Access Control system."""
        try:
            project_root = Path(__file__).parent.parent.parent
            script_path = project_root / "scripts" / "setup_rbac.py"
            
            if not script_path.exists():
                return {
                    'status': 'error',
                    'message': 'RBAC setup script not found'
                }
            
            # Run the RBAC setup script
            result = subprocess.run(
                [sys.executable, str(script_path)],
                capture_output=True,
                text=True,
                env=os.environ.copy(),
                cwd=project_root
            )
            
            if result.returncode == 0:
                return {
                    'status': 'success',
                    'message': 'RBAC setup completed successfully',
                    'output': result.stdout[-500:]  # Last 500 chars of output
                }
            else:
                return {
                    'status': 'error',
                    'message': 'RBAC setup failed',
                    'error': result.stderr
                }
                
        except Exception as e:
            logger.error(f"RBAC setup failed: {e}")
            return {
                'status': 'error',
                'message': 'RBAC setup failed',
                'error': str(e)
            } 