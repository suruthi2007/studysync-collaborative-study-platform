import React, { createContext, useContext, useState, useEffect } from 'react';
import { API_URL } from '../config';

const AuthContext = createContext();

export const API_BASE_URL = API_URL;

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('studysync_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem('studysync_token'));
  const [loading, setLoading] = useState(true);

  // Initialize or verify current user profile on reload
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
            localStorage.setItem('studysync_user', JSON.stringify(data.user));
          } else {
            // Token expired or invalid
            logout();
          }
        } catch (e) {
          console.warn('Network issue while verifying token; keeping cached profile:', e.message);
        }
      } else {
        setUser(null);
        setToken(null);
      }
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
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Demo login failed');
      }
      setUser(data.user);
      setToken(data.token);
      localStorage.setItem('studysync_token', data.token);
      localStorage.setItem('studysync_user', JSON.stringify(data.user));
      return data.user;
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
    if (!res.ok || !data.success) {
      throw new Error(data.message || 'Login failed');
    }
    setUser(data.user);
    setToken(data.token);
    localStorage.setItem('studysync_token', data.token);
    localStorage.setItem('studysync_user', JSON.stringify(data.user));
    return data.user;
  };

  const register = async (name, email, password, role = 'student') => {
    const res = await fetch(`${API_BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, role }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.message || 'Registration failed');
    }
    setUser(data.user);
    setToken(data.token);
    localStorage.setItem('studysync_token', data.token);
    localStorage.setItem('studysync_user', JSON.stringify(data.user));
    return data.user;
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('studysync_token');
    localStorage.removeItem('studysync_user');
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, switchPersona }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
