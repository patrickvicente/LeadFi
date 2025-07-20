"""
Simple Tests for LeadFi CRM
Tests basic functionality without complex database dependencies
"""

import unittest
import tempfile
import os
from pathlib import Path

# Add project root to path
import sys
project_root = Path(__file__).parent.parent
sys.path.append(str(project_root))


class TestBasicFunctionality(unittest.TestCase):
    """Test basic functionality without database"""
    
    def test_project_structure(self):
        """Test that project structure is correct"""
        # Check that main directories exist
        required_dirs = ['api', 'frontend', 'db', 'docs', 'scripts']
        for dir_name in required_dirs:
            dir_path = project_root / dir_name
            self.assertTrue(dir_path.exists(), f"Directory {dir_name} not found")
    
    def test_config_files(self):
        """Test that configuration files exist"""
        required_files = [
            'requirements.txt',
            'railway.toml',
            'Procfile',
            'frontend/package.json',
            'frontend/tailwind.config.js'
        ]
        
        for file_path in required_files:
            full_path = project_root / file_path
            self.assertTrue(full_path.exists(), f"File {file_path} not found")
    
    def test_demo_system_files(self):
        """Test that demo system files exist"""
        demo_files = [
            'frontend/src/constants/demoUsers.js',
            'frontend/src/contexts/UserContext.js',
            'frontend/src/contexts/DemoContext.jsx',
            'frontend/src/components/auth/DemoUserSelector.jsx',
            'frontend/src/components/auth/UserSwitcher.jsx'
        ]
        
        for file_path in demo_files:
            full_path = project_root / file_path
            self.assertTrue(full_path.exists(), f"Demo file {file_path} not found")
    
    def test_test_files(self):
        """Test that test files exist"""
        test_files = [
            'tests/test_api.py',
            'tests/test_database.py',
            'tests/test_frontend.py',
            'scripts/run_tests.py',
            'scripts/deploy_to_railway.py'
        ]
        
        for file_path in test_files:
            full_path = project_root / file_path
            self.assertTrue(full_path.exists(), f"Test file {file_path} not found")


class TestHealthEndpoint(unittest.TestCase):
    """Test health endpoint without database setup"""
    
    def setUp(self):
        """Set up minimal test environment"""
        # Import app without database setup
        from api.app import app
        self.app = app.test_client()
    
    def test_health_endpoint(self):
        """Test that health endpoint exists and returns 200"""
        response = self.app.get('/api/health')
        self.assertEqual(response.status_code, 200)
        
        # Check response format
        data = response.get_json()
        self.assertIsInstance(data, dict)
        self.assertIn('status', data)


if __name__ == '__main__':
    unittest.main() 