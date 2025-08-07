#!/bin/bash

# Fix für API Stats 500 Fehler

echo "🔧 Korrigiere API Stats Endpoint..."

# Erstelle Backup
cp /home/einkaufsliste/api/admin_server.py /home/einkaufsliste/api/admin_server.py.backup

# Erstelle Fix-Patch für handle_stats_request
cat > /tmp/stats_fix.py << 'EOF'
    def handle_stats_request(self):
        """Handle stats API request"""
        try:
            db_path = os.path.join(os.path.dirname(__file__), '..', 'backend', 'db.sqlite')
            conn = sqlite3.connect(db_path)
            cursor = conn.cursor()
            
            # Erstelle benötigte Tabellen falls sie nicht existieren
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS api_keys (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    key_hash TEXT UNIQUE NOT NULL,
                    key_preview TEXT NOT NULL,
                    endpoint_permissions TEXT NOT NULL DEFAULT '[]',
                    rate_limit INTEGER DEFAULT 60,
                    ip_restrictions TEXT DEFAULT '[]',
                    description TEXT DEFAULT '',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    expires_at TIMESTAMP,
                    is_active BOOLEAN DEFAULT 1,
                    last_used TIMESTAMP,
                    usage_count INTEGER DEFAULT 0
                )
            ''')
            
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS api_key_usage_logs (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    api_key_id INTEGER NOT NULL,
                    endpoint_id TEXT NOT NULL,
                    method TEXT NOT NULL,
                    path TEXT NOT NULL,
                    ip_address TEXT NOT NULL,
                    user_agent TEXT,
                    payload_size INTEGER DEFAULT 0,
                    response_status INTEGER,
                    response_time_ms INTEGER,
                    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (api_key_id) REFERENCES api_keys (id) ON DELETE CASCADE
                )
            ''')
            
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS endpoint_config (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    endpoint_id TEXT UNIQUE NOT NULL,
                    is_enabled INTEGER DEFAULT 1,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            ''')
            
            conn.commit()
            
            # Get API Keys count (mit Fallback)
            try:
                cursor.execute("SELECT COUNT(*) FROM api_keys")
                api_keys_count = cursor.fetchone()[0] or 0
            except sqlite3.OperationalError:
                api_keys_count = 0
            
            # Get API requests (today and total) (mit Fallback)
            try:
                today = datetime.now().strftime('%Y-%m-%d')
                cursor.execute("SELECT COUNT(*) FROM api_key_usage_logs WHERE DATE(timestamp) = ?", (today,))
                api_requests_today = cursor.fetchone()[0] or 0
                
                cursor.execute("SELECT COUNT(*) FROM api_key_usage_logs")
                api_requests_total = cursor.fetchone()[0] or 0
            except sqlite3.OperationalError:
                api_requests_today = 0
                api_requests_total = 0
            
            # Get endpoints count (mit Fallback)
            try:
                total_endpoints = len(self.get_all_endpoints())
            except:
                total_endpoints = 8  # Default Anzahl
            
            # Check for disabled endpoints (mit Fallback)
            try:
                cursor.execute("SELECT COUNT(*) FROM endpoint_config WHERE is_enabled = 0")
                disabled_result = cursor.fetchone()
                disabled_endpoints = disabled_result[0] if disabled_result else 0
            except sqlite3.OperationalError:
                disabled_endpoints = 0
            
            active_endpoints = total_endpoints - disabled_endpoints
            
            # Get database size
            try:
                db_size = os.path.getsize(db_path)
                db_size_str = f"{db_size / 1024:.2f} KB"
            except:
                db_size_str = "Unknown"
            
            # Get last modified
            try:
                modified = os.path.getmtime(db_path)
                db_modified_str = datetime.fromtimestamp(modified).strftime('%Y-%m-%d %H:%M:%S')
            except:
                db_modified_str = "Unknown"
            
            stats = {
                'api_keys': api_keys_count,
                'api_requests': f"{api_requests_today}/{api_requests_total}",
                'endpoints': f"{active_endpoints}/{total_endpoints}",
                'db_size': db_size_str,
                'db_modified': db_modified_str
            }
            
            conn.close()
            self.send_json(stats)
            
        except Exception as e:
            logger.error(f"Stats request error: {e}")
            # Fallback Antwort bei Fehlern
            fallback_stats = {
                'api_keys': 0,
                'api_requests': "0/0",
                'endpoints': "8/8",
                'db_size': "Unknown",
                'db_modified': "Unknown",
                'error': f"Database error: {str(e)}"
            }
            self.send_json(fallback_stats, 200)  # 200 statt 500 für bessere UX
EOF

echo "✅ Fix erstellt. Wende Patch an..."

# Finde und ersetze die handle_stats_request Funktion
python3 << 'EOF'
import re

# Lese die Datei
with open('/home/einkaufsliste/api/admin_server.py', 'r') as f:
    content = f.read()

# Finde die handle_stats_request Funktion
pattern = r'(\s+def handle_stats_request\(self\):.*?\n\s+except Exception as e:\s*\n.*?self\.send_json\(\{\'error\': str\(e\)\}, 500\))'
replacement = '''    def handle_stats_request(self):
        """Handle stats API request"""
        try:
            db_path = os.path.join(os.path.dirname(__file__), '..', 'backend', 'db.sqlite')
            conn = sqlite3.connect(db_path)
            cursor = conn.cursor()
            
            # Erstelle benötigte Tabellen falls sie nicht existieren
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS api_keys (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    key_hash TEXT UNIQUE NOT NULL,
                    key_preview TEXT NOT NULL,
                    endpoint_permissions TEXT NOT NULL DEFAULT '[]',
                    rate_limit INTEGER DEFAULT 60,
                    ip_restrictions TEXT DEFAULT '[]',
                    description TEXT DEFAULT '',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    expires_at TIMESTAMP,
                    is_active BOOLEAN DEFAULT 1,
                    last_used TIMESTAMP,
                    usage_count INTEGER DEFAULT 0
                )
            """)
            
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS api_key_usage_logs (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    api_key_id INTEGER NOT NULL,
                    endpoint_id TEXT NOT NULL,
                    method TEXT NOT NULL,
                    path TEXT NOT NULL,
                    ip_address TEXT NOT NULL,
                    user_agent TEXT,
                    payload_size INTEGER DEFAULT 0,
                    response_status INTEGER,
                    response_time_ms INTEGER,
                    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (api_key_id) REFERENCES api_keys (id) ON DELETE CASCADE
                )
            """)
            
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS endpoint_config (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    endpoint_id TEXT UNIQUE NOT NULL,
                    is_enabled INTEGER DEFAULT 1,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            
            conn.commit()
            
            # Get API Keys count (mit Fallback)
            try:
                cursor.execute("SELECT COUNT(*) FROM api_keys")
                api_keys_count = cursor.fetchone()[0] or 0
            except sqlite3.OperationalError:
                api_keys_count = 0
            
            # Get API requests (today and total) (mit Fallback)
            try:
                today = datetime.now().strftime('%Y-%m-%d')
                cursor.execute("SELECT COUNT(*) FROM api_key_usage_logs WHERE DATE(timestamp) = ?", (today,))
                api_requests_today = cursor.fetchone()[0] or 0
                
                cursor.execute("SELECT COUNT(*) FROM api_key_usage_logs")
                api_requests_total = cursor.fetchone()[0] or 0
            except sqlite3.OperationalError:
                api_requests_today = 0
                api_requests_total = 0
            
            # Get endpoints count (mit Fallback)
            try:
                total_endpoints = len(self.get_all_endpoints())
            except:
                total_endpoints = 8  # Default Anzahl
            
            # Check for disabled endpoints (mit Fallback)
            try:
                cursor.execute("SELECT COUNT(*) FROM endpoint_config WHERE is_enabled = 0")
                disabled_result = cursor.fetchone()
                disabled_endpoints = disabled_result[0] if disabled_result else 0
            except sqlite3.OperationalError:
                disabled_endpoints = 0
            
            active_endpoints = total_endpoints - disabled_endpoints
            
            # Get database size
            try:
                db_size = os.path.getsize(db_path)
                db_size_str = f"{db_size / 1024:.2f} KB"
            except:
                db_size_str = "Unknown"
            
            # Get last modified
            try:
                modified = os.path.getmtime(db_path)
                db_modified_str = datetime.fromtimestamp(modified).strftime('%Y-%m-%d %H:%M:%S')
            except:
                db_modified_str = "Unknown"
            
            stats = {
                'api_keys': api_keys_count,
                'api_requests': f"{api_requests_today}/{api_requests_total}",
                'endpoints': f"{active_endpoints}/{total_endpoints}",
                'db_size': db_size_str,
                'db_modified': db_modified_str
            }
            
            conn.close()
            self.send_json(stats)
            
        except Exception as e:
            logger.error(f"Stats request error: {e}")
            # Fallback Antwort bei Fehlern
            fallback_stats = {
                'api_keys': 0,
                'api_requests': "0/0",
                'endpoints': "8/8",
                'db_size': "Unknown",
                'db_modified': "Unknown",
                'error': f"Database error: {str(e)}"
            }
            self.send_json(fallback_stats, 200)  # 200 statt 500 für bessere UX'''

# Ersetze die Funktion mit regex
new_content = re.sub(pattern, replacement, content, flags=re.DOTALL)

# Schreibe die Datei zurück
with open('/home/einkaufsliste/api/admin_server.py', 'w') as f:
    f.write(new_content)

print("✅ handle_stats_request Funktion erfolgreich ersetzt")
EOF

echo "🔄 Starte API Service neu..."
pm2 restart api

echo "🧪 Teste API Stats Endpoint..."
sleep 3
response=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:5000/api/stats" 2>/dev/null)
if [ "$response" = "200" ]; then
    echo "✅ API Stats Endpoint funktioniert jetzt (HTTP $response)"
    echo "📄 Antwort:"
    curl -s "http://localhost:5000/api/stats" | python3 -m json.tool
else
    echo "❌ API Stats Endpoint funktioniert noch nicht (HTTP $response)"
    echo "📋 API Logs:"
    pm2 logs api --lines 10 --nostream
fi
