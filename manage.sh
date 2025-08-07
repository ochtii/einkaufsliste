#!/bin/bash

# Einkaufsliste Management Script
# Verwaltung der Produktionsumgebung

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_header() {
    echo -e "${PURPLE}🚀 $1${NC}"
}

show_help() {
    print_header "EINKAUFSLISTE MANAGEMENT"
    echo -e "${PURPLE}========================${NC}"
    echo ""
    echo "Verfügbare Befehle:"
    echo ""
    echo -e "${CYAN}./manage.sh status${NC}      - Service Status anzeigen"
    echo -e "${CYAN}./manage.sh logs${NC}        - Alle Logs anzeigen"
    echo -e "${CYAN}./manage.sh logs frontend${NC} - Frontend Logs"
    echo -e "${CYAN}./manage.sh logs backend${NC}  - Backend Logs"
    echo -e "${CYAN}./manage.sh logs api${NC}      - API Logs"
    echo -e "${CYAN}./manage.sh logs webhook${NC}  - Webhook Logs"
    echo -e "${CYAN}./manage.sh restart${NC}     - Alle Services neu starten"
    echo -e "${CYAN}./manage.sh restart frontend${NC} - Frontend neu starten"
    echo -e "${CYAN}./manage.sh restart backend${NC}  - Backend neu starten"
    echo -e "${CYAN}./manage.sh restart api${NC}      - API neu starten"
    echo -e "${CYAN}./manage.sh update${NC}      - Manuelles Update (git pull + restart)"
    echo -e "${CYAN}./manage.sh backup${NC}      - Datenbank Backup erstellen"
    echo -e "${CYAN}./manage.sh monitor${NC}     - Live Monitoring starten"
    echo -e "${CYAN}./manage.sh nginx${NC}       - Nginx Status und Config prüfen"
    echo -e "${CYAN}./manage.sh ssl${NC}         - SSL Zertifikat einrichten"
    echo -e "${CYAN}./manage.sh health${NC}      - Gesundheitscheck durchführen"
    echo ""
}

show_status() {
    print_header "SERVICE STATUS"
    echo ""
    
    print_info "PM2 Services:"
    sudo -u einkaufsliste pm2 list
    echo ""
    
    print_info "Nginx Status:"
    sudo systemctl status nginx --no-pager -l
    echo ""
    
    print_info "Systemressourcen:"
    echo "CPU: $(top -bn1 | grep "Cpu(s)" | awk '{print $2 + $4}')% verwendet"
    echo "RAM: $(free -h | awk '/^Mem:/ {print $3 "/" $2 " (" $4 " frei)"}')"
    echo "Disk: $(df -h / | awk 'NR==2{printf "%s/%s (%s verwendet)\n", $3,$2,$5}')"
    echo ""
    
    print_info "Port Status:"
    ss -tulpn | grep -E ":(3000|4000|5000|9000|80|443)" || echo "Keine relevanten Ports offen"
}

show_logs() {
    if [ -z "$2" ]; then
        print_info "Alle Logs (letzte 50 Zeilen):"
        sudo -u einkaufsliste pm2 logs --lines 50
    else
        case "$2" in
            frontend)
                print_info "Frontend Logs:"
                sudo -u einkaufsliste pm2 logs einkaufsliste-frontend
                ;;
            backend)
                print_info "Backend Logs:"
                sudo -u einkaufsliste pm2 logs einkaufsliste-backend
                ;;
            api)
                print_info "API Logs:"
                sudo -u einkaufsliste pm2 logs einkaufsliste-api
                ;;
            webhook)
                print_info "Webhook Logs:"
                sudo -u einkaufsliste pm2 logs einkaufsliste-webhook
                ;;
            *)
                print_error "Unbekannter Service: $2"
                echo "Verfügbare Services: frontend, backend, api, webhook"
                ;;
        esac
    fi
}

