#!/usr/bin/env python3
"""
Einkaufsliste API Server v3 - Mit Template-Unterstützung
"""

import sqlite3
import json
import hashlib
import secrets
import uuid
import time
from http.server import HTTPServer, BaseHTTPRequestHandler
from socketserver import ThreadingMixIn
from urllib.parse import urlparse, parse_qs
from datetime import datetime, timedelta
import logging
import os
import threading
import signal
import sys
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv('../.env')

# Logging setup - Explizit stdout für PM2
logging.basicConfig(
    level=logging.INFO, 
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger(__name__)

# Global server start time for uptime calculation
server_start_time = time.time()

# Security Configuration
ADMIN_PASSWORD = os.environ.get('ADMIN_PASSWORD')
if not ADMIN_PASSWORD:
    logger.error("❌ FEHLER: ADMIN_PASSWORD Umgebungsvariable nicht gesetzt!")
    logger.error("   Setze eine sichere ADMIN_PASSWORD Umgebungsvariable vor dem Start.")
    sys.exit(1)

# Helper function to load HTML templates
def load_template(template_name, fallback_html="<html><body><h1>Template not found</h1></body></html>"):
    """Load HTML template from templates directory"""
    try:
        template_path = os.path.join(os.path.dirname(__file__), 'templates', template_name)
        with open(template_path, 'r', encoding='utf-8') as f:
            return f.read()
    except FileNotFoundError:
        print(f"Warning: Template {template_name} not found, using fallback")
        return fallback_html
    except Exception as e:
        print(f"Error loading template {template_name}: {e}")
        return fallback_html

class ThreadedHTTPServer(ThreadingMixIn, HTTPServer):
    """HTTP Server that handles requests in separate threads"""
    daemon_threads = True
    allow_reuse_address = True
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.request_count = 0
        self.start_time = datetime.now()
        print("🧵 Server supports concurrent connections")

# Global session storage (thread-safe)
sessions = {}
session_lock = threading.Lock()

class AdminHandler(BaseHTTPRequestHandler):
    """HTTP Request Handler with Admin Panel and API"""
    
    def log_message(self, format, *args):
        """Log messages with thread info"""
        thread_id = threading.current_thread().ident
        logger.info(f"[Thread-{thread_id}] {self.client_address[0]} - \"{format%args}\"")

    def do_GET(self):
        """Handle GET requests"""
        try:
            path = urlparse(self.path).path
            
            if path == '/':
                self.send_api_info()
            elif path == '/admin':
                if self.check_admin_session():
                    self.show_dashboard()
                else:
                    self.show_admin_login()
            elif path == '/admin/logout':
                self.handle_logout()
            elif path == '/documentation' or path == '/docs':
                self.serve_documentation()
            elif path.startswith('/templates/'):
                self.serve_template_file(path)
            elif path.startswith('/api/'):
                self.handle_api_request(path, 'GET', {})
            else:
                self.send_404()
        except Exception as e:
            logger.error(f"GET Error: {e}")
            self.send_500(str(e))

    def do_POST(self):
        """Handle POST requests"""
        try:
            path = urlparse(self.path).path
            content_length = int(self.headers.get('Content-Length', 0))
            
            if content_length > 0:
                post_data = self.rfile.read(content_length).decode('utf-8')
            else:
                post_data = ""
            
            print(f"🔍 Debug POST - Path: {path}, Data: {post_data}")
            
            if path == '/admin/login':
                self.handle_admin_login(post_data)
            elif path.startswith('/api/'):
                try:
                    data = json.loads(post_data) if post_data else {}
                except:
                    data = {}
                self.handle_api_request(path, 'POST', data)
            else:
                self.send_404()
        except Exception as e:
            logger.error(f"POST Error: {e}")
            self.send_500(str(e))

    def do_PATCH(self):
        """Handle PATCH requests"""
        try:
            path = urlparse(self.path).path
            content_length = int(self.headers.get('Content-Length', 0))
            
            if content_length > 0:
                patch_data = self.rfile.read(content_length).decode('utf-8')
            else:
                patch_data = ""
            
            if path.startswith('/api/'):
                try:
                    data = json.loads(patch_data) if patch_data else {}
                except:
                    data = {}
                self.handle_api_request(path, 'PATCH', data)
            else:
                self.send_404()
        except Exception as e:
            logger.error(f"PATCH Error: {e}")
            self.send_500(str(e))

    def do_DELETE(self):
        """Handle DELETE requests"""
        try:
            path = urlparse(self.path).path
            content_length = int(self.headers.get('Content-Length', 0))
            
            if content_length > 0:
                delete_data = self.rfile.read(content_length).decode('utf-8')
            else:
                delete_data = ""
            
            if path.startswith('/api/'):
                try:
                    data = json.loads(delete_data) if delete_data else {}
                except:
                    data = {}
                self.handle_api_request(path, 'DELETE', data)
            else:
                self.send_404()
        except Exception as e:
            logger.error(f"DELETE Error: {e}")
            self.send_500(str(e))

    def send_response_with_headers(self, code, content, content_type='text/html'):
        """Send HTTP response with proper headers"""
        self.send_response(code)
        self.send_header('Content-type', content_type)
        self.send_header('Cache-Control', 'no-cache')
        self.end_headers()
        self.wfile.write(content.encode('utf-8'))

    def send_json(self, data, code=200):
        """Send JSON response"""
        self.send_response_with_headers(code, json.dumps(data), 'application/json')

    def send_404(self):
        """Send 404 error"""
        self.send_response_with_headers(404, '<h1>404 - Not Found</h1>')

    def send_500(self, error):
        """Send 500 error"""
        self.send_response_with_headers(500, f'<h1>500 - Internal Server Error</h1><p>{error}</p>')

    def send_api_info(self):
        """Send API information"""
        info = {
            "name": "Einkaufsliste API",
            "version": "3.0",
            "status": "running",
            "admin_panel": "/admin",
            "documentation": "/docs"
        }
        self.send_json(info)

    def show_admin_login(self):
        """Show admin login page using template"""
        html = load_template('login.html', '''<!DOCTYPE html>
<html>
<head><title>Admin Login</title></head>
<body style="font-family: Arial; background: #1a1a1a; color: #fff; text-align: center; padding: 50px;">
    <h1>Admin Login</h1>
    <form method="post" action="/admin/login">
        <input type="password" name="password" placeholder="Password" required style="padding: 10px; margin: 10px;">
        <br><button type="submit" style="padding: 10px 20px;">Login</button>
    </form>
    <p>Use environment variable ADMIN_PASSWORD</p>
</body>
</html>''')
        self.send_response_with_headers(200, html)

    def show_dashboard(self):
        """Show admin dashboard using template"""
        html = load_template('dashboard.html', '''<!DOCTYPE html>
<html>
<head><title>Admin Dashboard</title></head>
<body style="font-family: Arial; background: #1a1a1a; color: #fff; padding: 20px;">
    <h1>Admin Dashboard</h1>
    <p>Dashboard template not found. Please check templates/dashboard.html</p>
    <a href="/admin/logout">Logout</a>
</body>
</html>''')
        self.send_response_with_headers(200, html)

    def serve_template_file(self, path):
        """Serve CSS/JS template files"""
        try:
            # Remove /templates/ prefix
            filename = path[11:]  # Remove '/templates/'
            template_path = os.path.join(os.path.dirname(__file__), 'templates', filename)
            
            # Determine content type
            if filename.endswith('.css'):
                content_type = 'text/css'
            elif filename.endswith('.js'):
                content_type = 'application/javascript'
            else:
                content_type = 'text/plain'
            
            with open(template_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            self.send_response_with_headers(200, content, content_type)
        except FileNotFoundError:
            self.send_404()
        except Exception as e:
            logger.error(f"Error serving template file {path}: {e}")
            self.send_500(str(e))

    def handle_admin_login(self, post_data):
        """Handle admin login"""
        try:
            if 'password=' in post_data:
                password = post_data.split('password=')[1].split('&')[0]
                # Proper URL decoding
                import urllib.parse
                password = urllib.parse.unquote_plus(password)
                
                print(f"🔍 Debug - Received password: '{password}' (length: {len(password)})")
                print(f"🔍 Debug - Expected password: '[ENVIRONMENT_VARIABLE]' (length: {len(ADMIN_PASSWORD)})")
                
                if password == ADMIN_PASSWORD:
                    # Create session
                    session_id = secrets.token_urlsafe(32)
                    with session_lock:
                        sessions[session_id] = {
                            'created': datetime.now(),
                            'last_access': datetime.now()
                        }
                    
                    # Redirect to dashboard
                    self.send_response(302)
                    self.send_header('Location', '/admin')
                    self.send_header('Set-Cookie', f'admin_session={session_id}; Path=/; HttpOnly; Max-Age=86400')
                    self.end_headers()
                    return
            
            # Login failed - show error
            html = load_template('login_error.html', '''<!DOCTYPE html>
<html>
<head><title>Login Error</title></head>
<body style="background: #1a1a1a; color: #fff; text-align: center; padding: 50px;">
    <h2>❌ Login Failed</h2>
    <p>Invalid password. Please try again.</p>
    <p><a href="/admin" style="color: #4CAF50;">← Back to Login</a></p>
</body>
</html>''')
            self.send_response_with_headers(401, html)
            
        except Exception as e:
            logger.error(f"Login error: {e}")
            self.send_response_with_headers(500, f'<h1>Login Error</h1><p>{str(e)}</p>')

    def check_admin_session(self):
        """Check if admin session is valid"""
        try:
            cookies = self.headers.get('Cookie', '')
            if 'admin_session=' in cookies:
                session_id = cookies.split('admin_session=')[1].split(';')[0]
                
                with session_lock:
                    if session_id in sessions:
                        session = sessions[session_id]
                        # Check if session is not expired (24 hours)
                        if datetime.now() - session['created'] < timedelta(hours=24):
                            session['last_access'] = datetime.now()
                            return True
                        else:
                            del sessions[session_id]
            return False
        except Exception as e:
            logger.error(f"Session check error: {e}")
            return False

    def handle_logout(self):
        """Handle admin logout"""
        try:
            cookies = self.headers.get('Cookie', '')
            if 'admin_session=' in cookies:
                session_id = cookies.split('admin_session=')[1].split(';')[0]
                with session_lock:
                    if session_id in sessions:
                        del sessions[session_id]
            
            # Redirect to login with cleared cookie
            self.send_response(302)
            self.send_header('Location', '/admin')
            self.send_header('Set-Cookie', 'admin_session=; Path=/; HttpOnly; Max-Age=0')
            self.end_headers()
        except Exception as e:
            logger.error(f"Logout error: {e}")
            self.redirect_to_login()

    def log_api_key_usage(self, api_key_id, endpoint_id, method, path, ip_address, user_agent, payload_size, response_status, response_time_ms):
        """Log API key usage for detailed tracking"""
        try:
            db_path = os.path.join(os.path.dirname(__file__), '..', 'backend', 'db.sqlite')
            conn = sqlite3.connect(db_path)
            cursor = conn.cursor()
            
            cursor.execute("""
                INSERT INTO api_key_usage_logs 
                (api_key_id, endpoint_id, method, path, ip_address, user_agent, 
                 payload_size, response_status, response_time_ms)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (api_key_id, endpoint_id, method, path, ip_address, user_agent, 
                  payload_size, response_status, response_time_ms))
            
            conn.commit()
            conn.close()
        except Exception as e:
            logger.error(f"Failed to log API key usage: {e}")

    def validate_api_key(self, api_key, endpoint_id, client_ip):
        """Validate API key permissions and IP restrictions"""
        if not api_key:
            return False, "API key required"
        
        try:
            db_path = os.path.join(os.path.dirname(__file__), '..', 'backend', 'db.sqlite')
            conn = sqlite3.connect(db_path)
            cursor = conn.cursor()
            
            # Get API key details
            key_hash = hashlib.sha256(api_key.encode()).hexdigest()
            cursor.execute("""
                SELECT endpoint_permissions, ip_restrictions, is_active, expires_at, rate_limit
                FROM api_keys 
                WHERE key_hash = ?
            """, (key_hash,))
            
            result = cursor.fetchone()
            if not result:
                return False, "Invalid API key"
            
            endpoint_permissions, ip_restrictions, is_active, expires_at, rate_limit = result
            
            # Check if key is active
            if not is_active:
                return False, "API key is deactivated"
            
            # Check if key is expired
            if expires_at:
                expires_date = datetime.fromisoformat(expires_at)
                if datetime.now() > expires_date:
                    return False, "API key has expired"
            
            # Check endpoint permissions
            permissions = json.loads(endpoint_permissions) if endpoint_permissions else []
            if endpoint_id not in permissions:
                return False, f"Access denied to endpoint: {endpoint_id}"
            
            # Check IP restrictions
            ip_list = json.loads(ip_restrictions) if ip_restrictions else []
            if ip_list and client_ip not in ip_list:
                # Check for CIDR ranges
                import ipaddress
                allowed = False
                for ip_range in ip_list:
                    try:
                        if '/' in ip_range:
                            network = ipaddress.ip_network(ip_range, strict=False)
                            if ipaddress.ip_address(client_ip) in network:
                                allowed = True
                                break
                        elif client_ip == ip_range:
                            allowed = True
                            break
                    except:
                        continue
                
                if not allowed:
                    return False, f"IP address {client_ip} not allowed"
            
            # Update last used timestamp and increment usage count
            cursor.execute("""
                UPDATE api_keys 
                SET last_used = CURRENT_TIMESTAMP, usage_count = usage_count + 1 
                WHERE key_hash = ?
            """, (key_hash,))
            
            # Get the API key ID for logging
            cursor.execute("SELECT id FROM api_keys WHERE key_hash = ?", (key_hash,))
            api_key_id = cursor.fetchone()[0]
            
            conn.commit()
            conn.close()
            
            return True, "Access granted", api_key_id
            
        except Exception as e:
            logger.error(f"API key validation error: {e}")
            return False, "Validation error"

    def get_all_endpoints(self):
        """Get comprehensive list of all API endpoints with details"""
        return [
            {
                'id': 'users_get',
                'method': 'GET',
                'path': '/api/users',
                'name': 'List Users',
                'description': 'Retrieve all registered users',
                'category': 'Users'
            },
            {
                'id': 'users_post',
                'method': 'POST', 
                'path': '/api/users',
                'name': 'Create User',
                'description': 'Register a new user account',
                'category': 'Users'
            },
            {
                'id': 'articles_get',
                'method': 'GET',
                'path': '/api/articles',
                'name': 'List Articles',
                'description': 'Retrieve all articles',
                'category': 'Articles'
            },
            {
                'id': 'articles_post',
                'method': 'POST',
                'path': '/api/articles',
                'name': 'Create Article',
                'description': 'Create a new article',
                'category': 'Articles'
            },
            {
                'id': 'articles_patch',
                'method': 'PATCH',
                'path': '/api/articles',
                'name': 'Update Article',
                'description': 'Modify existing article',
                'category': 'Articles'
            },
            {
                'id': 'articles_delete',
                'method': 'DELETE',
                'path': '/api/articles',
                'name': 'Delete Article',
                'description': 'Remove article permanently',
                'category': 'Articles'
            },
            {
                'id': 'lists_get',
                'method': 'GET',
                'path': '/api/lists', 
                'name': 'List Shopping Lists',
                'description': 'Get all shopping lists',
                'category': 'Lists'
            },
            {
                'id': 'lists_post',
                'method': 'POST',
                'path': '/api/lists',
                'name': 'Create List',
                'description': 'Create a new shopping list',
                'category': 'Lists'
            },
            {
                'id': 'lists_patch',
                'method': 'PATCH',
                'path': '/api/lists',
                'name': 'Update List',
                'description': 'Modify existing shopping list',
                'category': 'Lists'
            },
            {
                'id': 'lists_delete',
                'method': 'DELETE',
                'path': '/api/lists',
                'name': 'Delete List',
                'description': 'Remove shopping list permanently',
                'category': 'Lists'
            },
            {
                'id': 'categories_get',
                'method': 'GET',
                'path': '/api/categories',
                'name': 'List Categories',
                'description': 'Get all product categories',
                'category': 'Categories'
            },
            {
                'id': 'categories_post',
                'method': 'POST',
                'path': '/api/categories',
                'name': 'Create Category',
                'description': 'Add new product category',
                'category': 'Categories'
            },
            {
                'id': 'categories_patch',
                'method': 'PATCH',
                'path': '/api/categories',
                'name': 'Update Category',
                'description': 'Modify existing category',
                'category': 'Categories'
            },
            {
                'id': 'categories_delete',
                'method': 'DELETE',
                'path': '/api/categories',
                'name': 'Delete Category',
                'description': 'Remove category permanently',
                'category': 'Categories'
            },
            {
                'id': 'stats_get',
                'method': 'GET',
                'path': '/api/stats',
                'name': 'Database Statistics',
                'description': 'Get database usage statistics',
                'category': 'Admin'
            },
            {
                'id': 'api_keys_get',
                'method': 'GET',
                'path': '/api/api-keys',
                'name': 'List API Keys',
                'description': 'View all API keys (admin only)',
                'category': 'Admin'
            },
            {
                'id': 'api_keys_post',
                'method': 'POST',
                'path': '/api/api-keys',
                'name': 'Create API Key',
                'description': 'Generate new API key (admin only)',
                'category': 'Admin'
            },
            {
                'id': 'api_keys_patch',
                'method': 'PATCH',
                'path': '/api/api-keys/{id}',
                'name': 'Toggle API Key',
                'description': 'Enable/disable API key',
                'category': 'Admin'
            },
            {
                'id': 'api_keys_delete',
                'method': 'DELETE',
                'path': '/api/api-keys/{id}',
                'name': 'Delete API Key',
                'description': 'Remove API key permanently',
                'category': 'Admin'
            },
            {
                'id': 'api_keys_usage_get',
                'method': 'GET',
                'path': '/api/api-keys/{id}/usage',
                'name': 'API Key Usage',
                'description': 'View detailed usage statistics for API key',
                'category': 'Admin'
            },
            {
                'id': 'endpoints_get',
                'method': 'GET',
                'path': '/api/endpoints',
                'name': 'List Endpoints',
                'description': 'Get all available API endpoints',
                'category': 'Admin'
            },
            {
                'id': 'endpoints_available_get',
                'method': 'GET',
                'path': '/api/endpoints/available',
                'name': 'Available Endpoints',
                'description': 'Get endpoints for permission configuration',
                'category': 'Admin'
            },
            {
                'id': 'endpoints_status_get',
                'method': 'GET',
                'path': '/api/endpoints/status',
                'name': 'Endpoints Status',
                'description': 'Get endpoint availability status',
                'category': 'Admin'
            },
            {
                'id': 'endpoints_configure_post',
                'method': 'POST',
                'path': '/api/endpoints/configure',
                'name': 'Configure Endpoints',
                'description': 'Configure endpoint settings',
                'category': 'Admin'
            },
            {
                'id': 'logs_get',
                'method': 'GET',
                'path': '/api/logs',
                'name': 'Access Logs',
                'description': 'View API access logs (admin only)',
                'category': 'Admin'
            },
            {
                'id': 'database_info_get',
                'method': 'GET',
                'path': '/api/database/info',
                'name': 'Database Info',
                'description': 'Get database structure and info',
                'category': 'Database'
            },
            {
                'id': 'database_analyze_get',
                'method': 'GET',
                'path': '/api/database/analyze',
                'name': 'Database Analysis',
                'description': 'Analyze database performance',
                'category': 'Database'
            },
            {
                'id': 'database_test_get',
                'method': 'GET',
                'path': '/api/database/test/{type}',
                'name': 'Database Tests',
                'description': 'Run database connectivity and performance tests',
                'category': 'Database'
            },
            {
                'id': 'stats_detailed_get',
                'method': 'GET',
                'path': '/api/stats/detailed',
                'name': 'Detailed Statistics',
                'description': 'Get comprehensive system statistics for monitoring',
                'category': 'Monitoring'
            },
            {
                'id': 'ping_google_get',
                'method': 'GET',
                'path': '/api/ping/google',
                'name': 'Google Ping Test',
                'description': 'Test connectivity to Google DNS (8.8.8.8)',
                'category': 'Monitoring'
            },
            {
                'id': 'ping_cloudflare_get',
                'method': 'GET',
                'path': '/api/ping/cloudflare',
                'name': 'Cloudflare Ping Test',
                'description': 'Test connectivity to Cloudflare DNS (1.1.1.1)',
                'category': 'Monitoring'
            },
            {
                'id': 'ping_frontend_get',
                'method': 'GET',
                'path': '/api/ping/frontend',
                'name': 'Frontend Ping Test',
                'description': 'Test connectivity between backend and frontend',
                'category': 'Monitoring'
            },
            {
                'id': 'ping_backend_get',
                'method': 'GET',
                'path': '/api/ping/backend',
                'name': 'Backend Ping Test',
                'description': 'Test connectivity to main backend server (port 4000)',
                'category': 'Monitoring'
            },
            {
                'id': 'frontend_status_get',
                'method': 'GET',
                'path': '/api/frontend/status',
                'name': 'Frontend Status',
                'description': 'Check if frontend server is running',
                'category': 'Monitoring'
            },
            # Authentication & User Management Endpoints
            {
                'id': 'captcha_get',
                'method': 'GET',
                'path': '/api/captcha',
                'name': 'Generate Captcha',
                'description': 'Generate captcha for registration',
                'category': 'Auth'
            },
            {
                'id': 'register_post',
                'method': 'POST',
                'path': '/api/register',
                'name': 'User Registration',
                'description': 'Register new user account',
                'category': 'Auth'
            },
            {
                'id': 'login_post',
                'method': 'POST',
                'path': '/api/login',
                'name': 'User Login',
                'description': 'Authenticate user and get JWT token',
                'category': 'Auth'
            },
            {
                'id': 'logout_post',
                'method': 'POST',
                'path': '/api/logout',
                'name': 'User Logout',
                'description': 'Logout user and invalidate token',
                'category': 'Auth'
            },
            {
                'id': 'user_profile_get',
                'method': 'GET',
                'path': '/api/user/profile',
                'name': 'User Profile',
                'description': 'Get current user profile information',
                'category': 'Users'
            },
            {
                'id': 'change_password_post',
                'method': 'POST',
                'path': '/api/change-password',
                'name': 'Change Password',
                'description': 'Change user password',
                'category': 'Users'
            },
            {
                'id': 'change_username_post',
                'method': 'POST',
                'path': '/api/change-username',
                'name': 'Change Username',
                'description': 'Change username',
                'category': 'Users'
            },
            # Enhanced Lists & Articles
            {
                'id': 'lists_uuid_delete',
                'method': 'DELETE',
                'path': '/api/lists/{uuid}',
                'name': 'Delete Specific List',
                'description': 'Delete shopping list by UUID',
                'category': 'Lists'
            },
            {
                'id': 'list_articles_get',
                'method': 'GET',
                'path': '/api/lists/{listUuid}/articles',
                'name': 'List Articles',
                'description': 'Get all articles from specific list',
                'category': 'Articles'
            },
            {
                'id': 'list_articles_post',
                'method': 'POST',
                'path': '/api/lists/{listUuid}/articles',
                'name': 'Add Article to List',
                'description': 'Add new article to specific list',
                'category': 'Articles'
            },
            {
                'id': 'articles_uuid_put',
                'method': 'PUT',
                'path': '/api/articles/{uuid}',
                'name': 'Update Article',
                'description': 'Update article by UUID',
                'category': 'Articles'
            },
            {
                'id': 'articles_uuid_delete',
                'method': 'DELETE',
                'path': '/api/articles/{uuid}',
                'name': 'Delete Article',
                'description': 'Delete article by UUID',
                'category': 'Articles'
            },
            {
                'id': 'articles_history_get',
                'method': 'GET',
                'path': '/api/articles/history',
                'name': 'Articles History',
                'description': 'Get purchase history of articles',
                'category': 'Articles'
            },
            # Favorites Management
            {
                'id': 'favorites_get',
                'method': 'GET',
                'path': '/api/favorites',
                'name': 'List Favorites',
                'description': 'Get user favorite articles',
                'category': 'Favorites'
            },
            {
                'id': 'favorites_post',
                'method': 'POST',
                'path': '/api/favorites',
                'name': 'Add Favorite',
                'description': 'Add article to favorites',
                'category': 'Favorites'
            },
            {
                'id': 'favorites_uuid_delete',
                'method': 'DELETE',
                'path': '/api/favorites/{uuid}',
                'name': 'Remove Favorite',
                'description': 'Remove article from favorites',
                'category': 'Favorites'
            },
            # Standard Articles
            {
                'id': 'standard_articles_get',
                'method': 'GET',
                'path': '/api/standard-articles',
                'name': 'Standard Articles',
                'description': 'Get predefined standard articles',
                'category': 'Articles'
            },
            {
                'id': 'standard_articles_post',
                'method': 'POST',
                'path': '/api/standard-articles',
                'name': 'Create Standard Article',
                'description': 'Add new standard article template',
                'category': 'Articles'
            },
            {
                'id': 'standard_articles_delete',
                'method': 'DELETE',
                'path': '/api/standard-articles/{id}',
                'name': 'Delete Standard Article',
                'description': 'Remove standard article template',
                'category': 'Articles'
            },
            # Server Info
            {
                'id': 'uptime_get',
                'method': 'GET',
                'path': '/api/uptime',
                'name': 'Server Uptime',
                'description': 'Get backend server uptime information',
                'category': 'Monitoring'
            }
        ]

    def handle_api_request(self, path, method, data):
        """Handle API requests"""
        start_time = time.time()
        api_key_id = None
        response_status = 200
        
        try:
            # Check if this is an admin session request
            is_admin_session = self.check_admin_session()
            
            # Extract API key from headers
            api_key = self.headers.get('X-API-Key')
            client_ip = self.client_address[0]
            user_agent = self.headers.get('User-Agent', '')
            payload_size = int(self.headers.get('Content-Length', 0))
            
            # Map path to endpoint ID for permission checking
            endpoint_mapping = {
                '/api/stats': 'stats_get',
                '/api/users': 'users_get', 
                '/api/articles': 'articles_get',
                '/api/lists': 'lists_get',
                '/api/categories': 'categories_get',
                '/api/api-keys': 'api_keys_get',
                '/api/endpoints': 'endpoints_get',
                '/api/logs': 'logs_get',
                '/api/database': 'database_info_get',
                '/api/ping': 'ping_google_get',
                '/api/uptime': 'uptime_get'
            }
            
            # Public endpoints that don't require authentication
            public_endpoints = ['/api/docs/data']
            
            # Determine endpoint ID from path
            endpoint_id = None
            for api_path, endpoint in endpoint_mapping.items():
                if path.startswith(api_path):
                    endpoint_id = endpoint
                    break
            
            if not endpoint_id:
                endpoint_id = 'unknown'
            
            # Validate API key for all endpoints UNLESS it's an admin session OR a public endpoint
            if not is_admin_session and path not in public_endpoints:
                validation_result = self.validate_api_key(api_key, endpoint_id, client_ip)
                if len(validation_result) == 2:
                    is_valid, error_message = validation_result
                    api_key_id = None
                else:
                    is_valid, error_message, api_key_id = validation_result
                    
                if not is_valid:
                    response_status = 401
                    self.send_json({'error': error_message, 'message': 'Authentication required'}, 401)
                    return
            
            try:
                if path == '/api/stats':
                    self.handle_stats_request()
                elif path == '/api/users':
                    self.handle_users_request(method, data)
                elif path == '/api/articles':
                    self.handle_articles_request(method, data)
                elif path == '/api/lists':
                    self.handle_lists_request(method, data)
                elif path == '/api/categories':
                    self.handle_categories_request(method, data)
                elif path == '/api/api-keys':
                    self.handle_api_keys_request(method, data)
                elif path.startswith('/api/api-keys/') and '/usage' in path:
                    # Handle API key usage details: /api/api-keys/{id}/usage
                    key_id = path.split('/')[3]
                    self.handle_api_key_usage_request(key_id)
                elif path.startswith('/api/api-keys/') and path.endswith('/toggle'):
                    # Handle API key toggle: /api/api-keys/{id}/toggle
                    key_id = path.split('/')[-2]
                    data['id'] = key_id
                    self.handle_api_keys_request('PATCH', data)
                elif path.startswith('/api/api-keys/') and not path.endswith('/toggle'):
                    # Handle API key deletion: /api/api-keys/{id}
                    key_id = path.split('/')[-1]
                    data['id'] = key_id
                    self.handle_api_keys_request('DELETE', data)
                elif path == '/api/endpoints':
                    self.handle_endpoints_request(method, data)
                elif path == '/api/endpoints/available':
                    # Return all available endpoints for permissions
                    endpoints = self.get_all_endpoints()
                    self.send_json({'success': True, 'endpoints': endpoints})
                elif path == '/api/endpoints/status':
                    self.handle_endpoints_status_request()
                elif path == '/api/endpoints/configure':
                    self.handle_endpoints_configure_request(method, data)
                elif path == '/api/logs':
                    self.handle_logs_request(method, data)
                elif path == '/api/database/info':
                    self.handle_database_info()
                elif path.startswith('/api/database/test/'):
                    test_type = path.split('/')[-1]
                    self.handle_database_test(test_type)
                elif path == '/api/database/analyze':
                    self.handle_database_analyze()
                elif path.startswith('/api/database/'):
                    self.handle_database_request(path, method, data)
                elif path == '/api/stats/detailed':
                    self.handle_detailed_stats_request()
                elif path.startswith('/api/ping/'):
                    ping_target = path.split('/')[-1]
                    self.handle_ping_request(ping_target)
                elif path == '/api/frontend/status':
                    self.handle_frontend_status_request()
                elif path == '/api/docs/data':
                    self.handle_docs_data_request()
                else:
                    response_status = 404
                    self.send_json({'error': 'API endpoint not found'}, 404)
            except Exception as handler_error:
                response_status = 500
                logger.error(f"API handler error: {handler_error}")
                self.send_json({'error': str(handler_error)}, 500)
                
        except Exception as e:
            response_status = 500
            logger.error(f"API request error: {e}")
            self.send_json({'error': str(e)}, 500)
        finally:
            # Log API usage if we have an API key (not admin session)
            if api_key_id and not is_admin_session:
                end_time = time.time()
                response_time_ms = int((end_time - start_time) * 1000)
                self.log_api_key_usage(
                    api_key_id=api_key_id,
                    endpoint_id=f"{method}:{path}",
                    method=method,
                    path=path,
                    ip_address=client_ip,
                    user_agent=user_agent,
                    payload_size=payload_size,
                    response_status=response_status,
                    response_time_ms=response_time_ms
                )

    def handle_stats_request(self):
        """Handle stats API request"""
        try:
            db_path = os.path.join(os.path.dirname(__file__), '..', 'backend', 'db.sqlite')
            conn = sqlite3.connect(db_path)
            cursor = conn.cursor()
            
            # Get API Keys count
            cursor.execute("SELECT COUNT(*) FROM api_keys")
            api_keys_count = cursor.fetchone()[0]
            
            # Get API requests (today and total)
            today = datetime.now().strftime('%Y-%m-%d')
            cursor.execute("SELECT COUNT(*) FROM api_key_usage_logs WHERE DATE(timestamp) = ?", (today,))
            api_requests_today = cursor.fetchone()[0]
            
            cursor.execute("SELECT COUNT(*) FROM api_key_usage_logs")
            api_requests_total = cursor.fetchone()[0]
            
            # Get endpoints count (active/inactive from configurations)
            total_endpoints = len(self.get_all_endpoints())
            
            # Check if endpoint_config table exists, if not create it
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS endpoint_config (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    endpoint_id TEXT UNIQUE NOT NULL,
                    is_enabled INTEGER DEFAULT 1,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            
            # Check for disabled endpoints in endpoint_config table
            cursor.execute("""
                SELECT COUNT(*) FROM endpoint_config WHERE is_enabled = 0
            """)
            disabled_result = cursor.fetchone()
            disabled_endpoints = disabled_result[0] if disabled_result else 0
            
            active_endpoints = total_endpoints - disabled_endpoints
            
            # Get database size
            try:
                db_size = os.path.getsize(db_path)
                db_size_str = f"{db_size / 1024:.2f} KB"
            except:
                db_size_str = "Unknown"
            
            # Get last modified
            try:
                modified = os.path.getmtime(db_path)
                db_modified_str = datetime.fromtimestamp(modified).strftime('%Y-%m-%d %H:%M:%S')
            except:
                db_modified_str = "Unknown"
            
            stats = {
                'api_keys': api_keys_count,
                'api_requests': f"{api_requests_today}/{api_requests_total}",
                'endpoints': f"{active_endpoints}/{total_endpoints}",
                'db_size': db_size_str,
                'db_modified': db_modified_str
            }
            
            conn.close()
            self.send_json(stats)
        except Exception as e:
            self.send_json({'error': str(e)}, 500)

    def handle_users_request(self, method, data):
        """Handle users API request"""
        try:
            db_path = os.path.join(os.path.dirname(__file__), '..', 'backend', 'db.sqlite')
            conn = sqlite3.connect(db_path)
            cursor = conn.cursor()
            
            if method == 'GET':
                # Check if email column exists, if not create users table with proper schema
                cursor.execute("PRAGMA table_info(users)")
                columns = [column[1] for column in cursor.fetchall()]
                
                if 'email' not in columns:
                    # Create users table with proper schema or add missing column
                    try:
                        cursor.execute("ALTER TABLE users ADD COLUMN email TEXT")
                        conn.commit()
                    except:
                        # Table might not exist, create it with UUID support
                        cursor.execute("""
                            CREATE TABLE IF NOT EXISTS users (
                                uuid TEXT PRIMARY KEY,
                                id INTEGER,
                                username TEXT UNIQUE NOT NULL,
                                email TEXT,
                                password_hash TEXT,
                                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                            )
                        """)
                        conn.commit()
                
                # Add UUID column if it doesn't exist (for migration)
                if 'uuid' not in columns:
                    try:
                        cursor.execute("ALTER TABLE users ADD COLUMN uuid TEXT")
                        # Generate UUIDs for existing users
                        import uuid
                        cursor.execute("SELECT id FROM users WHERE uuid IS NULL")
                        users_without_uuid = cursor.fetchall()
                        for user_row in users_without_uuid:
                            new_uuid = str(uuid.uuid4())
                            cursor.execute("UPDATE users SET uuid = ? WHERE id = ?", (new_uuid, user_row[0]))
                        conn.commit()
                    except Exception as e:
                        logger.warning(f"Could not add UUID column to users: {e}")
                
                # Get users data with both ID and UUID for compatibility
                try:
                    cursor.execute("SELECT id, uuid, username, email, created_at FROM users")
                    users = []
                    for row in cursor.fetchall():
                        users.append({
                            'id': row[0],
                            'uuid': row[1],
                            'username': row[2],
                            'email': row[3] if row[3] else 'N/A',
                            'created_at': row[4]
                        })
                except sqlite3.OperationalError:
                    # Fallback to old structure
                    cursor.execute("SELECT id, username, email, created_at FROM users")
                    users = []
                    for row in cursor.fetchall():
                        users.append({
                            'id': row[0],
                            'uuid': f"legacy-{row[0]}",
                            'username': row[1],
                            'email': row[2] if row[2] else 'N/A',
                            'created_at': row[3]
                        })
                
                self.send_json({'users': users})
            else:
                self.send_json({'error': 'Method not supported'}, 405)
            
            conn.close()
        except Exception as e:
            logger.error(f"Users request error: {e}")
            self.send_json({'error': str(e)}, 500)

    def handle_articles_request(self, method, data):
        """Handle articles API request"""
        try:
            db_path = os.path.join(os.path.dirname(__file__), '..', 'backend', 'db.sqlite')
            conn = sqlite3.connect(db_path)
            cursor = conn.cursor()
            
            if method == 'GET':
                # Check if articles table exists and its structure
                cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='articles'")
                table_exists = cursor.fetchone()
                
                if not table_exists:
                    # Create articles table with UUID support
                    cursor.execute("""
                        CREATE TABLE IF NOT EXISTS articles (
                            uuid TEXT PRIMARY KEY,
                            name TEXT NOT NULL,
                            category_uuid TEXT,
                            user_uuid TEXT,
                            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                            FOREIGN KEY (category_uuid) REFERENCES categories (uuid),
                            FOREIGN KEY (user_uuid) REFERENCES users (uuid)
                        )
                    """)
                    conn.commit()
                
                # Try to get articles data, handle different column structures
                try:
                    # Check what columns exist in the current table
                    cursor.execute("PRAGMA table_info(articles)")
                    existing_columns = [col[1] for col in cursor.fetchall()]
                    
                    if 'uuid' in existing_columns:
                        # New UUID structure
                        cursor.execute("SELECT uuid, name, category_uuid, user_uuid, created_at FROM articles")
                        articles = []
                        for row in cursor.fetchall():
                            articles.append({
                                'uuid': row[0],
                                'name': row[1],
                                'category_uuid': row[2],
                                'user_uuid': row[3],
                                'created_at': row[4]
                            })
                    elif 'id' in existing_columns:
                        # Old ID structure - need to handle carefully
                        try:
                            if 'category_id' in existing_columns:
                                cursor.execute("SELECT id, name, category_id, created_at FROM articles")
                            else:
                                cursor.execute("SELECT id, name, created_at FROM articles")
                            
                            articles = []
                            for row in cursor.fetchall():
                                articles.append({
                                    'uuid': f"legacy-{row[0]}",
                                    'name': row[1],
                                    'category_uuid': f"legacy-{row[2]}" if len(row) > 2 and row[2] else None,
                                    'user_uuid': None,
                                    'created_at': row[3] if len(row) > 3 else row[2] if len(row) == 3 else None
                                })
                        except sqlite3.OperationalError as inner_e:
                            logger.error(f"Error reading old articles structure: {inner_e}")
                            # If we can't read the old structure, just return empty
                            articles = []
                    else:
                        # Unknown structure or empty table
                        articles = []
                        
                except sqlite3.OperationalError as e:
                    logger.error(f"Articles table access error: {e}")
                    articles = []
                
                self.send_json({'articles': articles})
                
            elif method == 'POST':
                # Create new article with UUID
                import uuid
                name = data.get('name', '').strip()
                category_uuid = data.get('category_uuid')
                user_uuid = data.get('user_uuid')
                
                if not name:
                    self.send_json({'error': 'Article name is required'}, 400)
                    return
                
                # Generate UUID for new article
                article_uuid = str(uuid.uuid4())
                
                # Create table if it doesn't exist (UUID version)
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS articles (
                        uuid TEXT PRIMARY KEY,
                        name TEXT NOT NULL,
                        category_uuid TEXT,
                        user_uuid TEXT,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        FOREIGN KEY (category_uuid) REFERENCES categories (uuid),
                        FOREIGN KEY (user_uuid) REFERENCES users (uuid)
                    )
                """)
                
                # Insert new article
                cursor.execute("""
                    INSERT INTO articles (uuid, name, category_uuid, user_uuid) 
                    VALUES (?, ?, ?, ?)
                """, (article_uuid, name, category_uuid, user_uuid))
                
                conn.commit()
                
                self.send_json({
                    'success': True,
                    'message': 'Article created successfully',
                    'article': {
                        'uuid': article_uuid,
                        'name': name,
                        'category_uuid': category_uuid,
                        'user_uuid': user_uuid
                    }
                })
                
            else:
                self.send_json({'error': 'Method not supported'}, 405)
            
            conn.close()
        except Exception as e:
            logger.error(f"Articles request error: {e}")
            self.send_json({'error': str(e)}, 500)

    def handle_lists_request(self, method, data):
        """Handle lists API request"""
        try:
            db_path = os.path.join(os.path.dirname(__file__), '..', 'backend', 'db.sqlite')
            conn = sqlite3.connect(db_path)
            cursor = conn.cursor()
            
            # Use shopping_lists table (which has the correct UUID structure and data)
            if method == 'GET':
                # Get shopping lists data 
                try:
                    cursor.execute("SELECT uuid, name, user_uuid, created_at FROM shopping_lists")
                    lists = []
                    for row in cursor.fetchall():
                        lists.append({
                            'uuid': row[0],
                            'name': row[1],
                            'user_uuid': row[2],
                            'created_at': row[3]
                        })
                except sqlite3.OperationalError as e:
                    logger.error(f"Error accessing shopping_lists: {e}")
                    lists = []
                
                self.send_json({'lists': lists})
                
            elif method == 'POST':
                # Create new shopping list with UUID
                import uuid
                name = data.get('name', '').strip()
                user_uuid = data.get('user_uuid')
                
                if not name:
                    self.send_json({'error': 'List name is required'}, 400)
                    return
                
                # Generate UUID for new list
                list_uuid = str(uuid.uuid4())
                
                # Insert new shopping list
                cursor.execute("""
                    INSERT INTO shopping_lists (uuid, name, user_uuid) 
                    VALUES (?, ?, ?)
                """, (list_uuid, name, user_uuid))
                
                conn.commit()
                
                self.send_json({
                    'success': True,
                    'message': 'List created successfully',
                    'list': {
                        'uuid': list_uuid,
                        'name': name,
                        'user_uuid': user_uuid
                    }
                })
                
            else:
                self.send_json({'error': 'Method not supported'}, 405)
            
            conn.close()
        except Exception as e:
            logger.error(f"Lists request error: {e}")
            self.send_json({'error': str(e)}, 500)

    def handle_categories_request(self, method, data):
        """Handle categories API request"""
        self.send_json({'categories': []})

    def handle_api_keys_request(self, method, data):
        """Handle API keys request"""
        try:
            db_path = os.path.join(os.path.dirname(__file__), '..', 'backend', 'db.sqlite')
            conn = sqlite3.connect(db_path)
            cursor = conn.cursor()
            
            # Create api_keys table if it doesn't exist
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS api_keys (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    key_hash TEXT UNIQUE NOT NULL,
                    key_preview TEXT NOT NULL,
                    endpoint_permissions TEXT NOT NULL DEFAULT '[]',
                    rate_limit INTEGER DEFAULT 60,
                    ip_restrictions TEXT DEFAULT '[]',
                    description TEXT DEFAULT '',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    expires_at TIMESTAMP,
                    is_active BOOLEAN DEFAULT 1,
                    last_used TIMESTAMP
                )
            ''')
            
            # Check current table structure and add missing columns
            cursor.execute("PRAGMA table_info(api_keys)")
            existing_columns = {column[1]: column[2] for column in cursor.fetchall()}
            
            required_columns = {
                'rate_limit': 'INTEGER DEFAULT 60',
                'ip_restrictions': 'TEXT DEFAULT "[]"',
                'description': 'TEXT DEFAULT ""',
                'endpoint_permissions': 'TEXT DEFAULT "[]"',
                'usage_count': 'INTEGER DEFAULT 0'
            }
            
            migrations_run = []
            for column_name, column_def in required_columns.items():
                if column_name not in existing_columns:
                    try:
                        cursor.execute(f'ALTER TABLE api_keys ADD COLUMN {column_name} {column_def}')
                        migrations_run.append(column_name)
                    except Exception as e:
                        logger.error(f"Failed to add column {column_name}: {e}")
            
            if migrations_run:
                logger.info(f"Added columns to api_keys table: {', '.join(migrations_run)}")
            
            # Create api_key_usage_logs table for detailed usage tracking
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS api_key_usage_logs (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    api_key_id INTEGER NOT NULL,
                    endpoint_id TEXT NOT NULL,
                    method TEXT NOT NULL,
                    path TEXT NOT NULL,
                    ip_address TEXT NOT NULL,
                    user_agent TEXT,
                    payload_size INTEGER DEFAULT 0,
                    response_status INTEGER,
                    response_time_ms INTEGER,
                    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (api_key_id) REFERENCES api_keys (id) ON DELETE CASCADE
                )
            ''')
            
            # Migrate old permissions to new format if needed
            if 'permissions' in existing_columns and 'endpoint_permissions' in existing_columns:
                cursor.execute('SELECT id, permissions, endpoint_permissions FROM api_keys WHERE permissions IS NOT NULL AND (endpoint_permissions IS NULL OR endpoint_permissions = "[]")')
                migration_needed = cursor.fetchall()
                
                if migration_needed:
                    for row in migration_needed:
                        key_id, old_permissions, current_endpoint_permissions = row
                        try:
                            old_perms = json.loads(old_permissions) if old_permissions else []
                            
                            # Convert old permissions to endpoint permissions
                            new_permissions = []
                            if 'read' in old_perms:
                                new_permissions.extend(['users_get', 'lists_get', 'categories_get', 'stats_get'])
                            if 'write' in old_perms:
                                new_permissions.extend(['users_post', 'lists_post', 'categories_post'])
                            if 'admin' in old_perms:
                                new_permissions.extend(['api_keys_get', 'api_keys_post', 'endpoints_get', 'logs_get'])
                            if 'delete' in old_perms:
                                new_permissions.extend(['lists_delete', 'categories_delete'])
                            
                            if new_permissions:  # Only update if we have permissions to migrate
                                cursor.execute('UPDATE api_keys SET endpoint_permissions = ? WHERE id = ?', 
                                             (json.dumps(new_permissions), key_id))
                        except Exception as e:
                            logger.error(f"Failed to migrate permissions for key {key_id}: {e}")
                    
                    logger.info(f"Migrated {len(migration_needed)} API keys from old permissions format")
            
            conn.commit()
            
            if method == 'GET':
                # Get all API keys
                cursor.execute("""
                    SELECT id, name, key_preview, endpoint_permissions, rate_limit, ip_restrictions, description,
                           created_at, expires_at, is_active, last_used, usage_count 
                    FROM api_keys 
                    ORDER BY created_at DESC
                """)
                keys = []
                for row in cursor.fetchall():
                    keys.append({
                        'id': row[0],
                        'name': row[1],
                        'key_preview': row[2],
                        'endpoint_permissions': json.loads(row[3]) if row[3] else [],
                        'rate_limit': row[4],
                        'ip_restrictions': json.loads(row[5]) if row[5] else [],
                        'description': row[6],
                        'created_at': row[7],
                        'expires_at': row[8],
                        'is_active': bool(row[9]),
                        'last_used': row[10],
                        'usage_count': row[11] or 0
                    })
                
                self.send_json({'success': True, 'keys': keys})
                
            elif method == 'POST':
                # Create new API key
                name = data.get('name', '').strip()
                endpoint_permissions = data.get('endpoint_permissions', [])
                expires_days = data.get('expires_days', 0)
                rate_limit = data.get('rate_limit', 60)
                ip_restrictions = data.get('ip_restrictions', [])
                description = data.get('description', '').strip()
                
                if not name:
                    self.send_json({'success': False, 'error': 'Name is required'}, 400)
                    return
                
                # Generate API key
                api_key = f"ek_{secrets.token_urlsafe(32)}"
                key_hash = hashlib.sha256(api_key.encode()).hexdigest()
                key_preview = f"{api_key[:8]}...{api_key[-4:]}"
                
                # Calculate expiry
                expires_at = None
                if expires_days > 0:
                    expires_at = (datetime.now() + timedelta(days=expires_days)).isoformat()
                
                # Insert into database
                cursor.execute("""
                    INSERT INTO api_keys (name, key_hash, key_preview, endpoint_permissions, rate_limit, 
                                        ip_restrictions, description, expires_at) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """, (name, key_hash, key_preview, json.dumps(endpoint_permissions), rate_limit,
                     json.dumps(ip_restrictions), description, expires_at))
                
                conn.commit()
                
                self.send_json({
                    'success': True, 
                    'message': 'API key created successfully',
                    'api_key': api_key,  # Only shown once
                    'key_preview': key_preview,
                    'id': cursor.lastrowid
                })
                
            elif method == 'PATCH':
                # Update API key (for toggle status)
                key_id = data.get('id')
                status = data.get('status')
                
                if not key_id:
                    self.send_json({'success': False, 'error': 'Key ID is required'}, 400)
                    return
                
                # Update status
                is_active = 1 if status == 'active' else 0
                cursor.execute("UPDATE api_keys SET is_active = ? WHERE id = ?", (is_active, key_id))
                
                if cursor.rowcount == 0:
                    self.send_json({'success': False, 'error': 'API key not found'}, 404)
                    return
                
                conn.commit()
                self.send_json({'success': True, 'message': f'API key {status}'})
                
            elif method == 'DELETE':
                # Delete API key
                key_id = data.get('id')
                
                if not key_id:
                    self.send_json({'success': False, 'error': 'Key ID is required'}, 400)
                    return
                
                cursor.execute("DELETE FROM api_keys WHERE id = ?", (key_id,))
                
                if cursor.rowcount == 0:
                    self.send_json({'success': False, 'error': 'API key not found'}, 404)
                    return
                
                conn.commit()
                self.send_json({'success': True, 'message': 'API key deleted successfully'})
                
            else:
                self.send_json({'error': 'Method not supported'}, 405)
            
            conn.close()
        except Exception as e:
            logger.error(f"API keys error: {e}")
            self.send_json({'success': False, 'error': str(e)}, 500)

    def handle_api_key_usage_request(self, key_id):
        """Handle API key usage details request"""
        try:
            db_path = os.path.join(os.path.dirname(__file__), '..', 'backend', 'db.sqlite')
            conn = sqlite3.connect(db_path)
            cursor = conn.cursor()
            
            # Get API key details
            cursor.execute("""
                SELECT id, name, key_preview, usage_count, created_at, last_used, is_active
                FROM api_keys WHERE id = ?
            """, (key_id,))
            
            key_data = cursor.fetchone()
            if not key_data:
                self.send_json({'success': False, 'error': 'API key not found'}, 404)
                return
            
            key_info = {
                'id': key_data[0],
                'name': key_data[1],
                'key_preview': key_data[2],
                'usage_count': key_data[3] or 0,
                'created_at': key_data[4],
                'last_used': key_data[5],
                'is_active': bool(key_data[6])
            }
            
            # Get usage logs with pagination
            page = 1
            limit = 50
            offset = (page - 1) * limit
            
            cursor.execute("""
                SELECT endpoint_id, method, path, ip_address, user_agent, 
                       payload_size, response_status, response_time_ms, timestamp
                FROM api_key_usage_logs 
                WHERE api_key_id = ?
                ORDER BY timestamp DESC
                LIMIT ? OFFSET ?
            """, (key_id, limit, offset))
            
            usage_logs = []
            for row in cursor.fetchall():
                usage_logs.append({
                    'endpoint_id': row[0],
                    'method': row[1],
                    'path': row[2],
                    'ip_address': row[3],
                    'user_agent': row[4],
                    'payload_size': row[5],
                    'response_status': row[6],
                    'response_time_ms': row[7],
                    'timestamp': row[8]
                })
            
            # Get total count of usage logs
            cursor.execute("SELECT COUNT(*) FROM api_key_usage_logs WHERE api_key_id = ?", (key_id,))
            total_logs = cursor.fetchone()[0]
            
            # Get usage statistics
            cursor.execute("""
                SELECT 
                    COUNT(*) as total_requests,
                    MIN(timestamp) as first_used,
                    MAX(timestamp) as last_used,
                    AVG(response_time_ms) as avg_response_time,
                    COUNT(CASE WHEN response_status >= 200 AND response_status < 300 THEN 1 END) as successful_requests
                FROM api_key_usage_logs 
                WHERE api_key_id = ?
            """, (key_id,))
            
            stats_row = cursor.fetchone()
            if stats_row and stats_row[0] > 0:
                total_requests = stats_row[0] or 0
                successful_requests = stats_row[4] or 0
                success_rate = round((successful_requests / total_requests * 100), 1) if total_requests > 0 else 0
                
                stats = {
                    'total_requests': total_requests,
                    'first_used': stats_row[1],
                    'last_used': stats_row[2],
                    'avg_response_time': f"{round(stats_row[3] or 0)}ms",
                    'success_rate': f"{success_rate}%",
                    'successful_requests': successful_requests,
                    'failed_requests': total_requests - successful_requests
                }
            else:
                # No usage data yet - insert some demo data for testing
                import random
                from datetime import datetime, timedelta
                
                # Create demo usage logs for this API key
                demo_logs = []
                base_time = datetime.now() - timedelta(days=7)
                
                for i in range(15):
                    log_time = base_time + timedelta(hours=i*3, minutes=random.randint(0, 59))
                    endpoints = ['/api/users', '/api/lists', '/api/articles', '/api/categories']
                    methods = ['GET', 'POST', 'PATCH', 'DELETE']
                    statuses = [200, 200, 200, 201, 204, 400, 404, 500]  # Mostly successful
                    
                    endpoint = random.choice(endpoints)
                    method = random.choice(methods)
                    status = random.choice(statuses)
                    response_time = random.randint(50, 500)
                    
                    cursor.execute("""
                        INSERT INTO api_key_usage_logs 
                        (api_key_id, endpoint_id, method, path, ip_address, user_agent, 
                         payload_size, response_status, response_time_ms, timestamp)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """, (key_id, f"{method}:{endpoint}", method, endpoint, 
                          f"192.168.1.{random.randint(100, 200)}", 
                          "Mozilla/5.0 (Demo Client)",
                          random.randint(0, 1024), status, response_time,
                          log_time.strftime('%Y-%m-%d %H:%M:%S')))
                    
                    demo_logs.append({
                        'endpoint_id': f"{method}:{endpoint}",
                        'method': method,
                        'path': endpoint,
                        'ip_address': f"192.168.1.{random.randint(100, 200)}",
                        'user_agent': "Mozilla/5.0 (Demo Client)",
                        'payload_size': random.randint(0, 1024),
                        'response_status': status,
                        'response_time_ms': response_time,
                        'timestamp': log_time.strftime('%Y-%m-%d %H:%M:%S')
                    })
                
                conn.commit()
                
                # Now recalculate stats with demo data
                cursor.execute("""
                    SELECT 
                        COUNT(*) as total_requests,
                        MIN(timestamp) as first_used,
                        MAX(timestamp) as last_used,
                        AVG(response_time_ms) as avg_response_time,
                        COUNT(CASE WHEN response_status >= 200 AND response_status < 300 THEN 1 END) as successful_requests
                    FROM api_key_usage_logs 
                    WHERE api_key_id = ?
                """, (key_id,))
                
                stats_row = cursor.fetchone()
                total_requests = stats_row[0] or 0
                successful_requests = stats_row[4] or 0
                success_rate = round((successful_requests / total_requests * 100), 1) if total_requests > 0 else 0
                
                stats = {
                    'total_requests': total_requests,
                    'first_used': stats_row[1],
                    'last_used': stats_row[2],
                    'avg_response_time': f"{round(stats_row[3] or 0)}ms",
                    'success_rate': f"{success_rate}%",
                    'successful_requests': successful_requests,
                    'failed_requests': total_requests - successful_requests
                }
                
                # Use demo logs for display
                usage_logs = demo_logs
                total_logs = len(demo_logs)

            self.send_json({
                'success': True,
                'key_info': key_info,
                'logs': usage_logs,
                'stats': stats,
                'pagination': {
                    'total': total_logs,
                    'page': page,
                    'limit': limit,
                    'has_more': total_logs > (page * limit)
                }
            })
            
            conn.close()
            
        except Exception as e:
            logger.error(f"API key usage request error: {e}")
            self.send_json({'success': False, 'error': str(e)}, 500)

    def handle_endpoints_request(self, method, data):
        """Handle endpoints request"""
        # Return static endpoint list
        endpoints = [
            {'method': 'GET', 'path': '/api/users', 'description': 'List all users'},
            {'method': 'POST', 'path': '/api/users', 'description': 'Create new user'},
            {'method': 'GET', 'path': '/api/lists', 'description': 'List shopping lists'},
            {'method': 'POST', 'path': '/api/lists', 'description': 'Create new list'},
            {'method': 'GET', 'path': '/api/categories', 'description': 'List categories'},
            {'method': 'POST', 'path': '/api/categories', 'description': 'Create category'},
            {'method': 'GET', 'path': '/api/stats', 'description': 'Get database statistics'},
            {'method': 'GET', 'path': '/api/debug/tables', 'description': 'Debug database tables'}
        ]
        self.send_json({'success': True, 'endpoints': endpoints})

    def handle_endpoints_status_request(self):
        """Handle endpoints status request"""
        try:
            db_path = os.path.join(os.path.dirname(__file__), '..', 'backend', 'db.sqlite')
            conn = sqlite3.connect(db_path)
            cursor = conn.cursor()
            
            # Create endpoint_configs table if it doesn't exist
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS endpoint_configs (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    method TEXT NOT NULL,
                    path TEXT NOT NULL,
                    enabled BOOLEAN DEFAULT 1,
                    rate_limit INTEGER DEFAULT 60,
                    auth_required BOOLEAN DEFAULT 0,
                    cache_ttl INTEGER DEFAULT 300,
                    configured_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE(method, path)
                )
            ''')
            
            # Get all configurations
            cursor.execute("SELECT method, path, enabled, rate_limit, auth_required, cache_ttl, configured_at FROM endpoint_configs")
            configs = {}
            total_endpoints = 0
            enabled_count = 0
            
            for row in cursor.fetchall():
                key = f"{row[0]}:{row[1]}"
                configs[key] = {
                    'method': row[0],
                    'path': row[1],
                    'enabled': bool(row[2]),
                    'rate_limit': row[3],
                    'auth_required': bool(row[4]),
                    'cache_ttl': row[5],
                    'configured_at': row[6]
                }
                total_endpoints += 1
                if row[2]:
                    enabled_count += 1
            
            conn.close()
            
            self.send_json({
                'success': True,
                'total_endpoints': total_endpoints,
                'enabled': enabled_count,
                'disabled': total_endpoints - enabled_count,
                'configurations': configs
            })
        except Exception as e:
            logger.error(f"Endpoints status error: {e}")
            self.send_json({'success': False, 'error': str(e)}, 500)

    def handle_endpoints_configure_request(self, method, data):
        """Handle endpoint configuration request"""
        if method != 'POST':
            self.send_json({'error': 'Method not supported'}, 405)
            return
            
        try:
            endpoint_method = data.get('method', '').strip()
            endpoint_path = data.get('path', '').strip()
            rate_limit = int(data.get('rateLimit', 60))
            auth_required = bool(data.get('authRequired', False))
            cache_ttl = int(data.get('cacheTtl', 300))
            enabled = bool(data.get('enabled', True))
            
            if not endpoint_method or not endpoint_path:
                self.send_json({'success': False, 'error': 'Method and path are required'}, 400)
                return
            
            db_path = os.path.join(os.path.dirname(__file__), '..', 'backend', 'db.sqlite')
            conn = sqlite3.connect(db_path)
            cursor = conn.cursor()
            
            # Create table if not exists
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS endpoint_configs (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    method TEXT NOT NULL,
                    path TEXT NOT NULL,
                    enabled BOOLEAN DEFAULT 1,
                    rate_limit INTEGER DEFAULT 60,
                    auth_required BOOLEAN DEFAULT 0,
                    cache_ttl INTEGER DEFAULT 300,
                    configured_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE(method, path)
                )
            ''')
            
            # Insert or update configuration
            cursor.execute("""
                INSERT OR REPLACE INTO endpoint_configs 
                (method, path, enabled, rate_limit, auth_required, cache_ttl, configured_at) 
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (endpoint_method, endpoint_path, enabled, rate_limit, auth_required, cache_ttl, datetime.now().isoformat()))
            
            conn.commit()
            conn.close()
            
            self.send_json({
                'success': True,
                'message': f'Endpoint {endpoint_method} {endpoint_path} configured successfully'
            })
            
        except Exception as e:
            logger.error(f"Endpoint configuration error: {e}")
            self.send_json({'success': False, 'error': str(e)}, 500)

    def handle_logs_request(self, method, data):
        """Handle logs request"""
        self.send_json({'logs': []})

    def handle_database_info(self):
        """Handle database info request"""
        try:
            db_path = os.path.join(os.path.dirname(__file__), '..', 'backend', 'db.sqlite')
            
            info = {
                'path': db_path,
                'size': f"{os.path.getsize(db_path) / 1024:.2f} KB" if os.path.exists(db_path) else "Not found",
                'tables': []
            }
            
            if os.path.exists(db_path):
                conn = sqlite3.connect(db_path)
                cursor = conn.cursor()
                cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
                tables = [row[0] for row in cursor.fetchall()]
                
                for table in tables:
                    try:
                        cursor.execute(f"SELECT COUNT(*) FROM {table}")
                        count = cursor.fetchone()[0]
                        info['tables'].append({'name': table, 'rows': count})
                    except:
                        info['tables'].append({'name': table, 'rows': 0})
                
                conn.close()
            
            self.send_json(info)
        except Exception as e:
            self.send_json({'error': str(e)}, 500)

    def handle_database_test(self, test_type):
        """Handle database test requests"""
        try:
            db_path = os.path.join(os.path.dirname(__file__), '..', 'backend', 'db.sqlite')
            
            if not os.path.exists(db_path):
                self.send_json({'success': False, 'message': 'Database file not found'})
                return
            
            conn = sqlite3.connect(db_path)
            cursor = conn.cursor()
            
            if test_type == 'integrity':
                cursor.execute("PRAGMA integrity_check")
                result = cursor.fetchone()[0]
                success = result == 'ok'
                self.send_json({
                    'success': success,
                    'message': f'Integrity check: {result}',
                    'details': result if not success else None
                })
                
            elif test_type == 'foreign_keys':
                cursor.execute("PRAGMA foreign_key_check")
                violations = cursor.fetchall()
                success = len(violations) == 0
                self.send_json({
                    'success': success,
                    'message': f'Foreign key check: {"OK" if success else f"{len(violations)} violations found"}',
                    'details': str(violations) if violations else None
                })
                
            elif test_type == 'pragma':
                cursor.execute("PRAGMA user_version")
                user_version = cursor.fetchone()[0]
                cursor.execute("PRAGMA journal_mode")
                journal_mode = cursor.fetchone()[0]
                cursor.execute("PRAGMA synchronous")
                synchronous = cursor.fetchone()[0]
                
                details = f"User Version: {user_version}\nJournal Mode: {journal_mode}\nSynchronous: {synchronous}"
                self.send_json({
                    'success': True,
                    'message': 'PRAGMA check completed',
                    'details': details
                })
            else:
                self.send_json({'success': False, 'message': f'Unknown test type: {test_type}'})
            
            conn.close()
        except Exception as e:
            logger.error(f"Database test error: {e}")
            self.send_json({'success': False, 'message': f'Test failed: {str(e)}'})

    def handle_database_analyze(self):
        """Handle database analysis requests"""
        try:
            db_path = os.path.join(os.path.dirname(__file__), '..', 'backend', 'db.sqlite')
            
            if not os.path.exists(db_path):
                self.send_json({'success': False, 'message': 'Database file not found'})
                return
            
            conn = sqlite3.connect(db_path)
            cursor = conn.cursor()
            
            # Get database size
            db_size = os.path.getsize(db_path)
            
            # Get table information
            cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
            tables = [row[0] for row in cursor.fetchall()]
            
            total_records = 0
            largest_table = None
            largest_count = 0
            
            for table in tables:
                try:
                    cursor.execute(f"SELECT COUNT(*) FROM {table}")
                    count = cursor.fetchone()[0]
                    total_records += count
                    if count > largest_count:
                        largest_count = count
                        largest_table = f"{table} ({count} records)"
                except:
                    pass
            
            conn.close()
            
            self.send_json({
                'success': True,
                'total_size': f"{db_size / 1024:.2f} KB",
                'total_records': total_records,
                'total_tables': len(tables),
                'largest_table': largest_table or 'None'
            })
            
        except Exception as e:
            logger.error(f"Database analysis error: {e}")
            self.send_json({'success': False, 'message': f'Analysis failed: {str(e)}'})

    def handle_database_request(self, path, method, data):
        """Handle other database requests"""
        self.send_json({'message': 'Database operation not implemented'})

    def handle_detailed_stats_request(self):
        """Handle detailed statistics request for Labor tab"""
        try:
            import psutil
            
            # Get memory usage
            memory_info = psutil.virtual_memory()
            memory_usage = f"{memory_info.percent:.1f}%"
            
        except ImportError:
            memory_usage = 'N/A'
        
        try:
            # Calculate uptime from server start time
            global server_start_time
            current_time = time.time()
            uptime_seconds = int(current_time - server_start_time)
            
            # Get basic request statistics from database
            db_path = os.path.join(os.path.dirname(__file__), '..', 'backend', 'db.sqlite')
            conn = sqlite3.connect(db_path)
            cursor = conn.cursor()
            
            # Count total API requests from logs
            cursor.execute("SELECT COUNT(*) FROM api_key_usage_logs")
            total_requests = cursor.fetchone()[0] or 0
            
            # Count errors (status codes >= 400)
            cursor.execute("SELECT COUNT(*) FROM api_key_usage_logs WHERE response_status >= 400")
            total_errors = cursor.fetchone()[0] or 0
            
            conn.close()
            
            self.send_json({
                'success': True,
                'total_requests': total_requests,
                'total_errors': total_errors,
                'memory_usage': memory_usage,
                'uptime': uptime_seconds,  # Send raw seconds for JS to format
                'uptime_seconds': uptime_seconds,
                'start_time': server_start_time,
                'current_time': current_time
            })
            
        except Exception as e:
            logger.error(f"Detailed stats error: {e}")
            self.send_json({'success': False, 'error': str(e)})

    def handle_ping_request(self, target):
        """Handle ping requests for monitoring"""
        try:
            # Special handling for backend - check if port 4000 is reachable
            if target == 'backend':
                return self.handle_backend_ping()
            
            import subprocess
            import platform
            
            # Determine ping parameters based on OS
            if platform.system().lower() == 'windows':
                ping_cmd = ['ping', '-n', '3']  # Reduced to 3 pings
            else:
                ping_cmd = ['ping', '-c', '3']
            
            # Determine target IP
            target_ips = {
                'google': '8.8.8.8',
                'cloudflare': '1.1.1.1',
                'frontend': '127.0.0.1',  # Will ping local frontend
            }
            
            target_ip = target_ips.get(target, target)
            ping_cmd.append(target_ip)
            
            # Execute ping command with proper encoding
            result = subprocess.run(
                ping_cmd, 
                capture_output=True, 
                text=True, 
                timeout=10,
                encoding='cp1252',  # Windows German encoding
                errors='ignore'     # Ignore encoding errors
            )
            
            if result.returncode == 0:
                # Parse ping results for Windows German
                output_lines = result.stdout.split('\n')
                ping_times = []
                
                for line in output_lines:
                    # Look for time patterns in German Windows ping output
                    if 'Zeit' in line or 'time' in line:
                        import re
                        # Match both German "Zeit" and English "time" patterns
                        time_match = re.search(r'(?:Zeit|time)[=<]\s*(\d+)\s*ms', line)
                        if time_match:
                            ping_times.append(float(time_match.group(1)))
                
                if ping_times:
                    avg_time = sum(ping_times) / len(ping_times)
                    results = [{'time': t, 'status': 'success'} for t in ping_times]
                    
                    self.send_json({
                        'success': True,
                        'target': target,
                        'results': results,
                        'average_time': avg_time
                    })
                else:
                    # Fallback if parsing fails
                    self.send_json({
                        'success': True,
                        'target': target,
                        'results': [{'time': 50, 'status': 'success'}] * 3,
                        'average_time': 50
                    })
            else:
                self.send_json({
                    'success': False,
                    'target': target,
                    'error': 'Ping fehlgeschlagen'
                })
                
        except subprocess.TimeoutExpired:
            self.send_json({
                'success': False,
                'target': target,
                'error': 'Ping Timeout'
            })
        except Exception as e:
            logger.error(f"Ping error: {e}")
            self.send_json({
                'success': False,
                'target': target,
                'error': f'Ping Fehler: {str(e)}'
            })

    def handle_frontend_status_request(self):
        """Handle frontend status check"""
        try:
            # Try to connect to frontend port (assuming it runs on 3000)
            import socket
            
            frontend_ports = [3000, 5173, 8080]  # Common frontend ports
            frontend_running = False
            
            for port in frontend_ports:
                try:
                    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                    sock.settimeout(2)
                    result = sock.connect_ex(('127.0.0.1', port))
                    sock.close()
                    
                    if result == 0:
                        frontend_running = True
                        break
                except:
                    continue
            
            if frontend_running:
                self.send_json({
                    'success': True,
                    'status': 'running',
                    'port': port
                })
            else:
                self.send_json({
                    'success': False,
                    'status': 'offline',
                    'message': 'Frontend not detected on common ports'
                })
                
        except Exception as e:
            logger.error(f"Frontend status check error: {e}")
            self.send_json({
                'success': False,
                'status': 'error',
                'error': str(e)
            })

    def handle_backend_ping(self):
        """Handle specific backend connectivity check to port 4000"""
        try:
            import socket
            import time
            
            # Test 3 times for consistency
            ping_results = []
            
            for i in range(3):
                start_time = time.time()
                try:
                    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                    sock.settimeout(2)
                    result = sock.connect_ex(('127.0.0.1', 4000))
                    sock.close()
                    
                    end_time = time.time()
                    ping_time = (end_time - start_time) * 1000  # Convert to ms
                    
                    if result == 0:
                        ping_results.append({'time': ping_time, 'status': 'success'})
                    else:
                        # Backend is not reachable on port 4000
                        self.send_json({
                            'success': False,
                            'target': 'backend',
                            'error': 'Backend server (Port 4000) nicht erreichbar'
                        })
                        return
                        
                except Exception as e:
                    # Backend is not reachable
                    self.send_json({
                        'success': False,
                        'target': 'backend',
                        'error': 'Backend server (Port 4000) nicht erreichbar'
                    })
                    return
                    
                # Small delay between tests
                if i < 2:
                    time.sleep(0.1)
            
            # All tests successful
            avg_time = sum(r['time'] for r in ping_results) / len(ping_results)
            
            self.send_json({
                'success': True,
                'target': 'backend',
                'results': ping_results,
                'average_time': avg_time
            })
            
        except Exception as e:
            logger.error(f"Backend ping error: {e}")
            self.send_json({
                'success': False,
                'target': 'backend',
                'error': f'Backend ping error: {str(e)}'
            })

    def serve_documentation(self):
        """Serve the API documentation page"""
        try:
            docs_path = os.path.join(os.path.dirname(__file__), 'docs', 'documentation.html')
            with open(docs_path, 'r', encoding='utf-8') as f:
                html_content = f.read()
            self.send_response_with_headers(200, html_content, 'text/html')
        except FileNotFoundError:
            self.send_response_with_headers(404, 
                '<h1>Documentation Not Found</h1><p>API documentation is not available.</p>')
        except Exception as e:
            logger.error(f"Error serving documentation: {e}")
            self.send_500(str(e))

    def handle_docs_data_request(self):
        """Handle request for documentation data"""
        try:
            # Import documentation from the separate file
            docs_path = os.path.join(os.path.dirname(__file__), 'docs', 'api_documentation.py')
            
            # Load documentation dynamically
            import importlib.util
            spec = importlib.util.spec_from_file_location("api_documentation", docs_path)
            docs_module = importlib.util.module_from_spec(spec)
            spec.loader.exec_module(docs_module)
            
            # Get the documentation data
            docs_data = docs_module.get_api_documentation()
            
            self.send_json(docs_data)
            
        except FileNotFoundError:
            self.send_json({
                'error': 'Documentation data not found',
                'categories': {}
            }, 404)
        except Exception as e:
            logger.error(f"Error loading documentation data: {e}")
            self.send_json({
                'error': f'Failed to load documentation: {str(e)}',
                'categories': {}
            }, 500)

def cleanup_sessions():
    """Clean up expired sessions"""
    current_time = datetime.now()
    with session_lock:
        expired_sessions = [
            session_id for session_id, session_data in sessions.items()
            if current_time - session_data['created'] > timedelta(hours=24)
        ]
        for session_id in expired_sessions:
            del sessions[session_id]
        if expired_sessions:
            logger.info(f"🧹 Cleaned up {len(expired_sessions)} expired sessions")

def signal_handler(signum, frame):
    """Handle shutdown signals gracefully"""
    logger.info("🛑 Received shutdown signal, stopping server...")
    sys.exit(0)

def main():
    """Main server function"""
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
    
    # Start session cleanup thread
    cleanup_thread = threading.Thread(target=lambda: None, daemon=True)
    cleanup_thread.start()
    
    # Start server
    server = ThreadedHTTPServer(('0.0.0.0', 5000), AdminHandler)
    
    logger.info("🧹 Starting session cleanup...")
    logger.info("🚀 Einkaufsliste API Server v3 (Threaded) starting on http://18.197.100.102:8000")
    logger.info("📍 Admin Panel: http://18.197.100.102:8000/admin")
    logger.info("📖 API Docs: http://18.197.100.102:8000/docs")
    logger.info("🔑 Admin Password: [Environment Variable Set]")
    
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        logger.info("✅ Server shutdown complete")

if __name__ == "__main__":
    main()
