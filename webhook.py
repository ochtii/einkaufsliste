#!/usr/bin/env python3
"""
GitHub Webhook Server for Einkaufsliste Auto-Deployment
Listens for push events on 'live' branch and triggers deployment
"""

import os
import json
import hmac
import hashlib
import subprocess
import logging
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs

# Configuration
WEBHOOK_SECRET = os.environ.get('GITHUB_WEBHOOK_SECRET', 'einkaufsliste-webhook-secret')
WEBHOOK_PORT = int(os.environ.get('WEBHOOK_PORT', '9000'))
REPO_PATH = os.environ.get('REPO_PATH', '/home/einkaufsliste')
DEPLOY_SCRIPT = os.path.join(REPO_PATH, 'deploy.sh')

# Logging setup
import sys
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout)  # Explizit stdout verwenden
    ]
)
logger = logging.getLogger(__name__)

class WebhookHandler(BaseHTTPRequestHandler):
    
    def do_POST(self):
        """Handle GitHub webhook POST requests"""
        try:
            # Read payload once
            content_length = int(self.headers.get('Content-Length', 0))
            payload = self.rfile.read(content_length)
            
            # Validate GitHub webhook signature
            if not self._validate_github_webhook(payload):
                return
            
            # Parse payload
            data = json.loads(payload.decode('utf-8'))
            
            # Check if it's a push to 'live' branch
            if self._should_deploy(data):
                logger.info(f"Triggering deployment for commit: {data.get('head_commit', {}).get('id', 'unknown')}")
                self._trigger_deployment(data)
                self._send_response(200, {"status": "deployment_triggered", "message": "Auto-deployment started"})
            else:
                logger.info("Webhook received but no deployment needed")
                self._send_response(200, {"status": "ignored", "message": "Not a live branch push"})
                
        except Exception as e:
            logger.error(f"Webhook error: {str(e)}")
            self._send_response(500, {"status": "error", "message": str(e)})
    
    def do_GET(self):
        """Handle health check requests"""
        if self.path == '/health':
            self._send_response(200, {"status": "healthy", "service": "einkaufsliste-webhook"})
        else:
            self._send_response(404, {"status": "not_found"})
    
    def _validate_github_webhook(self, payload):
        """Validate GitHub webhook signature"""
        signature = self.headers.get('X-Hub-Signature-256')
        if not signature:
            logger.warning("Missing GitHub webhook signature")
            self._send_response(401, {"status": "unauthorized", "message": "Missing signature"})
            return False
        
        # Verify signature
        mac = hmac.new(
            WEBHOOK_SECRET.encode('utf-8'),
            payload,
            hashlib.sha256
        )
        expected_signature = 'sha256=' + mac.hexdigest()
        
        if not hmac.compare_digest(signature, expected_signature):
            logger.warning("Invalid GitHub webhook signature")
            self._send_response(401, {"status": "unauthorized", "message": "Invalid signature"})
            return False
        
        return True
    
    def _should_deploy(self, data):
        """Check if webhook should trigger deployment"""
        # Only deploy on push events to 'live' branch
        if data.get('ref') != 'refs/heads/live':
            return False
        
        # Skip if it's just a merge commit without real changes
        commits = data.get('commits', [])
        if not commits:
            return False
        
        return True
    
    def _trigger_deployment(self, data):
        """Execute deployment script"""
        try:
            # Change to repo directory
            os.chdir(REPO_PATH)
            
            # Pull latest changes
            logger.info("Pulling latest changes from live branch...")
            subprocess.run(['git', 'fetch', 'origin'], check=True)
            subprocess.run(['git', 'reset', '--hard', 'origin/live'], check=True)
            
            # Run deployment script
            if os.path.exists(DEPLOY_SCRIPT):
                logger.info(f"Executing deployment script: {DEPLOY_SCRIPT}")
                result = subprocess.run(['/bin/bash', DEPLOY_SCRIPT], 
                                      capture_output=True, text=True, timeout=300)
                
                if result.returncode == 0:
                    logger.info("Deployment completed successfully")
                    logger.info(f"Deploy output: {result.stdout}")
                else:
                    logger.error(f"Deployment failed: {result.stderr}")
                    raise Exception(f"Deploy script failed with code {result.returncode}")
            else:
                logger.error(f"Deployment script not found: {DEPLOY_SCRIPT}")
                raise Exception("Deploy script not found")
                
        except subprocess.TimeoutExpired:
            logger.error("Deployment timed out after 5 minutes")
            raise Exception("Deployment timeout")
        except Exception as e:
            logger.error(f"Deployment error: {str(e)}")
            raise
    
    def _send_response(self, status_code, data):
        """Send JSON response"""
        self.send_response(status_code)
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps(data).encode('utf-8'))
    
    def log_message(self, format, *args):
        """Override default logging to use our logger"""
        logger.info(f"{self.address_string()} - {format % args}")

def main():
    """Start webhook server"""
    logger.info(f"Starting Einkaufsliste webhook server on port {WEBHOOK_PORT}")
    logger.info(f"Repository path: {REPO_PATH}")
    logger.info(f"Deploy script: {DEPLOY_SCRIPT}")
    
    server = HTTPServer(('0.0.0.0', WEBHOOK_PORT), WebhookHandler)
    
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        logger.info("Webhook server stopped")
    finally:
        server.server_close()

if __name__ == '__main__':
    main()
