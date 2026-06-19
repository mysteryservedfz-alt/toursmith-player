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

const SOFT_LIMIT_CHARS = 1900; // soft cap per card on 5.5×8.5 layout; bucket splits beyond this
const BLOCK_SPLIT_THRESHOLD = 1600; // single blocks larger than this get split at paragraph boundaries

// If a single text block is bigger than what fits on one card, slice it at paragraph
// boundaries (\n\n preferred, then \n) so build-time splitBucket can pack it across cards.
const splitLongBlock = (block) => {
  if (block.kind === 'image') return [block];
  const text = block.text || '';
  if (text.length <= BLOCK_SPLIT_THRESHOLD) return [block];

  // Prefer double-newline (paragraph) splits, fall back to single newline if needed
  let units = text.split(/\n{2,}/);
  if (units.length === 1) units = text.split(/\n/);

  const out = [];
  let cur = '';
  for (const u of units) {
    const sep = cur ? '\n\n' : '';
    const next = cur + sep + u;
    if (next.length > BLOCK_SPLIT_THRESHOLD && cur.length > 0) {
      out.push({ ...block, text: cur.trim() });
      cur = u;
    } else {
      cur = next;
    }
  }
  if (cur.trim()) out.push({ ...block, text: cur.trim() });
  return out.length > 0 ? out : [block];
};

const bucketBlocks = (blocks) => {
  // (Retained for reference; no longer used after switching to one-card-per-page model.)
  const story = [];
  const clue = [];
  const before = [];
  const stopHasPuzzle = blocks.some((b) => b.kind === 'puzzle');
  for (const b of blocks) {
    if (b.kind === 'story' || b.kind === 'image') story.push(b);
    else if (b.kind === 'puzzle') clue.push(b);
    else if (b.kind === 'hint') (stopHasPuzzle ? clue : story).push(b);
    else if (b.kind === 'verification') before.push(b);
  }
  return { story, clue, before };
};
// (Retained `bucketBlocks` above for reference; current build uses one-card-per-page.)

const charsOf = (blocks) =>
  blocks.reduce((sum, b) => sum + (b.kind === 'image' ? 0 : (b.text || '').length), 0);

