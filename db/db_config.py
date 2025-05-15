import os
from dotenv import load_dotenv
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import create_engine

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

# Create single engine instance
engine = create_engine(get_db_url())

# Initialize Flask-SQLAlchemy with the same URL
# db.init_app(None)  # You'll need to pass your Flask app here if you have one