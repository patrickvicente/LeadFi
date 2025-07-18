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
            
        # Build directory path
        build_dir = os.path.join(os.path.dirname(app.root_path), 'frontend', 'build')
        
        # Handle empty path (serve index.html)
        if path == '':
            path = 'index.html'
            
        # Try to serve the requested file
        try:
            return send_from_directory(build_dir, path)
        except FileNotFoundError:
            # For SPA routing, serve index.html for unmatched routes
            try:
                return send_from_directory(build_dir, 'index.html')
            except FileNotFoundError:
                return {'error': 'Frontend build files not found. Check Docker build process.'}, 500
    
    logger.info("LeadFi API initialized successfully")
    return app

app = create_app()

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)