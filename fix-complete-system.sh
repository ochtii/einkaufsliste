#!/bin/bash

# Quick Fix für fehlende Dependencies und Database Corruption

echo "🔧 Repariere Einkaufsliste System..."

# Farben
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# 1. Stoppe alle Services
print_info "Stoppe alle laufenden Services..."
pm2 stop all || true

# 2. Backend Dependencies installieren
print_info "Installiere Backend Dependencies..."
cd /home/einkaufsliste/backend
npm install
print_success "Backend Dependencies installiert"

# 3. Frontend Dependencies installieren  
print_info "Installiere Frontend Dependencies..."
cd /home/einkaufsliste/frontend
npm install
print_success "Frontend Dependencies installiert"

# 4. API Dependencies installieren
print_info "Installiere API Dependencies..."
cd /home/einkaufsliste/api
if [ ! -d "venv" ]; then
    python3 -m venv venv
fi
source venv/bin/activate
pip install -r requirements.txt
print_success "API Dependencies installiert"

# 5. Database Corruption reparieren
print_info "Repariere korrupte Datenbank..."
cd /home/einkaufsliste

# Erstelle Backup der korrupten DB
if [ -f "backend/db.sqlite" ]; then
    cp backend/db.sqlite backend/db.sqlite.corrupt.backup
    print_info "Backup der korrupten DB erstellt"
fi

# Lösche korrupte Datenbank
rm -f backend/db.sqlite backend/db.sqlite-shm backend/db.sqlite-wal

# Erstelle neue Datenbank
print_info "Erstelle neue Datenbank..."
cd backend
node -e "
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const crypto = require('crypto');

async function createDatabase() {
  const db = new sqlite3.Database('db.sqlite');
  
  // Erstelle Tabellen
  const createTables = \`
    CREATE TABLE users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      uuid TEXT UNIQUE NOT NULL,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    
    CREATE TABLE shopping_lists (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      uuid TEXT UNIQUE NOT NULL,
      user_uuid TEXT NOT NULL,
      name TEXT NOT NULL,
      icon TEXT DEFAULT '🛒',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_uuid) REFERENCES users (uuid)
    );
    
    CREATE TABLE categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      icon TEXT NOT NULL,
      color TEXT DEFAULT '#3B82F6'
    );
    
    CREATE TABLE articles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      uuid TEXT UNIQUE NOT NULL,
      list_uuid TEXT NOT NULL,
      name TEXT NOT NULL,
      category_id INTEGER,
      quantity INTEGER DEFAULT 1,
      unit TEXT DEFAULT 'Stück',
      price REAL,
      notes TEXT,
      is_purchased BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (list_uuid) REFERENCES shopping_lists (uuid),
      FOREIGN KEY (category_id) REFERENCES categories (id)
    );
  \`;
  
  db.exec(createTables, async (err) => {
    if (err) {
      console.error('Fehler beim Erstellen der Tabellen:', err);
      return;
    }
    
    // Standard-Kategorien einfügen
    const categories = [
      ['Obst & Gemüse', '🥕', '#10B981'],
      ['Milchprodukte', '🥛', '#3B82F6'],
      ['Fleisch & Fisch', '🥩', '#EF4444'],
      ['Brot & Backwaren', '🍞', '#F59E0B'],
      ['Getränke', '🥤', '#8B5CF6'],
      ['Süßwaren', '🍫', '#EC4899'],
      ['Haushaltsartikel', '🧽', '#6B7280'],
      ['Sonstiges', '📦', '#374151']
    ];
    
    const insertCategory = db.prepare('INSERT INTO categories (name, icon, color) VALUES (?, ?, ?)');
    categories.forEach(cat => insertCategory.run(cat));
    insertCategory.finalize();
    
    // Test-User erstellen
    const passwordHash = await bcrypt.hash('test123', 10);
    const userUuid = crypto.randomUUID();
    
    db.run('INSERT INTO users (uuid, username, password_hash) VALUES (?, ?, ?)', 
           [userUuid, 'testuser', passwordHash], function(err) {
      if (err) {
        console.error('Fehler beim Erstellen des Test-Users:', err);
        return;
      }
      
      // Standard-Liste erstellen
      const listUuid = crypto.randomUUID();
      db.run('INSERT INTO shopping_lists (uuid, user_uuid, name, icon) VALUES (?, ?, ?, ?)',
             [listUuid, userUuid, 'Meine Einkaufsliste', '🛒'], (err) => {
        if (err) {
          console.error('Fehler beim Erstellen der Liste:', err);
        } else {
          console.log('✅ Datenbank erfolgreich erstellt');
          console.log('✅ Test-User erstellt: testuser / test123');
        }
        db.close();
      });
    });
  });
}

createDatabase().catch(console.error);
"

print_success "Neue Datenbank erstellt"

# 6. Services neu starten
print_info "Starte alle Services neu..."
cd /home/einkaufsliste
pm2 start ecosystem.config.js

# Warte kurz
sleep 3

# 7. Status prüfen
print_info "Prüfe Service Status..."
pm2 status

# 8. Test der Endpoints
print_info "Teste Endpoints..."

# Backend Test
backend_status=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:4000/api/captcha" 2>/dev/null || echo "000")
if [ "$backend_status" = "200" ]; then
    print_success "Backend läuft (HTTP $backend_status)"
else
    print_error "Backend Problem (HTTP $backend_status)"
fi

# API Test  
api_status=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:5000/api/stats" 2>/dev/null || echo "000")
if [ "$api_status" = "200" ]; then
    print_success "API läuft (HTTP $api_status)"
else
    print_error "API Problem (HTTP $api_status)"
fi

print_success "🎉 System-Reparatur abgeschlossen!"
print_info "Test-Login: testuser / test123"
print_info "Registration sollte jetzt funktionieren!"
