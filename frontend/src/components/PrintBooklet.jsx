import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth, authAxios } from './authContext';

const CoverCard = ({ tour }) => (
  <div className="pb-card-inner pb-cover">
    {tour.logoUrl && (
      <div className="pb-logo">
        <img src={tour.logoUrl} alt="" />
      </div>
    )}
    <div className="pb-cover-body">
      <h1 className="pb-cover-title">{tour.welcomeTitle || tour.title || 'Untitled Tour'}</h1>
      <div className="pb-cover-divider" />
      {tour.welcomeBody && <p className="pb-cover-msg">{tour.welcomeBody}</p>}
      {!tour.welcomeBody && tour.description && <p className="pb-cover-msg">{tour.description}</p>}
    </div>
  </div>
);

const StopCard = ({ card, logoUrl }) => {
  const hasAnswer = card.pages.some(p =>
    (p.unlockMode === 'text' || p.unlockMode === 'multiple_choice') && (p.clueText || p.content)
  );

  // Filter out pages with no meaningful content
  const visiblePages = card.pages.filter(p => p.content || p.clueText || p.mediaUrl);

  return (
    <div className="pb-card-inner pb-stop">
      <div className="pb-stop-head">
        <div className="pb-stop-num">STOP {card.number}</div>
        <h2 className="pb-stop-title">{card.title || `Stop ${card.number}`}</h2>
        {logoUrl && <img src={logoUrl} alt="" className="pb-stop-logo" />}
      </div>

      <div className="pb-stop-body">
        {visiblePages.map((page, i) => (
          <div key={i} className="pb-page">
            {visiblePages.length > 1 && page.title && (
              <div className="pb-page-heading">{page.title}</div>
            )}
            {page.content && (
              <p className="pb-page-text">{page.content}</p>
            )}
            {page.mediaUrl && (
              <div className="pb-page-img">
                <img src={page.mediaUrl} alt="" />
              </div>
            )}
            {page.clueText && (
              <div className="pb-clue">
                <div className="pb-clue-tag">CLUE</div>
                <p className="pb-clue-text">{page.clueText}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {hasAnswer && (
        <div className="pb-scratch-area">
          <div className="pb-scratch-circle" />
        </div>
      )}
    </div>
  );
};

const CompletionCard = ({ tour }) => (
  <div className="pb-card-inner pb-completion">
    {tour.logoUrl && (
      <div className="pb-logo">
        <img src={tour.logoUrl} alt="" />
      </div>
    )}
    <div className="pb-completion-body">
      <h2 className="pb-completion-title">{tour.completionTitle || 'Tour Complete!'}</h2>
      <div className="pb-cover-divider" />
      {tour.completionBody && <p className="pb-completion-msg">{tour.completionBody}</p>}
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

  const sheets = [];
  for (let i = 0; i < cards.length; i += 2) {
    sheets.push(cards.slice(i, i + 2));
  }

  return (
    <div className="pb-wrapper" data-testid="print-booklet-wrapper">
      <div className="pb-toolbar">
        <button onClick={() => navigate(`/admin/tour/${tourId}`)} className="pb-toolbar-btn" data-testid="print-back-btn">
          ← Back to Editor
        </button>
        <div className="pb-toolbar-center">
          <h2>{tour.title}</h2>
          <span>{cards.length} cards / {sheets.length} sheet{sheets.length !== 1 ? 's' : ''}</span>
        </div>
        <button onClick={() => window.print()} className="pb-toolbar-print" data-testid="print-btn">
          Print / Save PDF
        </button>
      </div>

      <div className="pb-preview" data-testid="print-booklet">
        {sheets.map((sheet, si) => (
          <div key={si} className="pb-sheet">
            {sheet.map((card, ci) => (
              <div key={ci} className="pb-card">
                {card.type === 'cover' && <CoverCard tour={tour} />}
                {card.type === 'stop' && <StopCard card={card} logoUrl={tour.logoUrl} />}
                {card.type === 'completion' && <CompletionCard tour={tour} />}
              </div>
            ))}
            {sheet.length === 1 && <div className="pb-card pb-card-empty"><div className="pb-card-inner" /></div>}
          </div>
        ))}
      </div>
    </div>
  );
};

export default PrintBooklet;
