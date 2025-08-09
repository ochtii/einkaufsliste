# 📚 Einkaufsliste API Dokumentation

## 🌐 System-Übersicht

Die Einkaufsliste verwendet ein Multi-Service-System mit verschiedenen APIs:

- **Backend API** (Port 4000): Haupt-REST-API für Einkaufslisten
- **Admin API** (Port 5000): Python-Admin-Panel mit erweiterten Funktionen  
- **Easter Egg API** (Port 8888): Versteckte Features und Animationen
- **Webhook API** (Port 9000): GitHub-Deployment-Automatisierung

---

## 🛒 Backend API (Port 4000)

**Base URL**: `http://localhost:4000`  
**Authentication**: JWT Bearer Token

### 🔐 Authentication

#### POST `/api/login`
Benutzer-Anmeldung

```json
{
  "username": "string",
  "password": "string"
}
```

**Response:**
```json
{
  "token": "jwt_token_string",
  "user": {
    "uuid": "user_uuid",
    "username": "string"
  }
}
```

#### POST `/api/register`
Benutzer-Registrierung

```json
{
  "username": "string", 
  "password": "string"
}
```

---

### 📋 Listen-Management

#### GET `/api/lists`
Alle Listen des Benutzers abrufen

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
[
  {
    "uuid": "list_uuid",
    "name": "Einkaufsliste",
    "created_at": "2025-08-09T10:00:00Z",
    "items_count": 5
  }
]
```

#### POST `/api/lists`
Neue Liste erstellen

```json
{
  "name": "Meine neue Liste"
}
```

#### PUT `/api/lists/:uuid`
Liste bearbeiten

```json
{
  "name": "Geänderter Listenname"
}
```

#### DELETE `/api/lists/:uuid`
Liste löschen

---

### 🛍️ Artikel-Management

#### GET `/api/lists/:listUuid/items`
Alle Artikel einer Liste

**Response:**
```json
[
  {
    "id": 1,
    "name": "Milch",
    "category": "🥛 Milchprodukte",
    "icon": "🥛",
    "comment": "1 Liter",
    "checked": false,
    "created_at": "2025-08-09T10:00:00Z"
  }
]
```

#### POST `/api/lists/:listUuid/items`
Artikel zu Liste hinzufügen

```json
{
  "name": "Milch",
  "category": "🥛 Milchprodukte", 
  "icon": "🥛",
  "comment": "1 Liter"
}
```

#### PUT `/api/lists/:listUuid/items/:itemId`
Artikel bearbeiten

```json
{
  "name": "Milch",
  "category": "🥛 Milchprodukte",
  "icon": "🥛", 
  "comment": "2 Liter",
  "checked": true
}
```

#### DELETE `/api/lists/:listUuid/items/:itemId`
Artikel löschen

---

### 📦 Kategorie-Management

#### GET `/api/categories`
Alle verfügbaren Kategorien

**Response:**
```json
[
  {
    "uuid": "category_uuid",
    "name": "🥛 Milchprodukte",
    "icon": "🥛"
  }
]
```

#### POST `/api/categories`
Neue Kategorie erstellen

```json
{
  "name": "🍎 Obst",
  "icon": "🍎"
}
```

#### PUT `/api/categories/:uuid`
Kategorie bearbeiten

#### DELETE `/api/categories/:uuid`
Kategorie löschen

---

### 📝 Standardartikel

#### GET `/api/standard-articles`
Alle Standardartikel

**Response:**
```json
[
  {
    "id": 1,
    "name": "Milch",
    "category": "🥛 Milchprodukte",
    "icon": "🥛",
    "type": "standard"
  }
]
```

#### POST `/api/standard-articles`
Standardartikel erstellen

#### PUT `/api/standard-articles/:id`
Standardartikel bearbeiten

#### DELETE `/api/standard-articles/:id`
Standardartikel löschen

---

### ⭐ Favoriten

#### GET `/api/favorites`
Benutzer-Favoriten

#### POST `/api/articles`
Favorit erstellen

```json
{
  "name": "Lieblings-Käse",
  "category": "🧀 Milchprodukte",
  "icon": "🧀",
  "type": "favorite"
}
```

---

## 👑 Admin API (Port 5000)

**Base URL**: `http://localhost:5000`  
**Authentication**: Admin-Passwort

### 🔧 Admin-Funktionen

#### GET `/admin`
Admin-Dashboard (HTML-Interface)

#### POST `/admin/login`
Admin-Anmeldung

```json
{
  "password": "admin_password"
}
```

#### GET `/admin/users`
Alle Benutzer verwalten

#### GET `/admin/statistics`
System-Statistiken

#### POST `/admin/backup`
Datenbank-Backup erstellen

