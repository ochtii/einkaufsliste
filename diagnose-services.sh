#!/bin/bash

# Einkaufsliste Service Diagnose Script

echo "🔍 Diagnose der Einkaufsliste Services..."
echo "========================================="

# 1. Prüfe PM2 Status
echo "📊 PM2 Status:"
pm2 status

echo ""
echo "🔗 Port Status:"
echo "Frontend (3000):"
lsof -i :3000 2>/dev/null || echo "❌ Port 3000 nicht belegt"

echo "Backend (4000):" 
lsof -i :4000 2>/dev/null || echo "❌ Port 4000 nicht belegt"

echo "API (5000):"
lsof -i :5000 2>/dev/null || echo "❌ Port 5000 nicht belegt"

echo "Webhook (9000):"
lsof -i :9000 2>/dev/null || echo "❌ Port 9000 nicht belegt"

echo ""
echo "🌐 Service Tests:"

# Test Frontend
echo -n "Frontend (http://localhost:3000): "
response=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000" 2>/dev/null)
if [ "$response" = "200" ]; then
    echo "✅ OK (HTTP $response)"
else
    echo "❌ Fehler (HTTP $response)"
fi

# Test Backend
echo -n "Backend (http://localhost:4000/api/health): "
response=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:4000/api/health" 2>/dev/null)
if [ "$response" = "200" ]; then
    echo "✅ OK (HTTP $response)"
else
    echo "❌ Fehler (HTTP $response)"
fi

# Test API
echo -n "API (http://localhost:5000): "
response=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:5000" 2>/dev/null)
if [ "$response" = "200" ]; then
    echo "✅ OK (HTTP $response)"
else
    echo "❌ Fehler (HTTP $response)"
fi

# Test Webhook
echo -n "Webhook (http://localhost:9000/health): "
response=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:9000/health" 2>/dev/null)
if [ "$response" = "200" ]; then
    echo "✅ OK (HTTP $response)"
else
    echo "❌ Fehler (HTTP $response)"
fi

echo ""
echo "📋 PM2 Logs (letzte 20 Zeilen):"
echo "Frontend Logs:"
pm2 logs frontend --lines 5 --nostream 2>/dev/null || echo "❌ Frontend Logs nicht verfügbar"

echo ""
echo "Backend Logs:"
pm2 logs backend --lines 5 --nostream 2>/dev/null || echo "❌ Backend Logs nicht verfügbar"

echo ""
echo "API Logs:"
pm2 logs api --lines 5 --nostream 2>/dev/null || echo "❌ API Logs nicht verfügbar"

echo ""
echo "🔧 Empfohlene Aktionen:"
echo "1. Services starten: pm2 start ecosystem.config.js"
echo "2. Services neu starten: pm2 restart all"
echo "3. Logs prüfen: pm2 logs [service-name]"
echo "4. Nginx Status: sudo systemctl status nginx"
echo "5. Nginx Test: sudo nginx -t"
