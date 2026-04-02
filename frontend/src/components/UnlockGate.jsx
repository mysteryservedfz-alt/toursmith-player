import React from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

const UnlockGate = ({
  tour, currentStop, currentPage, currentStopIndex, currentPageIndex,
  sortedStops, sortedPages, progressPercent, isFirstPage,
  unlockData, unlockInput, setUnlockInput, unlockError, setUnlockError,
  unlockSuccess, selectedMcOption, setSelectedMcOption,
  photoFile, setPhotoFile, rankingItems, handleRankingDragEnd,
  timerSeconds, checkedItems, setCheckedItems,
  shakeDetected, setShakeDetected,
  handleUnlock, goPrev, setShowHintPage,
  getBackgroundStyle, renderContent, Icons
}) => {
  const hasPageContent = currentPage?.content || currentPage?.description || currentPage?.subtitle || currentPage?.taskInstructions;

  return (
    <div className="player-theme player-layout" data-testid="player-unlock-gate" style={getBackgroundStyle(currentPage?.skinImageUrl)}>
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
        <div className="player-content" style={{ color: currentPage?.textColor || currentStop?.textColor || '#1a1a1a' }}>
          <div className="player-stop-title">{currentStop.title}</div>
          
          {hasPageContent && renderContent(currentPage, false)}

          <div className="unlock-inline" data-testid="unlock-inline-form">
            {/* Text verification */}
            {unlockData.mode === "text" && (
              <>
                <input
                  type="text"
                  className={`input ${unlockError ? "input-error" : ""}`}
                  value={unlockInput}
                  onChange={(e) => { setUnlockInput(e.target.value); setUnlockError(""); }}
                  placeholder="Your answer"
                  onKeyDown={(e) => e.key === "Enter" && handleUnlock()}
                  data-testid="unlock-input"
                />
              </>
            )}
            
            {/* Multiple choice verification */}
            {unlockData.mode === "multiple_choice" && unlockData.mcOptions && (
              <div className="mc-options-player">
                {unlockData.mcOptions.map((option, index) => (
                  <button
                    key={index}
                    type="button"
                    className={`mc-option-btn ${selectedMcOption === index ? 'selected' : ''}`}
                    onClick={() => { setSelectedMcOption(index); setUnlockError(""); }}
                    data-testid={`mc-option-${index}`}
                  >
                    <span className="mc-option-letter">{String.fromCharCode(65 + index)}</span>
                    <span className="mc-option-text">{option}</span>
                  </button>
                ))}
              </div>
            )}
            
            {/* Whiteboard verification */}
            {unlockData.mode === "whiteboard" && (
              <input
                type="text"
                className={`input ${unlockError ? "input-error" : ""}`}
                value={unlockInput}
                onChange={(e) => { setUnlockInput(e.target.value); setUnlockError(""); }}
                placeholder="Type anything..."
                onKeyDown={(e) => e.key === "Enter" && handleUnlock()}
                data-testid="unlock-input"
              />
            )}

            {/* Photo verification */}
            {unlockData.mode === "photo" && (
              <div className="photo-upload-gate" data-testid="photo-upload-gate">
                <label className="photo-upload-label">
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="photo-upload-input"
                    onChange={(e) => { 
                      if (e.target.files && e.target.files[0]) {
                        setPhotoFile(e.target.files[0]); 
                        setUnlockError(""); 
                      }
                    }}
                    data-testid="photo-file-input"
                  />
                  <div className={`photo-upload-box ${photoFile ? 'has-photo' : ''}`}>
                    {photoFile ? (
                      <>
                        <img src={URL.createObjectURL(photoFile)} alt="Uploaded" className="photo-preview" />
                        <span className="photo-filename">{photoFile.name}</span>
                      </>
                    ) : (
                      <>
                        <Icons.Camera />
                        <span>Tap to take a photo</span>
                      </>
                    )}
                  </div>
                </label>
              </div>
            )}

            {/* Ranking verification */}
            {unlockData.mode === "ranking" && rankingItems.length > 0 && (
              <DragDropContext onDragEnd={handleRankingDragEnd}>
                <Droppable droppableId="ranking-player">
                  {(provided) => (
                    <div className="ranking-list" ref={provided.innerRef} {...provided.droppableProps} data-testid="ranking-list">
                      {rankingItems.map((item, index) => (
                        <Draggable key={item.id} draggableId={item.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`ranking-item ${snapshot.isDragging ? 'dragging' : ''}`}
                              data-testid={`ranking-item-${index}`}
                            >
                              <span className="ranking-position">{index + 1}</span>
                              <span className="ranking-text">{item.text}</span>
                              <Icons.Grip />
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
            )}
            
            {/* Timer verification */}
            {unlockData.mode === "timer" && (
              <div className="timer-gate" data-testid="timer-gate">
                <div className="timer-circle">
                  <svg viewBox="0 0 100 100" className="timer-svg">
                    <circle cx="50" cy="50" r="45" className="timer-track" />
                    <circle cx="50" cy="50" r="45" className="timer-progress" 
                      style={{ strokeDasharray: `${2 * Math.PI * 45}`, strokeDashoffset: `${2 * Math.PI * 45 * (1 - timerSeconds / (unlockData.timerDuration || 60))}` }} 
                    />
                  </svg>
                  <span className="timer-number">{timerSeconds}</span>
                </div>
                <p className="timer-label">{timerSeconds > 0 ? "Be here. Be present." : "Ready."}</p>
              </div>
            )}

            {/* Checklist verification */}
            {unlockData.mode === "checklist" && unlockData.mcOptions && (
              <div className="checklist-gate" data-testid="checklist-gate">
                {unlockData.mcOptions.map((item, index) => (
                  <label key={index} className={`checklist-item ${checkedItems.has(index) ? 'checked' : ''}`} data-testid={`checklist-item-${index}`}>
                    <input 
                      type="checkbox" 
                      checked={checkedItems.has(index)}
                      onChange={() => {
                        setCheckedItems(prev => {
                          const next = new Set(prev);
                          if (next.has(index)) next.delete(index);
                          else next.add(index);
                          return next;
                        });
                        setUnlockError("");
                      }}
                    />
                    <span className="checklist-check">{checkedItems.has(index) ? '✓' : ''}</span>
                    <span className="checklist-text">{item}</span>
                  </label>
                ))}
              </div>
            )}

            {/* Shake verification */}
            {unlockData.mode === "shake" && (
              <div className="shake-gate" data-testid="shake-gate">
                <div className={`shake-icon ${shakeDetected ? 'detected' : ''}`}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="7" y="1" width="10" height="22" rx="2" ry="2"/>
                    <path d="M4 5l-2 1"/><path d="M4 19l-2-1"/>
                    <path d="M20 5l2 1"/><path d="M20 19l2-1"/>
                  </svg>
                </div>
                <p className="shake-label">{shakeDetected ? "Got it." : "Shake your phone to continue"}</p>
                <button onClick={() => setShakeDetected(true)} className="btn btn-secondary btn-sm shake-fallback" data-testid="shake-tap-btn">
                  Or tap here
                </button>
              </div>
            )}

            {unlockError && <p className="error-message">{unlockError}</p>}
            {unlockSuccess && <p className="success-message">{unlockSuccess}</p>}
            
            <div className="unlock-actions">
              {unlockData.mode !== "timer" && unlockData.mode !== "shake" && (
                <button onClick={handleUnlock} className="btn btn-primary" data-testid="unlock-submit">
                  Continue
                </button>
              )}
              
              {unlockData.hintText && !unlockData.autoShowHint && (
                <button 
                  onClick={() => setShowHintPage(true)} 
                  className="btn btn-hint"
                  data-testid="show-hint-btn"
                >
                  Need a hint?
                </button>
              )}
            </div>
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
      </footer>
    </div>
  );
};

export default UnlockGate;
