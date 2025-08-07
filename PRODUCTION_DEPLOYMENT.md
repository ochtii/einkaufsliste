# 🚀 Einkaufsliste Produktions-Deployment

Vollautomatische Installation und Deployment für Ubuntu 24.04 VM mit Auto-Deployment via GitHub Webhooks.

## 📋 Voraussetzungen

- **Ubuntu 24.04 LTS** (frische Installation)
- **Root/Sudo Zugriff**
- **Internet-Verbindung**
- **GitHub Repository**: https://github.com/ochtii/einkaufsliste
- **Branch**: `live` (für Produktion)

## 🛠️ Installation

### 1. Repository klonen

```bash
git clone https://github.com/ochtii/einkaufsliste.git
cd einkaufsliste
```

### 2. Installationsskript ausführen

```bash
chmod +x install.sh
sudo ./install.sh
```

Das Skript installiert automatisch:

- ✅ Node.js (LTS)
- ✅ Python 3 + pip
- ✅ PM2 (Prozess-Manager)
- ✅ Nginx (Reverse Proxy)
- ✅ Firewall (UFW)
- ✅ Alle Abhängigkeiten
- ✅ Auto-Deployment System
- ✅ Systemd Services

### 3. SSH-Key zu GitHub hinzufügen

Das Skript generiert einen SSH-Key, den du zu GitHub hinzufügen musst:

1. Key kopieren: `sudo cat /home/einkaufsliste/.ssh/id_rsa.pub`
2. Zu GitHub hinzufügen: https://github.com/settings/ssh/new
3. Installation fortsetzt automatisch

## 🔄 Auto-Deployment einrichten

### GitHub Webhook konfigurieren

1. Gehe zu: https://github.com/ochtii/einkaufsliste/settings/hooks
2. Klicke **"Add webhook"**
3. Konfiguration:
   - **Payload URL**: `http://DEINE-SERVER-IP:9000/webhook`
   - **Content type**: `application/json`
   - **Secret**: `einkaufsliste-webhook-secret`
   - **Events**: `Just the push event`
   - **Active**: ✅

### Auto-Deployment testen

```bash
# Auf deinem lokalen System:
git checkout live
git add .
git commit -m "Test Auto-Deployment"
git push origin live
```

Der Server wird automatisch:

1. ✅ Code von GitHub pullen
2. ✅ Abhängigkeiten prüfen/aktualisieren
3. ✅ Frontend neu bauen
4. ✅ Services neu starten

## 🖥️ Service Management

### Management Script verwenden

```bash
chmod +x manage.sh
```

#### Verfügbare Befehle:

```bash
# Service Status anzeigen
./manage.sh status

# Logs anzeigen
./manage.sh logs                # Alle Logs
./manage.sh logs frontend       # Nur Frontend
./manage.sh logs backend        # Nur Backend
./manage.sh logs api            # Nur API
./manage.sh logs webhook        # Nur Webhook

# Services neu starten
./manage.sh restart             # Alle Services
./manage.sh restart frontend    # Nur Frontend
./manage.sh restart backend     # Nur Backend
./manage.sh restart api         # Nur API

# Manuelles Update
./manage.sh update

# Datenbank Backup
./manage.sh backup

# Live Monitoring
./manage.sh monitor

# Nginx prüfen
./manage.sh nginx

# SSL einrichten
./manage.sh ssl

# Gesundheitscheck
./manage.sh health
```

### Direkte PM2 Befehle

```bash
# Als einkaufsliste Benutzer
sudo -u einkaufsliste pm2 list
sudo -u einkaufsliste pm2 logs
sudo -u einkaufsliste pm2 restart all
sudo -u einkaufsliste pm2 stop all
sudo -u einkaufsliste pm2 start all
```

## 🌐 Zugriff auf die Anwendung

### Standard-URLs

- **Frontend**: http://SERVER-IP:3000
- **Backend API**: http://SERVER-IP:4000/api
- **Admin Panel**: http://SERVER-IP:5000/admin
- **Webhook**: http://SERVER-IP:9000/webhook

### Mit Nginx (Empfohlen)

- **Anwendung**: http://SERVER-IP (Port 80)
- **API**: http://SERVER-IP/api
- **Admin**: http://SERVER-IP/admin

## 🔒 SSL/HTTPS einrichten

```bash
./manage.sh ssl
```

Oder manuell:

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d deine-domain.com
```

## 📊 Monitoring & Logs

### Service Status

```bash
./manage.sh status
```

### Live Monitoring

```bash
./manage.sh monitor
```

### Log-Dateien

```bash
# PM2 Logs
/home/einkaufsliste/logs/frontend-*.log
/home/einkaufsliste/logs/backend-*.log
/home/einkaufsliste/logs/api-*.log
/home/einkaufsliste/logs/webhook-*.log
/home/einkaufsliste/logs/deployment.log

