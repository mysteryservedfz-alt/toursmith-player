import { useCallback } from 'react';

export const usePlayerProgress = (tourId) => {
  const storageKey = `tour_progress_${tourId}`;

  const saveProgress = useCallback((stopIdx, pageIdx, unlocked) => {
    try {
      localStorage.setItem(storageKey, JSON.stringify({
        stop: stopIdx, page: pageIdx, unlocked: [...unlocked], ts: Date.now()
      }));
    } catch (e) { /* silent fail */ }
  }, [storageKey]);

  const loadProgress = useCallback(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (!saved) return null;
      const data = JSON.parse(saved);
      if (Date.now() - data.ts > 86400000) { localStorage.removeItem(storageKey); return null; }
      return data;
    } catch (e) { return null; }
  }, [storageKey]);

  const clearProgress = useCallback(() => {
    try { localStorage.removeItem(storageKey); } catch (e) { /* silent */ }
  }, [storageKey]);

  return { saveProgress, loadProgress, clearProgress };
};
