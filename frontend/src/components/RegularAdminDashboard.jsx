import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';

const RegularAdminDashboard = () => {
  const { token } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('users');
  
  const loadUsers = useCallback(async () => {
    if (!token) return;
    
    try {
      setLoading(true);
      setError('');
      
      const response = await fetch('/api/admin/users', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const usersData = await response.json();
        setUsers(usersData);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Fehler beim Laden der Benutzer');
      }
    } catch (error) {
      setError('Verbindungsfehler: ' + error.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const toggleAdminStatus = async (userId) => {
    try {
      setError('');
      
      const response = await fetch('/api/admin/toggle-admin', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId })
      });

      if (response.ok) {
        const result = await response.json();
        
        // Update local state
        setUsers(prev => prev.map(user => 
          user.id === userId 
            ? { ...user, is_admin: result.isAdmin ? 1 : 0 }
            : user
        ));
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Fehler beim Ändern des Admin-Status');
      }
    } catch (error) {
      setError('Verbindungsfehler: ' + error.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-400">Lade Admin-Dashboard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-900/20 border border-red-800 text-red-400 p-4 rounded-lg">
          <p>⚠️ {error}</p>
          <button 
            onClick={() => setError('')}
            className="mt-2 text-sm text-red-400 hover:text-red-300"
          >
            Schließen
          </button>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-gray-800 rounded-lg p-1">
        <button
          onClick={() => setActiveTab('users')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'users'
              ? 'bg-blue-600 text-white'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          👥 Benutzer verwalten
        </button>
      </div>

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-white">👥 Benutzer-Verwaltung</h3>
            <button
              onClick={loadUsers}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              🔄 Aktualisieren
            </button>
          </div>

          <div className="bg-gray-800 rounded-lg p-6">
            <div className="space-y-4">
              {users.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-6xl mb-4">👤</div>
                  <h3 className="text-xl font-semibold text-gray-300 mb-2">Keine Benutzer gefunden</h3>
                  <p className="text-gray-400">Es sind noch keine Benutzer registriert.</p>
                </div>
              ) : (
                users.map(user => (
                  <div key={user.id} className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-medium">
                          {user.username.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h4 className="font-semibold text-white">{user.username}</h4>
                          {user.is_admin && (
                            <span className="px-2 py-1 bg-yellow-600 text-yellow-100 text-xs rounded-full">
                              👑 Admin
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-400">
                          Registriert: {new Date(user.created_at).toLocaleDateString('de-DE')}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => toggleAdminStatus(user.id)}
                        className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                          user.is_admin
                            ? 'bg-red-600 hover:bg-red-700 text-white'
                            : 'bg-green-600 hover:bg-green-700 text-white'
                        }`}
                      >
                        {user.is_admin ? '⬇️ Admin entfernen' : '⬆️ Zum Admin machen'}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-6">
            <h4 className="text-lg font-semibold text-white mb-4">📊 Benutzer-Statistiken</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-700 p-4 rounded-lg text-center">
                <div className="text-3xl font-bold text-blue-400">{users.length}</div>
                <div className="text-sm text-gray-400">Gesamt Benutzer</div>
              </div>
              <div className="bg-gray-700 p-4 rounded-lg text-center">
                <div className="text-3xl font-bold text-yellow-400">
                  {users.filter(u => u.is_admin).length}
                </div>
                <div className="text-sm text-gray-400">Administratoren</div>
              </div>
              <div className="bg-gray-700 p-4 rounded-lg text-center">
                <div className="text-3xl font-bold text-green-400">
                  {users.filter(u => !u.is_admin).length}
                </div>
                <div className="text-sm text-gray-400">Standard-Benutzer</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RegularAdminDashboard;
