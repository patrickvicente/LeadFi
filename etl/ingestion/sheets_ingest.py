from etl.extract import extract_sheet, get_sheet, update_sheet_status
from etl.transform import clean_leads, clean_daily_trading_volume
from etl.load import load_to_postgres
from db.db_config import engine
import pandas as pd

def ingest_leads():
    print("Starting ETL for Leads from Google Sheets >>> PostgreSQL")
    
    try:
        # 1. Extract data
        df = extract_sheet("Leads")
        if df.empty:
            print(f"No data found in the Leads sheet.")
            return
        
        # Replace blanks (NaN) in the upload_status column with 'PENDING'
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
        successful_indices = []
        failed_indices = []
        
        with engine.begin() as connection:
            try:
                # Process each row individually
                for idx, row in leads_df.iterrows():
                    try:
                        # Create a single-row DataFrame
                        row_df = pd.DataFrame([row])
                        # Load single row
                        load_to_postgres(row_df, 'lead')
                        successful_indices.append(original_indices[idx])
                    except Exception as e:
                        print(f"Error processing row {idx}: {e}")
                        failed_indices.append(original_indices[idx])
                
                # Update status in Google Sheets
                if successful_indices:
                    update_sheet_status(sheet, successful_indices, 'PROCESSED')
                if failed_indices:
                    update_sheet_status(sheet, failed_indices, 'ERROR')
            
            except Exception as e:
                print(f"Error during loading: {e}")
                # Mark all remaining rows as ERROR
                remaining_indices = [idx for idx in original_indices if idx not in successful_indices]
                if remaining_indices:
                    update_sheet_status(sheet, remaining_indices, 'ERROR')
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
        successful_indices = []
        failed_indices = []
        
        with engine.begin() as connection:
            try:
                # Process each row individually
                for idx, (trading_row, vip_row) in enumerate(zip(trading_df.itertuples(), vip_df.itertuples())):
                    try:
                        # Create single-row DataFrames and convert to dict
                        trading_dict = {k: v for k, v in trading_row._asdict().items() 
                                     if k != 'Index'}  # Remove Index from dict
                        vip_dict = {k: v for k, v in vip_row._asdict().items() 
                                  if k != 'Index'}  # Remove Index from dict
                        
                        # Create DataFrames from dicts
                        trading_row_df = pd.DataFrame([trading_dict])
                        vip_row_df = pd.DataFrame([vip_dict])
                        
                        # Load single rows
                        load_to_postgres(trading_row_df, 'daily_trading_volume')
                        load_to_postgres(vip_row_df, 'vip_history')
                        
                        successful_indices.append(original_indices[idx])
                    except Exception as e:
                        failed_indices.append(original_indices[idx])
                
                # Update status in Google Sheets
                if successful_indices:
                    update_sheet_status(sheet, successful_indices, 'PROCESSED')
                    print(f"Successfully processed {len(successful_indices)} rows")
                
                if failed_indices:
                    update_sheet_status(sheet, failed_indices, 'ERROR')
                    print(f"Failed to process {len(failed_indices)} rows")
            
            except Exception as e:
                print(f"Error during loading: {e}")
                # Mark all remaining rows as ERROR
                remaining_indices = [idx for idx in original_indices if idx not in successful_indices]
                if remaining_indices:
                    update_sheet_status(sheet, remaining_indices, 'ERROR')
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
