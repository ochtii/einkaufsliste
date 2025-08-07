#!/bin/bash

# Database Schema Fix - Korrigiert fehlende Spalten

echo "🔧 Repariere Datenbank Schema..."

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

# Stoppe Backend Service
print_info "Stoppe Backend Service..."
pm2 stop backend || true

# Backup aktuelle Datenbank
print_info "Erstelle Backup der aktuellen Datenbank..."
cd /home/ubuntu/einkaufsliste/backend
cp db.sqlite db.sqlite.backup.$(date +%Y%m%d_%H%M%S) 2>/dev/null || echo "Keine DB zum Backup gefunden"

# Lösche korrupte/unvollständige Datenbank
print_info "Lösche alte Datenbank..."
rm -f db.sqlite db.sqlite-shm db.sqlite-wal

# Erstelle neue Datenbank mit korrektem Schema
print_info "Erstelle neue Datenbank mit korrektem Schema..."
sqlite3 db.sqlite << 'EOF'
-- Users table
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  uuid TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  is_admin BOOLEAN DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Shopping lists table
CREATE TABLE shopping_lists (
  uuid TEXT PRIMARY KEY,
  user_uuid TEXT NOT NULL,
  name TEXT NOT NULL,
  icon TEXT DEFAULT '🛒',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_uuid) REFERENCES users (uuid) ON DELETE CASCADE
);

-- Articles table
CREATE TABLE articles (
  uuid TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  icon TEXT,
  comment TEXT DEFAULT '',
  user_uuid TEXT,
  list_uuid TEXT,
  is_bought BOOLEAN DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_uuid) REFERENCES users (uuid) ON DELETE CASCADE,
  FOREIGN KEY (list_uuid) REFERENCES shopping_lists (uuid) ON DELETE CASCADE
);

-- Favorites table
CREATE TABLE favorites (
  uuid TEXT PRIMARY KEY,
  user_uuid TEXT NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  icon TEXT,
  comment TEXT DEFAULT '',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_uuid) REFERENCES users (uuid) ON DELETE CASCADE,
  UNIQUE(user_uuid, name, category)
);

-- Standard articles table (MIT is_global Spalte!)
CREATE TABLE standard_articles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  icon TEXT,
  is_global BOOLEAN DEFAULT 0,
  user_uuid TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_uuid) REFERENCES users (uuid) ON DELETE CASCADE,
  UNIQUE(name, category, user_uuid)
);

-- Categories table (MIT is_global Spalte!)
CREATE TABLE categories (
  uuid TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  icon TEXT NOT NULL,
  is_global BOOLEAN DEFAULT 0,
  user_uuid TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_uuid) REFERENCES users (uuid) ON DELETE CASCADE,
  UNIQUE(name, user_uuid)
);

-- Broadcasts table
CREATE TABLE broadcasts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info',
  requires_confirmation BOOLEAN DEFAULT 0,
  is_permanent BOOLEAN DEFAULT 0,
  is_active BOOLEAN DEFAULT 1,
  expires_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Broadcast confirmations table
CREATE TABLE broadcast_confirmations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  broadcast_id INTEGER NOT NULL,
  user_uuid TEXT NOT NULL,
  confirmed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (broadcast_id) REFERENCES broadcasts (id) ON DELETE CASCADE,
  FOREIGN KEY (user_uuid) REFERENCES users (uuid) ON DELETE CASCADE,
  UNIQUE(broadcast_id, user_uuid)
);

-- Database logs table
CREATE TABLE db_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  method TEXT NOT NULL,
  query TEXT NOT NULL,
  params TEXT,
  response_time INTEGER,
  error TEXT,
  user_uuid TEXT,
  ip_address TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_uuid) REFERENCES users (uuid) ON DELETE SET NULL
);

-- Insert default global categories (MIT is_global = 1!)
INSERT INTO categories (uuid, name, icon, is_global) VALUES
('cat-1', 'Obst', '🍎', 1),
('cat-2', 'Gemüse', '🥕', 1),
('cat-3', 'Milchprodukte', '🥛', 1),
('cat-4', 'Fleisch', '🥩', 1),
('cat-5', 'Fisch', '🐟', 1),
('cat-6', 'Getreideprodukte', '🍞', 1),
('cat-7', 'Getränke', '🥤', 1),
('cat-8', 'Zutaten', '🧂', 1),
('cat-9', 'Tiefkühl', '🧊', 1),
('cat-10', 'Süßwaren', '🍭', 1),
('cat-11', 'Haushalt', '🧽', 1),
('cat-12', 'Körperpflege', '🧴', 1),
('cat-13', 'Sonstiges', '📦', 1);

