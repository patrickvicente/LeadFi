from sqlalchemy.sql import text
from db.db_config import engine
from datetime import datetime

# function to insert a new lead
def insert_lead(data):
    sql = text("""
        INSERT INTO lead (
            full_name, title, email, telegram, phone_number, source, 
            company_name, status, linkedin_url, country, bd_in_charge, background
        )
        VALUES (
            :full_name, :title, :email, :telegram, :phone_number, :source, 
            :company_name, :status, :linkedin_url, :country, :bd_in_charge, :background
        )
    """)

    # use SQLAlchemy connection
    with engine.connect() as conn:
        conn.execute(sql, {
            # used data.get() for optional fields 
            'full_name': data['full_name'],
            'title': data.get('title'),
            'email': data.get('email'),
            'telegram': data.get('telegram'),
            'phone_number': data.get('phone_number'),
            'source': data['source'],
            'company_name': data['company_name'],
            'status': data['status'],
            'linkedin_url': data.get('linkedin_url'),
            'country': data.get('country'),
            'bd_in_charge': data['bd_in_charge'],
            'background': data.get('background')
        })
        conn.commit()

def fetch_leads():
    sql = text("SELECT * FROM lead")

    # Use SQLAlchemy connection
    with engine.connect() as conn:
        result = conn.execute(sql)
        # Fetch all rows and convert them to a list of dictionaries
        leads = []
        for row in result.mappings():
            lead = dict(row)
            # Convert datetime objects to strings
            for key, value in lead.items():
                if isinstance(value, datetime):
                    lead[key] = value.isoformat()  # Convert datetime to ISO 8601 string
            leads.append(lead)
    
    return leads

def fetch_lead_by_id(lead_id):
    sql = text("SELECT * FROM lead WHERE lead_id = :id")

    with engine.connect() as conn:
        result = conn.execute(sql, {'id':lead_id}).mappings().first() # Fetch the first matching row
        if result is None:
            return None # Lead not Found

        # Convert RowMapping to dict
        lead = dict(result)

        #convert datetime objects to strings
        for key, value in lead.items():
            if isinstance(value, datetime):
                lead[key] = value.isoformat() #convert datetime to ISO
        return lead

