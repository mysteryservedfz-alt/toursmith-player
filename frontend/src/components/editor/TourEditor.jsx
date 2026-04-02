import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import Icons from '../Icons';
import { useAuth, authAxios } from '../authContext';
import WelcomeEditor from './WelcomeEditor';
import StopEditor from './StopEditor';
import PageEditor from './PageEditor';
import ShareAssetsPanel from './ShareAssetsPanel';

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

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        if (hasUnsavedChanges && !saving) {
          saveTour();
        }
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
        e.preventDefault();
        addStop();
      }
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
              setSaving(true);
              try {
                await saveTour(updatedTour);
                await new Promise(resolve => setTimeout(resolve, 300));
              } finally {
                setSaving(false);
              }
            }}
            className={`btn ${tour.status === "published" ? 'btn-unpublish' : 'btn-publish'}`}
            disabled={saving}
            data-testid="publish-btn"
          >
            {saving ? 'Saving...' : (tour.status === "published" ? 'Unpublish' : 'Publish')}
          </button>
        </div>
      </header>

      <div className="editor-body">
        <aside className="editor-sidebar stops-panel">
          <div className="panel-header">
            <h3>Tour Structure</h3>
            <div className="panel-header-actions">
              <button onClick={addStop} className="btn btn-primary btn-sm" data-testid="add-stop-btn" title="Add Stop">
                <Icons.Plus /> Stop
              </button>
              <button 
                onClick={() => activeStopId && addPage(activeStopId)} 
                className="btn btn-secondary btn-sm" 
                data-testid="add-page-sidebar-btn" 
                title={activeStopId ? "Add Page to selected stop" : "Select a stop first"}
                disabled={!activeStopId}
              >
                <Icons.Plus /> Page
              </button>
            </div>
          </div>
          
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
                            <div
                              className={`tree-item stop-item ${activeStopId === stop.id && !activePageId && !showWelcome ? "active" : ""}`}
                              onClick={() => { setActiveStopId(stop.id); setActivePageId(null); setShowWelcome(false); }}
                              data-testid={`stop-item-${stop.id}`}
                            >
                              <span {...provided.dragHandleProps} className="drag-handle"><Icons.Grip /></span>
                              <span className="tree-icon">📍</span>
                              <span className="tree-label">{stop.title || "Untitled Stop"}</span>
                            </div>
                            
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
                                    {page.unlockMode === 'photo' && <Icons.Camera />}
                                    {page.unlockMode === 'ranking' && <Icons.Grip />}
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

        <ShareAssetsPanel tourId={tourId} tourStatus={tour.status} />
      </div>
    </div>
  );
};

export default TourEditor;
