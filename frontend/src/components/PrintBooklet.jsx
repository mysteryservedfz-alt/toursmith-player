import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth, authAxios } from './authContext';

const CoverCard = ({ tour }) => (
  <div className="print-card-inner print-card-cover">
    {tour.logoUrl && (
      <div className="card-logo">
        <img src={tour.logoUrl} alt="Logo" />
      </div>
    )}
    <div className="cover-body">
      <h1 className="cover-title">{tour.welcomeTitle || tour.title || 'Untitled Tour'}</h1>
      {tour.welcomeBody && <p className="cover-message">{tour.welcomeBody}</p>}
      {!tour.welcomeBody && tour.description && <p className="cover-message">{tour.description}</p>}
    </div>
  </div>
);

const StopCard = ({ card, logoUrl }) => {
  const hasAnswer = card.pages.some(p =>
    (p.unlockMode === 'text' || p.unlockMode === 'multiple_choice') && (p.clueText || p.content)
  );

  return (
    <div className="print-card-inner print-card-stop">
      <div className="stop-header">
        <span className="stop-number">STOP {card.number}</span>
        <div className="stop-header-line" />
        {logoUrl && <img src={logoUrl} alt="" className="card-logo-small" />}
      </div>
      <h2 className="stop-title">{card.title || `Stop ${card.number}`}</h2>

      <div className="stop-content">
        {card.pages.map((page, i) => (
          <div key={i} className="stop-page-content">
            {card.pages.length > 1 && page.title && (
              <div className="page-title-inline">{page.title}</div>
            )}
            {page.content && (
              <p className="page-text">{page.content}</p>
            )}
            {page.mediaUrl && (
              <div className="page-image">
                <img src={page.mediaUrl} alt="" />
              </div>
            )}
            {page.clueText && (
              <div className="clue-box">
                <div className="clue-label">CLUE</div>
                <p className="clue-text">{page.clueText}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {hasAnswer && (
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
    {tour.logoUrl && (
      <div className="card-logo">
        <img src={tour.logoUrl} alt="Logo" />
      </div>
    )}
    <div className="completion-content">
      <h2 className="completion-title">{tour.completionTitle || 'Tour Complete!'}</h2>
      {tour.completionBody && <p className="completion-body">{tour.completionBody}</p>}
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

  const sortedStops = [...(tour.stops || [])].sort((a, b) => a.order - b.order);

  // Build cards
  const cards = [];
  cards.push({ type: 'cover' });

  sortedStops.forEach((stop, index) => {
    const pages = [...(stop.pages || [])].sort((a, b) => a.order - b.order);
    cards.push({
      type: 'stop',
      number: index + 1,
      title: stop.title,
      pages: pages.map(p => ({
        title: p.title,
        content: p.content,
        clueText: p.clueText,
        unlockMode: p.unlockMode,
        mediaUrl: p.mediaUrl,
      })),
    });
  });

  if (tour.completionTitle || tour.completionBody) {
    cards.push({ type: 'completion' });
  }

  // Group into pairs (2 per printed sheet, side by side)
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
          Print / Save PDF
        </button>
      </div>

      <div className="print-booklet" data-testid="print-booklet">
        {sheets.map((sheet, si) => (
          <div key={si} className="print-sheet">
            {sheet.map((card, ci) => (
              <div key={ci} className="print-card">
                {card.type === 'cover' && <CoverCard tour={tour} />}
                {card.type === 'stop' && <StopCard card={card} logoUrl={tour.logoUrl} />}
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
