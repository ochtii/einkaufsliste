#!/bin/bash

# Einkaufsliste Installation Script
echo "🛒 Installing Einkaufsliste Shopping List Application..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if Python3 is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python3 is not installed. Please install Python3 first."
    exit 1
fi

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    echo "📦 Installing PM2 globally..."
    npm install -g pm2
fi

echo "📂 Setting up project directories..."

# Install Backend Dependencies
echo "🔧 Installing Backend dependencies..."
cd backend
npm install
cd ..

# Install Frontend Dependencies  
echo "🎨 Installing Frontend dependencies..."
cd frontend
npm install
npm run build
cd ..

# Install API Dependencies
echo "🐍 Installing API dependencies..."
cd api
pip3 install -r requirements.txt
cd ..

# Create PM2 ecosystem file
echo "⚙️ Creating PM2 ecosystem configuration..."
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [
    {
      name: 'einkaufsliste-backend',
      script: 'server.js',
      cwd: './backend',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 4000
      }
    },
    {
      name: 'einkaufsliste-api',
      script: 'admin_server.py',
      cwd: './api',
      interpreter: 'python3',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env: {
        PYTHONPATH: '.',
        PORT: 5000
      }
    },
    {
      name: 'einkaufsliste-frontend',
      script: 'serve',
      cwd: './frontend',
      args: '-s build -p 3000',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M'
    }
  ]
};
EOF

echo "✅ Installation completed!"
echo ""
echo "🚀 To start the application:"
echo "   pm2 start ecosystem.config.js"
echo ""
echo "📊 To monitor services:"
echo "   pm2 monit"
echo ""
echo "📋 To view logs:"
echo "   pm2 logs"
echo ""
echo "🌐 Default URLs:"
echo "   Frontend: http://localhost:3000"
echo "   Backend: http://localhost:4000"
echo "   Admin API: http://localhost:5000"
