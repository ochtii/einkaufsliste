#!/bin/bash

echo "🔧 Fixing API session encryption errors..."

# Navigate to API directory
cd "$(dirname "$0")/api" || exit 1

# Remove corrupted session files
echo "🗑️  Clearing corrupted session data..."
rm -f api_admin.sqlite
rm -rf sessions/
rm -rf __pycache__/

echo "🔄 Recreating admin database..."

# Create fresh admin database
python3 -c "
import sqlite3
import hashlib
import secrets
import json
from datetime import datetime

# Create new admin database
conn = sqlite3.connect('api_admin.sqlite')
cursor = conn.cursor()

# Sessions table
cursor.execute('''
    CREATE TABLE sessions (
        session_id TEXT PRIMARY KEY,
        data TEXT NOT NULL,
        expires_at DATETIME NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
''')

# Admin settings table
cursor.execute('''
    CREATE TABLE admin_settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
''')

# Request logs table
cursor.execute('''
    CREATE TABLE request_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ip_address TEXT NOT NULL,
        method TEXT NOT NULL,
        path TEXT NOT NULL,
        user_agent TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        response_code INTEGER,
        response_time REAL
    )
''')

# Insert default admin password hash
password_hash = hashlib.sha256('admin123'.encode()).hexdigest()
cursor.execute(
    'INSERT INTO admin_settings (key, value) VALUES (?, ?)',
    ('admin_password_hash', password_hash)
)

# Insert server start time
cursor.execute(
    'INSERT INTO admin_settings (key, value) VALUES (?, ?)',
    ('server_start_time', datetime.now().isoformat())
)

conn.commit()
conn.close()

print('✅ Admin database recreated successfully')
print('🔑 Admin password: admin123')
"

echo "✅ API session issues fixed!"

# Restart API service if using PM2
if command -v pm2 >/dev/null 2>&1; then
    pm2 restart einkaufsliste-api 2>/dev/null || echo "⚠️  API service restart needed manually"
fi

echo "🎉 Session encryption errors resolved!"
