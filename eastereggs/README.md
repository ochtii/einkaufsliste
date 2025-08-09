# 🎉 Easter Egg System - Einkaufsliste

Das Easter Egg System fügt versteckte Überraschungen und Animationen zur Einkaufsliste hinzu.

## 🎯 Prinzip

- **User Counter**: Jeder Benutzer erhält einen Counter (startet bei 0, wird bei jedem gefundenen Easter Egg um 1 erhöht)
- **Badge System**: Array mit gefundenen Easter Eggs ['easteregg1', 'easteregg2', ...] für Profile-Badges
- **Benachrichtigungen**:
  - **Erster Fund**: Große Benachrichtigung mit Feuerwerk und Gratulation
  - **Weitere Funde**: Coole, witzige Notifications mit passenden Sprüchen

## 🔧 Technik

### Backend API (Port 8888)
- **Lightweight Python API** mit Flask
- **Auth über API Keys**
- **Routes**: `8888/egg/api/lol/<endpoint>`
- **Kein Frontend** (nur API)

### Datenbank (SQLite)
- **eastereggs**: (id, name, displayed_name, founds, time_last_found, active)
- **found_log**: (id, date, time, easteregg, user)
- **finders**: (uuid, name, date_first_find, last_find, find_cnt, found_eggs)
- **egg_api_key**: (id, key, last_until, is_active)

### Frontend Integration
- **JavaScript Class**: `EasterEggSystem` in `/utils/easterEggs.js`
- **CSS Animationen**: Feuerwerk, fallende Partikel, Confetti
- **React Integration**: Import in relevante Komponenten

## 🥚 Easter Eggs

### 1. ⭐ Sterne & Süßwaren 🍭
**Trigger**: Icon `⭐` UND Kategorie `🍭 Süßwaren` auswählen
**Effekt**: Sterne und Süßwaren fallen aus der Karte wenn diese geschlossen wird
**Pfad**: `/opt/eastereggs` (Server), `/eastereggs/` (Projekt)

## 📡 API Endpoints

```
GET  /egg/api/lol/health
POST /egg/api/lol/find/<egg_name>
GET  /egg/api/lol/stats/<user_uuid>
POST /egg/api/lol/trigger/stars-and-sweets
```

## 🚀 Installation & Start

### API Server starten:
```bash
cd eastereggs/
./start.sh        # Linux/Mac
start.bat         # Windows
```

### Dependencies:
```bash
pip install flask flask-cors
```

## 🎨 Animation Types

- **MEGA_FIREWORKS**: Großes Feuerwerk für erste Funde
- **CONFETTI**: Konfetti-Regen für neue Entdeckungen
- **SPARKLE**: Glitzern für bereits gefundene Easter Eggs
- **FALLING_STARS_SWEETS**: Fallende Sterne und Süßwaren (spezifisch für Easter Egg #1)

## 🔑 Authentifizierung

**Standard API Key**: `einkaufsliste-easter-2025`

Header für API-Calls:
```javascript
{
  'X-API-Key': 'einkaufsliste-easter-2025',
  'X-User-UUID': 'user_unique_id',
  'X-User-Name': 'username'
}
```

## 📁 Dateistruktur

```
eastereggs/
├── app.py              # Flask API Server
├── database.py         # SQLite Database Handler
├── requirements.txt    # Python Dependencies
├── start.sh           # Linux/Mac Startup Script
├── start.bat          # Windows Startup Script
└── eastereggs.db      # SQLite Database (auto-created)

frontend/src/
├── utils/
│   └── easterEggs.js   # JavaScript Easter Egg System
├── styles/
│   └── easterEggs.css  # Animation Styles
└── components/         # React Component Integration
```

## 🎮 Verwendung im Code

```javascript
import easterEggSystem from '../utils/easterEggs';

// Easter Egg Check
easterEggSystem.checkStarsAndSweets(icon, category);

// Manueller Trigger
easterEggSystem.triggerStarsAndSweets('⭐', '🍭 Süßwaren');
```

## 📊 Statistiken

Benutzer-Statistiken abrufen:
```javascript
const stats = await easterEggSystem.getUserStats();
// { total_finds: 3, found_eggs: ['stars_and_sweets', ...] }
```

---

**🎉 Happy Easter Egg Hunting! 🥚**
