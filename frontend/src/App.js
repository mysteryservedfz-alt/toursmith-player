import React, { useState, useEffect, useRef, createContext, useContext, useCallback } from "react";
import "@/index.css";
import "@/App.css";
import "leaflet/dist/leaflet.css";
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { CSSTransition, TransitionGroup } from "react-transition-group";
import { QRCodeSVG } from "qrcode.react";
import { MapContainer, TileLayer, Marker, Circle, useMapEvents } from "react-leaflet";
import L from "leaflet";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// ==================== AUTH CONTEXT ====================
const AuthContext = createContext(null);

const useAuth = () => useContext(AuthContext);

const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem("toursmith_token"));
  const [username, setUsername] = useState(localStorage.getItem("toursmith_username"));

  const login = (newToken, newUsername) => {
    localStorage.setItem("toursmith_token", newToken);
    localStorage.setItem("toursmith_username", newUsername);
    setToken(newToken);
    setUsername(newUsername);
  };

  const logout = () => {
    localStorage.removeItem("toursmith_token");
    localStorage.removeItem("toursmith_username");
    setToken(null);
    setUsername(null);
  };

  return (
    <AuthContext.Provider value={{ token, username, login, logout, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  );
};

const authAxios = (token) => axios.create({
  baseURL: API,
  headers: { Authorization: `Bearer ${token}` }
});

// ==================== ICONS ====================
const Icons = {
  Plus: () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  Edit: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  Copy: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>,
  Trash: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>,
  ChevronLeft: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>,
  ChevronRight: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>,
  Grip: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="5" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="9" cy="19" r="1"/><circle cx="15" cy="5" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="19" r="1"/></svg>,
  Logout: () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  Lock: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
  Play: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>,
  Audio: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>,
  Image: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>,
  Video: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"/><line x1="7" y1="2" x2="7" y2="22"/><line x1="17" y1="2" x2="17" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="2" y1="7" x2="7" y2="7"/><line x1="2" y1="17" x2="7" y2="17"/><line x1="17" y1="17" x2="22" y2="17"/><line x1="17" y1="7" x2="22" y2="7"/></svg>,
  Broadcast: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4.9 19.1C1 15.2 1 8.8 4.9 4.9"/><path d="M7.8 16.2c-2.3-2.3-2.3-6.1 0-8.5"/><circle cx="12" cy="12" r="2"/><path d="M16.2 7.8c2.3 2.3 2.3 6.1 0 8.5"/><path d="M19.1 4.9C23 8.8 23 15.1 19.1 19"/></svg>,
  QRCode: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>,
  Link: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>,
  Eye: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
  HelpCircle: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  Check: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  X: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  ListChecks: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 6h11"/><path d="M10 12h11"/><path d="M10 18h11"/><polyline points="3 6 4 7 6 5"/><polyline points="3 12 4 13 6 11"/><polyline points="3 18 4 19 6 17"/></svg>,
  Type: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/></svg>,
  FileText: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>,
  MapPin: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>,
  Navigation: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>,
  Save: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>,
  Copy: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>,
};

// Fix Leaflet default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// ==================== CLEARABLE INPUT ====================
const ClearableInput = ({ value, onChange, onClear, placeholder, type = "text", ...props }) => {
  return (
    <div className="clearable-input-wrapper">
      <input 
        type={type} 
        className="input" 
        value={value || ""} 
        onChange={(e) => onChange(e.target.value || null)} 
        placeholder={placeholder}
        {...props}
      />
      {value && (
        <button 
          type="button" 
          className="clear-input-btn" 
          onClick={() => onClear()}
          title="Clear"
        >
          <Icons.X />
        </button>
      )}
    </div>
  );
};

// ==================== ADMIN SETUP / LOGIN ====================
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

// ==================== TOURS LIST ====================
const ToursList = () => {
  const [tours, setTours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const { token, logout, username } = useAuth();
  const navigate = useNavigate();
  const api = authAxios(token);

  const fetchTours = useCallback(async () => {
    try {
      const res = await api.get("/tours");
      setTours(res.data);
    } catch (err) {
      if (err.response?.status === 401) logout();
    } finally {
      setLoading(false);
    }
  }, [api, logout]);

  useEffect(() => { fetchTours(); }, []);

  const createTour = async () => {
    try {
      const res = await api.post("/tours", { title: "New Tour" });
      navigate(`/admin/tour/${res.data.id}`);
    } catch (err) {
      console.error(err);
    }
  };

  const duplicateTour = async (id) => {
    try {
      await api.post(`/tours/${id}/duplicate`);
      fetchTours();
    } catch (err) {
      console.error(err);
    }
  };

  const deleteTour = async (id) => {
    if (!window.confirm("Delete this tour?")) return;
    try {
      await api.delete(`/tours/${id}`);
      fetchTours();
    } catch (err) {
      console.error(err);
    }
  };

  const [copiedTourId, setCopiedTourId] = useState(null);
  
  const copyPlayerLink = async (tourId, e) => {
    e.stopPropagation();
    const baseUrl = process.env.REACT_APP_BACKEND_URL || window.location.origin;
    const playerUrl = `${baseUrl}/play/${tourId}`;
    try {
      await navigator.clipboard.writeText(playerUrl);
      setCopiedTourId(tourId);
      setTimeout(() => setCopiedTourId(null), 2000);
    } catch (err) {
      // Fallback for mobile
      const textArea = document.createElement('textarea');
      textArea.value = playerUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopiedTourId(tourId);
      setTimeout(() => setCopiedTourId(null), 2000);
    }
  };

  if (loading) return <div className="loading-screen">Loading tours...</div>;

  return (
    <div className="admin-layout" data-testid="tours-list">
      <header className="admin-header">
        <div className="admin-header-content">
          <h1>Tour Generator</h1>
          <div className="admin-header-actions">
            <span className="admin-username">Welcome, {username}</span>
            <button onClick={logout} className="btn btn-ghost btn-sm" data-testid="logout-btn">
              <Icons.Logout /> Logout
            </button>
          </div>
        </div>
      </header>

      <main className="admin-main">
        <div className="tours-header">
          <h2>My Tours</h2>
          <div className="tours-header-actions">
            {/* View Toggle */}
            <div className="view-toggle">
              <button 
                onClick={() => setViewMode('grid')} 
                className={`view-toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
                title="Card View"
              >
                <Icons.QRCode />
              </button>
              <button 
                onClick={() => setViewMode('list')} 
                className={`view-toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
                title="List View"
              >
                <Icons.ListChecks />
              </button>
            </div>
            <button onClick={createTour} className="btn btn-primary" data-testid="new-tour-btn">
              <Icons.Plus /> New Tour
            </button>
          </div>
        </div>

        {tours.length === 0 ? (
          <div className="empty-state card">
            <div className="card-body">
              <p>No tours yet. Create your first tour!</p>
            </div>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="tours-grid-compact">
            {tours.map((tour) => {
              const totalPages = tour.stops?.reduce((sum, s) => sum + (s.pages?.length || 0), 0) || 0;
              return (
                <div 
                  key={tour.id} 
                  className="tour-card-compact" 
                  data-testid={`tour-card-${tour.id}`}
                  onClick={() => navigate(`/admin/tour/${tour.id}`)}
                >
                  <div className="card-header-row">
                    <div className="card-status-row">
                      <span className={`badge badge-${tour.status}`}>{tour.status}</span>
                      <button 
                        onClick={(e) => copyPlayerLink(tour.id, e)} 
                        className={`btn-copy-link ${copiedTourId === tour.id ? 'copied' : ''}`}
                        title="Copy Player Link"
                        data-testid={`copy-link-${tour.id}`}
                      >
                        {copiedTourId === tour.id ? <Icons.Check /> : <Icons.Link />}
                        <span>{copiedTourId === tour.id ? 'Copied!' : 'Copy Link'}</span>
                      </button>
                    </div>
                    <div className="card-actions" onClick={(e) => e.stopPropagation()}>
                      <button onClick={() => duplicateTour(tour.id)} className="btn-icon" title="Duplicate">
                        <Icons.Copy />
                      </button>
                      <button onClick={() => deleteTour(tour.id)} className="btn-icon danger" title="Delete">
                        <Icons.Trash />
                      </button>
                    </div>
                  </div>
                  <h3 className="card-title">{tour.title || "Untitled"}</h3>
                  {tour.description && (
                    <p className="card-desc">{tour.description}</p>
                  )}
                  <div className="card-stats">
                    <span className="stat">📍 {tour.stops?.length || 0} stops</span>
                    <span className="stat">📄 {totalPages} pages</span>
                  </div>
                  <div className="card-features">
                    {tour.welcomeTitle && <span className="feature-tag">Welcome</span>}
                    {tour.stops?.some(s => s.unlockMode === 'multiple_choice' || s.pages?.some(p => p.unlockMode === 'multiple_choice')) && (
                      <span className="feature-tag">Quiz</span>
                    )}
                    {tour.stops?.some(s => s.audioUrl || s.pages?.some(p => p.audioUrl)) && (
                      <span className="feature-tag">Audio</span>
                    )}
                    {tour.stops?.some(s => s.mediaUrl || s.pages?.some(p => p.mediaUrl)) && (
                      <span className="feature-tag">Media</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="tours-list">
            {tours.map((tour) => {
              const totalPages = tour.stops?.reduce((sum, s) => sum + (s.pages?.length || 0), 0) || 0;
              const hasAudio = tour.stops?.some(s => s.audioUrl || s.pages?.some(p => p.audioUrl));
              const hasQuiz = tour.stops?.some(s => s.unlockMode === 'multiple_choice' || s.pages?.some(p => p.unlockMode === 'multiple_choice'));
              return (
                <div 
                  key={tour.id} 
                  className="tour-list-item" 
                  data-testid={`tour-card-${tour.id}`}
                >
                  <span className={`list-status-dot status-${tour.status}`} />
                  <span className="list-title">{tour.title || "Untitled"}</span>
                  <span className="list-meta">{tour.stops?.length || 0} stops • {totalPages} pages</span>
                  <div className="list-features">
                    {tour.welcomeTitle && <span className="feature-tag">Welcome</span>}
                    {hasQuiz && <span className="feature-tag">Quiz</span>}
                    {hasAudio && <span className="feature-tag">Audio</span>}
                  </div>
                  <span className={`list-badge badge-${tour.status}`}>{tour.status}</span>
                  <div className="list-actions">
                    <button 
                      onClick={(e) => copyPlayerLink(tour.id, e)} 
                      className={`btn-icon btn-copy-link-sm ${copiedTourId === tour.id ? 'copied' : ''}`}
                      title="Copy Player Link"
                    >
                      {copiedTourId === tour.id ? <Icons.Check /> : <Icons.Link />}
                    </button>
                    <button onClick={() => navigate(`/admin/tour/${tour.id}`)} className="btn btn-secondary btn-sm">
                      Edit
                    </button>
                    <button onClick={() => duplicateTour(tour.id)} className="btn-icon" title="Duplicate">
                      <Icons.Copy />
                    </button>
                    <button onClick={() => deleteTour(tour.id)} className="btn-icon danger" title="Delete">
                      <Icons.Trash />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

// ==================== TOUR EDITOR ====================
const TourEditor = () => {
  const { tourId } = useParams();
  const [tour, setTour] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeStopId, setActiveStopId] = useState(null);
  const [activePageId, setActivePageId] = useState(null);
  const [showWelcome, setShowWelcome] = useState(false);
  const { token, logout } = useAuth();
  const navigate = useNavigate();
  const api = authAxios(token);

  useEffect(() => {
    const fetchTour = async () => {
      try {
        const res = await api.get(`/tours/${tourId}`);
        setTour(res.data);
        // Show welcome editor if welcome fields exist, otherwise show first stop
        if (res.data.welcomeTitle || res.data.welcomeBody) {
          setShowWelcome(true);
        } else if (res.data.stops?.length > 0) {
          setActiveStopId(res.data.stops[0].id);
        }
      } catch (err) {
        if (err.response?.status === 401) logout();
        else navigate("/admin");
      } finally {
        setLoading(false);
      }
    };
    fetchTour();
  }, [tourId]);

  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Cmd/Ctrl + S to save
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        if (hasUnsavedChanges && !saving) {
          saveTour();
        }
      }
      // Cmd/Ctrl + N to add new stop
      if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
        e.preventDefault();
        addStop();
      }
      // Escape to go back or close
      if (e.key === 'Escape') {
        if (activePageId) {
          setActivePageId(null);
        } else if (activeStopId) {
          setActiveStopId(null);
          setShowWelcome(true);
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [hasUnsavedChanges, saving, activePageId, activeStopId]);

  // Manual save - only called when clicking Save Draft
  const saveTour = async (dataToSave) => {
    setSaving(true);
    try {
      const res = await api.put(`/tours/${tourId}`, dataToSave || tour);
      setTour(res.data);
      setHasUnsavedChanges(false);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  // Update local state only - no auto-save
  const updateField = (field, value) => {
    setTour(prev => ({ ...prev, [field]: value }));
    setHasUnsavedChanges(true);
  };

  const addStop = () => {
    const newStop = {
      id: crypto.randomUUID(),
      title: `Stop ${(tour.stops?.length || 0) + 1}`,
      description: "",
      unlockMode: "continue",
      pages: [],
      order: tour.stops?.length || 0
    };
    setTour(prev => ({ ...prev, stops: [...(prev.stops || []), newStop] }));
    setHasUnsavedChanges(true);
    setActiveStopId(newStop.id);
    setActivePageId(null);
  };

  const updateStop = (stopId, updates) => {
    setTour(prev => ({
      ...prev,
      stops: prev.stops.map(s => s.id === stopId ? { ...s, ...updates } : s)
    }));
    setHasUnsavedChanges(true);
  };

  const deleteStop = (stopId) => {
    setTour(prev => ({
      ...prev,
      stops: prev.stops.filter(s => s.id !== stopId).map((s, i) => ({ ...s, order: i }))
    }));
    setHasUnsavedChanges(true);
    if (activeStopId === stopId) {
      setActiveStopId(tour.stops.filter(s => s.id !== stopId)[0]?.id || null);
      setActivePageId(null);
    }
  };

  const duplicateStop = (stopId) => {
    const stop = tour.stops.find(s => s.id === stopId);
    if (!stop) return;
    
    const newStop = {
      ...stop,
      id: crypto.randomUUID(),
      title: `${stop.title} (Copy)`,
      order: tour.stops.length,
      pages: stop.pages?.map(p => ({
        ...p,
        id: crypto.randomUUID()
      })) || []
    };
    
    setTour(prev => ({ ...prev, stops: [...prev.stops, newStop] }));
    setHasUnsavedChanges(true);
    setActiveStopId(newStop.id);
    setActivePageId(null);
  };

  const duplicatePage = (stopId, pageId) => {
    const stop = tour.stops.find(s => s.id === stopId);
    const page = stop?.pages?.find(p => p.id === pageId);
    if (!page) return;
    
    const newPage = {
      ...page,
      id: crypto.randomUUID(),
      title: `${page.title} (Copy)`,
      order: stop.pages.length
    };
    
    const updatedPages = [...stop.pages, newPage];
    updateStop(stopId, { pages: updatedPages });
    setActivePageId(newPage.id);
  };

  const addPage = (stopId) => {
    const stop = tour.stops.find(s => s.id === stopId);
    const newPage = {
      id: crypto.randomUUID(),
      title: `Page ${(stop.pages?.length || 0) + 1}`,
      content: "",
      unlockMode: null,
      audioUrl: null,
      order: stop.pages?.length || 0
    };
    const updatedPages = [...(stop.pages || []), newPage];
    updateStop(stopId, { pages: updatedPages });
    setActivePageId(newPage.id);
  };

  const updatePage = (stopId, pageId, updates) => {
    const stop = tour.stops.find(s => s.id === stopId);
    const updatedPages = stop.pages.map(p => p.id === pageId ? { ...p, ...updates } : p);
    updateStop(stopId, { pages: updatedPages });
  };

  const deletePage = (stopId, pageId) => {
    const stop = tour.stops.find(s => s.id === stopId);
    const updatedPages = stop.pages.filter(p => p.id !== pageId).map((p, i) => ({ ...p, order: i }));
    updateStop(stopId, { pages: updatedPages });
    if (activePageId === pageId) setActivePageId(null);
  };

  const onDragEnd = (result, type) => {
    if (!result.destination) return;
    
    if (type === "stops") {
      const items = Array.from(tour.stops);
      const [reordered] = items.splice(result.source.index, 1);
      items.splice(result.destination.index, 0, reordered);
      const updated = items.map((s, i) => ({ ...s, order: i }));
      setTour(prev => ({ ...prev, stops: updated }));
      setHasUnsavedChanges(true);
    }
  };

  const activeStop = tour?.stops?.find(s => s.id === activeStopId);
  const activePage = activeStop?.pages?.find(p => p.id === activePageId);

  if (loading) return <div className="loading-screen">Loading tour...</div>;
  if (!tour) return <div className="loading-screen">Tour not found</div>;

  return (
    <div className="editor-layout" data-testid="tour-editor">
      {/* Header */}
      <header className="editor-header">
        <button onClick={() => navigate("/admin")} className="btn btn-ghost btn-sm">
          <Icons.ChevronLeft /> Back
        </button>
        <div className="editor-header-center">
          <input
            type="text"
            className="editor-title-input"
            value={tour.title}
            onChange={(e) => updateField("title", e.target.value)}
            placeholder="Tour Title"
            data-testid="tour-title-input"
          />
          <span className={`badge badge-${tour.status}`}>{tour.status}</span>
        </div>
        <div className="editor-header-actions">
          {saving && <span className="saving-indicator">Saving...</span>}
          {hasUnsavedChanges && !saving && <span className="unsaved-indicator">Unsaved changes</span>}
          <button 
            onClick={() => saveTour()} 
            className={`btn btn-save-draft ${hasUnsavedChanges ? 'has-changes' : ''}`}
            disabled={saving}
            data-testid="save-draft-btn"
          >
            <Icons.Save />
            {saving ? 'Saving...' : hasUnsavedChanges ? 'Save Changes' : 'Saved'}
          </button>
          <button
            onClick={async () => { 
              const newStatus = tour.status === "published" ? "draft" : "published";
              const updatedTour = { ...tour, status: newStatus };
              setTour(updatedTour);
              await saveTour(updatedTour);
            }}
            className={`btn ${tour.status === "published" ? 'btn-unpublish' : 'btn-publish'}`}
            disabled={saving}
            data-testid="publish-btn"
          >
            {tour.status === "published" ? 'Unpublish' : 'Publish'}
          </button>
        </div>
      </header>

      <div className="editor-body">
        {/* Stops & Pages Tree Panel */}
        <aside className="editor-sidebar stops-panel">
          <div className="panel-header">
            <h3>Tour Structure</h3>
            <button onClick={addStop} className="btn btn-primary btn-sm" data-testid="add-stop-btn">
              <Icons.Plus />
            </button>
          </div>
          
          {/* Welcome Screen Item */}
          <div className="tour-tree">
            <div
              className={`tree-item welcome-item ${showWelcome ? "active" : ""}`}
              onClick={() => { setShowWelcome(true); setActiveStopId(null); setActivePageId(null); }}
              data-testid="welcome-item"
            >
              <span className="tree-icon">👋</span>
              <span className="tree-label">Welcome Screen</span>
              {(tour.welcomeTitle || tour.welcomeBody) && <span className="content-dot" />}
            </div>
            
            {/* Stops with nested Pages */}
            <DragDropContext onDragEnd={(r) => onDragEnd(r, "stops")}>
              <Droppable droppableId="stops">
                {(provided) => (
                  <div className="stops-tree" {...provided.droppableProps} ref={provided.innerRef}>
                    {tour.stops?.sort((a, b) => a.order - b.order).map((stop, index) => (
                      <Draggable key={stop.id} draggableId={stop.id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className={`stop-branch ${snapshot.isDragging ? "dragging" : ""}`}
                          >
                            {/* Stop Item */}
                            <div
                              className={`tree-item stop-item ${activeStopId === stop.id && !activePageId && !showWelcome ? "active" : ""}`}
                              onClick={() => { setActiveStopId(stop.id); setActivePageId(null); setShowWelcome(false); }}
                              data-testid={`stop-item-${stop.id}`}
                            >
                              <span {...provided.dragHandleProps} className="drag-handle"><Icons.Grip /></span>
                              <span className="tree-icon">📍</span>
                              <span className="tree-label">{stop.title || "Untitled Stop"}</span>
                            </div>
                            
                            {/* Nested Pages */}
                            {stop.pages && stop.pages.length > 0 && (
                              <div className="pages-branch">
                                {stop.pages.sort((a, b) => a.order - b.order).map((page) => (
                                  <div
                                    key={page.id}
                                    className={`tree-item page-item ${activePageId === page.id ? "active" : ""}`}
                                    onClick={() => { setActiveStopId(stop.id); setActivePageId(page.id); setShowWelcome(false); }}
                                    data-testid={`page-item-${page.id}`}
                                  >
                                    <span className="tree-connector">└─</span>
                                    <span className="tree-label">{page.title || "Untitled Page"}</span>
                                    {page.storyMode && <span className="mini-badge">S</span>}
                                    {page.unlockMode === 'text' && <Icons.Lock />}
                                    {page.unlockMode === 'multiple_choice' && <Icons.ListChecks />}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          </div>
        </aside>

        {/* Editor Main */}
        <main className="editor-main">
          {showWelcome ? (
            <WelcomeEditor tour={tour} onUpdate={updateField} />
          ) : !activeStop ? (
            <div className="editor-empty">
              <p>Add a stop to get started</p>
            </div>
          ) : !activePageId ? (
            <StopEditor 
              stop={activeStop} 
              onUpdate={(u) => updateStop(activeStopId, u)} 
              onDelete={() => deleteStop(activeStopId)}
              onDuplicate={() => duplicateStop(activeStopId)}
              onAddPage={() => addPage(activeStopId)}
              onSelectPage={(pageId) => setActivePageId(pageId)}
              onDeletePage={(pageId) => deletePage(activeStopId, pageId)}
              onReorderPages={(pages) => updateStop(activeStopId, { pages })}
            />
          ) : (
            <PageEditor 
              page={activePage} 
              stopUnlockMode={activeStop.unlockMode} 
              stopAnswer={activeStop.answer} 
              onUpdate={(u) => updatePage(activeStopId, activePageId, u)} 
              onDelete={() => { deletePage(activeStopId, activePageId); setActivePageId(null); }}
              onDuplicate={() => duplicatePage(activeStopId, activePageId)}
              onBack={() => setActivePageId(null)}
            />
          )}
        </main>

        {/* Sharing Assets Panel */}
        <ShareAssetsPanel tourId={tourId} tourStatus={tour.status} />
      </div>
    </div>
  );
};

// ==================== SHARE ASSETS PANEL ====================
const ShareAssetsPanel = ({ tourId, tourStatus }) => {
  const [copied, setCopied] = useState(false);
  
  // Build the player URL using the production base
  const getPlayerUrl = () => {
    const backendUrl = process.env.REACT_APP_BACKEND_URL;
    if (backendUrl) {
      // Remove /api suffix if present, use the base domain
      const baseUrl = backendUrl.replace(/\/api\/?$/, '');
      return `${baseUrl}/play/${tourId}`;
    }
    return `${window.location.origin}/play/${tourId}`;
  };
  const playerUrl = getPlayerUrl();

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(playerUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = playerUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const openPreview = () => {
    window.open(playerUrl, '_blank');
  };

  return (
    <aside className="editor-sidebar share-panel" data-testid="share-assets-panel">
      <div className="panel-header">
        <h3><Icons.QRCode /> Share Assets</h3>
      </div>
      
      <div className="share-panel-content">
        {/* QR Code */}
        <div className="qr-code-container">
          <div className="qr-code-frame">
            <QRCodeSVG 
              value={playerUrl} 
              size={160} 
              level="M"
              includeMargin={true}
              bgColor="#ffffff"
              fgColor="#000000"
            />
          </div>
          <p className="qr-label">SCANNABLE TOUR LINK</p>
          <p className="qr-sublabel">Ready for print materials</p>
        </div>

        {/* Action Buttons */}
        <div className="share-actions">
          <button 
            onClick={copyLink} 
            className="btn btn-share-action"
            data-testid="copy-link-btn"
          >
            {copied ? <><Icons.Check /> Copied!</> : <><Icons.Copy /> Copy Tour Link</>}
          </button>
          <button 
            onClick={openPreview} 
            className="btn btn-share-preview"
            data-testid="preview-btn"
          >
            <Icons.Eye /> Preview as Player
          </button>
        </div>

        {/* Status Info */}
        {tourStatus !== 'published' && (
          <div className="share-warning">
            <p>⚠️ Draft tour - publish to allow public access</p>
          </div>
        )}

        {/* Player URL Display */}
        <div className="player-url-display">
          <label className="form-label">Player URL</label>
          <div className="url-box">
            <code>{playerUrl}</code>
          </div>
        </div>
      </div>
    </aside>
  );
};

// ==================== WELCOME EDITOR ====================
// Map click handler component
const MapClickHandler = ({ onClick }) => {
  useMapEvents({
    click: (e) => onClick(e.latlng.lat, e.latlng.lng)
  });
  return null;
};

const WelcomeEditor = ({ tour, onUpdate }) => {
  const [gettingLocation, setGettingLocation] = useState(false);
  const [locationError, setLocationError] = useState(null);
  const mapRef = useRef(null);

  // Default center (NYC) if no coordinates set
  const defaultCenter = [40.7128, -74.0060];
  const mapCenter = tour.welcomeGpsLat && tour.welcomeGpsLng 
    ? [tour.welcomeGpsLat, tour.welcomeGpsLng] 
    : defaultCenter;

  const handleMapClick = (lat, lng) => {
    onUpdate("welcomeGpsLat", lat);
    onUpdate("welcomeGpsLng", lng);
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser");
      return;
    }
    
    setGettingLocation(true);
    setLocationError(null);
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        onUpdate("welcomeGpsLat", latitude);
        onUpdate("welcomeGpsLng", longitude);
        setGettingLocation(false);
        
        // Pan map to new location
        if (mapRef.current) {
          mapRef.current.setView([latitude, longitude], 16);
        }
      },
      (error) => {
        setGettingLocation(false);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setLocationError("Location access denied. Please enable location permissions.");
            break;
          case error.POSITION_UNAVAILABLE:
            setLocationError("Location information unavailable.");
            break;
          case error.TIMEOUT:
            setLocationError("Location request timed out.");
            break;
          default:
            setLocationError("An unknown error occurred.");
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  return (
    <div className="content-editor" data-testid="welcome-editor">
      <div className="editor-section main-text-section">
        <h2>Tour Settings</h2>
        
        {/* Background Color Picker */}
        <div className="form-group">
          <label className="form-label">Background Color</label>
          <div className="color-picker-container">
            <div className="color-presets">
              {['#ffffff', '#f8f9fa', '#fff8e7', '#e8f5e9', '#e3f2fd', '#fce4ec', '#f3e5f5', '#1a1a1a'].map(color => (
                <button
                  key={color}
                  type="button"
                  className={`color-preset ${tour.backgroundColor === color ? 'selected' : ''}`}
                  style={{ backgroundColor: color }}
                  onClick={() => onUpdate("backgroundColor", color)}
                  title={color}
                />
              ))}
            </div>
            <div className="color-custom">
              <input
                type="color"
                value={tour.backgroundColor || "#ffffff"}
                onChange={(e) => onUpdate("backgroundColor", e.target.value)}
                className="color-input"
                data-testid="background-color-input"
              />
              <span className="color-value">{tour.backgroundColor || "#ffffff"}</span>
            </div>
          </div>
        </div>

        {/* Skin Image URL */}
        <div className="form-group">
          <label className="form-label">Skin Image URL <span className="text-small">(optional)</span></label>
          <p className="text-small helper-text">Background image for the player. Pages can override this.</p>
          <ClearableInput
            type="text"
            className="input"
            value={tour.skinImageUrl || ""}
            onChange={(e) => onUpdate("skinImageUrl", e.target.value || null)}
            onClear={() => onUpdate("skinImageUrl", null)}
            placeholder="https://example.com/crystal-background.jpg"
            data-testid="skin-image-url-input"
          />
          {tour.skinImageUrl && (
            <div className="skin-preview" style={{ marginTop: '0.5rem' }}>
              <img 
                src={tour.skinImageUrl} 
                alt="Skin preview" 
                style={{ 
                  maxWidth: '100%', 
                  maxHeight: '120px', 
                  borderRadius: '8px',
                  objectFit: 'cover'
                }} 
              />
            </div>
          )}
        </div>

        <div className="divider" />
        <h2>Welcome Screen</h2>
        <p className="text-small helper-text">Shown before the tour starts. Leave empty to skip.</p>
        <div className="form-group">
          <label className="form-label">Welcome Title</label>
          <input 
            type="text" 
            className="input" 
            value={tour.welcomeTitle || ""} 
            onChange={(e) => onUpdate("welcomeTitle", e.target.value || null)} 
            placeholder="Welcome to the tour!" 
            data-testid="welcome-title-input" 
          />
        </div>
        <div className="form-group">
          <label className="form-label">Welcome Message</label>
          <textarea 
            className="input body-textarea" 
            value={tour.welcomeBody || ""} 
            onChange={(e) => onUpdate("welcomeBody", e.target.value || null)} 
            placeholder="Describe what visitors will experience..." 
            data-testid="welcome-body-input" 
          />
          <p className="text-small">Supports HTML formatting</p>
        </div>
        <div className="form-group">
          <label className="form-label">Welcome Image URL</label>
          <ClearableInput 
            type="url" 
            value={tour.welcomeImageUrl} 
            onChange={(val) => onUpdate("welcomeImageUrl", val)} 
            onClear={() => onUpdate("welcomeImageUrl", null)}
            placeholder="https://example.com/welcome-image.jpg" 
            data-testid="welcome-image-input" 
          />
        </div>
        {tour.welcomeImageUrl && (
          <div className="image-preview">
            <img src={tour.welcomeImageUrl} alt="Welcome preview" />
            <button 
              type="button" 
              className="btn btn-delete-media"
              onClick={() => onUpdate("welcomeImageUrl", null)}
              title="Remove image"
            >
              <Icons.Trash /> Remove Image
            </button>
          </div>
        )}
        <div className="form-group">
          <label className="form-label">Audio URL (optional)</label>
          <ClearableInput 
            type="url" 
            value={tour.welcomeAudioUrl} 
            onChange={(val) => onUpdate("welcomeAudioUrl", val)} 
            onClear={() => onUpdate("welcomeAudioUrl", null)}
            placeholder="https://example.com/welcome-audio.mp3" 
            data-testid="welcome-audio-input" 
          />
        </div>
        {tour.welcomeAudioUrl && (
          <div className="audio-preview">
            <audio controls src={tour.welcomeAudioUrl} />
            <button 
              type="button" 
              className="btn btn-delete-media"
              onClick={() => onUpdate("welcomeAudioUrl", null)}
              title="Remove audio"
            >
              <Icons.Trash /> Remove Audio
            </button>
          </div>
        )}
        <div className="form-group">
          <label className="form-label">Button Label</label>
          <input 
            type="text" 
            className="input" 
            value={tour.welcomeButtonLabel || ""} 
            onChange={(e) => onUpdate("welcomeButtonLabel", e.target.value || null)} 
            placeholder="Start Tour" 
            data-testid="welcome-button-label-input" 
          />
          <p className="text-small">Default: "Start Tour"</p>
        </div>

        {/* GPS Section */}
        <div className="divider" />
        <h3 className="section-label"><Icons.MapPin /> GPS Start Location</h3>
        <p className="text-small helper-text">Require players to be at a specific location to start the tour</p>
        
        <div className="form-group">
          <label className="checkbox-label">
            <input 
              type="checkbox" 
              checked={tour.welcomeGpsEnabled || false} 
              onChange={(e) => onUpdate("welcomeGpsEnabled", e.target.checked)} 
              data-testid="welcome-gps-enabled"
            />
            <span>Enable GPS location check</span>
          </label>
        </div>

        {tour.welcomeGpsEnabled && (
          <div className="gps-fields">
            {/* Use My Location Button */}
            <div className="gps-actions">
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={useMyLocation}
                disabled={gettingLocation}
                data-testid="use-my-location-btn"
              >
                <Icons.Navigation />
                {gettingLocation ? "Getting location..." : "Use My Location"}
              </button>
            </div>
            {locationError && (
              <p className="error-message">{locationError}</p>
            )}

            {/* Map for selecting location */}
            <div className="gps-map-container" data-testid="gps-map">
              <MapContainer 
                center={mapCenter} 
                zoom={tour.welcomeGpsLat ? 16 : 12} 
                style={{ height: '280px', width: '100%', borderRadius: '8px' }}
                ref={mapRef}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <MapClickHandler onClick={handleMapClick} />
                {tour.welcomeGpsLat && tour.welcomeGpsLng && (
                  <>
                    <Marker position={[tour.welcomeGpsLat, tour.welcomeGpsLng]} />
                    <Circle 
                      center={[tour.welcomeGpsLat, tour.welcomeGpsLng]} 
                      radius={tour.welcomeGpsRadiusMeters || 100}
                      pathOptions={{ color: '#7c3aed', fillColor: '#7c3aed', fillOpacity: 0.2 }}
                    />
                  </>
                )}
              </MapContainer>
              <p className="text-small map-hint">Click on the map to set location, or use the button above</p>
            </div>

            {/* Manual coordinate inputs */}
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Latitude</label>
                <input 
                  type="number" 
                  step="any"
                  className="input" 
                  value={tour.welcomeGpsLat ?? ""} 
                  onChange={(e) => onUpdate("welcomeGpsLat", e.target.value ? parseFloat(e.target.value) : null)} 
                  placeholder="e.g. 40.7128" 
                  data-testid="welcome-gps-lat"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Longitude</label>
                <input 
                  type="number" 
                  step="any"
                  className="input" 
                  value={tour.welcomeGpsLng ?? ""} 
                  onChange={(e) => onUpdate("welcomeGpsLng", e.target.value ? parseFloat(e.target.value) : null)} 
                  placeholder="e.g. -74.0060" 
                  data-testid="welcome-gps-lng"
                />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Radius (meters) - Bubble Size</label>
              <input 
                type="number" 
                className="input" 
                value={tour.welcomeGpsRadiusMeters ?? 100} 
                onChange={(e) => onUpdate("welcomeGpsRadiusMeters", e.target.value ? parseInt(e.target.value) : 100)} 
                placeholder="100" 
                min="10"
                max="5000"
                data-testid="welcome-gps-radius"
              />
              <p className="text-small">How close players must be to start (10-5000m)</p>
            </div>
          </div>
        )}

        {/* Completion Screen Section */}
        <div className="divider" />
        <h3 className="section-label">🎉 Completion Screen</h3>
        <p className="text-small helper-text">Shown when players finish the tour</p>
        
        <div className="form-group">
          <label className="form-label">Completion Title</label>
          <input 
            type="text" 
            className="input" 
            value={tour.completionTitle || ""} 
            onChange={(e) => onUpdate("completionTitle", e.target.value || null)} 
            placeholder="Tour Complete!" 
            data-testid="completion-title-input" 
          />
        </div>
        <div className="form-group">
          <label className="form-label">Completion Message</label>
          <textarea 
            className="input body-textarea" 
            value={tour.completionBody || ""} 
            onChange={(e) => onUpdate("completionBody", e.target.value || null)} 
            placeholder="Congratulations! You've completed the tour." 
            data-testid="completion-body-input" 
          />
        </div>
        <div className="form-group">
          <label className="form-label">Completion Image URL (optional)</label>
          <ClearableInput 
            type="url" 
            value={tour.completionImageUrl} 
            onChange={(val) => onUpdate("completionImageUrl", val)} 
            onClear={() => onUpdate("completionImageUrl", null)}
            placeholder="https://example.com/celebration.jpg" 
            data-testid="completion-image-input" 
          />
        </div>
        {tour.completionImageUrl && (
          <div className="image-preview">
            <img src={tour.completionImageUrl} alt="Completion preview" />
            <button 
              type="button" 
              className="btn btn-delete-media"
              onClick={() => onUpdate("completionImageUrl", null)}
              title="Remove image"
            >
              <Icons.Trash /> Remove Image
            </button>
          </div>
        )}
        <div className="form-group">
          <label className="form-label">Button Label</label>
          <input 
            type="text" 
            className="input" 
            value={tour.completionButtonLabel || ""} 
            onChange={(e) => onUpdate("completionButtonLabel", e.target.value || null)} 
            placeholder="Back to Start" 
            data-testid="completion-button-label-input" 
          />
        </div>
        <div className="form-group">
          <label className="form-label">Button URL (optional)</label>
          <ClearableInput 
            type="url" 
            value={tour.completionButtonUrl} 
            onChange={(val) => onUpdate("completionButtonUrl", val)} 
            onClear={() => onUpdate("completionButtonUrl", null)}
            placeholder="https://yourwebsite.com/book-now" 
            data-testid="completion-button-url-input" 
          />
          <p className="text-small">Leave empty to go back to tour start. Add a URL to redirect elsewhere (e.g., booking page).</p>
        </div>
      </div>
    </div>
  );
};

// ==================== GALLERY URLS EDITOR ====================
const GalleryUrlsEditor = ({ urls = [], onChange }) => {
  const addUrl = () => onChange([...(urls || []), '']);
  const updateUrl = (index, value) => {
    const newUrls = [...(urls || [])];
    newUrls[index] = value;
    onChange(newUrls);
  };
  const removeUrl = (index) => {
    const newUrls = (urls || []).filter((_, i) => i !== index);
    onChange(newUrls.length > 0 ? newUrls : null);
  };

  return (
    <div className="gallery-urls-editor">
      {(urls || []).map((url, index) => (
        <div key={index} className="gallery-url-row">
          <input
            type="url"
            className="input"
            value={url}
            onChange={(e) => updateUrl(index, e.target.value)}
            placeholder={`Image URL ${index + 1}`}
          />
          <button type="button" onClick={() => removeUrl(index)} className="btn btn-ghost btn-sm">
            <Icons.Trash />
          </button>
        </div>
      ))}
      <button type="button" onClick={addUrl} className="btn btn-secondary btn-sm">
        <Icons.Plus /> Add Image
      </button>
    </div>
  );
};

// ==================== DELETE CONFIRMATION MODAL ====================
const DeleteConfirmModal = ({ isOpen, onClose, onConfirm, itemType }) => {
  if (!isOpen) return null;
  
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h3>Delete {itemType}?</h3>
        <p>This action cannot be undone. Are you sure you want to delete this {itemType.toLowerCase()}?</p>
        <div className="modal-actions">
          <button onClick={onClose} className="btn btn-secondary">Cancel</button>
          <button onClick={onConfirm} className="btn btn-danger">Delete</button>
        </div>
      </div>
    </div>
  );
};

// ==================== ACCORDION SECTION ====================
const AccordionSection = ({ title, icon, isOpen, onToggle, hasContent, onClear, children }) => (
  <div className={`accordion-section ${isOpen ? 'open' : ''} ${hasContent ? 'has-content' : ''}`}>
    <div className="accordion-header">
      <button type="button" className="accordion-trigger" onClick={onToggle}>
        <span className="accordion-icon">{icon}</span>
        <span className="accordion-title">{title}</span>
        <span className="accordion-indicator">{hasContent && <span className="content-dot" />}{isOpen ? '−' : '+'}</span>
      </button>
      {hasContent && onClear && (
        <button 
          type="button" 
          className="accordion-clear-btn" 
          onClick={(e) => { e.stopPropagation(); onClear(); }}
          title="Clear this section"
        >
          <Icons.Trash />
        </button>
      )}
    </div>
    {isOpen && <div className="accordion-content">{children}</div>}
  </div>
);

// ==================== STOP EDITOR ====================
const StopEditor = ({ stop, onUpdate, onDelete, onDuplicate, onAddPage, onSelectPage, onDeletePage, onReorderPages }) => {
  const [openSections, setOpenSections] = useState({ pages: true }); // Pages open by default
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const toggleSection = (section) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const handleDelete = () => {
    setShowMenu(false);
    setShowDeleteModal(true);
  };

  const handleDuplicate = () => {
    setShowMenu(false);
    onDuplicate();
  };

  const confirmDelete = () => {
    setShowDeleteModal(false);
    onDelete();
  };

  // Handle page reordering within the stop
  const handlePageDragEnd = (result) => {
    if (!result.destination) return;
    const pages = Array.from(stop.pages || []);
    const [removed] = pages.splice(result.source.index, 1);
    pages.splice(result.destination.index, 0, removed);
    const reorderedPages = pages.map((p, idx) => ({ ...p, order: idx }));
    onReorderPages(reorderedPages);
  };

  // Add/remove multiple choice option
  const addMcOption = () => {
    const currentOptions = stop.mcOptions || [];
    onUpdate({ mcOptions: [...currentOptions, ''] });
  };

  const updateMcOption = (index, value) => {
    const newOptions = [...(stop.mcOptions || [])];
    newOptions[index] = value;
    onUpdate({ mcOptions: newOptions });
  };

  const removeMcOption = (index) => {
    const newOptions = (stop.mcOptions || []).filter((_, i) => i !== index);
    // Adjust correct index if needed
    let newCorrectIndex = stop.mcCorrectIndex;
    if (newCorrectIndex !== null && newCorrectIndex !== undefined) {
      if (index === newCorrectIndex) {
        newCorrectIndex = null;
      } else if (index < newCorrectIndex) {
        newCorrectIndex = newCorrectIndex - 1;
      }
    }
    onUpdate({ mcOptions: newOptions.length > 0 ? newOptions : null, mcCorrectIndex: newCorrectIndex });
  };

  const hasImage = !!(stop.imageUrl || (stop.galleryUrls && stop.galleryUrls.length > 0));
  const hasEmbed = !!stop.embedUrl;
  const hasAudio = !!stop.audioUrl;
  const hasBroadcast = !!(stop.ctaLabel || stop.ctaUrl);
  const hasUnlock = stop.unlockMode && stop.unlockMode !== 'continue';
  const hasTask = !!stop.taskInstructions;
  const hasHint = !!stop.hintText;
  const hasMedia = !!stop.mediaUrl;

  return (
    <div className="content-editor" data-testid="stop-editor">
      {/* Header with overflow menu */}
      <div className="editor-content-header">
        <h2>Edit Stop</h2>
        <div className="overflow-menu-container">
          <button 
            className="btn btn-ghost btn-sm overflow-trigger" 
            onClick={() => setShowMenu(!showMenu)}
            data-testid="stop-menu-btn"
          >
            ⋯
          </button>
          {showMenu && (
            <div className="overflow-menu">
              <button 
                onClick={handleDuplicate} 
                className="overflow-menu-item"
                data-testid="duplicate-stop-btn"
              >
                <Icons.Copy /> Duplicate Stop
              </button>
              <button 
                onClick={handleDelete} 
                className="overflow-menu-item danger"
                data-testid="delete-stop-btn"
              >
                <Icons.Trash /> Delete Stop
              </button>
            </div>
          )}
        </div>
      </div>

      {/* MAIN TEXT - Always visible */}
      <div className="editor-section main-text-section">
        <div className="form-group">
          <label className="form-label">Title</label>
          <input type="text" className="input" value={stop.title || ""} onChange={(e) => onUpdate({ title: e.target.value })} placeholder="Stop title" data-testid="stop-title-input" />
        </div>
        <div className="form-group">
          <label className="form-label">Subtitle</label>
          <input type="text" className="input" value={stop.subtitle || ""} onChange={(e) => onUpdate({ subtitle: e.target.value || null })} placeholder="Optional subtitle" data-testid="stop-subtitle-input" />
        </div>
        <div className="form-group">
          <label className="form-label">Story Text</label>
          <textarea className="input body-textarea" value={stop.description || ""} onChange={(e) => onUpdate({ description: e.target.value })} placeholder="The narrative shown to players..." data-testid="stop-description-input" />
        </div>
        <div className="form-group">
          <label className="form-label">Story Text 2</label>
          <textarea className="input" value={stop.intro2 || ""} onChange={(e) => onUpdate({ intro2: e.target.value || null })} placeholder="Optional secondary text" data-testid="stop-intro2-input" />
        </div>
      </div>

      {/* ACCORDION SECTIONS */}
      <div className="accordion-container">
        {/* On-Site Task / Instructions */}
        <AccordionSection
          title="On-Site Task / Instructions"
          icon={<Icons.FileText />}
          isOpen={openSections.task}
          onToggle={() => toggleSection('task')}
          hasContent={hasTask}
          onClear={() => onUpdate({ taskInstructions: null })}
        >
          <div className="form-group">
            <label className="form-label">Task Instructions</label>
            <textarea 
              className="input body-textarea" 
              value={stop.taskInstructions || ""} 
              onChange={(e) => onUpdate({ taskInstructions: e.target.value || null })} 
              placeholder="e.g. 'Ask the server for the Blue Envelope'..." 
              data-testid="stop-task-input" 
            />
            <p className="text-small">Instructions for physical tasks at this location</p>
          </div>
        </AccordionSection>

        {/* Media Type */}
        <AccordionSection
          title="Media"
          icon={<Icons.Video />}
          isOpen={openSections.media}
          onToggle={() => toggleSection('media')}
          hasContent={hasMedia}
          onClear={() => onUpdate({ mediaUrl: null, mediaType: null })}
        >
          <div className="form-group">
            <label className="form-label">Media Type</label>
            <div className="media-type-buttons">
              <button 
                type="button"
                className={`media-type-btn ${stop.mediaType === 'image' ? 'active' : ''}`}
                onClick={() => onUpdate({ mediaType: 'image' })}
              >
                IMAGE
              </button>
              <button 
                type="button"
                className={`media-type-btn ${stop.mediaType === 'video' ? 'active' : ''}`}
                onClick={() => onUpdate({ mediaType: 'video' })}
              >
                VIDEO
              </button>
              <button 
                type="button"
                className={`media-type-btn ${stop.mediaType === 'youtube' ? 'active' : ''}`}
                onClick={() => onUpdate({ mediaType: 'youtube' })}
              >
                YOUTUBE
              </button>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Media URL</label>
            <ClearableInput 
              type="url" 
              value={stop.mediaUrl} 
              onChange={(val) => onUpdate({ mediaUrl: val })} 
              onClear={() => onUpdate({ mediaUrl: null, mediaType: null })}
              placeholder="https://..." 
              data-testid="stop-media-url-input" 
            />
          </div>
        </AccordionSection>

        <AccordionSection
          title="Add Image / Gallery"
          icon={<Icons.Image />}
          isOpen={openSections.image}
          onToggle={() => toggleSection('image')}
          hasContent={hasImage}
        >
          <div className="form-group">
            <label className="form-label">Background Image (Optional)</label>
            <ClearableInput 
              type="url" 
              value={stop.imageUrl} 
              onChange={(val) => onUpdate({ imageUrl: val })} 
              onClear={() => onUpdate({ imageUrl: null })}
              placeholder="Custom background URL for this stop..." 
              data-testid="stop-image-url-input" 
            />
          </div>
          <div className="form-group">
            <label className="form-label">Image Alt Text</label>
            <input type="text" className="input" value={stop.imageAlt || ""} onChange={(e) => onUpdate({ imageAlt: e.target.value || null })} placeholder="Describe the image" data-testid="stop-image-alt-input" />
          </div>
          <div className="form-group">
            <label className="form-label">Gallery Images</label>
            <GalleryUrlsEditor urls={stop.galleryUrls} onChange={(urls) => onUpdate({ galleryUrls: urls })} />
          </div>
        </AccordionSection>

        <AccordionSection
          title="Add Embed (YouTube / Map)"
          icon={<Icons.Video />}
          isOpen={openSections.embed}
          onToggle={() => toggleSection('embed')}
          hasContent={hasEmbed}
          onClear={() => onUpdate({ embedUrl: null, embedCaption: null })}
        >
          <div className="form-group">
            <label className="form-label">Embed URL</label>
            <ClearableInput 
              type="url" 
              value={stop.embedUrl} 
              onChange={(val) => onUpdate({ embedUrl: val })} 
              onClear={() => onUpdate({ embedUrl: null, embedCaption: null })}
              placeholder="YouTube, Vimeo, or Google Maps URL" 
              data-testid="stop-embed-url-input" 
            />
            <p className="text-small">Allowed: YouTube, Vimeo, Google Maps</p>
          </div>
          <div className="form-group">
            <label className="form-label">Caption</label>
            <input type="text" className="input" value={stop.embedCaption || ""} onChange={(e) => onUpdate({ embedCaption: e.target.value || null })} placeholder="Optional caption" data-testid="stop-embed-caption-input" />
          </div>
        </AccordionSection>

        <AccordionSection
          title="Add Audio"
          icon={<Icons.Audio />}
          isOpen={openSections.audio}
          onToggle={() => toggleSection('audio')}
          hasContent={hasAudio}
          onClear={() => onUpdate({ audioUrl: null })}
        >
          <div className="form-group">
            <label className="form-label">Audio URL</label>
            <ClearableInput 
              type="url" 
              value={stop.audioUrl} 
              onChange={(val) => onUpdate({ audioUrl: val })} 
              onClear={() => onUpdate({ audioUrl: null })}
              placeholder="https://example.com/audio.mp3" 
              data-testid="stop-audio-url-input" 
            />
          </div>
          {stop.audioUrl && (
            <div className="audio-preview">
              <audio controls src={stop.audioUrl} />
            </div>
          )}
        </AccordionSection>

        <AccordionSection
          title="Broadcast"
          icon={<Icons.Broadcast />}
          isOpen={openSections.broadcast}
          onToggle={() => toggleSection('broadcast')}
          hasContent={hasBroadcast}
        >
          <div className="form-group">
            <label className="form-label">Button Label</label>
            <input type="text" className="input" value={stop.ctaLabel || ""} onChange={(e) => onUpdate({ ctaLabel: e.target.value || null })} placeholder="Learn More" data-testid="stop-cta-label-input" />
          </div>
          <div className="form-group">
            <label className="form-label">Button URL</label>
            <input type="url" className="input" value={stop.ctaUrl || ""} onChange={(e) => onUpdate({ ctaUrl: e.target.value || null })} placeholder="https://example.com" data-testid="stop-cta-url-input" />
          </div>
        </AccordionSection>

        {/* Hint Section */}
        <AccordionSection
          title="Hint"
          icon={<Icons.HelpCircle />}
          isOpen={openSections.hint}
          onToggle={() => toggleSection('hint')}
          hasContent={hasHint}
        >
          <div className="form-group">
            <label className="form-label">Hint Text</label>
            <textarea 
              className="input body-textarea" 
              value={stop.hintText || ""} 
              onChange={(e) => onUpdate({ hintText: e.target.value || null })} 
              placeholder="A helpful hint for players who get stuck..." 
              data-testid="stop-hint-input" 
            />
          </div>
          <div className="form-group">
            <label className="toggle-label">
              <input 
                type="checkbox" 
                checked={stop.autoShowHint || false} 
                onChange={(e) => onUpdate({ autoShowHint: e.target.checked })} 
                data-testid="stop-auto-hint-toggle"
              />
              <span className="toggle-switch"></span>
              <span>Auto-Show Hints</span>
            </label>
            <p className="text-small">Automatically show hint when player arrives</p>
          </div>
        </AccordionSection>

        {/* Verification Section */}
        <AccordionSection
          title="Verification"
          icon={<Icons.Lock />}
          isOpen={openSections.unlock}
          onToggle={() => toggleSection('unlock')}
          hasContent={hasUnlock}
        >
          {/* Story Mode Toggle */}
          <div className="form-group">
            <label className="toggle-label">
              <input 
                type="checkbox" 
                checked={stop.storyMode || false} 
                onChange={(e) => onUpdate({ storyMode: e.target.checked })} 
                data-testid="stop-story-mode-toggle"
              />
              <span className="toggle-switch"></span>
              <span>Story Mode (No Verification)</span>
            </label>
            <p className="text-small">Skip verification - players just read and continue</p>
          </div>

          {!stop.storyMode && (
            <>
              <div className="form-group">
                <label className="form-label">Verification Type</label>
                <div className="verification-type-buttons">
                  <button 
                    type="button"
                    className={`verification-type-btn ${stop.unlockMode === 'text' ? 'active' : ''}`}
                    onClick={() => onUpdate({ unlockMode: 'text' })}
                  >
                    TEXT
                  </button>
                  <button 
                    type="button"
                    className={`verification-type-btn ${stop.unlockMode === 'multiple_choice' ? 'active' : ''}`}
                    onClick={() => onUpdate({ unlockMode: 'multiple_choice' })}
                  >
                    MULTIPLE CHOICE
                  </button>
                  <button 
                    type="button"
                    className={`verification-type-btn ${stop.unlockMode === 'whiteboard' ? 'active' : ''}`}
                    onClick={() => onUpdate({ unlockMode: 'whiteboard' })}
                  >
                    WHITEBOARD
                  </button>
                </div>
              </div>

              {/* Text verification options */}
              {stop.unlockMode === 'text' && (
                <>
                  <div className="form-group">
                    <label className="form-label">Password / Code</label>
                    <input 
                      type="text" 
                      className="input" 
                      value={stop.answer || ""} 
                      onChange={(e) => onUpdate({ answer: e.target.value })} 
                      placeholder="Required answer" 
                      data-testid="stop-answer-input" 
                    />
                  </div>
                  <div className="form-group">
                    <label className="toggle-label">
                      <input 
                        type="checkbox" 
                        checked={stop.caseInsensitive !== false} 
                        onChange={(e) => onUpdate({ caseInsensitive: e.target.checked })} 
                        data-testid="stop-case-insensitive-toggle"
                      />
                      <span className="toggle-switch"></span>
                      <span>Case-Insensitive</span>
                    </label>
                    <p className="text-small">"PARIS" matches "paris", "Paris", etc.</p>
                  </div>
                </>
              )}

              {/* Multiple choice options */}
              {stop.unlockMode === 'multiple_choice' && (
                <div className="form-group">
                  <label className="form-label">Options</label>
                  <div className="mc-options-editor">
                    {(stop.mcOptions || []).map((option, index) => (
                      <div key={index} className="mc-option-row">
                        <label className="mc-correct-radio">
                          <input 
                            type="radio" 
                            name="stop-mc-correct" 
                            checked={stop.mcCorrectIndex === index}
                            onChange={() => onUpdate({ mcCorrectIndex: index })}
                          />
                          <span className="radio-indicator"></span>
                        </label>
                        <input
                          type="text"
                          className="input"
                          value={option}
                          onChange={(e) => updateMcOption(index, e.target.value)}
                          placeholder={`Option ${index + 1}`}
                        />
                        <button type="button" onClick={() => removeMcOption(index)} className="btn btn-ghost btn-sm">
                          <Icons.Trash />
                        </button>
                      </div>
                    ))}
                    <button type="button" onClick={addMcOption} className="btn btn-secondary btn-sm">
                      <Icons.Plus /> Add Option
                    </button>
                  </div>
                  <p className="text-small">Select the radio button next to the correct answer</p>
                </div>
              )}

              {/* Whiteboard info */}
              {stop.unlockMode === 'whiteboard' && (
                <p className="text-small helper-text">Players can type anything to proceed - no correct answer required</p>
              )}
            </>
          )}
        </AccordionSection>

        {/* PAGES SECTION */}
        <div className={`accordion-section pages-accordion ${openSections.pages ? 'open' : ''}`}>
          <button type="button" className="accordion-trigger pages-trigger" onClick={() => toggleSection('pages')}>
            <span className="accordion-icon"><Icons.FileText /></span>
            <span className="accordion-title">Pages ({stop.pages?.length || 0})</span>
            <span className="accordion-indicator">{openSections.pages ? '−' : '+'}</span>
          </button>
          {openSections.pages && (
            <div className="accordion-content pages-content">
              <DragDropContext onDragEnd={handlePageDragEnd}>
                <Droppable droppableId="stop-pages">
                  {(provided) => (
                    <div className="pages-list-inline" {...provided.droppableProps} ref={provided.innerRef}>
                      {(stop.pages || []).sort((a, b) => a.order - b.order).map((page, index) => (
                        <Draggable key={page.id} draggableId={page.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className={`page-item-inline ${snapshot.isDragging ? 'dragging' : ''}`}
                              data-testid={`page-item-${page.id}`}
                            >
                              <span {...provided.dragHandleProps} className="drag-handle"><Icons.Grip /></span>
                              <span className="page-info" onClick={() => onSelectPage(page.id)}>
                                <span className="page-title-inline">{page.title || 'Untitled Page'}</span>
                                <span className="page-badges">
                                  {page.storyMode && <span className="badge badge-sm">Story</span>}
                                  {page.unlockMode === 'text' && <Icons.Type />}
                                  {page.unlockMode === 'multiple_choice' && <Icons.ListChecks />}
                                  {page.unlockMode === 'whiteboard' && <Icons.Edit />}
                                </span>
                              </span>
                              <button 
                                type="button" 
                                className="btn btn-ghost btn-sm page-delete-btn"
                                onClick={(e) => { e.stopPropagation(); onDeletePage(page.id); }}
                              >
                                <Icons.Trash />
                              </button>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
              <button type="button" onClick={onAddPage} className="btn btn-secondary add-page-btn" data-testid="add-page-btn">
                <Icons.Plus /> Add Page
              </button>
            </div>
          )}
        </div>
      </div>

      <DeleteConfirmModal 
        isOpen={showDeleteModal} 
        onClose={() => setShowDeleteModal(false)} 
        onConfirm={confirmDelete}
        itemType="Stop"
      />
    </div>
  );
};

const PageEditor = ({ page, stopUnlockMode, stopAnswer, onUpdate, onDelete, onDuplicate, onBack }) => {
  const [openSections, setOpenSections] = useState({});
  const [localTitle, setLocalTitle] = useState(page.title || "");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const saveTimeoutRef = useRef(null);

  // Sync local title when page changes
  useEffect(() => {
    setLocalTitle(page.title || "");
  }, [page.id]);

  const toggleSection = (section) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  // Debounced save for title
  const handleTitleChange = (value) => {
    setLocalTitle(value);
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(() => {
      onUpdate({ title: value });
    }, 300);
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  const handleDelete = () => {
    setShowMenu(false);
    setShowDeleteModal(true);
  };

  const handleDuplicate = () => {
    setShowMenu(false);
    onDuplicate();
  };

  const handleDelete2 = () => {
    setShowMenu(false);
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    setShowDeleteModal(false);
    onDelete();
  };

  const getDisplayUnlockMode = (mode) => {
    switch(mode) {
      case "continue": return "Continue";
      case "text": return "Text";
      case "multiple_choice": return "Multiple Choice";
      case "whiteboard": return "Whiteboard";
      default: return mode;
    }
  };

  // Add/remove multiple choice option
  const addMcOption = () => {
    const currentOptions = page.mcOptions || [];
    onUpdate({ mcOptions: [...currentOptions, ''] });
  };

  const updateMcOption = (index, value) => {
    const newOptions = [...(page.mcOptions || [])];
    newOptions[index] = value;
    onUpdate({ mcOptions: newOptions });
  };

  const removeMcOption = (index) => {
    const newOptions = (page.mcOptions || []).filter((_, i) => i !== index);
    let newCorrectIndex = page.mcCorrectIndex;
    if (newCorrectIndex !== null && newCorrectIndex !== undefined) {
      if (index === newCorrectIndex) {
        newCorrectIndex = null;
      } else if (index < newCorrectIndex) {
        newCorrectIndex = newCorrectIndex - 1;
      }
    }
    onUpdate({ mcOptions: newOptions.length > 0 ? newOptions : null, mcCorrectIndex: newCorrectIndex });
  };

  const hasImage = !!(page.imageUrl || (page.galleryUrls && page.galleryUrls.length > 0));
  const hasEmbed = !!page.embedUrl;
  const hasAudio = !!page.audioUrl;
  const hasBroadcast = !!(page.ctaLabel || page.ctaUrl);
  const hasUnlock = page.unlockMode && page.unlockMode !== 'continue' && page.unlockMode !== '';
  const hasTask = !!page.taskInstructions;
  const hasHint = !!page.hintText;
  const hasMedia = !!page.mediaUrl;

  return (
    <div className="content-editor" data-testid="page-editor">
      {/* Back button */}
      <button onClick={onBack} className="btn btn-back-to-stop" data-testid="back-to-stop-btn">
        <Icons.ChevronLeft /> Back to Stop
      </button>

      {/* Header with overflow menu */}
      <div className="editor-content-header">
        <h2>Edit Page</h2>
        <div className="overflow-menu-container">
          <button 
            className="btn btn-ghost btn-sm overflow-trigger" 
            onClick={() => setShowMenu(!showMenu)}
            data-testid="page-menu-btn"
          >
            ⋯
          </button>
          {showMenu && (
            <div className="overflow-menu">
              <button 
                onClick={handleDuplicate} 
                className="overflow-menu-item"
                data-testid="duplicate-page-btn"
              >
                <Icons.Copy /> Duplicate Page
              </button>
              <button 
                onClick={handleDelete} 
                className="overflow-menu-item danger"
                data-testid="delete-page-btn"
              >
                <Icons.Trash /> Delete Page
              </button>
            </div>
          )}
        </div>
      </div>

      {/* MAIN TEXT - Always visible */}
      <div className="editor-section main-text-section">
        <div className="form-group">
          <label className="form-label">Title</label>
          <input 
            type="text" 
            className="input" 
            value={localTitle} 
            onChange={(e) => handleTitleChange(e.target.value)} 
            placeholder="Page title" 
            data-testid="page-title-input" 
          />
        </div>
        <div className="form-group">
          <label className="form-label">Subtitle</label>
          <input type="text" className="input" value={page.subtitle || ""} onChange={(e) => onUpdate({ subtitle: e.target.value || null })} placeholder="Optional subtitle" data-testid="page-subtitle-input" />
        </div>
        <div className="form-group">
          <label className="form-label">Story Text</label>
          <textarea className="input body-textarea" value={page.content || ""} onChange={(e) => onUpdate({ content: e.target.value })} placeholder="The narrative shown to players..." data-testid="page-content-input" />
        </div>
        <div className="form-group">
          <label className="form-label">Story Text 2</label>
          <textarea className="input" value={page.body2 || ""} onChange={(e) => onUpdate({ body2: e.target.value || null })} placeholder="Optional secondary text" data-testid="page-body2-input" />
        </div>
      </div>

      {/* ACCORDION SECTIONS */}
      <div className="accordion-container">
        {/* On-Site Task / Instructions */}
        <AccordionSection
          title="On-Site Task / Instructions"
          icon={<Icons.FileText />}
          isOpen={openSections.task}
          onToggle={() => toggleSection('task')}
          hasContent={hasTask}
          onClear={() => onUpdate({ taskInstructions: null })}
        >
          <div className="form-group">
            <label className="form-label">Task Instructions</label>
            <textarea 
              className="input body-textarea" 
              value={page.taskInstructions || ""} 
              onChange={(e) => onUpdate({ taskInstructions: e.target.value || null })} 
              placeholder="e.g. 'Ask the server for the Blue Envelope'..." 
              data-testid="page-task-input" 
            />
            <p className="text-small">Instructions for physical tasks at this location</p>
          </div>
        </AccordionSection>

        {/* Media Type */}
        <AccordionSection
          title="Media"
          icon={<Icons.Video />}
          isOpen={openSections.media}
          onToggle={() => toggleSection('media')}
          hasContent={hasMedia}
          onClear={() => onUpdate({ mediaUrl: null, mediaType: null })}
        >
          <div className="form-group">
            <label className="form-label">Media Type</label>
            <div className="media-type-buttons">
              <button 
                type="button"
                className={`media-type-btn ${page.mediaType === 'image' ? 'active' : ''}`}
                onClick={() => onUpdate({ mediaType: 'image' })}
              >
                IMAGE
              </button>
              <button 
                type="button"
                className={`media-type-btn ${page.mediaType === 'video' ? 'active' : ''}`}
                onClick={() => onUpdate({ mediaType: 'video' })}
              >
                VIDEO
              </button>
              <button 
                type="button"
                className={`media-type-btn ${page.mediaType === 'youtube' ? 'active' : ''}`}
                onClick={() => onUpdate({ mediaType: 'youtube' })}
              >
                YOUTUBE
              </button>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Media URL</label>
            <input 
              type="url" 
              className="input" 
              value={page.mediaUrl || ""} 
              onChange={(e) => onUpdate({ mediaUrl: e.target.value || null })} 
              placeholder="https://..." 
              data-testid="page-media-url-input" 
            />
          </div>
        </AccordionSection>

        <AccordionSection
          title="Add Image / Gallery"
          icon={<Icons.Image />}
          isOpen={openSections.image}
          onToggle={() => toggleSection('image')}
          hasContent={hasImage}
          onClear={() => onUpdate({ imageUrl: null, imageAlt: null, galleryUrls: [] })}
        >
          <div className="form-group">
            <label className="form-label">Background Image (Optional)</label>
            <ClearableInput 
              type="url" 
              value={page.imageUrl} 
              onChange={(val) => onUpdate({ imageUrl: val })} 
              onClear={() => onUpdate({ imageUrl: null })}
              placeholder="Custom background URL for this page..." 
              data-testid="page-image-url-input" 
            />
          </div>
          <div className="form-group">
            <label className="form-label">Image Alt Text</label>
            <input type="text" className="input" value={page.imageAlt || ""} onChange={(e) => onUpdate({ imageAlt: e.target.value || null })} placeholder="Describe the image" data-testid="page-image-alt-input" />
          </div>
          <div className="form-group">
            <label className="form-label">Gallery Images</label>
            <GalleryUrlsEditor urls={page.galleryUrls} onChange={(urls) => onUpdate({ galleryUrls: urls })} />
          </div>
        </AccordionSection>

        <AccordionSection
          title="Add Embed (YouTube / Map)"
          icon={<Icons.Video />}
          isOpen={openSections.embed}
          onToggle={() => toggleSection('embed')}
          hasContent={hasEmbed}
          onClear={() => onUpdate({ embedUrl: null, embedCaption: null })}
        >
          <div className="form-group">
            <label className="form-label">Embed URL</label>
            <ClearableInput 
              type="url" 
              value={page.embedUrl} 
              onChange={(val) => onUpdate({ embedUrl: val })} 
              onClear={() => onUpdate({ embedUrl: null })}
              placeholder="YouTube, Vimeo, or Google Maps URL" 
              data-testid="page-embed-url-input" 
            />
            <p className="text-small">Allowed: YouTube, Vimeo, Google Maps</p>
          </div>
          <div className="form-group">
            <label className="form-label">Caption</label>
            <input type="text" className="input" value={page.embedCaption || ""} onChange={(e) => onUpdate({ embedCaption: e.target.value || null })} placeholder="Optional caption" data-testid="page-embed-caption-input" />
          </div>
        </AccordionSection>

        <AccordionSection
          title="Add Audio"
          icon={<Icons.Audio />}
          isOpen={openSections.audio}
          onToggle={() => toggleSection('audio')}
          hasContent={hasAudio}
          onClear={() => onUpdate({ audioUrl: null })}
        >
          <div className="form-group">
            <label className="form-label">Audio URL</label>
            <ClearableInput 
              type="url" 
              value={page.audioUrl} 
              onChange={(val) => onUpdate({ audioUrl: val })} 
              onClear={() => onUpdate({ audioUrl: null })}
              placeholder="https://example.com/audio.mp3" 
              data-testid="page-audio-url-input" 
            />
          </div>
          {page.audioUrl && (
            <div className="audio-preview">
              <audio controls src={page.audioUrl} />
            </div>
          )}
        </AccordionSection>

        <AccordionSection
          title="Broadcast"
          icon={<Icons.Broadcast />}
          isOpen={openSections.broadcast}
          onToggle={() => toggleSection('broadcast')}
          hasContent={hasBroadcast}
          onClear={() => onUpdate({ ctaLabel: null, ctaUrl: null })}
        >
          <div className="form-group">
            <label className="form-label">Button Label</label>
            <input type="text" className="input" value={page.ctaLabel || ""} onChange={(e) => onUpdate({ ctaLabel: e.target.value || null })} placeholder="Learn More" data-testid="page-cta-label-input" />
          </div>
          <div className="form-group">
            <label className="form-label">Button URL</label>
            <ClearableInput 
              type="url" 
              value={page.ctaUrl} 
              onChange={(val) => onUpdate({ ctaUrl: val })} 
              onClear={() => onUpdate({ ctaUrl: null })}
              placeholder="https://example.com" 
              data-testid="page-cta-url-input" 
            />
          </div>
        </AccordionSection>

        {/* Hint Section */}
        <AccordionSection
          title="Hint"
          icon={<Icons.HelpCircle />}
          isOpen={openSections.hint}
          onToggle={() => toggleSection('hint')}
          hasContent={hasHint}
        >
          <div className="form-group">
            <label className="form-label">Hint Text</label>
            <textarea 
              className="input body-textarea" 
              value={page.hintText || ""} 
              onChange={(e) => onUpdate({ hintText: e.target.value || null })} 
              placeholder="A helpful hint for players who get stuck..." 
              data-testid="page-hint-input" 
            />
          </div>
          <div className="form-group">
            <label className="toggle-label">
              <input 
                type="checkbox" 
                checked={page.autoShowHint || false} 
                onChange={(e) => onUpdate({ autoShowHint: e.target.checked })} 
                data-testid="page-auto-hint-toggle"
              />
              <span className="toggle-switch"></span>
              <span>Auto-Show Hints</span>
            </label>
            <p className="text-small">Automatically show hint when player arrives</p>
          </div>
        </AccordionSection>

        {/* Verification Section */}
        <AccordionSection
          title="Verification"
          icon={<Icons.Lock />}
          isOpen={openSections.unlock}
          onToggle={() => toggleSection('unlock')}
          hasContent={hasUnlock}
        >
          <p className="text-small helper-text">Overrides the stop setting for this page only</p>
          
          {/* Story Mode Toggle */}
          <div className="form-group">
            <label className="toggle-label">
              <input 
                type="checkbox" 
                checked={page.storyMode || false} 
                onChange={(e) => onUpdate({ storyMode: e.target.checked })} 
                data-testid="page-story-mode-toggle"
              />
              <span className="toggle-switch"></span>
              <span>Story Mode (No Verification)</span>
            </label>
            <p className="text-small">Skip verification - players just read and continue</p>
          </div>

          {!page.storyMode && (
            <>
              <div className="form-group">
                <label className="form-label">Verification Type</label>
                <div className="verification-type-buttons">
                  <button 
                    type="button"
                    className={`verification-type-btn ${!page.unlockMode || page.unlockMode === '' ? 'active' : ''}`}
                    onClick={() => onUpdate({ unlockMode: null })}
                  >
                    INHERIT
                  </button>
                  <button 
                    type="button"
                    className={`verification-type-btn ${page.unlockMode === 'text' ? 'active' : ''}`}
                    onClick={() => onUpdate({ unlockMode: 'text' })}
                  >
                    TEXT
                  </button>
                  <button 
                    type="button"
                    className={`verification-type-btn ${page.unlockMode === 'multiple_choice' ? 'active' : ''}`}
                    onClick={() => onUpdate({ unlockMode: 'multiple_choice' })}
                  >
                    MULTIPLE CHOICE
                  </button>
                  <button 
                    type="button"
                    className={`verification-type-btn ${page.unlockMode === 'whiteboard' ? 'active' : ''}`}
                    onClick={() => onUpdate({ unlockMode: 'whiteboard' })}
                  >
                    WHITEBOARD
                  </button>
                </div>
                {(!page.unlockMode || page.unlockMode === '') && (
                  <p className="text-small">Inheriting from stop: {getDisplayUnlockMode(stopUnlockMode)}</p>
                )}
              </div>

              {/* Text verification options */}
              {page.unlockMode === 'text' && (
                <>
                  <div className="form-group">
                    <label className="form-label">Password / Code</label>
                    <input 
                      type="text" 
                      className="input" 
                      value={page.answer || ""} 
                      onChange={(e) => onUpdate({ answer: e.target.value })} 
                      placeholder="Required answer" 
                      data-testid="page-answer-input" 
                    />
                  </div>
                  <div className="form-group">
                    <label className="toggle-label">
                      <input 
                        type="checkbox" 
                        checked={page.caseInsensitive !== false} 
                        onChange={(e) => onUpdate({ caseInsensitive: e.target.checked })} 
                        data-testid="page-case-insensitive-toggle"
                      />
                      <span className="toggle-switch"></span>
                      <span>Case-Insensitive</span>
                    </label>
                    <p className="text-small">"PARIS" matches "paris", "Paris", etc.</p>
                  </div>
                </>
              )}

              {/* Multiple choice options */}
              {page.unlockMode === 'multiple_choice' && (
                <div className="form-group">
                  <label className="form-label">Options</label>
                  <div className="mc-options-editor">
                    {(page.mcOptions || []).map((option, index) => (
                      <div key={index} className="mc-option-row">
                        <label className="mc-correct-radio">
                          <input 
                            type="radio" 
                            name="page-mc-correct" 
                            checked={page.mcCorrectIndex === index}
                            onChange={() => onUpdate({ mcCorrectIndex: index })}
                          />
                          <span className="radio-indicator"></span>
                        </label>
                        <input
                          type="text"
                          className="input"
                          value={option}
                          onChange={(e) => updateMcOption(index, e.target.value)}
                          placeholder={`Option ${index + 1}`}
                        />
                        <button type="button" onClick={() => removeMcOption(index)} className="btn btn-ghost btn-sm">
                          <Icons.Trash />
                        </button>
                      </div>
                    ))}
                    <button type="button" onClick={addMcOption} className="btn btn-secondary btn-sm">
                      <Icons.Plus /> Add Option
                    </button>
                  </div>
                  <p className="text-small">Select the radio button next to the correct answer</p>
                </div>
              )}

              {/* Whiteboard info */}
              {page.unlockMode === 'whiteboard' && (
                <p className="text-small helper-text">Players can type anything to proceed - no correct answer required</p>
              )}
            </>
          )}
        </AccordionSection>

        {/* Skin Override */}
        <AccordionSection
          title="Page Skin (Background)"
          icon={<Icons.Image />}
          isOpen={openSections.skin}
          onToggle={() => toggleSection('skin')}
          hasContent={!!page.skinImageUrl}
          onClear={() => onUpdate({ skinImageUrl: null })}
        >
          <div className="form-group">
            <label className="form-label">Skin Image URL</label>
            <p className="text-small helper-text">Overrides the tour's default skin for this page only</p>
            <ClearableInput
              type="text"
              className="input"
              value={page.skinImageUrl || ""}
              onChange={(e) => onUpdate({ skinImageUrl: e.target.value || null })}
              onClear={() => onUpdate({ skinImageUrl: null })}
              placeholder="https://example.com/page-background.jpg"
              data-testid="page-skin-url-input"
            />
            {page.skinImageUrl && (
              <div className="skin-preview" style={{ marginTop: '0.5rem' }}>
                <img 
                  src={page.skinImageUrl} 
                  alt="Skin preview" 
                  style={{ 
                    maxWidth: '100%', 
                    maxHeight: '100px', 
                    borderRadius: '8px',
                    objectFit: 'cover'
                  }} 
                />
              </div>
            )}
          </div>
        </AccordionSection>
      </div>

      <DeleteConfirmModal 
        isOpen={showDeleteModal} 
        onClose={() => setShowDeleteModal(false)} 
        onConfirm={confirmDelete}
        itemType="Page"
      />
    </div>
  );
};

// ==================== PLAYER ====================
const TourPlayer = () => {
  const { tourId } = useParams();
  const navigate = useNavigate();
  const [tour, setTour] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showWelcome, setShowWelcome] = useState(true);
  const [currentStopIndex, setCurrentStopIndex] = useState(0);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [unlockedPages, setUnlockedPages] = useState(new Set());
  const [showUnlock, setShowUnlock] = useState(false);
  const [unlockInput, setUnlockInput] = useState("");
  const [unlockError, setUnlockError] = useState("");
  const [selectedMcOption, setSelectedMcOption] = useState(null);
  const [showHintPage, setShowHintPage] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [tourComplete, setTourComplete] = useState(false);
  
  // GPS state for welcome screen
  const [gpsStatus, setGpsStatus] = useState('idle'); // 'idle', 'checking', 'allowed', 'denied', 'error', 'too_far'
  const [userLocation, setUserLocation] = useState(null);
  const [gpsDistance, setGpsDistance] = useState(null);
  const [gpsError, setGpsError] = useState(null);

  // Helper: Get background style with optional skin image
  // Page skin overrides tour skin; tour skin overrides background color
  const getBackgroundStyle = (pageSkin = null) => {
    const skinUrl = pageSkin || tour?.skinImageUrl;
    const bgColor = tour?.backgroundColor || undefined;
    
    if (skinUrl) {
      return {
        backgroundColor: bgColor,
        backgroundImage: `url(${skinUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      };
    }
    return { backgroundColor: bgColor };
  };

  // Calculate distance between two GPS points (Haversine formula)
  const calculateDistance = (lat1, lng1, lat2, lng2) => {
    const R = 6371000; // Earth radius in meters
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Check GPS location
  const checkGpsLocation = useCallback(() => {
    if (!tour?.welcomeGpsEnabled || !tour?.welcomeGpsLat || !tour?.welcomeGpsLng) {
      setGpsStatus('allowed');
      return;
    }

    if (!navigator.geolocation) {
      setGpsError("Your browser doesn't support location services");
      setGpsStatus('error');
      return;
    }

    setGpsStatus('checking');
    setGpsError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation({ lat: latitude, lng: longitude });
        
        const distance = calculateDistance(
          latitude, longitude,
          tour.welcomeGpsLat, tour.welcomeGpsLng
        );
        setGpsDistance(Math.round(distance));
        
        const radius = tour.welcomeGpsRadiusMeters || 100;
        if (distance <= radius) {
          setGpsStatus('allowed');
        } else {
          setGpsStatus('too_far');
        }
      },
      (error) => {
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setGpsError("Location access denied. Please enable location permissions in your browser settings.");
            setGpsStatus('denied');
            break;
          case error.POSITION_UNAVAILABLE:
            setGpsError("Location unavailable. Please check your GPS/location services.");
            setGpsStatus('error');
            break;
          case error.TIMEOUT:
            setGpsError("Location request timed out. Please try again.");
            setGpsStatus('error');
            break;
          default:
            setGpsError("Unable to get your location.");
            setGpsStatus('error');
        }
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  }, [tour]);

  useEffect(() => {
    const fetchTour = async () => {
      try {
        const res = await axios.get(`${API}/public/tours/${tourId}`);
        setTour(res.data);
        // Check if welcome screen should be shown
        const hasWelcome = res.data.welcomeTitle || res.data.welcomeBody;
        setShowWelcome(hasWelcome);
      } catch (err) {
        setError("Tour not found or not published");
      } finally {
        setLoading(false);
      }
    };
    fetchTour();
  }, [tourId]);

  const hasWelcomeScreen = tour?.welcomeTitle || tour?.welcomeBody;

  const startTour = () => {
    setShowWelcome(false);
    setCurrentStopIndex(0);
    setCurrentPageIndex(0);
  };

  const sortedStops = tour?.stops?.sort((a, b) => a.order - b.order) || [];
  const currentStop = sortedStops[currentStopIndex];
  const sortedPages = currentStop?.pages?.sort((a, b) => a.order - b.order) || [];
  // If no pages, treat the stop itself as a page
  const currentPage = sortedPages.length > 0 ? sortedPages[currentPageIndex] : currentStop;

  // Get effective unlock settings considering story mode
  const getEffectiveUnlock = (page, stop) => {
    // Story mode bypasses everything
    if (page?.storyMode || stop?.storyMode) return "continue";
    return page?.unlockMode ?? stop?.unlockMode ?? "continue";
  };

  // Normalize unlock mode for backwards compatibility
  const normalizeUnlockMode = (mode) => {
    if (!mode) return "continue";
    const modeMap = {
      "continue": "continue",
      "text": "text",
      "multiple_choice": "multiple_choice",
      "whiteboard": "whiteboard",
      // Legacy modes mapping
      "answer_required": "text",
      "password": "text",
      "none": "continue"
    };
    return modeMap[mode] || "continue";
  };

  const getUnlockData = (page, stop) => {
    const rawMode = getEffectiveUnlock(page, stop);
    const mode = normalizeUnlockMode(rawMode);
    if (mode === "continue") return null;
    
    // Use page data if page has override, otherwise use stop data
    const source = page?.unlockMode ? page : stop;
    
    // For multiple_choice, require options to be present
    if (mode === "multiple_choice" && (!source?.mcOptions || source.mcOptions.length === 0)) {
      return null; // Treat as "continue" if no options defined
    }
    
    // For text mode, require an answer to be present
    if (mode === "text" && !source?.answer) {
      return null; // Treat as "continue" if no answer defined
    }
    
    return {
      mode,
      answer: source?.answer,
      caseInsensitive: source?.caseInsensitive !== false,
      mcOptions: source?.mcOptions,
      mcCorrectIndex: source?.mcCorrectIndex,
      hintText: source?.hintText || page?.hintText,
      autoShowHint: source?.autoShowHint || page?.autoShowHint
    };
  };

  const pageKey = `${currentStop?.id}-${currentPage?.id}`;
  const isUnlocked = unlockedPages.has(pageKey);
  const unlockData = getUnlockData(currentPage, currentStop);
  const needsUnlock = unlockData && unlockData.mode !== "continue" && !isUnlocked;

  // Handle auto-show hints
  useEffect(() => {
    if (unlockData?.autoShowHint && unlockData?.hintText && needsUnlock) {
      setShowHintPage(true);
    }
  }, [pageKey]);

  useEffect(() => {
    // Reset selection when changing pages
    setSelectedMcOption(null);
    setUnlockInput("");
    setUnlockError("");
    
    // Handle unlock gates
    if (needsUnlock && !showUnlock) {
      setShowUnlock(true);
    } else if (!needsUnlock && showUnlock) {
      setShowUnlock(false);
    }
  }, [needsUnlock, currentStopIndex, currentPageIndex]);

  const handleUnlock = () => {
    if (!unlockData) return;
    
    let correct = false;
    
    if (unlockData.mode === "text") {
      const userAnswer = unlockData.caseInsensitive 
        ? unlockInput.toLowerCase().trim() 
        : unlockInput.trim();
      const correctAnswer = unlockData.caseInsensitive 
        ? (unlockData.answer || "").toLowerCase().trim()
        : (unlockData.answer || "").trim();
      correct = userAnswer === correctAnswer;
    } else if (unlockData.mode === "multiple_choice") {
      correct = selectedMcOption === unlockData.mcCorrectIndex;
    } else if (unlockData.mode === "whiteboard") {
      // Whiteboard mode - always allow (user just needs to type something)
      correct = unlockInput.trim().length > 0;
    }
    
    if (correct) {
      setUnlockedPages(prev => new Set([...prev, pageKey]));
      setShowUnlock(false);
      setUnlockInput("");
      setUnlockError("");
      setSelectedMcOption(null);
    } else {
      setUnlockError("Incorrect. Please try again.");
    }
  };

  const goNext = () => {
    if (currentPageIndex < sortedPages.length - 1) {
      setCurrentPageIndex(currentPageIndex + 1);
    } else if (currentStopIndex < sortedStops.length - 1) {
      setCurrentStopIndex(currentStopIndex + 1);
      setCurrentPageIndex(0);
    } else {
      // Tour complete!
      setTourComplete(true);
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 5000);
    }
  };

  const goPrev = () => {
    if (currentPageIndex > 0) {
      setCurrentPageIndex(currentPageIndex - 1);
    } else if (currentStopIndex > 0) {
      const prevStop = sortedStops[currentStopIndex - 1];
      const prevPages = prevStop?.pages?.sort((a, b) => a.order - b.order) || [];
      setCurrentStopIndex(currentStopIndex - 1);
      setCurrentPageIndex(Math.max(0, prevPages.length - 1));
    }
  };

  const isFirstPage = currentStopIndex === 0 && currentPageIndex === 0;
  const isLastPage = currentStopIndex === sortedStops.length - 1 && currentPageIndex === sortedPages.length - 1;
  
  // Calculate progress percentage
  const totalPages = sortedStops.reduce((sum, stop) => sum + (stop.pages?.length || 1), 0);
  const completedPages = sortedStops.slice(0, currentStopIndex).reduce((sum, stop) => sum + (stop.pages?.length || 1), 0) + currentPageIndex;
  const progressPercent = totalPages > 0 ? Math.round((completedPages / totalPages) * 100) : 0;

  if (loading) return <div className="player-loading">Loading tour...</div>;
  if (error) return <div className="player-error">{error}</div>;
  if (!tour || !currentStop || !currentPage) return <div className="player-error">No content available</div>;

  // Hint page view (full page with back button)
  if (showHintPage && unlockData?.hintText) {
    return (
      <div className="player-theme player-layout hint-page-layout" data-testid="player-hint-page" style={getBackgroundStyle(currentPage?.skinImageUrl)}>
        <div className="hint-page">
          <button 
            onClick={() => setShowHintPage(false)} 
            className="btn btn-back"
            data-testid="hint-back-btn"
          >
            <Icons.ChevronLeft /> Back to Challenge
          </button>
          <div className="hint-content">
            <h2>💡 Hint</h2>
            <div className="hint-text">
              {unlockData.hintText.split('\n').map((line, i) => (
                <p key={i}>{line}</p>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Embed safety check - only allow these domains
  const isAllowedEmbed = (url) => {
    if (!url) return false;
    try {
      const parsed = new URL(url);
      const host = parsed.hostname.toLowerCase();
      return (
        host.includes('youtube.com') ||
        host.includes('youtu.be') ||
        host.includes('youtube-nocookie.com') ||
        host.includes('vimeo.com') ||
        host.includes('google.com/maps') ||
        host.includes('maps.google.com')
      );
    } catch {
      return false;
    }
  };

  // Convert YouTube/Vimeo URLs to embed URLs
  const getEmbedUrl = (url) => {
    if (!url) return null;
    try {
      const parsed = new URL(url);
      const host = parsed.hostname.toLowerCase();
      
      // YouTube
      if (host.includes('youtube.com') || host.includes('youtu.be') || host.includes('youtube-nocookie.com')) {
        let videoId = null;
        if (host.includes('youtu.be')) {
          videoId = parsed.pathname.slice(1);
        } else {
          videoId = parsed.searchParams.get('v');
        }
        if (videoId) {
          return `https://www.youtube-nocookie.com/embed/${videoId}`;
        }
      }
      
      // Vimeo
      if (host.includes('vimeo.com')) {
        const match = parsed.pathname.match(/\/(\d+)/);
        if (match) {
          return `https://player.vimeo.com/video/${match[1]}`;
        }
      }
      
      // Google Maps - if already an embed URL, use as-is
      if (host.includes('google.com') && url.includes('/embed')) {
        return url;
      }
      
      return url;
    } catch {
      return url;
    }
  };

  // Render content helper
  const renderContent = (data, isStop = false) => {
    if (!data) return null;
    
    return (
      <>
        {/* Subtitle */}
        {data.subtitle && (
          <p className="player-subtitle">{data.subtitle}</p>
        )}
        
        {/* Task Instructions */}
        {data.taskInstructions && (
          <div className="player-task-instructions">
            <div className="task-label">📋 Your Task</div>
            <p>{data.taskInstructions}</p>
          </div>
        )}
        
        {/* Body/Intro */}
        {(data.content || data.description) && (
          <div className="player-body">
            {(data.content || data.description || '').split('\n').map((line, i) => (
              <p key={i}>{line}</p>
            ))}
          </div>
        )}
        
        {/* Body2/Intro2 */}
        {(data.body2 || data.intro2) && (
          <div className="player-body player-body-secondary">
            {(data.body2 || data.intro2).split('\n').map((line, i) => (
              <p key={i}>{line}</p>
            ))}
          </div>
        )}
        
        {/* Media (new media type selector) */}
        {data.mediaUrl && data.mediaType && (
          <div className="player-media">
            {data.mediaType === 'image' && (
              <img src={data.mediaUrl} alt="Media content" />
            )}
            {data.mediaType === 'video' && (
              <video controls src={data.mediaUrl}>
                Your browser does not support video.
              </video>
            )}
            {data.mediaType === 'youtube' && isAllowedEmbed(data.mediaUrl) && (
              <iframe
                src={getEmbedUrl(data.mediaUrl)}
                title="YouTube video"
                frameBorder="0"
                allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            )}
          </div>
        )}
        
        {/* Audio */}
        {data.audioUrl && data.audioUrl.trim() && (
          <div className="audio-player" data-testid={isStop ? "stop-audio-player" : "page-audio-player"}>
            <audio controls src={data.audioUrl}>
              Your browser does not support audio.
            </audio>
          </div>
        )}
        
        {/* Image */}
        {data.imageUrl && data.imageUrl.trim() && (
          <div className="player-image">
            <img src={data.imageUrl} alt={data.imageAlt || ''} />
          </div>
        )}
        
        {/* Gallery */}
        {data.galleryUrls && data.galleryUrls.length > 0 && (
          <div className="player-gallery">
            {data.galleryUrls.filter(url => url).map((url, i) => (
              <img key={i} src={url} alt={`Gallery image ${i + 1}`} />
            ))}
          </div>
        )}
        
        {/* Embed */}
        {data.embedUrl && (
          <div className="player-embed">
            {isAllowedEmbed(data.embedUrl) ? (
              <iframe
                src={getEmbedUrl(data.embedUrl)}
                title="Embedded content"
                frameBorder="0"
                allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <a href={data.embedUrl} target="_blank" rel="noopener noreferrer" className="btn btn-secondary">
                View External Content
              </a>
            )}
            {data.embedCaption && (
              <p className="embed-caption">{data.embedCaption}</p>
            )}
          </div>
        )}
        
        {/* CTA */}
        {data.ctaUrl && (
          <div className="player-cta">
            <a href={data.ctaUrl} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
              {data.ctaLabel || 'Learn More'}
            </a>
          </div>
        )}
      </>
    );
  };

  // Welcome Screen
  if (showWelcome && hasWelcomeScreen) {
    const gpsRequired = tour.welcomeGpsEnabled && tour.welcomeGpsLat && tour.welcomeGpsLng;
    const canStart = !gpsRequired || gpsStatus === 'allowed';
    
    return (
      <div className="player-theme player-layout welcome-layout" data-testid="player-welcome" style={getBackgroundStyle()}>
        <div className="welcome-screen">
          <div className="welcome-content">
            {/* Brand Logo */}
            <div className="welcome-brand-logo">
              <img 
                src="https://customer-assets.emergentagent.com/job_ba20b70d-7313-45de-8dec-281984409fc5/artifacts/s0alxsv9_color%20logo.png" 
                alt="Mystery Served" 
              />
            </div>
            
            {tour.welcomeImageUrl && (
              <div className="welcome-image">
                <img src={tour.welcomeImageUrl} alt={tour.welcomeTitle || 'Welcome'} />
              </div>
            )}
            <h1 className="welcome-title">{tour.welcomeTitle || tour.title}</h1>
            {tour.welcomeBody && (
              <div className="welcome-body" dangerouslySetInnerHTML={{ __html: tour.welcomeBody }} />
            )}
            {tour.welcomeAudioUrl && (
              <div className="audio-player welcome-audio">
                <audio controls src={tour.welcomeAudioUrl}>
                  Your browser does not support audio.
                </audio>
              </div>
            )}
            
            {/* GPS Location Check Section */}
            {gpsRequired && (
              <div className="gps-check-section" data-testid="gps-check-section">
                {gpsStatus === 'idle' && (
                  <div className="gps-prompt">
                    <div className="gps-icon-large">📍</div>
                    <p className="gps-message">This tour requires you to be at the starting location</p>
                    <p className="gps-sublabel">Within {tour.welcomeGpsRadiusMeters || 100}m of the start point</p>
                    <button 
                      onClick={checkGpsLocation} 
                      className="btn btn-secondary gps-check-btn"
                      data-testid="check-location-btn"
                    >
                      <Icons.Navigation /> Check My Location
                    </button>
                  </div>
                )}
                
                {gpsStatus === 'checking' && (
                  <div className="gps-checking">
                    <div className="gps-spinner"></div>
                    <p className="gps-message">Getting your location...</p>
                  </div>
                )}
                
                {gpsStatus === 'allowed' && (
                  <div className="gps-success">
                    <div className="gps-icon-large success">✓</div>
                    <p className="gps-message">You're at the right location!</p>
                    {gpsDistance !== null && (
                      <p className="gps-distance">You're {gpsDistance}m from the start point</p>
                    )}
                  </div>
                )}
                
                {gpsStatus === 'too_far' && (
                  <div className="gps-too-far">
                    <div className="gps-icon-large warning">⚠️</div>
                    <p className="gps-message">You're too far from the starting location</p>
                    {gpsDistance !== null && (
                      <p className="gps-distance">
                        You're {gpsDistance}m away (need to be within {tour.welcomeGpsRadiusMeters || 100}m)
                      </p>
                    )}
                    <button 
                      onClick={checkGpsLocation} 
                      className="btn btn-secondary gps-retry-btn"
                      data-testid="retry-location-btn"
                    >
                      <Icons.Navigation /> Check Again
                    </button>
                  </div>
                )}
                
                {(gpsStatus === 'denied' || gpsStatus === 'error') && (
                  <div className="gps-error">
                    <div className="gps-icon-large error">⚠️</div>
                    <p className="gps-message">{gpsError}</p>
                    <button 
                      onClick={checkGpsLocation} 
                      className="btn btn-secondary gps-retry-btn"
                      data-testid="retry-location-btn"
                    >
                      Try Again
                    </button>
                  </div>
                )}
              </div>
            )}
            
            <button 
              onClick={startTour} 
              className={`btn btn-primary btn-lg welcome-start-btn ${!canStart ? 'disabled' : ''}`}
              disabled={!canStart}
              data-testid="start-tour-btn"
            >
              {tour.welcomeButtonLabel || 'Start Tour'}
            </button>
            
            {!canStart && gpsStatus !== 'idle' && gpsStatus !== 'checking' && (
              <p className="gps-hint">Complete the location check above to start</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Unlock Gate (no transition)
  if (showUnlock && needsUnlock) {
    return (
      <div className="player-theme player-layout" data-testid="player-unlock-gate" style={{ backgroundColor: tour.backgroundColor || undefined }}>
        <div className="player-container">
          <div className="unlock-gate">
            <div className="unlock-card card">
              <div className="card-body">
                <Icons.Lock />
                <h2>This content is locked</h2>
                
                {/* Text verification */}
                {unlockData.mode === "text" && (
                  <>
                    <p className="unlock-prompt">Enter the password/code to continue</p>
                    <input
                      type="text"
                      className={`input ${unlockError ? "input-error" : ""}`}
                      value={unlockInput}
                      onChange={(e) => { setUnlockInput(e.target.value); setUnlockError(""); }}
                      placeholder="Your answer"
                      onKeyDown={(e) => e.key === "Enter" && handleUnlock()}
                      data-testid="unlock-input"
                    />
                    {unlockData.caseInsensitive && (
                      <p className="text-small case-note">Case doesn't matter</p>
                    )}
                  </>
                )}
                
                {/* Multiple choice verification */}
                {unlockData.mode === "multiple_choice" && unlockData.mcOptions && (
                  <>
                    <p className="unlock-prompt">Select the correct answer</p>
                    <div className="mc-options-player">
                      {unlockData.mcOptions.map((option, index) => (
                        <button
                          key={index}
                          type="button"
                          className={`mc-option-btn ${selectedMcOption === index ? 'selected' : ''}`}
                          onClick={() => { setSelectedMcOption(index); setUnlockError(""); }}
                          data-testid={`mc-option-${index}`}
                        >
                          <span className="mc-option-letter">{String.fromCharCode(65 + index)}</span>
                          <span className="mc-option-text">{option}</span>
                        </button>
                      ))}
                    </div>
                  </>
                )}
                
                {/* Whiteboard verification */}
                {unlockData.mode === "whiteboard" && (
                  <>
                    <p className="unlock-prompt">Write anything to continue</p>
                    <input
                      type="text"
                      className={`input ${unlockError ? "input-error" : ""}`}
                      value={unlockInput}
                      onChange={(e) => { setUnlockInput(e.target.value); setUnlockError(""); }}
                      placeholder="Type anything..."
                      onKeyDown={(e) => e.key === "Enter" && handleUnlock()}
                      data-testid="unlock-input"
                    />
                  </>
                )}
                
                {unlockError && <p className="error-message">{unlockError}</p>}
                
                <div className="unlock-actions">
                  <button onClick={handleUnlock} className="btn btn-primary" data-testid="unlock-submit">
                    Continue
                  </button>
                  
                  {/* Hint button */}
                  {unlockData.hintText && !unlockData.autoShowHint && (
                    <button 
                      onClick={() => setShowHintPage(true)} 
                      className="btn btn-hint"
                      data-testid="show-hint-btn"
                    >
                      💡 Need a hint?
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // No stops - show message
  if (!currentStop) {
    return (
      <div className="player-theme player-layout" data-testid="tour-player" style={{ backgroundColor: tour.backgroundColor || undefined }}>
        <header className="player-header">
          <h1>{tour.title}</h1>
        </header>
        <main className="player-main">
          <div className="player-content">
            <div className="no-content-message">
              <h2>🚧 Tour Under Construction</h2>
              <p>This tour doesn't have any stops yet. Check back soon!</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Normal Page View (with transitions)
  return (
    <div className="player-theme player-layout" data-testid="tour-player" style={{ backgroundColor: tour.backgroundColor || undefined }}>
      {/* Confetti Animation */}
      {showConfetti && (
        <div className="confetti-container">
          {[...Array(50)].map((_, i) => (
            <div 
              key={i} 
              className="confetti-piece"
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                backgroundColor: ['#ff6b6b', '#feca57', '#48dbfb', '#ff9ff3', '#54a0ff', '#5f27cd'][i % 6]
              }}
            />
          ))}
        </div>
      )}
      
      {/* Tour Complete Screen */}
      {tourComplete && (
        <div className="tour-complete-overlay">
          <div className="tour-complete-content">
            {tour.completionImageUrl ? (
              <div className="complete-image">
                <img src={tour.completionImageUrl} alt="Completion" />
              </div>
            ) : (
              <div className="complete-icon">🎉</div>
            )}
            <h2>{tour.completionTitle || "Tour Complete!"}</h2>
            <p>{tour.completionBody || `Congratulations! You've completed the ${tour.title} tour.`}</p>
            {tour.completionButtonUrl ? (
              <a 
                href={tour.completionButtonUrl}
                className="btn btn-primary"
                target="_blank"
                rel="noopener noreferrer"
              >
                {tour.completionButtonLabel || "Continue"}
              </a>
            ) : (
              <button 
                className="btn btn-primary"
                onClick={() => { setTourComplete(false); setShowWelcome(true); }}
              >
                {tour.completionButtonLabel || "Back to Start"}
              </button>
            )}
          </div>
        </div>
      )}
      
      <header className="player-header">
        {/* Progress Bar */}
        <div className="progress-bar-container">
          <div className="progress-bar" style={{ width: `${progressPercent}%` }} />
        </div>
        <h1>{tour.title}</h1>
        <p className="player-progress">
          Stop {currentStopIndex + 1} of {sortedStops.length} • Page {currentPageIndex + 1} of {sortedPages.length}
          <span className="progress-percent">{progressPercent}%</span>
        </p>
      </header>

      <main className="player-main">
        <div className="player-content" key={pageKey}>
              {/* Stop Title */}
              <div className="player-stop-title">{currentStop.title}</div>
              {currentStop.subtitle && (
                <p className="player-stop-subtitle">{currentStop.subtitle}</p>
              )}
              
              {/* Page Title */}
              <h2 className="player-page-title">{currentPage.title}</h2>
              
              {/* Page Content */}
              {renderContent(currentPage, false)}

              <div className="page-end-divider" />
            </div>
      </main>

      <footer className="player-footer">
        <button
          onClick={goPrev}
          disabled={isFirstPage}
          className="btn btn-secondary"
          data-testid="player-prev-btn"
        >
          <Icons.ChevronLeft /> Previous
        </button>
        <button
          onClick={goNext}
          disabled={isLastPage}
          className="btn btn-primary"
          data-testid="player-next-btn"
        >
          Next <Icons.ChevronRight />
        </button>
      </footer>
    </div>
  );
};

// ==================== PROTECTED ROUTE ====================
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/" />;
};

// ==================== APP ====================
function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<AuthPage />} />
          <Route path="/admin" element={<ProtectedRoute><ToursList /></ProtectedRoute>} />
          <Route path="/admin/tour/:tourId" element={<ProtectedRoute><TourEditor /></ProtectedRoute>} />
          <Route path="/play/:tourId" element={<TourPlayer />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
