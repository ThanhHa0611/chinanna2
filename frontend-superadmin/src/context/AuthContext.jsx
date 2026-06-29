import { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('superadmin_token');
    if (!token) {
      setLoading(false);
      return;
    }

    api
      .getMe()
      .then((data) => {
        if (!data.is_super_admin) {
          localStorage.removeItem('superadmin_token');
          setAdmin(null);
          return;
        }
        setAdmin(data);
      })
      .catch(() => {
        localStorage.removeItem('superadmin_token');
      })
      .finally(() => setLoading(false));
  }, []);

  const login = async (email, password, location = {}) => {
    const data = await api.login({ email, password, ...location });
    if (!data.admin?.is_super_admin) {
      throw new Error('Tài khoản này không có quyền super admin hệ thống.');
    }
    localStorage.setItem('superadmin_token', data.access_token);
    setAdmin(data.admin);
    return data.admin;
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch {
      // ignore
    }
    localStorage.removeItem('superadmin_token');
    setAdmin(null);
  };

  return (
    <AuthContext.Provider value={{ admin, loading, login, logout }}>
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
