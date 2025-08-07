#!/bin/bash

# Quick Service Status Check und Restart

echo "🔍 Überprüfe Service Status..."

# Farben
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

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# 1. PM2 Status überprüfen
print_info "PM2 Status:"
pm2 status

# 2. Services stoppen und neu starten
print_info "Stoppe alle Services..."
pm2 delete all || true

# Kurz warten
sleep 2

# 3. Services einzeln starten
print_info "Starte Backend..."
cd /home/ubuntu/einkaufsliste/backend
pm2 start "npm start" --name "backend"

sleep 3

print_info "Starte Frontend..."
cd /home/ubuntu/einkaufsliste/frontend  
pm2 start "npm start" --name "frontend"

sleep 3

print_info "Starte API..."
cd /home/ubuntu/einkaufsliste/api
pm2 start "python3 admin_server.py" --name "api"

sleep 5

# 4. PM2 Status nach Start
print_info "PM2 Status nach Neustart:"
pm2 status

# 5. Teste Endpoints
print_info "Teste Backend (Port 4000)..."
backend_status=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:4000/api/captcha" 2>/dev/null || echo "000")
if [ "$backend_status" = "200" ]; then
    print_success "Backend läuft (HTTP $backend_status)"
else
    print_error "Backend Problem (HTTP $backend_status)"
    print_info "Backend Logs:"
    pm2 logs backend --lines 5 --nostream || echo "Keine Logs verfügbar"
fi

print_info "Teste API (Port 5000)..."
api_status=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:5000/api/stats" 2>/dev/null || echo "000")
if [ "$api_status" = "200" ]; then
    print_success "API läuft (HTTP $api_status)"
else
    print_error "API Problem (HTTP $api_status)"
    print_info "API Logs:"
    pm2 logs api --lines 5 --nostream || echo "Keine Logs verfügbar"
fi

print_info "Teste Frontend (Port 3000)..."
frontend_status=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000" 2>/dev/null || echo "000")
if [ "$frontend_status" = "200" ]; then
    print_success "Frontend läuft (HTTP $frontend_status)"
else
    print_warning "Frontend Problem (HTTP $frontend_status) - Normal beim ersten Start"
fi

# 6. Teste Registration
print_info "Teste Registration Endpoint..."
captcha_response=$(curl -s "http://localhost:4000/api/captcha" 2>/dev/null)
if [ $? -eq 0 ] && echo "$captcha_response" | grep -q "question"; then
    print_success "CAPTCHA Endpoint funktioniert"
    echo "Response: $captcha_response"
else
    print_error "CAPTCHA Endpoint Problem"
fi

# 7. Zeige Port-Status
print_info "Port Status:"
netstat -tlnp | grep -E ':(3000|4000|5000|9000)' || print_warning "Keine Ports gefunden"

print_success "Service-Check abgeschlossen!"
print_info "Wenn Services nicht laufen, prüfe:"
print_info "1. Dependencies: cd backend && npm install"
print_info "2. Database: Stelle sicher dass db.sqlite existiert"
print_info "3. Logs: pm2 logs [service-name]"
