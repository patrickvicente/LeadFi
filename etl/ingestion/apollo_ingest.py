import os
import glob
import pandas as pd
from etl.transform import clean_apollo_csv
from etl.load import load_to_postgres

# Looks at the lastest cv in file directory
def get_latest_csv(directory: str):
    list_of_files = glob.glob(os.path.join(directory, "*.csv"))
    if not list_of_files:
        raise FileNotFoundError("No CSV files found in Apollo export directory")
    return max(list_of_files, key=os.path.getmtime)

# Ingest lastest Apollo CSV
def ingest_apollo_leads():
    csv_dir = "data/apollo_exports"
    latest_file = get_latest_csv(csv_dir)

    print(f"Reading Apollo export: {latest_file}")
    df = pd.read_csv(latest_file)

    print("Cleaning Apollo data...")
    clean_df = clean_apollo_csv(df)

    print("Loading into database")
    if not clean_df.empty:
        load_to_postgres(clean_df, "lead")
        print(f"Loaded {len(clean_df)} Apollo data into 'lead' table.")
    else:
        print("No new Apollo data to load.")

    print("Apollo ETL completed successfully.")

if __name__ == "__main__":
    ingest_apollo_leads()

    