import sqlite3
import os
from datetime import datetime

class EasterEggDB:
    def __init__(self, db_path="eastereggs.db"):
        self.db_path = db_path
        self.init_database()
    
    def init_database(self):
        """Initialize the Easter Egg database with all required tables"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Easter eggs table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS eastereggs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT UNIQUE NOT NULL,
                displayed_name TEXT NOT NULL,
                founds INTEGER DEFAULT 0,
                time_last_found DATETIME,
                active BOOLEAN DEFAULT 1
            )
        ''')
        
        # Found log table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS found_log (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                date DATE NOT NULL,
                time TIME NOT NULL,
                easteregg_name TEXT NOT NULL,
                easteregg_id INTEGER,
                user_uuid TEXT NOT NULL,
                user_name TEXT,
                user_ip TEXT,
                FOREIGN KEY (easteregg_id) REFERENCES eastereggs (id)
            )
        ''')
        
        # Finders table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS finders (
                uuid TEXT PRIMARY KEY,
                name TEXT,
                date_first_find DATETIME,
                last_find DATETIME,
                find_cnt INTEGER DEFAULT 0,
                found_eggs TEXT DEFAULT '[]'  -- JSON array as string
            )
        ''')
        
        # API keys table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS egg_api_key (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                key TEXT UNIQUE NOT NULL,
                last_until DATETIME,
                is_active BOOLEAN DEFAULT 1
            )
        ''')
        
        # Insert default easter eggs
        default_eggs = [
            ('stars_and_sweets', 'Sterne & Süßwaren', 'Gefunden durch ⭐ Icon + 🍭 Süßwaren Kategorie'),
        ]
        
        for egg_name, display_name, description in default_eggs:
            cursor.execute('''
                INSERT OR IGNORE INTO eastereggs (name, displayed_name) 
                VALUES (?, ?)
            ''', (egg_name, display_name))
        
        # Insert default API key
        cursor.execute('''
            INSERT OR IGNORE INTO egg_api_key (key, is_active) 
            VALUES (?, ?)
        ''', ('einkaufsliste-easter-2025', True))
        
        conn.commit()
        conn.close()
    
    def find_easter_egg(self, egg_name, user_uuid, user_name=None, user_ip=None):
        """Record an easter egg find"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        now = datetime.now()
        date_str = now.strftime('%Y-%m-%d')
        time_str = now.strftime('%H:%M:%S')
        
        # Get easter egg info
        cursor.execute('SELECT id, founds FROM eastereggs WHERE name = ? AND active = 1', (egg_name,))
        egg_result = cursor.fetchone()
        
        if not egg_result:
            conn.close()
            return {'success': False, 'message': 'Easter egg not found or inactive'}
        
        egg_id, current_founds = egg_result
        
        # Check if user exists, create if not
        cursor.execute('SELECT find_cnt, found_eggs FROM finders WHERE uuid = ?', (user_uuid,))
        finder_result = cursor.fetchone()
        
        is_first_find_ever = False
        is_first_find_for_user = False
        
        if finder_result:
            user_find_cnt, found_eggs_str = finder_result
            import json
            found_eggs = json.loads(found_eggs_str)
            
            if egg_name not in found_eggs:
                is_first_find_for_user = True
                found_eggs.append(egg_name)
                user_find_cnt += 1
                
                cursor.execute('''
                    UPDATE finders SET 
                    last_find = ?, 
                    find_cnt = ?, 
                    found_eggs = ?,
                    name = ?
                    WHERE uuid = ?
                ''', (now, user_find_cnt, json.dumps(found_eggs), user_name, user_uuid))
        else:
            # First time user
            is_first_find_ever = True
            is_first_find_for_user = True
            import json
            found_eggs = [egg_name]
            
            cursor.execute('''
                INSERT INTO finders (uuid, name, date_first_find, last_find, find_cnt, found_eggs)
                VALUES (?, ?, ?, ?, ?, ?)
            ''', (user_uuid, user_name, now, now, 1, json.dumps(found_eggs)))
        
        # Only log if it's a new find for this user
        if is_first_find_for_user:
            # Update easter egg stats
            cursor.execute('''
                UPDATE eastereggs SET 
                founds = founds + 1, 
                time_last_found = ? 
                WHERE id = ?
            ''', (now, egg_id))
            
            # Log the find
            cursor.execute('''
                INSERT INTO found_log 
                (date, time, easteregg_name, easteregg_id, user_uuid, user_name, user_ip)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            ''', (date_str, time_str, egg_name, egg_id, user_uuid, user_name, user_ip))
        
        conn.commit()
        conn.close()
        
        return {
            'success': True,
            'is_first_find_ever': is_first_find_ever,
            'is_first_find_for_user': is_first_find_for_user,
            'egg_name': egg_name,
            'total_finds': current_founds + (1 if is_first_find_for_user else 0)
        }
    
    def get_user_stats(self, user_uuid):
        """Get user's easter egg statistics"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('SELECT find_cnt, found_eggs FROM finders WHERE uuid = ?', (user_uuid,))
        result = cursor.fetchone()
        
        if result:
            find_cnt, found_eggs_str = result
            import json
            found_eggs = json.loads(found_eggs_str)
        else:
            find_cnt = 0
            found_eggs = []
        
        conn.close()
        
        return {
            'total_finds': find_cnt,
            'found_eggs': found_eggs
        }
    
    def validate_api_key(self, api_key):
        """Validate API key"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('SELECT is_active FROM egg_api_key WHERE key = ?', (api_key,))
        result = cursor.fetchone()
        
        conn.close()
        
        return result and result[0] == 1
