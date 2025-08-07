import express from 'express';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import cors from 'cors';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Server start time for uptime calculation
const serverStartTime = Date.now();

async function initDb() {
  const db = await open({
    filename: './db.sqlite',
    driver: sqlite3.Database
  });
  
  // Users table (compatible with existing databases)
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
  
  // Add missing columns if they don't exist (for existing databases)
  try {
    await db.exec(`ALTER TABLE users ADD COLUMN uuid TEXT;`);
  } catch (error) {
    // Column already exists, ignore error
  }
  
  try {
    await db.exec(`ALTER TABLE users ADD COLUMN is_admin BOOLEAN DEFAULT 0;`);
  } catch (error) {
    // Column already exists, ignore error
  }
  
  // Shopping lists table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS shopping_lists (
      uuid TEXT PRIMARY KEY,
      user_uuid TEXT NOT NULL,
      name TEXT NOT NULL,
      icon TEXT DEFAULT '🛒',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_uuid) REFERENCES users (uuid) ON DELETE CASCADE
    );
  `);
  
  // Migration: Add UUIDs to existing shopping_lists (skip for new tables)
  // New tables already have UUID schema  // Articles table (erweitert)
  await db.exec(`
    CREATE TABLE IF NOT EXISTS articles (
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
  
  // Migration: Add UUIDs to existing articles (skip for new tables)
  // New tables already have UUID schema
  
  // Favorites table (separate)
  await db.exec(`
    CREATE TABLE IF NOT EXISTS favorites (
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
  
  // Migration: Add UUIDs to existing favorites (skip for new tables)
  // New tables already have UUID schema
  
  // Standard articles table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS standard_articles (
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
  
  // Categories table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS categories (
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
  
  // Migration: Add UUIDs to existing categories (skip for new tables)  
  // New tables already have UUID schema
  
    // Broadcasts table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS broadcasts (
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
  
  // Broadcast confirmations table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS broadcast_confirmations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      broadcast_id INTEGER NOT NULL,
      user_uuid TEXT NOT NULL,
      confirmed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (broadcast_id) REFERENCES broadcasts (id) ON DELETE CASCADE,
      FOREIGN KEY (user_uuid) REFERENCES users (uuid) ON DELETE CASCADE,
      UNIQUE(broadcast_id, user_uuid)
    );
  `);

  // Database log table for admin monitoring
  await db.exec(`
    CREATE TABLE IF NOT EXISTS db_logs (
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
  
  // Check if default data already exists to prevent duplicates
  const existingArticles = await db.get('SELECT COUNT(*) as count FROM standard_articles WHERE is_global = 1');
  const existingCategories = await db.get('SELECT COUNT(*) as count FROM categories WHERE is_global = 1');
  
  // Insert default global standard articles only if none exist
  if (existingArticles.count === 0) {
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
  }
  
  // Insert default global categories only if none exist
  if (existingCategories.count === 0) {
    await db.exec(`
      INSERT INTO categories (name, icon, is_global) VALUES
      ('Obst', '🍎', 1),
      ('Gemüse', '🥕', 1),
      ('Milchprodukte', '🥛', 1),
      ('Fleisch', '🥩', 1),
      ('Fisch', '🐟', 1),
      ('Getreideprodukte', '🍞', 1),
      ('Getränke', '🥤', 1),
      ('Zutaten', '🧂', 1),
      ('Tiefkühl', '🧊', 1),
      ('Süßwaren', '🍭', 1),
      ('Haushalt', '🧽', 1),
      ('Körperpflege', '🧴', 1),
      ('Sonstiges', '📦', 1);
    `);
  }

  // Migration: Add UUIDs to existing users
  try {
    const usersMissingUuid = await db.all('SELECT id FROM users WHERE uuid IS NULL');
    for (const user of usersMissingUuid) {
      const userUuid = crypto.randomUUID();
      await db.run('UPDATE users SET uuid = ? WHERE id = ?', userUuid, user.id);
    }
  } catch (error) {
    console.log('UUID migration completed or not needed');
  }
  
  // Add UUID columns to remaining tables that still use old schema
  try {
    await db.exec(`ALTER TABLE standard_articles ADD COLUMN user_uuid TEXT;`);
  } catch (error) {
    // Column already exists, ignore error
  }
  try {
    await db.exec(`ALTER TABLE broadcast_confirmations ADD COLUMN user_uuid TEXT;`);
  } catch (error) {
    // Column already exists, ignore error
  }
  try {
    await db.exec(`ALTER TABLE db_logs ADD COLUMN user_uuid TEXT;`);
  } catch (error) {
    // Column already exists, ignore error
  }
  
  // Migration: Update remaining foreign key relationships to UUIDs
  try {
    // Update standard_articles.user_uuid based on user_id
    await db.exec(`
      UPDATE standard_articles 
      SET user_uuid = (SELECT uuid FROM users WHERE users.id = standard_articles.user_id)
      WHERE user_uuid IS NULL AND user_id IS NOT NULL
    `);
    
    // Update broadcast_confirmations.user_uuid based on user_id
    await db.exec(`
      UPDATE broadcast_confirmations 
      SET user_uuid = (SELECT uuid FROM users WHERE users.id = broadcast_confirmations.user_id)
      WHERE user_uuid IS NULL AND user_id IS NOT NULL
    `);
    
    // Update db_logs.user_uuid based on user_id
    await db.exec(`
      UPDATE db_logs 
      SET user_uuid = (SELECT uuid FROM users WHERE users.id = db_logs.user_id)
      WHERE user_uuid IS NULL AND user_id IS NOT NULL
    `);
    
    console.log('Remaining UUID migration completed');
  } catch (error) {
    console.log('Remaining UUID migration completed or not needed');
  }
  
  // Create default admin user if not exists
  try {
    const adminUser = await db.get('SELECT id FROM users WHERE username = ? AND is_admin = 1', 'admin');
    if (!adminUser) {
      const adminPassword = await bcrypt.hash('admin123', 10);
      const adminUuid = crypto.randomUUID();
      await db.run(
        'INSERT OR REPLACE INTO users (uuid, username, password_hash, is_admin) VALUES (?, ?, ?, 1)',
        adminUuid, 'admin', adminPassword
      );
      console.log('Default admin user created: admin/admin123');
    }
  } catch (error) {
    console.log('Admin user creation failed:', error.message);
  }
  
  return db;
}

// Middleware für JWT Authentication
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
}

// Database logging middleware
async function logDatabaseOperation(method, query, params, responseTime, error, userUuid, ipAddress) {
  try {
    const db = await initDb();
    await db.run(`
      INSERT INTO db_logs (method, query, params, response_time, error, user_uuid, ip_address)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      method,
      query.substring(0, 1000), // Limit query length
      params ? JSON.stringify(params).substring(0, 500) : null,
      responseTime,
      error ? error.substring(0, 500) : null,
      userUuid,
      ipAddress
    ]);
  } catch (logError) {
    console.error('Error logging database operation:', logError);
  }
}

