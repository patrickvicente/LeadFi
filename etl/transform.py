from db.db_config import engine
import pandas as pd
import numpy as np

def clean_leads(df):
    """
    Clean and transform lead data from Google Sheets
    """
    # Store original indices and upload_status
    original_indices = df.index

    # normalize column names
    df.columns = [col.strip().lower().replace(" ", "_") for col in df.columns]
    df = df.drop_duplicates()

    # Remove upload_status column before cleaning
    if 'upload_status' in df.columns:
        df = df.drop('upload_status', axis=1)

    # Remove rows where both email and telegram are missing
    df = df[df['email'].notna() | df['telegram'].notna()]

    # Replace blank strings or whitespace-only strings with NaN (null)
    df.replace(r'^\s*$', np.nan, regex=True, inplace=True)

    # Clean and normalize values
    string_columns = [
        'full_name', 'email', 'telegram', 'source', 'status',
        'linkedin_url', 'country', 'bd_in_charge', 'company_name'
    ]
    
    for col in string_columns:
        if col in df.columns:
            df[col] = df[col].fillna('').astype(str)
            if col == 'full_name':
                df[col] = df[col].str.title()
            else:
                df[col] = df[col].str.lower()

    # validates status
    valid_status = [
        '1. lead generated', 
        '2. proposal', 
        '3. negotiation', 
        '4. registration', 
        '5. integration', 
        '6. closed won',  
        '7. lost']
    df = df[df["status"].isin(valid_status)]

    # Check for existing records in database
    existing = pd.read_sql("""
        SELECT email, telegram FROM lead
        WHERE email IS NOT NULL OR telegram IS NOT NULL
    """, con=engine)

    # normalize existing lead
    existing['email'] = existing['email'].fillna('').astype(str).str.strip().str.lower()
    existing['telegram'] = existing['telegram'].fillna('').astype(str).str.strip().str.lower()

    # Filter out rows already in DB based on email or telegram
    df = df[
        ~df['email'].isin(existing['email']) |
        ~df['telegram'].isin(existing['telegram'])
    ]

    # Return both the cleaned data and the original indices
    return df, original_indices

def clean_apollo_csv(df):

    # normalize column names
    df.columns = [col.strip().lower().replace(" ", "_") for col in df.columns]
    df = df.rename(columns={
        'company': 'company_name',
        'corporate_phone': 'phone_number',
        'person_linkedin_url': 'linkedin_url',
        'seo_description': 'background'
    })
    df = df.drop_duplicates()

    # Combine full name and add static values
    df['full_name'] = df['first_name'] + ' ' + df['last_name']
    df['source'] = 'apollo'
    df['status'] = '1. lead generated'
    df['bd_in_charge'] = df['bd_in_charge'].fillna('Patrick') # default bd_in_charge

    # Drop unwanted columns (these don't exist in DB)
    df.drop(['first_name', 'last_name'], axis=1, inplace=True)

    # Drop rows missing both email
    df = df[df['email'].notna()]

    # Replace blank strings and whitespace with NaN
    df.replace(r'^\s*$', np.nan, regex=True, inplace=True)

    # Normalize key text fields
    for col in ['full_name', 'email', 'source', 'status', 'linkedin_url', 'country', 'bd_in_charge', 'company_name']:
        if col in df.columns:
            df[col] = df[col].astype(str).str.strip().str.lower()
            if (col == 'full_name') | (col  == 'bd_in_charge'):
                df[col] = df[col].str.title()

    # Validate status
    valid_status = [
        '1. lead generated',
        '2. proposal',
        '3. negotiation',
        '4. registration',
        '5. integration',
        '6. closed won',
        '7. lost'
    ]
    df = df[df["status"].isin(valid_status)]

    # Check DB for duplicates
    existing = pd.read_sql("""
        SELECT email, telegram FROM lead
        WHERE email IS NOT NULL OR telegram IS NOT NULL
    """, con=engine)

    existing['email'] = existing['email'].str.strip().str.lower()

    # Filter out rows that already exist in DB
    df = df[~df['email'].isin(existing['email'])]

    return df

