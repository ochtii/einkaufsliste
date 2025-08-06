import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

export default function UserSettings({ onClose }) {
  const { user, token, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  
  // Profile state
  const [userProfile, setUserProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);
  
  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  
  // Username change state
  const [newUsername, setNewUsername] = useState('');
  const [usernameLoading, setUsernameLoading] = useState(false);
  const [usernameError, setUsernameError] = useState('');
  const [usernameSuccess, setUsernameSuccess] = useState('');

  // Load user profile
  useEffect(() => {
    async function loadProfile() {
      try {
        const response = await fetch('http://localhost:4000/api/user/profile', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setUserProfile(data);
        }
      } catch (error) {
        console.error('Error loading profile:', error);
      } finally {
        setProfileLoading(false);
      }
    }

    loadProfile();
  }, [token]);

  async function handlePasswordChange(e) {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      setPasswordError('Neue Passwörter stimmen nicht überein');
      return;
    }
    
    if (newPassword.length < 6) {
      setPasswordError('Neues Passwort muss mindestens 6 Zeichen lang sein');
      return;
    }

    setPasswordLoading(true);
    setPasswordError('');
    setPasswordSuccess('');

    try {
      const response = await fetch('http://localhost:4000/api/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          currentPassword,
          newPassword
        })
      });

      const data = await response.json();

      if (response.ok) {
        setPasswordSuccess('Passwort erfolgreich geändert');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setPasswordError(data.error || 'Fehler beim Ändern des Passworts');
      }
    } catch (error) {
      setPasswordError('Verbindungsfehler');
    } finally {
      setPasswordLoading(false);
    }
  }

  async function handleUsernameChange(e) {
    e.preventDefault();
    
    if (!newUsername.trim() || newUsername.length < 3) {
      setUsernameError('Benutzername muss mindestens 3 Zeichen lang sein');
      return;
    }

    setUsernameLoading(true);
    setUsernameError('');
    setUsernameSuccess('');

    try {
      const response = await fetch('http://localhost:4000/api/change-username', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          newUsername: newUsername.trim()
        })
      });

      const data = await response.json();

      if (response.ok) {
        setUsernameSuccess('Benutzername erfolgreich geändert. Bitte melde dich erneut an.');
        setNewUsername('');
        // Force logout to refresh token with new username
        setTimeout(() => {
          logout();
        }, 2000);
      } else {
        setUsernameError(data.error || 'Fehler beim Ändern des Benutzernamens');
      }
    } catch (error) {
      setUsernameError('Verbindungsfehler');
    } finally {
      setUsernameLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="card p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white">⚙️ Benutzer-Einstellungen</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-700 mb-6">
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'profile'
                ? 'text-blue-400 border-b-2 border-blue-400'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Profil
          </button>
          <button
            onClick={() => setActiveTab('password')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'password'
                ? 'text-blue-400 border-b-2 border-blue-400'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Passwort ändern
          </button>
          <button
            onClick={() => setActiveTab('username')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'username'
                ? 'text-blue-400 border-b-2 border-blue-400'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Benutzername ändern
          </button>
        </div>

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="space-y-6">
            {profileLoading ? (
              <div className="text-center text-gray-400">Lade Profildaten...</div>
            ) : userProfile ? (
              <>
                <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                  <h3 className="text-lg font-semibold text-white mb-4">👤 Benutzerprofil</h3>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Benutzername
                      </label>
                      <div className="text-white bg-gray-700 px-3 py-2 rounded border">
                        {userProfile.username}
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Eindeutige Benutzer-ID (UUID)
                      </label>
                      <div className="text-white bg-gray-700 px-3 py-2 rounded border font-mono text-sm break-all">
                        {userProfile.uuid}
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        Diese eindeutige ID identifiziert dein Konto und kann nicht geändert werden.
                      </p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Registriert am
                      </label>
                      <div className="text-white bg-gray-700 px-3 py-2 rounded border">
                        {new Date(userProfile.created_at).toLocaleDateString('de-DE', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-blue-900/20 border border-blue-800 rounded-lg p-4">
                  <h4 className="text-blue-400 font-medium mb-2">📋 Persönliche Daten</h4>
                  <p className="text-sm text-gray-300">
                    Deine Kategorien und Artikel werden automatisch für deinen Benutzer gespeichert. 
                    Jeder Benutzer hat seine eigenen persönlichen Listen, Favoriten und Standardartikel, 
                    zusätzlich zu den globalen Standardeinträgen.
                  </p>
                </div>
              </>
            ) : (
              <div className="text-center text-red-400">Fehler beim Laden des Profils</div>
            )}
          </div>
        )}

        {/* Password Change Tab */}
        {activeTab === 'password' && (
          <div>
            {passwordError && (
              <div className="mb-4 p-3 bg-red-900/20 border border-red-800 rounded-lg text-red-400 text-sm">
                {passwordError}
              </div>
            )}
            
            {passwordSuccess && (
              <div className="mb-4 p-3 bg-green-900/20 border border-green-800 rounded-lg text-green-400 text-sm">
                {passwordSuccess}
              </div>
            )}

            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Aktuelles Passwort
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="input-field w-full"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Neues Passwort
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="input-field w-full"
                  minLength="6"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Neues Passwort bestätigen
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="input-field w-full"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={passwordLoading}
                className="btn-primary w-full disabled:opacity-50"
              >
                {passwordLoading ? 'Wird geändert...' : 'Passwort ändern'}
              </button>
            </form>
          </div>
        )}

        {/* Username Change Tab */}
        {activeTab === 'username' && (
          <div>
            {usernameError && (
              <div className="mb-4 p-3 bg-red-900/20 border border-red-800 rounded-lg text-red-400 text-sm">
                {usernameError}
              </div>
            )}
            
            {usernameSuccess && (
              <div className="mb-4 p-3 bg-green-900/20 border border-green-800 rounded-lg text-green-400 text-sm">
                {usernameSuccess}
              </div>
            )}

            <form onSubmit={handleUsernameChange} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Aktueller Benutzername
                </label>
                <input
                  type="text"
                  value={user?.username || ''}
                  className="input-field w-full bg-gray-700 cursor-not-allowed"
                  disabled
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Neuer Benutzername
                </label>
                <input
                  type="text"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  className="input-field w-full"
                  placeholder="Neuer eindeutiger Benutzername"
                  minLength="3"
                  required
                />
              </div>

              <div className="text-sm text-gray-400 bg-gray-800 p-3 rounded-lg">
                ⚠️ <strong>Hinweis:</strong> Nach der Änderung des Benutzernamens wirst du automatisch abgemeldet und musst dich mit dem neuen Benutzernamen erneut anmelden.
              </div>

              <button
                type="submit"
                disabled={usernameLoading}
                className="btn-primary w-full disabled:opacity-50"
              >
                {usernameLoading ? 'Wird geändert...' : 'Benutzername ändern'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
