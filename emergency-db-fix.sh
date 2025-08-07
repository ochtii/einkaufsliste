#!/bin/bash

# Sofortiges Database Fix - Emergency Repair

echo "🚨 NOTFALL Database Reparatur..."

# Stoppe alle Services sofort
echo "Stoppe alle Services..."
pm2 delete all 2>/dev/null || true
pkill -f "node server.js" 2>/dev/null || true
pkill -f "npm start" 2>/dev/null || true

# Gehe ins Backend Verzeichnis
cd /home/ubuntu/einkaufsliste/backend

# Lösche ALLE Database Dateien
echo "Lösche korrupte Database..."
rm -f db.sqlite*

# Erstelle neue Database mit Node.js (nutzt das Backend Schema)
echo "Erstelle neue Database..."
# 3. Erstelle neue Database mit ES Module Syntax
print_info "Erstelle neue Database mit ES Module Syntax..."

cat > create_db_esm.js << 'EOF'
import { open } from 'sqlite';
import sqlite3 from 'sqlite3';
import bcrypt from 'bcrypt';
import crypto from 'crypto';

async function createDB() {
  console.log('Creating new database...');
  
  const db = await open({
    filename: './db.sqlite',
    driver: sqlite3.Database
  });

  // Drop all tables if they exist
  await db.exec('DROP TABLE IF EXISTS db_logs');
  await db.exec('DROP TABLE IF EXISTS broadcast_confirmations');
  await db.exec('DROP TABLE IF EXISTS broadcasts');
  await db.exec('DROP TABLE IF EXISTS favorites');
  await db.exec('DROP TABLE IF EXISTS articles');
  await db.exec('DROP TABLE IF EXISTS standard_articles');
  await db.exec('DROP TABLE IF EXISTS categories');
  await db.exec('DROP TABLE IF EXISTS shopping_lists');
  await db.exec('DROP TABLE IF EXISTS users');

  // Create users table
  await db.exec(`
    CREATE TABLE users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      uuid TEXT UNIQUE NOT NULL,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      is_admin BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Create shopping_lists table
  await db.exec(`
    CREATE TABLE shopping_lists (
      uuid TEXT PRIMARY KEY,
      user_uuid TEXT NOT NULL,
      name TEXT NOT NULL,
      icon TEXT DEFAULT '🛒',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_uuid) REFERENCES users (uuid) ON DELETE CASCADE
    );
  `);

  // Create articles table
  await db.exec(`
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
  `);

  // Create favorites table
  await db.exec(`
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
  `);

  // Create standard_articles table with is_global column
  await db.exec(`
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
  `);

  // Create categories table with is_global column
  await db.exec(`
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
  `);

  // Create broadcasts table
  await db.exec(`
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
  `);

  // Create broadcast_confirmations table
  await db.exec(`
    CREATE TABLE broadcast_confirmations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      broadcast_id INTEGER NOT NULL,
      user_uuid TEXT NOT NULL,
      confirmed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (broadcast_id) REFERENCES broadcasts (id) ON DELETE CASCADE,
      FOREIGN KEY (user_uuid) REFERENCES users (uuid) ON DELETE CASCADE,
      UNIQUE(broadcast_id, user_uuid)
    );
  `);

  // Create db_logs table
  await db.exec(`
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
  `);

  // Insert default categories with is_global = 1
  await db.exec(`
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
  `);

  // Insert default standard articles with is_global = 1
  await db.exec(`
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
  `);

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 10);
  const adminUuid = crypto.randomUUID();
  await db.run(
    'INSERT INTO users (uuid, username, password_hash, is_admin) VALUES (?, ?, ?, 1)',
    adminUuid, 'admin', adminPassword
  );

  // Create test user
  const testPassword = await bcrypt.hash('test123', 10);
  const testUuid = crypto.randomUUID();
  await db.run(
    'INSERT INTO users (uuid, username, password_hash, is_admin) VALUES (?, ?, ?, 0)',
    testUuid, 'test', testPassword
  );

  // Create default shopping list for test user
  const listUuid = crypto.randomUUID();
  await db.run(
    'INSERT INTO shopping_lists (uuid, user_uuid, name, icon) VALUES (?, ?, ?, ?)',
    listUuid, testUuid, 'Meine Einkaufsliste', '🛒'
  );

  console.log('✅ Database created successfully!');
  console.log('Users:', await db.get('SELECT COUNT(*) as count FROM users'));
  console.log('Categories:', await db.get('SELECT COUNT(*) as count FROM categories'));
  console.log('Standard Articles:', await db.get('SELECT COUNT(*) as count FROM standard_articles'));
  
  // Show created users for debugging
  const users = await db.all('SELECT username, is_admin FROM users');
  console.log('Created users:', users);
  
  await db.close();
}

createDB().catch(console.error);
EOF

# Führe das Database Creation Script aus
node create_db_esm.js

if [ $? -eq 0 ]; then
    echo "✅ Database erfolgreich erstellt!"
    
    # Lösche das temporäre Script
    rm create_db_esm.js
    
    # Starte Backend
    echo "Starte Backend..."
    pm2 start "npm start" --name "backend"
    
    sleep 3
    
    # Starte Frontend
    echo "Starte Frontend..."
    cd /home/ubuntu/einkaufsliste/frontend
    pm2 start "npm start" --name "frontend"
    
    sleep 3
    
    # Starte API
    echo "Starte API..."
    cd /home/ubuntu/einkaufsliste/api
    pm2 start "python3 admin_server.py" --name "api"
    
    sleep 5
    
    # Zurück zum Backend für Tests
    cd /home/ubuntu/einkaufsliste/backend
    
    # Teste alle Services
    echo "Teste Services..."
    
    # Backend Test
    backend_status=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:4000/api/captcha" 2>/dev/null || echo "000")
    if [ "$backend_status" = "200" ]; then
        echo "✅ Backend läuft! (HTTP $backend_status)"
    else
        echo "❌ Backend Problem (HTTP $backend_status)"
        pm2 logs backend --lines 5 --nostream
    fi
    
    # API Test
    api_status=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:5000/api/stats" 2>/dev/null || echo "000")
    if [ "$api_status" = "200" ]; then
        echo "✅ API läuft! (HTTP $api_status)"
    else
        echo "❌ API Problem (HTTP $api_status)"
        pm2 logs api --lines 5 --nostream
    fi
    
    # Frontend Test
    frontend_status=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000" 2>/dev/null || echo "000")
    if [ "$frontend_status" = "200" ]; then
        echo "✅ Frontend läuft! (HTTP $frontend_status)"
    else
        echo "⚠️ Frontend Problem (HTTP $frontend_status) - Möglicherweise noch nicht bereit"
    fi
else
    echo "❌ Database Creation fehlgeschlagen!"
    exit 1
fi

echo "🎉 Emergency Repair abgeschlossen!"
echo "Login: admin / admin123"
echo "Test: test / test123"
