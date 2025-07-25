import os
from dotenv import load_dotenv
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import create_engine
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables from .env
load_dotenv()

# Create SQLAlchemy instance
db = SQLAlchemy()

# Database configuration - uses Railway's PostgreSQL in production, PostgreSQL/SQLite in development
def get_db_url():
    # Check if PostgreSQL environment variables are set
    pghost = os.getenv("PGHOST")
    pgport = os.getenv("PGPORT")
    pgdatabase = os.getenv("PGDATABASE")
    pguser = os.getenv("PGUSER")
    pgpassword = os.getenv("POSTGRES_PASSWORD")
    
    # If we have PostgreSQL configuration, use it (including localhost)
    if pghost and pgdatabase and pguser:
        # Use PostgreSQL (Railway, localhost, or other environment)
        db_config = {
            "host": pghost,
            "port": pgport or "5432",
            "database": pgdatabase,
            "user": pguser,     
            "password": pgpassword or ""  
        }
        url = f"postgresql://{db_config['user']}:{db_config['password']}@{db_config['host']}:{db_config['port']}/{db_config['database']}"
        logger.info(f"PostgreSQL Database URL: postgresql://{db_config['user']}:****@{db_config['host']}:{db_config['port']}/{db_config['database']}")
        return url
    else:
        # Fallback to SQLite if no PostgreSQL config
        db_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'leadfi_local.db')
        url = f"sqlite:///{db_path}"
        logger.info(f"SQLite Database URL: {url}")
        return url

# Create single engine instance
engine = create_engine(get_db_url())

# Test the connection (only in development and not during imports)
if os.getenv("FLASK_ENV") != "production" and __name__ != "__main__":
    try:
        with engine.connect() as conn:
            logger.info("Successfully connected to the database!")
    except Exception as e:
        logger.error(f"Failed to connect to the database: {e}")
        # For SQLite, this is usually not a critical error during setup
        if "sqlite" not in get_db_url():
            logger.warning("Database connection failed - this may cause issues")
else:
    logger.info("Skipping database connection test")

# Initialize Flask-SQLAlchemy with the same URL
# db.init_app(None)  # You'll need to pass your Flask app here if you have one