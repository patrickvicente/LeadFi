#!/usr/bin/env python3
"""
Automated Deployment Script for LeadFi CRM
Runs comprehensive tests and deploys to Railway if all tests pass
"""

import os
import sys
import subprocess
import json
import time
from pathlib import Path
from datetime import datetime

# Add project root to path
project_root = Path(__file__).parent.parent
sys.path.append(str(project_root))


class RailwayDeployer:
    """Automated Railway deployment with testing"""
    
    def __init__(self):
        self.project_root = project_root
        self.deployment_log = []
    
    def log(self, message):
        """Log a message with timestamp"""
        timestamp = datetime.now().strftime("%H:%M:%S")
        log_entry = f"[{timestamp}] {message}"
        print(log_entry)
        self.deployment_log.append(log_entry)
    
    def print_header(self, title):
        """Print a formatted header"""
        print("\n" + "="*60)
        print(f"🚀 {title}")
        print("="*60)
    
    def print_section(self, title):
        """Print a formatted section header"""
        print(f"\n📋 {title}")
        print("-" * 40)
    
    def run_command(self, command, cwd=None, timeout=600):
        """Run a command and return results"""
        if cwd is None:
            cwd = self.project_root
            
        self.log(f"Running: {' '.join(command)}")
        
        try:
            result = subprocess.run(
                command,
                cwd=cwd,
                capture_output=True,
                text=True,
                timeout=timeout
            )
            
            if result.returncode == 0:
                self.log("✅ Command successful")
            else:
                self.log(f"❌ Command failed: {result.stderr}")
            
            return result
        except subprocess.TimeoutExpired:
            self.log("❌ Command timed out")
            return subprocess.CompletedProcess(
                args=command,
                returncode=1,
                stdout="",
                stderr="Command timed out"
            )
    
    def check_prerequisites(self):
        """Check deployment prerequisites"""
        self.print_section("Checking Prerequisites")
        
        # Check if Railway CLI is installed
        result = self.run_command(['railway', '--version'])
        if result.returncode != 0:
            self.log("❌ Railway CLI not found. Please install it first:")
            self.log("   npm install -g @railway/cli")
            return False
        
        # Check if logged in to Railway
        result = self.run_command(['railway', 'whoami'])
        if result.returncode != 0:
            self.log("❌ Not logged in to Railway. Please login first:")
            self.log("   railway login")
            return False
        
        self.log("✅ Prerequisites check passed")
        return True
    
    def run_tests(self):
        """Run comprehensive tests"""
        self.print_section("Running Tests")
        
        # Run the test runner
        test_script = self.project_root / "scripts" / "run_tests.py"
        if not test_script.exists():
            self.log("❌ Test runner script not found")
            return False
        
        result = self.run_command([sys.executable, str(test_script)])
        
        if result.returncode != 0:
            self.log("❌ Tests failed. Deployment aborted.")
            return False
        
        self.log("✅ All tests passed")
        return True
    
    def check_git_status(self):
        """Check git status and ensure clean working directory"""
        self.print_section("Checking Git Status")
        
        # Check if we're in a git repository
        result = self.run_command(['git', 'status'])
        if result.returncode != 0:
            self.log("❌ Not in a git repository")
            return False
        
        # Check for uncommitted changes
        result = self.run_command(['git', 'diff', '--quiet'])
        if result.returncode != 0:
            self.log("⚠️  Uncommitted changes detected")
            
            # Ask user if they want to commit
            response = input("Do you want to commit changes before deployment? (y/n): ")
            if response.lower() == 'y':
                commit_message = input("Enter commit message: ")
                if commit_message:
                    result = self.run_command(['git', 'add', '.'])
                    result = self.run_command(['git', 'commit', '-m', commit_message])
                    if result.returncode != 0:
                        self.log("❌ Failed to commit changes")
                        return False
                else:
                    self.log("❌ No commit message provided")
                    return False
            else:
                self.log("⚠️  Proceeding with uncommitted changes")
        
        self.log("✅ Git status check passed")
        return True
    
    def build_frontend(self):
        """Build the frontend for production"""
        self.print_section("Building Frontend")
        
        frontend_dir = self.project_root / "frontend"
        
        # Install dependencies if needed
        if not (frontend_dir / "node_modules").exists():
            self.log("Installing frontend dependencies...")
            result = self.run_command(['npm', 'install'], cwd=frontend_dir)
            if result.returncode != 0:
                return False
        
        # Build frontend
        self.log("Building React app...")
        result = self.run_command(['npm', 'run', 'build'], cwd=frontend_dir)
        
        if result.returncode != 0:
            return False
        
        # Verify build directory
        build_dir = frontend_dir / "build"
        if not build_dir.exists():
            self.log("❌ Build directory not created")
            return False
        
        self.log("✅ Frontend build successful")
        return True
    
    def deploy_to_railway(self):
        """Deploy to Railway"""
        self.print_section("Deploying to Railway")
        
        # Check if project is linked
        result = self.run_command(['railway', 'status'])
        if result.returncode != 0:
            self.log("Project not linked to Railway. Linking...")
            result = self.run_command(['railway', 'link'])
            if result.returncode != 0:
                self.log("❌ Failed to link project")
                return False
        
        # Deploy
        self.log("Starting deployment...")
        result = self.run_command(['railway', 'deploy'])
        
        if result.returncode != 0:
            self.log("❌ Deployment failed")
            return False
        
        self.log("✅ Deployment successful")
        return True
    
    def verify_deployment(self):
        """Verify deployment was successful"""
        self.print_section("Verifying Deployment")
        
        # Get deployment URL
        result = self.run_command(['railway', 'domain'])
        if result.returncode == 0:
            domain = result.stdout.strip()
            self.log(f"🌐 Application URL: https://{domain}")
        
        # Test health endpoint
        if result.returncode == 0:
            import requests
            try:
                health_url = f"https://{domain}/api/health"
                self.log(f"Testing health endpoint: {health_url}")
                
                response = requests.get(health_url, timeout=30)
                if response.status_code == 200:
                    self.log("✅ Health check passed")
                else:
                    self.log(f"⚠️  Health check failed: {response.status_code}")
                    
            except Exception as e:
                self.log(f"⚠️  Health check error: {e}")
        
        return True
    
    def save_deployment_log(self):
        """Save deployment log to file"""
        log_file = self.project_root / "deployment_log.txt"
        
        with open(log_file, 'w') as f:
            f.write("LeadFi CRM Deployment Log\n")
            f.write("=" * 50 + "\n")
            f.write(f"Deployment Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n")
            
            for entry in self.deployment_log:
                f.write(entry + "\n")
        
        self.log(f"📄 Deployment log saved to: {log_file}")
    
    def deploy(self):
        """Main deployment process"""
        self.print_header("LeadFi CRM - Automated Railway Deployment")
        
        deployment_steps = [
            ("Checking Prerequisites", self.check_prerequisites),
            ("Running Tests", self.run_tests),
            ("Checking Git Status", self.check_git_status),
            ("Building Frontend", self.build_frontend),
            ("Deploying to Railway", self.deploy_to_railway),
            ("Verifying Deployment", self.verify_deployment)
        ]
        
        for step_name, step_function in deployment_steps:
            self.print_section(step_name)
            
            if not step_function():
                self.log(f"❌ {step_name} failed. Deployment aborted.")
                self.save_deployment_log()
                return False
            
            self.log(f"✅ {step_name} completed")
        
        self.print_header("Deployment Complete!")
        self.log("🎉 LeadFi CRM successfully deployed to Railway!")
        
        # Save deployment log
        self.save_deployment_log()
        
        return True


def main():
    """Main function"""
    deployer = RailwayDeployer()
    
    if len(sys.argv) > 1 and sys.argv[1] == '--dry-run':
        print("🔍 Dry run mode - checking prerequisites only")
        deployer.check_prerequisites()
        deployer.run_tests()
    else:
        success = deployer.deploy()
        
        if success:
            print("\n🎉 Deployment successful!")
            sys.exit(0)
        else:
            print("\n❌ Deployment failed!")
            sys.exit(1)


if __name__ == '__main__':
    main() 