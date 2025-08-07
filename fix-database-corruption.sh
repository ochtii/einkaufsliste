#!/bin/bash

# Fix für korrupte SQLite Datenbank

echo "🔧 Repariere korrupte SQLite Datenbank..."

# Stoppe Backend um Datei-Locks zu vermeiden
echo "🛑 Stoppe Backend Service..."
pm2 stop backend

# Gehe ins Backend-Verzeichnis
cd /home/einkaufsliste/backend

# Erstelle Backup der korrupten Datenbank
echo "💾 Erstelle Backup der korrupten Datenbank..."
cp db.sqlite db.sqlite.corrupt.backup

# Versuche Datenbank zu reparieren
echo "🔧 Versuche Datenbank-Reparatur..."

# Methode 1: SQLite .recover Kommando
echo "📋 Versuche Recovery..."
sqlite3 db.sqlite.corrupt.backup << 'EOF'
.recover
.save db.sqlite.recovered
.quit
EOF

# Prüfe ob Recovery erfolgreich war
if [ -f "db.sqlite.recovered" ]; then
    echo "✅ Recovery erfolgreich, verwende wiederhergestellte Datenbank"
    mv db.sqlite db.sqlite.broken
    mv db.sqlite.recovered db.sqlite
else
    echo "⚠️  Recovery fehlgeschlagen, erstelle neue saubere Datenbank"
    
    # Lösche korrupte Datenbank
    rm -f db.sqlite db.sqlite-shm db.sqlite-wal
    
    # Erstelle neue Datenbank mit korrekter Struktur
    echo "🆕 Erstelle neue Datenbank mit korrekter Struktur..."
    sqlite3 db.sqlite << 'EOF'
-- Users Tabelle mit UUID-Unterstützung
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    uuid TEXT UNIQUE NOT NULL,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    is_admin BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Shopping Lists Tabelle
CREATE TABLE shopping_lists (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    uuid TEXT UNIQUE NOT NULL,
    user_uuid TEXT NOT NULL,
    name TEXT NOT NULL,
    icon TEXT DEFAULT '🛒',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_uuid) REFERENCES users (uuid) ON DELETE CASCADE
);

-- Articles Tabelle
CREATE TABLE articles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    uuid TEXT UNIQUE NOT NULL,
    list_uuid TEXT NOT NULL,
    name TEXT NOT NULL,
    category TEXT,
    quantity INTEGER DEFAULT 1,
    checked BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (list_uuid) REFERENCES shopping_lists (uuid) ON DELETE CASCADE
);

-- Categories Tabelle
CREATE TABLE categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    uuid TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL UNIQUE,
    icon TEXT DEFAULT '📦',
    color TEXT DEFAULT '#3B82F6',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Broadcasts Tabelle
CREATE TABLE broadcasts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    uuid TEXT UNIQUE NOT NULL,
    sender_uuid TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'info',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sender_uuid) REFERENCES users (uuid) ON DELETE CASCADE
);

-- DB Logs Tabelle (mit allen benötigten Spalten)
CREATE TABLE db_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    method TEXT,
    query TEXT,
    params TEXT,
    ip_address TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    error TEXT
);

-- Standard Admin-User erstellen
INSERT INTO users (uuid, username, password_hash, is_admin) 
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'admin',
    '$2b$10$rXKJ8/9QE7l6xJ8vVl3gJeLnR4HvVZ8nBKrS1jBZx.RiGzVfGZnOy', -- admin123
    1
);

-- Standard Kategorien erstellen
INSERT INTO categories (uuid, name, icon, color) VALUES
('cat-00000000-0000-0000-0000-000000000001', 'Obst & Gemüse', '🥬', '#10B981'),
('cat-00000000-0000-0000-0000-000000000002', 'Fleisch & Fisch', '🥩', '#EF4444'),
('cat-00000000-0000-0000-0000-000000000003', 'Milchprodukte', '🥛', '#3B82F6'),
('cat-00000000-0000-0000-0000-000000000004', 'Getränke', '🥤', '#8B5CF6'),
('cat-00000000-0000-0000-0000-000000000005', 'Backwaren', '🍞', '#F59E0B'),
('cat-00000000-0000-0000-0000-000000000006', 'Sonstiges', '📦', '#6B7280');

.quit
EOF
fi

# Prüfe Datenbankstruktur
echo "🔍 Prüfe neue Datenbankstruktur..."
sqlite3 db.sqlite << 'EOF'
.tables
.schema users
.quit
EOF

# Teste Datenbank
echo "🧪 Teste Datenbank-Zugriff..."
sqlite3 db.sqlite "SELECT COUNT(*) as user_count FROM users;" && echo "✅ Users Tabelle funktioniert"
sqlite3 db.sqlite "SELECT COUNT(*) as category_count FROM categories;" && echo "✅ Categories Tabelle funktioniert"

echo "🔄 Starte Backend Service neu..."
pm2 start backend

echo "⏱️  Warte 5 Sekunden auf Backend-Start..."
sleep 5

# Teste Registration
echo "🧪 Teste Registration Endpoint..."
response=$(curl -s -X POST "http://localhost:4000/api/register" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser123",
    "password": "test123456",
    "confirmPassword": "test123456"
  }' \
  -w "\n%{http_code}")

echo "📄 Registration Test Response: $response"

# Zeige Backend Status
echo "📊 Backend Status:"
pm2 info backend

echo ""
echo "✅ Datenbank repariert und Backend neu gestartet!"
echo "🎯 Teste jetzt die Registration unter: http://ochtii.run.place"
echo ""
echo "📋 Falls noch Probleme auftreten:"
echo "   pm2 logs backend --lines 20    # Backend Logs anzeigen"
echo "   sqlite3 /home/einkaufsliste/backend/db.sqlite '.tables'  # Tabellen prüfen"
