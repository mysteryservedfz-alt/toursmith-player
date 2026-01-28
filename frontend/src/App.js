import { useState, useEffect, useCallback } from "react";
import "@/App.css";
import axios from "axios";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Trash2, Copy, GripVertical, Plus, ArrowLeft, LogOut } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Auth context
const useAuth = () => {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [email, setEmail] = useState(localStorage.getItem("email"));

  const login = (newToken, newEmail) => {
    localStorage.setItem("token", newToken);
    localStorage.setItem("email", newEmail);
    setToken(newToken);
    setEmail(newEmail);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("email");
    setToken(null);
    setEmail(null);
  };

  return { token, email, login, logout, isAuthenticated: !!token };
};

// API helper with auth
const createApi = (token) => {
  const instance = axios.create({
    baseURL: API,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  return instance;
};

// Login Page
const LoginPage = ({ onLogin }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSetup, setIsSetup] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (isSetup) {
        await axios.post(`${API}/auth/setup`, { email, password });
        setIsSetup(false);
        setError("");
      }
      const res = await axios.post(`${API}/auth/login`, { email, password });
      onLogin(res.data.token, res.data.email);
    } catch (err) {
      const msg = err.response?.data?.detail || "Login failed";
      if (msg === "Admin already exists") {
        setIsSetup(false);
        setError("Admin exists. Please login.");
      } else if (msg === "Invalid credentials" && !isSetup) {
        setError("Invalid credentials");
      } else {
        setError(msg);
      }
    }
    setLoading(false);
  };

  return (
    <div className="login-container" data-testid="login-page">
      <Card className="login-card">
        <CardHeader>
          <CardTitle data-testid="login-title">Toursmith Admin</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                data-testid="email-input"
                required
              />
            </div>
            <div className="form-group">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                data-testid="password-input"
                required
              />
            </div>
            {error && <p className="error-text" data-testid="error-message">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading} data-testid="login-button">
              {loading ? "..." : isSetup ? "Create Admin & Login" : "Login"}
            </Button>
            <Button
              type="button"
              variant="link"
              className="w-full mt-2"
              onClick={() => setIsSetup(!isSetup)}
              data-testid="toggle-setup"
            >
              {isSetup ? "Back to Login" : "First time? Setup Admin"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

// Tours List
const ToursList = ({ token, onSelectTour }) => {
  const [tours, setTours] = useState([]);
  const [loading, setLoading] = useState(true);
  const api = createApi(token);

  const loadTours = useCallback(async () => {
    try {
      const res = await api.get("/tours");
      setTours(res.data);
    } catch (err) {
      console.error("Failed to load tours", err);
    }
    setLoading(false);
  }, [api]);

  useEffect(() => {
    loadTours();
  }, []);

  const createTour = async () => {
    try {
      const res = await api.post("/tours", { name: "New Tour" });
      setTours([...tours, res.data]);
      onSelectTour(res.data.id);
    } catch (err) {
      console.error("Failed to create tour", err);
    }
  };

  const deleteTour = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm("Delete this tour and all its stops?")) return;
    try {
      await api.delete(`/tours/${id}`);
      setTours(tours.filter((t) => t.id !== id));
    } catch (err) {
      console.error("Failed to delete tour", err);
    }
  };

  const duplicateTour = async (id, e) => {
    e.stopPropagation();
    try {
      const res = await api.post(`/tours/${id}/duplicate`);
      setTours([...tours, res.data]);
    } catch (err) {
      console.error("Failed to duplicate tour", err);
    }
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="tours-list" data-testid="tours-list">
      <div className="tours-header">
        <h2>Tours</h2>
        <Button onClick={createTour} data-testid="create-tour-btn">
          <Plus size={16} /> New Tour
        </Button>
      </div>
      <div className="tours-grid">
        {tours.map((tour) => (
          <Card
            key={tour.id}
            className="tour-card"
            onClick={() => onSelectTour(tour.id)}
            data-testid={`tour-card-${tour.id}`}
          >
            <CardContent className="tour-card-content">
              <div className="tour-info">
                <h3 data-testid={`tour-name-${tour.id}`}>{tour.name || "Untitled"}</h3>
                <p>{tour.city || "No city"} • {tour.difficulty}</p>
              </div>
              <div className="tour-actions">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => duplicateTour(tour.id, e)}
                  data-testid={`duplicate-tour-${tour.id}`}
                >
                  <Copy size={16} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => deleteTour(tour.id, e)}
                  data-testid={`delete-tour-${tour.id}`}
                >
                  <Trash2 size={16} />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {tours.length === 0 && (
          <p className="empty-text">No tours yet. Create one to get started!</p>
        )}
      </div>
    </div>
  );
};

// Tour Editor with Stops
const TourEditor = ({ token, tourId, onBack }) => {
  const [tour, setTour] = useState(null);
  const [stops, setStops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [draggedStop, setDraggedStop] = useState(null);
  const api = createApi(token);

  const loadTour = useCallback(async () => {
    try {
      const [tourRes, stopsRes] = await Promise.all([
        api.get(`/tours/${tourId}`),
        api.get(`/tours/${tourId}/stops`),
      ]);
      setTour(tourRes.data);
      setStops(stopsRes.data);
    } catch (err) {
      console.error("Failed to load tour", err);
    }
    setLoading(false);
  }, [api, tourId]);

  useEffect(() => {
    loadTour();
  }, [tourId]);

  // Autosave tour field
  const saveTourField = async (field, value) => {
    try {
      const res = await api.patch(`/tours/${tourId}`, { [field]: value });
      setTour(res.data);
    } catch (err) {
      console.error("Failed to save tour", err);
    }
  };

  // Autosave stop field
  const saveStopField = async (stopId, field, value) => {
    try {
      await api.patch(`/stops/${stopId}`, { [field]: value });
    } catch (err) {
      console.error("Failed to save stop", err);
    }
  };

  const addStop = async () => {
    try {
      const res = await api.post(`/tours/${tourId}/stops`, { tour_id: tourId });
      setStops([...stops, res.data]);
    } catch (err) {
      console.error("Failed to add stop", err);
    }
  };

  const deleteStop = async (stopId) => {
    if (!window.confirm("Delete this stop?")) return;
    try {
      await api.delete(`/stops/${stopId}`);
      setStops(stops.filter((s) => s.id !== stopId));
    } catch (err) {
      console.error("Failed to delete stop", err);
    }
  };

  // Drag and drop handlers
  const handleDragStart = (e, stop) => {
    setDraggedStop(stop);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e, targetStop) => {
    e.preventDefault();
    if (!draggedStop || draggedStop.id === targetStop.id) return;
    
    const newStops = [...stops];
    const draggedIndex = newStops.findIndex((s) => s.id === draggedStop.id);
    const targetIndex = newStops.findIndex((s) => s.id === targetStop.id);
    
    newStops.splice(draggedIndex, 1);
    newStops.splice(targetIndex, 0, draggedStop);
    setStops(newStops);
  };

  const handleDragEnd = async () => {
    if (!draggedStop) return;
    setDraggedStop(null);
    
    // Save new order
    try {
      await api.post(`/tours/${tourId}/stops/reorder`, {
        stop_ids: stops.map((s) => s.id),
      });
    } catch (err) {
      console.error("Failed to reorder stops", err);
    }
  };

  const updateLocalStop = (stopId, field, value) => {
    setStops(stops.map((s) => (s.id === stopId ? { ...s, [field]: value } : s)));
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (!tour) return <div className="loading">Tour not found</div>;

  return (
    <div className="tour-editor" data-testid="tour-editor">
      <div className="editor-header">
        <Button variant="ghost" onClick={onBack} data-testid="back-btn">
          <ArrowLeft size={16} /> Back
        </Button>
        <span className="autosave-indicator">Autosave enabled</span>
      </div>

      <Card className="tour-details">
        <CardHeader>
          <CardTitle>Tour Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="form-grid">
            <div className="form-group">
              <Label>Name</Label>
              <Input
                value={tour.name}
                onChange={(e) => setTour({ ...tour, name: e.target.value })}
                onBlur={(e) => saveTourField("name", e.target.value)}
                data-testid="tour-name-input"
              />
            </div>
            <div className="form-group">
              <Label>City</Label>
              <Input
                value={tour.city}
                onChange={(e) => setTour({ ...tour, city: e.target.value })}
                onBlur={(e) => saveTourField("city", e.target.value)}
                data-testid="tour-city-input"
              />
            </div>
            <div className="form-group">
              <Label>Difficulty</Label>
              <Select
                value={tour.difficulty}
                onValueChange={(value) => {
                  setTour({ ...tour, difficulty: value });
                  saveTourField("difficulty", value);
                }}
              >
                <SelectTrigger data-testid="tour-difficulty-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">Easy</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="hard">Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="form-group">
            <Label>Intro Story</Label>
            <Textarea
              value={tour.intro_story}
              onChange={(e) => setTour({ ...tour, intro_story: e.target.value })}
              onBlur={(e) => saveTourField("intro_story", e.target.value)}
              rows={4}
              data-testid="tour-intro-input"
            />
          </div>
        </CardContent>
      </Card>

      <div className="stops-section">
        <div className="stops-header">
          <h3>Stops ({stops.length})</h3>
          <Button onClick={addStop} data-testid="add-stop-btn">
            <Plus size={16} /> Add Stop
          </Button>
        </div>

        <div className="stops-list">
          {stops.map((stop, index) => (
            <Card
              key={stop.id}
              className={`stop-card ${draggedStop?.id === stop.id ? "dragging" : ""}`}
              draggable
              onDragStart={(e) => handleDragStart(e, stop)}
              onDragOver={(e) => handleDragOver(e, stop)}
              onDragEnd={handleDragEnd}
              data-testid={`stop-card-${stop.id}`}
            >
              <CardContent className="stop-content">
                <div className="stop-drag-handle">
                  <GripVertical size={20} />
                  <span className="stop-number">{index + 1}</span>
                </div>
                <div className="stop-fields">
                  <div className="form-group">
                    <Label>Title</Label>
                    <Input
                      value={stop.title}
                      onChange={(e) => updateLocalStop(stop.id, "title", e.target.value)}
                      onBlur={(e) => saveStopField(stop.id, "title", e.target.value)}
                      data-testid={`stop-title-${stop.id}`}
                    />
                  </div>
                  <div className="form-group">
                    <Label>Guest Instructions</Label>
                    <Textarea
                      value={stop.guest_instructions}
                      onChange={(e) => updateLocalStop(stop.id, "guest_instructions", e.target.value)}
                      onBlur={(e) => saveStopField(stop.id, "guest_instructions", e.target.value)}
                      rows={2}
                      data-testid={`stop-instructions-${stop.id}`}
                    />
                  </div>
                  <div className="form-group">
                    <Label>Puzzle Text</Label>
                    <Textarea
                      value={stop.puzzle_text}
                      onChange={(e) => updateLocalStop(stop.id, "puzzle_text", e.target.value)}
                      onBlur={(e) => saveStopField(stop.id, "puzzle_text", e.target.value)}
                      rows={2}
                      data-testid={`stop-puzzle-${stop.id}`}
                    />
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <Label>Answer Code</Label>
                      <Input
                        value={stop.answer_code}
                        onChange={(e) => updateLocalStop(stop.id, "answer_code", e.target.value)}
                        onBlur={(e) => saveStopField(stop.id, "answer_code", e.target.value)}
                        data-testid={`stop-answer-${stop.id}`}
                      />
                    </div>
                    <div className="form-group">
                      <Label>Hints</Label>
                      <Input
                        value={stop.hints}
                        onChange={(e) => updateLocalStop(stop.id, "hints", e.target.value)}
                        onBlur={(e) => saveStopField(stop.id, "hints", e.target.value)}
                        data-testid={`stop-hints-${stop.id}`}
                      />
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="delete-stop-btn"
                  onClick={() => deleteStop(stop.id)}
                  data-testid={`delete-stop-${stop.id}`}
                >
                  <Trash2 size={16} />
                </Button>
              </CardContent>
            </Card>
          ))}
          {stops.length === 0 && (
            <p className="empty-text">No stops yet. Add one to get started!</p>
          )}
        </div>
      </div>
    </div>
  );
};

// Main App
function App() {
  const { token, email, login, logout, isAuthenticated } = useAuth();
  const [selectedTourId, setSelectedTourId] = useState(null);

  if (!isAuthenticated) {
    return <LoginPage onLogin={login} />;
  }

  return (
    <div className="app" data-testid="app">
      <header className="app-header">
        <h1>Toursmith Admin</h1>
        <div className="header-right">
          <span>{email}</span>
          <Button variant="ghost" onClick={logout} data-testid="logout-btn">
            <LogOut size={16} /> Logout
          </Button>
        </div>
      </header>
      <main className="app-main">
        {selectedTourId ? (
          <TourEditor
            token={token}
            tourId={selectedTourId}
            onBack={() => setSelectedTourId(null)}
          />
        ) : (
          <ToursList token={token} onSelectTour={setSelectedTourId} />
        )}
      </main>
    </div>
  );
}

export default App;
