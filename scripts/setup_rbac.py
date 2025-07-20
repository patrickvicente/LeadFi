#!/usr/bin/env python3
"""
RBAC (Role-Based Access Control) Setup Script

This script sets up user roles and permissions for the LeadFi demo environment.
It creates demo users with different access levels to showcase the CRM's capabilities.

Usage:
    python scripts/setup_rbac.py

Roles:
    - Manager: Full access to all data, team management, analytics
    - BD (Business Development): Access to assigned leads/customers, limited analytics  
    - Demo: Read-only access to sample data
"""

import os
import sys
import random
from datetime import datetime, timedelta
from typing import List, Dict, Any

# Add project root to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from db.db_config import DB_CONFIG
import psycopg2
from psycopg2.extras import RealDictCursor

class RBACSetup:
    def __init__(self):
        # Create database connection
        self.conn = psycopg2.connect(
            host=DB_CONFIG['host'],
            port=DB_CONFIG['port'],
            database=DB_CONFIG['database'],
            user=DB_CONFIG['user'],
            password=DB_CONFIG['password']
        )
        self.cursor = self.conn.cursor(cursor_factory=RealDictCursor)
        
        # Demo users configuration
        self.demo_users = {
            'manager': {
                'name': 'Sarah Johnson',
                'email': 'sarah.johnson@leadfi.com',
                'role': 'manager',
                'permissions': ['all'],
                'bd_team': ['Alex Chen', 'Michael Rodriguez', 'Emma Thompson', 'David Kim']
            },
            'bd_senior': {
                'name': 'Alex Chen', 
                'email': 'alex.chen@leadfi.com',
                'role': 'bd_senior',
                'permissions': ['leads', 'customers', 'activities', 'limited_analytics'],
                'assigned_leads': ['liquidity provider', 'institution', 'api']
            },
            'bd_junior': {
                'name': 'Emma Thompson',
                'email': 'emma.thompson@leadfi.com', 
                'role': 'bd_junior',
                'permissions': ['leads', 'customers', 'activities'],
                'assigned_leads': ['vip', 'broker', 'asset manager']
            },
            'demo_user': {
                'name': 'Demo User',
                'email': 'demo@leadfi.com',
                'role': 'demo',
                'permissions': ['read_only'],
                'note': 'Read-only access for demo purposes'
            }
        }
        
    def setup_user_tables(self):
        """Create user and role tables if they don't exist"""
        print("🔐 Setting up RBAC tables...")
        
        # Create users table
        self.cursor.execute("""
            CREATE TABLE IF NOT EXISTS users (
                user_id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                role VARCHAR(50) NOT NULL,
                permissions JSONB,
                is_active BOOLEAN DEFAULT TRUE,
                date_created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                last_login TIMESTAMP
            )
        """)
        
        # Create user_assignments table for BD team assignments
        self.cursor.execute("""
            CREATE TABLE IF NOT EXISTS user_assignments (
                assignment_id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(user_id),
                lead_id INTEGER REFERENCES lead(lead_id),
                customer_uid INTEGER REFERENCES customer(customer_uid),
                assignment_type VARCHAR(50), -- 'lead', 'customer', 'team'
                date_assigned TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Create demo_sessions table for tracking demo usage
        self.cursor.execute("""
            CREATE TABLE IF NOT EXISTS demo_sessions (
                session_id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(user_id),
                session_start TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                session_end TIMESTAMP,
                pages_visited JSONB,
                actions_performed JSONB
            )
        """)
        
        self.conn.commit()
        print("✅ RBAC tables created")
        
    def create_demo_users(self):
        """Create demo users with different roles"""
        print("👥 Creating demo users...")
        
        user_ids = {}
        
        for role, user_config in self.demo_users.items():
            try:
                # Insert user
                insert_query = """
                INSERT INTO users (name, email, role, permissions, is_active)
                VALUES (%(name)s, %(email)s, %(role)s, %(permissions)s, TRUE)
                RETURNING user_id
                """
                
                self.cursor.execute(insert_query, {
                    'name': user_config['name'],
                    'email': user_config['email'],
                    'role': user_config['role'],
                    'permissions': user_config['permissions']
                })
                
                user_id = self.cursor.fetchone()['user_id']
                user_ids[role] = user_id
                
                print(f"   Created {user_config['name']} ({user_config['role']})")
                
            except Exception as e:
                print(f"   Warning: Could not create user {user_config['name']}: {e}")
                
        self.conn.commit()
        return user_ids
        
    def assign_leads_to_bd_users(self, user_ids: Dict):
        """Assign leads to BD team members based on their specializations"""
        print("📋 Assigning leads to BD team members...")
        
        # Get existing leads
        self.cursor.execute("""
            SELECT lead_id, type, bd_in_charge, full_name, company_name
            FROM lead
            WHERE bd_in_charge IN ('Alex Chen', 'Emma Thompson', 'Michael Rodriguez', 'David Kim')
        """)
        
        leads = self.cursor.fetchall()
        
        # Create assignment mapping
        bd_assignments = {
            'Alex Chen': user_ids.get('bd_senior'),
            'Emma Thompson': user_ids.get('bd_junior')
        }
        
        assignments_created = 0
        
        for lead in leads:
            bd_name = lead['bd_in_charge']
            user_id = bd_assignments.get(bd_name)
            
            if user_id:
                try:
                    # Create lead assignment
                    assignment_query = """
                    INSERT INTO user_assignments (user_id, lead_id, assignment_type)
                    VALUES (%s, %s, 'lead')
                    """
                    
                    self.cursor.execute(assignment_query, (user_id, lead['lead_id']))
                    assignments_created += 1
                    
                except Exception as e:
                    print(f"   Warning: Could not assign lead {lead['lead_id']}: {e}")
                    
        self.conn.commit()
        print(f"✅ Created {assignments_created} lead assignments")
        
    def assign_customers_to_bd_users(self, user_ids: Dict):
        """Assign customers to BD team members"""
        print("🏢 Assigning customers to BD team members...")
        
        # Get customers with their BD in charge
        self.cursor.execute("""
            SELECT customer_uid, bd_in_charge, name
            FROM customer
            WHERE bd_in_charge IN ('Alex Chen', 'Emma Thompson')
        """)
        
        customers = self.cursor.fetchall()
        
        bd_assignments = {
            'Alex Chen': user_ids.get('bd_senior'),
            'Emma Thompson': user_ids.get('bd_junior')
        }
        
        assignments_created = 0
        
        for customer in customers:
            bd_name = customer['bd_in_charge']
            user_id = bd_assignments.get(bd_name)
            
            if user_id:
                try:
                    # Create customer assignment
                    assignment_query = """
                    INSERT INTO user_assignments (user_id, customer_uid, assignment_type)
                    VALUES (%s, %s, 'customer')
                    """
                    
                    self.cursor.execute(assignment_query, (user_id, customer['customer_uid']))
                    assignments_created += 1
                    
                except Exception as e:
                    print(f"   Warning: Could not assign customer {customer['customer_uid']}: {e}")
                    
        self.conn.commit()
        print(f"✅ Created {assignments_created} customer assignments")
        
    def create_demo_session(self, user_ids: Dict):
        """Create a demo session for tracking"""
        print("🎬 Creating demo session...")
        
        try:
            # Create demo session for demo user
            demo_user_id = user_ids.get('demo_user')
            if demo_user_id:
                session_query = """
                INSERT INTO demo_sessions (user_id, pages_visited, actions_performed)
                VALUES (%s, %s, %s)
                """
                
                demo_data = {
                    'pages_visited': ['dashboard', 'leads', 'customers', 'analytics'],
                    'actions_performed': ['view_leads', 'view_customers', 'view_analytics']
                }
                
                self.cursor.execute(session_query, (
                    demo_user_id,
                    demo_data['pages_visited'],
                    demo_data['actions_performed']
                ))
                
                self.conn.commit()
                print("✅ Demo session created")
                
        except Exception as e:
            print(f"   Warning: Could not create demo session: {e}")
            
    def generate_summary(self, user_ids: Dict):
        """Generate RBAC setup summary"""
        print("\n🔐 RBAC SETUP SUMMARY")
        print("=" * 50)
        
        # User summary
        self.cursor.execute("SELECT role, COUNT(*) as count FROM users GROUP BY role")
        role_counts = self.cursor.fetchall()
        
        print("👥 Users Created:")
        for role in role_counts:
            print(f"   {role['role']}: {role['count']}")
            
        # Assignment summary
        self.cursor.execute("""
            SELECT assignment_type, COUNT(*) as count 
            FROM user_assignments 
            GROUP BY assignment_type
        """)
        assignment_counts = self.cursor.fetchall()
        
        print("\n📋 Assignments Created:")
        for assignment in assignment_counts:
            print(f"   {assignment['assignment_type']}: {assignment['count']}")
            
        # Demo users info
        print("\n🎯 Demo Users:")
        for role, config in self.demo_users.items():
            user_id = user_ids.get(role)
            print(f"   {config['name']} ({config['role']}): {config['email']}")
            print(f"      Permissions: {', '.join(config['permissions'])}")
            
        print("\n✅ RBAC setup completed successfully!")
        
    def run(self):
        """Main execution method"""
        print("🔐 LeadFi RBAC Setup")
        print("=" * 40)
        
        try:
            # Setup tables
            self.setup_user_tables()
            
            # Create demo users
            user_ids = self.create_demo_users()
            
            # Assign leads and customers
            self.assign_leads_to_bd_users(user_ids)
            self.assign_customers_to_bd_users(user_ids)
            
            # Create demo session
            self.create_demo_session(user_ids)
            
            # Generate summary
            self.generate_summary(user_ids)
            
        except Exception as e:
            print(f"\n❌ Error during RBAC setup: {e}")
            self.conn.rollback()
            raise
        finally:
            self.cursor.close()
            self.conn.close()

if __name__ == "__main__":
    rbac_setup = RBACSetup()
    rbac_setup.run() 