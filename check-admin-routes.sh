#!/bin/bash

echo "🔍 Admin Route Analyse:"
echo "========================"

echo "1. Frontend Admin Route:"
echo "   URL: http://ochtii.run.place/dJkL9mN2pQ7rS4tUvWxYz"
echo "   Komponente: Admin.jsx"

echo ""
echo "2. API Admin Server:"
echo "   URL: http://ochtii.run.place:5000"
echo "   Script: admin_server.py"

echo ""
echo "3. Teste Admin Zugriff:"

# Test Frontend Admin Route
echo -n "Frontend Admin Route: "
response=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000/dJkL9mN2pQ7rS4tUvWxYz" 2>/dev/null)
if [ "$response" = "200" ]; then
    echo "✅ OK (HTTP $response)"
else
    echo "❌ Fehler (HTTP $response)"
fi

# Test API Admin Server
echo -n "API Admin Server: "
response=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:5000" 2>/dev/null)
if [ "$response" = "200" ]; then
    echo "✅ OK (HTTP $response)"
else
    echo "❌ Fehler (HTTP $response)"
fi

echo ""
echo "4. Admin Zugangsdaten:"
echo "   Username: admin"
echo "   Password: admin123"

echo ""
echo "5. Direkte Links:"
echo "   Frontend Admin: http://ochtii.run.place/dJkL9mN2pQ7rS4tUvWxYz"
echo "   API Admin:      http://ochtii.run.place:5000"
