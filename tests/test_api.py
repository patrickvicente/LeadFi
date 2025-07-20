"""
API Tests for LeadFi CRM
Tests all API endpoints, database operations, and error handling
"""

import unittest
import json
import tempfile
import os
from unittest.mock import patch, MagicMock

# Add project root to path
import sys
from pathlib import Path
project_root = Path(__file__).parent.parent
sys.path.append(str(project_root))

from api.app import app, db
from api.models.lead import Lead
from api.models.customer import Customer
from api.models.activity import Activity
from api.models.contact import Contact
from api.models.trading_volume import TradingVolume


class TestAPIBase(unittest.TestCase):
    """Base test class with setup and teardown"""
    
    def setUp(self):
        """Set up test database and client"""
        # Use temporary SQLite database for testing
        self.db_fd, self.db_path = tempfile.mkstemp()
        
        app.config['TESTING'] = True
        app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{self.db_path}'
        app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
        
        self.app = app.test_client()
        self.app_context = app.app_context()
        self.app_context.push()
        
        # Create all tables
        db.create_all()
        
        # Create test data
        self.create_test_data()
    
    def tearDown(self):
        """Clean up after tests"""
        db.session.remove()
        db.drop_all()
        self.app_context.pop()
        os.close(self.db_fd)
        os.unlink(self.db_path)
    
    def create_test_data(self):
        """Create sample test data"""
        # For now, just create a simple lead to test basic functionality
        test_lead = Lead(
            full_name="Test Lead",
            email="test@example.com",
            company_name="Test Company",
            source="Manual",
            status="Qualified",
            bd_in_charge="demo_user",
            type="Prospect"
        )
        db.session.add(test_lead)
        db.session.commit()


class TestHealthEndpoint(TestAPIBase):
    """Test health check endpoint"""
    
    def test_health_check(self):
        """Test that health endpoint returns 200"""
        response = self.app.get('/api/health')
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertEqual(data['status'], 'healthy')


class TestLeadsAPI(TestAPIBase):
    """Test leads API endpoints"""
    
    def test_get_leads(self):
        """Test getting all leads"""
        response = self.app.get('/api/leads')
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertIsInstance(data, list)
        self.assertGreater(len(data), 0)
    
    def test_create_lead(self):
        """Test creating a new lead"""
        new_lead = {
            'full_name': 'New Test Lead',
            'email': 'newtest@example.com',
            'company_name': 'New Test Company',
            'source': 'Manual',
            'status': 'New',
            'bd_in_charge': 'demo_user',
            'type': 'Prospect'
        }
        
        response = self.app.post('/api/leads',
                               data=json.dumps(new_lead),
                               content_type='application/json')
        self.assertEqual(response.status_code, 201)
        
        data = json.loads(response.data)
        self.assertEqual(data['full_name'], new_lead['full_name'])
        self.assertEqual(data['email'], new_lead['email'])
    
    def test_update_lead(self):
        """Test updating a lead"""
        # Get first lead
        response = self.app.get('/api/leads')
        leads = json.loads(response.data)
        lead_id = leads[0]['id']
        
        update_data = {
            'status': 'Qualified',
            'background': 'Updated test notes'
        }
        
        response = self.app.put(f'/api/leads/{lead_id}',
                               data=json.dumps(update_data),
                               content_type='application/json')
        self.assertEqual(response.status_code, 200)
        
        data = json.loads(response.data)
        self.assertEqual(data['status'], 'Qualified')
    
    def test_delete_lead(self):
        """Test deleting a lead"""
        # Get first lead
        response = self.app.get('/api/leads')
        leads = json.loads(response.data)
        lead_id = leads[0]['id']
        
        response = self.app.delete(f'/api/leads/{lead_id}')
        self.assertEqual(response.status_code, 200)
        
        # Verify lead is deleted
        response = self.app.get(f'/api/leads/{lead_id}')
        self.assertEqual(response.status_code, 404)


