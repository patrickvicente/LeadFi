import pandas as pd
import numpy as np

def clean_leads(df):
    # normalize column names
    df.columns = [col.strip().lower().replace(" ", "_") for col in df.columns]
    print(df.columns)
    df = df.drop_duplicates()

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
    df['background'] = df['background'].str.lower()
    df['company_name'] = df['company_name'].str.lower()

    

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

    return df

