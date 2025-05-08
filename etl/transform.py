from db.db_config import engine
import pandas as pd
import numpy as np

def clean_leads(df):
    print(df.columns)
    print(df.head())

    # normalize column names
    df.columns = [col.strip().lower().replace(" ", "_") for col in df.columns]
    print(df.columns)
    df = df.drop_duplicates()

    # Remove rows where both email and telegram are missing
    df = df[df['email'].notna() | df['telegram'].notna()]

    # Replace blank strings or whitespace-only strings with NaN (null)
    df.replace(r'^\s*$', np.nan, regex=True, inplace=True)

    #  Clean and normalize values
    df['full_name'] = df['full_name'].str.title()
    df['email'] = df['email'].str.lower()
    df['telegram'] = df['telegram'].str.lower()
    df['source'] = df['source'].str.lower()
    df['status'] = df['status'].str.lower()
    df['linkedin_url'] = df['linkedin_url'].str.lower()
    df['country'] =  df['country'].str.lower()
    df['bd_in_charge'] = df['bd_in_charge'].str.lower()
    df['company_name'] = df['company_name'].str.lower()
    print(df.columns)
    print(df.head())

    #  validates status
    valid_status = [
        '1. lead generated', 
        '2. proposal', 
        '3. negotiation', 
        '4. registration', 
        '5. integration', 
        '6. closed won',  
        '7. lost']
    df = df[df["status"].isin(valid_status)]

    # --- Fetch existing emails and telegram from DB
    existing = pd.read_sql("""
        SELECT email, telegram FROM lead
        WHERE email IS NOT NULL OR telegram IS NOT NULL
    """, con=engine)

    # normalize existing lead
    existing['email'] = existing['email'].str.strip().str.lower()
    existing['telegram'] = existing['telegram'].str.strip().str.lower()

    # --- Filter out rows already in DB based on email or telegram
    df = df[
        ~df['email'].isin(existing['email']) &
        ~df['telegram'].isin(existing['telegram'])
    ]

    return df

