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
    
    # Simple test route to verify routing works
    @app.route('/api/test')
    def simple_test():
        """Simple test route to verify Flask routing works."""
        return {
            'status': 'success',
            'message': 'Flask routing is working!',
            'route': '/api/test'
        }
    
        # REMOVED DUPLICATE STATIC ROUTE - consolidated below

    # Serve React build assets (favicon, logos, manifest)
    @app.route('/favicon.ico')
    def serve_favicon():
        """Serve favicon from React build directory."""
        return send_from_directory('/app/frontend/build', 'favicon.ico')
    
    @app.route('/logo192.png')
    def serve_logo192():
        """Serve logo192 from React build directory."""
        return send_from_directory('/app/frontend/build', 'logo192.png')
    
    @app.route('/logo512.png')
    def serve_logo512():
        """Serve logo512 from React build directory."""
        return send_from_directory('/app/frontend/build', 'logo512.png')
    
    @app.route('/manifest.json')
    def serve_manifest():
        """Serve manifest from React build directory."""
        return send_from_directory('/app/frontend/build', 'manifest.json')
    
    @app.route('/robots.txt')
    def serve_robots():
        """Serve robots.txt from React build directory."""
        return send_from_directory('/app/frontend/build', 'robots.txt')
    
    # Simple test route to verify file serving works
    @app.route('/api/debug/test-index')
    def test_index():
        """Test serving index.html directly."""
        try:
            return send_from_directory('/app/frontend/build', 'index.html')
        except Exception as e:
            return {'error': f'Failed to serve index.html: {str(e)}'}, 500
    
    # Debug route to test static files
    @app.route('/api/debug/test-static')
    def test_static():
        """Test static file accessibility."""
        import glob
        build_dir = '/app/frontend/build'
        static_dir = '/app/frontend/build/static'
        
        try:
            # Check if directories exist
            debug_info = {
                'build_dir_exists': os.path.exists(build_dir),
                'static_dir_exists': os.path.exists(static_dir),
                'build_contents': [],
                'static_contents': [],
                'js_files': [],
                'css_files': []
            }
            
            if os.path.exists(build_dir):
                debug_info['build_contents'] = os.listdir(build_dir)
                
            if os.path.exists(static_dir):
                debug_info['static_contents'] = os.listdir(static_dir)
                
                # Check for JS and CSS files
                js_dir = os.path.join(static_dir, 'js')
                css_dir = os.path.join(static_dir, 'css')
                
                if os.path.exists(js_dir):
                    debug_info['js_files'] = os.listdir(js_dir)
                if os.path.exists(css_dir):
                    debug_info['css_files'] = os.listdir(css_dir)
                    
            return debug_info
            
        except Exception as e:
            return {'error': f'Debug failed: {str(e)}'}, 500
    
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
    
    # Debug route to inspect current environment
    @app.route('/api/debug/environment')
    def debug_environment():
        """Debug the current working directory and file structure."""
        import glob
        try:
            debug_info = {
                'current_working_directory': os.getcwd(),
                'directory_contents': [],
                'frontend_exists': False,
                'frontend_build_exists': False,
                'frontend_build_contents': [],
                'react_build_files': {
                    'index_html_exists': False,
                    'static_dir_exists': False,
                    'static_contents': []
                }
            }
            
            # Check current directory contents
            debug_info['directory_contents'] = os.listdir('.')
            
            # Check if frontend directory exists
            if os.path.exists('frontend'):
                debug_info['frontend_exists'] = True
                
                # Check if frontend/build exists
                if os.path.exists('frontend/build'):
                    debug_info['frontend_build_exists'] = True
                    debug_info['frontend_build_contents'] = os.listdir('frontend/build')
                    
                    # Check specific React build files
                    debug_info['react_build_files']['index_html_exists'] = os.path.exists('frontend/build/index.html')
                    
                    if os.path.exists('frontend/build/static'):
                        debug_info['react_build_files']['static_dir_exists'] = True
                        debug_info['react_build_files']['static_contents'] = os.listdir('frontend/build/static')
            
            return debug_info
            
        except Exception as e:
            return {'error': f'Debug failed: {str(e)}'}, 500
    
    # Debug route to test CSS file serving specifically
    @app.route('/api/debug/test-css')
    def test_css():
        """Test serving the specific CSS file that's failing."""
        try:
            css_file = '/app/frontend/build/static/css/main.35f551c3.css'
            if os.path.exists(css_file):
                return send_from_directory('/app/frontend/build/static/css', 'main.35f551c3.css')
            else:
                return {'error': f'CSS file not found at {css_file}'}, 404
        except Exception as e:
            return {'error': f'Failed to serve CSS: {str(e)}'}, 500
    
    # Debug route to test JS file serving specifically
    @app.route('/api/debug/test-js')
    def test_js():
        """Test serving the specific JS file that's failing."""
        try:
            js_file = '/app/frontend/build/static/js/main.397e99f4.js'
            if os.path.exists(js_file):
                return send_from_directory('/app/frontend/build/static/js', 'main.397e99f4.js')
            else:
                return {'error': f'JS file not found at {js_file}'}, 404
        except Exception as e:
            return {'error': f'Failed to serve JS: {str(e)}'}, 500
    
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
    
    # Static files route (MUST be before catch-all route)
    @app.route('/static/<path:filename>')
    def serve_static_files(filename):
        """Serve static files from React build/static directory - works locally and on Railway."""
        
        # Try multiple possible locations for static files
        possible_dirs = [
            # Railway path
            '/app/frontend/build/static',
            # Local development path (relative to project root)
            os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'frontend', 'build', 'static'),
            # Alternative local path
            os.path.join(os.getcwd(), 'frontend', 'build', 'static')
        ]
        
        logger.info(f"Static file request: {filename}")
        
        static_path = None
        static_dir = None
        
        # Find the first existing directory
        for potential_dir in possible_dirs:
            potential_path = os.path.join(potential_dir, filename)
            logger.info(f"Trying: {potential_path}")
            
            if os.path.exists(potential_path) and os.path.isfile(potential_path):
                static_path = potential_path
                static_dir = potential_dir
                logger.info(f"Found static file at: {static_path}")
                break
        
        if static_path and os.path.isfile(static_path):
            try:
                with open(static_path, 'rb') as f:
                    file_content = f.read()
                
                # Determine content type
                content_type = 'text/plain'
                if filename.endswith('.js'):
                    content_type = 'application/javascript'
                elif filename.endswith('.css'):
                    content_type = 'text/css'
                elif filename.endswith('.map'):
                    content_type = 'application/json'
                elif filename.endswith('.png'):
                    content_type = 'image/png'
                elif filename.endswith('.woff2'):
                    content_type = 'font/woff2'
                elif filename.endswith('.woff'):
                    content_type = 'font/woff'
                
                from flask import Response
                logger.info(f"Serving {filename} ({len(file_content)} bytes) as {content_type}")
                return Response(file_content, mimetype=content_type)
                
            except Exception as e:
                logger.error(f"Error reading static file {filename}: {e}")
                return {'error': f'Error reading {filename}: {str(e)}'}, 500
        else:
            logger.error(f"Static file not found: {filename}")
            logger.error(f"Searched in: {possible_dirs}")
            return {'error': 'Static file not found'}, 404
    
    # Serve React app in production  
    @app.route('/', defaults={'path': ''})
    @app.route('/<path:path>')
    def serve_react_app(path):
        # Skip ALL API requests - let Flask handle them through specific routes
        if path.startswith('api/'):
            from flask import abort
            abort(404)
            
        # Get build directory - use absolute path resolution
        project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        build_dir = os.path.join(project_root, 'frontend', 'build')
        
        logger.info(f"Frontend request: path='{path}'")
        logger.info(f"Build directory: {build_dir}")
        logger.info(f"Build dir exists: {os.path.exists(build_dir)}")
        
        # Ensure build directory exists
        if not os.path.exists(build_dir):
            logger.error(f"Build directory not found: {build_dir}")
            return {'error': 'Frontend build not found. Run: cd frontend && npm run build'}, 500
        
        # Root path - serve index.html
        if path == '' or path == '/':
            index_path = os.path.join(build_dir, 'index.html')
            logger.info(f"Serving index.html: {index_path}")
            if os.path.exists(index_path):
                try:
                    with open(index_path, 'r') as f:
                        return f.read(), 200, {'Content-Type': 'text/html'}
                except Exception as e:
                    logger.error(f"Error reading index.html: {e}")
                    return {'error': f'Error reading index.html: {str(e)}'}, 500
            else:
                logger.error(f"index.html not found at {index_path}")
                return {'error': 'index.html not found'}, 404
        
        # Try to serve the requested file
        file_path = os.path.join(build_dir, path)
        logger.info(f"Checking file: {file_path}")
        
        if os.path.exists(file_path) and os.path.isfile(file_path):
            logger.info(f"Serving file: {path}")
            try:
                # Read and serve file directly to avoid send_from_directory issues
                with open(file_path, 'rb') as f:
                    file_content = f.read()
                
                # Determine content type
                content_type = 'text/plain'
                if path.endswith('.js'):
                    content_type = 'application/javascript'
                elif path.endswith('.css'):
                    content_type = 'text/css'
                elif path.endswith('.html'):
                    content_type = 'text/html'
                elif path.endswith('.png'):
                    content_type = 'image/png'
                elif path.endswith('.ico'):
                    content_type = 'image/x-icon'
                elif path.endswith('.json'):
                    content_type = 'application/json'
                
                from flask import Response
                return Response(file_content, mimetype=content_type)
                
            except Exception as e:
                logger.error(f"Error serving {path}: {e}")
                return {'error': f'Error serving {path}: {str(e)}'}, 500
        
        # File not found - serve index.html for SPA routing (React Router)
        logger.info(f"File not found, serving index.html for SPA route: {path}")
        index_path = os.path.join(build_dir, 'index.html')
        if os.path.exists(index_path):
            try:
                with open(index_path, 'r') as f:
                    return f.read(), 200, {'Content-Type': 'text/html'}
            except Exception as e:
                logger.error(f"Error reading index.html fallback: {e}")
                return {'error': f'Error reading index.html: {str(e)}'}, 500
        else:
            return {'error': 'Frontend not found'}, 404
    
    logger.info("LeadFi API initialized successfully")
    return app

app = create_app()

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)