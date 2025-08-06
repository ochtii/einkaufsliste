import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import crypto from 'crypto';

async function migrate() {
  const db = await open({
    filename: './db.sqlite',
    driver: sqlite3.Database
  });

  try {
    // Check current schema
    console.log('Current users table schema:');
    const schema = await db.get("SELECT sql FROM sqlite_master WHERE type='table' AND name='users'");
    console.log(schema?.sql || 'Table does not exist');

    // Check existing columns
    const columns = await db.all("PRAGMA table_info(users)");
    console.log('\nExisting columns:');
    columns.forEach(col => console.log(`- ${col.name} (${col.type})`));

    // Check if uuid column exists
    const hasUuid = columns.some(col => col.name === 'uuid');
    const hasIsAdmin = columns.some(col => col.name === 'is_admin');

    console.log(`\nUUID column exists: ${hasUuid}`);
    console.log(`is_admin column exists: ${hasIsAdmin}`);

    // Add missing columns
    if (!hasUuid) {
      console.log('\nAdding uuid column...');
      await db.exec('ALTER TABLE users ADD COLUMN uuid TEXT');
      console.log('UUID column added successfully');
    }

    if (!hasIsAdmin) {
      console.log('\nAdding is_admin column...');
      await db.exec('ALTER TABLE users ADD COLUMN is_admin BOOLEAN DEFAULT 0');
      console.log('is_admin column added successfully');
    }

    // Update existing users with UUIDs if they don't have them
    const usersWithoutUuid = await db.all('SELECT id FROM users WHERE uuid IS NULL OR uuid = ""');
    console.log(`\nUsers missing UUID: ${usersWithoutUuid.length}`);
    
    for (const user of usersWithoutUuid) {
      const userUuid = crypto.randomUUID();
      await db.run('UPDATE users SET uuid = ? WHERE id = ?', userUuid, user.id);
      console.log(`Updated user ${user.id} with UUID ${userUuid}`);
    }

    // Show final schema
    console.log('\nFinal users table schema:');
    const finalSchema = await db.get("SELECT sql FROM sqlite_master WHERE type='table' AND name='users'");
    console.log(finalSchema?.sql);

    // Show all users
    console.log('\nAll users:');
    const users = await db.all('SELECT id, username, uuid, is_admin FROM users');
    console.table(users);

  } catch (error) {
    console.error('Migration error:', error);
  } finally {
    await db.close();
  }
}

migrate();
