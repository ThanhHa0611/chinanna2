import { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }

    api
      .getMe()
      .then(setUser)
      .catch(() => {
        localStorage.removeItem('token');
      })
      .finally(() => setLoading(false));
  }, []);

  const login = async (email, password, location = {}) => {
    const data = await api.login({ email, password, ...location });
    localStorage.setItem('token', data.access_token);
    setUser(data.user);
    return data.user;
  };

  const register = async (username, email, password, mentor, zaloPhone, location = {}) => {
    const data = await api.register({
      username,
      email,
      password,
      mentor,
      zalo_phone: zaloPhone,
      ...location,
    });
    if (data.access_token) {
      localStorage.setItem('token', data.access_token);
      setUser(data.user);
    }
    return data;
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch {
      // ignore logout errors
    }
    localStorage.removeItem('token');
    setUser(null);
  };

  const updateUser = (nextUser) => {
    setUser(nextUser);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
