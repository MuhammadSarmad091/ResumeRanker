"""Flask Application Factory"""

from flask import Flask
from flask_cors import CORS
from .config import Config
from .api.routes import api


def create_app():
    """Create and configure Flask application"""
    
    # Validate configuration
    Config.validate()
    
    # Create Flask app
    app = Flask(__name__)
    
    # Enable CORS for all routes
    CORS(app)
    
    # Register blueprints
    app.register_blueprint(api)
    
    # Global error handlers
    @app.errorhandler(404)
    def not_found(error):
        return {'status': 'error', 'message': 'Endpoint not found'}, 404
    
    @app.errorhandler(500)
    def server_error(error):
        return {'status': 'error', 'message': 'Internal server error'}, 500
    
    return app


if __name__ == '__main__':
    app = create_app()
    app.run(debug=True, host='0.0.0.0', port=5000)
