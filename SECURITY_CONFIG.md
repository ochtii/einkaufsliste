# 🔒 Sicherheitskonfiguration für Einkaufsliste

## Kritische Umgebungsvariablen

### Vor dem ersten Start MÜSSEN folgende Variablen gesetzt werden:

```bash
# JWT Secret für Token-Sicherheit (mindestens 32 Zeichen, zufällig)
export JWT_SECRET="dein-super-sicherer-jwt-secret-mindestens-32-zeichen-lang"

# Admin-Passwort für Admin-Panel (mindestens 12 Zeichen, komplex)
export ADMIN_PASSWORD="dein-sicheres-admin-passwort"

# GitHub Webhook Secret
export GITHUB_WEBHOOK_SECRET="einkaufsliste-webhook-secret"
```

### Sichere Generierung:

```bash
# JWT Secret generieren (64 Zeichen)
openssl rand -base64 48

# Starkes Passwort generieren
openssl rand -base64 16
```

## PM2 mit Environment Variables

### .env Datei erstellen:

```bash
# /home/einkaufsliste/.env
JWT_SECRET=hier-dein-generierter-jwt-secret
ADMIN_PASSWORD=hier-dein-starkes-admin-passwort
GITHUB_WEBHOOK_SECRET=einkaufsliste-webhook-secret
REPO_PATH=/home/einkaufsliste
WEBHOOK_PORT=9000
```

### PM2 mit .env starten:

```bash
cd /home/einkaufsliste
pm2 start ecosystem.config.js --env production
```

## Sichere Admin-Zugänge

### Backend Admin-API:

- **URL**: `/api/admin/*` (statt versteckter URLs)
- **Authentifizierung**: Environment-basiertes Passwort
- **Beispiel**:
  ```bash
  curl -X POST http://localhost:4000/api/admin/stats \
    -H "Content-Type: application/json" \
    -d '{"password": "dein-admin-passwort"}'
  ```

### Frontend Admin-Panel:

- **URL**: `/admin` (statt `/dJkL9mN2pQ7rS4tUvWxYz`)
- **Zugang**: Über Admin-Passwort

### API Admin-Panel:

- **URL**: `/admin`
- **Standard-Login**: `admin` / Environment Variable `ADMIN_PASSWORD`

## Entfernte Sicherheitsmängel

✅ **Behobene Probleme:**

1. **Hardcoded Passwords entfernt**:
   - Backend: `HureAgnes21` → Environment Variable
   - API: `admin123` → Environment Variable
2. **JWT Secret sicher**:
   - Fallback-Secret entfernt
   - Startup-Validation hinzugefügt
3. **Admin-Endpoints geschützt**:
   - Versteckte URLs `/api/dJkL9mN2pQ7rS4tUvWxYz/*` → `/api/admin/*`
   - Echte Passwort-Authentifizierung statt Security-by-Obscurity

## Deployment-Checklist

**Vor Produktions-Deployment:**

- [ ] `.env` Datei mit sicheren Secrets erstellt
- [ ] JWT_SECRET generiert (mindestens 32 Zeichen)
- [ ] ADMIN_PASSWORD gesetzt (mindestens 12 Zeichen)
- [ ] GITHUB_WEBHOOK_SECRET konfiguriert
- [ ] PM2 mit Environment Variables gestartet
- [ ] Admin-Panel unter `/admin` erreichbar
- [ ] Keine hardcoded Passwörter im Code

**Testen:**

```bash
# Backend Startup-Validation prüfen
pm2 logs einkaufsliste-backend

# Admin-API testen
curl -X POST http://localhost:4000/api/admin/stats \
  -H "Content-Type: application/json" \
  -d '{"password": "dein-admin-passwort"}'

# Frontend Admin-Panel öffnen
# http://localhost:3000/admin
```

## Notfall-Recovery

Falls JWT_SECRET oder ADMIN_PASSWORD vergessen:

```bash
# Neue Secrets generieren
export JWT_SECRET=$(openssl rand -base64 48)
export ADMIN_PASSWORD=$(openssl rand -base64 16)

# PM2 neustarten
pm2 restart einkaufsliste-backend
pm2 restart einkaufsliste-api

# Neue Credentials loggen
echo "Neues Admin-Passwort: $ADMIN_PASSWORD"
```

**🔒 Sicherheit ist kritisch für Produktions-Deployment!**
