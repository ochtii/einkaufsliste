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

# Erstelle Log-Verzeichnis falls es nicht existiert
mkdir -p /home/ubuntu/einkaufsliste/logs
echo "$(date): Auto-Deployment gestartet" >> /home/ubuntu/einkaufsliste/logs/deployment.log

print_info "🚀 Auto-Deployment gestartet..."

cd /home/ubuntu/einkaufsliste

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
cd /home/ubuntu/einkaufsliste
pm2 reload ecosystem.config.js
print_success "Services neu gestartet"

print_success "🎉 Auto-Deployment abgeschlossen!"
echo "$(date): Auto-Deployment abgeschlossen" >> /home/ubuntu/einkaufsliste/logs/deployment.log
