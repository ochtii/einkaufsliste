#!/usr/bin/env python3
"""
Simple HTTP Server for Frontend Static Files
"""

import http.server
import socketserver
import os
import sys
import logging

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - Frontend Server - %(message)s',
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger(__name__)

PORT = int(os.environ.get('PORT', 3000))
DIRECTORY = os.path.join(os.path.dirname(__file__), 'frontend', 'build')

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)
    
    def log_message(self, format, *args):
        logger.info(f"{self.address_string()} - {format % args}")
    
    def end_headers(self):
        # Add CORS headers
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        super().end_headers()

if __name__ == "__main__":
    try:
        with socketserver.TCPServer(("0.0.0.0", PORT), Handler) as httpd:
            logger.info(f"🌐 Frontend Server starting on http://0.0.0.0:{PORT}")
            logger.info(f"📁 Serving directory: {DIRECTORY}")
            
            # Check if build directory exists
            if not os.path.exists(DIRECTORY):
                logger.error(f"❌ Build directory not found: {DIRECTORY}")
                logger.error("   Run 'npm run build' in frontend directory first")
                sys.exit(1)
            
            # List available files
            files = os.listdir(DIRECTORY)
            logger.info(f"📋 Available files: {', '.join(files[:5])}" + ("..." if len(files) > 5 else ""))
            
            httpd.serve_forever()
    except KeyboardInterrupt:
        logger.info("🛑 Frontend Server stopped")
    except Exception as e:
        logger.error(f"❌ Frontend Server error: {e}")
        sys.exit(1)
