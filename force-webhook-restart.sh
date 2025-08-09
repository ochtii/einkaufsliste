#!/bin/bash
# Remote webhook restart script
# This script can be executed to restart the webhook server with new code

echo "🔄 Restarting Einkaufsliste Webhook Server..."
echo "Timestamp: $(date)"

# Check PM2 status before restart
echo "Current PM2 status:"
pm2 status

# Stop webhook process
echo "Stopping webhook..."
pm2 stop einkaufsliste-webhook

# Pull latest code (in case we're in the repo directory)
if [ -f "webhook.py" ]; then
    echo "Pulling latest webhook code..."
    git pull origin live
fi

# Start webhook with fresh code
echo "Starting webhook with updated configuration..."
pm2 start einkaufsliste-webhook

# Show final status
echo "Final PM2 status:"
pm2 status

# Show recent webhook logs
echo "Recent webhook logs:"
pm2 logs einkaufsliste-webhook --lines 10

echo "✅ Webhook restart completed!"
