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

# Database configuration
DB_CONFIG = {
    "host": os.getenv("DB_HOST", "localhost"),
    "port": os.getenv("DB_PORT", "5432"),
    "database": os.getenv("DB_NAME", "personal_crm"),
    "user": os.getenv("DB_USER", "patrickvicente"),     
    "password": os.getenv("DB_PASSWORD", "")  
}

# Log the configuration (without password)
logger.info(f"Database configuration: {DB_CONFIG['host']}:{DB_CONFIG['port']}/{DB_CONFIG['database']} (user: {DB_CONFIG['user']})")

# Build DB URL
def get_db_url():
    url = f"postgresql://{DB_CONFIG['user']}:{DB_CONFIG['password']}@{DB_CONFIG['host']}:{DB_CONFIG['port']}/{DB_CONFIG['database']}"
    logger.info(f"Database URL: postgresql://{DB_CONFIG['user']}:****@{DB_CONFIG['host']}:{DB_CONFIG['port']}/{DB_CONFIG['database']}")
    return url

# Create single engine instance
engine = create_engine(get_db_url())

# Test the connection
try:
    with engine.connect() as conn:
        logger.info("Successfully connected to the database!")
except Exception as e:
    logger.error(f"Failed to connect to the database: {e}")
    raise

# Initialize Flask-SQLAlchemy with the same URL
# db.init_app(None)  # You'll need to pass your Flask app here if you have one