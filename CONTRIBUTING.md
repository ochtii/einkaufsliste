# Contributing to Einkaufsliste / Beitrag zur Einkaufsliste

Thank you for your interest in contributing to this project! / Vielen Dank für Ihr Interesse an diesem Projekt!

## 📋 Table of Contents / Inhaltsverzeichnis

- [Code of Conduct / Verhaltenskodex](#-code-of-conduct--verhaltenskodex)
- [Getting Started / Erste Schritte](#-getting-started--erste-schritte)
- [Development Setup / Entwicklungsumgebung](#-development-setup--entwicklungsumgebung)
- [Making Changes / Änderungen vornehmen](#-making-changes--änderungen-vornehmen)
- [Submitting Changes / Änderungen einreichen](#-submitting-changes--änderungen-einreichen)
- [Style Guidelines / Stil-Richtlinien](#-style-guidelines--stil-richtlinien)
- [License Agreement / Lizenzvereinbarung](#-license-agreement--lizenzvereinbarung)

## 📜 Code of Conduct / Verhaltenskodex

### 🇺🇸 English:
By participating in this project, you agree to abide by our code of conduct:

- **Be Respectful**: Treat all contributors with respect and kindness
- **Be Inclusive**: Welcome newcomers and diverse perspectives
- **Be Collaborative**: Work together towards common goals
- **Be Professional**: Maintain professional communication
- **Be Constructive**: Provide helpful feedback and suggestions

### 🇩🇪 Deutsch:
Durch die Teilnahme an diesem Projekt stimmen Sie unserem Verhaltenskodex zu:

- **Respektvoll sein**: Alle Mitwirkenden mit Respekt und Freundlichkeit behandeln
- **Inklusiv sein**: Newcomer und diverse Perspektiven willkommen heißen
- **Kollaborativ sein**: Gemeinsam auf gemeinsame Ziele hinarbeiten
- **Professionell sein**: Professionelle Kommunikation aufrechterhalten
- **Konstruktiv sein**: Hilfreiche Rückmeldungen und Vorschläge geben

## 🚀 Getting Started / Erste Schritte

### 🇺🇸 English:
1. **Fork the repository** to your GitHub account
2. **Clone your fork** locally
3. **Set up the development environment** (see below)
4. **Create a new branch** for your changes
5. **Make your changes** following our guidelines
6. **Test your changes** thoroughly
7. **Submit a pull request**

### 🇩🇪 Deutsch:
1. **Repository forken** zu Ihrem GitHub-Konto
2. **Fork lokal klonen**
3. **Entwicklungsumgebung einrichten** (siehe unten)
4. **Neuen Branch erstellen** für Ihre Änderungen
5. **Änderungen vornehmen** nach unseren Richtlinien
6. **Änderungen gründlich testen**
7. **Pull Request einreichen**

## 🛠️ Development Setup / Entwicklungsumgebung

### Prerequisites / Voraussetzungen:
```bash
# Required software / Erforderliche Software:
Node.js >= 14.0.0
npm >= 6.0.0 (or yarn >= 1.22.0)
Git
```

### Setup Steps / Einrichtungsschritte:
```bash
# 1. Clone your fork / Fork klonen
git clone https://github.com/yourusername/einkaufsliste.git
cd einkaufsliste

# 2. Install backend dependencies / Backend-Abhängigkeiten installieren
cd backend
npm install

# 3. Install frontend dependencies / Frontend-Abhängigkeiten installieren
cd ../frontend
npm install

# 4. Set up development environment / Entwicklungsumgebung einrichten
# Create .env files if needed / .env-Dateien bei Bedarf erstellen

# 5. Start development servers / Entwicklungsserver starten
# Terminal 1 - Backend:
cd backend && npm start

# Terminal 2 - Frontend:
cd frontend && npm start
```

### Development Tools / Entwicklungstools:
```bash
# Recommended VS Code extensions / Empfohlene VS Code-Erweiterungen:
- ES7+ React/Redux/React-Native snippets
- Prettier - Code formatter
- ESLint
- Tailwind CSS IntelliSense
- GitLens
- Thunder Client (for API testing)
```

## 🔄 Making Changes / Änderungen vornehmen

### Branch Naming / Branch-Benennung:
```bash
# Feature branches / Feature-Branches:
feature/description-of-feature
feature/add-export-functionality

# Bug fix branches / Bugfix-Branches:
bugfix/description-of-bug
bugfix/fix-login-validation

# Documentation branches / Dokumentations-Branches:
docs/description-of-docs
docs/update-readme
```

### Commit Messages / Commit-Nachrichten:

#### 🇺🇸 English Format:
```bash
# Format:
<type>(<scope>): <description>

# Types:
feat:     New feature
fix:      Bug fix
docs:     Documentation changes
style:    Code style changes (formatting, etc.)
refactor: Code refactoring
test:     Adding or updating tests
chore:    Maintenance tasks

# Examples:
feat(frontend): add export functionality to shopping lists
fix(backend): resolve authentication token validation
docs(readme): update installation instructions
style(components): format ArticleList component
```

#### 🇩🇪 Deutsches Format:
```bash
# Format:
<typ>(<bereich>): <beschreibung>

# Typen:
feat:     Neue Funktion
fix:      Fehlerbehebung
docs:     Dokumentationsänderungen
style:    Code-Stil-Änderungen (Formatierung, etc.)
refactor: Code-Refactoring
test:     Tests hinzufügen oder aktualisieren
chore:    Wartungsaufgaben

# Beispiele:
feat(frontend): Export-Funktionalität für Einkaufslisten hinzufügen
fix(backend): Authentifizierungs-Token-Validierung beheben
docs(readme): Installationsanweisungen aktualisieren
style(components): ArticleList-Komponente formatieren
```

### Testing / Testen:
```bash
# Frontend tests / Frontend-Tests:
cd frontend
npm test

# Backend tests / Backend-Tests:
cd backend
npm test

# Manual testing / Manuelle Tests:
# 1. Test all new functionality
# 2. Test existing functionality for regressions
# 3. Test on different browsers/devices
# 4. Test with different user roles
```

## 📤 Submitting Changes / Änderungen einreichen

### Pull Request Process / Pull-Request-Prozess:

#### 🇺🇸 English:
1. **Update your fork** with the latest changes from main
2. **Push your changes** to your fork
3. **Create a pull request** with:
   - Clear title describing the change
   - Detailed description of what was changed and why
   - Link to any relevant issues
   - Screenshots/GIFs for UI changes
   - Test results or testing instructions

#### 🇩🇪 Deutsch:
1. **Fork aktualisieren** mit den neuesten Änderungen von main
2. **Änderungen pushen** zu Ihrem Fork
3. **Pull Request erstellen** mit:
   - Klarem Titel, der die Änderung beschreibt
   - Detaillierte Beschreibung was geändert wurde und warum
   - Link zu relevanten Issues
   - Screenshots/GIFs für UI-Änderungen
   - Testergebnisse oder Testanweisungen

### Pull Request Template / Pull-Request-Vorlage:
```markdown
## Description / Beschreibung
Brief description of the changes / Kurze Beschreibung der Änderungen

## Type of Change / Art der Änderung
- [ ] Bug fix / Fehlerbehebung
- [ ] New feature / Neue Funktion
- [ ] Breaking change / Breaking Change
- [ ] Documentation update / Dokumentationsaktualisierung

## Testing / Testen
- [ ] Unit tests pass / Unit-Tests bestehen
- [ ] Manual testing completed / Manuelle Tests abgeschlossen
- [ ] Cross-browser testing / Cross-Browser-Tests

## Screenshots / Screenshots
(If applicable / Falls zutreffend)

## Checklist / Checkliste
- [ ] Code follows style guidelines / Code folgt Stil-Richtlinien
- [ ] Self-review completed / Selbstüberprüfung abgeschlossen
- [ ] Comments added for complex code / Kommentare für komplexen Code hinzugefügt
- [ ] Documentation updated / Dokumentation aktualisiert
```

## 🎨 Style Guidelines / Stil-Richtlinien

### JavaScript/React:
```javascript
// Use functional components with hooks
// Funktionale Komponenten mit Hooks verwenden
const MyComponent = ({ prop1, prop2 }) => {
  const [state, setState] = useState(initialValue);
  
  // Use descriptive variable names
  // Beschreibende Variablennamen verwenden
  const isLoading = false;
  const userArticles = [];
  
  // Use arrow functions for handlers
  // Arrow Functions für Handler verwenden
  const handleSubmit = async (e) => {
    e.preventDefault();
    // Implementation
  };
  
  return (
    <div className="container">
      {/* Use semantic HTML / Semantisches HTML verwenden */}
      <main>
        <h1>Title</h1>
        <article>Content</article>
      </main>
    </div>
  );
};
```

### CSS/Tailwind:
```html
<!-- Use Tailwind utility classes -->
<!-- Tailwind Utility-Klassen verwenden -->
<div class="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
  <h2 class="text-xl font-semibold text-white">Title</h2>
  <button class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded">
    Action
  </button>
</div>
```

### File Organization / Dateiorganisation:
```
src/
├── components/
│   ├── common/          # Reusable components
│   ├── forms/           # Form components
│   └── layout/          # Layout components
├── hooks/               # Custom hooks
├── utils/               # Utility functions
├── contexts/            # React contexts
└── constants/           # Constants and configurations
```

## 📄 License Agreement / Lizenzvereinbarung

### 🇺🇸 English:
By contributing to this project, you agree that:

1. **Your contributions** will be licensed under the same MIT License
2. **You have the right** to submit the work under this license
3. **You understand** that your contributions may be redistributed
4. **You grant** a perpetual, worldwide, non-exclusive license to use your contributions

### 🇩🇪 Deutsch:
Durch Ihren Beitrag zu diesem Projekt stimmen Sie zu, dass:

1. **Ihre Beiträge** unter derselben MIT-Lizenz lizenziert werden
2. **Sie das Recht haben**, die Arbeit unter dieser Lizenz einzureichen
3. **Sie verstehen**, dass Ihre Beiträge weiterverbreitet werden können
4. **Sie gewähren** eine unbefristete, weltweite, nicht-exklusive Lizenz zur Nutzung Ihrer Beiträge

## 🏆 Recognition / Anerkennung

### 🇺🇸 English:
Contributors will be recognized in the following ways:
- Listed in the project's contributors section
- Mentioned in release notes for significant contributions
- Badge recognition for regular contributors

### 🇩🇪 Deutsch:
Mitwirkende werden auf folgende Weise anerkannt:
- Auflistung im Mitwirkenden-Bereich des Projekts
- Erwähnung in Release-Notes für bedeutende Beiträge
- Badge-Anerkennung für regelmäßige Mitwirkende

## ❓ Questions / Fragen

### 🇺🇸 English:
If you have questions about contributing:
1. Check this document first
2. Search existing issues and discussions
3. Open a new issue with the "question" label
4. Join our community discussions

### 🇩🇪 Deutsch:
Bei Fragen zum Mitwirken:
1. Prüfen Sie zuerst dieses Dokument
2. Durchsuchen Sie bestehende Issues und Diskussionen
3. Öffnen Sie ein neues Issue mit dem Label "question"
4. Nehmen Sie an unseren Community-Diskussionen teil

---

**Thank you for contributing! / Vielen Dank für Ihren Beitrag!** 🎉

Last updated / Zuletzt aktualisiert: August 6, 2025
