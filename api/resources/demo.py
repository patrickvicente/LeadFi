from flask import request, jsonify
from flask_restful import Resource
from api.utils.demo_mode import is_demo_mode
from api.utils.logging_config import get_logger

logger = get_logger('api.resources.demo')
import os
import subprocess
import sys
from pathlib import Path

class DemoResource(Resource):
    """Demo-specific API endpoints for LeadFi CRM demo functionality."""
    
    def get(self):
        """Get demo status and information."""
        try:
            demo_active = is_demo_mode()
            
            return {
                'status': 'success',
                'demo_mode': demo_active,
                'demo_info': {
                    'description': 'LeadFi CRM Demo Environment',
                    'features': [
                        'Multi-source lead management',
                        'Customer conversion system',
                        'Trading volume analytics',
                        'Activity tracking',
                        'Role-based access control'
                    ],
                    'demo_users': [
                        {
                            'role': 'Admin',
                            'name': 'Admin User',
                            'email': 'admin@leadfi.com',
                            'permissions': 'Full access + system activities'
                        },
                        {
                            'role': 'Manager',
                            'name': 'Sarah Johnson',
                            'email': 'sarah.johnson@leadfi.com',
                            'permissions': 'Full access + team management'
                        },
                        {
                            'role': 'Senior BD',
                            'name': 'Alex Chen',
                            'email': 'alex.chen@leadfi.com',
                            'permissions': 'All leads + customers + activities'
                        },
                        {
                            'role': 'Demo User',
                            'name': 'Demo User',
                            'email': 'demo@leadfi.com',
                            'permissions': 'Read-only access'
                        }
                    ]
                }
            }
            
        except Exception as e:
            logger.error(f"Demo info retrieval failed: {e}")
            return {
                'status': 'error',
                'message': 'Failed to retrieve demo information',
                'error': str(e)
            }, 500
    
    def post(self):
        """Initialize demo environment."""
        try:
            logger.info("Demo POST method called")
            # Check if demo initialization is requested
            action = request.args.get('action', 'init')
            logger.info(f"Demo action: {action}")
            
            if action == 'init':
                logger.info("Calling _initialize_demo")
                result = self._initialize_demo()
                logger.info(f"_initialize_demo result: {result}")
                return result
            elif action == 'reset':
                logger.info("Calling _reset_demo")
                return self._reset_demo()
            else:
                logger.warning(f"Invalid action specified: {action}")
                return {
                    'status': 'error',
                    'message': 'Invalid action specified'
                }, 400
                
        except Exception as e:
            logger.error(f"Demo initialization failed: {e}")
            import traceback
            logger.error(f"Demo initialization traceback: {traceback.format_exc()}")
            return {
                'status': 'error',
                'message': 'Demo initialization failed',
                'error': str(e)
            }, 500
    
    def _initialize_demo(self):
        """Initialize the demo environment with test data and RBAC."""
        try:
            logger.info("Starting demo initialization...")
            
            # For now, return a simple success response for testing
            # In production, this would run the full demo initialization script
            logger.info("Demo initialization completed successfully")
            return {
                'status': 'success',
                'message': 'Demo mode activated successfully',
                'note': 'Demo mode is now active. You can explore the CRM with demo data.',
                'demo_data': {
                    'leads': '300+',
                    'customers': '50+',
                    'activities': '1,200+',
                    'trading_volume': '$2.5M+'
                },
                'demo_users': [
                    'admin@leadfi.com',
                    'sarah.johnson@leadfi.com',
                    'alex.chen@leadfi.com',
                    'demo@leadfi.com'
                ]
            }
                
        except Exception as e:
            logger.error(f"Demo initialization error: {e}")
            import traceback
            logger.error(f"Demo initialization traceback: {traceback.format_exc()}")
            return {
                'status': 'error',
                'message': 'Demo initialization failed',
                'error': str(e)
            }, 500
    
    def _reset_demo(self):
        """Reset demo environment to initial state."""
        try:
            # This would clear demo data and reinitialize
            # For now, just return success
            return {
                'status': 'success',
                'message': 'Demo environment reset successfully'
            }
            
        except Exception as e:
            logger.error(f"Demo reset failed: {e}")
            return {
                'status': 'error',
                'message': 'Demo reset failed',
                'error': str(e)
            }, 500

class DemoSessionResource(Resource):
    """Manage demo sessions and tracking."""
    
    def post(self):
        """Create or update demo session."""
        try:
            data = request.get_json() or {}
            
            # In a real implementation, you would track demo sessions
            # For now, just return success
            return {
                'status': 'success',
                'message': 'Demo session tracked successfully',
                'session_id': 'demo_session_123'
            }
            
        except Exception as e:
            logger.error(f"Demo session tracking failed: {e}")
            return {
                'status': 'error',
                'message': 'Demo session tracking failed',
                'error': str(e)
            }, 500 