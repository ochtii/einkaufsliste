#!/bin/bash

# Quick Fix Script für Einkaufsliste Services

echo "🚀 Starte alle Einkaufsliste Services..."

# 1. Stoppe alle Services
echo "🛑 Stoppe bestehende Services..."
pm2 stop all

# 2. Prüfe ob ecosystem.config.js existiert
if [ ! -f "/home/einkaufsliste/ecosystem.config.js" ]; then
    echo "❌ ecosystem.config.js nicht gefunden"
    echo "📁 Erstelle PM2 Konfiguration..."
    
    cat > /home/einkaufsliste/ecosystem.config.js << 'EOF'
module.exports = {
  apps: [
    {
      name: 'frontend',
      script: 'npm',
      args: 'start',
      cwd: '/home/einkaufsliste/frontend',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      }
    },
    {
      name: 'backend',
      script: 'npm',
      args: 'start',
      cwd: '/home/einkaufsliste/backend',
      env: {
        NODE_ENV: 'production',
        PORT: 4000
      }
    },
    {
      name: 'api',
      script: 'python3',
      args: 'admin_server.py',
      cwd: '/home/einkaufsliste/api',
      env: {
        PYTHONPATH: '/home/einkaufsliste/api'
      }
    },
    {
      name: 'webhook',
      script: 'python3',
      args: 'webhook.py',
      cwd: '/home/einkaufsliste',
      max_restarts: 10,
      restart_delay: 2000
    }
  ]
};
EOF
fi

# 3. Starte Services mit PM2
echo "▶️  Starte Services..."
cd /home/einkaufsliste
pm2 start ecosystem.config.js

# 4. Zeige Status
echo "📊 Service Status:"
pm2 status

# 5. Speichere PM2 Setup
pm2 save

echo ""
echo "✅ Services gestartet. Teste in 10 Sekunden..."
sleep 10

# 6. Teste Services
echo "🧪 Teste Services:"
./diagnose-services.sh
