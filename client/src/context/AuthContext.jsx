import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const API_BASE_URL = 'http://localhost:5000';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('studysync_token'));
  const [loading, setLoading] = useState(true);

  // Initialize or fetch current user profile
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('studysync_token');
      if (storedToken) {
        try {
          const res = await fetch(`${API_BASE_URL}/api/auth/me`, {
            headers: { Authorization: `Bearer ${storedToken}` },
          });
          const data = await res.json();
          if (data.success && data.user) {
            setUser(data.user);
            setToken(storedToken);
            setLoading(false);
            return;
          }
        } catch (e) {
          console.warn('Failed to verify token:', e.message);
        }
      }

      // Default to demo persona Alice Chen for immediate zero-barrier preview
      await switchPersona('alice');
      setLoading(false);
    };

    initAuth();
  }, []);

  // One-click demo switch between Alice, Bob, and Sarah (Tutor)
  const switchPersona = async (persona) => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/auth/demo-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ persona }),
      });
      const data = await res.json();
      if (data.success) {
        setUser(data.user);
        setToken(data.token);
        localStorage.setItem('studysync_token', data.token);
      }
    } catch (err) {
      console.error('Error switching persona:', err);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.message || 'Login failed');
    setUser(data.user);
    setToken(data.token);
    localStorage.setItem('studysync_token', data.token);
    return data.user;
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('studysync_token');
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, switchPersona }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
