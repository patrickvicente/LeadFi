import os
import sys
import requests
import pandas as pd
import time
import json
from etl.extract import get_sheet, extract_sheet, update_sheet_status
from db.db_config import engine

project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(project_root)

def validate_request_data(data):
    """Validate request data before sending to API"""
    required_fields = ['customer_uid', 'type', 'name', 'country', 'is_closed']
    return all(field in data and data[field] is not None for field in required_fields)

def convert_lead(lead_id, request_data):
    """Convert a single lead to customer"""
    url = f"http://127.0.0.1:5000/api/leads/{lead_id}"
    headers = {'Content-Type': 'application/json', 'Accept': 'application/json'}
    
    try:
        response = requests.post(url, json=request_data, headers=headers)
        if response.status_code == 200:
            return True, response.json()
        return False, {'message': f'Request failed with status {response.status_code}'}
    except Exception as e:
        return False, {'message': str(e)}

def convert_lead_with_retry(lead_id, request_data, max_retries=3):
    """Convert a lead with retry mechanism"""
    for attempt in range(max_retries):
        success, response_data = convert_lead(lead_id, request_data)
        if success:
            return True, response_data
        if attempt < max_retries - 1:
            time.sleep(2)
    return False, response_data

def batch_convert_leads():
    try:
        # Get leads from database
        query = """
            SELECT lead_id, company_name, country, type, telegram, email
            FROM lead
            WHERE is_converted = FALSE
        """
        db_leads = pd.read_sql(query, engine)
        if db_leads.empty:
            return
        
        # Get sheet data
        sheet_data = extract_sheet("Leads")
        sheet_data.columns = [col.strip().lower().replace(" ", "_") for col in sheet_data.columns]
        sheet = get_sheet("Leads")
        
        successful_indices = []
        failed_indices = []
        
        for _, row in db_leads.iterrows():
            try:
                # Clean and normalize values
                db_email = str(row['email']).strip().lower() if pd.notna(row['email']) else ''
                db_telegram = str(row['telegram']).strip().lower() if pd.notna(row['telegram']) else ''
                
                # Find matching row in sheet
                sheet_row = sheet_data[
                    ((sheet_data['email'].fillna('').astype(str).str.strip().str.lower() == db_email) & (db_email != '')) |
                    ((sheet_data['telegram'].fillna('').astype(str).str.strip().str.lower() == db_telegram) & (db_telegram != ''))
                ]
                
                if sheet_row.empty or pd.isna(sheet_row['customer_uid'].iloc[0]):
                    continue
                
                # Prepare request data
                request_data = {
                    "customer_uid": int(sheet_row['customer_uid'].iloc[0]),
                    "type": row['type'].lower() if pd.notna(row['type']) else None,
                    "name": row['company_name'],
                    "country": None if pd.isna(row['country']) or row['country'] == "" else row['country'],
                    "is_closed": False
                }
                
                if not validate_request_data(request_data):
                    failed_indices.append(sheet_row.index[0])
                    continue
                
                success, _ = convert_lead_with_retry(row['lead_id'], request_data)
                if success:
                    successful_indices.append(sheet_row.index[0])
                else:
                    failed_indices.append(sheet_row.index[0])
                
                time.sleep(1)  # Avoid API rate limits
                
            except Exception:
                if not sheet_row.empty:
                    failed_indices.append(sheet_row.index[0])
        
        # Update sheet status
        if successful_indices:
            update_sheet_status(sheet, successful_indices, 'CONVERTED')
        if failed_indices:
            update_sheet_status(sheet, failed_indices, 'CONVERSION_FAILED')
            
    except Exception as e:
        print(f"Error in batch conversion: {str(e)}")

if __name__ == "__main__":
    batch_convert_leads()