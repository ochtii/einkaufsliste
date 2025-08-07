#!/bin/bash

# Quick Database Check

echo "🔍 Database Diagnose..."

cd /home/ubuntu/einkaufsliste/backend

# Check if database exists
if [ ! -f "db.sqlite" ]; then
    echo "❌ Database existiert nicht!"
    exit 1
fi

echo "✅ Database existiert"

# Create quick check script
cat > check_db.js << 'EOF'
import { open } from 'sqlite';
import sqlite3 from 'sqlite3';

async function checkDatabase() {
    try {
        const db = await open({
            filename: './db.sqlite',
            driver: sqlite3.Database
        });

        console.log('🔍 Database Check:');
        
        // Check users table
        const users = await db.all('SELECT username, is_admin, password_hash IS NOT NULL as has_password FROM users');
        console.log('Users:', users);
        
        // Check specific user
        const testUser = await db.get('SELECT * FROM users WHERE username = ?', 'test');
        console.log('Test user details:', testUser ? 'Found' : 'Not found');
        if (testUser) {
            console.log('- Username:', testUser.username);
            console.log('- Has password_hash:', !!testUser.password_hash);
            console.log('- Password_hash length:', testUser.password_hash ? testUser.password_hash.length : 0);
        }
        
        await db.close();
        console.log('✅ Database check completed');
    } catch (error) {
        console.error('❌ Database error:', error.message);
    }
}

checkDatabase();
EOF

node check_db.js
rm check_db.js