restart_services() {
    if [ -z "$2" ]; then
        print_info "Alle Services werden neu gestartet..."
        sudo -u einkaufsliste pm2 restart all
        print_success "Alle Services neu gestartet"
    else
        case "$2" in
            frontend)
                sudo -u einkaufsliste pm2 restart einkaufsliste-frontend
                print_success "Frontend neu gestartet"
                ;;
            backend)
                sudo -u einkaufsliste pm2 restart einkaufsliste-backend
                print_success "Backend neu gestartet"
                ;;
            api)
                sudo -u einkaufsliste pm2 restart einkaufsliste-api
                print_success "API neu gestartet"
                ;;
            webhook)
                sudo -u einkaufsliste pm2 restart einkaufsliste-webhook
                print_success "Webhook neu gestartet"
                ;;
            *)
                print_error "Unbekannter Service: $2"
                echo "Verfügbare Services: frontend, backend, api, webhook"
                ;;
        esac
    fi
}

manual_update() {
    print_info "Manuelles Update wird durchgeführt..."
    cd /home/einkaufsliste/einkaufsliste
    
    print_info "Repository wird aktualisiert..."
    sudo -u einkaufsliste git fetch origin
    sudo -u einkaufsliste git pull origin live
    
    print_info "Frontend wird neu gebaut..."
    cd frontend
    sudo -u einkaufsliste npm install
    sudo -u einkaufsliste npm run build
    
    print_info "Backend Abhängigkeiten werden geprüft..."
    cd ../backend
    sudo -u einkaufsliste npm install
    
    print_info "API Abhängigkeiten werden geprüft..."
    cd ../api
    sudo -u einkaufsliste ./venv/bin/pip install -r requirements.txt
    
    print_info "Services werden neu gestartet..."
    cd ..
    sudo -u einkaufsliste pm2 restart all
    
    print_success "Update abgeschlossen!"
}

create_backup() {
    print_info "Datenbank Backup wird erstellt..."
    
    BACKUP_DIR="/home/einkaufsliste/backups"
    TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
    
    mkdir -p "$BACKUP_DIR"
    
    # Backend SQLite DB
    if [ -f "/home/einkaufsliste/einkaufsliste/backend/db.sqlite" ]; then
        cp "/home/einkaufsliste/einkaufsliste/backend/db.sqlite" "$BACKUP_DIR/backend_db_$TIMESTAMP.sqlite"
        print_success "Backend DB gesichert: $BACKUP_DIR/backend_db_$TIMESTAMP.sqlite"
    fi
    
    # API SQLite DB
    if [ -f "/home/einkaufsliste/einkaufsliste/api/api_admin.sqlite" ]; then
        cp "/home/einkaufsliste/einkaufsliste/api/api_admin.sqlite" "$BACKUP_DIR/api_admin_db_$TIMESTAMP.sqlite"
        print_success "API Admin DB gesichert: $BACKUP_DIR/api_admin_db_$TIMESTAMP.sqlite"
    fi
    
    # Alte Backups löschen (älter als 30 Tage)
    find "$BACKUP_DIR" -name "*.sqlite" -mtime +30 -delete
    print_info "Alte Backups (>30 Tage) gelöscht"
    
    print_success "Backup abgeschlossen!"
}

start_monitoring() {
    print_header "LIVE MONITORING"
    print_info "Drücke Ctrl+C zum Beenden"
    echo ""
    
    sudo -u einkaufsliste pm2 monit
}

check_nginx() {
    print_info "Nginx Konfiguration wird geprüft..."
    
    sudo nginx -t
    
    if [ $? -eq 0 ]; then
        print_success "Nginx Konfiguration ist gültig"
        
        print_info "Nginx Status:"
        sudo systemctl status nginx --no-pager
        
        print_info "Aktive Sites:"
        ls -la /etc/nginx/sites-enabled/
        
        print_info "Nginx Access Logs (letzte 10 Einträge):"
        sudo tail -10 /var/log/nginx/access.log
    else
        print_error "Nginx Konfiguration hat Fehler!"
    fi
}

