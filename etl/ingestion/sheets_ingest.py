from etl.extract import extract_sheet
from etl.transform import clean_leads, clean_daily_trading_volume
from etl.load import load_to_postgres

# ingest from Google Sheets
def ingest_leads():
    """
    ETL process for Leads data from Google Sheets to PostgreSQL.
    """
    print("Starting ETL for Leads from Google Sheets >>> PostgreSQL")
    
    try:
        # 1. Extract
        df = extract_sheet("Leads")
        
        # 2. Transform
        clean_df = clean_leads(df)
        print(f"Extracted {len(clean_df)} rows from Leads sheet.")
        
        # 3. Load
        if not clean_df.empty:
            load_to_postgres(clean_df, "lead")
            print(f"Loaded {len(clean_df)} rows into 'lead' table.")
        else:
            print("No new leads to load.")
    
    except Exception as e:
        print(f"Error occurred in leads ingestion: {e}")

def ingest_daily_trading_volume():
    """
    ETL process for Daily Trading Volume and VIP history data from Google Sheets to PostgreSQL.
    """
    print("Starting ETL for Daily Trading Volume from Google Sheets >>> PostgreSQL")

    try:
        # 1. Extract
        df = extract_sheet("Daily Trading Volume")

        if df.empty:
            print("No data found in the Daily Trading Volume sheet.")
            return
        
        # 2. Transform
        trading_df, vip_df = clean_daily_trading_volume(df)
        print(f"Extracted {len(trading_df)} rows from Daily Trading Volume sheet.")
        
        # 3. Load
        if not trading_df.empty:
            # Load trading volume data
            load_to_postgres(trading_df, "daily_trading_volume")
            print(f"Loaded {len(trading_df)} rows into 'daily_trading_volume' table.")
        else:
            print("No new trading volume data to load.")
        
        if not vip_df.empty:
            # Load VIP History data
            load_to_postgres(vip_df, "vip_history")
            print(f"Loaded {len(vip_df)} rows into 'vip_history' table.")
        else:
            print("No new VIP history data to load.")
    
    except Exception as e:
        print(f"Error occurred in Daily Trading Volume ingestion: {e}")

def main():
    # Ingest Leads
    ingest_leads()

    # Ingest daily trading volume
    ingest_daily_trading_volume()

if __name__ == "__main__":
    main()
