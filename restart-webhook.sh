#!/bin/bash
# Restart webhook server with new configuration

echo "🔄 Restarting webhook server with updated configuration..."

# Stop webhook
pm2 stop einkaufsliste-webhook || echo "Webhook was not running"

# Start webhook with updated code
pm2 start ecosystem.config.js --only einkaufsliste-webhook

# Show status
pm2 status

echo "✅ Webhook server restarted!"
