from flask import Flask, request, send_from_directory
from flask_restful import Api
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from werkzeug.exceptions import HTTPException

# Error handling imports
from api.exceptions import (
    APIError, handle_api_error, handle_werkzeug_error, handle_generic_error
)
from api.utils.logging_config import setup_logging, get_logger, log_request_info, log_response_info

# Resource imports
from api.resources.lead import LeadResource
from api.resources.customer import CustomerResource
from api.resources.contact import ContactResource
from api.resources.trading_volume import TradingVolumeResource, TradingSummaryResource, TradingVolumeTimeSeriesResource, TradingVolumeTopCustomersResource
from api.resources.activity import (
    ActivityListResource,
    ActivityResource, 
    ActivityTimelineResource, 
    ActivityStatsResource, 
    TaskResource,
    TaskListResource
)
from db.db_config import db, get_db_url
import os

# Import all models to ensure they're registered with SQLAlchemy
from api.models.lead import Lead
from api.models.customer import Customer
from api.models.contact import Contact
from api.models.activity import Activity
from api.models.trading_volume import TradingVolume
from api.resources.analytics import AvgDailyActivityResource, LeadConversionRateResource, ActivityAnalyticsResource, LeadFunnelResource

# Initialize logging
setup_logging(
    log_level=os.getenv('LOG_LEVEL', 'INFO'),
    log_file=os.getenv('LOG_FILE')
)
logger = get_logger('api.app')