// Enhanced database wrapper with logging
async function executeQuery(method, query, params, userUuid, ipAddress) {
  const startTime = Date.now();
  let error = null;
  let result = null;

  try {
    const db = await initDb();
    if (method === 'run') {
      result = await db.run(query, params);
    } else if (method === 'get') {
      result = await db.get(query, params);
    } else if (method === 'all') {
      result = await db.all(query, params);
    }
  } catch (err) {
    error = err.message;
    throw err;
  } finally {
    const responseTime = Date.now() - startTime;
    await logDatabaseOperation(method, query, params, responseTime, error, userUuid, ipAddress);
  }

  return result;
}

// Simple CAPTCHA generation
function generateCaptcha() {
  const num1 = Math.floor(Math.random() * 10) + 1;
  const num2 = Math.floor(Math.random() * 10) + 1;
  const operation = Math.random() > 0.5 ? '+' : '-';
  const answer = operation === '+' ? num1 + num2 : Math.max(num1, num2) - Math.min(num1, num2);
  
  return {
    question: `${Math.max(num1, num2)} ${operation} ${Math.min(num1, num2)} = ?`,
    answer: answer
  };
}

async function main() {
  const app = express();
  app.use(cors());
  app.use(express.json());
  
  // API Debug Logging Middleware
  app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
    
    console.log(`🔍 [${timestamp}] ${req.method} ${req.originalUrl}`);
    console.log(`   📍 Client IP: ${clientIP}`);
    console.log(`   📋 Headers: ${JSON.stringify(req.headers, null, 2)}`);
    
    if (req.body && Object.keys(req.body).length > 0) {
      // Mask sensitive data in logs
      const sanitizedBody = { ...req.body };
      if (sanitizedBody.password) sanitizedBody.password = '***';
      if (sanitizedBody.confirmPassword) sanitizedBody.confirmPassword = '***';
      console.log(`   📦 Body: ${JSON.stringify(sanitizedBody, null, 2)}`);
    }
    
    // Log response when it's sent
    const originalSend = res.send;
    res.send = function(data) {
      const responseTime = Date.now() - req.startTime;
      console.log(`   ✅ Response: ${res.statusCode} | Time: ${responseTime}ms`);
      if (data && typeof data === 'string' && data.length < 500) {
        console.log(`   📤 Response Data: ${data}`);
      } else if (data) {
        console.log(`   📤 Response Data: [${typeof data}] ${data.length || 'N/A'} bytes`);
      }
      console.log(`   ───────────────────────────────────────────────────`);
      originalSend.call(this, data);
    };
    
    req.startTime = Date.now();
    next();
  });
  
  const db = await initDb();

  // Clear all existing sessions on server restart
  console.log('🔄 Server gestartet - Alle bestehenden Sessions werden gelöscht...');
  
  // Create a simple in-memory blacklist for existing tokens (in production use Redis)
  const tokenBlacklist = new Set();
  
  // Enhanced JWT middleware with blacklist check
  function authenticateTokenWithBlacklist(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    if (tokenBlacklist.has(token)) {
      return res.status(401).json({ error: 'Token invalidated' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
      if (err) {
        return res.status(403).json({ error: 'Invalid token' });
      }
      req.user = user;
      next();
    });
  }

  // CAPTCHA endpoint
  app.get('/api/captcha', (req, res) => {
    const captcha = generateCaptcha();
    const captchaId = crypto.randomBytes(16).toString('hex');
    
    // In production, store this in Redis or database with expiration
    // For now, we'll send it back and verify in registration
    res.json({ 
      captchaId,
      question: captcha.question,
      // Don't send answer to client, but we'll include it for simple demo
      // In production, store this server-side
      answer: captcha.answer 
    });
  });

  // User registration
  app.post('/api/register', async (req, res) => {
    try {
      const { username, password, confirmPassword, captchaAnswer, captchaExpected } = req.body;

      // Validate input
      if (!username || !password || !confirmPassword) {
        return res.status(400).json({ error: 'Alle Felder sind erforderlich' });
      }

      if (password !== confirmPassword) {
        return res.status(400).json({ error: 'Passwörter stimmen nicht überein' });
      }

      if (password.length < 6) {
        return res.status(400).json({ error: 'Passwort muss mindestens 6 Zeichen lang sein' });
      }

      // Simple captcha verification
      if (parseInt(captchaAnswer) !== parseInt(captchaExpected)) {
        return res.status(400).json({ error: 'CAPTCHA ist falsch' });
      }

      // Check if username exists
      const existingUser = await executeQuery('get', 'SELECT id FROM users WHERE username = ?', [username], null, req.ip);
      if (existingUser) {
        return res.status(400).json({ error: 'Benutzername bereits vergeben' });
      }

      // Hash password
      const saltRounds = 10;
      const passwordHash = await bcrypt.hash(password, saltRounds);

      // Generate unique user ID
      const userUuid = crypto.randomUUID();

      // Create user
      const result = await db.run(
        'INSERT INTO users (uuid, username, password_hash) VALUES (?, ?, ?)',
        userUuid, username, passwordHash
      );

      // Create default shopping list
      const listUuid = crypto.randomUUID();
      await db.run(
        'INSERT INTO shopping_lists (uuid, user_uuid, name, icon) VALUES (?, ?, ?, ?)',
        listUuid, userUuid, 'Meine Einkaufsliste', '🛒'
      );

      res.status(201).json({ message: 'Benutzer erfolgreich registriert' });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ error: 'Registrierung fehlgeschlagen' });
    }
  });

  // User login
  app.post('/api/login', async (req, res) => {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({ error: 'Benutzername und Passwort erforderlich' });
      }

      // Find user
      const user = await db.get('SELECT * FROM users WHERE username = ?', username);
      if (!user) {
        return res.status(401).json({ error: 'Ungültige Anmeldedaten' });
      }

      // Verify password
      const validPassword = await bcrypt.compare(password, user.password_hash);
      if (!validPassword) {
        return res.status(401).json({ error: 'Ungültige Anmeldedaten' });
      }

      // Generate JWT
      const token = jwt.sign(
        { userId: user.id, userUuid: user.uuid, username: user.username, isAdmin: user.is_admin },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.json({
        token,
        user: {
          id: user.id,
          uuid: user.uuid,
          username: user.username,
          isAdmin: user.is_admin
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Anmeldung fehlgeschlagen' });
    }
  });

  // Logout endpoint - add token to blacklist
  app.post('/api/logout', authenticateTokenWithBlacklist, async (req, res) => {
    try {
      const token = req.headers.authorization?.split(' ')[1];
      if (token) {
        tokenBlacklist.add(token);
      }
      res.json({ message: 'Erfolgreich abgemeldet' });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({ error: 'Abmeldung fehlgeschlagen' });
    }
  });

  // Get user profile with UUID
  app.get('/api/user/profile', authenticateTokenWithBlacklist, async (req, res) => {
    try {
      const user = await db.get(
        'SELECT id, uuid, username, is_admin, created_at FROM users WHERE id = ?',
        req.user.userId
      );
      
      if (!user) {
        return res.status(404).json({ error: 'Benutzer nicht gefunden' });
      }

      res.json({
        id: user.id,
        uuid: user.uuid,
        username: user.username,
        isAdmin: user.is_admin,
        created_at: user.created_at
      });
    } catch (error) {
      console.error('Profile error:', error);
      res.status(500).json({ error: 'Fehler beim Laden des Profils' });
    }
  });

  // Get user's shopping lists
  app.get('/api/lists', authenticateTokenWithBlacklist, async (req, res) => {
    try {
      const lists = await db.all(
        'SELECT uuid, name, icon, created_at FROM shopping_lists WHERE user_uuid = ? ORDER BY created_at DESC',
        req.user.userUuid
      );
      res.json(lists);
    } catch (error) {
      console.error('Error fetching lists:', error);
      res.status(500).json({ error: 'Fehler beim Laden der Listen' });
    }
  });

  // Create shopping list
  app.post('/api/lists', authenticateTokenWithBlacklist, async (req, res) => {
    try {
      const { name, icon = '🛒' } = req.body;
      
      if (!name) {
        return res.status(400).json({ error: 'Listenname ist erforderlich' });
      }

      const listUuid = crypto.randomUUID();
      await db.run(
        'INSERT INTO shopping_lists (uuid, user_uuid, name, icon) VALUES (?, ?, ?, ?)',
        listUuid, req.user.userUuid, name, icon
      );

      res.json({ uuid: listUuid, name, icon });
    } catch (error) {
      console.error('Error creating list:', error);
      res.status(500).json({ error: 'Fehler beim Erstellen der Liste' });
    }
  });

  // Delete shopping list
  app.delete('/api/lists/:uuid', authenticateTokenWithBlacklist, async (req, res) => {
    try {
      const { uuid } = req.params;
      
      // Check if list belongs to user
      const list = await db.get(
        'SELECT * FROM shopping_lists WHERE uuid = ? AND user_uuid = ?',
        uuid, req.user.userUuid
      );
      
      if (!list) {
        return res.status(404).json({ error: 'Liste nicht gefunden' });
      }

      await db.run('DELETE FROM shopping_lists WHERE uuid = ?', uuid);
      res.sendStatus(204);
    } catch (error) {
      console.error('Error deleting list:', error);
      res.status(500).json({ error: 'Fehler beim Löschen der Liste' });
    }
  });

  // Get articles for a specific list
  app.get('/api/lists/:listUuid/articles', authenticateTokenWithBlacklist, async (req, res) => {
    try {
      const { listUuid } = req.params;
      
      // Verify list belongs to user
      const list = await db.get(
        'SELECT * FROM shopping_lists WHERE uuid = ? AND user_uuid = ?',
        listUuid, req.user.userUuid
      );
      
      if (!list) {
        return res.status(404).json({ error: 'Liste nicht gefunden' });
      }

      const articles = await db.all(
        'SELECT uuid, name, category, icon, is_bought, created_at FROM articles WHERE list_uuid = ? ORDER BY created_at DESC',
        listUuid
      );
      
      res.json(articles);
    } catch (error) {
      console.error('Error fetching articles:', error);
      res.status(500).json({ error: 'Fehler beim Laden der Artikel' });
    }
  });

  // Add article to list
  app.post('/api/lists/:listUuid/articles', authenticateTokenWithBlacklist, async (req, res) => {
    try {
      const { listUuid } = req.params;
      const { name, category, icon, comment = '' } = req.body;

      if (!name || !category) {
        return res.status(400).json({ error: 'Name und Kategorie sind erforderlich' });
      }

      // Verify list belongs to user
      const list = await db.get(
        'SELECT * FROM shopping_lists WHERE uuid = ? AND user_uuid = ?',
        listUuid, req.user.userUuid
      );
      
      if (!list) {
        return res.status(404).json({ error: 'Liste nicht gefunden' });
      }

      const articleUuid = crypto.randomUUID();
      await db.run(
        'INSERT INTO articles (uuid, name, category, icon, comment, user_uuid, list_uuid) VALUES (?, ?, ?, ?, ?, ?, ?)',
        articleUuid, name, category, icon, comment, req.user.userUuid, listUuid
      );

      res.json({ uuid: articleUuid });
    } catch (error) {
      console.error('Error creating article:', error);
      res.status(500).json({ error: 'Fehler beim Hinzufügen des Artikels' });
    }
  });

  // Update article
  app.put('/api/articles/:uuid', authenticateTokenWithBlacklist, async (req, res) => {
    try {
      const { uuid } = req.params;
      const { name, category, icon, comment, is_bought } = req.body;

      // Verify article belongs to user
      const article = await db.get(
        'SELECT * FROM articles WHERE uuid = ? AND user_uuid = ?',
        uuid, req.user.userUuid
      );
      
      if (!article) {
        return res.status(404).json({ error: 'Artikel nicht gefunden' });
      }

      await db.run(
        'UPDATE articles SET name=?, category=?, icon=?, comment=?, is_bought=? WHERE uuid=?',
        name, category, icon, comment, is_bought ? 1 : 0, uuid
      );

      res.sendStatus(204);
    } catch (error) {
      console.error('Error updating article:', error);
      res.status(500).json({ error: 'Fehler beim Aktualisieren des Artikels' });
    }
  });

  // Delete article
  app.delete('/api/articles/:uuid', authenticateTokenWithBlacklist, async (req, res) => {
    try {
      const { uuid } = req.params;
      
      // Verify article belongs to user
      const article = await db.get(
        'SELECT * FROM articles WHERE uuid = ? AND user_uuid = ?',
        uuid, req.user.userUuid
      );
      
      if (!article) {
        return res.status(404).json({ error: 'Artikel nicht gefunden' });
      }

      await db.run('DELETE FROM articles WHERE uuid = ?', uuid);
      res.sendStatus(204);
    } catch (error) {
      console.error('Error deleting article:', error);
      res.status(500).json({ error: 'Fehler beim Löschen des Artikels' });
    }
  });

  // Get user's favorites
  app.get('/api/favorites', authenticateTokenWithBlacklist, async (req, res) => {
    try {
      const favorites = await db.all(
        'SELECT uuid, name, category, icon, comment, created_at FROM favorites WHERE user_uuid = ? ORDER BY created_at DESC',
        req.user.userUuid
      );
      res.json(favorites);
    } catch (error) {
      console.error('Error fetching favorites:', error);
      res.status(500).json({ error: 'Fehler beim Laden der Favoriten' });
    }
  });

  // Add to favorites
  app.post('/api/favorites', authenticateTokenWithBlacklist, async (req, res) => {
    try {
      const { name, category, icon, comment = '' } = req.body;

      if (!name || !category) {
        return res.status(400).json({ error: 'Name und Kategorie sind erforderlich' });
      }

      const favoriteUuid = crypto.randomUUID();
      await db.run(
        'INSERT INTO favorites (uuid, user_uuid, name, category, icon, comment) VALUES (?, ?, ?, ?, ?, ?)',
        favoriteUuid, req.user.userUuid, name, category, icon, comment
      );

      res.json({ uuid: favoriteUuid, message: 'Zu Favoriten hinzugefügt' });
    } catch (error) {
      console.error('Error adding favorite:', error);
      res.status(500).json({ error: 'Fehler beim Hinzufügen zu Favoriten' });
    }
  });

  // Remove from favorites
  app.delete('/api/favorites/:uuid', authenticateTokenWithBlacklist, async (req, res) => {
    try {
      const { uuid } = req.params;
      
      await db.run(
        'DELETE FROM favorites WHERE uuid = ? AND user_uuid = ?',
        uuid, req.user.userUuid
      );
      
      res.sendStatus(204);
    } catch (error) {
      console.error('Error removing favorite:', error);
      res.status(500).json({ error: 'Fehler beim Entfernen aus Favoriten' });
    }
  });

  // Change password
  app.post('/api/change-password', authenticateTokenWithBlacklist, async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: 'Aktuelles und neues Passwort erforderlich' });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ error: 'Neues Passwort muss mindestens 6 Zeichen lang sein' });
      }

      // Verify current password
      const user = await db.get('SELECT * FROM users WHERE uuid = ?', req.user.userUuid);
      if (!user) {
        return res.status(404).json({ error: 'Benutzer nicht gefunden' });
      }

      const validPassword = await bcrypt.compare(currentPassword, user.password_hash);
      if (!validPassword) {
        return res.status(401).json({ error: 'Aktuelles Passwort ist falsch' });
      }

      // Hash new password
      const saltRounds = 10;
      const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

      // Update password
      await db.run(
        'UPDATE users SET password_hash = ? WHERE uuid = ?',
        newPasswordHash, req.user.userUuid
      );

      res.json({ message: 'Passwort erfolgreich geändert' });
    } catch (error) {
      console.error('Change password error:', error);
      res.status(500).json({ error: 'Fehler beim Ändern des Passworts' });
    }
  });

  // Change username
  app.post('/api/change-username', authenticateTokenWithBlacklist, async (req, res) => {
    try {
      const { newUsername } = req.body;

      if (!newUsername || newUsername.length < 3) {
        return res.status(400).json({ error: 'Benutzername muss mindestens 3 Zeichen lang sein' });
      }

      // Check if username is already taken
      const existingUser = await db.get('SELECT id FROM users WHERE username = ? AND uuid != ?', newUsername, req.user.userUuid);
      if (existingUser) {
        return res.status(400).json({ error: 'Benutzername bereits vergeben' });
      }

      // Update username
      await db.run(
        'UPDATE users SET username = ? WHERE uuid = ?',
        newUsername, req.user.userUuid
      );

      res.json({ message: 'Benutzername erfolgreich geändert' });
    } catch (error) {
      console.error('Change username error:', error);
      res.status(500).json({ error: 'Fehler beim Ändern des Benutzernamens' });
    }
  });

  // Get user's article history (unique articles they've added before)
  app.get('/api/articles/history', authenticateTokenWithBlacklist, async (req, res) => {
    try {
      const articles = await db.all(`
        SELECT DISTINCT name, category, icon, comment 
        FROM articles 
        WHERE user_uuid = ? 
        ORDER BY name ASC
      `, req.user.userUuid);
      
      res.json(articles);
    } catch (error) {
      console.error('Error fetching article history:', error);
      res.status(500).json({ error: 'Fehler beim Laden der Artikel-Historie' });
    }
  });

  // Get standard articles (global + user's custom)
  app.get('/api/standard-articles', authenticateTokenWithBlacklist, async (req, res) => {
    try {
      const articles = await db.all(`
        SELECT id, name, category, icon, is_global, user_uuid
        FROM standard_articles 
        WHERE is_global = 1 OR user_uuid = ?
        ORDER BY category, name ASC
      `, req.user.userUuid);
      
      res.json(articles);
    } catch (error) {
      console.error('Error fetching standard articles:', error);
      res.status(500).json({ error: 'Fehler beim Laden der Standardartikel' });
    }
  });

  // Add custom standard article
  app.post('/api/standard-articles', authenticateTokenWithBlacklist, async (req, res) => {
    try {
      const { name, category, icon } = req.body;

      if (!name || !category) {
        return res.status(400).json({ error: 'Name und Kategorie sind erforderlich' });
      }

      const result = await db.run(
        'INSERT INTO standard_articles (name, category, icon, is_global, user_uuid) VALUES (?, ?, ?, 0, ?)',
        name, category, icon, req.user.userUuid
      );

      res.json({ id: result.lastID });
    } catch (error) {
      if (error.message.includes('UNIQUE constraint failed')) {
        return res.status(400).json({ error: 'Dieser Artikel existiert bereits in den Standardartikeln' });
      }
      console.error('Error creating standard article:', error);
      res.status(500).json({ error: 'Fehler beim Hinzufügen des Standardartikels' });
    }
  });

  // Delete custom standard article
  app.delete('/api/standard-articles/:id', authenticateTokenWithBlacklist, async (req, res) => {
    try {
      const { id } = req.params;

      // Allow deletion of user's custom articles AND global ones (for flexibility)
      const result = await db.run(
        'DELETE FROM standard_articles WHERE id = ? AND (user_uuid = ? OR is_global = 1)',
        id, req.user.userUuid
      );

      if (result.changes === 0) {
        return res.status(404).json({ error: 'Standardartikel nicht gefunden' });
      }

      res.sendStatus(204);
    } catch (error) {
      console.error('Error deleting standard article:', error);
      res.status(500).json({ error: 'Fehler beim Löschen des Standardartikels' });
    }
  });

  // Bulk delete standard articles
  app.post('/api/standard-articles/bulk-delete', authenticateTokenWithBlacklist, async (req, res) => {
    try {
      const { ids } = req.body;

      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ error: 'IDs Array erforderlich' });
      }

      const placeholders = ids.map(() => '?').join(',');
      const result = await db.run(
        `DELETE FROM standard_articles WHERE id IN (${placeholders}) AND (user_uuid = ? OR is_global = 1)`,
        ...ids, req.user.userUuid
      );

      res.json({ deleted: result.changes });
    } catch (error) {
      console.error('Error bulk deleting standard articles:', error);
      res.status(500).json({ error: 'Fehler beim Löschen der Standardartikel' });
    }
  });

  // Update custom standard article
  app.put('/api/standard-articles/:id', authenticateTokenWithBlacklist, async (req, res) => {
    try {
      const { id } = req.params;
      const { name, category, icon } = req.body;

      if (!name || !category) {
        return res.status(400).json({ error: 'Name und Kategorie sind erforderlich' });
      }

      // Allow updating of user's custom articles AND global ones (for flexibility)
      const result = await db.run(
        'UPDATE standard_articles SET name = ?, category = ?, icon = ? WHERE id = ? AND (user_uuid = ? OR is_global = 1)',
        name, category, icon, id, req.user.userUuid
      );

      if (result.changes === 0) {
        return res.status(404).json({ error: 'Standardartikel nicht gefunden' });
      }

      res.sendStatus(204);
    } catch (error) {
      console.error('Error updating standard article:', error);
      res.status(500).json({ error: 'Fehler beim Bearbeiten des Standardartikels' });
    }
  });

  // Get categories (global + user's custom)
  app.get('/api/categories', authenticateTokenWithBlacklist, async (req, res) => {
    try {
      const categories = await db.all(`
        SELECT uuid, name, icon, is_global, user_uuid
        FROM categories 
        WHERE is_global = 1 OR user_uuid = ?
        ORDER BY name ASC
      `, req.user.userUuid);
      
      res.json(categories);
    } catch (error) {
      console.error('Error fetching categories:', error);
      res.status(500).json({ error: 'Fehler beim Laden der Kategorien' });
    }
  });

  // Add custom category
  app.post('/api/categories', authenticateTokenWithBlacklist, async (req, res) => {
    try {
      const { name, icon } = req.body;

      if (!name || !icon) {
        return res.status(400).json({ error: 'Name und Icon sind erforderlich' });
      }

      const categoryUuid = crypto.randomUUID();
      await db.run(
        'INSERT INTO categories (uuid, name, icon, is_global, user_uuid) VALUES (?, ?, ?, 0, ?)',
        categoryUuid, name, icon, req.user.userUuid
      );

      res.json({ uuid: categoryUuid });
    } catch (error) {
      if (error.message.includes('UNIQUE constraint failed')) {
        return res.status(400).json({ error: 'Diese Kategorie existiert bereits' });
      }
      console.error('Error creating category:', error);
      res.status(500).json({ error: 'Fehler beim Hinzufügen der Kategorie' });
    }
  });

  // Update custom category
  app.put('/api/categories/:uuid', authenticateTokenWithBlacklist, async (req, res) => {
    try {
      const { uuid } = req.params;
      const { name, icon } = req.body;

      if (!name || !icon) {
        return res.status(400).json({ error: 'Name und Icon sind erforderlich' });
      }

      // Only allow updating of user's custom categories (not global ones)
      const result = await db.run(
        'UPDATE categories SET name = ?, icon = ? WHERE uuid = ? AND user_uuid = ? AND is_global = 0',
        name, icon, uuid, req.user.userUuid
      );

      if (result.changes === 0) {
        return res.status(404).json({ error: 'Kategorie nicht gefunden oder nicht bearbeitbar' });
      }

      res.sendStatus(204);
    } catch (error) {
      console.error('Error updating category:', error);
      res.status(500).json({ error: 'Fehler beim Bearbeiten der Kategorie' });
    }
  });

  // Delete custom category
  app.delete('/api/categories/:uuid', authenticateTokenWithBlacklist, async (req, res) => {
    try {
      const { uuid } = req.params;

      // Only allow deletion of user's custom categories (not global ones)
      const result = await db.run(
        'DELETE FROM categories WHERE uuid = ? AND user_uuid = ? AND is_global = 0',
        uuid, req.user.userUuid
      );

      if (result.changes === 0) {
        return res.status(404).json({ error: 'Kategorie nicht gefunden oder nicht löschbar' });
      }

      res.sendStatus(204);
    } catch (error) {
      console.error('Error deleting category:', error);
      res.status(500).json({ error: 'Fehler beim Löschen der Kategorie' });
    }
  });

  // Regular Admin Routes (JWT-based authentication)
  
  // Admin authentication middleware
  const authenticateAdmin = (req, res, next) => {
    authenticateTokenWithBlacklist(req, res, (err) => {
      if (err) return;
      
      // Check if user is admin
      if (!req.user.isAdmin) {
        return res.status(403).json({ error: 'Admin-Berechtigung erforderlich' });
      }
      
      next();
    });
  };

  // Get all users (admin only)
  app.get('/api/admin/users', authenticateAdmin, async (req, res) => {
    try {
      const users = await db.all(`
        SELECT 
          id,
          uuid,
          username,
          is_admin,
          created_at
        FROM users 
        ORDER BY created_at DESC
      `);
      
      res.json(users);
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ error: 'Fehler beim Laden der Benutzer' });
    }
  });

  // Toggle admin status
  app.post('/api/admin/toggle-admin', authenticateAdmin, async (req, res) => {
    try {
      const { userId } = req.body;
      
      if (!userId) {
        return res.status(400).json({ error: 'Benutzer-ID erforderlich' });
      }

      // Get current user status
      const user = await db.get('SELECT is_admin FROM users WHERE id = ?', userId);
      if (!user) {
        return res.status(404).json({ error: 'Benutzer nicht gefunden' });
      }

      // Toggle admin status
      const newAdminStatus = user.is_admin ? 0 : 1;
      await db.run('UPDATE users SET is_admin = ? WHERE id = ?', newAdminStatus, userId);

      res.json({ 
        success: true, 
        message: `Benutzer ${newAdminStatus ? 'zum Admin ernannt' : 'Admin-Status entfernt'}`,
        isAdmin: Boolean(newAdminStatus)
      });
    } catch (error) {
      console.error('Error toggling admin status:', error);
      res.status(500).json({ error: 'Fehler beim Ändern des Admin-Status' });
    }
  });

  // Demo Admin Routes (Password-based authentication)

  // Admin middleware
  const adminAuth = (req, res, next) => {
    const { password } = req.body || req.query;
    if (password !== 'HureAgnes21') {
      return res.status(401).json({ error: 'Ungültiges Admin-Passwort' });
    }
    next();
  };

  // Validate admin password function
  const validateAdminPassword = (password) => {
    return password === 'HureAgnes21';
  };

  // Admin Routes
  
  // Get all users (admin only)
  app.post('/api/dJkL9mN2pQ7rS4tUvWxYz/users', adminAuth, async (req, res) => {
    try {
      const users = await db.all(`
        SELECT 
          u.id, 
          u.uuid,
          u.username, 
          u.is_admin,
          u.created_at,
          COUNT(DISTINCT sl.uuid) as list_count,
          COUNT(DISTINCT a.uuid) as article_count,
          COUNT(DISTINCT f.uuid) as favorite_count
        FROM users u
        LEFT JOIN shopping_lists sl ON u.uuid = sl.user_uuid
        LEFT JOIN articles a ON u.uuid = a.user_uuid
        LEFT JOIN favorites f ON u.uuid = f.user_uuid
        GROUP BY u.id, u.uuid, u.username, u.is_admin, u.created_at
        ORDER BY u.created_at DESC
      `);
      
      res.json(users);
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ error: 'Fehler beim Laden der Benutzer' });
    }
  });

  // Get system statistics (admin only)
  app.post('/api/dJkL9mN2pQ7rS4tUvWxYz/stats', adminAuth, async (req, res) => {
    try {
      const stats = await db.get(`
        SELECT 
          (SELECT COUNT(*) FROM users) as total_users,
          (SELECT COUNT(*) FROM shopping_lists) as total_lists,
          (SELECT COUNT(*) FROM articles) as total_articles,
          (SELECT COUNT(*) FROM favorites) as total_favorites,
          (SELECT COUNT(*) FROM standard_articles WHERE is_global = 0) as custom_standard_articles,
          (SELECT COUNT(*) FROM categories WHERE is_global = 0) as custom_categories,
          (SELECT COUNT(*) FROM broadcasts WHERE is_active = 1) as active_broadcasts
      `);
      
      res.json(stats);
    } catch (error) {
      console.error('Error fetching stats:', error);
      res.status(500).json({ error: 'Fehler beim Laden der Statistiken' });
    }
  });

  // Delete user (admin only)
  app.delete('/api/dJkL9mN2pQ7rS4tUvWxYz/users/:id', adminAuth, async (req, res) => {
    try {
      const { id } = req.params;
      
      const result = await db.run('DELETE FROM users WHERE id = ?', id);
      
      if (result.changes === 0) {
        return res.status(404).json({ error: 'Benutzer nicht gefunden' });
      }
      
      res.json({ message: 'Benutzer erfolgreich gelöscht' });
    } catch (error) {
      console.error('Error deleting user:', error);
      res.status(500).json({ error: 'Fehler beim Löschen des Benutzers' });
    }
  });

  // Toggle user admin status (admin only)
  app.post('/api/dJkL9mN2pQ7rS4tUvWxYz/users/:userId/toggle-admin', adminAuth, async (req, res) => {
    try {
      const { userId } = req.params;
      
      if (!userId) {
        return res.status(400).json({ error: 'Benutzer-ID ist erforderlich' });
      }
      
      // Get current admin status
      const user = await db.get('SELECT id, username, is_admin FROM users WHERE id = ?', userId);
      
      if (!user) {
        return res.status(404).json({ error: 'Benutzer nicht gefunden' });
      }
      
      // Toggle admin status
      const newAdminStatus = user.is_admin ? 0 : 1;
      
      await db.run('UPDATE users SET is_admin = ? WHERE id = ?', newAdminStatus, userId);
      
      res.json({ 
        message: `Benutzer ${user.username} wurde ${newAdminStatus ? 'zum Admin ernannt' : 'als Admin entfernt'}`,
        user: {
          id: user.id,
          username: user.username,
          is_admin: newAdminStatus
        }
      });
    } catch (error) {
      console.error('Error toggling admin status:', error);
      res.status(500).json({ error: 'Fehler beim Ändern des Admin-Status' });
    }
  });

  // Broadcast management

  // Create broadcast (admin only)
  app.post('/api/dJkL9mN2pQ7rS4tUvWxYz/broadcasts', adminAuth, async (req, res) => {
    try {
      const { title, message, type, requires_confirmation, is_permanent, expires_at } = req.body;
      
      if (!title || !message || !type) {
        return res.status(400).json({ error: 'Titel, Nachricht und Typ sind erforderlich' });
      }
      
      const result = await db.run(`
        INSERT INTO broadcasts (title, message, type, requires_confirmation, is_permanent, expires_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `, title, message, type, requires_confirmation ? 1 : 0, is_permanent ? 1 : 0, expires_at);
      
      res.json({ id: result.lastID, message: 'Broadcast erstellt' });
    } catch (error) {
      console.error('Error creating broadcast:', error);
      res.status(500).json({ error: 'Fehler beim Erstellen des Broadcasts' });
    }
  });

  // Get all broadcasts (admin only)
  app.post('/api/dJkL9mN2pQ7rS4tUvWxYz/broadcasts/list', adminAuth, async (req, res) => {
    try {
      const broadcasts = await db.all(`
        SELECT 
          b.*,
          COUNT(bc.id) as confirmation_count,
          (SELECT COUNT(*) FROM users) as total_users
        FROM broadcasts b
        LEFT JOIN broadcast_confirmations bc ON b.id = bc.broadcast_id
        GROUP BY b.id
        ORDER BY b.created_at DESC
      `);
      
      res.json(broadcasts);
    } catch (error) {
      console.error('Error fetching broadcasts:', error);
      res.status(500).json({ error: 'Fehler beim Laden der Broadcasts' });
    }
  });

  // Toggle broadcast status (admin only)
  app.put('/api/dJkL9mN2pQ7rS4tUvWxYz/broadcasts/:id/toggle', adminAuth, async (req, res) => {
    try {
      const { id } = req.params;
      
      await db.run(`
        UPDATE broadcasts 
        SET is_active = CASE WHEN is_active = 1 THEN 0 ELSE 1 END 
        WHERE id = ?
      `, id);
      
      res.json({ message: 'Broadcast-Status geändert' });
    } catch (error) {
      console.error('Error toggling broadcast:', error);
      res.status(500).json({ error: 'Fehler beim Ändern des Broadcast-Status' });
    }
  });

  // Delete broadcast (admin only)
  app.delete('/api/dJkL9mN2pQ7rS4tUvWxYz/broadcasts/:id', adminAuth, async (req, res) => {
    try {
      const { id } = req.params;
      
      const result = await db.run('DELETE FROM broadcasts WHERE id = ?', id);
      
      if (result.changes === 0) {
        return res.status(404).json({ error: 'Broadcast nicht gefunden' });
      }
      
      res.json({ message: 'Broadcast gelöscht' });
    } catch (error) {
      console.error('Error deleting broadcast:', error);
      res.status(500).json({ error: 'Fehler beim Löschen des Broadcasts' });
    }
  });

  // User broadcast endpoints

  // Get active broadcasts for user
  app.get('/api/broadcasts', authenticateTokenWithBlacklist, async (req, res) => {
    try {
      const broadcasts = await db.all(`
        SELECT 
          b.*,
          bc.confirmed_at IS NOT NULL as is_confirmed
        FROM broadcasts b
        LEFT JOIN broadcast_confirmations bc ON b.id = bc.broadcast_id AND bc.user_uuid = ?
        WHERE b.is_active = 1 
        AND (b.expires_at IS NULL OR b.expires_at > datetime('now'))
        AND (b.requires_confirmation = 0 OR bc.confirmed_at IS NULL OR b.is_permanent = 1)
        ORDER BY b.created_at DESC
      `, req.user.userUuid);
      
      res.json(broadcasts);
    } catch (error) {
      console.error('Error fetching user broadcasts:', error);
      res.status(500).json({ error: 'Fehler beim Laden der Nachrichten' });
    }
  });

  // Confirm broadcast
  app.post('/api/broadcasts/:id/confirm', authenticateTokenWithBlacklist, async (req, res) => {
    try {
      const { id } = req.params;
      
      await db.run(`
        INSERT OR IGNORE INTO broadcast_confirmations (broadcast_id, user_uuid)
        VALUES (?, ?)
      `, id, req.user.userUuid);
      
      res.json({ message: 'Nachricht bestätigt' });
    } catch (error) {
      console.error('Error confirming broadcast:', error);
      res.status(500).json({ error: 'Fehler beim Bestätigen der Nachricht' });
    }
  });

  // Clean up database duplicates (Admin only)
  app.post('/api/dJkL9mN2pQ7rS4tUvWxYz/cleanup', adminAuth, async (req, res) => {
    try {
      // Remove duplicate standard articles (keep only one of each name/category combination)
      await db.exec(`
        DELETE FROM standard_articles 
        WHERE id NOT IN (
          SELECT MIN(id) 
          FROM standard_articles 
          WHERE is_global = 1
          GROUP BY name, category
        ) AND is_global = 1
      `);

      // Remove duplicate categories (keep only one of each name)
      await db.exec(`
        DELETE FROM categories 
        WHERE id NOT IN (
          SELECT MIN(id) 
          FROM categories 
          WHERE is_global = 1
          GROUP BY name
        ) AND is_global = 1
      `);

      const articlesResult = await db.get('SELECT COUNT(*) as count FROM standard_articles WHERE is_global = 1');
      const categoriesResult = await db.get('SELECT COUNT(*) as count FROM categories WHERE is_global = 1');

      res.json({ 
        message: 'Datenbank bereinigt',
        remaining_articles: articlesResult.count,
        remaining_categories: categoriesResult.count
      });
    } catch (error) {
      console.error('Error cleaning database:', error);
      res.status(500).json({ error: 'Fehler beim Bereinigen der Datenbank' });
    }
  });

  // Legacy endpoints for backward compatibility (if not authenticated, return empty arrays)
  app.get('/api/articles', async (req, res) => {
    res.json([]);
  });

  // Test endpoint for automatic logout functionality
  app.get('/api/test-invalid-session', authenticateTokenWithBlacklist, async (req, res) => {
    // Simulate an invalid session by adding the current token to blacklist
    const token = req.headers.authorization?.split(' ')[1];
    if (token) {
      tokenBlacklist.add(token);
    }
    res.status(401).json({ error: 'Token invalidated - testing auto logout' });
  });

  app.post('/api/articles', async (req, res) => {
    res.status(401).json({ error: 'Authentication required' });
  });

  app.put('/api/articles/:id', async (req, res) => {
    res.status(401).json({ error: 'Authentication required' });
  });

  app.delete('/api/articles/:id', async (req, res) => {
    res.status(401).json({ error: 'Authentication required' });
  });

  // Get database logs (Admin only)
  app.post('/api/dJkL9mN2pQ7rS4tUvWxYz/logs', async (req, res) => {
    try {
      const { password, limit = 100, offset = 0 } = req.body;
      
      if (!validateAdminPassword(password)) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const logs = await db.all(`
        SELECT 
          dl.*,
          u.username
        FROM db_logs dl
        LEFT JOIN users u ON dl.user_uuid = u.uuid
        ORDER BY dl.created_at DESC
        LIMIT ? OFFSET ?
      `, [limit, offset]);

      const totalCount = await db.get('SELECT COUNT(*) as count FROM db_logs');

      res.json({
        logs,
        total: totalCount.count,
        limit,
        offset
      });
    } catch (error) {
      console.error('Error fetching database logs:', error);
      res.status(500).json({ error: 'Fehler beim Laden der Datenbank-Logs' });
    }
  });

  // Clear database logs (Admin only)
  app.post('/api/dJkL9mN2pQ7rS4tUvWxYz/logs/clear', async (req, res) => {
    try {
      const { password, older_than_days = 30 } = req.body;
      
      if (!validateAdminPassword(password)) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const result = await db.run(`
        DELETE FROM db_logs 
        WHERE created_at < datetime('now', '-' || ? || ' days')
      `, [older_than_days]);

      res.json({ 
        message: `${result.changes} Log-Einträge gelöscht`,
        deleted_count: result.changes
      });
    } catch (error) {
      console.error('Error clearing database logs:', error);
      res.status(500).json({ error: 'Fehler beim Löschen der Logs' });
    }
  });

  app.listen(4000, () => {
    console.log('Backend läuft auf Port 4000');
    console.log(`Server started at: ${new Date(serverStartTime).toISOString()}`);
  });

  // Add uptime endpoint
  app.get('/api/uptime', (req, res) => {
    const uptime = Date.now() - serverStartTime;
    res.json({
      success: true,
      uptime: uptime,
      startTime: serverStartTime,
      currentTime: Date.now()
    });
  });
}

main();
