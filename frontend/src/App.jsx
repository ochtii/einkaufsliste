import { useEffect, useState, useCallback } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { useDemoMode } from './hooks/useDemoMode';
import DemoHeader from './components/DemoHeader';
import LoginForm from './components/LoginForm';
import RegisterForm from './components/RegisterForm';
import ListManager from './components/ListManager';
import ArticleList from './components/ArticleList';
import FavoriteList from './components/FavoriteList';
import UserSettings from './components/UserSettings';
import ProductManagement from './components/ProductManagement';
import Admin from './components/Admin';
import BroadcastDisplay from './components/BroadcastDisplay';

function MainApp() {
  const { user, logout, token } = useAuth();
  const [currentList, setCurrentList] = useState(null);
  const [articles, setArticles] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [hideBoughtItems, setHideBoughtItems] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showProductManagement, setShowProductManagement] = useState(false);
  const [showUserSettings, setShowUserSettings] = useState(false);

  const loadArticles = useCallback(async () => {
    if (!currentList) return;
    
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`http://localhost:4000/api/lists/${currentList.id}/articles`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setArticles(data);
      } else {
        setError('Fehler beim Laden der Artikel');
      }
    } catch (err) {
      setError('Verbindungsfehler: ' + err.message);
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [currentList, token]);

  const loadFavorites = useCallback(async () => {
    try {
      const response = await fetch('http://localhost:4000/api/favorites', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setFavorites(data);
      }
    } catch (err) {
      console.error('Error loading favorites:', err);
    }
  }, [token]);

  useEffect(() => {
    if (user && currentList) {
      loadArticles();
      loadFavorites();
    } else {
      setLoading(false);
    }
  }, [user, currentList, loadArticles, loadFavorites]);

  async function handleAddToFavorites(article) {
    try {
      const response = await fetch('http://localhost:4000/api/favorites', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: article.name,
          category: article.category,
          icon: article.icon,
          comment: article.comment
        })
      });

      if (response.ok) {
        loadFavorites();
      }
    } catch (err) {
      setError('Fehler beim Hinzufügen zu Favoriten: ' + err.message);
    }
  }

  async function handleRemoveFromFavorites(favoriteId) {
    try {
      const response = await fetch(`http://localhost:4000/api/favorites/${favoriteId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        loadFavorites();
      }
    } catch (err) {
      setError('Fehler beim Entfernen aus Favoriten: ' + err.message);
    }
  }

  async function handleToggleBought(article) {
    try {
      const response = await fetch(`http://localhost:4000/api/articles/${article.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...article,
          is_bought: !article.is_bought
        })
      });

      if (response.ok) {
        loadArticles();
      }
    } catch (err) {
      setError('Fehler beim Aktualisieren: ' + err.message);
    }
  }

  async function handleDelete(id) {
    try {
      const response = await fetch(`http://localhost:4000/api/articles/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        loadArticles();
      }
    } catch (err) {
      setError('Fehler beim Löschen: ' + err.message);
    }
  }

  async function handleAddFromFavorite(favorite) {
    if (!currentList) return;
    
    try {
      const response = await fetch(`http://localhost:4000/api/lists/${currentList.id}/articles`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: favorite.name,
          category: favorite.category,
          icon: favorite.icon,
          comment: favorite.comment
        })
      });

      if (response.ok) {
        loadArticles();
      }
    } catch (err) {
      setError('Fehler beim Hinzufügen: ' + err.message);
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <div className="container mx-auto px-4 py-8">
        {/* Broadcasts */}
        <BroadcastDisplay />
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">🛒 Einkaufsliste</h1>
            <p className="text-gray-400">Willkommen, {user?.username}!</p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowProductManagement(!showProductManagement)}
              className="btn-secondary"
              title="Produktverwaltung"
            >
              📦
            </button>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="btn-secondary"
              title="Einstellungen"
            >
              ⚙️
            </button>
            <button
              onClick={logout}
              className="btn-secondary"
            >
              Abmelden
            </button>
          </div>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <div className="mb-6 card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-white">⚙️ Einstellungen</h2>
              <button
                onClick={() => setShowSettings(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              {/* Hide bought items toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-white font-medium">Gekaufte Artikel ausblenden</h3>
                  <p className="text-sm text-gray-400">Verstecke bereits gekaufte Artikel in der Liste</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hideBoughtItems}
                    onChange={(e) => setHideBoughtItems(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
              
              {/* User settings placeholder */}
              <div className="border-t border-gray-700 pt-4">
                <h3 className="text-white font-medium mb-2">Benutzer-Einstellungen</h3>
                <div className="space-y-2">
                  <button 
                    onClick={() => setShowUserSettings(true)}
                    className="btn-secondary text-sm w-full"
                  >
                    👤 Konto verwalten
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 card p-4 border-red-800 bg-red-900/20">
            <p className="text-red-400">⚠️ {error}</p>
            <button 
              onClick={() => setError(null)}
              className="mt-2 text-sm text-red-400 hover:text-red-300"
            >
              Schließen
            </button>
          </div>
        )}

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar - Lists */}
          <div className="lg:col-span-1">
            <ListManager 
              onSelectList={setCurrentList}
              currentList={currentList}
            />
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {currentList ? (
              <div className="card p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-white">
                    📝 {currentList.icon} {currentList.name}
                  </h2>
                  <label className="flex items-center space-x-2 text-sm">
                    <input
                      type="checkbox"
                      checked={hideBoughtItems}
                      onChange={(e) => setHideBoughtItems(e.target.checked)}
                      className="w-4 h-4 text-blue-600 bg-gray-800 border-gray-600 rounded focus:ring-blue-500 focus:ring-2"
                    />
                    <span className="text-gray-300">Gekaufte ausblenden</span>
                  </label>
                </div>
                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-400">Lade Artikel...</p>
                  </div>
                ) : (
                  <ArticleList 
                    articles={hideBoughtItems ? articles.filter(a => !a.is_bought) : articles} 
                    onToggleBought={handleToggleBought}
                    onDelete={handleDelete} 
                    onAddToFavorites={handleAddToFavorites}
                    favoriteIds={new Set(favorites.map(f => `${f.name}-${f.category}`))}
                    onAdded={loadArticles}
                    currentList={currentList}
                    token={token}
                  />
                )}
              </div>
            ) : (
              <div className="card p-8 text-center">
                <div className="text-6xl mb-4">📋</div>
                <h3 className="text-xl font-semibold text-gray-300 mb-2">Wähle eine Liste</h3>
                <p className="text-gray-400">Wähle links eine Liste aus oder erstelle eine neue.</p>
              </div>
            )}
          </div>

          {/* Right Sidebar - Favorites */}
          <div className="lg:col-span-1 space-y-6">
            <div className="card p-6">
              <h2 className="text-xl font-semibold mb-4 text-white">⭐ Favoriten</h2>
              <FavoriteList 
                favorites={favorites}
                onSelect={handleAddFromFavorite}
                onRemove={handleRemoveFromFavorites}
              />
            </div>
            
            {/* Statistics */}
            <div className="card p-6">
              <h3 className="text-lg font-semibold mb-3 text-white">📊 Statistiken</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Artikel:</span>
                  <span className="text-blue-400 font-medium">{articles.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Gekauft:</span>
                  <span className="text-green-400 font-medium">
                    {articles.filter(a => a.is_bought).length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Favoriten:</span>
                  <span className="text-yellow-400 font-medium">{favorites.length}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* User Settings Modal */}
      {showUserSettings && (
        <UserSettings onClose={() => setShowUserSettings(false)} />
      )}
      
      {/* Product Management Modal */}
      {showProductManagement && (
        <ProductManagement onClose={() => setShowProductManagement(false)} />
      )}
    </div>
  );
}

function AuthScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);

  const handleRegistrationSuccess = () => {
    setRegistrationSuccess(true);
    setIsLogin(true);
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {isLogin ? (
          <LoginForm 
            onSwitchToRegister={() => setIsLogin(false)} 
            registrationSuccess={registrationSuccess}
            onClearRegistrationSuccess={() => setRegistrationSuccess(false)}
          />
        ) : (
          <RegisterForm 
            onSwitchToLogin={() => setIsLogin(true)} 
            onRegistrationSuccess={handleRegistrationSuccess}
          />
        )}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

function AppContent() {
  const { user, loading } = useAuth();
  const { isDemoMode, demoReady } = useDemoMode();

  // Check if URL is admin route
  if (window.location.pathname === '/dJkL9mN2pQ7rS4tUvWxYz') {
    return (
      <>
        <DemoHeader />
        <div style={{ paddingTop: isDemoMode ? '3rem' : '0' }}>
          <Admin />
        </div>
      </>
    );
  }

  if (loading || (isDemoMode && !demoReady)) {
    return (
      <>
        <DemoHeader />
        <div className="min-h-screen bg-gray-950 flex items-center justify-center" style={{ paddingTop: isDemoMode ? '3rem' : '0' }}>
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-400">
              {isDemoMode ? 'Lade Demo-Konfiguration...' : 'Lade Anwendung...'}
            </p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <DemoHeader />
      <div style={{ paddingTop: isDemoMode ? '3rem' : '0' }}>
        {user ? <MainApp /> : <AuthScreen />}
      </div>
    </>
  );
}