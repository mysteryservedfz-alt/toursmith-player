import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth, authAxios } from './authContext';

const MAX_CHARS = 1400;
const estimateLength = (pages) => {
  let len = 0;
  for (const p of pages) {
    if (p.content) len += p.content.length;
    if (p.clueText) len += p.clueText.length + 20;
    if (p.title) len += p.title.length + 10;
    if (p.mediaUrl) len += 200;
  }
  return len;
};

const MagnifyingGlass = () => (
  <svg className="pb-mg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="7" /><line x1="16.5" y1="16.5" x2="22" y2="22" />
  </svg>
);

const CoverCard = ({ tour }) => (
  <div className="pb-inner pb-cover">
    <div className="pb-cover-top">
      {tour.logoUrl && <div className="pb-logo"><img src={tour.logoUrl} alt="" /></div>}
    </div>
    <div className="pb-cover-center">
      <h1 className="pb-cover-title">{tour.welcomeTitle || tour.title || 'Untitled Tour'}</h1>
      <div className="pb-brown-rule" />
      {(tour.welcomeBody || tour.description) && (
        <div className="pb-cream-box">
          <p>{tour.welcomeBody || tour.description}</p>
        </div>
      )}
      <MagnifyingGlass />
    </div>
    <div className="pb-card-foot">{tour.title}</div>
  </div>
);

const StopCard = ({ stopNumber, stopTitle, pages, tourTitle, logoUrl, isContinuation }) => {
  const hasAnswer = pages.some(p =>
    (p.unlockMode === 'text' || p.unlockMode === 'multiple_choice') && (p.clueText || p.content)
  );
  const visible = pages.filter(p => p.content || p.clueText || p.mediaUrl);

  return (
    <div className="pb-inner pb-stop">
      <div className="pb-banner">
        <div>
          <span className="pb-banner-label">{isContinuation ? 'CONTINUED' : `STOP ${stopNumber}`}</span>
          <span className="pb-banner-title">{stopTitle}</span>
        </div>
        {logoUrl && <img src={logoUrl} alt="" className="pb-banner-logo" />}
      </div>

      <div className="pb-body">
        {visible.map((page, i) => (
          <div key={i} className="pb-section">
            {visible.length > 1 && page.title && (
              <div className="pb-section-title">{page.title}</div>
            )}
            {page.content && <p className="pb-text">{page.content}</p>}
            {page.mediaUrl && <div className="pb-img"><img src={page.mediaUrl} alt="" /></div>}
            {page.clueText && (
              <div className="pb-clue-box">
                <div className="pb-clue-label">CLUE</div>
                <p className="pb-clue-text">{page.clueText}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {hasAnswer && (
        <div className="pb-scratch">
          <div className="pb-scratch-header">SCRATCH OFF</div>
          <div className="pb-scratch-body">
            <div className="pb-scratch-circle" />
          </div>
        </div>
      )}

      <div className="pb-card-foot">{tourTitle}</div>
    </div>
  );
};

const CompletionCard = ({ tour }) => (
  <div className="pb-inner pb-completion">
    <div className="pb-cover-top">
      {tour.logoUrl && <div className="pb-logo"><img src={tour.logoUrl} alt="" /></div>}
    </div>
    <div className="pb-cover-center">
      <MagnifyingGlass />
      <h2 className="pb-cover-title">{tour.completionTitle || 'Tour Complete!'}</h2>
      <div className="pb-brown-rule" />
      {tour.completionBody && (
        <div className="pb-cream-box"><p>{tour.completionBody}</p></div>
      )}
    </div>
    <div className="pb-card-foot">{tour.title}</div>
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

  sortedStops.forEach((stop, stopIdx) => {
    const pages = [...(stop.pages || [])].sort((a, b) => a.order - b.order);
    const visible = pages.filter(p => p.content || p.clueText || p.mediaUrl);
    const stopNum = stopIdx + 1;
    const stopTitle = stop.title || `Stop ${stopNum}`;

    if (visible.length === 0) {
      cards.push({ type: 'stop', stopNumber: stopNum, stopTitle, pages: [{}], isContinuation: false });
      return;
    }

    const totalLen = estimateLength(visible);
    if (totalLen <= MAX_CHARS) {
      cards.push({ type: 'stop', stopNumber: stopNum, stopTitle, pages: visible, isContinuation: false });
    } else {
      let chunk = [], chunkLen = 0, isFirst = true;
      for (const p of visible) {
        const pLen = (p.content?.length || 0) + (p.clueText?.length || 0) + (p.title?.length || 0) + (p.mediaUrl ? 200 : 0);
        if (chunkLen + pLen > MAX_CHARS && chunk.length > 0) {
          cards.push({ type: 'stop', stopNumber: stopNum, stopTitle, pages: chunk, isContinuation: !isFirst });
          chunk = []; chunkLen = 0; isFirst = false;
        }
        chunk.push(p); chunkLen += pLen;
      }
      if (chunk.length > 0) {
        cards.push({ type: 'stop', stopNumber: stopNum, stopTitle, pages: chunk, isContinuation: !isFirst });
      }
    }
  });

  if (tour.completionTitle || tour.completionBody) cards.push({ type: 'completion' });

  const sheets = [];
  for (let i = 0; i < cards.length; i += 2) sheets.push(cards.slice(i, i + 2));

  return (
    <div className="pb-wrapper" data-testid="print-booklet-wrapper">
      <div className="pb-toolbar">
        <button onClick={() => navigate(`/admin/tour/${tourId}`)} className="pb-toolbar-btn" data-testid="print-back-btn">← Back to Editor</button>
        <div className="pb-toolbar-center">
          <h2>{tour.title}</h2>
          <span>{cards.length} cards / {sheets.length} sheet{sheets.length !== 1 ? 's' : ''}</span>
        </div>
        <button onClick={() => window.print()} className="pb-toolbar-print" data-testid="print-btn">Print / Save PDF</button>
      </div>
      <div className="pb-preview" data-testid="print-booklet">
        {sheets.map((sheet, si) => (
          <div key={si} className="pb-sheet">
            {sheet.map((card, ci) => (
              <div key={ci} className="pb-card">
                {card.type === 'cover' && <CoverCard tour={tour} />}
                {card.type === 'stop' && <StopCard {...card} tourTitle={tour.title} logoUrl={tour.logoUrl} />}
                {card.type === 'completion' && <CompletionCard tour={tour} />}
              </div>
            ))}
            {sheet.length === 1 && <div className="pb-card pb-card-empty"><div className="pb-inner" /></div>}
          </div>
        ))}
      </div>
    </div>
  );
};

export default PrintBooklet;
