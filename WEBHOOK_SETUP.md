# GitHub Webhook Setup für Auto-Deployment

## 1. Webhook Server mit PM2 starten

### Webhook Server hinzufügen:
```bash
# Auf dem Server
cd /home/einkaufsliste

# PM2 Konfiguration neu laden
pm2 reload ecosystem.config.js

# Nur Webhook Server starten (falls andere bereits laufen)
pm2 start ecosystem.config.js --only einkaufsliste-webhook

# Status prüfen
pm2 status
pm2 logs einkaufsliste-webhook
```

### PM2 Management:
```bash
# Webhook neustarten
pm2 restart einkaufsliste-webhook

# Webhook stoppen
pm2 stop einkaufsliste-webhook

# Logs anzeigen
pm2 logs einkaufsliste-webhook --lines 50
```

## 2. GitHub Repository Webhook konfigurieren

### In GitHub Repository:
1. Gehe zu: `Settings` → `Webhooks` → `Add webhook`

2. **Payload URL**: `http://ochtii.run.place:9000`
   
3. **Content type**: `application/json`

4. **Secret**: `einkaufsliste-webhook-secret`

5. **Events**: Wähle "Just the push event"

6. **Active**: ✅ Aktiviert

7. Klicke "Add webhook"

## 3. Testen

### Webhook Test:
```bash
# Health Check
curl http://ochtii.run.place:9000/health

# Erwartete Antwort:
{"status": "healthy", "service": "einkaufsliste-webhook"}
```

### Auto-Deployment Test:
```bash
# Beliebigen Change auf live branch pushen
git push origin live

# Webhook sollte triggern und deploy.sh ausführen
# PM2 logs zeigen die Aktivität:
pm2 logs einkaufsliste-webhook --lines 20
```

## 4. Debugging

### Webhook Logs ansehen:
```bash
# PM2 Logs in Echtzeit
pm2 logs einkaufsliste-webhook

# Letzte 50 Log-Zeilen
pm2 logs einkaufsliste-webhook --lines 50

# Detaillierte Prozess-Info
pm2 show einkaufsliste-webhook
```

### GitHub Webhook Status prüfen:
- In GitHub → Settings → Webhooks
- Klick auf den Webhook
- Unter "Recent Deliveries" siehst du alle Requests

## 5. Sicherheit

### Firewall konfigurieren:
```bash
# Port 9000 für GitHub Webhooks öffnen
sudo ufw allow 9000/tcp comment "GitHub Webhooks"
```

### HTTPS (optional, aber empfohlen):
```bash
# Nginx Reverse Proxy für HTTPS
# /etc/nginx/sites-available/webhook
server {
    listen 443 ssl;
    server_name webhook.ochtii.run.place;
    
    ssl_certificate /path/to/ssl/cert;
    ssl_certificate_key /path/to/ssl/key;
    
    location / {
        proxy_pass http://localhost:9000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## 6. Ablauf

**Bei jedem `git push origin live`:**
1. GitHub sendet Webhook an `ochtii.run.place:9000`
2. Webhook Server validiert Signature
3. Prüft ob es ein Push auf `live` branch ist
4. Führt `git pull` aus
5. Startet `./deploy.sh`
6. Services werden automatisch neu gestartet

**Auto-Deployment ist komplett! 🚀**
