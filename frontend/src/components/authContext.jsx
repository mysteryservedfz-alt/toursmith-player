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
  const [username, setUsername] = useState(localStorage.getItem('toursmith_username'));

  const login = (newToken, newUsername) => {
    localStorage.setItem('toursmith_token', newToken);
    localStorage.setItem('toursmith_username', newUsername);
    setToken(newToken);
    setUsername(newUsername);
  };

  const logout = () => {
    localStorage.removeItem('toursmith_token');
    localStorage.removeItem('toursmith_username');
    setToken(null);
    setUsername(null);
  };

  return (
    <AuthContext.Provider value={{ token, username, login, logout, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  );
};
