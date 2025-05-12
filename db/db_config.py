import os
from dotenv import load_dotenv
from flask_sqlalchemy import SQLAlchemy

# Load environment variables from .env
load_dotenv()

# Create SQLAlchemy instance
db = SQLAlchemy()

# Database configuration
DB_CONFIG = {
    "host": os.getenv("DB_HOST", "localhost"),
    "port": os.getenv("DB_PORT", "5432"),
    "database": os.getenv("DB_NAME", "your_db"),
    "user": os.getenv("DB_USER", "username"),     
    "password": os.getenv("DB_PASSWORD", "password")  
}

# Build DB URL
def get_db_url():
    return f"postgresql://{DB_CONFIG['user']}:{DB_CONFIG['password']}@{DB_CONFIG['host']}:{DB_CONFIG['port']}/{DB_CONFIG['database']}"