# System Logs
/var/log/nginx/access.log
/var/log/nginx/error.log
sudo journalctl -u pm2-einkaufsliste
```

## 🗄️ Datenbank Management

### Automatisches Backup

```bash
./manage.sh backup
```

Backups werden gespeichert in: `/home/einkaufsliste/backups/`

### Manuelles Backup

```bash
# Backend DB
cp /home/einkaufsliste/einkaufsliste/backend/db.sqlite /backup/location/

# API Admin DB
cp /home/einkaufsliste/einkaufsliste/api/api_admin.sqlite /backup/location/
```

## 🚨 Troubleshooting

### Services überprüfen

```bash
./manage.sh health
```

### Service nicht erreichbar

```bash
# Port-Status prüfen
sudo ss -tulpn | grep -E ":(3000|4000|5000|9000)"

# Firewall prüfen
sudo ufw status

# Nginx prüfen
./manage.sh nginx
```

### Auto-Deployment funktioniert nicht

```bash
# Webhook Logs prüfen
./manage.sh logs webhook

# Webhook manuell testen
curl -X POST http://ochtii.run.place:9000/webhook \
  -H "Content-Type: application/json" \
  -d '{"ref":"refs/heads/live","repository":{"name":"einkaufsliste"}}'
```

### Services starten nicht

```bash
# PM2 Status
sudo -u einkaufsliste pm2 list

# Service-spezifische Logs
./manage.sh logs frontend
./manage.sh logs backend
./manage.sh logs api

# Services neu starten
./manage.sh restart
```

### Speicherplatz/Performance

```bash
# Disk Usage
df -h

# Memory Usage
free -h

# Process Monitor
htop

# Alte Logs bereinigen
sudo -u einkaufsliste pm2 flush
sudo logrotate /etc/logrotate.conf
```

## ⚙️ Konfiguration

### Environment Variables

Bearbeite `/home/einkaufsliste/einkaufsliste/ecosystem.config.js`:

```javascript
env: {
  NODE_ENV: 'production',
  PORT: 3000,
  // Weitere Variablen...
}
```

### Nginx Konfiguration

Bearbeite `/etc/nginx/sites-available/einkaufsliste`

### Firewall Ports

```bash
# Port öffnen
sudo ufw allow PORT

# Port schließen
sudo ufw deny PORT

# Status anzeigen
sudo ufw status
```

## 🔄 Updates & Wartung

### Automatische Updates (empfohlen)

Push zu `live` Branch → Auto-Deployment

### Manuelle Updates

```bash
./manage.sh update
```

### System Updates

```bash
sudo apt update && sudo apt upgrade -y
sudo reboot  # falls nötig
```

### Node.js/PM2 Updates

```bash
# Node.js update
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt-get install -y nodejs

# PM2 update
sudo npm install -g pm2@latest
sudo -u einkaufsliste pm2 update
```

## 📞 Support

Bei Problemen:

1. **Logs prüfen**: `./manage.sh logs`
2. **Health Check**: `./manage.sh health`
3. **Services neu starten**: `./manage.sh restart`
4. **GitHub Issues**: https://github.com/ochtii/einkaufsliste/issues

## 🔧 Erweiterte Konfiguration

### Load Balancing

Für höhere Last, PM2 Cluster Mode verwenden:

```javascript
// In ecosystem.config.js
instances: 'max',  // Nutze alle CPU Kerne
exec_mode: 'cluster'
```

### Monitoring Tools

```bash
# PM2 Web Interface
sudo npm install -g pm2-web
pm2-web

# System Monitoring
sudo apt install htop iotop
```

### Backup Automatisierung

```bash
# Cron Job für tägliche Backups
crontab -e
# Hinzufügen:
0 2 * * * /path/to/einkaufsliste/manage.sh backup
```

---

## 🎯 Quick Start Checklist

- [ ] Ubuntu 24.04 VM bereit
- [ ] `git clone` Repository
- [ ] `sudo ./install.sh` ausführen
- [ ] SSH-Key zu GitHub hinzufügen
- [ ] GitHub Webhook konfigurieren
- [ ] Test-Push zu `live` Branch
- [ ] `./manage.sh health` für finalen Check
- [ ] SSL einrichten (optional): `./manage.sh ssl`

**🎉 Fertig! Die Anwendung läuft in Produktion mit Auto-Deployment!**
