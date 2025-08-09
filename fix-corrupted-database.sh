#!/bin/bash

echo "🔧 Fixing corrupted SQLite database..."

# Navigate to backend directory
cd "$(dirname "$0")/backend" || exit 1

# Backup corrupted database
if [ -f "db.sqlite" ]; then
    echo "📦 Backing up corrupted database..."
    mv db.sqlite db.sqlite.corrupted.$(date +%Y%m%d_%H%M%S)
fi

# Remove WAL and SHM files
rm -f db.sqlite-wal db.sqlite-shm

echo "🔄 Creating new database..."

# Use Node.js to recreate database with emergency script
node -e "
import { open } from 'sqlite';
import sqlite3 from 'sqlite3';
import bcrypt from 'bcrypt';
import crypto from 'crypto';

async function recreateDatabase() {
  try {
    const db = await open({
      filename: './db.sqlite',
      driver: sqlite3.Database
    });

    console.log('✅ Creating fresh database...');

    // Users table
    await db.exec(\`
      CREATE TABLE users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        uuid TEXT UNIQUE NOT NULL,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        is_admin BOOLEAN DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    \`);

    // Shopping lists table
    await db.exec(\`
      CREATE TABLE shopping_lists (
        uuid TEXT PRIMARY KEY,
        user_uuid TEXT NOT NULL,
        name TEXT NOT NULL,
        icon TEXT DEFAULT '🛒',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_uuid) REFERENCES users (uuid) ON DELETE CASCADE
      );
    \`);

    // Articles table
    await db.exec(\`
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
    \`);

    // Favorites table
    await db.exec(\`
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
    \`);

    // Standard articles table
    await db.exec(\`
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
    \`);

    // Categories table
    await db.exec(\`
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
    \`);

    // Broadcasts table
    await db.exec(\`
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
    \`);

    // Broadcast confirmations table
    await db.exec(\`
      CREATE TABLE broadcast_confirmations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        broadcast_id INTEGER NOT NULL,
        user_uuid TEXT NOT NULL,
        confirmed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (broadcast_id) REFERENCES broadcasts (id) ON DELETE CASCADE,
        FOREIGN KEY (user_uuid) REFERENCES users (uuid) ON DELETE CASCADE,
        UNIQUE(broadcast_id, user_uuid)
      );
    \`);

    // Database logs table
    await db.exec(\`
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
    \`);

    console.log('✅ Tables created successfully');

    // Insert default categories
    await db.exec(\`
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
    \`);

    // Insert default standard articles
    await db.exec(\`
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
      ('Hähnchen', 'Fleisch', '🐔', 1),
      ('Lachs', 'Fisch', '🐟', 1),
      ('Orangensaft', 'Getränke', '🍊', 1),
      ('Wasser', 'Getränke', '💧', 1),
      ('Zucker', 'Zutaten', '🍯', 1),
      ('Mehl', 'Getreideprodukte', '🌾', 1),
      ('Kaffee', 'Getränke', '☕', 1);
    \`);

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

    await db.close();
    console.log('✅ Database recreated successfully!');
    console.log('📋 Admin: admin / admin123');
    console.log('📋 Test: test / test123');

  } catch (error) {
    console.error('❌ Error recreating database:', error);
    process.exit(1);
  }
}

recreateDatabase();
"

echo "✅ Database fixed! Restarting services..."

# Restart PM2 services if available
if command -v pm2 >/dev/null 2>&1; then
    pm2 restart einkaufsliste-backend 2>/dev/null || echo "⚠️  PM2 service not found, manual restart needed"
fi

echo "🎉 Database corruption fixed!"
echo "📋 Login credentials:"
echo "   Admin: admin / admin123"
echo "   Test: test / test123"
