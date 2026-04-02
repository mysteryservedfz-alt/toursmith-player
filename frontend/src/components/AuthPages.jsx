import React, { useState, useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from './authContext';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AdminSetup = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (password.length < 4) {
      setError("Password must be at least 4 characters");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await axios.post(`${API}/admin/setup`, { username, password });
      login(res.data.token, res.data.username);
      navigate("/admin");
    } catch (err) {
      setError(err.response?.data?.detail || "Setup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container" data-testid="admin-setup">
      <div className="auth-card card">
        <div className="card-body">
          <h1 className="auth-title">Tour Generator</h1>
          <p className="auth-subtitle">Create your admin account</p>
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label className="form-label">Username</label>
              <input
                type="text"
                className="input"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
                required
                data-testid="setup-username"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                type="password"
                className="input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                required
                data-testid="setup-password"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Confirm Password</label>
              <input
                type="password"
                className="input"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm password"
                required
                data-testid="setup-confirm-password"
              />
            </div>
            {error && <p className="error-message">{error}</p>}
            <button type="submit" className="btn btn-primary btn-lg w-full" disabled={loading} data-testid="setup-submit">
              {loading ? "Creating..." : "Create Admin Account"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

const AdminLogin = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await axios.post(`${API}/admin/login`, { username, password });
      login(res.data.token, res.data.username);
      navigate("/admin");
    } catch (err) {
      setError(err.response?.data?.detail || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container" data-testid="admin-login">
      <div className="auth-card card">
        <div className="card-body">
          <h1 className="auth-title">Tour Generator</h1>
          <p className="auth-subtitle">Sign in to continue</p>
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label className="form-label">Username</label>
              <input
                type="text"
                className="input"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
                required
                data-testid="login-username"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                type="password"
                className="input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                required
                data-testid="login-password"
              />
            </div>
            {error && <p className="error-message">{error}</p>}
            <button type="submit" className="btn btn-primary btn-lg w-full" disabled={loading} data-testid="login-submit">
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

const AuthPage = () => {
  const [adminExists, setAdminExists] = useState(null);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const res = await axios.get(`${API}/admin/exists`);
        setAdminExists(res.data.exists);
      } catch {
        setAdminExists(false);
      }
    };
    checkAdmin();
  }, []);

  if (isAuthenticated) return <Navigate to="/admin" />;
  if (adminExists === null) return <div className="loading-screen">Loading...</div>;
  return adminExists ? <AdminLogin /> : <AdminSetup />;
};

export default AuthPage;
