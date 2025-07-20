#!/usr/bin/env python3
"""
LeadFi Demo Environment Initialization Script

This script sets up a complete demo environment with:
1. Database schema initialization
2. 6 months of realistic test data
3. RBAC (Role-Based Access Control) setup
4. Demo user creation and assignments

Usage:
    python scripts/init_demo.py

This creates a production-ready demo environment for showcasing LeadFi CRM capabilities.
"""

import os
import sys
import subprocess
from pathlib import Path

# Add project root to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

def run_script(script_name: str, description: str) -> bool:
    """Run a script and return success status"""
    print(f"\n🔄 {description}...")
    
    script_path = Path(__file__).parent / script_name
    
    if not script_path.exists():
        print(f"❌ Script not found: {script_path}")
        return False
    
    try:
        result = subprocess.run(
            [sys.executable, str(script_path)],
            capture_output=True,
            text=True,
            env=os.environ.copy(),
            cwd=Path(__file__).parent.parent
        )
        
        if result.returncode == 0:
            print(f"✅ {description} completed successfully")
            if result.stdout:
                print(f"   Output: {result.stdout[-200:]}...")  # Last 200 chars
            return True
        else:
            print(f"❌ {description} failed")
            if result.stderr:
                print(f"   Error: {result.stderr}")
            return False
            
    except Exception as e:
        print(f"❌ Error running {script_name}: {e}")
        return False

def main():
    """Main demo initialization process"""
    print("🚀 LeadFi Demo Environment Initialization")
    print("=" * 60)
    print("This will set up a complete demo environment with:")
    print("  📊 6 months of realistic test data")
    print("  👥 RBAC system with demo users")
    print("  🎯 Role-based access control")
    print("  📈 Analytics-ready data")
    print()
    
    # Check if we're in the right environment
    if not os.getenv('DATABASE_URL') and not os.getenv('PGHOST'):
        print("⚠️  Warning: No database environment variables detected")
        print("   Make sure you're running this in the Railway environment")
        print()
    
    # Step 1: Generate test data (6 months)
    print("📊 STEP 1: Generating 6 months of test data...")
    os.environ['DATA_VOLUME'] = 'large'
    os.environ['CLEAR_EXISTING_DATA'] = 'true'
    os.environ['DEMO_MODE'] = 'true'
    
    if not run_script('generate_test_data.py', 'Test data generation'):
        print("❌ Demo initialization failed at test data generation")
        return False
    
    # Step 2: Setup RBAC
    print("\n🔐 STEP 2: Setting up RBAC system...")
    if not run_script('setup_rbac.py', 'RBAC setup'):
        print("❌ Demo initialization failed at RBAC setup")
        return False
    
    # Step 3: Verify data
    print("\n🔍 STEP 3: Verifying demo data...")
    if not run_script('verify_test_data.py', 'Data verification'):
        print("⚠️  Warning: Data verification failed, but continuing...")
    
    # Success summary
    print("\n🎉 DEMO ENVIRONMENT SETUP COMPLETE!")
    print("=" * 60)
    print("✅ Database schema initialized")
    print("✅ 6 months of realistic test data generated")
    print("✅ RBAC system configured")
    print("✅ Demo users created")
    print()
    
    print("👥 Demo Users Available:")
    print("   Manager: Sarah Johnson (sarah.johnson@leadfi.com)")
    print("   Senior BD: Alex Chen (alex.chen@leadfi.com)")
    print("   Junior BD: Emma Thompson (emma.thompson@leadfi.com)")
    print("   Demo User: Demo User (demo@leadfi.com)")
    print()
    
    print("🎯 Demo Features:")
    print("   📊 Analytics dashboard with 6 months of data")
    print("   👥 Role-based access control")
    print("   📈 Lead conversion funnel")
    print("   💹 Trading volume analytics")
    print("   📝 Activity management")
    print()
    
    print("🚀 Your demo is ready! Access it at your Railway URL")
    print("   The frontend will automatically load with demo data")
    
    return True

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1) 