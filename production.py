"""
Production configuration for Resume Screening App
"""
import os
from app import app

if __name__ == '__main__':
    # Production settings
    port = int(os.getenv('PORT', 5000))
    host = os.getenv('HOST', '0.0.0.0')
    
    # Use Gunicorn for production
    app.run(host=host, port=port, debug=False, threaded=True)
