import gspread
from oauth2client.service_account import ServiceAccountCredentials
import pandas as pd

# extracts data from google sheet
def extract_sheet(sheet_name): # 'Leads' | 'Customer' | 'Daily Trading Volume' | 'Activity'
    scope = ["https://spreadsheets.google.com/feeds", "https://www.googleapis.com/auth/drive"]
    credentials = ServiceAccountCredentials.from_json_keyfile_name("secrets/gspread_service_account.json", scope)

    #  authenticate and connect 
    client = gspread.authorize(credentials)
    # open the spreadsheet
    spreadsheet = client.open("personal_crm")
    # Access the worksheet
    worksheet = spreadsheet.worksheet(sheet_name)
    # Load worksheet data
    worksheet_data = worksheet.get_all_records()

    # Create DataFrame
    try:
        df = pd.DataFrame(worksheet_data)
    except Exception as e:
        print("Error creating DataFrame:", e)
        return None

    return df

# Extract data from apollo csv
def extract_apollo_csv(file_path: str) -> pd.DataFrame:
    return pd.read_csv(file_path)


