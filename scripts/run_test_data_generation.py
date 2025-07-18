#!/usr/bin/env python3
"""
Simple runner for test data generation with different volume options.

Usage:
    python scripts/run_test_data_generation.py [volume] [clear]

Arguments:
    volume: small (50 leads), medium (150 leads), large (300 leads) - default: medium
    clear: Set to 'clear' to remove existing data first - default: keep existing

Examples:
    python scripts/run_test_data_generation.py small
    python scripts/run_test_data_generation.py medium clear
    python scripts/run_test_data_generation.py large
"""

import os
import sys

def main():
    # Parse command line arguments
    volume = 'medium'
    clear_data = False
    
    if len(sys.argv) > 1:
        volume = sys.argv[1].lower()
        if volume not in ['small', 'medium', 'large']:
            print("❌ Invalid volume. Use: small, medium, or large")
            sys.exit(1)
    
    if len(sys.argv) > 2 and sys.argv[2].lower() == 'clear':
        clear_data = True
    
    # Set environment variables
    os.environ['DATA_VOLUME'] = volume
    os.environ['CLEAR_EXISTING_DATA'] = 'true' if clear_data else 'false'
    
    print(f"🎯 Running test data generation...")
    print(f"   Volume: {volume}")
    print(f"   Clear existing data: {clear_data}")
    print()
    
    # Import and run the generator
    try:
        from generate_test_data import TestDataGenerator
        generator = TestDataGenerator()
        generator.run()
    except ImportError:
        print("❌ Could not import TestDataGenerator. Make sure you're in the project root.")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main() 