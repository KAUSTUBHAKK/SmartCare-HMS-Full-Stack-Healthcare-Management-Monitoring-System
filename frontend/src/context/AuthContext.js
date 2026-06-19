import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config';

const AuthCtx = createContext(null);

axios.defaults.baseURL = API_BASE_URL;
axios.defaults.timeout = 10000;

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [token, setToken]     = useState(() => localStorage.getItem('mc_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      axios.get('/api/auth/me')
        .then(r => setUser(r.data.user))
        .catch(() => {
          setToken(null);
          localStorage.removeItem('mc_token');
          delete axios.defaults.headers.common['Authorization'];
        })
        .finally(() => setLoading(false));
    } else {
      delete axios.defaults.headers.common['Authorization'];
      setLoading(false);
    }
  }, [token]);

  const login = async (email, password) => {
    try {
      const { data } = await axios.post('/api/auth/login', { email, password });
      localStorage.setItem('mc_token', data.token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
      setToken(data.token);
      setUser(data.user);
      return data.user;
    } catch (err) {
      if (!err.response) {
        throw new Error('Cannot reach server. Make sure backend is running:\n  cd server && npm run dev');
      }
      throw new Error(err.response?.data?.error || 'Login failed');
    }
  };

  const register = async (form) => {
    try {
      const { data } = await axios.post('/api/auth/register', form);
      localStorage.setItem('mc_token', data.token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
      setToken(data.token);
      setUser(data.user);
      return data.user;
    } catch (err) {
      if (!err.response) {
        throw new Error('Cannot reach server. Make sure backend is running:\n  cd server && npm run dev');
      }
      throw new Error(err.response?.data?.error || 'Registration failed');
    }
  };

  const logout = () => {
    localStorage.removeItem('mc_token');
    delete axios.defaults.headers.common['Authorization'];
    setToken(null);
    setUser(null);
  };

  return (
    <AuthCtx.Provider value={{
      user,
      token,
      loading,
      login,
      register,
      logout,
      isDoctor: user?.role === 'doctor',
      isAdmin: user?.role === 'admin',
      isClinician: ['doctor', 'admin'].includes(user?.role),
    }}>
      {children}
    </AuthCtx.Provider>
  );
}

export const useAuth = () => useContext(AuthCtx);
