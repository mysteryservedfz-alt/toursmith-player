import React from 'react';

const PlayerWelcome = ({ tour, getBackgroundStyle, startTour, gpsStatus, gpsError, gpsDistance, checkGpsLocation, Icons }) => {
  const gpsRequired = tour.welcomeGpsEnabled && tour.welcomeGpsLat && tour.welcomeGpsLng;
  const canStart = !gpsRequired || gpsStatus === 'allowed';

  return (
    <div className="player-theme player-layout welcome-layout" data-testid="player-welcome" style={getBackgroundStyle()}>
      <div className="welcome-screen">
        <div className="welcome-content">
          <div className="welcome-brand-logo">
            <img 
              src="https://customer-assets.emergentagent.com/job_ba20b70d-7313-45de-8dec-281984409fc5/artifacts/s0alxsv9_color%20logo.png" 
              alt="Mystery Served" 
            />
          </div>
          
          {tour.welcomeImageUrl && (
            <div className="welcome-image">
              <img src={tour.welcomeImageUrl} alt={tour.welcomeTitle || 'Welcome'} />
            </div>
          )}
          <h1 className="welcome-title">{tour.welcomeTitle || tour.title}</h1>
          {tour.welcomeBody && (
            <div className="welcome-body" dangerouslySetInnerHTML={{ __html: tour.welcomeBody }} />
          )}
          {tour.welcomeAudioUrl && (
            <div className="audio-player welcome-audio">
              <audio controls src={tour.welcomeAudioUrl}>
                Your browser does not support audio.
              </audio>
            </div>
          )}
          
          {gpsRequired && (
            <div className="gps-check-section" data-testid="gps-check-section">
              {gpsStatus === 'idle' && (
                <div className="gps-prompt">
                  <div className="gps-icon-large">📍</div>
                  <p className="gps-message">This tour requires you to be at the starting location</p>
                  <p className="gps-sublabel">Within {tour.welcomeGpsRadiusMeters || 100}m of the start point</p>
                  <button 
                    onClick={checkGpsLocation} 
                    className="btn btn-secondary gps-check-btn"
                    data-testid="check-location-btn"
                  >
                    <Icons.Navigation /> Check My Location
                  </button>
                </div>
              )}
              
              {gpsStatus === 'checking' && (
                <div className="gps-checking">
                  <div className="gps-spinner"></div>
                  <p className="gps-message">Getting your location...</p>
                </div>
              )}
              
              {gpsStatus === 'allowed' && (
                <div className="gps-success">
                  <div className="gps-icon-large success">✓</div>
                  <p className="gps-message">You're at the right location!</p>
                  {gpsDistance !== null && (
                    <p className="gps-distance">You're {gpsDistance}m from the start point</p>
                  )}
                </div>
              )}
              
              {gpsStatus === 'too_far' && (
                <div className="gps-too-far">
                  <div className="gps-icon-large warning">⚠️</div>
                  <p className="gps-message">You're too far from the starting location</p>
                  {gpsDistance !== null && (
                    <p className="gps-distance">
                      You're {gpsDistance}m away (need to be within {tour.welcomeGpsRadiusMeters || 100}m)
                    </p>
                  )}
                  <button 
                    onClick={checkGpsLocation} 
                    className="btn btn-secondary gps-retry-btn"
                    data-testid="retry-location-btn"
                  >
                    <Icons.Navigation /> Check Again
                  </button>
                </div>
              )}
              
              {(gpsStatus === 'denied' || gpsStatus === 'error') && (
                <div className="gps-error">
                  <div className="gps-icon-large error">⚠️</div>
                  <p className="gps-message">{gpsError}</p>
                  <button 
                    onClick={checkGpsLocation} 
                    className="btn btn-secondary gps-retry-btn"
                    data-testid="retry-location-btn"
                  >
                    Try Again
                  </button>
                </div>
              )}
            </div>
          )}
          
          <button 
            onClick={startTour} 
            className={`btn btn-primary btn-lg welcome-start-btn ${!canStart ? 'disabled' : ''}`}
            disabled={!canStart}
            data-testid="start-tour-btn"
          >
            {tour.welcomeButtonLabel || 'Start Tour'}
          </button>
          
          {!canStart && gpsStatus !== 'idle' && gpsStatus !== 'checking' && (
            <p className="gps-hint">Complete the location check above to start</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default PlayerWelcome;