setup_ssl() {
    print_info "SSL Setup wird gestartet..."
    
    # Certbot installieren
    if ! command -v certbot &> /dev/null; then
        print_info "Certbot wird installiert..."
        sudo apt update
        sudo apt install -y certbot python3-certbot-nginx
    fi
    
    print_warning "Wichtig: Stelle sicher, dass deine Domain auf diese Server-IP zeigt!"
    echo "Server IP: $(curl -s ifconfig.me || echo 'IP konnte nicht ermittelt werden')"
    echo ""
    
    read -p "Domain eingeben (z.B. einkaufsliste.example.com): " DOMAIN
    
    if [ -z "$DOMAIN" ]; then
        print_error "Keine Domain eingegeben!"
        return 1
    fi
    
    print_info "SSL-Zertifikat für $DOMAIN wird erstellt..."
    sudo certbot --nginx -d "$DOMAIN"
    
    if [ $? -eq 0 ]; then
        print_success "SSL-Zertifikat erfolgreich eingerichtet!"
        print_info "Automatische Erneuerung wird eingerichtet..."
        
        # Cron Job für automatische Erneuerung
        (crontab -l 2>/dev/null; echo "0 12 * * * /usr/bin/certbot renew --quiet") | crontab -
        
        print_success "SSL Setup abgeschlossen!"
        print_info "Deine Anwendung ist jetzt unter https://$DOMAIN erreichbar"
    else
        print_error "SSL Setup fehlgeschlagen!"
    fi
}

health_check() {
    print_header "GESUNDHEITSCHECK"
    echo ""
    
    # Services prüfen
    print_info "Service Status:"
    SERVICES=("einkaufsliste-frontend" "einkaufsliste-backend" "einkaufsliste-api" "einkaufsliste-webhook")
    
    for service in "${SERVICES[@]}"; do
        STATUS=$(sudo -u einkaufsliste pm2 describe "$service" 2>/dev/null | grep -o "status.*online\|status.*stopped" || echo "status: not found")
        if [[ $STATUS == *"online"* ]]; then
            print_success "$service: Online"
        else
            print_error "$service: Offline oder nicht gefunden"
        fi
    done
    
    echo ""
    
    # Port Checks
    print_info "Port Erreichbarkeit:"
    PORTS=(3000 4000 5000 9000)
    
    for port in "${PORTS[@]}"; do
        if nc -z 127.0.0.1 "$port" 2>/dev/null; then
            print_success "Port $port: Erreichbar"
        else
            print_error "Port $port: Nicht erreichbar"
        fi
    done
    
    echo ""
    
    # HTTP Checks
    print_info "HTTP Endpoints:"
    
    # Frontend Check
    if curl -f -s http://127.0.0.1:3000 >/dev/null; then
        print_success "Frontend (Port 3000): OK"
    else
        print_error "Frontend (Port 3000): Fehler"
    fi
    
    # Backend Check
    if curl -f -s http://127.0.0.1:4000/api/uptime >/dev/null; then
        print_success "Backend API (Port 4000): OK"
    else
        print_error "Backend API (Port 4000): Fehler"
    fi
    
    # API Check
    if curl -f -s http://127.0.0.1:5000 >/dev/null; then
        print_success "Admin API (Port 5000): OK"
    else
        print_error "Admin API (Port 5000): Fehler"
    fi
    
    echo ""
    
    # Disk Space
    print_info "Speicherplatz:"
    DISK_USAGE=$(df / | awk 'NR==2{print $5}' | sed 's/%//')
    if [ "$DISK_USAGE" -lt 80 ]; then
        print_success "Speicherplatz: $DISK_USAGE% verwendet"
    else
        print_warning "Speicherplatz: $DISK_USAGE% verwendet (Warnung bei >80%)"
    fi
    
    # Memory
    MEMORY_USAGE=$(free | awk 'NR==2{printf "%.0f", $3/$2*100}')
    if [ "$MEMORY_USAGE" -lt 80 ]; then
        print_success "Arbeitsspeicher: $MEMORY_USAGE% verwendet"
    else
        print_warning "Arbeitsspeicher: $MEMORY_USAGE% verwendet (Warnung bei >80%)"
    fi
    
    echo ""
    print_info "Gesundheitscheck abgeschlossen!"
}

# Hauptfunktion
case "$1" in
    status)
        show_status
        ;;
    logs)
        show_logs "$@"
        ;;
    restart)
        restart_services "$@"
        ;;
    update)
        manual_update
        ;;
    backup)
        create_backup
        ;;
    monitor)
        start_monitoring
        ;;
    nginx)
        check_nginx
        ;;
    ssl)
        setup_ssl
        ;;
    health)
        health_check
        ;;
    *)
        show_help
        ;;
esac
