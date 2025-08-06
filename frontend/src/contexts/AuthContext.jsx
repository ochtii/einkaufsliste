import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { logoutUser, setGlobalLogoutCallback } from '../utils/api';

const AuthContext = createContext();

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Global toast callback for auto logout notifications
let globalToastCallback = null;

export function setGlobalToastCallback(callback) {
  globalToastCallback = callback;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  const logout = useCallback(async (showMessage = true) => {
    try {
      if (token) {
        await logoutUser(token);
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('token');
      setToken(null);
      setUser(null);
      if (showMessage && globalToastCallback) {
        globalToastCallback('Sie wurden automatisch ausgeloggt, da Ihre Session ungültig geworden ist.', 'warning', 8000);
      }
    }
  }, [token]);

  useEffect(() => {
    // Register global logout callback for automatic logout on invalid sessions
    setGlobalLogoutCallback(() => logout(true));
    
    // Check if token is valid on app start
    if (token) {
      // Decode token to get user info (simple check)
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.exp * 1000 > Date.now()) {
          setUser({ 
            id: payload.userId, 
            username: payload.username,
            isAdmin: payload.isAdmin || false 
          });
        } else {
          // Token expired
          logout(false); // Don't show message for expired token on startup
        }
      } catch (error) {
        console.error('Invalid token:', error);
        logout(false); // Don't show message for invalid token on startup
      }
    }
    setLoading(false);
  }, [token, logout]);

  const login = (token, user) => {
    localStorage.setItem('token', token);
    setToken(token);
    setUser(user);
  };

  const value = {
    user,
    token,
    loading,
    login,
    logout,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
