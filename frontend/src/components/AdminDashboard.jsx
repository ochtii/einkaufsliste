import { useState, useEffect, useCallback } from 'react';

const AdminDashboard = () => {
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [broadcasts, setBroadcasts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(5);
  const [countdown, setCountdown] = useState(0);
  const [activeTab, setActiveTab] = useState('overview');
  
  const loadData = useCallback(async () => {
    if (!isAuthenticated && !password) return;
    
    try {
      setLoading(true);
      
      // Parallele API-Aufrufe für bessere Performance
      const [statsRes, usersRes, broadcastsRes] = await Promise.all([
        fetch('/api/admin/stats', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password })
        }),
        fetch('/api/admin/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password })
        }),
        fetch('/api/admin/broadcasts/list', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password })
        })
      ]);

      if (statsRes.ok && usersRes.ok && broadcastsRes.ok) {
        const [statsData, usersData, broadcastsData] = await Promise.all([
          statsRes.json(),
          usersRes.json(),
          broadcastsRes.json()
        ]);
        
        setStats(statsData);
        setUsers(usersData);
        setBroadcasts(broadcastsData);
        setError('');
      } else {
        setError('Fehler beim Laden der Daten');
      }
    } catch (err) {
      setError('Verbindungsfehler');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, password]);

  // Countdown Timer für nächsten Refresh
  useEffect(() => {
    let timer;
    if (autoRefresh && countdown > 0) {
      timer = setInterval(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
    } else if (autoRefresh && countdown === 0) {
      loadData();
      setCountdown(refreshInterval);
    }
    return () => clearInterval(timer);
  }, [autoRefresh, countdown, refreshInterval, loadData]);

  // Auto-Refresh Setup
  useEffect(() => {
    if (autoRefresh) {
      setCountdown(refreshInterval);
    } else {
      setCountdown(0);
    }
  }, [autoRefresh, refreshInterval]);

  const login = async () => {
    if (!password) {
      setError('Passwort erforderlich');
      return;
    }
    
    try {
      setLoading(true);
      const response = await fetch('/api/admin/stats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      
      if (response.ok) {
        setIsAuthenticated(true);
        setError('');
        await loadData();
      } else {
        setError('Ungültiges Passwort');
      }
    } catch (err) {
      setError('Verbindungsfehler');
    } finally {
      setLoading(false);
    }
  };

  const deleteUser = async (userId) => {
    if (!window.confirm('Benutzer wirklich löschen?')) return;
    
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      
      if (response.ok) {
        await loadData();
      } else {
        setError('Fehler beim Löschen');
      }
    } catch (err) {
      setError('Verbindungsfehler');
    }
  };

  const toggleAdminStatus = async (userId, currentStatus, username) => {
    const action = currentStatus ? 'entfernen' : 'ernennen';
    if (!window.confirm(`${username} wirklich als Admin ${action}?`)) return;
    
    try {
      const response = await fetch(`/api/admin/users/${userId}/toggle-admin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      
      if (response.ok) {
        await loadData();
        const result = await response.json();
        // Optional: Show success message
        setError(`✓ ${result.message}`);
        setTimeout(() => setError(''), 3000);
      } else {
        setError('Fehler beim Ändern des Admin-Status');
      }
    } catch (err) {
      setError('Verbindungsfehler');
    }
  };

  const toggleBroadcast = async (broadcastId) => {
    try {
      const response = await fetch(`/api/admin/broadcasts/${broadcastId}/toggle`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      
      if (response.ok) {
        await loadData();
      } else {
        setError('Fehler beim Ändern des Status');
      }
    } catch (err) {
      setError('Verbindungsfehler');
    }
  };

  const cleanupDatabase = async () => {
    if (!window.confirm('Datenbank-Duplikate bereinigen? Diese Aktion kann nicht rückgängig gemacht werden.')) return;
    
    try {
      const response = await fetch('/api/admin/cleanup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      
      if (response.ok) {
        const result = await response.json();
        alert(`Bereinigung abgeschlossen!\nVerbleibende Artikel: ${result.remaining_articles}\nVerbleibende Kategorien: ${result.remaining_categories}`);
        await loadData();
      } else {
        setError('Fehler bei der Bereinigung');
      }
    } catch (err) {
      setError('Verbindungsfehler');
    }
  };

  // Moderne animierte Statistik-Karte
  const StatCard = ({ title, value, icon, gradient, percentage }) => (
    <div className={`p-6 rounded-xl bg-gradient-to-br ${gradient} text-white shadow-lg transform hover:scale-105 transition-all duration-300`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-white/80 text-sm font-medium">{title}</p>
          <p className="text-3xl font-bold mt-1">{value}</p>
        </div>
        <div className="text-4xl opacity-80">{icon}</div>
      </div>
      {percentage && (
        <div className="mt-4">
          <div className="w-full bg-white/20 rounded-full h-2">
            <div 
              className="bg-white h-2 rounded-full transition-all duration-1000 ease-out"
              style={{ width: `${Math.min(percentage, 100)}%` }}
            ></div>
          </div>
        </div>
      )}
    </div>
  );

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="bg-gray-800 p-8 rounded-lg shadow-md w-96">
          <h1 className="text-2xl font-bold mb-6 text-center text-white">🔐 Admin Dashboard</h1>
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300">Admin-Passwort</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full border border-gray-600 bg-gray-700 text-white rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                onKeyPress={(e) => e.key === 'Enter' && login()}
              />
            </div>
            <button
              onClick={login}
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Anmelden...' : 'Anmelden'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header mit Auto-Refresh Controls */}
        <div className="bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-white">🔧 Admin Dashboard</h1>
            
            <div className="flex items-center space-x-4">
              {/* Countdown Timer */}
              {autoRefresh && (
                <div className="flex items-center space-x-2 text-sm text-gray-300">
                  <span>⏱️</span>
                  <span>Nächster Refresh in: {countdown}s</span>
                </div>
              )}
              
              {/* Auto-Refresh Toggle */}
              <div className="flex items-center space-x-2">
                <label className="text-sm text-gray-300">Auto-Refresh:</label>
                <input
                  type="checkbox"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  className="rounded bg-gray-700 border-gray-600"
                />
              </div>
              
              {/* Refresh Interval Slider */}
              {autoRefresh && (
                <div className="flex items-center space-x-2">
                  <label className="text-sm text-gray-300">Intervall:</label>
                  <input
                    type="range"
                    min="1"
                    max="60"
                    value={refreshInterval}
                    onChange={(e) => setRefreshInterval(parseInt(e.target.value))}
                    className="w-20"
                  />
                  <span className="text-sm text-gray-300 w-8">{refreshInterval}s</span>
                </div>
              )}
              
              <button
                onClick={loadData}
                disabled={loading}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {loading ? '🔄' : 'Aktualisieren'}
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {/* Moderne animierte Statistiken */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard
              title="Benutzer"
              value={stats.total_users}
              icon="👥"
              gradient="from-blue-500 to-blue-700"
              percentage={(stats.total_users / 100) * 100}
            />
            <StatCard
              title="Einkaufslisten"
              value={stats.total_lists}
              icon="📝"
              gradient="from-green-500 to-green-700"
              percentage={(stats.total_lists / (stats.total_users * 3)) * 100}
            />
            <StatCard
              title="Artikel"
              value={stats.total_articles}
              icon="🛒"
              gradient="from-purple-500 to-purple-700"
              percentage={(stats.total_articles / (stats.total_lists * 10)) * 100}
            />
            <StatCard
              title="Favoriten"
              value={stats.total_favorites}
              icon="⭐"
              gradient="from-orange-500 to-orange-700"
              percentage={(stats.total_favorites / stats.total_articles) * 100}
            />
            <StatCard
              title="Custom Artikel"
              value={stats.custom_standard_articles}
              icon="📦"
              gradient="from-teal-500 to-teal-700"
              percentage={(stats.custom_standard_articles / 50) * 100}
            />
            <StatCard
              title="Custom Kategorien"
              value={stats.custom_categories}
              icon="🏷️"
              gradient="from-red-500 to-red-700"
              percentage={(stats.custom_categories / 20) * 100}
            />
            <StatCard
              title="Aktive Broadcasts"
              value={stats.active_broadcasts}
              icon="📢"
              gradient="from-yellow-500 to-yellow-700"
              percentage={(stats.active_broadcasts / 10) * 100}
            />
            <StatCard
              title="System Status"
              value="Online"
              icon="✅"
              gradient="from-emerald-500 to-emerald-700"
              percentage={100}
            />
          </div>
        )}

        {/* Tab Navigation */}
        <div className="bg-gray-800 rounded-lg shadow-sm mb-6">
          <div className="flex border-b border-gray-700">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-6 py-4 text-sm font-medium transition-colors ${
                activeTab === 'overview'
                  ? 'text-blue-400 border-b-2 border-blue-400 bg-gray-700'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              📊 Übersicht
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`px-6 py-4 text-sm font-medium transition-colors ${
                activeTab === 'users'
                  ? 'text-blue-400 border-b-2 border-blue-400 bg-gray-700'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              👥 Benutzer ({users.length})
            </button>
            <button
              onClick={() => setActiveTab('broadcasts')}
              className={`px-6 py-4 text-sm font-medium transition-colors ${
                activeTab === 'broadcasts'
                  ? 'text-blue-400 border-b-2 border-blue-400 bg-gray-700'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              📢 Broadcasts ({broadcasts.length})
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Database Cleanup Button */}
            <div className="bg-gray-800 rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold mb-4 text-white">🗄️ Database Management</h2>
              <button
                onClick={cleanupDatabase}
                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
              >
                🧹 Duplikate bereinigen
              </button>
              <p className="text-sm text-gray-300 mt-2">
                Entfernt doppelte Standardartikel und Kategorien aus der Datenbank.
              </p>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="bg-gray-800 rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-4 text-white">👥 Benutzer Verwaltung</h2>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {users.map(user => (
                <div key={user.id} className="flex justify-between items-center p-3 bg-gray-700 rounded border border-gray-600">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-white">{user.username}</p>
                      {user.is_admin && (
                        <span className="px-2 py-1 text-xs bg-blue-600 text-white rounded font-medium">
                          👑 Admin
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-300">
                      {user.list_count} Listen, {user.article_count} Artikel, {user.favorite_count} Favoriten
                    </p>
                    <p className="text-xs text-gray-400">
                      Registriert: {new Date(user.created_at).toLocaleDateString('de-DE')}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => toggleAdminStatus(user.id, user.is_admin, user.username)}
                      className={`px-3 py-1 text-sm border rounded hover:bg-opacity-20 transition-colors ${
                        user.is_admin 
                          ? 'text-yellow-400 border-yellow-600 hover:bg-yellow-900' 
                          : 'text-blue-400 border-blue-600 hover:bg-blue-900'
                      }`}
                    >
                      {user.is_admin ? '👑 Admin entfernen' : '👑 Admin ernennen'}
                    </button>
                    <button
                      onClick={() => deleteUser(user.id)}
                      className="text-red-400 hover:text-red-300 px-3 py-1 text-sm border border-red-600 rounded hover:bg-red-900/20 transition-colors"
                    >
                      Löschen
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'broadcasts' && (
          <div className="bg-gray-800 rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-4 text-white">📢 Broadcast Verwaltung</h2>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {broadcasts.map(broadcast => (
                <div key={broadcast.id} className="p-3 bg-gray-700 rounded border border-gray-600">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <p className="font-medium text-white">{broadcast.title}</p>
                      <p className="text-sm text-gray-300 mb-1">{broadcast.message}</p>
                      <div className="flex items-center space-x-2 text-xs text-gray-400">
                        <span className={`px-2 py-1 rounded ${broadcast.type === 'error' ? 'bg-red-900/50 text-red-300' : 
                                                                broadcast.type === 'warning' ? 'bg-yellow-900/50 text-yellow-300' : 
                                                                'bg-blue-900/50 text-blue-300'}`}>
                          {broadcast.type}
                        </span>
                        {broadcast.requires_confirmation && <span className="bg-purple-900/50 text-purple-300 px-2 py-1 rounded">Bestätigung</span>}
                        {broadcast.is_permanent && <span className="bg-gray-700 text-gray-200 px-2 py-1 rounded">Permanent</span>}
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        Bestätigungen: {broadcast.confirmation_count}/{broadcast.total_users}
                      </p>
                    </div>
                    <button
                      onClick={() => toggleBroadcast(broadcast.id)}
                      className={`px-3 py-1 text-sm border rounded transition-colors ${
                        broadcast.is_active 
                          ? 'text-red-400 border-red-600 hover:bg-red-900/20' 
                          : 'text-green-400 border-green-600 hover:bg-green-900/20'
                      }`}
                    >
                      {broadcast.is_active ? 'Deaktivieren' : 'Aktivieren'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