// Split a bucket into multiple sub-buckets if it's longer than SOFT_LIMIT_CHARS.
// Tries to split at block boundaries (paragraph-respecting).
const splitBucket = (blocks) => {
  if (charsOf(blocks) <= SOFT_LIMIT_CHARS) return [blocks];
  const out = [];
  let cur = [];
  let curChars = 0;
  for (const b of blocks) {
    const bChars = b.kind === 'image' ? 0 : (b.text || '').length;
    if (curChars > 0 && curChars + bChars > SOFT_LIMIT_CHARS) {
      out.push(cur);
      cur = [b];
      curChars = bChars;
    } else {
      cur.push(b);
      curChars += bChars;
    }
  }
  if (cur.length) out.push(cur);
  return out;
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

  // One card per PAGE per stop — mirrors the player flow.
  // If a single page's content overflows the soft limit, split into continuation cards
  // ("(1/2)", "(2/2)") that keep the same stop name AND page title.
  stops.forEach((stop, idx) => {
    const stopNum = idx + 1;
    const pages = [...(stop.pages || [])].sort((a, b) => (a.order || 0) - (b.order || 0));

    if (pages.length === 0) {
      cards.push({
        id: genId(),
        type: 'stop',
        section: 'Page 1',
        label: `Stop ${stopNum}`,
        sectionLabel: `Stop ${stopNum} · ${stop.title || `Stop ${stopNum}`}`,
        title: stop.title || `Stop ${stopNum}`,
        blocks: [],
      });
      return;
    }

    pages.forEach((p, pIdx) => {
      // Build blocks for this single page, then slice oversized text blocks
      let pageBlocksRaw = buildBlocksForPage(p);
      pageBlocksRaw = pageBlocksRaw.flatMap(splitLongBlock);

      // Pack page blocks into card-sized parts (handles overflow → continuation cards)
      const parts = splitBucket(pageBlocksRaw);

      const pageTitle = (p.title && p.title.trim()) || `Page ${pIdx + 1}`;
      parts.forEach((partBlocks, partIdx) => {
        const partSuffix = parts.length > 1 ? ` (${partIdx + 1}/${parts.length})` : '';
        cards.push({
          id: genId(),
          type: 'stop',
          section: pageTitle,
          label: `Stop ${stopNum}`,
          sectionLabel: `Stop ${stopNum} · ${pageTitle}${partSuffix}`,
          title: stop.title || `Stop ${stopNum}`,
          blocks: partBlocks,
        });
      });
    });
  });

  // Completion — its own distinct final card AFTER all stops
  if (tour.completionTitle || tour.completionBody) {
    cards.push({
      id: genId(),
      type: 'completion',
      label: 'Finale',
      sectionLabel: 'Finale',
      title: tour.completionTitle || 'Tour Complete',
      body: tour.completionBody || '',
      completionImageUrl: tour.completionImageUrl || null,
    });
  }

  // Post-pass: assign "Card X of Y" per stop so each stop's cards know their group size
  const stopGroups = {};
  cards.forEach((c) => {
    if (c.type !== 'stop') return;
    const key = c.label || '?';
    if (!stopGroups[key]) stopGroups[key] = [];
    stopGroups[key].push(c);
  });
  Object.values(stopGroups).forEach((group) => {
    group.forEach((c, i) => {
      c.cardIndex = i + 1;
      c.cardTotal = group.length;
      c.sequenceLabel = `${c.label} · Card ${c.cardIndex} of ${c.cardTotal}`;
    });
  });

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
// Waits for images/fonts to load before measuring to avoid the race that caused
// premature "fits" decisions and mid-sentence cropping at 11pt.
const AutoFitBody = ({ children, onOverflowChange, signature }) => {
  const ref = useRef(null);
  const overflowRef = useRef(false);
  const [fontSize, setFontSize] = useState(11);

  useLayoutEffect(() => {
    if (!ref.current) return;
    const el = ref.current;
    let cancelled = false;

    const runShrink = () => {
      if (cancelled || !el) return;
      let size = 11;
      el.style.fontSize = size + 'pt';
      const imgs = Array.from(el.querySelectorAll('img'));
      // Reset image scale class first
      imgs.forEach(img => img.style.maxHeight = '');
      // Stage 1: shrink text font 11 → 8
      while (el.scrollHeight > el.clientHeight + 1 && size > 8) {
        size = +(size - 0.5).toFixed(1);
        el.style.fontSize = size + 'pt';
      }
      // Stage 2: if still overflowing, shrink images progressively from 100% → 50% of current
      if (el.scrollHeight > el.clientHeight + 1 && imgs.length > 0) {
        let scale = 90;
        while (el.scrollHeight > el.clientHeight + 1 && scale >= 50) {
          imgs.forEach(img => img.style.maxHeight = (scale * 0.01 * 4) + 'in');
          scale -= 10;
        }
      }
      const overflowing = el.scrollHeight > el.clientHeight + 1;
      setFontSize(size);
      if (overflowRef.current !== overflowing) {
        overflowRef.current = overflowing;
        if (onOverflowChange) onOverflowChange(overflowing);
      }
    };

    // Wait for any <img> tags inside to load (fixes early-measure race)
    const imgs = el.querySelectorAll('img');
    if (imgs.length === 0) {
      runShrink();
    } else {
      let remaining = imgs.length;
      const onOne = () => {
        remaining -= 1;
        if (remaining <= 0 && !cancelled) runShrink();
      };
      imgs.forEach((img) => {
        if (img.complete) onOne();
        else {
          img.addEventListener('load', onOne, { once: true });
          img.addEventListener('error', onOne, { once: true });
        }
      });
      // Safety fallback: shrink after 1.5s no matter what
      setTimeout(() => { if (!cancelled) runShrink(); }, 1500);
    }

    // Also re-run when fonts load (Lora / Playfair Display)
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => { if (!cancelled) runShrink(); });
    }

    return () => { cancelled = true; };
  }, [signature]);

  return (
    <div
      ref={ref}
      className="pb-body-v2"
      style={{ fontSize: fontSize + 'pt' }}
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

  const printDate = new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });

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
            <div className="pb-sheet-header">
              <span className="pb-sheet-title">{tour.title}</span>
              <span className="pb-sheet-meta">Sheet {si + 1} of {sheets.length} · {printDate}</span>
            </div>
            {sheet.map((card) => (
              <article key={card.id} className={`pb-card-v2 pb-card-${card.type} ${overflowCards[card.id] ? 'pb-card-overflow' : ''}`} data-testid={`pb-card-${card.id}`}>
                {/* Corner crop marks — light gray Ls just inside each corner, guide cuts only */}
                <span className="pb-crop pb-crop-tl" aria-hidden="true" />
                <span className="pb-crop pb-crop-tr" aria-hidden="true" />
                <span className="pb-crop pb-crop-bl" aria-hidden="true" />
                <span className="pb-crop pb-crop-br" aria-hidden="true" />

                <button className="pb-delete-card no-print" onClick={() => removeCard(card.id)} title="Remove from this print">×</button>

                {overflowCards[card.id] && (
                  <div className="pb-overflow-warning no-print" data-testid={`pb-overflow-${card.id}`}>
                    ⚠ Content too long — trim text or split this stop
                  </div>
                )}

                <header className="pb-header-v2">
                  <div className="pb-header-rule" />
                  <div className="pb-header-inner">
                    {(card.type === 'stop' || card.type === 'completion') && (
                      <div className="pb-stop-num">{card.sectionLabel || card.label}</div>
                    )}
                    <h1 className="pb-card-title">{card.title}</h1>
                  </div>
                  <div className="pb-header-rule" />
                </header>

                <AutoFitBody
                  signature={card.id + ':' + (card.blocks ? card.blocks.length : 0) + ':' + (card.body ? card.body.length : 0)}
                  onOverflowChange={(o) => markOverflow(card.id, o)}
                >
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
                  {card.sequenceLabel && (
                    <span className="pb-card-sequence">{card.sequenceLabel}</span>
                  )}
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