def create_app():
    """
    Application factory function.
    Sets up the Flask app, configures the database, CORS, error handling, and API resources.
    """
    app = Flask(__name__)
    
    # Configuration: Set up the database URI
    app.config['SQLALCHEMY_DATABASE_URI'] = get_db_url()
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    
    # Initialize extensions with specific CORS configuration
    CORS(app, resources={
        r"/api/*": {
            "origins": ["http://localhost:3000"],  # Your React app's URL
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization"],
            "supports_credentials": True,
            "expose_headers": ["Content-Type", "Authorization"],
            "max_age": 3600
        }
    })
    
    db.init_app(app)
    api = Api(app)

    # Error handlers
    @app.errorhandler(APIError)
    def handle_custom_api_error(error):
        """Handle custom API errors."""
        return handle_api_error(error)
    
    @app.errorhandler(HTTPException)
    def handle_http_error(error):
        """Handle HTTP exceptions."""
        return handle_werkzeug_error(error)
    
    @app.errorhandler(Exception)
    def handle_unexpected_error(error):
        """Handle unexpected errors."""
        return handle_generic_error(error)

    # Request/Response logging middleware
    @app.before_request
    def log_request():
        """Log incoming requests."""
        try:
            log_request_info(request, logger)
        except Exception as e:
            logger.error(f"Error logging request: {e}")

    @app.after_request
    def log_response(response):
        """Log outgoing responses and add CORS headers."""
        try:
            # Add CORS headers to response
            response.headers.add('Access-Control-Allow-Origin', 'http://localhost:3000')
            response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
            response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
            response.headers.add('Access-Control-Allow-Credentials', 'true')
            
            log_response_info(response, logger)
        except Exception as e:
            logger.error(f"Error logging response: {e}")
        
        return response
    
    # Health check endpoint
    @app.route('/api/health')
    def health_check():
        """Health check endpoint for monitoring."""
        return {
            'status': 'healthy',
            'message': 'LeadFi API is running'
        }
    
    # Serve static files (CSS, JS) from React build
    @app.route('/static/<path:filename>')
    def serve_static(filename):
        """Serve static files from React build/static directory."""
        static_dir = '/app/frontend/build/static'
        logger.info(f"Serving static file: {filename} from {static_dir}")
        try:
            return send_from_directory(static_dir, filename)
        except FileNotFoundError:
            logger.error(f"Static file not found: {filename}")
            return {'error': f'Static file not found: {filename}'}, 404
    
    # Debug endpoint to check file structure
    @app.route('/api/debug/files')
    def debug_files():
        """Debug endpoint to check file structure in container."""
        current_dir = os.path.dirname(os.path.abspath(__file__))
        app_root = os.path.dirname(current_dir)
        
        debug_info = {
            'current_file': __file__,
            'current_dir': current_dir,
            'app_root': app_root,
            'app_root_contents': os.listdir(app_root) if os.path.exists(app_root) else 'Not found',
        }
        
        # Check for frontend directory
        frontend_dir = os.path.join(app_root, 'frontend')
        if os.path.exists(frontend_dir):
            debug_info['frontend_dir'] = frontend_dir
            debug_info['frontend_contents'] = os.listdir(frontend_dir)
            
            # Check for build directory
            build_dir = os.path.join(frontend_dir, 'build')
            if os.path.exists(build_dir):
                debug_info['build_dir'] = build_dir
                debug_info['build_contents'] = os.listdir(build_dir)
            else:
                debug_info['build_dir'] = 'Not found'
        else:
            debug_info['frontend_dir'] = 'Not found'
            
        return debug_info
    
    # Register resources
    api.add_resource(LeadResource, '/api/leads', '/api/leads/<int:id>')
    api.add_resource(CustomerResource, '/api/customers', '/api/customers/<string:customer_uid>')
    api.add_resource(ContactResource, '/api/contacts', '/api/contacts/<int:contact_id>')
    api.add_resource(TradingVolumeResource, '/api/trading-volume')
    api.add_resource(TradingSummaryResource, '/api/trading-summary')
    
    # Activity resources (lead-centric)
    api.add_resource(ActivityListResource, '/api/activities')
    api.add_resource(ActivityResource, '/api/activities/<int:activity_id>')
    api.add_resource(ActivityTimelineResource, '/api/activities/timeline')
    api.add_resource(ActivityStatsResource, '/api/activities/stats')
    
    # Task management resources (unified with activities)
    api.add_resource(TaskListResource, '/api/tasks')  # Legacy endpoint for task creation
    api.add_resource(TaskResource, '/api/tasks/<int:task_id>')  # Task operations (complete/cancel)

    # Analytics resources
    api.add_resource(LeadConversionRateResource, '/api/analytics/monthly-lead-conversion-rate')
    api.add_resource(ActivityAnalyticsResource, '/api/analytics/activity-analytics')
    api.add_resource(AvgDailyActivityResource, '/api/analytics/avg-daily-activity')
    api.add_resource(LeadFunnelResource, '/api/analytics/lead-funnel')
    api.add_resource(TradingVolumeTimeSeriesResource, '/api/trading-volume-time-series')
    api.add_resource(TradingVolumeTopCustomersResource, '/api/analytics/trading-volume-top-customers')
    
    # Serve React app in production
    @app.route('/', defaults={'path': ''})
    @app.route('/<path:path>')
    def serve_react_app(path):
        # Check if it's an API request (these should return 404 if not found)
        if path.startswith('api/'):
            return {'error': 'API endpoint not found'}, 404
            
        # Build directory path - we know this works from debug endpoint
        build_dir = '/app/frontend/build'
        
        # Log the request for debugging
        logger.info(f"Serving request for path: '{path}' from {build_dir}")
        
        # Handle root path
        if path == '' or path == '/':
            file_path = 'index.html'
        else:
            file_path = path
            
        # Full path to requested file
        full_path = os.path.join(build_dir, file_path)
        logger.info(f"Looking for file: {full_path}")
        
        # Try to serve the specific file if it exists
        if os.path.exists(full_path) and os.path.isfile(full_path):
            logger.info(f"Serving file: {full_path}")
            try:
                return send_from_directory(build_dir, file_path)
            except Exception as e:
                logger.error(f"Error serving {file_path}: {e}")
                return {'error': f'Error serving file: {str(e)}'}, 500
        
        # If file doesn't exist, check if it's a directory request (serve index.html)
        if os.path.exists(os.path.join(build_dir, file_path)) and os.path.isdir(os.path.join(build_dir, file_path)):
            try:
                return send_from_directory(os.path.join(build_dir, file_path), 'index.html')
            except FileNotFoundError:
                pass
        
        # For SPA routing, serve index.html for unmatched routes (client-side routing)
        index_path = os.path.join(build_dir, 'index.html')
        if os.path.exists(index_path):
            logger.info(f"Serving index.html for SPA route: {path}")
            try:
                return send_from_directory(build_dir, 'index.html')
            except Exception as e:
                logger.error(f"Error serving index.html: {e}")
                return {'error': f'Error serving index.html: {str(e)}'}, 500
        else:
            logger.error(f"index.html not found at {index_path}")
            return {'error': 'index.html not found'}, 404
    
    logger.info("LeadFi API initialized successfully")
    return app

app = create_app()

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)