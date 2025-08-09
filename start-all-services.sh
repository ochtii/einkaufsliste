#!/bin/bash

# Start all Einkaufsliste services
echo "🚀 Starting all Einkaufsliste services..."

# Check if PM2 is available
if ! command -v pm2 &> /dev/null; then
    echo "❌ PM2 is not installed. Please install PM2 first: npm install -g pm2"
    exit 1
fi

# Check if ecosystem config exists
if [ ! -f "ecosystem.config.js" ]; then
    echo "❌ ecosystem.config.js not found. Please run install.sh first."
    exit 1
fi

# Start services
pm2 start ecosystem.config.js

echo "⏳ Waiting for services to start..."
sleep 5

# Show status
echo "📊 Service Status:"
pm2 status

echo ""
echo "✅ All services started!"
echo ""
echo "🌐 Application URLs:"
echo "   Frontend: http://localhost:3000"
echo "   Backend: http://localhost:4000"
echo "   Admin Panel: http://localhost:5000/admin"
echo ""
echo "📊 Monitor services: pm2 monit"
echo "📋 View logs: pm2 logs"
