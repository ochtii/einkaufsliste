#!/bin/bash

# Quick Emergency Database Fix with ES Module Syntax

echo "🚨 Quick Database Fix"

# Farben
RED='\033[0;31m'
GREEN='\033[0;32m'
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

print_info "Stoppe alle Services..."
pm2 delete all 2>/dev/null || true
sleep 2

print_info "Backup und lösche korrupte Database..."
cd /home/ubuntu/einkaufsliste/backend

if [ -f "db.sqlite" ]; then
    mv db.sqlite db.sqlite.corrupt.backup
    print_success "Database gesichert"
fi

rm -f db.sqlite-shm db.sqlite-wal

print_info "Erstelle neue Database..."

# Erstelle ES Module Script
cat > fix_db.js << 'EOF'
import { open } from 'sqlite';
import sqlite3 from 'sqlite3';
import bcrypt from 'bcrypt';

async function createDatabase() {
    try {
        const db = await open({
            filename: './db.sqlite',
            driver: sqlite3.Database
        });

        // Users Table
        await db.exec(`
            CREATE TABLE users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                is_admin INTEGER DEFAULT 0
            )
        `);

        // Shopping Items Table
        await db.exec(`
            CREATE TABLE shopping_items (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                category TEXT,
                user_id INTEGER,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                is_global INTEGER DEFAULT 0,
                FOREIGN KEY (user_id) REFERENCES users (id)
            )
        `);

        // Logs Table
        await db.exec(`
            CREATE TABLE db_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                action TEXT NOT NULL,
                table_name TEXT,
                user_id INTEGER,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                details TEXT
            )
        `);

        // Admin User
        const adminPassword = await bcrypt.hash('admin123', 10);
        await db.run(
            'INSERT INTO users (username, password, is_admin) VALUES (?, ?, ?)',
            ['admin', adminPassword, 1]
        );

        // Test User
        const testPassword = await bcrypt.hash('test123', 10);
        await db.run(
            'INSERT INTO users (username, password, is_admin) VALUES (?, ?, ?)',
            ['test', testPassword, 0]
        );

        // Test Items
        await db.run(
            'INSERT INTO shopping_items (name, category, user_id, is_global) VALUES (?, ?, ?, ?)',
            ['Milch', 'Dairy', 1, 1]
        );

        await db.close();
        console.log('✅ Database created successfully!');
        return true;
    } catch (error) {
        console.error('❌ Error:', error.message);
        return false;
    }
}

createDatabase().then(success => process.exit(success ? 0 : 1));
EOF

node fix_db.js

if [ $? -eq 0 ]; then
    print_success "Database erfolgreich erstellt!"
    rm -f fix_db.js
    
    print_info "Starte Backend..."
    pm2 start "npm start" --name "backend"
    sleep 5
    
    print_info "Teste Backend..."
    backend_status=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:4000/api/captcha" 2>/dev/null || echo "000")
    
    if [ "$backend_status" = "200" ]; then
        print_success "Backend läuft! (HTTP $backend_status)"
        print_success "Admin: admin / admin123"
        print_success "Test: test / test123"
    else
        print_error "Backend Problem (HTTP $backend_status)"
        pm2 logs backend --lines 5 --nostream
    fi
else
    print_error "Database Creation fehlgeschlagen!"
    rm -f fix_db.js
    exit 1
fi
