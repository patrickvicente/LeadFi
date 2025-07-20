#!/usr/bin/env python3
"""
Test Data Generator for LeadFi Database

This script generates realistic test data for the last 2 months including:
- Leads with various statuses and sources
- Converted customers with trading activity
- Activities and tasks for leads
- Daily trading volume data
- Contacts linking leads to customers

Usage:
    python scripts/generate_test_data.py

Environment Variables:
    CLEAR_EXISTING_DATA: Set to 'true' to clear existing data before generating new data
    DATA_VOLUME: 'small' (50 leads), 'medium' (150 leads), 'large' (300 leads)
"""

import os
import sys
import random
import json
from datetime import datetime, timedelta, date
from decimal import Decimal
from typing import List, Dict, Any, Optional

# Add project root to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from db.db_config import engine, get_db_url
import psycopg2
from psycopg2.extras import RealDictCursor

class TestDataGenerator:
    def __init__(self):
        # Create a direct psycopg2 connection for raw SQL operations
        # Parse the database URL to get connection parameters
        db_url = get_db_url()
        
        if db_url.startswith('postgresql://'):
            # Parse PostgreSQL URL
            from urllib.parse import urlparse
            parsed = urlparse(db_url)
            
            self.conn = psycopg2.connect(
                host=parsed.hostname,
                port=parsed.port or 5432,
                database=parsed.path[1:],  # Remove leading slash
                user=parsed.username,
                password=parsed.password
            )
        else:
            # SQLite - use the engine directly
            raise ValueError("Test data generation requires PostgreSQL database")
        self.cursor = self.conn.cursor(cursor_factory=RealDictCursor)
        
        # Configuration
        self.data_volume = os.getenv('DATA_VOLUME', 'medium')  # small, medium, large
        self.clear_existing = os.getenv('CLEAR_EXISTING_DATA', 'false').lower() == 'true'
        self.demo_mode = os.getenv('DEMO_MODE', 'false').lower() == 'true'
        
        # Set DEMO_MODE for API schema override
        if self.demo_mode:
            os.environ['DEMO_MODE'] = 'true'
        
        # Volume settings with extended time ranges
        self.volume_settings = {
            'small': {'leads': 50, 'days': 180},      # 6 months
            'medium': {'leads': 150, 'days': 180},    # 6 months  
            'large': {'leads': 300, 'days': 180}      # 6 months
        }
        
        # Date range (6 months of historical data)
        self.end_date = datetime.now()
        self.start_date = self.end_date - timedelta(days=self.volume_settings[self.data_volume]['days'])
        
        # Demo mode: spread data more realistically across time
        if self.demo_mode:
            self.start_date = self.end_date - timedelta(days=180)  # Always 6 months for demo
        
        # Data definitions
        self.setup_data_definitions()
        
    def setup_data_definitions(self):
        """Define all the options and sample data"""
        
        self.bd_team = [
            'Alex Chen', 'Sarah Johnson', 'Michael Rodriguez', 'Emma Thompson',
            'David Kim', 'Lisa Wang', 'James Miller', 'Anna Petrov'
        ]
        
        self.countries = [
            'United States', 'Singapore', 'United Kingdom', 'Hong Kong', 'Canada',
            'Australia', 'Germany', 'Switzerland', 'Japan', 'South Korea',
            'Taiwan', 'Netherlands', 'France', 'Sweden', 'Norway'
        ]
        
        self.lead_sources = [
            'company', 'apollo', 'linkedin', 'hubspot', 'event', 
            'research', 'referral'
        ]
        
        self.lead_statuses = [
            '1. lead generated', '2. proposal', '3. negotiation', 
            '4. registration', '5. integration', '6. closed won', '7. lost'
        ]
        
        self.lead_types = [
            'liquidity provider', 'vip', 'institution', 'api', 'broker',
            'otc', 'project mm', 'asset manager', 'venture capital',
            'prop trader', 'family office', 'hft', 'other'
        ]
        
        self.activity_types_manual = [
            'call', 'email', 'meeting', 'linkedin_message', 'telegram_message',
            'follow_up', 'proposal_sent', 'demo', 'negotiation', 'onboarding'
        ]
        
        self.activity_types_system = [
            'lead_created', 'lead_updated', 'status_changed', 'stage_changed',
            'lead_converted', 'customer_created'
        ]
        
        self.activity_statuses = ['pending', 'in_progress', 'completed', 'cancelled']
        self.activity_priorities = ['low', 'medium', 'high']
        
        # Sample company names by type
        self.company_names = {
            'liquidity provider': [
                'Quantum Capital', 'Alpha Trading', 'Nexus Liquidity', 'Prime Markets',
                'Velocity Trading', 'Apex Capital', 'Delta Liquidity', 'Summit Trading'
            ],
            'vip': [
                'Golden Gate Capital', 'Platinum Holdings', 'Diamond Investments',
                'Elite Trading', 'Premier Capital', 'Crown Investments'
            ],
            'institution': [
                'Metropolitan Bank', 'Global Asset Management', 'Continental Fund',
                'International Securities', 'Universal Capital', 'Standard Investment Group'
            ],
            'api': [
                'TechFlow Solutions', 'DataStream API', 'ConnectTrade', 'APIFirst Capital',
                'QuantAPI', 'StreamLine Trading', 'CodeBase Capital'
            ],
            'broker': [
                'FastTrade Brokerage', 'SecureTrade Inc', 'TradeBridge', 'MarketLink',
                'TradePro Services', 'ExecuteTrade', 'BrokerMax'
            ],
            'asset manager': [
                'Pinnacle Asset Management', 'Strategic Wealth Partners', 'Capital Growth Fund',
                'Investment Solutions Group', 'Portfolio Masters', 'Wealth Dynamics'
            ]
        }
        
        # First and last names for realistic name generation
        self.first_names = [
            'James', 'Mary', 'John', 'Patricia', 'Robert', 'Jennifer', 'Michael', 'Linda',
            'William', 'Elizabeth', 'David', 'Barbara', 'Richard', 'Susan', 'Joseph', 'Jessica',
            'Thomas', 'Sarah', 'Christopher', 'Karen', 'Charles', 'Nancy', 'Daniel', 'Lisa',
            'Matthew', 'Betty', 'Anthony', 'Helen', 'Mark', 'Sandra', 'Donald', 'Donna',
            'Steven', 'Carol', 'Paul', 'Ruth', 'Andrew', 'Sharon', 'Kenneth', 'Michelle',
            'Alex', 'Emma', 'Chris', 'Anna', 'Sam', 'Sophie', 'Ryan', 'Grace'
        ]
        
        self.last_names = [
            'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
            'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson',
            'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson',
            'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson', 'Walker',
            'Young', 'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill',
            'Flores', 'Green', 'Adams', 'Nelson', 'Baker', 'Hall', 'Rivera', 'Campbell'
        ]
        
    def clear_existing_data(self):
        """Clear existing data if requested"""
        if not self.clear_existing:
            return
            
        print("🗑️  Clearing existing data...")
        
        tables = [
            'daily_trading_volume', 'vip_history', 'activity', 'contact', 'customer', 'lead'
        ]
        
        for table in tables:
            try:
                self.cursor.execute(f"DELETE FROM {table}")
                print(f"   Cleared {table}")
            except Exception as e:
                print(f"   Warning: Could not clear {table}: {e}")
        
        # Reset sequences
        sequences = [
            'lead_lead_id_seq', 'customer_customer_uid_seq', 
            'contact_contact_id_seq', 'activity_activity_id_seq'
        ]
        
        for seq in sequences:
            try:
                self.cursor.execute(f"ALTER SEQUENCE {seq} RESTART WITH 1")
            except Exception as e:
                print(f"   Warning: Could not reset {seq}: {e}")
                
        self.conn.commit()
        print("✅ Data cleared successfully")
        
    def generate_random_date(self, start_date: datetime = None, end_date: datetime = None) -> datetime:
        """Generate a random datetime between start_date and end_date"""
        if start_date is None:
            start_date = self.start_date
        if end_date is None:
            end_date = self.end_date
            
        time_between = end_date - start_date
        days_between = time_between.days
        hours_between = time_between.total_seconds() / 3600
        
        random_hours = random.randint(0, int(hours_between))
        return start_date + timedelta(hours=random_hours)
        
    def generate_email(self, first_name: str, last_name: str, company: str = None) -> str:
        """Generate a realistic email address"""
        domains = [
            'gmail.com', 'outlook.com', 'yahoo.com', 'hotmail.com',
            'company.com', 'corporation.com', 'group.com', 'capital.com'
        ]
        
        if company:
            # Use company domain sometimes
            company_domain = f"{company.lower().replace(' ', '').replace('.', '')}.com"
            domains.insert(0, company_domain)
        
        formats = [
            f"{first_name.lower()}.{last_name.lower()}",
            f"{first_name.lower()}{last_name.lower()}",
            f"{first_name[0].lower()}{last_name.lower()}",
            f"{first_name.lower()}{last_name[0].lower()}",
        ]
        
        email_format = random.choice(formats)
        domain = random.choice(domains)
        
        return f"{email_format}@{domain}"
        
    def generate_phone_number(self, country: str) -> str:
        """Generate a phone number based on country"""
        if country == 'United States':
            return f"+1-{random.randint(200, 999)}-{random.randint(200, 999)}-{random.randint(1000, 9999)}"
        elif country == 'United Kingdom':
            return f"+44-{random.randint(1000, 9999)}-{random.randint(100000, 999999)}"
        elif country == 'Singapore':
            return f"+65-{random.randint(6000, 9999)}-{random.randint(1000, 9999)}"
        else:
            return f"+{random.randint(1, 999)}-{random.randint(100, 999)}-{random.randint(1000000, 9999999)}"
            
    def generate_leads(self) -> List[Dict]:
        """Generate realistic lead data spread across 6 months"""
        print(f"📊 Generating {self.volume_settings[self.data_volume]['leads']} leads over 6 months...")
        
        leads = []
        lead_count = self.volume_settings[self.data_volume]['leads']
        
        # Create time buckets for more realistic distribution
        # More leads in recent months, fewer in older months
        time_buckets = [
            (self.end_date - timedelta(days=30), self.end_date, 0.4),      # Last month: 40%
            (self.end_date - timedelta(days=90), self.end_date - timedelta(days=30), 0.3),  # 2-3 months ago: 30%
            (self.end_date - timedelta(days=180), self.end_date - timedelta(days=90), 0.3)  # 3-6 months ago: 30%
        ]
        
        for i in range(lead_count):
            first_name = random.choice(self.first_names)
            last_name = random.choice(self.last_names)
            full_name = f"{first_name} {last_name}"
            
            lead_type = random.choice(self.lead_types)
            country = random.choice(self.countries)
            bd_in_charge = random.choice(self.bd_team)
            source = random.choice(self.lead_sources)
            
            # Generate company name based on type
            company_names = self.company_names.get(lead_type, ['Generic Corp', 'Business Solutions', 'Trading Group'])
            company_name = random.choice(company_names + [f"{last_name} {random.choice(['Capital', 'Holdings', 'Group', 'Partners'])}"])
            
            # Status distribution (more realistic funnel)
            status_weights = [0.3, 0.2, 0.15, 0.1, 0.08, 0.12, 0.05]  # From lead generated to lost
            status = random.choices(self.lead_statuses, weights=status_weights)[0]
            
            # Generate date based on time buckets for realistic distribution
            bucket_start, bucket_end, bucket_weight = random.choices(time_buckets, weights=[b[2] for b in time_buckets])[0]
            date_created = self.generate_random_date(bucket_start, bucket_end)
            
            lead = {
                'full_name': full_name,
                'title': random.choice(['CEO', 'CTO', 'Head of Trading', 'Portfolio Manager', 
                                      'Quantitative Analyst', 'Trading Director', 'Investment Manager']),
                'email': self.generate_email(first_name, last_name, company_name),
                'telegram': f"@{first_name.lower()}{random.randint(10, 999)}" if random.random() > 0.3 else None,
                'phone_number': self.generate_phone_number(country) if random.random() > 0.2 else None,
                'source': source,
                'status': status,
                'date_created': date_created,
                'linkedin_url': f"https://linkedin.com/in/{first_name.lower()}-{last_name.lower()}-{random.randint(100, 999)}",
                'company_name': company_name,
                'country': country,
                'bd_in_charge': bd_in_charge,
                'background': self.generate_background(lead_type, company_name),
                'is_converted': status in ['6. closed won'],
                'type': lead_type
            }
            
            leads.append(lead)
            
        return leads
        
    def generate_background(self, lead_type: str, company_name: str) -> str:
        """Generate realistic background text"""
        backgrounds = {
            'liquidity provider': f"{company_name} is a professional liquidity provider specializing in high-frequency trading and market making across multiple exchanges. They are looking to expand their trading capabilities and reduce latency.",
            'vip': f"High-net-worth individual representing {company_name}. Interested in VIP trading benefits including reduced fees and dedicated support for large volume trades.",
            'institution': f"{company_name} is an institutional investor managing significant assets. They require sophisticated trading tools and competitive rates for their trading operations.",
            'api': f"Technology-focused company {company_name} is looking to integrate trading capabilities into their platform via API. They need reliable, low-latency connections.",
            'broker': f"{company_name} is a brokerage firm looking to expand their offering to clients. They need white-label solutions and competitive pricing structures."
        }
        
        return backgrounds.get(lead_type, f"{company_name} is interested in exploring trading opportunities and partnerships.")
        
    def insert_leads(self, leads: List[Dict]) -> List[int]:
        """Insert leads into database and return lead IDs"""
        print("💾 Inserting leads into database...")
        
        lead_ids = []
        
        for lead in leads:
            try:
                insert_query = """
                INSERT INTO lead (
                    full_name, title, email, telegram, phone_number, source, status,
                    date_created, linkedin_url, company_name, country, bd_in_charge,
                    background, is_converted, type
                ) VALUES (
                    %(full_name)s, %(title)s, %(email)s, %(telegram)s, %(phone_number)s,
                    %(source)s, %(status)s, %(date_created)s, %(linkedin_url)s,
                    %(company_name)s, %(country)s, %(bd_in_charge)s, %(background)s,
                    %(is_converted)s, %(type)s
                ) RETURNING lead_id
                """
                
                self.cursor.execute(insert_query, lead)
                lead_id = self.cursor.fetchone()['lead_id']
                lead_ids.append(lead_id)
                
            except Exception as e:
                print(f"Error inserting lead {lead['full_name']}: {e}")
                
        self.conn.commit()
        print(f"✅ Inserted {len(lead_ids)} leads")
        return lead_ids
        
    def generate_customers_from_leads(self, leads: List[Dict], lead_ids: List[int]) -> List[Dict]:
        """Generate customers from converted leads"""
        print("🏢 Creating customers from converted leads...")
        
        customers = []
        customer_lead_mapping = []
        
        # Find converted leads
        converted_leads = [(lead, lead_id) for lead, lead_id in zip(leads, lead_ids) 
                          if lead['status'] == '6. closed won']
        
        for lead, lead_id in converted_leads:
            customer_uid = random.randint(10000000, 99999999)  # 8-digit customer ID
            
            customer = {
                'customer_uid': customer_uid,
                'registered_email': lead['email'],
                'type': lead['type'],
                'name': lead['company_name'],
                'is_closed': False,
                'date_closed': None,
                'country': lead['country'],
                'bd_in_charge': lead['bd_in_charge'],
                'date_created': lead['date_created'] + timedelta(days=random.randint(1, 30))
            }
            
            customers.append(customer)
            customer_lead_mapping.append((customer_uid, lead_id))
            
        return customers, customer_lead_mapping
        
    def insert_customers(self, customers: List[Dict], customer_lead_mapping: List[tuple]) -> List[int]:
        """Insert customers and their contact relationships"""
        print("💾 Inserting customers into database...")
        
        customer_uids = []
        
        # Insert customers
        for customer in customers:
            try:
                insert_query = """
                INSERT INTO customer (
                    customer_uid, registered_email, type, name, is_closed, date_closed,
                    country, bd_in_charge, date_created
                ) VALUES (
                    %(customer_uid)s, %(registered_email)s, %(type)s, %(name)s, %(is_closed)s,
                    %(date_closed)s, %(country)s, %(bd_in_charge)s, %(date_created)s
                )
                """
                
                self.cursor.execute(insert_query, customer)
                customer_uids.append(customer['customer_uid'])
                
            except Exception as e:
                print(f"Error inserting customer {customer['name']}: {e}")
                
        # Insert contact relationships
        for customer_uid, lead_id in customer_lead_mapping:
            try:
                contact_query = """
                INSERT INTO contact (customer_uid, lead_id, is_primary_contact, date_added)
                VALUES (%s, %s, %s, CURRENT_TIMESTAMP)
                """
                
                self.cursor.execute(contact_query, (customer_uid, lead_id, True))
                
            except Exception as e:
                print(f"Error inserting contact relationship: {e}")
                
        self.conn.commit()
        print(f"✅ Inserted {len(customer_uids)} customers with contact relationships")
        return customer_uids
        
    def generate_activities(self, lead_ids: List[int], leads: List[Dict]) -> List[Dict]:
        """Generate activities for leads with realistic timeline progression"""
        print("📝 Generating activities with realistic timelines...")
        
        activities = []
        
        for lead_id, lead in zip(lead_ids, leads):
            # Generate 2-8 activities per lead with realistic progression
            num_activities = random.randint(2, 8)
            
            lead_start_date = lead['date_created']
            
            # Create activity timeline based on lead status
            activity_timeline = self._create_activity_timeline(lead, num_activities)
            
            for i, (activity_date, activity_config) in enumerate(activity_timeline):
                # Choose activity type based on timeline position and lead status
                if i == 0:
                    # First activity is always lead creation (system)
                    activity_type = 'lead_created'
                    category = 'system'
                    status = 'completed'
                    assigned_to = 'system'
                    description = f"Lead created from {lead['source']}"
                else:
                    # Mix of manual and system activities based on timeline
                    if random.random() < 0.7:  # 70% manual activities
                        category = 'manual'
                        activity_type = activity_config.get('type', random.choice(self.activity_types_manual))
                        assigned_to = lead['bd_in_charge']
                        status = activity_config.get('status', random.choices(['completed', 'pending', 'in_progress'], 
                                              weights=[0.6, 0.25, 0.15])[0])
                        description = self.generate_activity_description(activity_type, lead)
                    else:
                        category = 'system'
                        activity_type = activity_config.get('type', random.choice(self.activity_types_system))
                        assigned_to = 'system'
                        status = 'completed'
                        description = self.generate_system_activity_description(activity_type, lead)
                
                activity = {
                    'lead_id': lead_id,
                    'activity_type': activity_type,
                    'activity_category': category,
                    'description': description,
                    'activity_metadata': json.dumps({
                        'source': lead['source'] if activity_type == 'lead_created' else None,
                        'previous_status': None,
                        'new_status': lead['status'] if 'status' in activity_type else None
                    }) if category == 'system' else None,
                    'date_created': activity_date,
                    'created_by': assigned_to,
                    'is_visible_to_bd': True,
                    'due_date': activity_date + timedelta(days=random.randint(1, 7)) if status == 'pending' else None,
                    'status': status,
                    'priority': random.choice(self.activity_priorities),
                    'assigned_to': assigned_to,
                    'date_completed': activity_date if status == 'completed' else None
                }
                
                activities.append(activity)
                
        return activities
    
    def _create_activity_timeline(self, lead: Dict, num_activities: int) -> List[tuple]:
        """Create realistic activity timeline based on lead status and progression"""
        timeline = []
        lead_start_date = lead['date_created']
        
        # Define activity progression based on lead status
        status_progression = {
            '1. lead generated': ['lead_created', 'call', 'email'],
            '2. proposal': ['proposal_sent', 'meeting', 'follow_up'],
            '3. negotiation': ['negotiation', 'meeting', 'email'],
            '4. registration': ['onboarding', 'demo', 'follow_up'],
            '5. integration': ['demo', 'onboarding', 'follow_up'],
            '6. closed won': ['lead_converted', 'onboarding', 'follow_up'],
            '7. lost': ['follow_up', 'email', 'call']
        }
        
        # Get activities for this lead's status
        status_activities = status_progression.get(lead['status'], self.activity_types_manual)
        
        # Create timeline with realistic spacing
        for i in range(num_activities):
            if i == 0:
                # First activity is always at lead creation
                activity_date = lead_start_date
                activity_config = {'type': 'lead_created', 'status': 'completed'}
            else:
                # Subsequent activities spread over time
                days_offset = random.randint(1, 30)  # 1-30 days between activities
                activity_date = lead_start_date + timedelta(days=days_offset)
                
                # Choose activity type based on lead status
                activity_type = random.choice(status_activities)
                status = 'completed' if activity_date < datetime.now() else random.choice(['completed', 'pending', 'in_progress'])
                
                activity_config = {'type': activity_type, 'status': status}
            
            timeline.append((activity_date, activity_config))
        
        # Sort timeline by date
        timeline.sort(key=lambda x: x[0])
        return timeline
        
    def generate_activity_description(self, activity_type: str, lead: Dict) -> str:
        """Generate realistic activity descriptions"""
        descriptions = {
            'call': [
                f"Initial discovery call with {lead['full_name']} to understand their trading requirements",
                f"Follow-up call to discuss pricing and technical specifications",
                f"Demo call showcasing our trading platform capabilities"
            ],
            'email': [
                "Sent welcome email with company overview and product information",
                "Followed up with additional documentation and case studies",
                "Sent proposal with customized pricing structure"
            ],
            'meeting': [
                "In-person meeting to discuss partnership opportunities",
                "Video conference to present our trading solutions",
                "Client meeting to finalize integration details"
            ],
            'linkedin_message': [
                "Connected on LinkedIn and sent introductory message",
                "Shared relevant market insights via LinkedIn message"
            ],
            'proposal_sent': [
                "Sent comprehensive proposal with pricing and technical specifications",
                "Delivered customized proposal based on their requirements"
            ]
        }
        
        return random.choice(descriptions.get(activity_type, [f"Performed {activity_type} activity"]))
        
    def generate_system_activity_description(self, activity_type: str, lead: Dict) -> str:
        """Generate system activity descriptions"""
        descriptions = {
            'lead_created': f"Lead automatically created from {lead['source']} integration",
            'lead_updated': "Lead information updated via system integration",
            'status_changed': f"Lead status automatically updated to {lead['status']}",
            'lead_converted': f"Lead successfully converted to customer"
        }
        
        return descriptions.get(activity_type, f"System performed {activity_type}")
        
    def insert_activities(self, activities: List[Dict]) -> None:
        """Insert activities into database"""
        print("💾 Inserting activities into database...")
        
        for activity in activities:
            try:
                insert_query = """
                INSERT INTO activity (
                    lead_id, activity_type, activity_category, description, activity_metadata,
                    date_created, created_by, is_visible_to_bd, due_date, status, priority,
                    assigned_to, date_completed
                ) VALUES (
                    %(lead_id)s, %(activity_type)s, %(activity_category)s, %(description)s,
                    %(activity_metadata)s, %(date_created)s, %(created_by)s, %(is_visible_to_bd)s,
                    %(due_date)s, %(status)s, %(priority)s, %(assigned_to)s, %(date_completed)s
                )
                """
                
                self.cursor.execute(insert_query, activity)
                
            except Exception as e:
                print(f"Error inserting activity: {e}")
                
        self.conn.commit()
        print(f"✅ Inserted {len(activities)} activities")
        
    def generate_trading_data(self, customer_uids: List[int]) -> List[Dict]:
        """Generate daily trading volume data for customers"""
        print("📈 Generating trading volume data...")
        
        trading_data = []
        
        for customer_uid in customer_uids:
            # Generate data for random number of days (10-60 days)
            num_days = random.randint(10, 60)
            start_date = self.end_date - timedelta(days=num_days)
            
            current_date = start_date.date()
            end_date = self.end_date.date()
            
            while current_date <= end_date:
                # Not every customer trades every day
                if random.random() < 0.7:  # 70% chance of trading activity
                    
                    # Generate realistic trading volumes based on customer type
                    base_volume = random.uniform(10000, 500000)
                    
                    spot_maker_vol = Decimal(str(round(base_volume * random.uniform(0.3, 0.7), 2)))
                    spot_taker_vol = Decimal(str(round(base_volume * random.uniform(0.2, 0.5), 2)))
                    futures_maker_vol = Decimal(str(round(base_volume * random.uniform(0.1, 0.8), 2)))
                    futures_taker_vol = Decimal(str(round(base_volume * random.uniform(0.1, 0.6), 2)))
                    
                    # Calculate fees (typically 0.01% to 0.1% of volume)
                    spot_maker_fees = spot_maker_vol * Decimal(str(random.uniform(0.0001, 0.001)))
                    spot_taker_fees = spot_taker_vol * Decimal(str(random.uniform(0.0002, 0.002)))
                    futures_maker_fees = futures_maker_vol * Decimal(str(random.uniform(0.0001, 0.001)))
                    futures_taker_fees = futures_taker_vol * Decimal(str(random.uniform(0.0002, 0.002)))
                    
                    # User assets (portfolio value)
                    user_assets = Decimal(str(round(random.uniform(50000, 2000000), 2)))
                    
                    trading_record = {
                        'customer_uid': customer_uid,
                        'date': current_date,
                        'spot_maker_trading_volume': spot_maker_vol,
                        'spot_taker_trading_volume': spot_taker_vol,
                        'spot_maker_fees': round(spot_maker_fees, 2),
                        'spot_taker_fees': round(spot_taker_fees, 2),
                        'futures_maker_trading_volume': futures_maker_vol,
                        'futures_taker_trading_volume': futures_taker_vol,
                        'futures_maker_fees': round(futures_maker_fees, 2),
                        'futures_taker_fees': round(futures_taker_fees, 2),
                        'user_assets': user_assets
                    }
                    
                    trading_data.append(trading_record)
                
                current_date += timedelta(days=1)
                
        return trading_data
        
    def insert_trading_data(self, trading_data: List[Dict]) -> None:
        """Insert trading volume data"""
        print("💾 Inserting trading volume data...")
        
        for record in trading_data:
            try:
                insert_query = """
                INSERT INTO daily_trading_volume (
                    customer_uid, date, spot_maker_trading_volume, spot_taker_trading_volume,
                    spot_maker_fees, spot_taker_fees, futures_maker_trading_volume,
                    futures_taker_trading_volume, futures_maker_fees, futures_taker_fees,
                    user_assets
                ) VALUES (
                    %(customer_uid)s, %(date)s, %(spot_maker_trading_volume)s,
                    %(spot_taker_trading_volume)s, %(spot_maker_fees)s, %(spot_taker_fees)s,
                    %(futures_maker_trading_volume)s, %(futures_taker_trading_volume)s,
                    %(futures_maker_fees)s, %(futures_taker_fees)s, %(user_assets)s
                )
                """
                
                self.cursor.execute(insert_query, record)
                
            except Exception as e:
                print(f"Error inserting trading data: {e}")
                
        self.conn.commit()
        print(f"✅ Inserted {len(trading_data)} trading records")
        
    def generate_vip_history(self, customer_uids: List[int]) -> List[Dict]:
        """Generate VIP level history for customers"""
        print("👑 Generating VIP history...")
        
        vip_data = []
        
        for customer_uid in customer_uids:
            # Generate VIP level changes over time
            current_date = (self.end_date - timedelta(days=random.randint(30, 60))).date()
            end_date = self.end_date.date()
            
            current_vip = '0'  # Start with VIP 0
            
            while current_date <= end_date:
                # Occasionally upgrade VIP level
                if random.random() < 0.1 and current_vip != '9':  # 10% chance to upgrade
                    current_vip = str(min(int(current_vip) + 1, 9))
                
                vip_record = {
                    'customer_uid': customer_uid,
                    'date': current_date,
                    'vip_level': current_vip,
                    'spot_mm_level': str(random.randint(0, 5)),
                    'futures_mm_level': str(random.randint(0, 5))
                }
                
                vip_data.append(vip_record)
                current_date += timedelta(days=random.randint(7, 30))  # Update every 1-4 weeks
                
        return vip_data
        
    def insert_vip_history(self, vip_data: List[Dict]) -> None:
        """Insert VIP history data"""
        print("💾 Inserting VIP history...")
        
        for record in vip_data:
            try:
                insert_query = """
                INSERT INTO vip_history (customer_uid, date, vip_level, spot_mm_level, futures_mm_level)
                VALUES (%(customer_uid)s, %(date)s, %(vip_level)s, %(spot_mm_level)s, %(futures_mm_level)s)
                """
                
                self.cursor.execute(insert_query, record)
                
            except Exception as e:
                print(f"Error inserting VIP history: {e}")
                
        self.conn.commit()
        print(f"✅ Inserted {len(vip_data)} VIP history records")
        
    def generate_summary_stats(self) -> None:
        """Generate and display summary statistics"""
        print("\n📊 DATA GENERATION SUMMARY")
        print("=" * 50)
        
        # Lead statistics
        self.cursor.execute("SELECT COUNT(*) as count FROM lead")
        lead_count = self.cursor.fetchone()['count']
        
        self.cursor.execute("SELECT status, COUNT(*) as count FROM lead GROUP BY status ORDER BY status")
        lead_status_breakdown = self.cursor.fetchall()
        
        # Customer statistics
        self.cursor.execute("SELECT COUNT(*) as count FROM customer")
        customer_count = self.cursor.fetchone()['count']
        
        # Activity statistics
        self.cursor.execute("SELECT COUNT(*) as count FROM activity")
        activity_count = self.cursor.fetchone()['count']
        
        # Trading data statistics
        self.cursor.execute("SELECT COUNT(*) as count FROM daily_trading_volume")
        trading_records_count = self.cursor.fetchone()['count']
        
        self.cursor.execute("""
            SELECT 
                SUM(spot_maker_trading_volume + spot_taker_trading_volume + 
                    futures_maker_trading_volume + futures_taker_trading_volume) as total_volume,
                SUM(spot_maker_fees + spot_taker_fees + futures_maker_fees + futures_taker_fees) as total_fees
            FROM daily_trading_volume
        """)
        trading_totals = self.cursor.fetchone()
        
        print(f"📈 LEADS: {lead_count}")
        for status in lead_status_breakdown:
            print(f"   {status['status']}: {status['count']}")
            
        print(f"\n🏢 CUSTOMERS: {customer_count}")
        print(f"📝 ACTIVITIES: {activity_count}")
        print(f"💹 TRADING RECORDS: {trading_records_count}")
        
        if trading_totals['total_volume']:
            print(f"💰 TOTAL TRADING VOLUME: ${trading_totals['total_volume']:,.2f}")
            print(f"💵 TOTAL FEES GENERATED: ${trading_totals['total_fees']:,.2f}")
            
        print(f"\n📅 DATE RANGE: {self.start_date.strftime('%Y-%m-%d')} to {self.end_date.strftime('%Y-%m-%d')}")
        print(f"🎛️  DATA VOLUME: {self.data_volume}")
        
    def run(self):
        """Main execution method"""
        print("🚀 LeadFi Test Data Generator")
        print("=" * 40)
        print(f"Volume: {self.data_volume}")
        print(f"Date Range: {self.start_date.strftime('%Y-%m-%d')} to {self.end_date.strftime('%Y-%m-%d')}")
        print(f"Clear Existing: {self.clear_existing}")
        print()
        
        try:
            # Clear existing data if requested
            if self.clear_existing:
                self.clear_existing_data()
                
            # Generate leads
            leads = self.generate_leads()
            lead_ids = self.insert_leads(leads)
            
            # Generate customers from converted leads
            customers, customer_lead_mapping = self.generate_customers_from_leads(leads, lead_ids)
            customer_uids = self.insert_customers(customers, customer_lead_mapping)
            
            # Generate activities
            activities = self.generate_activities(lead_ids, leads)
            self.insert_activities(activities)
            
            # Generate trading data for customers
            if customer_uids:
                trading_data = self.generate_trading_data(customer_uids)
                self.insert_trading_data(trading_data)
                
                # Generate VIP history
                vip_data = self.generate_vip_history(customer_uids)
                self.insert_vip_history(vip_data)
            
            # Generate summary
            self.generate_summary_stats()
            
            print("\n✅ Test data generation completed successfully!")
            
        except Exception as e:
            print(f"\n❌ Error during data generation: {e}")
            self.conn.rollback()
            raise
        finally:
            self.cursor.close()
            self.conn.close()

if __name__ == "__main__":
    generator = TestDataGenerator()
    generator.run() 