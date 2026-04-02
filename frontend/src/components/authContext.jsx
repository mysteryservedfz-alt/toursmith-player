import React, { createContext, useContext, useState } from 'react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export const authAxios = (token) => axios.create({
  baseURL: API,
  headers: { Authorization: `Bearer ${token}` }
});

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem('toursmith_token'));

  const login = (newToken) => {
    localStorage.setItem('toursmith_token', newToken);
    setToken(newToken);
  };

  const logout = () => {
    localStorage.removeItem('toursmith_token');
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated: !!token, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
