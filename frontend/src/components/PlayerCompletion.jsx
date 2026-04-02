import React from 'react';

const PlayerCompletion = ({ tour, showConfetti, onRestart }) => {
  return (
    <>
      {showConfetti && (
        <div className="confetti-container">
          {[...Array(50)].map((_, i) => (
            <div 
              key={i} 
              className="confetti-piece"
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                backgroundColor: ['#ff6b6b', '#feca57', '#48dbfb', '#ff9ff3', '#54a0ff', '#5f27cd'][i % 6]
              }}
            />
          ))}
        </div>
      )}
      
      <div className="tour-complete-overlay">
        <div className="tour-complete-content">
          {tour.completionImageUrl ? (
            <div className="complete-image">
              <img src={tour.completionImageUrl} alt="Completion" />
            </div>
          ) : (
            <div className="complete-icon">🎉</div>
          )}
          <h2>{tour.completionTitle || "Tour Complete!"}</h2>
          <p>{tour.completionBody || `Congratulations! You've completed the ${tour.title} tour.`}</p>
          {tour.completionButtonUrl ? (
            <a 
              href={tour.completionButtonUrl}
              className="btn btn-primary"
              target="_blank"
              rel="noopener noreferrer"
            >
              {tour.completionButtonLabel || "Continue"}
            </a>
          ) : (
            <button 
              className="btn btn-primary"
              onClick={onRestart}
            >
              {tour.completionButtonLabel || "Back to Start"}
            </button>
          )}
        </div>
      </div>
    </>
  );
};

export default PlayerCompletion;
