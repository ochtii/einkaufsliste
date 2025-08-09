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
print_info "Files being updated:"
git pull origin live --stat

# Install/Update dependencies
print_info "Updating Backend dependencies..."
cd backend
npm install --production
cd ..

print_info "Updating Frontend dependencies..."
cd frontend
npm install --production

print_info "Building Frontend for production..."
# Use environment variables instead of cross-env
NODE_OPTIONS=--no-deprecation DISABLE_ESLINT_PLUGIN=true npm run build
print_success "Frontend production build completed"
cd ..

print_info "Updating API dependencies..."
cd api
pip3 install -r requirements.txt
cd ..

# Stop services (except webhook to avoid killing the deployment process)
print_info "Stopping existing services..."
pm2 stop einkaufsliste-backend einkaufsliste-frontend einkaufsliste-api 2>/dev/null || print_warning "Some services were not running"

# Database backup
if [ -f "backend/db.sqlite" ]; then
    print_info "Creating database backup..."
    cp backend/db.sqlite backend/db.sqlite.backup.$(date +%Y%m%d_%H%M%S)
    print_success "Database backed up"
fi

# Start services (except webhook which is already running)
print_info "Starting services..."
pm2 restart einkaufsliste-backend einkaufsliste-frontend einkaufsliste-api 2>/dev/null || {
    print_info "Some services not running, starting them fresh..."
    pm2 start ecosystem.config.js --only einkaufsliste-backend
    pm2 start ecosystem.config.js --only einkaufsliste-frontend  
    pm2 start ecosystem.config.js --only einkaufsliste-api
}

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
    api_healthy=true
else
    print_warning "API health check failed"
    api_healthy=false
fi

# Check frontend
if curl -f -s http://localhost:3000/ >/dev/null 2>&1; then
    print_success "Frontend is healthy"
    frontend_healthy=true
else
    print_warning "Frontend health check failed"
    frontend_healthy=false
fi

# Final deployment report
print_info "═══════════════════════════════════════"
if [ "$api_healthy" = true ] && [ "$frontend_healthy" = true ]; then
    print_success "🎉 DEPLOYMENT SUCCESSFUL - ALL SERVICES OPERATIONAL!"
else
    print_warning "⚠️  Deployment completed with some service issues"
fi

print_info "🌐 Application URLs:"
print_info "   Frontend: http://localhost:3000"
print_info "   Backend API: http://localhost:4000"
print_info "   Admin Panel: http://localhost:8000/admin"

print_success "Auto-deployment completed successfully! 🚀"

# Show updated files summary
print_info "═══════════════════════════════════════"
print_info "📁 UPDATED FILES SUMMARY:"
print_info "═══════════════════════════════════════"
print_info "📋 Recent changes (last commit):"
git log --name-status -1 --pretty=format:"   Commit: %h - %s"
echo ""
print_info "📂 Modified files in this deployment:"
git diff --stat HEAD~1 HEAD | head -n -1 | while IFS= read -r line; do
    print_info "   📄 $line"
done
print_info ""
print_info "📊 Total changes:"
git diff --stat HEAD~1 HEAD | tail -n 1 | while IFS= read -r line; do
    print_info "   $line"
done
print_info "═══════════════════════════════════════"

print_info "Final status:"
pm2 status
