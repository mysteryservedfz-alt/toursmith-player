import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { usePlayerProgress } from './usePlayerProgress';
import { renderContent } from './ContentRenderer';
import PlayerWelcome from './PlayerWelcome';
import PlayerCompletion from './PlayerCompletion';
import UnlockGate from './UnlockGate';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const PlayerLayout = ({ Icons }) => {
  const { tourId } = useParams();
  const navigate = useNavigate();
  const [tour, setTour] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showWelcome, setShowWelcome] = useState(true);
  const [currentStopIndex, setCurrentStopIndex] = useState(0);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [unlockedPages, setUnlockedPages] = useState(new Set());

  const { saveProgress, loadProgress, clearProgress } = usePlayerProgress(tourId);

  // Auto-save on any navigation
  useEffect(() => {
    if (tour && !showWelcome) {
      saveProgress(currentStopIndex, currentPageIndex, unlockedPages);
    }
  }, [currentStopIndex, currentPageIndex, unlockedPages]);

  const [showUnlock, setShowUnlock] = useState(false);
  const [unlockInput, setUnlockInput] = useState("");
  const [unlockError, setUnlockError] = useState("");
  const [unlockSuccess, setUnlockSuccess] = useState("");
  const [selectedMcOption, setSelectedMcOption] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);
  const [rankingItems, setRankingItems] = useState([]);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [checkedItems, setCheckedItems] = useState(new Set());
  const [shakeDetected, setShakeDetected] = useState(false);
  const [showHintPage, setShowHintPage] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [tourComplete, setTourComplete] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  // GPS state for welcome screen
  const [gpsStatus, setGpsStatus] = useState('idle');
  const [userLocation, setUserLocation] = useState(null);
  const [gpsDistance, setGpsDistance] = useState(null);
  const [gpsError, setGpsError] = useState(null);

  // Helper: Get background style with optional skin image
  const getBackgroundStyle = (pageSkin = null) => {
    const skinUrl = pageSkin || tour?.skinImageUrl;
    const bgColor = tour?.backgroundColor;
    
    if (skinUrl) {
      return {
        background: bgColor || '#0f172a',
        backgroundImage: `url(${skinUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      };
    }
    if (bgColor) {
      return { background: bgColor };
    }
    return {};
  };

  // Calculate distance between two GPS points (Haversine formula)
  const calculateDistance = (lat1, lng1, lat2, lng2) => {
    const R = 6371000;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Check GPS location
  const checkGpsLocation = useCallback(() => {
    if (!tour?.welcomeGpsEnabled || !tour?.welcomeGpsLat || !tour?.welcomeGpsLng) {
      setGpsStatus('allowed');
      return;
    }

    if (!navigator.geolocation) {
      setGpsError("Your browser doesn't support location services");
      setGpsStatus('error');
      return;
    }

    setGpsStatus('checking');
    setGpsError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation({ lat: latitude, lng: longitude });
        
        const distance = calculateDistance(
          latitude, longitude,
          tour.welcomeGpsLat, tour.welcomeGpsLng
        );
        setGpsDistance(Math.round(distance));
        
        const radius = tour.welcomeGpsRadiusMeters || 100;
        if (distance <= radius) {
          setGpsStatus('allowed');
        } else {
          setGpsStatus('too_far');
        }
      },
      (error) => {
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setGpsError("Location access denied. Please enable location permissions in your browser settings.");
            setGpsStatus('denied');
            break;
          case error.POSITION_UNAVAILABLE:
            setGpsError("Location unavailable. Please check your GPS/location services.");
            setGpsStatus('error');
            break;
          case error.TIMEOUT:
            setGpsError("Location request timed out. Please try again.");
            setGpsStatus('error');
            break;
          default:
            setGpsError("Unable to get your location.");
            setGpsStatus('error');
        }
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  }, [tour]);

  useEffect(() => {
    const fetchTour = async () => {
      try {
        const res = await axios.get(`${API}/public/tours/${tourId}`);
        setTour(res.data);
        document.title = res.data.title || "Tour Player";
        const saved = loadProgress();
        if (saved && (saved.stop > 0 || saved.page > 0)) {
          setCurrentStopIndex(saved.stop);
          setCurrentPageIndex(saved.page);
          setUnlockedPages(new Set(saved.unlocked || []));
          setShowWelcome(false);
        } else {
          const hasWelcome = res.data.welcomeTitle || res.data.welcomeBody;
          setShowWelcome(hasWelcome);
        }
      } catch (err) {
        setError("Tour not found or not published");
      } finally {
        setLoading(false);
      }
    };
    fetchTour();
  }, [tourId]);

  const hasWelcomeScreen = tour?.welcomeTitle || tour?.welcomeBody;

  const startTour = () => {
    setShowWelcome(false);
    setCurrentStopIndex(0);
    setCurrentPageIndex(0);
    saveProgress(0, 0, unlockedPages);
  };

  const sortedStops = tour?.stops?.sort((a, b) => a.order - b.order) || [];
  const currentStop = sortedStops[currentStopIndex];
  const actualPages = currentStop?.pages?.sort((a, b) => a.order - b.order) || [];
  
  const stopHasIntro = currentStop && (currentStop.description || currentStop.subtitle || currentStop.taskInstructions);
  
  const stopIntroPage = currentStop ? {
    id: `${currentStop.id}-intro`,
    title: currentStop.title || '',
    subtitle: currentStop.subtitle || '',
    content: currentStop.content || currentStop.body || '',
    description: currentStop.description || '',
    intro2: currentStop.intro2 || '',
    taskInstructions: currentStop.taskInstructions || '',
    imageUrl: currentStop.imageUrl,
    audioUrl: currentStop.audioUrl,
    mediaUrl: currentStop.mediaUrl,
    mediaType: currentStop.mediaType,
    skinImageUrl: currentStop.skinImageUrl,
    unlockMode: stopHasIntro && actualPages.length > 0 ? 'continue' : currentStop.unlockMode,
    storyMode: currentStop.storyMode,
    hintText: stopHasIntro && actualPages.length > 0 ? null : currentStop.hintText,
    answer: stopHasIntro && actualPages.length > 0 ? null : currentStop.answer,
    caseInsensitive: currentStop.caseInsensitive,
    mcOptions: stopHasIntro && actualPages.length > 0 ? null : currentStop.mcOptions,
    mcCorrectIndex: stopHasIntro && actualPages.length > 0 ? null : currentStop.mcCorrectIndex,
    isStopIntro: true
  } : null;
  
  const sortedPages = stopHasIntro 
    ? [stopIntroPage, ...actualPages]
    : actualPages.length > 0 
      ? actualPages 
      : stopIntroPage 
        ? [stopIntroPage] 
        : [];
  
  const currentPage = sortedPages[currentPageIndex] || null;

  const getEffectiveUnlock = (page, stop) => {
    if (page?.storyMode || stop?.storyMode) return "continue";
    return page?.unlockMode ?? stop?.unlockMode ?? "continue";
  };

  const normalizeUnlockMode = (mode) => {
    if (!mode) return "continue";
    const modeMap = {
      "continue": "continue",
      "text": "text",
      "multiple_choice": "multiple_choice",
      "whiteboard": "whiteboard",
      "photo": "photo",
      "ranking": "ranking",
      "timer": "timer",
      "checklist": "checklist",
      "shake": "shake",
      "answer_required": "text",
      "password": "text",
      "none": "continue"
    };
    return modeMap[mode] || "continue";
  };

  const getUnlockData = (page, stop) => {
    const rawMode = getEffectiveUnlock(page, stop);
    const mode = normalizeUnlockMode(rawMode);
    if (mode === "continue") return null;
    
    const source = page?.unlockMode ? page : stop;
    
    if (mode === "multiple_choice" && (!source?.mcOptions || source.mcOptions.length === 0)) {
      return null;
    }
    
    if (mode === "text" && !source?.answer) {
      return null;
    }

    if (mode === "photo") {
      return { mode, hintText: source?.hintText || page?.hintText, autoShowHint: source?.autoShowHint || page?.autoShowHint, wrongAnswerMessage: source?.wrongAnswerMessage || page?.wrongAnswerMessage, correctAnswerMessage: source?.correctAnswerMessage || page?.correctAnswerMessage };
    }

    if (mode === "ranking") {
      if (!source?.mcOptions || source.mcOptions.length < 2) return null;
      return { mode, mcOptions: source.mcOptions, hintText: source?.hintText || page?.hintText, autoShowHint: source?.autoShowHint || page?.autoShowHint, wrongAnswerMessage: source?.wrongAnswerMessage || page?.wrongAnswerMessage, correctAnswerMessage: source?.correctAnswerMessage || page?.correctAnswerMessage };
    }

    if (mode === "timer") {
      const seconds = parseInt(source?.answer) || 60;
      return { mode, timerDuration: seconds, hintText: source?.hintText || page?.hintText, autoShowHint: source?.autoShowHint || page?.autoShowHint, wrongAnswerMessage: source?.wrongAnswerMessage || page?.wrongAnswerMessage, correctAnswerMessage: source?.correctAnswerMessage || page?.correctAnswerMessage };
    }

    if (mode === "checklist") {
      if (!source?.mcOptions || source.mcOptions.length === 0) return null;
      return { mode, mcOptions: source.mcOptions, hintText: source?.hintText || page?.hintText, autoShowHint: source?.autoShowHint || page?.autoShowHint, wrongAnswerMessage: source?.wrongAnswerMessage || page?.wrongAnswerMessage, correctAnswerMessage: source?.correctAnswerMessage || page?.correctAnswerMessage };
    }

    if (mode === "shake") {
      return { mode, hintText: source?.hintText || page?.hintText, autoShowHint: source?.autoShowHint || page?.autoShowHint, wrongAnswerMessage: source?.wrongAnswerMessage || page?.wrongAnswerMessage, correctAnswerMessage: source?.correctAnswerMessage || page?.correctAnswerMessage };
    }
    
    return {
      mode,
      answer: source?.answer,
      caseInsensitive: source?.caseInsensitive !== false,
      mcOptions: source?.mcOptions,
      mcCorrectIndex: source?.mcCorrectIndex,
      hintText: source?.hintText || page?.hintText,
      autoShowHint: source?.autoShowHint || page?.autoShowHint,
      wrongAnswerMessage: source?.wrongAnswerMessage || page?.wrongAnswerMessage,
      correctAnswerMessage: source?.correctAnswerMessage || page?.correctAnswerMessage
    };
  };

  const pageKey = `${currentStop?.id}-${currentPage?.id}`;
  const isUnlocked = unlockedPages.has(pageKey);
  const unlockData = getUnlockData(currentPage, currentStop);
  const needsUnlock = unlockData && unlockData.mode !== "continue" && !isUnlocked;

  // Handle auto-show hints
  useEffect(() => {
    if (unlockData?.autoShowHint && unlockData?.hintText && needsUnlock) {
      setShowHintPage(true);
    }
  }, [pageKey]);

  useEffect(() => {
    setSelectedMcOption(null);
    setUnlockInput("");
    setUnlockError("");
    setPhotoFile(null);
    setRankingItems([]);
    setTimerSeconds(0);
    setTimerRunning(false);
    setCheckedItems(new Set());
    setShakeDetected(false);
    
    if (needsUnlock && !showUnlock) {
      setShowUnlock(true);
    } else if (!needsUnlock && showUnlock) {
      setShowUnlock(false);
    }
  }, [needsUnlock, currentStopIndex, currentPageIndex]);

  // Shuffle ranking items when a ranking page loads
  useEffect(() => {
    if (unlockData?.mode === "ranking" && unlockData.mcOptions && rankingItems.length === 0) {
      const items = unlockData.mcOptions.map((text, i) => ({ id: `rank-${i}`, text, originalIndex: i }));
      const shuffled = [...items];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      setRankingItems(shuffled);
    }
  }, [unlockData, pageKey]);

  const handleRankingDragEnd = (result) => {
    if (!result.destination) return;
    const items = Array.from(rankingItems);
    const [reordered] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reordered);
    setRankingItems(items);
    setUnlockError("");
  };

  // Timer countdown
  useEffect(() => {
    if (unlockData?.mode === "timer" && !timerRunning && timerSeconds === 0 && needsUnlock) {
      setTimerSeconds(unlockData.timerDuration);
      setTimerRunning(true);
    }
  }, [unlockData, pageKey]);

  useEffect(() => {
    if (!timerRunning || timerSeconds <= 0) return;
    const interval = setInterval(() => {
      setTimerSeconds(prev => {
        if (prev <= 1) {
          setTimerRunning(false);
          setUnlockSuccess("Time's up. You're through.");
          setTimeout(() => {
            setUnlockedPages(prev2 => new Set([...prev2, pageKey]));
            setShowUnlock(false);
            setUnlockSuccess("");
            goNext();
          }, 1500);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [timerRunning, timerSeconds]);

  // Shake detection
  useEffect(() => {
    if (unlockData?.mode !== "shake" || !needsUnlock || shakeDetected) return;
    let lastX = 0, lastY = 0, lastZ = 0;
    let lastTime = Date.now();
    const threshold = 25;

    const handleMotion = (e) => {
      const acc = e.accelerationIncludingGravity;
      if (!acc) return;
      const now = Date.now();
      if (now - lastTime < 100) return;
      const dx = Math.abs(acc.x - lastX);
      const dy = Math.abs(acc.y - lastY);
      const dz = Math.abs(acc.z - lastZ);
      if (dx + dy + dz > threshold) {
        setShakeDetected(true);
      }
      lastX = acc.x; lastY = acc.y; lastZ = acc.z;
      lastTime = now;
    };

    window.addEventListener('devicemotion', handleMotion);
    return () => window.removeEventListener('devicemotion', handleMotion);
  }, [unlockData, pageKey, shakeDetected, needsUnlock]);

  // Auto-unlock on shake detect
  useEffect(() => {
    if (shakeDetected && unlockData?.mode === "shake" && needsUnlock) {
      setUnlockSuccess(unlockData.correctAnswerMessage || "There it is.");
      setTimeout(() => {
        setUnlockedPages(prev => new Set([...prev, pageKey]));
        setShowUnlock(false);
        setUnlockSuccess("");
        setShakeDetected(false);
        goNext();
      }, 1500);
    }
  }, [shakeDetected]);

  const handleUnlock = () => {
    if (!unlockData) return;
    
    let correct = false;
    
    if (unlockData.mode === "text") {
      const userAnswer = unlockData.caseInsensitive 
        ? unlockInput.toLowerCase().trim() 
        : unlockInput.trim();
      const correctAnswer = unlockData.caseInsensitive 
        ? (unlockData.answer || "").toLowerCase().trim()
        : (unlockData.answer || "").trim();
      correct = userAnswer === correctAnswer;
    } else if (unlockData.mode === "multiple_choice") {
      correct = selectedMcOption === unlockData.mcCorrectIndex;
    } else if (unlockData.mode === "whiteboard") {
      correct = unlockInput.trim().length > 0;
    } else if (unlockData.mode === "photo") {
      correct = !!photoFile;
    } else if (unlockData.mode === "ranking") {
      correct = rankingItems.every((item, index) => item.originalIndex === index);
    } else if (unlockData.mode === "checklist") {
      correct = unlockData.mcOptions && checkedItems.size === unlockData.mcOptions.length;
    } else if (unlockData.mode === "shake") {
      correct = shakeDetected;
    } else if (unlockData.mode === "timer") {
      correct = timerSeconds <= 0;
    }
    
    if (correct) {
      setUnlockError("");
      setUnlockSuccess(unlockData.correctAnswerMessage || "There it is.");
      setTimeout(() => {
        setUnlockedPages(prev => new Set([...prev, pageKey]));
        setShowUnlock(false);
        setUnlockInput("");
        setUnlockSuccess("");
        setSelectedMcOption(null);
        setPhotoFile(null);
        goNext();
      }, 1500);
    } else {
      const customMsg = unlockData.wrongAnswerMessage;
      setUnlockError(customMsg || "Not quite. Take another look — you're closer than you think.");
    }
  };

  const handleSkip = () => {
    if (!unlockData) return;
    const ok = window.confirm(
      "Skip this puzzle and move on?\n\nThis unlocks the next page without solving. Use this if you're stuck or the place has changed."
    );
    if (!ok) return;
    setUnlockError("");
    setUnlockSuccess("Skipping ahead…");
    setTimeout(() => {
      setUnlockedPages(prev => new Set([...prev, pageKey]));
      setShowUnlock(false);
      setUnlockInput("");
      setUnlockSuccess("");
      setSelectedMcOption(null);
      setPhotoFile(null);
      goNext();
    }, 600);
  };

  const goNext = () => {
    if (currentPageIndex >= sortedPages.length - 1 && currentStopIndex < sortedStops.length - 1) {
      setIsTransitioning(true);
      setTimeout(() => {
        setIsTransitioning(false);
        setCurrentStopIndex(currentStopIndex + 1);
        setCurrentPageIndex(0);
        saveProgress(currentStopIndex + 1, 0, unlockedPages);
      }, 1500);
    } else if (currentPageIndex < sortedPages.length - 1) {
      setCurrentPageIndex(currentPageIndex + 1);
      saveProgress(currentStopIndex, currentPageIndex + 1, unlockedPages);
    } else {
      setTourComplete(true);
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 5000);
      clearProgress();
    }
  };

  const goPrev = () => {
    if (currentPageIndex > 0) {
      setCurrentPageIndex(currentPageIndex - 1);
      saveProgress(currentStopIndex, currentPageIndex - 1, unlockedPages);
    } else if (currentStopIndex > 0) {
      const prevStop = sortedStops[currentStopIndex - 1];
      const prevActualPages = prevStop?.pages?.sort((a, b) => a.order - b.order) || [];
      const prevStopHasIntro = prevStop && (prevStop.description || prevStop.subtitle || prevStop.taskInstructions);
      const prevTotalPages = prevStopHasIntro ? prevActualPages.length + 1 : Math.max(prevActualPages.length, 1);
      setCurrentStopIndex(currentStopIndex - 1);
      setCurrentPageIndex(prevTotalPages - 1);
      saveProgress(currentStopIndex - 1, prevTotalPages - 1, unlockedPages);
    }
  };

  const isFirstPage = currentStopIndex === 0 && currentPageIndex === 0;
  const isLastPage = currentStopIndex === sortedStops.length - 1 && currentPageIndex === sortedPages.length - 1;
  
  const getTotalPagesForStop = (stop) => {
    const pagesCount = stop?.pages?.length || 0;
    const hasIntro = stop && (stop.description || stop.subtitle || stop.taskInstructions);
    return hasIntro ? pagesCount + 1 : Math.max(pagesCount, 1);
  };
  const totalPages = sortedStops.reduce((sum, stop) => sum + getTotalPagesForStop(stop), 0);
  const completedPages = sortedStops.slice(0, currentStopIndex).reduce((sum, stop) => sum + getTotalPagesForStop(stop), 0) + currentPageIndex;
  const progressPercent = totalPages > 0 ? Math.round((completedPages / totalPages) * 100) : 0;

  if (loading) return <div className="player-loading">Loading tour...</div>;
  if (error) return <div className="player-error">{error}</div>;
  if (!tour || !currentStop || !currentPage) return <div className="player-error">No content available</div>;

  // Hint page view
  if (showHintPage && unlockData?.hintText) {
    return (
      <div className="player-theme player-layout hint-page-layout" data-testid="player-hint-page" style={getBackgroundStyle(currentPage?.skinImageUrl)}>
        <div className="hint-page">
          <div className="hint-content">
            <h2>Hint</h2>
            <div className="hint-text">
              {unlockData.hintText.split('\n').map((line, i) => (
                <p key={i}>{line}</p>
              ))}
            </div>
          </div>
          <button 
            onClick={() => setShowHintPage(false)} 
            className="btn btn-back"
            data-testid="hint-back-btn"
          >
            <Icons.ChevronLeft /> Back to Challenge
          </button>
        </div>
      </div>
    );
  }

  // Welcome Screen
  if (showWelcome && hasWelcomeScreen) {
    return (
      <PlayerWelcome
        tour={tour}
        getBackgroundStyle={getBackgroundStyle}
        startTour={startTour}
        gpsStatus={gpsStatus}
        gpsError={gpsError}
        gpsDistance={gpsDistance}
        checkGpsLocation={checkGpsLocation}
        Icons={Icons}
      />
    );
  }

  // Unlock Gate
  if (showUnlock && needsUnlock) {
    return (
      <UnlockGate
        tour={tour}
        currentStop={currentStop}
        currentPage={currentPage}
        currentStopIndex={currentStopIndex}
        currentPageIndex={currentPageIndex}
        sortedStops={sortedStops}
        sortedPages={sortedPages}
        progressPercent={progressPercent}
        isFirstPage={isFirstPage}
        unlockData={unlockData}
        unlockInput={unlockInput}
        setUnlockInput={setUnlockInput}
        unlockError={unlockError}
        setUnlockError={setUnlockError}
        unlockSuccess={unlockSuccess}
        selectedMcOption={selectedMcOption}
        setSelectedMcOption={setSelectedMcOption}
        photoFile={photoFile}
        setPhotoFile={setPhotoFile}
        rankingItems={rankingItems}
        handleRankingDragEnd={handleRankingDragEnd}
        timerSeconds={timerSeconds}
        checkedItems={checkedItems}
        setCheckedItems={setCheckedItems}
        shakeDetected={shakeDetected}
        setShakeDetected={setShakeDetected}
        handleUnlock={handleUnlock}
        handleSkip={handleSkip}
        goPrev={goPrev}
        setShowHintPage={setShowHintPage}
        getBackgroundStyle={getBackgroundStyle}
        renderContent={renderContent}
        Icons={Icons}
      />
    );
  }

  // No stops
  if (!currentStop) {
    return (
      <div className="player-theme player-layout" data-testid="tour-player" style={getBackgroundStyle()}>
        <header className="player-header">
          <h1>{tour.title}</h1>
        </header>
        <main className="player-main">
          <div className="player-content">
            <div className="no-content-message">
              <h2>🚧 Tour Under Construction</h2>
              <p>This tour doesn't have any stops yet. Check back soon!</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Normal Page View
  return (
    <div className="player-theme player-layout" data-testid="tour-player" style={getBackgroundStyle(currentPage?.skinImageUrl)}>
      {tourComplete && (
        <PlayerCompletion
          tour={tour}
          showConfetti={showConfetti}
          onRestart={() => { setTourComplete(false); setShowWelcome(true); }}
        />
      )}
      
      <header className="player-header">
        <div className="progress-bar-container">
          <div className="progress-bar" style={{ width: `${progressPercent}%` }} />
        </div>
        <h1>{tour.title}</h1>
        <p className="player-progress">
          Stop {currentStopIndex + 1} of {sortedStops.length} • Page {currentPageIndex + 1} of {sortedPages.length}
          <span className="progress-percent">{progressPercent}%</span>
        </p>
      </header>

      <main className="player-main">
        <div className="player-content" key={pageKey} style={{ color: currentPage?.textColor || currentStop?.textColor || '#1a1a1a' }}>
              {/* Stop Title */}
              <div className="player-stop-title">{currentStop.title}</div>
              
              {currentPage?.isStopIntro && currentStop.subtitle && (
                <p className="player-stop-subtitle">{currentStop.subtitle}</p>
              )}
              
              {!currentPage?.isStopIntro && currentPage?.title && (
                <h2 className="player-page-title">{currentPage.title}</h2>
              )}
              
              {renderContent(currentPage, false)}

              <div className="page-end-divider themed">
                <span className="divider-line" />
                <span className="divider-icon">
                  {(() => {
                    const icons = [
                      <svg key="guitar" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11.5 3v4M15 5.5l-3.5 1M8 5.5l3.5 1"/><ellipse cx="11.5" cy="15" rx="5" ry="6"/><ellipse cx="11.5" cy="15" rx="2" ry="2.5"/><line x1="11.5" y1="3" x2="11.5" y2="2"/></svg>,
                      <svg key="banjo" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="14" r="6"/><circle cx="12" cy="14" r="2.5"/><line x1="12" y1="2" x2="12" y2="8"/><line x1="10" y1="3" x2="14" y2="3"/></svg>,
                      <svg key="violin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v6"/><ellipse cx="12" cy="11" rx="3.5" ry="3"/><ellipse cx="12" cy="17" rx="3.5" ry="3"/><path d="M8.5 14h7"/><line x1="12" y1="20" x2="12" y2="22"/><circle cx="12" cy="2" r="0.5" fill="currentColor"/></svg>,
                      <svg key="notes" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>,
                    ];
                    return icons[(currentStopIndex + currentPageIndex) % icons.length];
                  })()}
                </span>
                <span className="divider-line" />
              </div>
            </div>
      </main>

      <footer className="player-footer">
        <button
          onClick={goPrev}
          disabled={isFirstPage}
          className="btn btn-secondary"
          data-testid="player-prev-btn"
        >
          <Icons.ChevronLeft /> Previous
        </button>
        <button
          onClick={goNext}
          className="btn btn-primary"
          data-testid="player-next-btn"
        >
          {isLastPage ? 'Finish' : 'Next'} <Icons.ChevronRight />
        </button>
      </footer>
    </div>
  );
};

export default PlayerLayout;
