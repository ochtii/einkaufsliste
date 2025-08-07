#!/bin/bash

# API Server Error Diagnose Script

echo "🔍 API Server Error Diagnose..."
echo "================================"

echo "1. 📊 PM2 API Status:"
pm2 info api 2>/dev/null || echo "❌ API Service nicht in PM2 gefunden"

echo ""
echo "2. 📋 Letzte API Logs (PM2):"
pm2 logs api --lines 20 --nostream 2>/dev/null || echo "❌ API Logs nicht verfügbar"

echo ""
echo "3. 📄 Webhook Error Logs:"
if [ -f "/home/einkaufsliste/logs/webhook-error-3.log" ]; then
    echo "Letzte 15 Zeilen von webhook-error-3.log:"
    tail -15 /home/einkaufsliste/logs/webhook-error-3.log
else
    echo "❌ webhook-error-3.log nicht gefunden"
fi

echo ""
echo "4. 🧪 API Endpoint Tests:"

# Test Basis API
echo -n "API Root (http://localhost:5000): "
response=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:5000" 2>/dev/null)
echo "HTTP $response"

# Test problematischen /api/stats Endpoint
echo -n "API Stats (http://localhost:5000/api/stats): "
curl_output=$(curl -s "http://localhost:5000/api/stats" 2>&1)
response=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:5000/api/stats" 2>/dev/null)
echo "HTTP $response"
if [ "$response" = "500" ]; then
    echo "💥 Fehlerdetails:"
    echo "$curl_output" | head -5
fi

# Test Admin Dashboard
echo -n "Admin Dashboard (http://localhost:5000/admin): "
response=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:5000/admin" 2>/dev/null)
echo "HTTP $response"

echo ""
echo "5. 🔍 Prozess-Analyse:"
echo "Python Prozesse auf Port 5000:"
lsof -i :5000 2>/dev/null || echo "❌ Kein Prozess auf Port 5000"

echo ""
echo "6. 📁 API Server Datei-Check:"
if [ -f "/home/einkaufsliste/api/admin_server.py" ]; then
    echo "✅ admin_server.py vorhanden"
    echo "Dateigröße: $(wc -l < /home/einkaufsliste/api/admin_server.py) Zeilen"
else
    echo "❌ admin_server.py nicht gefunden"
fi

if [ -f "/home/einkaufsliste/api/api_admin.sqlite" ]; then
    echo "✅ api_admin.sqlite vorhanden"
    echo "Dateigröße: $(stat -c%s /home/einkaufsliste/api/api_admin.sqlite) Bytes"
else
    echo "❌ api_admin.sqlite nicht gefunden"
fi

echo ""
echo "7. 🛠️ Empfohlene Aktionen:"
echo "   pm2 restart api                    # API neu starten"
echo "   pm2 logs api --lines 50           # Detaillierte Logs"
echo "   python3 /home/einkaufsliste/api/admin_server.py  # Manueller Start"
echo "   curl -v http://localhost:5000/api/stats  # Detaillierter Test"
