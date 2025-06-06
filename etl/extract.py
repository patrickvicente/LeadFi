import gspread
from oauth2client.service_account import ServiceAccountCredentials
import pandas as pd
import time

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

def get_sheet(sheet_name):
    """
    Get a specific worksheet from Google Sheets
    """
    scope = ["https://spreadsheets.google.com/feeds", "https://www.googleapis.com/auth/drive"]
    credentials = ServiceAccountCredentials.from_json_keyfile_name("secrets/gspread_service_account.json", scope)
    client = gspread.authorize(credentials)
    spreadsheet = client.open("personal_crm")
    return spreadsheet.worksheet(sheet_name)

def update_sheet_status(sheet, row_indices, status):
    """
    Update the upload_status column in Google Sheets
    """
    try:
        # Find the upload status column
        headers = sheet.row_values(1)
        upload_status_col = headers.index('upload_status') + 1 # +1 because gspread is 1-indexed

        # Update the status for processed rows
        for idx in row_indices:
            # Add 2 to account for header row and 0-based indexing
            sheet.update_cell(idx + 2, upload_status_col, status)
            time.sleep(2) # pause to limit hitting quota

        print(f"Status updated successfully") 
    except Exception as e:
        print(f"Error updating sheet status: {str(e)}")
        raise

# Extract data from apollo csv
def extract_apollo_csv(file_path: str) -> pd.DataFrame:
    return pd.read_csv(file_path)


