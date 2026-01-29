import React, { useState, useEffect, createContext, useContext, useCallback } from "react";
import "@/index.css";
import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { CSSTransition, TransitionGroup } from "react-transition-group";

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
  const { token, logout } = useAuth();
  const navigate = useNavigate();
  const api = authAxios(token);

  useEffect(() => {
    const fetchTour = async () => {
      try {
        const res = await api.get(`/tours/${tourId}`);
        setTour(res.data);
        if (res.data.stops?.length > 0) {
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
                          className={`stop-item ${activeStopId === stop.id ? "active" : ""} ${snapshot.isDragging ? "dragging" : ""}`}
                          onClick={() => { setActiveStopId(stop.id); setActivePageId(null); }}
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

        {/* Pages Panel */}
        {activeStop && (
          <aside className="editor-sidebar pages-panel">
            <div className="panel-header">
              <h3>Pages</h3>
              <button onClick={() => addPage(activeStopId)} className="btn btn-primary btn-sm" data-testid="add-page-btn">
                <Icons.Plus />
              </button>
            </div>
            <DragDropContext onDragEnd={(r) => onDragEnd(r, "pages")}>
              <Droppable droppableId="pages">
                {(provided) => (
                  <div className="pages-list" {...provided.droppableProps} ref={provided.innerRef}>
                    {activeStop.pages?.sort((a, b) => a.order - b.order).map((page, index) => (
                      <Draggable key={page.id} draggableId={page.id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className={`page-item ${activePageId === page.id ? "active" : ""} ${snapshot.isDragging ? "dragging" : ""}`}
                            onClick={() => setActivePageId(page.id)}
                            data-testid={`page-item-${page.id}`}
                          >
                            <span {...provided.dragHandleProps} className="drag-handle"><Icons.Grip /></span>
                            <span className="page-title">{page.title || "Untitled Page"}</span>
                            {page.audioUrl && <Icons.Audio />}
                            {page.unlockMode && page.unlockMode !== "continue" && <Icons.Lock />}
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
        )}

        {/* Editor Main */}
        <main className="editor-main">
          {!activeStop ? (
            <div className="editor-empty">
              <p>Add a stop to get started</p>
            </div>
          ) : !activePageId ? (
            <StopEditor stop={activeStop} onUpdate={(u) => updateStop(activeStopId, u)} onDelete={() => deleteStop(activeStopId)} />
          ) : (
            <PageEditor page={activePage} stopUnlockMode={activeStop.unlockMode} stopAnswer={activeStop.answer} onUpdate={(u) => updatePage(activeStopId, activePageId, u)} onDelete={() => deletePage(activeStopId, activePageId)} />
          )}
        </main>
      </div>
    </div>
  );
};

const StopEditor = ({ stop, onUpdate, onDelete }) => (
  <div className="content-editor" data-testid="stop-editor">
    <div className="editor-section">
      <h2>Edit Stop</h2>
      <div className="form-group">
        <label className="form-label">Title</label>
        <input type="text" className="input" value={stop.title} onChange={(e) => onUpdate({ title: e.target.value })} placeholder="Stop title" data-testid="stop-title-input" />
      </div>
      <div className="form-group">
        <label className="form-label">Description</label>
        <textarea className="input" value={stop.description} onChange={(e) => onUpdate({ description: e.target.value })} placeholder="Stop description" data-testid="stop-description-input" />
      </div>
    </div>

    <div className="divider" />

    <div className="editor-section">
      <h3>Unlock Settings</h3>
      <p className="text-small helper-text">Applies to all pages in this stop unless a page overrides it.</p>
      <div className="form-group">
        <label className="form-label">Stop Unlock Mode</label>
        <select className="input" value={stop.unlockMode || "continue"} onChange={(e) => onUpdate({ unlockMode: e.target.value })} data-testid="stop-unlock-mode">
          <option value="continue">Continue</option>
          <option value="answer_required">Answer Required</option>
          <option value="whiteboard">Whiteboard</option>
        </select>
      </div>
      {stop.unlockMode === "answer_required" && (
        <div className="form-group">
          <label className="form-label">Stop Answer</label>
          <input type="text" className="input" value={stop.answer || ""} onChange={(e) => onUpdate({ answer: e.target.value })} placeholder="Enter the answer visitors must provide" data-testid="stop-answer-input" />
        </div>
      )}
    </div>

    <div className="divider" />

    <div className="editor-actions">
      <button onClick={onDelete} className="btn btn-danger" data-testid="delete-stop-btn">
        <Icons.Trash /> Delete Stop
      </button>
    </div>
  </div>
);

const PageEditor = ({ page, stopUnlockMode, stopAnswer, onUpdate, onDelete }) => {
  const getDisplayUnlockMode = (mode) => {
    switch(mode) {
      case "continue": return "Continue";
      case "answer_required": return "Answer Required";
      case "whiteboard": return "Whiteboard";
      default: return mode;
    }
  };

  return (
    <div className="content-editor" data-testid="page-editor">
      <div className="editor-section">
        <h2>Edit Page</h2>
        <div className="form-group">
          <label className="form-label">Title</label>
          <input type="text" className="input" value={page.title} onChange={(e) => onUpdate({ title: e.target.value })} placeholder="Page title" data-testid="page-title-input" />
        </div>
        <div className="form-group">
          <label className="form-label">Content</label>
          <textarea className="input content-textarea" value={page.content} onChange={(e) => onUpdate({ content: e.target.value })} placeholder="Page content (supports basic text)" data-testid="page-content-input" />
        </div>
      </div>

      <div className="divider" />

      <div className="editor-section">
        <h3>Audio (Optional)</h3>
        <div className="form-group">
          <label className="form-label">Audio URL</label>
          <input type="url" className="input" value={page.audioUrl || ""} onChange={(e) => onUpdate({ audioUrl: e.target.value })} placeholder="https://example.com/audio.mp3" data-testid="page-audio-url-input" />
          <p className="text-small">Leave empty for no audio</p>
        </div>
        {page.audioUrl && (
          <div className="audio-preview">
            <audio controls src={page.audioUrl} />
          </div>
        )}
      </div>

      <div className="divider" />

      <div className="editor-section">
        <h3>Unlock Settings</h3>
        <p className="text-small helper-text">Overrides the stop unlock for this page only.</p>
        <div className="form-group">
          <label className="form-label">Page Unlock Mode</label>
          <select className="input" value={page.unlockMode || ""} onChange={(e) => onUpdate({ unlockMode: e.target.value || null })} data-testid="page-unlock-mode">
            <option value="">Inherit from stop ({getDisplayUnlockMode(stopUnlockMode)})</option>
            <option value="continue">Continue</option>
            <option value="answer_required">Answer Required</option>
            <option value="whiteboard">Whiteboard</option>
          </select>
        </div>
        {page.unlockMode === "answer_required" && (
          <div className="form-group">
            <label className="form-label">Page Answer</label>
            <input type="text" className="input" value={page.answer || ""} onChange={(e) => onUpdate({ answer: e.target.value })} placeholder="Enter the answer visitors must provide" data-testid="page-answer-input" />
          </div>
        )}
      </div>

      <div className="divider" />

      <div className="editor-actions">
        <button onClick={onDelete} className="btn btn-danger" data-testid="delete-page-btn">
          <Icons.Trash /> Delete Page
        </button>
      </div>
    </div>
  );
};

// ==================== PLAYER ====================
const TourPlayer = () => {
  const { tourId } = useParams();
  const [tour, setTour] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentStopIndex, setCurrentStopIndex] = useState(0);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [unlockedPages, setUnlockedPages] = useState(new Set());
  const [showUnlock, setShowUnlock] = useState(false);
  const [unlockInput, setUnlockInput] = useState("");
  const [unlockError, setUnlockError] = useState("");
  const [transitionEnabled, setTransitionEnabled] = useState(true);

  useEffect(() => {
    const fetchTour = async () => {
      try {
        const res = await axios.get(`${API}/public/tours/${tourId}`);
        setTour(res.data);
      } catch (err) {
        setError("Tour not found or not published");
      } finally {
        setLoading(false);
      }
    };
    fetchTour();
  }, [tourId]);

  const sortedStops = tour?.stops?.sort((a, b) => a.order - b.order) || [];
  const currentStop = sortedStops[currentStopIndex];
  const sortedPages = currentStop?.pages?.sort((a, b) => a.order - b.order) || [];
  const currentPage = sortedPages[currentPageIndex];

  const getEffectiveUnlock = (page, stop) => {
    return page?.unlockMode ?? stop?.unlockMode ?? "continue";
  };

  const getUnlockData = (page, stop) => {
    const mode = getEffectiveUnlock(page, stop);
    if (mode === "continue") return null;
    
    // If page has override, use page data
    if (page?.unlockMode) {
      return {
        mode,
        answer: page.answer
      };
    }
    // Otherwise use stop data
    return {
      mode,
      answer: stop?.answer
    };
  };

  const pageKey = `${currentStop?.id}-${currentPage?.id}`;
  const isUnlocked = unlockedPages.has(pageKey);
  const unlockData = getUnlockData(currentPage, currentStop);
  const needsUnlock = unlockData && unlockData.mode !== "continue" && !isUnlocked;

  useEffect(() => {
    // Disable transitions for unlock gates
    if (needsUnlock && !showUnlock) {
      setShowUnlock(true);
      setTransitionEnabled(false);
    } else if (!needsUnlock && showUnlock) {
      setShowUnlock(false);
    }
  }, [needsUnlock, currentStopIndex, currentPageIndex]);

  const handleUnlock = () => {
    if (!unlockData) return;
    
    const inputLower = unlockInput.toLowerCase().trim();
    let correct = false;
    
    if (unlockData.mode === "answer_required") {
      correct = inputLower === (unlockData.answer || "").toLowerCase().trim();
    } else if (unlockData.mode === "whiteboard") {
      // Whiteboard mode - always allow (user just needs to interact)
      correct = unlockInput.trim().length > 0;
    }
    
    if (correct) {
      setUnlockedPages(prev => new Set([...prev, pageKey]));
      setShowUnlock(false);
      setUnlockInput("");
      setUnlockError("");
      setTransitionEnabled(true);
    } else {
      setUnlockError("Incorrect. Please try again.");
    }
  };

  const goNext = () => {
    if (currentPageIndex < sortedPages.length - 1) {
      setTransitionEnabled(true);
      setCurrentPageIndex(currentPageIndex + 1);
    } else if (currentStopIndex < sortedStops.length - 1) {
      setTransitionEnabled(true);
      setCurrentStopIndex(currentStopIndex + 1);
      setCurrentPageIndex(0);
    }
  };

  const goPrev = () => {
    if (currentPageIndex > 0) {
      setTransitionEnabled(true);
      setCurrentPageIndex(currentPageIndex - 1);
    } else if (currentStopIndex > 0) {
      setTransitionEnabled(true);
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
                {unlockData.mode === "answer_required" && (
                  <p className="unlock-prompt">Enter the answer to continue</p>
                )}
                {unlockData.mode === "whiteboard" && (
                  <p className="unlock-prompt">Write anything to continue</p>
                )}
                <input
                  type="text"
                  className={`input ${unlockError ? "input-error" : ""}`}
                  value={unlockInput}
                  onChange={(e) => { setUnlockInput(e.target.value); setUnlockError(""); }}
                  placeholder={unlockData.mode === "whiteboard" ? "Type anything..." : "Your answer"}
                  onKeyDown={(e) => e.key === "Enter" && handleUnlock()}
                  data-testid="unlock-input"
                />
                {unlockError && <p className="error-message">{unlockError}</p>}
                <button onClick={handleUnlock} className="btn btn-primary" data-testid="unlock-submit">
                  Continue
                </button>
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
        <TransitionGroup component={null}>
          <CSSTransition
            key={pageKey}
            timeout={transitionEnabled ? 250 : 0}
            classNames={transitionEnabled ? "page" : ""}
          >
            <div className="player-content">
              <div className="player-stop-title">{currentStop.title}</div>
              <h2 className="player-page-title">{currentPage.title}</h2>
              <div className="player-page-content">
                {currentPage.content.split('\n').map((line, i) => (
                  <p key={i}>{line}</p>
                ))}
              </div>
              
              {currentPage.audioUrl && (
                <div className="audio-player" data-testid="page-audio-player">
                  <audio controls src={currentPage.audioUrl}>
                    Your browser does not support audio.
                  </audio>
                </div>
              )}

              <div className="page-end-divider" />
            </div>
          </CSSTransition>
        </TransitionGroup>
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