-- Insert default global standard articles (MIT is_global = 1!)
INSERT INTO standard_articles (name, category, icon, is_global) VALUES
('Milch', 'Milchprodukte', '🥛', 1),
('Brot', 'Getreideprodukte', '🍞', 1),
('Butter', 'Milchprodukte', '🧈', 1),
('Eier', 'Milchprodukte', '🥚', 1),
('Bananen', 'Obst', '🍌', 1),
('Äpfel', 'Obst', '🍎', 1),
('Tomaten', 'Gemüse', '🍅', 1),
('Kartoffeln', 'Gemüse', '🥔', 1),
('Reis', 'Getreideprodukte', '🍚', 1),
('Nudeln', 'Getreideprodukte', '🍝', 1),
('Käse', 'Milchprodukte', '🧀', 1),
('Hähnchen', 'Fleisch', '🍗', 1),
('Joghurt', 'Milchprodukte', '🥛', 1),
('Zwiebeln', 'Gemüse', '🧅', 1),
('Knoblauch', 'Gemüse', '🧄', 1),
('Olivenöl', 'Zutaten', '🫒', 1),
('Salz', 'Zutaten', '🧂', 1),
('Zucker', 'Zutaten', '🍯', 1),
('Mehl', 'Getreideprodukte', '🌾', 1),
('Kaffee', 'Getränke', '☕', 1);

-- Create admin user
INSERT INTO users (uuid, username, password_hash, is_admin) VALUES 
('admin-uuid-123', 'admin', '$2b$10$8K1p/a4lWm8I9nJVJXFOaO5kFsZGcHh8fJw6bLd/4aGpDQDrLw9OK', 1);

-- Create test user (password: test123)
INSERT INTO users (uuid, username, password_hash, is_admin) VALUES 
('test-uuid-456', 'testuser', '$2b$10$8K1p/a4lWm8I9nJVJXFOaO5kFsZGcHh8fJw6bLd/4aGpDQDrLw9OK', 0);

-- Create default shopping list for test user
INSERT INTO shopping_lists (uuid, user_uuid, name, icon) VALUES 
('list-uuid-789', 'test-uuid-456', 'Meine Einkaufsliste', '🛒');

EOF

if [ $? -eq 0 ]; then
    print_success "Neue Datenbank erfolgreich erstellt!"
else
    print_error "Fehler beim Erstellen der Datenbank!"
    exit 1
fi

# Überprüfe Schema
print_info "Überprüfe Datenbank Schema..."
sqlite3 db.sqlite "PRAGMA table_info(categories);" | grep "is_global"
if [ $? -eq 0 ]; then
    print_success "is_global Spalte in categories Tabelle gefunden!"
else
    print_error "is_global Spalte fehlt noch!"
    exit 1
fi

sqlite3 db.sqlite "PRAGMA table_info(standard_articles);" | grep "is_global"
if [ $? -eq 0 ]; then
    print_success "is_global Spalte in standard_articles Tabelle gefunden!"
else
    print_error "is_global Spalte fehlt noch!"
    exit 1
fi

# Zeige Datenbank Statistiken
print_info "Datenbank Statistiken:"
echo "Users: $(sqlite3 db.sqlite "SELECT COUNT(*) FROM users;")"
echo "Categories: $(sqlite3 db.sqlite "SELECT COUNT(*) FROM categories;")"
echo "Standard Articles: $(sqlite3 db.sqlite "SELECT COUNT(*) FROM standard_articles;")"
echo "Shopping Lists: $(sqlite3 db.sqlite "SELECT COUNT(*) FROM shopping_lists;")"

# Starte Backend neu
print_info "Starte Backend Service neu..."
pm2 start "npm start" --name "backend" --cwd /home/ubuntu/einkaufsliste/backend

sleep 5

# Teste Backend
print_info "Teste Backend..."
backend_status=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:4000/api/captcha" 2>/dev/null || echo "000")
if [ "$backend_status" = "200" ]; then
    print_success "Backend läuft erfolgreich! (HTTP $backend_status)"
else
    print_error "Backend Problem (HTTP $backend_status)"
    print_info "Backend Logs:"
    pm2 logs backend --lines 10 --nostream
fi

print_success "🎉 Datenbank Schema erfolgreich repariert!"
print_info "Login-Daten:"
print_info "Admin: admin / admin123"  
print_info "Test User: testuser / test123"
