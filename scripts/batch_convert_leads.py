import os
import sys

project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(project_root)

import requests
from etl.extract import get_sheet, extract_sheet, update_sheet_status
from db.db_config import engine
import pandas as pd
import time
import json

def validate_request_data(data):
    """Validate request data before sending to API"""
    print("\nValidating request data:")
    print(f"customer_uid: {data['customer_uid']} (type: {type(data['customer_uid'])})")
    print(f"type: {data['type']} (type: {type(data['type'])})")
    print(f"name: {data['name']} (type: {type(data['name'])})")
    print(f"country: {data['country']} (type: {type(data['country'])})")
    print(f"is_closed: {data['is_closed']} (type: {type(data['is_closed'])})")
    return True

def convert_lead(lead_id, request_data):
    """Convert a single lead to customer"""
    url = f"http://localhost:5000/api/leads/{lead_id}"
    headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }
    
    print(f"\nSending request to: {url}")
    print(f"Request headers: {json.dumps(headers, indent=2)}")
    print(f"Request data: {json.dumps(request_data, indent=2)}")
    
    try:
        response = requests.post(url, json=request_data, headers=headers)
        print(f"Response status: {response.status_code}")
        print(f"Response headers: {json.dumps(dict(response.headers), indent=2)}")
        
        if response.status_code == 403:
            print("Access forbidden - checking for validation errors")
            try:
                response_data = response.json()
                print(f"Response body: {json.dumps(response_data, indent=2)}")
            except:
                print("No JSON response - checking request data")
                print(f"Request data validation:")
                for key, value in request_data.items():
                    print(f"{key}: {value} (type: {type(value)})")
            return False, {'message': 'Access forbidden - check validation'}
        
        try:
            response_data = response.json()
            print(f"Response body: {json.dumps(response_data, indent=2)}")
        except:
            print(f"Raw response text: {response.text}")
            response_data = {}
        
        return response.status_code == 200, response_data
        
    except Exception as e:
        print(f"Request error: {str(e)}")
        return False, {'message': str(e)}

def convert_lead_with_retry(lead_id, request_data, max_retries=3):
    """Convert a lead with retry mechanism"""
    for attempt in range(max_retries):
        print(f"\nAttempt {attempt + 1} of {max_retries}")
        success, response_data = convert_lead(lead_id, request_data)
        
        if success:
            return True, response_data
            
        if attempt < max_retries - 1:
            print(f"Retrying in 2 seconds...")
            time.sleep(2)
    
    return False, response_data

def batch_convert_leads():
    print("Starting batch conversion of leads")
    
    try:
        # 1. Get leads from database
        query = """
            SELECT 
                lead_id,
                company_name,
                country,
                type,
                telegram, 
                email
            FROM lead
            WHERE is_converted = FALSE
        """
        db_leads = pd.read_sql(query, engine)
        
        if db_leads.empty:
            print("No leads to convert in database.")
            return
            
        print(f"Found {len(db_leads)} leads to convert.")
        
        # 2. Get current sheet data
        sheet_data = extract_sheet("Leads")
        print("Sheet columns:", sheet_data.columns.tolist())
        
        # Normalize sheet column names
        sheet_data.columns = [col.strip().lower().replace(" ", "_") for col in sheet_data.columns]
        print("Normalized sheet columns:", sheet_data.columns.tolist())
        
        sheet = get_sheet("Leads")
        successful_indices = []
        failed_indices = []
        
        for _, row in db_leads.iterrows():
            sheet_row = None
            try:
                print(f"\n{'='*50}")
                print(f"Processing lead: {row['company_name']}")
                
                # Clean and normalize email and telegram values
                db_email = str(row['email']).strip().lower() if pd.notna(row['email']) else ''
                db_telegram = str(row['telegram']).strip().lower() if pd.notna(row['telegram']) else ''
                
                print(f"DB Email: {db_email}")
                print(f"DB Telegram: {db_telegram}")
                print(f"Lead Id: {row['lead_id']}")
                
                # Find matching row in sheet
                sheet_row = sheet_data[
                    (sheet_data['email'].fillna('').astype(str).str.strip().str.lower() == db_email) | 
                    (sheet_data['telegram'].fillna('').astype(str).str.strip().str.lower() == db_telegram)
                ]
                
                if sheet_row.empty:
                    print(f"Warning: Lead {row['company_name']} not found in sheet")
                    continue
                
                # Verify we have the correct row
                if sheet_row['email'].iloc[0].lower() != db_email and sheet_row['telegram'].iloc[0].lower() != db_telegram:
                    print(f"Warning: Sheet row mismatch for {row['company_name']}")
                    print(f"Expected email: {db_email}, Found: {sheet_row['email'].iloc[0]}")
                    print(f"Expected telegram: {db_telegram}, Found: {sheet_row['telegram'].iloc[0]}")
                    continue
                
                print(f"Found matching sheet row: {sheet_row.to_dict('records')[0]}")
                
                # Prepare request data
                request_data = {
                    "customer_uid": int(sheet_row['customer_uid'].iloc[0]),
                    "type": row['type'].lower() if pd.notna(row['type']) else None,  # Normalize type
                    "name": row['company_name'],
                    "country": None if pd.isna(row['country']) or row['country'] == "" else row['country'],
                    "is_closed": False
                }
                
                # Validate request data
                if not validate_request_data(request_data):
                    print(f"Validation failed for {row['company_name']}")
                    failed_indices.append(sheet_row.index[0])
                    continue
                
                # Convert lead with retry
                success, response_data = convert_lead_with_retry(row['lead_id'], request_data)
                
                if success:
                    successful_indices.append(sheet_row.index[0])
                    print(f"Successfully converted: {row['company_name']}")
                else:
                    failed_indices.append(sheet_row.index[0])
                    error_message = response_data.get('message', 'Unknown error')
                    print(f"Failed to convert: {row['company_name']}")
                    print(f"Error: {error_message}")
                
                time.sleep(1)  # Avoid API rate limits
                
            except Exception as e:
                print(f"Error processing {row['company_name']}: {str(e)}")
                if sheet_row is not None and not sheet_row.empty:
                    failed_indices.append(sheet_row.index[0])
        
        # 3. Update sheet status
        if successful_indices:
            print(f"\nUpdating {len(successful_indices)} successful conversions")
            update_sheet_status(sheet, successful_indices, 'CONVERTED')
        if failed_indices:
            print(f"\nUpdating {len(failed_indices)} failed conversions")
            update_sheet_status(sheet, failed_indices, 'CONVERSION_FAILED')
            
    except Exception as e:
        print(f"Error in batch conversion: {str(e)}")

if __name__ == "__main__":
    batch_convert_leads()