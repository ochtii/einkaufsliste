#!/bin/bash

# Quick Service Status and Start

echo "🔍 Service Status Check..."

# PM2 Status
echo "PM2 Prozesse:"
pm2 status

echo ""
echo "🚀 Starte fehlende Services..."

# Backend (Port 4000)
if ! pm2 list | grep -q "backend.*online"; then
    echo "Starte Backend..."
    cd /home/ubuntu/einkaufsliste/backend
    pm2 start "npm start" --name "backend"
    sleep 3
fi

# Frontend (Port 3000)
if ! pm2 list | grep -q "frontend.*online"; then
    echo "Starte Frontend..."
    cd /home/ubuntu/einkaufsliste/frontend
    pm2 start "npm start" --name "frontend"
    sleep 3
fi

# API (Port 5000)
if ! pm2 list | grep -q "api.*online"; then
    echo "Starte API..."
    cd /home/ubuntu/einkaufsliste/api
    pm2 start "python3 admin_server.py" --name "api"
    sleep 3
fi

echo ""
echo "🧪 Teste Services..."

# Test Backend
backend_status=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:4000/api/captcha" 2>/dev/null || echo "000")
echo "Backend (4000): HTTP $backend_status"

# Test API  
api_status=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:5000/api/stats" 2>/dev/null || echo "000")
echo "API (5000): HTTP $api_status"

# Test Frontend
frontend_status=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000" 2>/dev/null || echo "000")
echo "Frontend (3000): HTTP $frontend_status"

echo ""
echo "🌐 Port Status:"
netstat -tlnp | grep -E ':(3000|4000|5000)' | head -10

echo ""
echo "✅ Service Check abgeschlossen!"
