#!/usr/bin/env python3
"""
Comprehensive Test Runner for LeadFi CRM
Runs all tests and provides detailed reporting for deployment confidence
"""

import os
import sys
import subprocess
import time
import json
from pathlib import Path
from datetime import datetime

# Add project root to path
project_root = Path(__file__).parent.parent
sys.path.append(str(project_root))


class TestRunner:
    """Comprehensive test runner for LeadFi CRM"""
    
    def __init__(self):
        self.project_root = project_root
        self.test_results = {
            'timestamp': datetime.now().isoformat(),
            'total_tests': 0,
            'passed_tests': 0,
            'failed_tests': 0,
            'skipped_tests': 0,
            'test_suites': {}
        }
    
    def print_header(self, title):
        """Print a formatted header"""
        print("\n" + "="*60)
        print(f"🧪 {title}")
        print("="*60)
    
    def print_section(self, title):
        """Print a formatted section header"""
        print(f"\n📋 {title}")
        print("-" * 40)
    
    def run_command(self, command, cwd=None, timeout=300):
        """Run a command and return results"""
        if cwd is None:
            cwd = self.project_root
            
        try:
            result = subprocess.run(
                command,
                cwd=cwd,
                capture_output=True,
                text=True,
                timeout=timeout
            )
            return result
        except subprocess.TimeoutExpired:
            return subprocess.CompletedProcess(
                args=command,
                returncode=1,
                stdout="",
                stderr="Command timed out"
            )
    
    def test_dependencies(self):
        """Test that all dependencies are installed"""
        self.print_section("Testing Dependencies")
        
        # Test Python dependencies
        print("🐍 Checking Python dependencies...")
        try:
            import flask
            import flask_restful
            import flask_cors
            import flask_sqlalchemy
            import marshmallow
            import pandas
            print("✅ Python dependencies OK")
        except ImportError as e:
            print(f"❌ Missing Python dependency: {e}")
            return False
        
        # Test Node.js dependencies
        print("📦 Checking Node.js dependencies...")
        frontend_dir = self.project_root / "frontend"
        if not (frontend_dir / "node_modules").exists():
            print("⚠️  node_modules not found, running npm install...")
            result = self.run_command(['npm', 'install'], cwd=frontend_dir)
            if result.returncode != 0:
                print(f"❌ npm install failed: {result.stderr}")
                return False
        
        print("✅ Node.js dependencies OK")
        return True
    
    def test_database_connection(self):
        """Test database connection and configuration"""
        self.print_section("Testing Database Connection")
        
        try:
            from db.db_config import get_db_url, engine
            db_url = get_db_url()
            print(f"🗄️  Database URL: {db_url}")
            
            # Test connection
            with engine.connect() as conn:
                result = conn.execute("SELECT 1")
                print("✅ Database connection successful")
                return True
                
        except Exception as e:
            print(f"❌ Database connection failed: {e}")
            return False
    
    def test_api_endpoints(self):
        """Test API endpoints"""
        self.print_section("Testing API Endpoints")
        
        # Run API tests
        test_file = self.project_root / "tests" / "test_api.py"
        if test_file.exists():
            result = self.run_command([sys.executable, '-m', 'unittest', str(test_file)])
            
            if result.returncode == 0:
                print("✅ API tests passed")
                return True
            else:
                print(f"❌ API tests failed: {result.stderr}")
                return False
        else:
            print("⚠️  API test file not found")
            return False
    
    def test_database_operations(self):
        """Test database operations"""
        self.print_section("Testing Database Operations")
        
        # Run database tests
        test_file = self.project_root / "tests" / "test_database.py"
        if test_file.exists():
            result = self.run_command([sys.executable, '-m', 'unittest', str(test_file)])
            
            if result.returncode == 0:
                print("✅ Database tests passed")
                return True
            else:
                print(f"❌ Database tests failed: {result.stderr}")
                return False
        else:
            print("⚠️  Database test file not found")
            return False
    
    def test_frontend_build(self):
        """Test frontend build process"""
        self.print_section("Testing Frontend Build")
        
        frontend_dir = self.project_root / "frontend"
        
        # Test npm build
        result = self.run_command(['npm', 'run', 'build'], cwd=frontend_dir)
        
        if result.returncode == 0:
            print("✅ Frontend build successful")
            
            # Check build directory
            build_dir = frontend_dir / "build"
            if build_dir.exists():
                print("✅ Build directory created")
                return True
            else:
                print("❌ Build directory not found")
                return False
        else:
            print(f"❌ Frontend build failed: {result.stderr}")
            return False
    
    def test_frontend_components(self):
        """Test frontend component structure"""
        self.print_section("Testing Frontend Components")
        
        # Run frontend tests
        test_file = self.project_root / "tests" / "test_frontend.py"
        if test_file.exists():
            result = self.run_command([sys.executable, '-m', 'unittest', str(test_file)])
            
            if result.returncode == 0:
                print("✅ Frontend component tests passed")
                return True
            else:
                print(f"❌ Frontend component tests failed: {result.stderr}")
                return False
        else:
            print("⚠️  Frontend test file not found")
            return False
    
    def test_demo_system(self):
        """Test demo system functionality"""
        self.print_section("Testing Demo System")
        
        # Check demo files exist
        demo_files = [
            "frontend/src/constants/demoUsers.js",
            "frontend/src/contexts/UserContext.js",
            "frontend/src/contexts/DemoContext.jsx",
            "frontend/src/components/auth/DemoUserSelector.jsx",
            "frontend/src/components/auth/UserSwitcher.jsx"
        ]
        
        all_exist = True
        for file_path in demo_files:
            full_path = self.project_root / file_path
            if full_path.exists():
                print(f"✅ {file_path}")
            else:
                print(f"❌ {file_path} not found")
                all_exist = False
        
        return all_exist
    
    def test_deployment_config(self):
        """Test deployment configuration"""
        self.print_section("Testing Deployment Configuration")
        
        # Check Railway configuration
        railway_toml = self.project_root / "railway.toml"
        if railway_toml.exists():
            print("✅ railway.toml found")
        else:
            print("❌ railway.toml not found")
            return False
        
        # Check Procfile
        procfile = self.project_root / "Procfile"
        if procfile.exists():
            print("✅ Procfile found")
        else:
            print("❌ Procfile not found")
            return False
        
        # Check requirements.txt
        requirements = self.project_root / "requirements.txt"
        if requirements.exists():
            print("✅ requirements.txt found")
        else:
            print("❌ requirements.txt not found")
            return False
        
        return True
    
    def run_all_tests(self):
        """Run all tests and generate report"""
        self.print_header("LeadFi CRM - Comprehensive Test Suite")
        
        test_results = {
            'dependencies': self.test_dependencies(),
            'database_connection': self.test_database_connection(),
            'api_endpoints': self.test_api_endpoints(),
            'database_operations': self.test_database_operations(),
            'frontend_build': self.test_frontend_build(),
            'frontend_components': self.test_frontend_components(),
            'demo_system': self.test_demo_system(),
            'deployment_config': self.test_deployment_config()
        }
        
        # Generate summary
        self.print_header("Test Summary")
        
        passed = sum(1 for result in test_results.values() if result)
        total = len(test_results)
        
        print(f"📊 Test Results: {passed}/{total} tests passed")
        
        for test_name, result in test_results.items():
            status = "✅ PASS" if result else "❌ FAIL"
            print(f"  {test_name}: {status}")
        
        # Save results
        self.save_test_results(test_results)
        
        return all(test_results.values())
    
    def save_test_results(self, results):
        """Save test results to file"""
        results_file = self.project_root / "test_results.json"
        
        test_data = {
            'timestamp': datetime.now().isoformat(),
            'results': results,
            'summary': {
                'total_tests': len(results),
                'passed_tests': sum(1 for r in results.values() if r),
                'failed_tests': sum(1 for r in results.values() if not r)
            }
        }
        
        with open(results_file, 'w') as f:
            json.dump(test_data, f, indent=2)
        
        print(f"\n📄 Test results saved to: {results_file}")
    
    def generate_deployment_report(self):
        """Generate deployment readiness report"""
        self.print_header("Deployment Readiness Report")
        
        results_file = self.project_root / "test_results.json"
        if not results_file.exists():
            print("❌ No test results found. Run tests first.")
            return
        
        with open(results_file, 'r') as f:
            test_data = json.load(f)
        
        results = test_data['results']
        summary = test_data['summary']
        
        print(f"📊 Overall Status: {'🟢 READY' if summary['failed_tests'] == 0 else '🔴 NOT READY'}")
        print(f"✅ Passed: {summary['passed_tests']}")
        print(f"❌ Failed: {summary['failed_tests']}")
        
        if summary['failed_tests'] > 0:
            print("\n🚨 Failed Tests:")
            for test_name, result in results.items():
                if not result:
                    print(f"  - {test_name}")
        
        print(f"\n📅 Test run: {test_data['timestamp']}")


def main():
    """Main function"""
    runner = TestRunner()
    
    if len(sys.argv) > 1 and sys.argv[1] == '--report':
        runner.generate_deployment_report()
    else:
        success = runner.run_all_tests()
        
        if success:
            print("\n🎉 All tests passed! Ready for deployment.")
            sys.exit(0)
        else:
            print("\n⚠️  Some tests failed. Please fix issues before deployment.")
            sys.exit(1)


if __name__ == '__main__':
    main() 