def clean_daily_trading_volume(df):
    """
    Clean and transform daily trading volume data from Google Sheets
    """
    # Store original indices
    original_indices = df.index
    
    # Normalize column names
    df.columns = [col.strip().lower().replace(" ", "_") for col in df.columns]
    
    # Remove upload_status column before cleaning
    if 'upload_status' in df.columns:
        df = df.drop('upload_status', axis=1)

    # Define required columns
    required_columns = [
        'customer_uid',
        'date',
        'spot_maker_trading_volume',
        'spot_taker_trading_volume',
        'spot_maker_fees',
        'spot_taker_fees',
        'futures_maker_trading_volume',
        'futures_taker_trading_volume',
        'futures_maker_fees',
        'futures_taker_fees',
        'user_assets',
        'vip_level',
        'spot_mm_level',
        'futures_mm_level'
    ]
    
    # Check if all required columns are present
    missing_columns = [col for col in required_columns if col not in df.columns]
    if missing_columns:
        raise ValueError(f"Missing required columns: {missing_columns}")
    
    # Define columns for each table
    trading_volume_columns = [
        'customer_uid',
        'date',
        'spot_maker_trading_volume',
        'spot_taker_trading_volume',
        'spot_maker_fees',
        'spot_taker_fees',
        'futures_maker_trading_volume',
        'futures_taker_trading_volume',
        'futures_maker_fees',
        'futures_taker_fees',
        'user_assets'
    ]
    
    vip_history_columns = [
        'customer_uid',
        'date',
        'vip_level',
        'spot_mm_level',
        'futures_mm_level'
    ]
    
    # Create separate DataFrames for each table
    trading_df = df[trading_volume_columns].copy()
    vip_df = df[vip_history_columns].copy()
    
    # Clean trading volume data
    trading_df['date'] = pd.to_datetime(trading_df['date'])
    trading_df['customer_uid'] = trading_df['customer_uid'].astype(str).str.ljust(8)
    
    # Remove duplicates within the trading volume data
    trading_df = trading_df.drop_duplicates(subset=['customer_uid', 'date'])

    # Convert numeric columns
    numeric_columns = [
        'spot_maker_trading_volume',
        'spot_taker_trading_volume',
        'spot_maker_fees',
        'spot_taker_fees',
        'futures_maker_trading_volume',
        'futures_taker_trading_volume',
        'futures_maker_fees',
        'futures_taker_fees',
        'user_assets'
    ]
    
    for col in numeric_columns:
        trading_df[col] = pd.to_numeric(trading_df[col], errors='coerce')
    
    # Clean VIP history data
    vip_df['date'] = pd.to_datetime(vip_df['date'])
    vip_df['customer_uid'] = vip_df['customer_uid'].astype(str).str.zfill(8)

    # Remove duplicates within the VIP history data
    vip_df = vip_df.drop_duplicates(subset=['customer_uid', 'date'])

    # Clean VIP levels
    vip_df['vip_level'] = vip_df['vip_level'].fillna('0').astype(str).str[:2]
    vip_df['spot_mm_level'] = vip_df['spot_mm_level'].fillna('0').astype(str).str[:1]
    vip_df['futures_mm_level'] = vip_df['futures_mm_level'].fillna('0').astype(str).str[:1]
    
    # Check for existing records in database
    try:
        existing_trading = pd.read_sql("""
            SELECT customer_uid, date 
            FROM daily_trading_volume
        """, con=engine)
        
        existing_vip = pd.read_sql("""
            SELECT customer_uid, date 
            FROM vip_history
        """, con=engine)
        
        # Create composite keys for comparison
        existing_trading['key'] = existing_trading['customer_uid'] + '_' + existing_trading['date'].astype(str)
        existing_vip['key'] = existing_vip['customer_uid'] + '_' + existing_vip['date'].astype(str)
        
        trading_df['key'] = trading_df['customer_uid'] + '_' + trading_df['date'].astype(str)
        vip_df['key'] = vip_df['customer_uid'] + '_' + vip_df['date'].astype(str)
        
        # Filter out existing records
        new_trading_df = trading_df[~trading_df['key'].isin(existing_trading['key'])]
        new_vip_df = vip_df[~vip_df['key'].isin(existing_vip['key'])]
        
        # Keep only records that are new in both tables
        common_keys = set(new_trading_df['key']) & set(new_vip_df['key'])
        new_trading_df = new_trading_df[new_trading_df['key'].isin(common_keys)]
        new_vip_df = new_vip_df[new_vip_df['key'].isin(common_keys)]
        
        # Drop the key columns
        new_trading_df = new_trading_df.drop('key', axis=1)
        new_vip_df = new_vip_df.drop('key', axis=1)
        
    except Exception as e:
        print(f"Error checking existing records: {str(e)}")
        # If there's an error, assume no existing records
        new_trading_df = trading_df
        new_vip_df = vip_df
    
    return new_trading_df, new_vip_df, original_indices
