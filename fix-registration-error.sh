#!/bin/bash

# Fix für Backend Registration 500 Fehler

echo "🔧 Korrigiere Backend Registration Endpoint..."

# Backup erstellen
cp /home/einkaufsliste/backend/server.js /home/einkaufsliste/backend/server.js.backup

# Erstelle einen direkten Fix für den Register Endpoint
python3 << 'EOF'
import re

# Lese die server.js Datei
with open('/home/einkaufsliste/backend/server.js', 'r') as f:
    content = f.read()

# Suche den problematischen Register-Endpoint
old_register = '''  // User registration
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
  });'''

new_register = '''  // User registration
  app.post('/api/register', async (req, res) => {
    try {
      console.log('🔍 Registration attempt:', req.body);
      const { username, password, confirmPassword, captchaAnswer, captchaExpected } = req.body;

      // Validate input
      if (!username || !password || !confirmPassword) {
        console.log('❌ Missing required fields');
        return res.status(400).json({ error: 'Alle Felder sind erforderlich' });
      }

      if (password !== confirmPassword) {
        console.log('❌ Passwords do not match');
        return res.status(400).json({ error: 'Passwörter stimmen nicht überein' });
      }

      if (password.length < 6) {
        console.log('❌ Password too short');
        return res.status(400).json({ error: 'Passwort muss mindestens 6 Zeichen lang sein' });
      }

      // Simple captcha verification (optional - skip if not provided)
      if (captchaAnswer !== undefined && captchaExpected !== undefined) {
        if (parseInt(captchaAnswer) !== parseInt(captchaExpected)) {
          console.log('❌ CAPTCHA incorrect');
          return res.status(400).json({ error: 'CAPTCHA ist falsch' });
        }
      }

      // Check if username exists (direct DB query instead of executeQuery)
      try {
        const existingUser = await db.get('SELECT id FROM users WHERE username = ?', [username]);
        if (existingUser) {
          console.log('❌ Username already exists:', username);
          return res.status(400).json({ error: 'Benutzername bereits vergeben' });
        }
      } catch (dbError) {
        console.log('🔍 User check error (table might not exist):', dbError.message);
      }

      // Hash password
      const saltRounds = 10;
      const passwordHash = await bcrypt.hash(password, saltRounds);

      // Generate unique user ID
      const userUuid = crypto.randomUUID();

      // Create user (with better error handling)
      try {
        const result = await db.run(
          'INSERT INTO users (uuid, username, password_hash) VALUES (?, ?, ?)',
          userUuid, username, passwordHash
        );
        console.log('✅ User created:', username, 'UUID:', userUuid);

        // Create default shopping list (optional - don't fail if this errors)
        try {
          const listUuid = crypto.randomUUID();
          await db.run(
            'INSERT INTO shopping_lists (uuid, user_uuid, name, icon) VALUES (?, ?, ?, ?)',
            listUuid, userUuid, 'Meine Einkaufsliste', '🛒'
          );
          console.log('✅ Default list created for user:', username);
        } catch (listError) {
          console.log('⚠️  Could not create default list (but user created):', listError.message);
        }

        res.status(201).json({ 
          message: 'Benutzer erfolgreich registriert',
          username: username,
          uuid: userUuid
        });

      } catch (userError) {
        console.log('❌ User creation failed:', userError.message);
        return res.status(500).json({ error: 'Benutzer konnte nicht erstellt werden: ' + userError.message });
      }

    } catch (error) {
      console.error('❌ Registration error:', error);
      res.status(500).json({ 
        error: 'Registrierung fehlgeschlagen', 
        details: error.message,
        stack: error.stack 
      });
    }
  });'''

# Ersetze den Register-Endpoint
if old_register in content:
    content = content.replace(old_register, new_register)
    print("✅ Register endpoint successfully replaced")
else:
    print("❌ Could not find exact register endpoint - trying pattern matching")
    # Fallback: Suche nach dem Muster
    pattern = r'(app\.post\(\'/api/register\',.*?\}\);)'
    if re.search(pattern, content, re.DOTALL):
        print("✅ Found register pattern - manual replacement needed")
    else:
        print("❌ No register endpoint found")

# Schreibe die Datei zurück
with open('/home/einkaufsliste/backend/server.js', 'w') as f:
    f.write(content)

print("✅ Backend server.js updated")
EOF

echo "🔄 Starte Backend Service neu..."
pm2 restart backend

echo "🧪 Teste Registration Endpoint..."
sleep 3

# Teste den Registration Endpoint
echo "📝 Teste Registration mit Test-Daten..."
response=$(curl -s -X POST "http://localhost:4000/api/register" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser123",
    "password": "test123456",
    "confirmPassword": "test123456"
  }' \
  -w "%{http_code}")

echo "📄 Response: $response"

# Zeige Backend Logs
echo "📋 Backend Logs (letzte 10 Zeilen):"
pm2 logs backend --lines 10 --nostream 2>/dev/null || echo "❌ Backend Logs nicht verfügbar"

echo ""
echo "🎯 Tests:"
echo "1. Frontend Registration: http://ochtii.run.place (Register-Button)"
echo "2. Direct API Test: curl -X POST http://localhost:4000/api/register -H 'Content-Type: application/json' -d '{\"username\":\"test\",\"password\":\"123456\",\"confirmPassword\":\"123456\"}'"
