import React, { useState, useEffect, useCallback } from "react";
import "@/index.css";
import "@/App.css";
import "leaflet/dist/leaflet.css";
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import axios from "axios";
import L from "leaflet";
import Icons from "./components/Icons";
import { useAuth, authAxios, AuthProvider } from "./components/authContext";
import TourEditor from "./components/editor/TourEditor";
import PlayerLayout from "./components/PlayerLayout";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Remove "Made with Emergent" badge
(function removeBadge() {
  const kill = () => {
    document.querySelectorAll('#emergent-badge, [id*="emergent-badge"]').forEach(el => el.remove());
  };
  kill();
  document.addEventListener('DOMContentLoaded', kill);
  window.addEventListener('load', kill);
  setInterval(kill, 300);
  if (typeof MutationObserver !== 'undefined') {
    new MutationObserver(kill).observe(document.documentElement, { childList: true, subtree: true });
  }
})();

// Fix Leaflet default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

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

  useEffect(() => { document.title = "Dashboard"; }, []);

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
    const playerUrl = `${baseUrl}/api/share/${tourId}`;
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
                    <span className="stat">📍 {tour.stopCount ?? tour.stops?.length ?? 0} stops</span>
                    <span className="stat">📄 {tour.pageCount ?? 0} pages</span>
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
              return (
                <div 
                  key={tour.id} 
                  className="tour-list-item" 
                  data-testid={`tour-card-${tour.id}`}
                >
                  <span className={`list-status-dot status-${tour.status}`} />
                  <span className="list-title">{tour.title || "Untitled"}</span>
                  <span className="list-meta">{tour.stopCount ?? tour.stops?.length ?? 0} stops • {tour.pageCount ?? 0} pages</span>
                  <div className="list-features">
                    {tour.welcomeTitle && <span className="feature-tag">Welcome</span>}
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
          <Route path="/play/:tourId" element={<PlayerLayout Icons={Icons} />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