class TestCustomersAPI(TestAPIBase):
    """Test customers API endpoints"""
    
    def test_get_customers(self):
        """Test getting all customers"""
        response = self.app.get('/api/customers')
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertIsInstance(data, list)
        self.assertGreater(len(data), 0)
    
    def test_create_customer(self):
        """Test creating a new customer"""
        new_customer = {
            'name': 'New Test Customer',
            'registered_email': 'newcustomer@example.com',
            'type': 'Individual',
            'country': 'US'
        }
        
        response = self.app.post('/api/customers',
                               data=json.dumps(new_customer),
                               content_type='application/json')
        self.assertEqual(response.status_code, 201)
        
        data = json.loads(response.data)
        self.assertEqual(data['name'], new_customer['name'])


class TestAnalyticsAPI(TestAPIBase):
    """Test analytics API endpoints"""
    
    def test_get_analytics_summary(self):
        """Test getting analytics summary"""
        response = self.app.get('/api/analytics/summary')
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        
        # Check that required fields exist
        required_fields = ['total_leads', 'total_customers', 'conversion_rate']
        for field in required_fields:
            self.assertIn(field, data)
    
    def test_get_lead_funnel(self):
        """Test getting lead funnel data"""
        response = self.app.get('/api/analytics/lead-funnel')
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertIsInstance(data, list)


class TestErrorHandling(TestAPIBase):
    """Test error handling and edge cases"""
    
    def test_invalid_lead_data(self):
        """Test creating lead with invalid data"""
        invalid_lead = {
            'full_name': '',  # Empty name should fail
            'email': 'invalid-email',  # Invalid email
            'company_name': 'Test Company'
        }
        
        response = self.app.post('/api/leads',
                               data=json.dumps(invalid_lead),
                               content_type='application/json')
        self.assertEqual(response.status_code, 400)
    
    def test_nonexistent_lead(self):
        """Test accessing non-existent lead"""
        response = self.app.get('/api/leads/99999')
        self.assertEqual(response.status_code, 404)
    
    def test_invalid_json(self):
        """Test sending invalid JSON"""
        response = self.app.post('/api/leads',
                               data='invalid json',
                               content_type='application/json')
        self.assertEqual(response.status_code, 400)


class TestDatabaseOperations(TestAPIBase):
    """Test database operations and data integrity"""
    
    def test_lead_customer_relationship(self):
        """Test that leads can be converted to customers"""
        # Create a lead
        lead_data = {
            'full_name': 'Convertible Lead',
            'email': 'convert@example.com',
            'company_name': 'Convert Company',
            'source': 'Manual',
            'status': 'Qualified',
            'bd_in_charge': 'demo_user',
            'type': 'Prospect'
        }
        
        response = self.app.post('/api/leads',
                               data=json.dumps(lead_data),
                               content_type='application/json')
        self.assertEqual(response.status_code, 201)
        
        # Convert to customer
        customer_data = {
            'name': lead_data['full_name'],
            'registered_email': lead_data['email'],
            'type': 'Individual',
            'country': 'US'
        }
        
        response = self.app.post('/api/customers',
                               data=json.dumps(customer_data),
                               content_type='application/json')
        self.assertEqual(response.status_code, 201)
    
    def test_data_validation(self):
        """Test that data validation works correctly"""
        # Test email validation
        invalid_emails = ['not-an-email', '@invalid.com', 'test@']
        
        for email in invalid_emails:
            lead_data = {
                'full_name': 'Test Lead',
                'email': email,
                'company_name': 'Test Company',
                'source': 'Manual',
                'status': 'New',
                'bd_in_charge': 'demo_user',
                'type': 'Prospect'
            }
            
            response = self.app.post('/api/leads',
                                   data=json.dumps(lead_data),
                                   content_type='application/json')
            self.assertEqual(response.status_code, 400)


if __name__ == '__main__':
    unittest.main() 