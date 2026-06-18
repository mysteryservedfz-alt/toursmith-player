import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth, authAxios } from './authContext';

const genId = () => Math.random().toString(36).slice(2, 9);

// Block types pulled live from tour data, mirroring the editor + player order.
// We skip audio, video, embed entirely — print only includes story, puzzle, hint, verification, images.
const buildBlocksForPage = (page) => {
  const blocks = [];
  // Story / body
  if (page.content && page.content.trim()) {
    blocks.push({ kind: 'story', text: page.content.trim() });
  }
  if (page.body2 && page.body2.trim()) {
    blocks.push({ kind: 'story', text: page.body2.trim() });
  }
  // Inline image (print-safe). Skip mediaUrl/galleryUrls if mediaType is audio/video.
  const isStaticImage = (url) => url && /\.(jpe?g|png|gif|webp|svg)(\?|#|$)/i.test(url);
  const safeMediaUrl = isStaticImage(page.mediaUrl) ? page.mediaUrl : null;
  if (page.imageUrl) blocks.push({ kind: 'image', url: page.imageUrl, alt: page.imageAlt || '' });
  if (safeMediaUrl) blocks.push({ kind: 'image', url: safeMediaUrl, alt: page.imageAlt || '' });
  // Puzzle / clue (the task)
  if (page.taskInstructions && page.taskInstructions.trim()) {
    blocks.push({ kind: 'puzzle', text: page.taskInstructions.trim() });
  }
  // Hint
  if (page.hintText && page.hintText.trim()) {
    blocks.push({ kind: 'hint', text: page.hintText.trim() });
  }
  // Verification / before-you-leave label (just the answer prompt context)
  if (page.unlockMode && page.unlockMode !== 'continue' && page.unlockMode !== 'photo' && page.unlockMode !== 'shake' && page.unlockMode !== 'timer') {
    if (page.unlockMode === 'multiple_choice' && page.mcOptions && page.mcOptions.length) {
      blocks.push({ kind: 'verification', text: 'Choose one:\n' + page.mcOptions.map((o, i) => `   ${String.fromCharCode(65 + i)}. ${o}`).join('\n') });
    } else if (page.unlockMode === 'checklist' && page.mcOptions && page.mcOptions.length) {
      blocks.push({ kind: 'verification', text: 'Check each as you go:\n' + page.mcOptions.map((o) => `   ☐ ${o}`).join('\n') });
    } else if (page.unlockMode === 'ranking' && page.mcOptions && page.mcOptions.length) {
      blocks.push({ kind: 'verification', text: 'Put these in the right order:\n' + page.mcOptions.map((o) => `   ___  ${o}`).join('\n') });
    } else if (page.unlockMode === 'whiteboard') {
      blocks.push({ kind: 'verification', text: 'Write your answer below:' });
    } else if (page.unlockMode === 'text') {
      blocks.push({ kind: 'verification', text: 'Enter the password on the phone to continue.' });
    }
  }
  return blocks;
};

const buildCardsFromTour = (tour) => {
  const cards = [];
  const stops = [...(tour.stops || [])].sort((a, b) => (a.order || 0) - (b.order || 0));

  // Cover
  cards.push({
    id: genId(),
    type: 'cover',
    title: tour.welcomeTitle || tour.title || '',
    body: tour.welcomeBody || tour.description || '',
    logoUrl: tour.logoUrl || null,
    welcomeImageUrl: tour.welcomeImageUrl || null,
  });

  // One card per stop. Pull content ONLY from nested pages (the sidebar blocks).
  // Skip the stop pin's top-level Title/Story Text/Story Text 2 — those don't print.
  stops.forEach((stop, idx) => {
    const pages = [...(stop.pages || [])].sort((a, b) => (a.order || 0) - (b.order || 0));
    const blocks = [];
    pages.forEach((p) => {
      blocks.push(...buildBlocksForPage(p));
    });

    cards.push({
      id: genId(),
      type: 'stop',
      label: `Stop ${idx + 1}`,
      title: stop.title || `Stop ${idx + 1}`,
      blocks,
    });
  });

  // Completion — its own distinct final card AFTER all stops
  if (tour.completionTitle || tour.completionBody) {
    cards.push({
      id: genId(),
      type: 'completion',
      label: 'Finale',
      title: tour.completionTitle || 'Tour Complete',
      body: tour.completionBody || '',
      completionImageUrl: tour.completionImageUrl || null,
    });
  }

  return cards;
};

const SectionLabel = ({ children }) => (
  <div className="pb-section-label">
    <span>{children}</span>
    <div className="pb-section-rule" />
  </div>
);

const Block = ({ block }) => {
  if (block.kind === 'story') {
    return (
      <div className="pb-block pb-block-story">
        {block.text.split('\n').map((line, i) => (
          <p key={i}>{line || '\u00A0'}</p>
        ))}
      </div>
    );
  }
  if (block.kind === 'puzzle') {
    return (
      <div className="pb-block pb-block-puzzle">
        <SectionLabel>The Puzzle</SectionLabel>
        {block.text.split('\n').map((line, i) => <p key={i}>{line || '\u00A0'}</p>)}
      </div>
    );
  }
  if (block.kind === 'hint') {
    return (
      <div className="pb-block pb-block-hint">
        <div className="pb-hint-box">
          <div className="pb-hint-label">Hint</div>
          <div className="pb-hint-text">
            {block.text.split('\n').map((line, i) => <p key={i}>{line || '\u00A0'}</p>)}
          </div>
        </div>
      </div>
    );
  }
  if (block.kind === 'verification') {
    return (
      <div className="pb-block pb-block-verify">
        <SectionLabel>Before You Leave</SectionLabel>
        {block.text.split('\n').map((line, i) => <p key={i}>{line || '\u00A0'}</p>)}
      </div>
    );
  }
  if (block.kind === 'image') {
    return (
      <div className="pb-block pb-block-image">
        <img src={block.url} alt={block.alt} />
      </div>
    );
  }
  return null;
};

// Auto-fit body: starts at 11pt, shrinks until content fits or hits 8pt minimum.
// If it can't fit even at 8pt, sets overflow=true so we flag the card.
const AutoFitBody = ({ children, onOverflowChange }) => {
  const ref = useRef(null);
  const [fontSize, setFontSize] = useState(11);
  const [overflow, setOverflow] = useState(false);

  useLayoutEffect(() => {
    if (!ref.current) return;
    let size = 11;
    const el = ref.current;
    el.style.fontSize = size + 'pt';
    // Measure synchronously via requestAnimationFrame chain
    let attempts = 0;
    const tryFit = () => {
      if (!ref.current) return;
      const node = ref.current;
      if (node.scrollHeight <= node.clientHeight + 1 || size <= 8) {
        const overflowing = node.scrollHeight > node.clientHeight + 1;
        setFontSize(size);
        setOverflow(overflowing);
        if (onOverflowChange) onOverflowChange(overflowing);
        return;
      }
      size = Math.max(8, +(size - 0.5).toFixed(1));
      node.style.fontSize = size + 'pt';
      attempts += 1;
      if (attempts < 20) requestAnimationFrame(tryFit);
    };
    requestAnimationFrame(tryFit);
  }, [children, onOverflowChange]);

  return (
    <div
      ref={ref}
      className="pb-body-v2"
      style={{ fontSize: fontSize + 'pt' }}
      data-overflow={overflow ? 'true' : 'false'}
    >
      {children}
    </div>
  );
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

  const refresh = () => {
    if (tour) setCards(buildCardsFromTour(tour));
  };

  const removeCard = (id) => setCards(prev => prev.filter(c => c.id !== id));

  const [overflowCards, setOverflowCards] = useState({});
  const markOverflow = (id, isOver) => {
    setOverflowCards(prev => {
      if (!!prev[id] === isOver) return prev;
      const next = { ...prev };
      if (isOver) next[id] = true;
      else delete next[id];
      return next;
    });
  };

  if (loading) return <div className="loading-screen">Loading...</div>;
  if (!tour) return <div className="loading-screen">Tour not found</div>;

  // Group into sheets of 2 cards each (side-by-side, cut down the middle)
  const sheets = [];
  for (let i = 0; i < cards.length; i += 2) sheets.push(cards.slice(i, i + 2));

  return (
    <div className="pb-wrapper pb-parchment" data-testid="print-booklet-wrapper">
      <div className="pb-toolbar no-print">
        <button onClick={() => navigate(`/admin/tour/${tourId}`)} className="pb-toolbar-btn" data-testid="print-back-btn">← Back</button>
        <div className="pb-toolbar-center">
          <h2>{tour.title}</h2>
          <span>{cards.length} cards / {sheets.length} sheet{sheets.length !== 1 ? 's' : ''}</span>
        </div>
        <div className="pb-toolbar-right">
          <button onClick={refresh} className="pb-toolbar-btn" data-testid="print-refresh-btn">↻ Pull Latest from Tour</button>
          <button onClick={() => window.print()} className="pb-toolbar-print" data-testid="print-btn">Print / Save PDF</button>
        </div>
      </div>

      <div className="pb-preview" data-testid="print-booklet">
        {sheets.map((sheet, si) => (
          <div key={si} className="pb-sheet-v2" data-testid={`pb-sheet-${si}`}>
            {sheet.map((card) => (
              <article key={card.id} className={`pb-card-v2 pb-card-${card.type} ${overflowCards[card.id] ? 'pb-card-overflow' : ''}`} data-testid={`pb-card-${card.id}`}>
                <button className="pb-delete-card no-print" onClick={() => removeCard(card.id)} title="Remove from this print">×</button>

                {overflowCards[card.id] && (
                  <div className="pb-overflow-warning no-print" data-testid={`pb-overflow-${card.id}`}>
                    ⚠ Content too long — trim text or split this stop
                  </div>
                )}

                <header className="pb-header-v2">
                  <div className="pb-header-rule" />
                  <div className="pb-header-inner">
                    {card.type === 'stop' && <div className="pb-stop-num">{card.label}</div>}
                    {card.type === 'completion' && <div className="pb-stop-num">{card.label}</div>}
                    <h1 className="pb-card-title">{card.title}</h1>
                  </div>
                  <div className="pb-header-rule" />
                </header>

                <AutoFitBody onOverflowChange={(o) => markOverflow(card.id, o)}>
                  {card.type === 'cover' || card.type === 'completion' ? (
                    <>
                      {card.welcomeImageUrl && (
                        <div className="pb-block pb-block-image">
                          <img src={card.welcomeImageUrl} alt="" />
                        </div>
                      )}
                      {card.completionImageUrl && (
                        <div className="pb-block pb-block-image">
                          <img src={card.completionImageUrl} alt="" />
                        </div>
                      )}
                      {card.body && (
                        <div className="pb-block pb-block-story pb-block-center">
                          {card.body.split('\n').map((line, i) => <p key={i}>{line || '\u00A0'}</p>)}
                        </div>
                      )}
                    </>
                  ) : (
                    (card.blocks || []).map((b, i) => <Block key={i} block={b} />)
                  )}
                </AutoFitBody>

                <footer className="pb-footer-v2">
                  <span>Mystery Served</span>
                </footer>
              </article>
            ))}
            {sheet.length === 1 && <div className="pb-card-v2 pb-card-empty" aria-hidden="true" />}
          </div>
        ))}
      </div>
    </div>
  );
};

export default PrintBooklet;
