from etl.extract import extract_sheet
from etl.transform import clean_leads
from etl.load import load_to_postgres

def main():
    print("Starting ETL for Google Sheets >>> PostgreSQL")

    # 1. Extract
    df = extract_sheet("Leads")

    # 2. Transform
    clean_df = clean_leads(df)
    print(f"Extracted {len(clean_df)} rows from Google Sheet.")
    
    # 3. Load
    if not clean_df.empty:
        load_to_postgres(clean_df, "lead")
        print(f"Loaded {len(clean_df)} rows into 'lead' table.")
    else:
        print("No new rows to load.")

    print("Sheet ETL completed successfully.")

if __name__ == "__main__":
    main()
