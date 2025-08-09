#!/bin/bash

# Restart all Einkaufsliste services
echo "🔄 Restarting all Einkaufsliste services..."

# Check if PM2 is available
if ! command -v pm2 &> /dev/null; then
    echo "❌ PM2 is not installed."
    exit 1
fi

# Restart services
echo "🛑 Stopping services..."
pm2 stop ecosystem.config.js 2>/dev/null || echo "⚠️  No services were running"

echo "🚀 Starting services..."
pm2 start ecosystem.config.js

echo "⏳ Waiting for services to restart..."
sleep 5

# Show status
echo "📊 Service Status:"
pm2 status

echo ""
echo "✅ All services restarted!"
echo ""
echo "🌐 Application URLs:"
echo "   Frontend: http://localhost:3000"
echo "   Backend: http://localhost:4000"
echo "   Admin Panel: http://localhost:8000/admin"
