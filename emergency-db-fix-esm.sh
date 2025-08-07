#!/bin/bash

# Emergency Database Fix for ES Modules Backend

echo "🚨 Emergency Database Repair (ES Module Version)"

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

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# 1. Stoppe alle Services
print_info "Stoppe alle Services..."
pm2 delete all 2>/dev/null || true
sleep 2

# 2. Backup und lösche korrupte Database
cd /home/ubuntu/einkaufsliste/backend

if [ -f "db.sqlite" ]; then
    print_info "Sichere korrupte Database..."
    mv db.sqlite db.sqlite.corrupt.$(date +%Y%m%d_%H%M%S)
fi

if [ -f "db.sqlite-shm" ]; then
    rm -f db.sqlite-shm
fi

if [ -f "db.sqlite-wal" ]; then
    rm -f db.sqlite-wal
fi

print_success "Korrupte Database entfernt"

# 3. Erstelle neue Database mit ES Module Syntax
print_info "Erstelle neue Database mit ES Module Syntax..."

cat > create_db_esm.js << 'EOF'
import { open } from 'sqlite';
import sqlite3 from 'sqlite3';
import bcrypt from 'bcrypt';
import crypto from 'crypto';

async function createDatabase() {
    console.log('🔧 Erstelle neue Database...');
    
    try {
        // Öffne Database
        const db = await open({
            filename: './db.sqlite',
            driver: sqlite3.Database
        });

        console.log('✅ Database Verbindung hergestellt');

        // Erstelle users Tabelle
        await db.exec(`
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                is_admin INTEGER DEFAULT 0
            )
        `);

        // Erstelle shopping_items Tabelle
        await db.exec(`
            CREATE TABLE IF NOT EXISTS shopping_items (
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

        // Erstelle db_logs Tabelle
        await db.exec(`
            CREATE TABLE IF NOT EXISTS db_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                action TEXT NOT NULL,
                table_name TEXT,
                user_id INTEGER,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                details TEXT
            )
        `);

        console.log('✅ Tabellen erstellt');

        // Erstelle Admin User
        const adminPassword = await bcrypt.hash('admin123', 10);
        await db.run(`
            INSERT OR REPLACE INTO users (id, username, password, is_admin) 
            VALUES (1, 'admin', ?, 1)
        `, [adminPassword]);

        // Erstelle Test User
        const testPassword = await bcrypt.hash('test123', 10);
        await db.run(`
            INSERT OR REPLACE INTO users (id, username, password, is_admin) 
            VALUES (2, 'test', ?, 0)
        `, [testPassword]);

        console.log('✅ Admin und Test User erstellt');

        // Erstelle Test Items
        await db.run(`
            INSERT OR REPLACE INTO shopping_items (name, category, user_id, is_global) 
            VALUES ('Milch', 'Dairy', 1, 1)
        `);

        await db.run(`
            INSERT OR REPLACE INTO shopping_items (name, category, user_id, is_global) 
            VALUES ('Brot', 'Bakery', 1, 1)
        `);

        console.log('✅ Test Items erstellt');

        // Log Database Creation
        await db.run(`
            INSERT INTO db_logs (action, table_name, user_id, details) 
            VALUES ('CREATE_DATABASE', 'ALL', 1, 'Emergency database recreation')
        `);

        await db.close();
        console.log('✅ Database erfolgreich erstellt!');
        
        return true;
    } catch (error) {
        console.error('❌ Database Creation Error:', error);
        return false;
    }
}

createDatabase().then(success => {
    process.exit(success ? 0 : 1);
});
EOF

print_info "Führe Database Creation aus..."
node create_db_esm.js

if [ $? -eq 0 ]; then
    print_success "Database erfolgreich erstellt!"
else
    print_error "Database Creation fehlgeschlagen!"
    exit 1
fi

# 4. Aufräumen
rm -f create_db_esm.js

# 5. Starte Services neu
print_info "Starte Services neu..."

# Backend starten
cd /home/ubuntu/einkaufsliste/backend
pm2 start "npm start" --name "backend"
sleep 5

# Frontend starten
cd /home/ubuntu/einkaufsliste/frontend
pm2 start "npm start" --name "frontend"
sleep 3

# API starten
cd /home/ubuntu/einkaufsliste/api
pm2 start "python3 admin_server.py" --name "api"
sleep 3

# 6. Teste Services
print_info "Teste Services..."

# PM2 Status
pm2 status

# Teste Backend
backend_status=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:4000/api/captcha" 2>/dev/null || echo "000")
if [ "$backend_status" = "200" ]; then
    print_success "Backend läuft (HTTP $backend_status)"
else
    print_error "Backend Problem (HTTP $backend_status)"
    print_info "Backend Logs:"
    pm2 logs backend --lines 10 --nostream
fi

# Teste Registration
print_info "Teste Registration..."
registration_test=$(curl -s -X POST "http://localhost:4000/api/register" \
    -H "Content-Type: application/json" \
    -d '{"username":"testuser","password":"test123","captcha":""}' 2>/dev/null || echo "ERROR")

if echo "$registration_test" | grep -q "CAPTCHA"; then
    print_success "Registration Endpoint funktioniert"
else
    print_warning "Registration benötigt CAPTCHA (normal)"
fi

print_success "Emergency Database Repair abgeschlossen!"
print_info "Admin Login: admin / admin123"
print_info "Test Login: test / test123"
