#!/bin/bash

#NC='\033[0m' # No Color

# FunktionenInstallation Script für Ubuntu 24.04
# Erstellt für Produktionsumgebung mit Auto-Deployment

set -e

# Farben für Output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No    # Admin API mit Trailing Slash
    location /admin/ {
        proxy_pass http://127.0.0.1:5000/admin/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 30;
    }
    
    # API Docs - Direkte Weiterleitung an Python Server
    location /docs {
        proxy_pass http://127.0.0.1:5000/docs;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    } für farbige Ausgaben
print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_header() {
    echo -e "${PURPLE}🚀 $1${NC}"
}

print_step() {
    echo -e "${CYAN}📋 $1${NC}"
}

# Hauptinstallation
main() {
    print_header "EINKAUFSLISTE PRODUKTIONS-INSTALLATION"
    echo -e "${PURPLE}======================================${NC}"
    print_info "Installiere Einkaufsliste auf Ubuntu 24.04 VM"
    print_info "Repository: https://github.com/ochtii/einkaufsliste"
    print_info "Branch: live (für Produktion)"
    echo ""

    # Systemcheck
    print_step "System-Check..."
    if [[ $(lsb_release -rs) != "24.04" ]]; then
        print_warning "Ubuntu Version ist nicht 24.04. Installation wird fortgesetzt..."
    else
        print_success "Ubuntu 24.04 erkannt"
    fi

    # Sudo-Check
    if ! sudo -n true 2>/dev/null; then
        print_info "Sudo-Berechtigung erforderlich. Bitte Passwort eingeben:"
    fi

    # System-Update
    print_step "System-Update wird durchgeführt..."
    sudo apt update -y
    sudo apt upgrade -y
    print_success "System-Update abgeschlossen"

    # Node.js Installation (LTS Version)
    print_step "Node.js wird installiert..."
    if command -v node &> /dev/null; then
        print_info "Node.js bereits installiert: $(node --version)"
    else
        curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
        sudo apt install -y nodejs
        print_success "Node.js installiert: $(node --version)"
    fi

    # Python Installation
    print_step "Python wird installiert..."
    sudo apt install -y python3 python3-pip python3-venv
    print_success "Python installiert: $(python3 --version)"

    # Git Installation
    print_step "Git wird installiert..."
    sudo apt install -y git
    print_success "Git installiert: $(git --version)"

    # PM2 Installation (für Prozess-Management)
    print_step "PM2 wird installiert..."
    if command -v pm2 &> /dev/null; then
        print_info "PM2 bereits installiert: $(pm2 --version)"
    else
        sudo npm install -g pm2
        print_success "PM2 installiert: $(pm2 --version)"
    fi

    # Nginx Installation
    print_step "Nginx wird installiert..."
    sudo apt install -y nginx
    sudo systemctl enable nginx
    sudo systemctl start nginx
    print_success "Nginx installiert und gestartet"

    # UFW Firewall konfigurieren
    print_step "Firewall wird konfiguriert..."
    sudo ufw allow ssh
    sudo ufw allow 'Nginx Full'
    sudo ufw allow 3000  # Frontend
    sudo ufw allow 4000  # Backend
    sudo ufw allow 5000  # API
    sudo ufw --force enable
    print_success "Firewall konfiguriert"

    # Benutzer für Anwendung erstellen
    print_step "Anwendungsbenutzer wird erstellt..."
    if id "einkaufsliste" &>/dev/null; then
        print_info "Benutzer 'einkaufsliste' existiert bereits"
    else
        sudo useradd -m -s /bin/bash einkaufsliste
        sudo usermod -aG sudo einkaufsliste
        print_success "Benutzer 'einkaufsliste' erstellt"
    fi

    # SSH-Key für GitHub (falls noch nicht vorhanden)
    print_step "SSH-Konfiguration für GitHub..."
    if [ ! -f /home/einkaufsliste/.ssh/id_rsa ]; then
        sudo -u einkaufsliste ssh-keygen -t rsa -b 4096 -C "einkaufsliste@vm" -f /home/einkaufsliste/.ssh/id_rsa -N ""
        print_success "SSH-Key generiert"
        print_warning "SSH Public Key für GitHub hinzufügen:"
        echo -e "${CYAN}$(sudo cat /home/einkaufsliste/.ssh/id_rsa.pub)${NC}"
        print_info "Füge diesen Key zu GitHub hinzu: https://github.com/settings/ssh/new"
        read -p "Drücke Enter wenn SSH-Key zu GitHub hinzugefügt wurde..."
    else
        print_info "SSH-Key bereits vorhanden"
    fi

    # Repository klonen
    print_step "Repository wird geklont..."
    cd /home/einkaufsliste
    if [ -d "einkaufsliste" ]; then
        print_info "Repository bereits vorhanden. Wird aktualisiert..."
        cd einkaufsliste
        sudo -u einkaufsliste git fetch origin
        sudo -u einkaufsliste git checkout live
        sudo -u einkaufsliste git pull origin live
    else
        sudo -u einkaufsliste git clone -b live git@github.com:ochtii/einkaufsliste.git
        cd einkaufsliste
        print_success "Repository geklont (Branch: live)"
    fi

    # Abhängigkeiten installieren
    print_step "Frontend-Abhängigkeiten werden installiert..."
    cd /home/einkaufsliste/einkaufsliste/frontend
    sudo -u einkaufsliste npm install
    print_success "Frontend-Abhängigkeiten installiert"

    print_step "Backend-Abhängigkeiten werden installiert..."
    cd /home/einkaufsliste/einkaufsliste/backend
    sudo -u einkaufsliste npm install
    print_success "Backend-Abhängigkeiten installiert"

    print_step "API-Abhängigkeiten werden installiert..."
    cd /home/einkaufsliste/einkaufsliste/api
    sudo -u einkaufsliste python3 -m venv venv
    sudo -u einkaufsliste ./venv/bin/pip install -r requirements.txt
    print_success "API-Abhängigkeiten installiert"

    # Build Frontend für Produktion
    print_step "Frontend wird für Produktion gebaut..."
    cd /home/einkaufsliste/einkaufsliste/frontend
    sudo -u einkaufsliste npm run build
    print_success "Frontend-Build erstellt"

    # PM2 Ecosystem Datei erstellen
    print_step "PM2 Konfiguration wird erstellt..."
    cat > /home/einkaufsliste/einkaufsliste/ecosystem.config.js << 'EOF'
module.exports = {
  apps: [
    {
      name: 'einkaufsliste-frontend',
      script: 'npm',
      args: 'start',
      cwd: '/home/einkaufsliste/einkaufsliste/frontend',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      error_file: '/home/einkaufsliste/logs/frontend-error.log',
      out_file: '/home/einkaufsliste/logs/frontend-out.log',
      log_file: '/home/einkaufsliste/logs/frontend.log'
    },
    {
      name: 'einkaufsliste-backend',
      script: 'server.js',
      cwd: '/home/einkaufsliste/einkaufsliste/backend',
      env: {
        NODE_ENV: 'production',
        PORT: 4000
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      error_file: '/home/einkaufsliste/logs/backend-error.log',
      out_file: '/home/einkaufsliste/logs/backend-out.log',
      log_file: '/home/einkaufsliste/logs/backend.log'
    },
    {
      name: 'einkaufsliste-api',
      script: '/home/einkaufsliste/einkaufsliste/api/venv/bin/python',
      args: 'admin_server.py',
      cwd: '/home/einkaufsliste/einkaufsliste/api',
      env: {
        PYTHON_ENV: 'production'
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      error_file: '/home/einkaufsliste/logs/api-error.log',
      out_file: '/home/einkaufsliste/logs/api-out.log',
      log_file: '/home/einkaufsliste/logs/api.log'
    }
  ]
};
EOF
    sudo chown einkaufsliste:einkaufsliste /home/einkaufsliste/einkaufsliste/ecosystem.config.js
    print_success "PM2 Konfiguration erstellt"

    # Log-Verzeichnis erstellen
    print_step "Log-Verzeichnis wird erstellt..."
    sudo -u einkaufsliste mkdir -p /home/einkaufsliste/logs
    print_success "Log-Verzeichnis erstellt"

    # Nginx Konfiguration erstellen
    print_step "Nginx wird konfiguriert..."
    cat > /etc/nginx/sites-available/einkaufsliste << 'EOF'
server {
    listen 80;
    server_name _;  # Ändere dies zu deiner Domain
    
    # Frontend (React) - Catch-all für alle anderen Routen
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
    }
    
    # Backend API - Weiterleitung an Backend Server
    location /api/ {
        proxy_pass http://127.0.0.1:4000/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 30;
    }
    
    # Admin API - Weiterleitung an Python Admin Server
    location /admin {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 30;
    }
    
    # Admin API mit Trailing Slash
    location /admin/ {
        proxy_pass http://127.0.0.1:5000/admin/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_Set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 30;
    }
    
    # API Docs - Direkte Weiterleitung an Python Server
    location /docs {
        proxy_pass http://127.0.0.1:5000/docs;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_Set_header X-Forwarded-Proto $scheme;
    }
    
    # Static files caching
    location /static/ {
        expires 1y;
        add_header Cache-Control "public, immutable";

    sudo ln -sf /etc/nginx/sites-available/einkaufsliste /etc/nginx/sites-enabled/
    sudo rm -f /etc/nginx/sites-enabled/default
    sudo nginx -t
    sudo systemctl reload nginx
    print_success "Nginx konfiguriert"

    # Auto-Deployment Setup
    print_step "Auto-Deployment wird konfiguriert..."
    
    # Deployment Script erstellen
    cat > /home/einkaufsliste/deploy.sh << 'EOF'
#!/bin/bash

# Auto-Deployment Script für Einkaufsliste
# Wird ausgeführt wenn zum 'live' Branch gepusht wird

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

echo "$(date): Auto-Deployment gestartet" >> /home/einkaufsliste/logs/deployment.log

print_info "🚀 Auto-Deployment gestartet..."

cd /home/einkaufsliste/einkaufsliste

# Git Pull
print_info "Repository wird aktualisiert..."
git fetch origin
git reset --hard origin/live
print_success "Repository aktualisiert"

# Abhängigkeiten prüfen und aktualisieren
print_info "Abhängigkeiten werden geprüft..."

# Frontend
cd frontend
if [ package-lock.json -nt node_modules ]; then
    print_info "Frontend-Abhängigkeiten werden aktualisiert..."
    npm install
    print_success "Frontend-Abhängigkeiten aktualisiert"
fi

# Frontend Build
print_info "Frontend wird neu gebaut..."
npm run build
print_success "Frontend Build erstellt"

# Backend
cd ../backend
if [ package-lock.json -nt node_modules ]; then
    print_info "Backend-Abhängigkeiten werden aktualisiert..."
    npm install
    print_success "Backend-Abhängigkeiten aktualisiert"
fi

# API
cd ../api
if [ requirements.txt -nt venv/lib/python*/site-packages ]; then
    print_info "API-Abhängigkeiten werden aktualisiert..."
    ./venv/bin/pip install -r requirements.txt
    print_success "API-Abhängigkeiten aktualisiert"
fi

# Services neu starten
print_info "Services werden neu gestartet..."
pm2 reload ecosystem.config.js
print_success "Services neu gestartet"

print_success "🎉 Auto-Deployment abgeschlossen!"
echo "$(date): Auto-Deployment abgeschlossen" >> /home/einkaufsliste/logs/deployment.log
EOF

    sudo chown einkaufsliste:einkaufsliste /home/einkaufsliste/deploy.sh
    sudo chmod +x /home/einkaufsliste/deploy.sh
    print_success "Deployment-Script erstellt"

    # GitHub Webhook Handler (einfacher HTTP Server)
    cat > /home/einkaufsliste/webhook.py << 'EOF'
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
                        ['/home/einkaufsliste/deploy.sh'],
                        cwd='/home/einkaufsliste',
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
    
    def log_message(self, format, *args):
        print(f"[{self.date_time_string()}] {format % args}")

if __name__ == "__main__":
    with socketserver.TCPServer(("", PORT), WebhookHandler) as httpd:
        print(f"🎣 Webhook Server läuft auf Port {PORT}")
        print(f"📡 Listening for GitHub Webhooks on /webhook")
        httpd.serve_forever()
EOF

    sudo chown einkaufsliste:einkaufsliste /home/einkaufsliste/webhook.py
    sudo chmod +x /home/einkaufsliste/webhook.py
    print_success "Webhook Handler erstellt"

    # PM2 für Webhook Server erweitern
    cat >> /home/einkaufsliste/einkaufsliste/ecosystem.config.js << 'EOF'

// Webhook Server für Auto-Deployment hinzufügen
module.exports.apps.push({
  name: 'einkaufsliste-webhook',
  script: '/home/einkaufsliste/webhook.py',
  cwd: '/home/einkaufsliste',
  interpreter: 'python3',
  env: {
    GITHUB_WEBHOOK_SECRET: 'einkaufsliste-webhook-secret'
  },
  instances: 1,
  autorestart: true,
  watch: false,
  error_file: '/home/einkaufsliste/logs/webhook-error.log',
  out_file: '/home/einkaufsliste/logs/webhook-out.log',
  log_file: '/home/einkaufsliste/logs/webhook.log'
});
EOF
    print_success "Webhook Server zu PM2 hinzugefügt"

    # Firewall für Webhook
    sudo ufw allow 9000
    print_info "Port 9000 für Webhooks geöffnet"

    # Services starten
    print_step "Services werden gestartet..."
    cd /home/einkaufsliste/einkaufsliste
    sudo -u einkaufsliste pm2 start ecosystem.config.js
    sudo -u einkaufsliste pm2 save
    sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u einkaufsliste --hp /home/einkaufsliste
    print_success "Services gestartet und für Autostart konfiguriert"

    # Systemd Service für PM2 aktivieren
    sudo systemctl enable pm2-einkaufsliste
    print_success "PM2 Autostart aktiviert"

    # SSL mit Let's Encrypt (optional)
    print_step "SSL-Zertifikat Setup (optional)..."
    print_info "Für SSL-Zertifikat später ausführen:"
    print_info "sudo apt install certbot python3-certbot-nginx"
    print_info "sudo certbot --nginx -d deine-domain.com"

    # Status anzeigen
    print_step "Service-Status wird geprüft..."
    echo ""
    print_header "🎯 INSTALLATION ABGESCHLOSSEN!"
    echo -e "${GREEN}======================================${NC}"
    print_success "Einkaufsliste erfolgreich installiert!"
    echo ""
    print_info "Services:"
    sudo -u einkaufsliste pm2 list
    echo ""
    print_info "Nginx Status:"
    sudo systemctl status nginx --no-pager -l
    echo ""
    print_info "Anwendung ist erreichbar unter:"
    print_success "🌐 http://18.197.100.102"
    print_success "🌐 http://$(curl -s ifconfig.me || echo '18.197.100.102')"
    echo ""
    print_info "Logs anzeigen:"
    print_info "  sudo -u einkaufsliste pm2 logs"
    print_info "  sudo -u einkaufsliste pm2 logs einkaufsliste-frontend"
    print_info "  sudo -u einkaufsliste pm2 logs einkaufsliste-backend"
    print_info "  sudo -u einkaufsliste pm2 logs einkaufsliste-api"
    print_info "  sudo -u einkaufsliste pm2 logs einkaufsliste-webhook"
    echo ""
    print_warning "🔧 GitHub Webhook konfigurieren:"
    print_info "1. Gehe zu: https://github.com/ochtii/einkaufsliste/settings/hooks"
    print_info "2. Klicke 'Add webhook'"
    print_info "3. Payload URL: http://$(curl -s ifconfig.me || echo 'DEINE-SERVER-IP'):9000/webhook"
    print_info "4. Content type: application/json"
    print_info "5. Secret: einkaufsliste-webhook-secret"
    print_info "6. Events: Just the push event"
    print_info "7. Active: ✅"
    echo ""
    print_success "🚀 Auto-Deployment ist aktiv für Branch 'live'!"
    print_info "Push zu 'live' Branch löst automatisches Deployment aus"
    echo ""
}

# Script ausführen
main "$@"
