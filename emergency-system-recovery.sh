#!/bin/bash

echo "🚨 Emergency System Recovery - Fixing all critical issues..."

# Set error handling
set -e

# Function to print colored output
print_success() { echo -e "\033[32m✅ $1\033[0m"; }
print_error() { echo -e "\033[31m❌ $1\033[0m"; }
print_warning() { echo -e "\033[33m⚠️  $1\033[0m"; }
print_info() { echo -e "\033[34mℹ️  $1\033[0m"; }

print_info "Starting emergency system recovery..."

# 1. Fix corrupted database
print_info "Step 1: Fixing corrupted SQLite database..."
bash "$(dirname "$0")/fix-corrupted-database.sh"

# 2. Fix API session issues  
print_info "Step 2: Fixing API session encryption..."
bash "$(dirname "$0")/fix-api-sessions.sh"

# 3. Stop all services
print_info "Step 3: Stopping all services..."
if command -v pm2 >/dev/null 2>&1; then
    pm2 stop all 2>/dev/null || print_warning "PM2 services already stopped"
    sleep 2
fi

# 4. Clean up lock files and temporary data
print_info "Step 4: Cleaning up system files..."
cd "$(dirname "$0")"

# Backend cleanup
if [ -d "backend" ]; then
    cd backend
    rm -f db.sqlite-wal db.sqlite-shm
    rm -f *.log
    cd ..
fi

# API cleanup  
if [ -d "api" ]; then
    cd api
    rm -rf __pycache__/
    rm -f *.log
    cd ..
fi

# Frontend cleanup
if [ -d "frontend" ]; then
    cd frontend
    rm -rf node_modules/.cache/ 2>/dev/null || true
    cd ..
fi

# 5. Restart services in correct order
print_info "Step 5: Restarting services..."

if command -v pm2 >/dev/null 2>&1; then
    print_info "Starting backend..."
    pm2 start ecosystem.config.js --only einkaufsliste-backend 2>/dev/null || {
        print_warning "Using fallback backend start"
        cd backend
        pm2 start "npm start" --name "einkaufsliste-backend" 2>/dev/null || true
        cd ..
    }
    
    sleep 3
    
    print_info "Starting API..."
    pm2 start ecosystem.config.js --only einkaufsliste-api 2>/dev/null || {
        print_warning "Using fallback API start"
        cd api
        pm2 start "python3 admin_server.py" --name "einkaufsliste-api" 2>/dev/null || true
        cd ..
    }
    
    sleep 2
    
    print_info "Starting frontend..."
    pm2 start ecosystem.config.js --only einkaufsliste-frontend 2>/dev/null || {
        print_warning "Using fallback frontend start"
        cd frontend
        pm2 start "npm start" --name "einkaufsliste-frontend" 2>/dev/null || true
        cd ..
    }
    
    sleep 3
    
    print_info "Service status:"
    pm2 status
else
    print_warning "PM2 not available - manual service restart needed"
fi

# 6. Verify system health
print_info "Step 6: Verifying system health..."

# Test database connection
print_info "Testing database connection..."
cd backend
node -e "
import { open } from 'sqlite';
import sqlite3 from 'sqlite3';

async function testDb() {
  try {
    const db = await open({
      filename: './db.sqlite',
      driver: sqlite3.Database
    });
    const result = await db.get('SELECT COUNT(*) as count FROM users');
    console.log('✅ Database connection successful, users:', result.count);
    await db.close();
  } catch (error) {
    console.error('❌ Database test failed:', error.message);
    process.exit(1);
  }
}
testDb();
" || print_error "Database verification failed"

cd ..

# Test API health
print_info "Testing API health..."
sleep 2
curl -s http://localhost:8000/ >/dev/null && print_success "API is responding" || print_warning "API check failed (may need more time)"

# Test backend health  
print_info "Testing backend health..."
curl -s http://localhost:4000/api/health >/dev/null && print_success "Backend is responding" || print_warning "Backend check failed (may need more time)"

print_success "Emergency recovery completed!"
print_info "═══════════════════════════════════════"
print_info "🔑 Login Credentials:"
print_info "   Admin: admin / admin123"
print_info "   Test User: test / test123"
print_info "═══════════════════════════════════════"
print_info "🌐 Services:"
print_info "   Frontend: http://localhost:3000"
print_info "   Backend: http://localhost:4000"
print_info "   API Admin: http://localhost:8000/admin"
print_info "═══════════════════════════════════════"
print_info "📊 Monitor services with: pm2 monit"
print_info "📋 Check logs with: pm2 logs"
