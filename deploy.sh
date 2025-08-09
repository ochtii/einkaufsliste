#!/bin/bash

# Einkaufsliste Deployment Script
echo "🚀 Deploying Einkaufsliste to production..."

# Set error handling
set -e

# Function to print colored output
print_success() { echo -e "\033[32m✅ $1\033[0m"; }
print_error() { echo -e "\033[31m❌ $1\033[0m"; }
print_warning() { echo -e "\033[33m⚠️  $1\033[0m"; }
print_info() { echo -e "\033[34mℹ️  $1\033[0m"; }

# Check if we're in the right directory
if [ ! -f "package.json" ] && [ ! -d "backend" ] && [ ! -d "frontend" ] && [ ! -d "api" ]; then
    print_error "This doesn't appear to be the Einkaufsliste project directory"
    exit 1
fi

print_info "Starting deployment process..."

# Pull latest changes
print_info "Pulling latest changes from repository..."
git pull origin live

# Install/Update dependencies
print_info "Updating Backend dependencies..."
cd backend
npm install --production
cd ..

print_info "Updating Frontend dependencies and building..."
cd frontend
npm install --production
npm run build
cd ..

print_info "Updating API dependencies..."
cd api
pip3 install -r requirements.txt
cd ..

# Stop services
print_info "Stopping existing services..."
pm2 stop ecosystem.config.js 2>/dev/null || print_warning "No existing services to stop"

# Database backup
if [ -f "backend/db.sqlite" ]; then
    print_info "Creating database backup..."
    cp backend/db.sqlite backend/db.sqlite.backup.$(date +%Y%m%d_%H%M%S)
    print_success "Database backed up"
fi

# Start services
print_info "Starting services..."
pm2 start ecosystem.config.js

# Wait for services to start
sleep 5

# Check service status
print_info "Checking service status..."
pm2 status

# Health checks
print_info "Running health checks..."

# Check backend
if curl -f -s http://localhost:4000/api/health >/dev/null 2>&1; then
    print_success "Backend is healthy"
else
    print_warning "Backend health check failed"
fi

# Check API
if curl -f -s http://localhost:8000/ >/dev/null 2>&1; then
    print_success "API is healthy"
else
    print_warning "API health check failed"
fi

# Check frontend (if using PM2 serve)
if curl -f -s http://localhost:3000/ >/dev/null 2>&1; then
    print_success "Frontend is healthy"
else
    print_warning "Frontend health check failed"
fi

print_success "Deployment completed!"
print_info "═══════════════════════════════════════"
print_info "🌐 Application URLs:"
print_info "   Frontend: http://localhost:3000"
print_info "   Backend API: http://localhost:4000"
print_info "   Admin Panel: http://localhost:8000/admin"
print_info "═══════════════════════════════════════"
print_info "📊 Monitor with: pm2 monit"
print_info "📋 View logs with: pm2 logs"
print_info "🔄 Restart services with: pm2 restart ecosystem.config.js"
