from etl.extract import extract_sheet, get_sheet, update_sheet_status
from etl.transform import clean_leads, clean_daily_trading_volume
from etl.load import load_to_postgres
from db.db_config import engine

def ingest_leads():
    """
    Extract, transform, and load lead data from Google Sheets
    """
    print("Starting ETL for Leads from Google Sheets >>> PostgreSQL")
    
    try:
        # 1. Extract data
        df = extract_sheet("Leads")
        if df.empty:
            print(f"No data found in the Leads sheet.")
            return
        
        # Replace blanks (NaN) int he upload_status column with 'PENDING'
        df['upload_status'] = df['upload_status'].fillna('PENDING')
        df['upload_status'] = df['upload_status'].replace('', 'PENDING')

        # Filter for only pending records
        df = df[df['upload_status'].str.upper() == 'PENDING']
        if df.empty:
            print(f"No pending data to load")
            return

        # 2. Transform
        leads_df, original_indices = clean_leads(df)
        print(f"Extracted {len(leads_df)} rows from Leads sheet.")
        if leads_df.empty:
            print(f"No new data to load")
            return
        
        # 3. Load and start a transaction
        sheet = get_sheet("Leads")
        with engine.begin() as connection:
            try:
                # Load data using the existing load_to_postgres
                load_to_postgres(leads_df, 'lead')
                # Update status in Google Sheets using original indices
                update_sheet_status(sheet, original_indices, 'PROCESSED')
            
            
            except Exception as e:
                # Update status to ERROR in Google Sheets
                print(f"Error during loading: {e}")
                update_sheet_status(sheet, original_indices, 'ERROR')
                raise

    except Exception as e:
        print(f"Error occurred in leads ingestion: {e}")

def ingest_daily_trading_volume():
    """
    ETL process for Daily Trading Volume and VIP history data from Google Sheets to PostgreSQL.
    """
    print("Starting ETL for Daily Trading Volume from Google Sheets >>> PostgreSQL")

    try:
        # 1. Extract Data
        df = extract_sheet("Daily Trading Volume")

        if df.empty:
            print("No data found in the Daily Trading Volume sheet.")
            return
        
        # Replace blanks (NaN) in the 'upload_status' column with 'PENDING'
        df['upload_status'] = df['upload_status'].fillna('PENDING')
        df['upload_status'] = df['upload_status'].replace('', 'PENDING')

        # Filter for only pending records
        df = df[df['upload_status'].str.upper() == 'PENDING']
        if df.empty:
            print(f"No pending data to load")
            return
        
        # 2. Transform
        trading_df, vip_df, original_indices = clean_daily_trading_volume(df)
        print(f"Extracted {len(trading_df)} rows from Daily Trading Volume sheet.")
        
        if trading_df.empty or vip_df.empty:
            print(f"No new data to load")
            return
        
        # 3. Load and start a transaction
        sheet = get_sheet("Daily Trading Volume")
        with engine.begin() as connection:
            try:
                # Load data using load_to_postgres
                load_to_postgres(trading_df, 'daily_trading_volume')
                load_to_postgres(vip_df, 'vip_history')

                # Update status in Google sheets only for successfully processed records
                update_sheet_status(sheet, original_indices, 'PROCESSED')
            
            except Exception as e:
                # Update status to ERROR in Google Sheets
                print(f"Error during loading: {e}")
                update_sheet_status(sheet, original_indices, 'ERROR')
                raise
    
    except Exception as e:
        print(f"Error occurred in Daily Trading Volume ingestion: {e}")

def main():
    # Ingest Leads
    ingest_leads()

    # Ingest daily trading volume
    ingest_daily_trading_volume()

if __name__ == "__main__":
    main()
