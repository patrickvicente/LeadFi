"""
Demo Mode Detection Utility

This module provides a centralized way to detect if the application is running in demo mode.
It supports multiple detection methods for maximum flexibility.
"""

import os
from flask import request

def is_demo_mode():
    """
    Check if we're in demo mode via multiple detection methods.
    
    Detection Methods (in order of priority):
    1. Environment variable DEMO_MODE=true (for script-based operations)
    2. Request header X-Demo-Mode: true (for API-based operations)
    3. Query parameter ?demo_mode=true (for URL-based operations)
    
    Returns:
        bool: True if any demo mode indicator is active
    """
    # Method 1: Environment variable (for script-based operations)
    env_demo_mode = os.getenv('DEMO_MODE', 'false').lower() == 'true'
    
    # Method 2: Request header (for API-based operations)
    request_demo_mode = False
    try:
        if request and hasattr(request, 'headers'):
            demo_header = request.headers.get('X-Demo-Mode', 'false').lower()
            request_demo_mode = demo_header == 'true'
    except:
        pass  # If no request context, ignore
    
    # Method 3: Query parameter (for URL-based operations)
    query_demo_mode = False
    try:
        if request and hasattr(request, 'args'):
            query_demo_mode = request.args.get('demo_mode', 'false').lower() == 'true'
    except:
        pass  # If no request context, ignore
    
    return env_demo_mode or request_demo_mode or query_demo_mode

def get_demo_mode_source():
    """
    Get the source of demo mode activation for debugging/logging.
    
    Returns:
        str: Description of which method activated demo mode
    """
    # Method 1: Environment variable
    if os.getenv('DEMO_MODE', 'false').lower() == 'true':
        return 'environment_variable'
    
    # Method 2: Request header
    try:
        if request and hasattr(request, 'headers'):
            if request.headers.get('X-Demo-Mode', 'false').lower() == 'true':
                return 'request_header'
    except:
        pass
    
    # Method 3: Query parameter
    try:
        if request and hasattr(request, 'args'):
            if request.args.get('demo_mode', 'false').lower() == 'true':
                return 'query_parameter'
    except:
        pass
    
    return 'not_demo_mode' 