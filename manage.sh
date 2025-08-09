#!/bin/bash

# Einkaufsliste Service Manager
echo "🛒 Einkaufsliste Service Manager"

# Function to print colored output
print_success() { echo -e "\033[32m✅ $1\033[0m"; }
print_error() { echo -e "\033[31m❌ $1\033[0m"; }
print_warning() { echo -e "\033[33m⚠️  $1\033[0m"; }
print_info() { echo -e "\033[34mℹ️  $1\033[0m"; }

# Function to show usage
show_usage() {
    echo "Usage: $0 [command]"
    echo ""
    echo "Commands:"
    echo "  start      Start all services"
    echo "  stop       Stop all services"
    echo "  restart    Restart all services"
    echo "  status     Show service status"
    echo "  logs       Show service logs"
    echo "  monitor    Open PM2 monitor"
    echo "  health     Check service health"
    echo "  backup     Backup database"
    echo "  update     Update and restart services"
    echo ""
}

# Function to check service health
check_health() {
    print_info "Checking service health..."
    
    # Backend health
    if curl -f -s http://localhost:4000/api/health >/dev/null 2>&1; then
        print_success "Backend (port 4000): Healthy"
    else
        print_error "Backend (port 4000): Not responding"
    fi
    
    # API health
    if curl -f -s http://localhost:5000/ >/dev/null 2>&1; then
        print_success "API (port 5000): Healthy"
    else
        print_error "API (port 5000): Not responding"
    fi
    
    # Frontend health
    if curl -f -s http://localhost:3000/ >/dev/null 2>&1; then
        print_success "Frontend (port 3000): Healthy"
    else
        print_warning "Frontend (port 3000): Not responding (might be served differently)"
    fi
}

# Function to backup database
backup_database() {
    if [ -f "backend/db.sqlite" ]; then
        backup_file="backend/db.sqlite.backup.$(date +%Y%m%d_%H%M%S)"
        cp backend/db.sqlite "$backup_file"
        print_success "Database backed up to: $backup_file"
    else
        print_warning "No database file found to backup"
    fi
}

# Main command handling
case "$1" in
    start)
        print_info "Starting all services..."
        pm2 start ecosystem.config.js
        sleep 3
        pm2 status
        ;;
    stop)
        print_info "Stopping all services..."
        pm2 stop ecosystem.config.js
        pm2 status
        ;;
    restart)
        print_info "Restarting all services..."
        pm2 restart ecosystem.config.js
        sleep 3
        pm2 status
        ;;
    status)
        pm2 status
        ;;
    logs)
        pm2 logs
        ;;
    monitor)
        pm2 monit
        ;;
    health)
        check_health
        ;;
    backup)
        backup_database
        ;;
    update)
        print_info "Updating services..."
        git pull origin live
        pm2 restart ecosystem.config.js
        sleep 3
        check_health
        ;;
    *)
        show_usage
        exit 1
        ;;
esac
