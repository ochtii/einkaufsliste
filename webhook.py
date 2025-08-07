#!/usr/bin/env python3
"""
Simple GitHub Webhook Handler für Auto-Deployment
Lauscht auf Port 9000 für GitHub Webhooks
"""

import http.server
import socketserver
import json
import subprocess
import hmac
import hashlib
import os
import signal
import sys
import time
from urllib.parse import parse_qs

PORT = 9000
WEBHOOK_SECRET = os.environ.get('GITHUB_WEBHOOK_SECRET', 'einkaufsliste-webhook-secret')

class WebhookHandler(http.server.BaseHTTPRequestHandler):
    def do_POST(self):
        if self.path == '/webhook':
            content_length = int(self.headers['Content-Length'])
            body = self.rfile.read(content_length)
            
            # Verify GitHub signature (optional)
            signature_header = self.headers.get('X-Hub-Signature-256')
            if signature_header:
                expected_signature = 'sha256=' + hmac.new(
                    WEBHOOK_SECRET.encode(),
                    body,
                    hashlib.sha256
                ).hexdigest()
                
                if not hmac.compare_digest(signature_header, expected_signature):
                    self.send_response(401)
                    self.end_headers()
                    return
            
            try:
                payload = json.loads(body.decode('utf-8'))
                
                # Check if push to 'live' branch
                if (payload.get('ref') == 'refs/heads/live' and 
                    payload.get('repository', {}).get('name') == 'einkaufsliste'):
                    
                    print(f"✅ Webhook empfangen: Push zu 'live' Branch")
                    
                    # Execute deployment script
                    result = subprocess.run(
                        ['/home/ubuntu/einkaufsliste/deploy.sh'],
                        cwd='/home/ubuntu/einkaufsliste',
                        capture_output=True,
                        text=True
                    )
                    
                    if result.returncode == 0:
                        print("✅ Deployment erfolgreich")
                        self.send_response(200)
                        self.send_header('Content-type', 'application/json')
                        self.end_headers()
                        self.wfile.write(b'{"status": "success", "message": "Deployment completed"}')
                    else:
                        print(f"❌ Deployment fehlgeschlagen: {result.stderr}")
                        self.send_response(500)
                        self.end_headers()
                else:
                    print(f"ℹ️  Webhook ignoriert: Nicht für 'live' Branch")
                    self.send_response(200)
                    self.end_headers()
                    
            except Exception as e:
                print(f"❌ Webhook Fehler: {e}")
                self.send_response(500)
                self.end_headers()
        else:
            self.send_response(404)
            self.end_headers()
    
    def do_GET(self):
        if self.path == '/health':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(b'{"status": "healthy", "service": "webhook"}')
        else:
            self.send_response(404)
            self.end_headers()
    
    def log_message(self, format, *args):
        print(f"[{self.date_time_string()}] {format % args}")

class ReusableTCPServer(socketserver.TCPServer):
    allow_reuse_address = True

def signal_handler(sig, frame):
    print('\n🛑 Webhook Server wird beendet...')
    sys.exit(0)

if __name__ == "__main__":
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
    
    try:
        with ReusableTCPServer(("0.0.0.0", PORT), WebhookHandler) as httpd:
            print(f"🎣 Webhook Server läuft auf Port {PORT}")
            print(f"📡 Listening for GitHub Webhooks on /webhook")
            print(f"💚 Health Check verfügbar auf /health")
            httpd.serve_forever()
    except OSError as e:
        if e.errno == 98:  # Address already in use
            print(f"❌ Port {PORT} bereits belegt. Versuche den Server zu stoppen und neu zu starten...")
            time.sleep(2)
            try:
                with ReusableTCPServer(("0.0.0.0", PORT), WebhookHandler) as httpd:
                    print(f"🎣 Webhook Server läuft auf Port {PORT} (Neustart)")
                    httpd.serve_forever()
            except Exception as e2:
                print(f"❌ Fehler beim Starten des Webhook Servers: {e2}")
                sys.exit(1)
        else:
            print(f"❌ Fehler beim Starten des Webhook Servers: {e}")
            sys.exit(1)
