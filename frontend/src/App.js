import React, { useState, useEffect, useRef, createContext, useContext, useCallback } from "react";
import "@/index.css";
import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { CSSTransition, TransitionGroup } from "react-transition-group";
import { QRCodeSVG } from "qrcode.react";

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
          <button onClick={createTour} className="btn btn-primary" data-testid="new-tour-btn">
            <Icons.Plus /> New Tour
          </button>
        </div>

        {tours.length === 0 ? (
          <div className="empty-state card">
            <div className="card-body">
              <p>No tours yet. Create your first tour!</p>
            </div>
          </div>
        ) : (
          <div className="tours-grid">
            {tours.map((tour) => (
              <div key={tour.id} className="tour-card card" data-testid={`tour-card-${tour.id}`}>
                <div className="card-body">
                  <div className="tour-card-header">
                    <h3>{tour.title}</h3>
                    <span className={`badge badge-${tour.status}`}>{tour.status}</span>
                  </div>
                  <p className="tour-card-desc">{tour.description || "No description"}</p>
                  <p className="tour-card-meta">{tour.stops?.length || 0} stops</p>
                  <div className="tour-card-actions">
                    <button onClick={() => navigate(`/admin/tour/${tour.id}`)} className="btn btn-secondary btn-sm" data-testid={`edit-tour-${tour.id}`}>
                      <Icons.Edit /> Edit
                    </button>
                    <button onClick={() => duplicateTour(tour.id)} className="btn btn-ghost btn-sm" data-testid={`duplicate-tour-${tour.id}`}>
                      <Icons.Copy />
                    </button>
                    <button onClick={() => deleteTour(tour.id)} className="btn btn-ghost btn-sm text-danger" data-testid={`delete-tour-${tour.id}`}>
                      <Icons.Trash />
                    </button>
                    {tour.status === "published" && (
                      <button onClick={() => window.open(`/play/${tour.id}`, '_blank')} className="btn btn-ghost btn-sm" data-testid={`preview-tour-${tour.id}`}>
                        <Icons.Play /> Preview
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
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

  const saveTour = async (updates) => {
    setSaving(true);
    try {
      const res = await api.put(`/tours/${tourId}`, updates);
      setTour(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field, value) => {
    const updated = { ...tour, [field]: value };
    setTour(updated);
    saveTour({ [field]: value });
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
    const updated = [...(tour.stops || []), newStop];
    setTour({ ...tour, stops: updated });
    saveTour({ stops: updated });
    setActiveStopId(newStop.id);
    setActivePageId(null);
  };

  const updateStop = (stopId, updates) => {
    const updated = tour.stops.map(s => s.id === stopId ? { ...s, ...updates } : s);
    setTour({ ...tour, stops: updated });
    saveTour({ stops: updated });
  };

  const deleteStop = (stopId) => {
    if (!window.confirm("Delete this stop and all its pages?")) return;
    const updated = tour.stops.filter(s => s.id !== stopId).map((s, i) => ({ ...s, order: i }));
    setTour({ ...tour, stops: updated });
    saveTour({ stops: updated });
    if (activeStopId === stopId) {
      setActiveStopId(updated[0]?.id || null);
      setActivePageId(null);
    }
  };

  const addPage = (stopId) => {
    const stop = tour.stops.find(s => s.id === stopId);
    const newPage = {
      id: crypto.randomUUID(),
      title: `Page ${(stop.pages?.length || 0) + 1}`,
      content: "",
      unlockMode: null,
      audioUrl: "",
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
    if (!window.confirm("Delete this page?")) return;
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
      setTour({ ...tour, stops: updated });
      saveTour({ stops: updated });
    } else if (type === "pages") {
      const stop = tour.stops.find(s => s.id === activeStopId);
      const items = Array.from(stop.pages);
      const [reordered] = items.splice(result.source.index, 1);
      items.splice(result.destination.index, 0, reordered);
      const updated = items.map((p, i) => ({ ...p, order: i }));
      updateStop(activeStopId, { pages: updated });
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
          <button 
            onClick={() => saveTour({})} 
            className="btn btn-save-draft" 
            data-testid="save-draft-btn"
          >
            Save Draft
          </button>
          <select
            className="input status-select"
            value={tour.status}
            onChange={(e) => updateField("status", e.target.value)}
            data-testid="tour-status-select"
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
        </div>
      </header>

      <div className="editor-body">
        {/* Stops Panel */}
        <aside className="editor-sidebar stops-panel">
          <div className="panel-header">
            <h3>Stops</h3>
            <button onClick={addStop} className="btn btn-primary btn-sm" data-testid="add-stop-btn">
              <Icons.Plus />
            </button>
          </div>
          {/* Welcome Screen Item */}
          <div className="stops-list-container">
            <div
              className={`stop-item welcome-item ${showWelcome ? "active" : ""}`}
              onClick={() => { setShowWelcome(true); setActiveStopId(null); setActivePageId(null); }}
              data-testid="welcome-item"
            >
              <span className="welcome-icon">👋</span>
              <span className="stop-title">Welcome Screen</span>
              {(tour.welcomeTitle || tour.welcomeBody) && <span className="content-dot" />}
            </div>
          </div>
          <DragDropContext onDragEnd={(r) => onDragEnd(r, "stops")}>
            <Droppable droppableId="stops">
              {(provided) => (
                <div className="stops-list" {...provided.droppableProps} ref={provided.innerRef}>
                  {tour.stops?.sort((a, b) => a.order - b.order).map((stop, index) => (
                    <Draggable key={stop.id} draggableId={stop.id} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className={`stop-item ${activeStopId === stop.id && !showWelcome ? "active" : ""} ${snapshot.isDragging ? "dragging" : ""}`}
                          onClick={() => { setActiveStopId(stop.id); setActivePageId(null); setShowWelcome(false); }}
                          data-testid={`stop-item-${stop.id}`}
                        >
                          <span {...provided.dragHandleProps} className="drag-handle"><Icons.Grip /></span>
                          <span className="stop-title">{stop.title || "Untitled Stop"}</span>
                          <span className="stop-page-count">{stop.pages?.length || 0}</span>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
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
  const playerUrl = `${window.location.origin}/play/${tourId}`;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(playerUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
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
            disabled={tourStatus !== 'published'}
          >
            <Icons.Eye /> Preview as Player
          </button>
        </div>

        {/* Status Info */}
        {tourStatus !== 'published' && (
          <div className="share-warning">
            <p>⚠️ Tour must be published for players to access</p>
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
const WelcomeEditor = ({ tour, onUpdate }) => {
  return (
    <div className="content-editor" data-testid="welcome-editor">
      <div className="editor-section main-text-section">
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
          <input 
            type="url" 
            className="input" 
            value={tour.welcomeImageUrl || ""} 
            onChange={(e) => onUpdate("welcomeImageUrl", e.target.value || null)} 
            placeholder="https://example.com/welcome-image.jpg" 
            data-testid="welcome-image-input" 
          />
        </div>
        {tour.welcomeImageUrl && (
          <div className="image-preview">
            <img src={tour.welcomeImageUrl} alt="Welcome preview" />
          </div>
        )}
        <div className="form-group">
          <label className="form-label">Audio URL (optional)</label>
          <input 
            type="url" 
            className="input" 
            value={tour.welcomeAudioUrl || ""} 
            onChange={(e) => onUpdate("welcomeAudioUrl", e.target.value || null)} 
            placeholder="https://example.com/welcome-audio.mp3" 
            data-testid="welcome-audio-input" 
          />
        </div>
        {tour.welcomeAudioUrl && (
          <div className="audio-preview">
            <audio controls src={tour.welcomeAudioUrl} />
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
        <h3 className="section-label">GPS Start Location</h3>
        <p className="text-small helper-text">Used to start the tour at the correct location</p>
        
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
              <label className="form-label">Radius (meters)</label>
              <input 
                type="number" 
                className="input" 
                value={tour.welcomeGpsRadiusMeters ?? 100} 
                onChange={(e) => onUpdate("welcomeGpsRadiusMeters", e.target.value ? parseInt(e.target.value) : 100)} 
                placeholder="100" 
                data-testid="welcome-gps-radius"
              />
              <p className="text-small">How close visitors need to be to the start location</p>
            </div>
          </div>
        )}
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
const AccordionSection = ({ title, icon, isOpen, onToggle, hasContent, children }) => (
  <div className={`accordion-section ${isOpen ? 'open' : ''} ${hasContent ? 'has-content' : ''}`}>
    <button type="button" className="accordion-trigger" onClick={onToggle}>
      <span className="accordion-icon">{icon}</span>
      <span className="accordion-title">{title}</span>
      <span className="accordion-indicator">{hasContent && <span className="content-dot" />}{isOpen ? '−' : '+'}</span>
    </button>
    {isOpen && <div className="accordion-content">{children}</div>}
  </div>
);

// ==================== STOP EDITOR ====================
const StopEditor = ({ stop, onUpdate, onDelete, onAddPage, onSelectPage, onDeletePage, onReorderPages }) => {
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
            <input 
              type="url" 
              className="input" 
              value={stop.mediaUrl || ""} 
              onChange={(e) => onUpdate({ mediaUrl: e.target.value || null })} 
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
            <input type="url" className="input" value={stop.imageUrl || ""} onChange={(e) => onUpdate({ imageUrl: e.target.value || null })} placeholder="Custom background URL for this stop..." data-testid="stop-image-url-input" />
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
        >
          <div className="form-group">
            <label className="form-label">Embed URL</label>
            <input type="url" className="input" value={stop.embedUrl || ""} onChange={(e) => onUpdate({ embedUrl: e.target.value || null })} placeholder="YouTube, Vimeo, or Google Maps URL" data-testid="stop-embed-url-input" />
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
        >
          <div className="form-group">
            <label className="form-label">Audio URL</label>
            <input type="url" className="input" value={stop.audioUrl || ""} onChange={(e) => onUpdate({ audioUrl: e.target.value || null })} placeholder="https://example.com/audio.mp3" data-testid="stop-audio-url-input" />
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

const PageEditor = ({ page, stopUnlockMode, stopAnswer, onUpdate, onDelete, onBack }) => {
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
        >
          <div className="form-group">
            <label className="form-label">Background Image (Optional)</label>
            <input type="url" className="input" value={page.imageUrl || ""} onChange={(e) => onUpdate({ imageUrl: e.target.value || null })} placeholder="Custom background URL for this stop..." data-testid="page-image-url-input" />
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
        >
          <div className="form-group">
            <label className="form-label">Embed URL</label>
            <input type="url" className="input" value={page.embedUrl || ""} onChange={(e) => onUpdate({ embedUrl: e.target.value || null })} placeholder="YouTube, Vimeo, or Google Maps URL" data-testid="page-embed-url-input" />
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
        >
          <div className="form-group">
            <label className="form-label">Audio URL</label>
            <input type="url" className="input" value={page.audioUrl || ""} onChange={(e) => onUpdate({ audioUrl: e.target.value || null })} placeholder="https://example.com/audio.mp3" data-testid="page-audio-url-input" />
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
        >
          <div className="form-group">
            <label className="form-label">Button Label</label>
            <input type="text" className="input" value={page.ctaLabel || ""} onChange={(e) => onUpdate({ ctaLabel: e.target.value || null })} placeholder="Learn More" data-testid="page-cta-label-input" />
          </div>
          <div className="form-group">
            <label className="form-label">Button URL</label>
            <input type="url" className="input" value={page.ctaUrl || ""} onChange={(e) => onUpdate({ ctaUrl: e.target.value || null })} placeholder="https://example.com" data-testid="page-cta-url-input" />
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
  const currentPage = sortedPages[currentPageIndex];

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

  if (loading) return <div className="player-loading">Loading tour...</div>;
  if (error) return <div className="player-error">{error}</div>;
  if (!tour || !currentStop || !currentPage) return <div className="player-error">No content available</div>;

  // Hint page view (full page with back button)
  if (showHintPage && unlockData?.hintText) {
    return (
      <div className="player-layout hint-page-layout" data-testid="player-hint-page">
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
        {data.audioUrl && (
          <div className="audio-player" data-testid={isStop ? "stop-audio-player" : "page-audio-player"}>
            <audio controls src={data.audioUrl}>
              Your browser does not support audio.
            </audio>
          </div>
        )}
        
        {/* Image */}
        {data.imageUrl && (
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
    return (
      <div className="player-layout welcome-layout" data-testid="player-welcome">
        <div className="welcome-screen">
          <div className="welcome-content">
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
            {/* GPS Location Info (display only, no blocking) */}
            {tour.welcomeGpsEnabled && tour.welcomeGpsLat && tour.welcomeGpsLng && (
              <div className="welcome-gps-info" data-testid="welcome-gps-info">
                <div className="gps-icon">📍</div>
                <div className="gps-details">
                  <p className="gps-label">Tour Start Location</p>
                  <p className="gps-coords">{tour.welcomeGpsLat.toFixed(4)}, {tour.welcomeGpsLng.toFixed(4)}</p>
                  {tour.welcomeGpsRadiusMeters && (
                    <p className="gps-radius">Within {tour.welcomeGpsRadiusMeters}m</p>
                  )}
                </div>
              </div>
            )}
            <button onClick={startTour} className="btn btn-primary btn-lg welcome-start-btn" data-testid="start-tour-btn">
              {tour.welcomeButtonLabel || 'Start Tour'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Unlock Gate (no transition)
  if (showUnlock && needsUnlock) {
    return (
      <div className="player-layout" data-testid="player-unlock-gate">
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

  // Normal Page View (with transitions)
  return (
    <div className="player-layout" data-testid="tour-player">
      <header className="player-header">
        <h1>{tour.title}</h1>
        <p className="player-progress">
          Stop {currentStopIndex + 1} of {sortedStops.length} • Page {currentPageIndex + 1} of {sortedPages.length}
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
