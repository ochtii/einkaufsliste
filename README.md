# 🛒 Einkaufsliste / Shopping List Application

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-14+-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18+-blue.svg)](https://reactjs.org/)

A comprehensive shopping list application with user management, real-time synchronization, and advanced features.
Eine umfassende Einkaufslisten-Anwendung mit Benutzerverwaltung, Echtzeitsynchronisation und erweiterten Funktionen.

## 📋 Table of Contents / Inhaltsverzeichnis

- [Features / Funktionen](#-features--funktionen)
- [Prerequisites / Voraussetzungen](#-prerequisites--voraussetzungen)
- [Installation](#-installation)
- [Usage / Verwendung](#-usage--verwendung)
- [Project Structure / Projektstruktur](#-project-structure--projektstruktur)
- [License / Lizenz](#-license--lizenz)
- [Contributing / Mitwirken](#-contributing--mitwirken)
- [Support / Unterstützung](#-support--unterstützung)

## ✨ Features / Funktionen

### 🇺🇸 English Features:
- **Multi-user Support**: Individual user accounts with authentication
- **Real-time Shopping Lists**: Create, edit, and manage multiple shopping lists
- **Category Management**: Organize items by customizable categories with emojis
- **Product Management**: Comprehensive admin panel for managing standard articles
- **Favorites System**: Quick access to frequently used items
- **Export Functionality**: Export shopping lists as formatted text documents
- **Dark Theme**: Modern, responsive UI with dark theme
- **Admin Dashboard**: User management, broadcasts, and system administration
- **Bulk Operations**: Select and manage multiple items at once
- **UUID-based**: Secure user identification and data isolation

### 🇩🇪 Deutsche Funktionen:
- **Mehrbenutzersupport**: Individuelle Benutzerkonten mit Authentifizierung
- **Echtzeit-Einkaufslisten**: Erstellen, bearbeiten und verwalten mehrerer Einkaufslisten
- **Kategorienverwaltung**: Artikel nach anpassbaren Kategorien mit Emojis organisieren
- **Produktverwaltung**: Umfassendes Admin-Panel zur Verwaltung von Standardartikeln
- **Favoritensystem**: Schneller Zugriff auf häufig verwendete Artikel
- **Export-Funktionalität**: Einkaufslisten als formatierte Textdokumente exportieren
- **Dunkles Theme**: Modernes, responsives UI mit dunklem Theme
- **Admin-Dashboard**: Benutzerverwaltung, Broadcasts und Systemadministration
- **Bulk-Operationen**: Mehrere Artikel gleichzeitig auswählen und verwalten
- **UUID-basiert**: Sichere Benutzeridentifikation und Datenisolierung

## 📋 Prerequisites / Voraussetzungen
## 📋 Prerequisites / Voraussetzungen

### System Requirements / Systemanforderungen:
- **Node.js** >= 14.0.0 (recommended: latest LTS)
- **npm** >= 6.0.0 or **yarn** >= 1.22.0
- **Git** (optional, for cloning)
- **Modern Web Browser** (Chrome, Firefox, Safari, Edge)

### Development Environment / Entwicklungsumgebung:
- **VS Code** (recommended with extensions)
- **Terminal/Command Prompt**
- **SQLite** (included with Node.js)

## 🚀 Installation

### 1. Clone Repository / Repository klonen:
```bash
git clone https://github.com/ochtii/einkaufsliste.git
cd einkaufsliste
```

### 2. Backend Setup / Backend-Einrichtung:
```bash
cd backend
npm install
npm start
```
**Backend runs on / Backend läuft auf:** `http://localhost:4000`

### 3. Frontend Setup / Frontend-Einrichtung:
```bash
cd ../frontend
npm install
npm start
```
**Frontend runs on / Frontend läuft auf:** `http://localhost:3000`

### 4. Access Application / Anwendung aufrufen:
- Open browser / Browser öffnen: `http://localhost:3000`
- Register new account / Neues Konto registrieren
- Start creating shopping lists / Einkaufslisten erstellen

## 🎯 Usage / Verwendung

### 🇺🇸 English Usage:

#### For Regular Users:
1. **Registration**: Create a new account or login
2. **Create Lists**: Add new shopping lists with custom names
3. **Add Items**: Use the smart suggestion system with favorites
4. **Organize**: Categories automatically organize your items
5. **Shop**: Check off items as you shop
6. **Export**: Download your lists as text files
7. **Manage**: Edit, delete, or duplicate lists as needed

#### For Administrators:
1. **Admin Access**: Login with admin credentials
2. **User Management**: View and manage user accounts
3. **Product Management**: Add/edit standard articles and categories
4. **Broadcasts**: Send notifications to all users
5. **System Overview**: Monitor application usage

### 🇩🇪 Deutsche Verwendung:

#### Für normale Benutzer:
1. **Registrierung**: Neues Konto erstellen oder anmelden
2. **Listen erstellen**: Neue Einkaufslisten mit benutzerdefinierten Namen hinzufügen
3. **Artikel hinzufügen**: Intelligentes Vorschlagssystem mit Favoriten verwenden
4. **Organisieren**: Kategorien organisieren Ihre Artikel automatisch
5. **Einkaufen**: Artikel beim Einkaufen abhaken
6. **Exportieren**: Listen als Textdateien herunterladen
7. **Verwalten**: Listen nach Bedarf bearbeiten, löschen oder duplizieren

#### Für Administratoren:
1. **Admin-Zugang**: Mit Admin-Anmeldedaten anmelden
2. **Benutzerverwaltung**: Benutzerkonten anzeigen und verwalten
3. **Produktverwaltung**: Standardartikel und Kategorien hinzufügen/bearbeiten
4. **Broadcasts**: Benachrichtigungen an alle Benutzer senden
5. **Systemübersicht**: Anwendungsnutzung überwachen

## 📁 Project Structure / Projektstruktur
## 📁 Project Structure / Projektstruktur

```
einkaufsliste/
├── 📄 LICENSE                    # MIT License (multilingual)
├── 📄 README.md                  # This documentation
├── 🖥️ backend/                  # Node.js/Express Backend
│   ├── 📄 package.json          # Backend dependencies
│   ├── 📄 server.js             # Main server file
│   └── 📄 db.sqlite             # SQLite database
├── 🌐 frontend/                 # React Frontend
│   ├── 📄 package.json          # Frontend dependencies
│   ├── 📄 tailwind.config.js    # Tailwind CSS configuration
│   ├── 📁 public/               # Static assets
│   │   └── 📄 index.html        # HTML template
│   └── 📁 src/                  # Source code
│       ├── 📄 App.jsx           # Main application component
│       ├── 📄 index.jsx         # Application entry point
│       ├── 📁 components/       # React components
│       │   ├── 📄 ArticleForm.jsx      # Article input form
│       │   ├── 📄 ArticleList.jsx      # Shopping list display
│       │   ├── 📄 CategoryIcon.jsx     # Category icons
│       │   ├── 📄 FavoriteList.jsx     # Favorites management
│       │   ├── 📄 ProductManagement.jsx # Admin product management
│       │   └── 📄 [other components]   # Additional components
│       └── 📁 utils/            # Utility functions
│           └── 📄 api.js        # API communication
```

### Key Components / Hauptkomponenten:

#### Backend / Backend:
- **server.js**: Express server with REST API endpoints
- **db.sqlite**: SQLite database with user data, lists, articles, categories
- **Authentication**: JWT-based user authentication
- **API Endpoints**: RESTful API for all operations

#### Frontend / Frontend:
- **React 18+**: Modern React with hooks and functional components
- **Tailwind CSS**: Utility-first CSS framework for styling
- **Component Architecture**: Modular, reusable components
- **State Management**: React hooks for state management
- **Responsive Design**: Mobile-first responsive layout

## 📜 License / Lizenz

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for complete details in multiple languages.

Dieses Projekt steht unter der **MIT-Lizenz** - siehe die [LICENSE](LICENSE) Datei für vollständige Details in mehreren Sprachen.

### License Summary / Lizenz-Zusammenfassung:

#### 🇺🇸 English:
- ✅ **Commercial use** - Use for commercial purposes
- ✅ **Modification** - Modify the source code
- ✅ **Distribution** - Distribute copies
- ✅ **Private use** - Use privately
- ❌ **Liability** - No warranty or liability
- ❌ **Warranty** - No warranty provided

#### 🇩🇪 Deutsch:
- ✅ **Kommerzielle Nutzung** - Für kommerzielle Zwecke verwenden
- ✅ **Modifikation** - Quellcode ändern
- ✅ **Verteilung** - Kopien verteilen
- ✅ **Private Nutzung** - Privat verwenden
- ❌ **Haftung** - Keine Gewährleistung oder Haftung
- ❌ **Garantie** - Keine Garantie gewährt

## 🤝 Contributing / Mitwirken

### 🇺🇸 English:
Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### 🇩🇪 Deutsch:
Beiträge sind willkommen! Bitte reichen Sie gerne einen Pull Request ein. Bei größeren Änderungen öffnen Sie bitte zuerst ein Issue, um zu besprechen, was Sie ändern möchten.

1. Repository forken
2. Feature-Branch erstellen (`git checkout -b feature/TollesFunktion`)
3. Änderungen committen (`git commit -m 'Füge tolle Funktion hinzu'`)
4. Zum Branch pushen (`git push origin feature/TollesFunktion`)
5. Pull Request öffnen

## 🆘 Support / Unterstützung

### 🇺🇸 English:
If you encounter any issues or have questions:

1. **Check Documentation**: Review this README and the LICENSE file
2. **Search Issues**: Look for existing issues in the repository
3. **Create Issue**: Open a new issue with detailed description
4. **Community**: Join discussions in the repository

### 🇩🇪 Deutsch:
Bei Problemen oder Fragen:

1. **Dokumentation prüfen**: Diese README und die LICENSE-Datei durchlesen
2. **Issues durchsuchen**: Nach bestehenden Issues im Repository suchen
3. **Issue erstellen**: Neues Issue mit detaillierter Beschreibung öffnen
4. **Community**: An Diskussionen im Repository teilnehmen

## 🏗️ Technical Details / Technische Details

### Database Schema / Datenbankschema:
- **users**: User accounts with UUID identification
- **lists**: Shopping lists belonging to users
- **articles**: List items with categories and status
- **categories**: Item categories with icons
- **favorites**: User favorite items
- **standard_articles**: Predefined article templates

### API Endpoints / API-Endpunkte:
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/lists` - Get user lists
- `POST /api/lists` - Create new list
- `GET /api/categories` - Get categories
- `POST /api/standard-articles` - Add standard article
- `GET /api/admin/users` - Admin user management

### Security Features / Sicherheitsfeatures:
- JWT token authentication
- Password hashing with bcrypt
- User data isolation
- Input validation and sanitization
- CORS protection

---

## 📞 Contact / Kontakt

For questions about this project or license:
Bei Fragen zu diesem Projekt oder der Lizenz:

- **Project Repository**: https://github.com/ochtii/einkaufsliste
- **Documentation**: See this README.md file
- **License**: See LICENSE file for complete terms

---

**Made with ❤️ by developers for developers**  
**Erstellt mit ❤️ von Entwicklern für Entwickler**

Last updated / Zuletzt aktualisiert: August 6, 2025
- Backend-DB unter `backend/db.sqlite`.

## Lizenz
MIT
