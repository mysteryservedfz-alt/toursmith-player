import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Icons from './Icons';
import { useAuth, authAxios } from './authContext';

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

  const exportTour = async (id, e) => {
    e.stopPropagation();
    try {
      const res = await api.get(`/tours/${id}/export`);
      const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const safeTitle = (res.data.title || 'tour').replace(/[^a-z0-9]+/gi, '_').toLowerCase();
      a.download = `${safeTitle}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert('Export failed');
    }
  };

  const importInputRef = React.useRef(null);

  const handleImportFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const json = JSON.parse(text);
      const res = await api.post('/tours/import', json);
      e.target.value = '';
      fetchTours();
      navigate(`/admin/tour/${res.data.id}`);
    } catch (err) {
      console.error(err);
      alert('Import failed: ' + (err.response?.data?.detail || err.message));
      e.target.value = '';
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
            <button
              onClick={() => importInputRef.current?.click()}
              className="btn btn-secondary"
              title="Import a tour from a JSON file (move tours between preview and live)"
              data-testid="import-tour-btn"
            >
              Import JSON
            </button>
            <input
              ref={importInputRef}
              type="file"
              accept="application/json,.json"
              onChange={handleImportFile}
              style={{ display: 'none' }}
              data-testid="import-tour-input"
            />
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
                        <span style={{whiteSpace: 'nowrap'}}>{copiedTourId === tour.id ? 'Copied!' : 'Copy\u00A0Link'}</span>
                      </button>
                    </div>
                    <div className="card-actions" onClick={(e) => e.stopPropagation()}>
                      <button onClick={(e) => exportTour(tour.id, e)} className="btn-icon" title="Export JSON" data-testid={`export-tour-${tour.id}`}>
                        <Icons.Download />
                      </button>
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
                    <button onClick={(e) => exportTour(tour.id, e)} className="btn-icon" title="Export JSON">
                      <Icons.Download />
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

export default ToursList;
