import React from 'react';

/**
 * Soft character counter for print-card capacity awareness.
 * Targets are sized for the 5.5×8.5 print card layout.
 *
 *   Gray  : < 80% of target
 *   Orange: 80–100% of target
 *   Red   : > 100% of target (still allowed; soft warning only)
 */
const CharCounter = ({ value, target, label }) => {
  const count = (value || '').length;
  const pct = target > 0 ? (count / target) * 100 : 0;
  let color = '#9ca3af'; // gray
  if (pct >= 100) color = '#dc2626';      // red
  else if (pct >= 80) color = '#d97706';  // orange
  return (
    <div
      className="char-counter"
      style={{ color, fontSize: '0.6875rem', marginTop: 2, fontFamily: 'Quicksand, sans-serif' }}
      data-testid={`char-counter-${label || 'field'}`}
    >
      {count.toLocaleString()}/{target.toLocaleString()} chars
      {pct >= 100 && <span style={{ marginLeft: 6 }}>· may split to extra card</span>}
    </div>
  );
};

export default CharCounter;
