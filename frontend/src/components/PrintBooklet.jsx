import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth, authAxios } from './authContext';

const genId = () => Math.random().toString(36).slice(2, 9);

const buildCardsFromTour = (tour) => {
  const cards = [];
  const stops = [...(tour.stops || [])].sort((a, b) => a.order - b.order);

  // Cover card
  cards.push({
    id: genId(),
    type: 'cover',
    title: tour.welcomeTitle || tour.title || '',
    body: tour.welcomeBody || tour.description || '',
  });

  // Stop cards — one per stop, combine page content
  stops.forEach((stop, idx) => {
    const pages = [...(stop.pages || [])].sort((a, b) => a.order - b.order);
    const visible = pages.filter(p => p.content || p.clueText);
    let body = '';
    let clue = '';

    for (const p of visible) {
      if (p.title && visible.length > 1) body += p.title.toUpperCase() + '\n';
      if (p.content) body += p.content + '\n\n';
      if (p.clueText && !clue) clue = p.clueText;
    }

    cards.push({
      id: genId(),
      type: 'stop',
      label: `STOP ${idx + 1}`,
      title: stop.title || `Stop ${idx + 1}`,
      body: body.trim(),
      clue: clue,
      showClue: !!clue,
      showScratch: !!clue,
    });
  });

  // Completion
  if (tour.completionTitle || tour.completionBody) {
    cards.push({
      id: genId(),
      type: 'completion',
      title: tour.completionTitle || 'Tour Complete!',
      body: tour.completionBody || '',
    });
  }

  return cards;
};

const PrintBooklet = () => {
  const { tourId } = useParams();
  const { token, logout } = useAuth();
  const navigate = useNavigate();
  const api = authAxios(token);
  const [tour, setTour] = useState(null);
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTour = async () => {
      try {
        const res = await api.get(`/tours/${tourId}`);
        setTour(res.data);
        setCards(buildCardsFromTour(res.data));
      } catch (err) {
        if (err.response?.status === 401) logout();
        else navigate('/admin');
      } finally {
        setLoading(false);
      }
    };
    fetchTour();
  }, [tourId]);

  const updateCard = (id, field, value) => {
    setCards(prev => prev.map(c => c.id === id ? { ...c, [field]: value } : c));
  };

  const removeCard = (id) => {
    setCards(prev => prev.filter(c => c.id !== id));
  };

  const addBlankCard = () => {
    setCards(prev => [...prev, {
      id: genId(), type: 'stop', label: 'NEW', title: '', body: '', clue: '', showClue: false, showScratch: false,
    }]);
  };

  if (loading) return <div className="loading-screen">Loading...</div>;
  if (!tour) return <div className="loading-screen">Tour not found</div>;

  const sheets = [];
  for (let i = 0; i < cards.length; i += 2) sheets.push(cards.slice(i, i + 2));

  return (
    <div className="pb-wrapper" data-testid="print-booklet-wrapper">
      <div className="pb-toolbar">
        <button onClick={() => navigate(`/admin/tour/${tourId}`)} className="pb-toolbar-btn" data-testid="print-back-btn">← Back</button>
        <div className="pb-toolbar-center">
          <h2>{tour.title} — Card Editor</h2>
          <span>{cards.length} cards / {sheets.length} sheet{sheets.length !== 1 ? 's' : ''}</span>
        </div>
        <div className="pb-toolbar-right">
          <button onClick={addBlankCard} className="pb-toolbar-btn">+ Add Card</button>
          <button onClick={() => window.print()} className="pb-toolbar-print" data-testid="print-btn">Print / Save PDF</button>
        </div>
      </div>

      <div className="pb-preview" data-testid="print-booklet">
        {sheets.map((sheet, si) => (
          <div key={si} className="pb-sheet">
            {sheet.map((card) => (
              <div key={card.id} className="pb-card">
                <div className="pb-inner">
                  {/* Delete card button - hidden in print */}
                  <button className="pb-delete-card no-print" onClick={() => removeCard(card.id)} title="Remove card">&times;</button>

                  {card.type === 'cover' || card.type === 'completion' ? (
                    <>
                      {tour.logoUrl && <div className="pb-logo no-print-hide"><img src={tour.logoUrl} alt="" /></div>}
                      <div className="pb-center-content">
                        <input
                          className="pb-edit-title-center"
                          value={card.title}
                          onChange={(e) => updateCard(card.id, 'title', e.target.value)}
                          placeholder="Title"
                        />
                        <div className="pb-rule" />
                        <textarea
                          className="pb-edit-body-center"
                          value={card.body}
                          onChange={(e) => updateCard(card.id, 'body', e.target.value)}
                          placeholder="Content..."
                          rows={Math.max(3, (card.body.match(/\n/g) || []).length + 2)}
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="pb-banner">
                        <input
                          className="pb-edit-label"
                          value={card.label}
                          onChange={(e) => updateCard(card.id, 'label', e.target.value)}
                        />
                        <input
                          className="pb-edit-banner-title"
                          value={card.title}
                          onChange={(e) => updateCard(card.id, 'title', e.target.value)}
                          placeholder="Stop Title"
                        />
                      </div>
                      <div className="pb-body">
                        <textarea
                          className="pb-edit-body"
                          value={card.body}
                          onChange={(e) => updateCard(card.id, 'body', e.target.value)}
                          placeholder="Card content..."
                          rows={Math.max(4, (card.body.match(/\n/g) || []).length + 2)}
                        />
                      </div>
                      {card.showClue && (
                        <div className="pb-clue-box">
                          <div className="pb-clue-label">CLUE</div>
                          <textarea
                            className="pb-edit-clue"
                            value={card.clue}
                            onChange={(e) => updateCard(card.id, 'clue', e.target.value)}
                            placeholder="Clue text..."
                            rows={2}
                          />
                          <button className="pb-toggle-x no-print" onClick={() => updateCard(card.id, 'showClue', false)}>&times;</button>
                        </div>
                      )}
                      {!card.showClue && (
                        <button className="pb-add-section no-print" onClick={() => updateCard(card.id, 'showClue', true)}>+ Clue</button>
                      )}
                      {card.showScratch && (
                        <div className="pb-scratch">
                          <div className="pb-scratch-bar">SCRATCH OFF</div>
                          <div className="pb-scratch-space" />
                          <button className="pb-toggle-x no-print" onClick={() => updateCard(card.id, 'showScratch', false)}>&times;</button>
                        </div>
                      )}
                      {!card.showScratch && (
                        <button className="pb-add-section no-print" onClick={() => updateCard(card.id, 'showScratch', true)}>+ Scratch Off</button>
                      )}
                    </>
                  )}
                  <div className="pb-card-foot">{tour.title}</div>
                </div>
              </div>
            ))}
            {sheet.length === 1 && <div className="pb-card"><div className="pb-inner pb-empty" /></div>}
          </div>
        ))}
      </div>
    </div>
  );
};

export default PrintBooklet;
