#!/usr/bin/env python3
"""
API Documentation Generator
Generiert HTML-Dokumentation für die Einkaufsliste API
"""

def generate_documentation():
    """Generiert die API-Dokumentation als HTML"""
    
    html_content = """<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Einkaufsliste API Documentation</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            background: #f5f5f5;
        }
        .container {
            background: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        h1 { color: #2c3e50; border-bottom: 3px solid #3498db; padding-bottom: 10px; }
        h2 { color: #34495e; margin-top: 30px; }
        h3 { color: #7f8c8d; }
        .endpoint {
            background: #f8f9fa;
            border: 1px solid #e9ecef;
            border-radius: 5px;
            padding: 15px;
            margin: 15px 0;
        }
        .method {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 3px;
            font-weight: bold;
            font-size: 12px;
            margin-right: 10px;
        }
        .get { background: #d4edda; color: #155724; }
        .post { background: #cce5ff; color: #004085; }
        .put { background: #fff3cd; color: #856404; }
        .delete { background: #f8d7da; color: #721c24; }
        .code {
            background: #f4f4f4;
            border: 1px solid #ddd;
            border-radius: 4px;
            padding: 10px;
            margin: 10px 0;
            overflow-x: auto;
        }
        .status-code {
            display: inline-block;
            padding: 2px 6px;
            border-radius: 3px;
            font-weight: bold;
            font-size: 11px;
        }
        .status-200 { background: #d4edda; color: #155724; }
        .status-400 { background: #f8d7da; color: #721c24; }
        .status-401 { background: #f8d7da; color: #721c24; }
        .status-404 { background: #f8d7da; color: #721c24; }
        .status-500 { background: #f8d7da; color: #721c24; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🛒 Einkaufsliste API Documentation</h1>
        
        <h2>📋 Übersicht</h2>
        <p>Die Einkaufsliste API bietet umfassende Endpoints für die Verwaltung von Einkaufslisten, Kategorien und Administratorfunktionen.</p>
        
        <p><strong>Base URL:</strong> <code>http://localhost:5000</code></p>
        <p><strong>API Version:</strong> 3.0</p>
        <p><strong>Content-Type:</strong> application/json</p>
        
        <h2>🔐 Authentifizierung</h2>
        <p>Einige Endpoints erfordern Admin-Authentifizierung über Session-Cookies.</p>
        
        <h2>📚 API Endpoints</h2>
        
        <h3>👤 Benutzer-Endpoints</h3>
        
        <div class="endpoint">
            <h4><span class="method get">GET</span>/api/users</h4>
            <p>Ruft alle registrierten Benutzer ab.</p>
            <div class="code">
{
  "users": [
    {
      "id": 1,
      "username": "user1",
      "email": "user1@example.com",
      "created_at": "2025-01-01T10:00:00"
    }
  ]
}
            </div>
            <p><span class="status-code status-200">200</span> Erfolgreich</p>
        </div>
        
        <div class="endpoint">
            <h4><span class="method post">POST</span>/api/users</h4>
            <p>Erstellt einen neuen Benutzer.</p>
            <div class="code">
// Request Body:
{
  "username": "newuser",
  "email": "newuser@example.com",
  "password": "securepassword"
}

// Response:
{
  "message": "Benutzer erfolgreich erstellt",
  "user_id": 2
}
            </div>
            <p><span class="status-code status-200">200</span> Erfolgreich</p>
            <p><span class="status-code status-400">400</span> Ungültige Daten</p>
        </div>
        
        <h3>📝 Listen-Endpoints</h3>
        
        <div class="endpoint">
            <h4><span class="method get">GET</span>/api/lists</h4>
            <p>Ruft alle Einkaufslisten ab.</p>
            <div class="code">
{
  "lists": [
    {
      "id": 1,
      "name": "Wocheneinkauf",
      "user_id": 1,
      "created_at": "2025-01-01T10:00:00",
      "items_count": 5
    }
  ]
}
            </div>
        </div>
        
        <div class="endpoint">
            <h4><span class="method post">POST</span>/api/lists</h4>
            <p>Erstellt eine neue Einkaufsliste.</p>
            <div class="code">
// Request Body:
{
  "name": "Neue Liste",
  "user_id": 1
}

// Response:
{
  "message": "Liste erfolgreich erstellt",
  "list_id": 2
}
            </div>
        </div>
        
        <div class="endpoint">
            <h4><span class="method get">GET</span>/api/lists/{list_id}</h4>
            <p>Ruft Details einer spezifischen Liste ab.</p>
            <div class="code">
{
  "list": {
    "id": 1,
    "name": "Wocheneinkauf",
    "user_id": 1,
    "created_at": "2025-01-01T10:00:00",
    "items": [
      {
        "id": 1,
        "name": "Milch",
        "quantity": "1L",
        "category": "Milchprodukte",
        "completed": false
      }
    ]
  }
}
            </div>
        </div>
        
        <h3>🛍️ Artikel-Endpoints</h3>
        
        <div class="endpoint">
            <h4><span class="method post">POST</span>/api/lists/{list_id}/items</h4>
            <p>Fügt einen Artikel zur Liste hinzu.</p>
            <div class="code">
// Request Body:
{
  "name": "Brot",
  "quantity": "2 Stück",
  "category": "Backwaren"
}

// Response:
{
  "message": "Artikel hinzugefügt",
  "item_id": 5
}
            </div>
        </div>
        
        <div class="endpoint">
            <h4><span class="method put">PUT</span>/api/items/{item_id}</h4>
            <p>Aktualisiert einen Artikel.</p>
            <div class="code">
// Request Body:
{
  "name": "Vollkornbrot",
  "quantity": "1 Stück",
  "completed": true
}

// Response:
{
  "message": "Artikel aktualisiert"
}
            </div>
        </div>
        
        <div class="endpoint">
            <h4><span class="method delete">DELETE</span>/api/items/{item_id}</h4>
            <p>Löscht einen Artikel.</p>
            <div class="code">
{
  "message": "Artikel gelöscht"
}
            </div>
        </div>
        
        <h3>📊 Kategorie-Endpoints</h3>
        
        <div class="endpoint">
            <h4><span class="method get">GET</span>/api/categories</h4>
            <p>Ruft alle verfügbaren Kategorien ab.</p>
            <div class="code">
{
  "categories": [
    {
      "id": 1,
      "name": "Obst & Gemüse",
      "icon": "🥕",
      "color": "#4CAF50"
    },
    {
      "id": 2,
      "name": "Milchprodukte",
      "icon": "🥛",
      "color": "#2196F3"
    }
  ]
}
            </div>
        </div>
        
        <h3>🔧 Admin-Endpoints</h3>
        
        <div class="endpoint">
            <h4><span class="method get">GET</span>/admin/stats</h4>
            <p>Ruft Systemstatistiken ab (Admin-Authentifizierung erforderlich).</p>
            <div class="code">
{
  "stats": {
    "total_users": 25,
    "total_lists": 150,
    "total_items": 1250,
    "active_users": 12,
    "server_uptime": "5 days, 3 hours"
  }
}
            </div>
        </div>
        
        <div class="endpoint">
            <h4><span class="method post">POST</span>/admin/broadcast</h4>
            <p>Sendet eine Broadcast-Nachricht an alle Benutzer.</p>
            <div class="code">
// Request Body:
{
  "message": "Wartungsarbeiten um 20:00 Uhr",
  "type": "info"
}

// Response:
{
  "message": "Broadcast gesendet",
  "recipients": 25
}
            </div>
        </div>
        
        <h3>💡 System-Endpoints</h3>
        
        <div class="endpoint">
            <h4><span class="method get">GET</span>/api/health</h4>
            <p>Health Check Endpoint.</p>
            <div class="code">
{
  "status": "healthy",
  "timestamp": "2025-01-01T10:00:00",
  "version": "3.0",
  "database": "connected"
}
            </div>
        </div>
        
        <div class="endpoint">
            <h4><span class="method get">GET</span>/api/version</h4>
            <p>API-Versionsinformation.</p>
            <div class="code">
{
  "version": "3.0",
  "build": "2025.01.01",
  "environment": "production"
}
            </div>
        </div>
        
        <h2>📋 Status Codes</h2>
        <ul>
            <li><span class="status-code status-200">200</span> OK - Anfrage erfolgreich</li>
            <li><span class="status-code status-400">400</span> Bad Request - Ungültige Anfrage</li>
            <li><span class="status-code status-401">401</span> Unauthorized - Authentifizierung erforderlich</li>
            <li><span class="status-code status-404">404</span> Not Found - Ressource nicht gefunden</li>
            <li><span class="status-code status-500">500</span> Internal Server Error - Serverfehler</li>
        </ul>
        
        <h2>💻 Beispiel-Implementierung</h2>
        <div class="code">
// JavaScript Beispiel
async function getUsers() {
    try {
        const response = await fetch('/api/users');
        const data = await response.json();
        console.log('Benutzer:', data.users);
    } catch (error) {
        console.error('Fehler:', error);
    }
}

// Artikel hinzufügen
async function addItem(listId, item) {
    try {
        const response = await fetch(`/api/lists/${listId}/items`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(item)
        });
        const data = await response.json();
        console.log('Artikel hinzugefügt:', data);
    } catch (error) {
        console.error('Fehler:', error);
    }
}
        </div>
        
        <hr>
        <p><small>Generated by Einkaufsliste API Documentation Generator v3.0</small></p>
    </div>
</body>
</html>"""
    
    return html_content

if __name__ == "__main__":
    # Für direkten Aufruf
    print(generate_documentation())
