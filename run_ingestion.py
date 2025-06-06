import os
import sys

# Add the project root directory to Python path
project_root = os.path.dirname(os.path.abspath(__file__))
sys.path.append(project_root)

# Run the ingestion script
from etl.ingestion.sheets_ingest import main

if __name__ == "__main__":
    main() 