#### POST `/admin/restore`
Datenbank wiederherstellen

---

## 🎉 Easter Egg API (Port 8888)

**Base URL**: `http://localhost:8888/egg/api/lol`  
**Authentication**: API-Key Header

### 🥚 Easter Egg Funktionen

#### GET `/health`
API-Gesundheitscheck

**Response:**
```json
{
  "status": "healthy",
  "service": "Easter Egg API", 
  "version": "1.0.0"
}
```

#### POST `/find/:egg_name`
Easter Egg als gefunden melden

**Headers:**
```
X-API-Key: einkaufsliste-easter-2025
X-User-UUID: user_unique_id
X-User-Name: username
```

**Response:**
```json
{
  "success": true,
  "message": "Easter egg found!",
  "data": {
    "is_first_find_ever": true,
    "is_first_find_for_user": true,
    "egg_name": "stars_and_sweets",
    "total_finds": 1
  },
  "celebration": {
    "type": "FIRST_EVER",
    "title": "🎉 GLÜCKWUNSCH! 🎉",
    "message": "Du hast dein erstes Easter Egg gefunden!",
    "effect": "MEGA_FIREWORKS"
  }
}
```

#### GET `/stats/:user_uuid`
Benutzer-Easter-Egg-Statistiken

**Response:**
```json
{
  "success": true,
  "data": {
    "total_finds": 3,
    "found_eggs": ["stars_and_sweets", "other_egg"]
  }
}
```

#### POST `/trigger/stars-and-sweets`
Spezifischer Trigger für Sterne & Süßwaren

**Body:**
```json
{
  "icon": "⭐",
  "category": "🍭 Süßwaren"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Stars and sweets easter egg activated!",
  "animation": {
    "type": "FALLING_STARS_SWEETS",
    "duration": 5000,
    "particles": ["⭐", "🍭", "✨", "🌟", "🍬", "🍫"]
  }
}
```

---

## 🔄 Webhook API (Port 9000)

**Base URL**: `http://localhost:9000`  
**Authentication**: GitHub Webhook Secret

### 🚀 Deployment

#### POST `/webhook`
GitHub Push-Event für automatisches Deployment

**Headers:**
```
X-GitHub-Event: push
X-Hub-Signature-256: sha256=signature
```

**Response:**
```json
{
  "status": "deployment_triggered",
  "message": "Auto-deployment started"
}
```

---

## 🔒 Authentifizierung

### JWT Token Format
```
Authorization: Bearer <jwt_token>
```

### Easter Egg API Key
```
X-API-Key: einkaufsliste-easter-2025
```

### Admin Authentication
Session-basiert nach Login

---

## 📊 Response Codes

| Code | Bedeutung |
|------|-----------|
| 200 | Erfolgreich |
| 201 | Erstellt |
| 400 | Ungültige Anfrage |
| 401 | Nicht autorisiert |
| 403 | Verboten |
| 404 | Nicht gefunden |
| 500 | Server-Fehler |

---

## 🌍 CORS-Konfiguration

Alle APIs unterstützen CORS für Frontend-Integration:
- **Frontend**: `http://localhost:3000`
- **Entwicklung**: Alle Localhost-Ports erlaubt
- **Produktion**: Spezifische Domain-Konfiguration

---

## 📝 Beispiel-Workflows

### 1. Neue Einkaufsliste erstellen
```bash
# 1. Anmelden
POST /api/login
{
  "username": "user",
  "password": "password"
}

# 2. Liste erstellen  
POST /api/lists
Authorization: Bearer <token>
{
  "name": "Wocheneinkauf"
}

# 3. Artikel hinzufügen
POST /api/lists/:uuid/items
{
  "name": "Milch",
  "category": "🥛 Milchprodukte",
  "icon": "🥛"
}
```

### 2. Easter Egg aktivieren
```bash
# Frontend erkennt ⭐ + 🍭 Süßwaren Kombination
POST /egg/api/lol/trigger/stars-and-sweets
X-API-Key: einkaufsliste-easter-2025
X-User-UUID: user_123
{
  "icon": "⭐",
  "category": "🍭 Süßwaren"  
}
```

---

## 🔧 Entwicklung & Testing

### Lokale URLs
- Frontend: http://localhost:3000
- Backend: http://localhost:4000
- Admin: http://localhost:5000
- Easter Eggs: http://localhost:8888
- Webhook: http://localhost:9000

### API-Testing Tools
- **Postman Collection**: Verfügbar für Import
- **cURL Beispiele**: In den jeweiligen Sektionen
- **Frontend Dev Tools**: Browser-Netzwerk-Tab

---

**🎯 Diese Dokumentation wird kontinuierlich aktualisiert mit neuen Features und Endpoints.**
