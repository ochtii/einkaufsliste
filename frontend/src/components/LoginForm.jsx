import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

export default function LoginForm({ onSwitchToRegister, registrationSuccess, onClearRegistrationSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    if (onClearRegistrationSuccess) onClearRegistrationSuccess();

    try {
      // Check if we're in demo mode (GitHub Pages)
      const isDemoMode = window.location.hostname === 'ochtii.github.io' || 
                        (window.location.hostname === 'localhost' && window.location.search.includes('demo=true'));
      
      console.log('Demo mode check:', {
        hostname: window.location.hostname,
        isDemoMode,
        hasDemoAPI: !!window.DemoAPI,
        hasDemoConfig: !!window.DEMO_CONFIG
      });
      
      if (isDemoMode) {
        // Wait a bit for demo config to load if not available yet
        if (!window.DemoAPI && window.DEMO_CONFIG) {
          console.log('DemoAPI not found, attempting manual initialization...');
          // Try to trigger demo API initialization
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        if (window.DemoAPI) {
          console.log('Using DemoAPI for authentication');
          try {
            const demoResult = window.DemoAPI.login(username, password);
            console.log('Demo login successful:', demoResult);
            login(demoResult.token, demoResult.user);
            return;
          } catch (demoError) {
            console.error('Demo login failed:', demoError);
            setError('Ungültige Demo-Anmeldedaten. Verwende: demo/demo123 oder admin/admin123');
            return;
          }
        } else {
          console.warn('DemoAPI not available, falling back to backend');
        }
      }

      // Regular backend login
      const backendUrl = isDemoMode ? 'https://einkaufsliste-demo-backend.onrender.com' : 'http://localhost:4000';
      console.log('Attempting backend login to:', backendUrl);
      
      const response = await fetch(`${backendUrl}/api/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok) {
        login(data.token, data.user);
      } else {
        setError(data.error || 'Anmeldung fehlgeschlagen');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('Verbindungsfehler. Versuche es später erneut.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card p-8 w-full max-w-md mx-auto">
      <h2 className="text-2xl font-bold text-center mb-6 text-white">Anmelden</h2>
      
      {registrationSuccess && (
        <div className="mb-4 p-3 bg-green-900/20 border border-green-800 rounded-lg text-green-400">
          ✅ Registrierung erfolgreich! Du kannst dich jetzt anmelden.
        </div>
      )}
      
      {error && (
        <div className="mb-4 p-3 bg-red-900/20 border border-red-800 rounded-lg text-red-400">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Benutzername
          </label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="input-field w-full"
            required
            placeholder="Dein Benutzername"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Passwort
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input-field w-full"
            required
            placeholder="Dein Passwort"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Wird angemeldet...' : 'Anmelden'}
        </button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-gray-400">
          Noch kein Konto?{' '}
          <button
            onClick={onSwitchToRegister}
            className="text-blue-400 hover:text-blue-300 underline"
          >
            Jetzt registrieren
          </button>
        </p>
      </div>
    </div>
  );
}
