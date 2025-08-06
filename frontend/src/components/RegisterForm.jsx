import { useState, useEffect } from 'react';
import * as api from '../utils/api';

export default function RegisterForm({ onSwitchToLogin, onRegistrationSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [captcha, setCaptcha] = useState(null);
  const [captchaAnswer, setCaptchaAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Load CAPTCHA on component mount
  useEffect(() => {
    loadCaptcha();
  }, []);

  async function loadCaptcha() {
    try {
      const data = await api.fetchCaptcha();
      setCaptcha(data);
    } catch (error) {
      console.error('Error loading CAPTCHA:', error);
      setError('Fehler beim Laden des CAPTCHA');
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await api.registerUser({
        username,
        password,
        confirmPassword,
        captchaAnswer,
        captchaExpected: captcha?.answer
      });
      
      onRegistrationSuccess();
    } catch (error) {
      console.error('Registration error:', error);
      setError(error.message || 'Registrierung fehlgeschlagen');
      loadCaptcha(); // Reload CAPTCHA on error
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card p-8 w-full max-w-md mx-auto">
      <h2 className="text-2xl font-bold text-center mb-6 text-white">Registrieren</h2>
      
      {error && (
        <div className="mb-4 p-3 bg-red-900/20 border border-red-800 rounded-lg text-red-400">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Benutzername *
          </label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="input-field w-full"
            required
            placeholder="Wähle einen eindeutigen Benutzernamen"
            minLength="3"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Passwort *
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input-field w-full"
            required
            placeholder="Mindestens 6 Zeichen"
            minLength="6"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Passwort bestätigen *
          </label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="input-field w-full"
            required
            placeholder="Passwort wiederholen"
          />
        </div>

        {/* CAPTCHA */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Sicherheitsfrage *
          </label>
          <div className="flex items-center space-x-3">
            <div className="bg-gray-700 px-3 py-2 rounded-lg text-white font-mono">
              {captcha?.question || 'Lädt...'}
            </div>
            <input
              type="number"
              value={captchaAnswer}
              onChange={(e) => setCaptchaAnswer(e.target.value)}
              className="input-field flex-1"
              required
              placeholder="Antwort"
            />
            <button
              type="button"
              onClick={loadCaptcha}
              className="btn-secondary text-sm px-3 py-2"
              title="Neue Aufgabe laden"
            >
              🔄
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || !captcha}
          className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Wird registriert...' : 'Registrieren'}
        </button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-gray-400">
          Bereits ein Konto?{' '}
          <button
            onClick={onSwitchToLogin}
            className="text-blue-400 hover:text-blue-300 underline"
          >
            Jetzt anmelden
          </button>
        </p>
      </div>
    </div>
  );
}
