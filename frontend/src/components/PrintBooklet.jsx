import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth, authAxios } from './authContext';

const CoverCard = ({ tour, stopCount }) => (
  <div className="print-card-inner print-card-cover">
    <div className="cover-top">
      <div className="cover-title-block">
        <div className="cover-label">TOUR BOOKLET</div>
        <h1 className="cover-title">{tour.title || 'Untitled Tour'}</h1>
        {tour.description && <p className="cover-description">{tour.description}</p>}
      </div>
      {tour.welcomeBody && (
        <div className="cover-welcome">
          <p>{tour.welcomeBody}</p>
        </div>
      )}
    </div>
    <div className="cover-bottom">
      <div className="cover-stats">
        <span>{stopCount} stop{stopCount !== 1 ? 's' : ''}</span>
      </div>
      <div className="cover-instructions">
        <div className="instructions-title">HOW TO USE THIS BOOKLET</div>
        <ul className="instructions-list">
          <li>Follow each stop in order</li>
          <li>Read the story, then find the clue</li>
          <li>Where you see a scratch-off circle, peel the sticker to reveal the answer</li>
          <li>Use the app to verify your answer and unlock the next stop</li>
        </ul>
      </div>
    </div>
  </div>
);

const StopCard = ({ card }) => {
  const gatedPages = card.pages.filter(p =>
    p.unlockMode === 'text' || p.unlockMode === 'multiple_choice'
  );
  const hasGate = gatedPages.length > 0 || card.unlockMode === 'text';

  return (
    <div className="print-card-inner print-card-stop">
      <div className="stop-header">
        <span className="stop-number">STOP {card.number}</span>
        <div className="stop-header-line" />
      </div>
      <h2 className="stop-title">{card.title || 'Untitled Stop'}</h2>
      {card.subtitle && <p className="stop-subtitle">{card.subtitle}</p>}

      <div className="stop-content">
        {card.pages.map((page, i) => (
          <div key={i} className="stop-page-content">
            {card.pages.length > 1 && page.title && (
              <div className="page-title-inline">{page.title}</div>
            )}
            {page.content && (
              <p className="page-text">{page.content}</p>
            )}
            {page.clueText && (
              <div className="clue-box">
                <div className="clue-label">CLUE</div>
                <p className="clue-text">{page.clueText}</p>
              </div>
            )}
            {page.hintText && (
              <div className="hint-line">
                <span className="hint-label">Hint:</span> {page.hintText}
              </div>
            )}
          </div>
        ))}
      </div>

      {hasGate && (
        <div className="scratch-off-area">
          <div className="scratch-off-circle">
            <span className="scratch-off-text">SCRATCH<br/>OFF</span>
          </div>
        </div>
      )}
    </div>
  );
};

const CompletionCard = ({ tour }) => (
  <div className="print-card-inner print-card-completion">
    <div className="completion-content">
      <div className="completion-badge">TOUR COMPLETE</div>
      <h2 className="completion-title">{tour.completionTitle || 'Congratulations!'}</h2>
      {tour.completionBody && <p className="completion-body">{tour.completionBody}</p>}
      <div className="completion-divider" />
      <p className="completion-thanks">Thank you for playing</p>
      <p className="completion-tour-name">{tour.title}</p>
    </div>
  </div>
);

const PrintBooklet = () => {
  const { tourId } = useParams();
  const { token, logout } = useAuth();
  const navigate = useNavigate();
  const api = authAxios(token);
  const [tour, setTour] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTour = async () => {
      try {
        const res = await api.get(`/tours/${tourId}`);
        setTour(res.data);
      } catch (err) {
        if (err.response?.status === 401) logout();
        else navigate('/admin');
      } finally {
        setLoading(false);
      }
    };
    fetchTour();
  }, [tourId]);

  if (loading) return <div className="loading-screen">Loading...</div>;
  if (!tour) return <div className="loading-screen">Tour not found</div>;

  // Build cards array
  const cards = [];

  // Cover card
  const sortedStops = [...(tour.stops || [])].sort((a, b) => a.order - b.order);
  cards.push({ type: 'cover' });

  // Stop cards
  sortedStops.forEach((stop, index) => {
    const pages = [...(stop.pages || [])].sort((a, b) => a.order - b.order);
    cards.push({
      type: 'stop',
      number: index + 1,
      title: stop.title,
      subtitle: stop.subtitle || stop.description,
      unlockMode: stop.unlockMode,
      pages: pages.map(p => ({
        title: p.title,
        content: p.content,
        clueText: p.clueText,
        hintText: p.hintText,
        unlockMode: p.unlockMode,
      })),
    });
  });

  // Completion card
  if (tour.completionTitle || tour.completionBody) {
    cards.push({ type: 'completion' });
  }

  // Group into pairs (2 per printed sheet)
  const sheets = [];
  for (let i = 0; i < cards.length; i += 2) {
    sheets.push(cards.slice(i, i + 2));
  }

  return (
    <div className="print-booklet-wrapper" data-testid="print-booklet-wrapper">
      <div className="print-controls">
        <button onClick={() => navigate(`/admin/tour/${tourId}`)} className="print-back-btn" data-testid="print-back-btn">
          ← Back to Editor
        </button>
        <div className="print-controls-center">
          <h2>{tour.title}</h2>
          <span className="print-page-count">{cards.length} cards / {sheets.length} sheet{sheets.length !== 1 ? 's' : ''}</span>
        </div>
        <button onClick={() => window.print()} className="print-btn" data-testid="print-btn">
          Print Booklet
        </button>
      </div>

      <div className="print-booklet" data-testid="print-booklet">
        {sheets.map((sheet, si) => (
          <div key={si} className="print-sheet">
            {sheet.map((card, ci) => (
              <div key={ci} className="print-card">
                {card.type === 'cover' && <CoverCard tour={tour} stopCount={sortedStops.length} />}
                {card.type === 'stop' && <StopCard card={card} />}
                {card.type === 'completion' && <CompletionCard tour={tour} />}
              </div>
            ))}
            {sheet.length === 1 && (
              <div className="print-card print-card-blank">
                <div className="print-card-inner" />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default PrintBooklet;
