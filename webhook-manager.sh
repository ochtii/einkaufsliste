#!/bin/bash

# Webhook Server Management Script

WEBHOOK_PORT=9000
WEBHOOK_SCRIPT="/home/einkaufsliste/webhook.py"

print_info() {
    echo -e "\033[0;34mℹ️  $1\033[0m"
}

print_success() {
    echo -e "\033[0;32m✅ $1\033[0m"
}

print_error() {
    echo -e "\033[0;31m❌ $1\033[0m"
}

# Prüfe ob Port belegt ist
check_port() {
    if lsof -Pi :$WEBHOOK_PORT -sTCP:LISTEN -t >/dev/null; then
        print_error "Port $WEBHOOK_PORT ist bereits belegt"
        print_info "Prozesse auf Port $WEBHOOK_PORT:"
        lsof -Pi :$WEBHOOK_PORT -sTCP:LISTEN
        return 1
    else
        print_success "Port $WEBHOOK_PORT ist frei"
        return 0
    fi
}

# Stoppe Prozesse auf dem Port
kill_port() {
    print_info "Stoppe alle Prozesse auf Port $WEBHOOK_PORT..."
    pids=$(lsof -Pi :$WEBHOOK_PORT -sTCP:LISTEN -t)
    if [ -n "$pids" ]; then
        echo $pids | xargs kill -9
        sleep 2
        print_success "Prozesse gestoppt"
    else
        print_info "Keine Prozesse auf Port $WEBHOOK_PORT gefunden"
    fi
}

# Starte Webhook manuell
start_webhook() {
    print_info "Starte Webhook Server..."
    if check_port; then
        python3 $WEBHOOK_SCRIPT &
        sleep 2
        if check_port; then
            print_error "Webhook konnte nicht gestartet werden"
            return 1
        else
            print_success "Webhook Server läuft auf Port $WEBHOOK_PORT"
            return 0
        fi
    else
        print_error "Port bereits belegt, stoppe zuerst bestehende Prozesse"
        return 1
    fi
}

# Teste Webhook
test_webhook() {
    print_info "Teste Webhook Server..."
    response=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:$WEBHOOK_PORT/health" 2>/dev/null)
    if [ "$response" = "200" ]; then
        print_success "Webhook Server antwortet (HTTP $response)"
        return 0
    else
        print_error "Webhook Server antwortet nicht (HTTP $response)"
        return 1
    fi
}

case "$1" in
    "check")
        check_port
        ;;
    "kill")
        kill_port
        ;;
    "start")
        start_webhook
        ;;
    "test")
        test_webhook
        ;;
    "restart")
        kill_port
        sleep 1
        start_webhook
        ;;
    *)
        echo "Usage: $0 {check|kill|start|test|restart}"
        echo "  check   - Prüfe ob Port frei ist"
        echo "  kill    - Stoppe Prozesse auf Webhook Port"
        echo "  start   - Starte Webhook Server"
        echo "  test    - Teste Webhook Server"
        echo "  restart - Stoppe und starte Webhook neu"
        exit 1
        ;;
esac
