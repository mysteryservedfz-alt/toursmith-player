import React, { useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Circle, useMapEvents } from 'react-leaflet';
import Icons from '../Icons';
import ClearableInput from './ClearableInput';

const MapClickHandler = ({ onClick }) => {
  useMapEvents({
    click: (e) => onClick(e.latlng.lat, e.latlng.lng)
  });
  return null;
};

const WelcomeEditor = ({ tour, onUpdate }) => {
  const [gettingLocation, setGettingLocation] = useState(false);
  const [locationError, setLocationError] = useState(null);
  const mapRef = useRef(null);

  const defaultCenter = [40.7128, -74.0060];
  const mapCenter = tour.welcomeGpsLat && tour.welcomeGpsLng 
    ? [tour.welcomeGpsLat, tour.welcomeGpsLng] 
    : defaultCenter;

  const handleMapClick = (lat, lng) => {
    onUpdate("welcomeGpsLat", lat);
    onUpdate("welcomeGpsLng", lng);
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser");
      return;
    }
    
    setGettingLocation(true);
    setLocationError(null);
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        onUpdate("welcomeGpsLat", latitude);
        onUpdate("welcomeGpsLng", longitude);
        setGettingLocation(false);
        
        if (mapRef.current) {
          mapRef.current.setView([latitude, longitude], 16);
        }
      },
      (error) => {
        setGettingLocation(false);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setLocationError("Location access denied. Please enable location permissions.");
            break;
          case error.POSITION_UNAVAILABLE:
            setLocationError("Location information unavailable.");
            break;
          case error.TIMEOUT:
            setLocationError("Location request timed out.");
            break;
          default:
            setLocationError("An unknown error occurred.");
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  return (
    <div className="content-editor" data-testid="welcome-editor">
      <div className="editor-section main-text-section">
        <h2>Tour Settings</h2>
        
        <div className="form-group">
          <label className="form-label">Background Color</label>
          <div className="color-picker-container">
            <div className="color-presets">
              {['#ffffff', '#f8f9fa', '#fff8e7', '#e8f5e9', '#e3f2fd', '#fce4ec', '#f3e5f5', '#1a1a1a'].map(color => (
                <button
                  key={color}
                  type="button"
                  className={`color-preset ${tour.backgroundColor === color ? 'selected' : ''}`}
                  style={{ backgroundColor: color }}
                  onClick={() => onUpdate("backgroundColor", color)}
                  title={color}
                />
              ))}
            </div>
            <div className="color-custom">
              <input
                type="color"
                value={tour.backgroundColor || "#ffffff"}
                onChange={(e) => onUpdate("backgroundColor", e.target.value)}
                className="color-input"
                data-testid="background-color-input"
              />
              <span className="color-value">{tour.backgroundColor || "#ffffff"}</span>
            </div>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Skin Image URL <span className="text-small">(optional)</span></label>
          <p className="text-small helper-text">Background image for the player. Pages can override this.</p>
          <ClearableInput
            type="text"
            className="input"
            value={tour.skinImageUrl || ""}
            onChange={(eOrValue) => {
              const value = typeof eOrValue === 'string' ? eOrValue : eOrValue?.target?.value;
              onUpdate("skinImageUrl", value || null);
            }}
            onClear={() => onUpdate("skinImageUrl", null)}
            placeholder="https://example.com/crystal-background.jpg"
            data-testid="skin-image-url-input"
          />
          {tour.skinImageUrl && (
            <div className="skin-preview" style={{ marginTop: '0.5rem' }}>
              <img 
                src={tour.skinImageUrl} 
                alt="Skin preview" 
                style={{ 
                  maxWidth: '100%', 
                  maxHeight: '120px', 
                  borderRadius: '8px',
                  objectFit: 'cover'
                }} 
              />
            </div>
          )}
        </div>

        <div className="form-group">
          <label className="form-label">Logo URL <span className="text-small">(optional)</span></label>
          <p className="text-small helper-text">Logo for print booklets and branding.</p>
          <ClearableInput
            type="text"
            className="input"
            value={tour.logoUrl || ""}
            onChange={(eOrValue) => {
              const value = typeof eOrValue === 'string' ? eOrValue : eOrValue?.target?.value;
              onUpdate("logoUrl", value || null);
            }}
            onClear={() => onUpdate("logoUrl", null)}
            placeholder="https://example.com/my-logo.png"
            data-testid="logo-url-input"
          />
          {tour.logoUrl && (
            <div className="skin-preview" style={{ marginTop: '0.5rem' }}>
              <img 
                src={tour.logoUrl} 
                alt="Logo preview" 
                style={{ 
                  maxWidth: '160px', 
                  maxHeight: '80px', 
                  objectFit: 'contain'
                }} 
              />
            </div>
          )}
        </div>

        <div className="form-group">
          <label className="toggle-label">
            <input
              type="checkbox"
              checked={tour.allowSkip !== false}
              onChange={(e) => onUpdate("allowSkip", e.target.checked)}
              data-testid="tour-allow-skip-toggle"
            />
            <span className="toggle-switch"></span>
            <span>Show "Stuck? Skip this puzzle" button</span>
          </label>
          <p className="text-small helper-text">Recommended ON. Players who get stuck (or find a puzzle broken) can skip ahead instead of quitting. Turn off only for competitive / pitch runs.</p>
        </div>

        <div className="divider" />
        <h2>Welcome Screen</h2>
        <p className="text-small helper-text">Shown before the tour starts. Leave empty to skip.</p>
        <div className="form-group">
          <label className="form-label">Welcome Title</label>
          <input 
            type="text" 
            className="input" 
            value={tour.welcomeTitle || ""} 
            onChange={(e) => onUpdate("welcomeTitle", e.target.value || null)} 
            placeholder="Welcome to the tour!" 
            data-testid="welcome-title-input" 
          />
        </div>
        <div className="form-group">
          <label className="form-label">Welcome Message</label>
          <textarea 
            className="input body-textarea" 
            value={tour.welcomeBody || ""} 
            onChange={(e) => onUpdate("welcomeBody", e.target.value || null)} 
            placeholder="Describe what visitors will experience..." 
            data-testid="welcome-body-input" 
          />
          <p className="text-small">Supports HTML formatting</p>
        </div>
        <div className="form-group">
          <label className="form-label">Welcome Image URL</label>
          <ClearableInput 
            type="url" 
            value={tour.welcomeImageUrl} 
            onChange={(val) => onUpdate("welcomeImageUrl", val)} 
            onClear={() => onUpdate("welcomeImageUrl", null)}
            placeholder="https://example.com/welcome-image.jpg" 
            data-testid="welcome-image-input" 
          />
        </div>
        {tour.welcomeImageUrl && (
          <div className="image-preview">
            <img src={tour.welcomeImageUrl} alt="Welcome preview" />
            <button 
              type="button" 
              className="btn btn-delete-media"
              onClick={() => onUpdate("welcomeImageUrl", null)}
              title="Remove image"
            >
              <Icons.Trash /> Remove Image
            </button>
          </div>
        )}
        <div className="form-group">
          <label className="form-label">Audio URL (optional)</label>
          <ClearableInput 
            type="url" 
            value={tour.welcomeAudioUrl} 
            onChange={(val) => onUpdate("welcomeAudioUrl", val)} 
            onClear={() => onUpdate("welcomeAudioUrl", null)}
            placeholder="https://example.com/welcome-audio.mp3" 
            data-testid="welcome-audio-input" 
          />
        </div>
        {tour.welcomeAudioUrl && (
          <div className="audio-preview">
            <audio controls src={tour.welcomeAudioUrl} />
            <button 
              type="button" 
              className="btn btn-delete-media"
              onClick={() => onUpdate("welcomeAudioUrl", null)}
              title="Remove audio"
            >
              <Icons.Trash /> Remove Audio
            </button>
          </div>
        )}
        <div className="form-group">
          <label className="form-label">Button Label</label>
          <input 
            type="text" 
            className="input" 
            value={tour.welcomeButtonLabel || ""} 
            onChange={(e) => onUpdate("welcomeButtonLabel", e.target.value || null)} 
            placeholder="Start Tour" 
            data-testid="welcome-button-label-input" 
          />
          <p className="text-small">Default: "Start Tour"</p>
        </div>

        <div className="divider" />
        <h3 className="section-label"><Icons.MapPin /> GPS Start Location</h3>
        <p className="text-small helper-text">Require players to be at a specific location to start the tour</p>
        
        <div className="form-group">
          <label className="checkbox-label">
            <input 
              type="checkbox" 
              checked={tour.welcomeGpsEnabled || false} 
              onChange={(e) => onUpdate("welcomeGpsEnabled", e.target.checked)} 
              data-testid="welcome-gps-enabled"
            />
            <span>Enable GPS location check</span>
          </label>
        </div>

        {tour.welcomeGpsEnabled && (
          <div className="gps-fields">
            <div className="gps-actions">
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={useMyLocation}
                disabled={gettingLocation}
                data-testid="use-my-location-btn"
              >
                <Icons.Navigation />
                {gettingLocation ? "Getting location..." : "Use My Location"}
              </button>
            </div>
            {locationError && (
              <p className="error-message">{locationError}</p>
            )}

            <div className="gps-map-container" data-testid="gps-map">
              <MapContainer 
                center={mapCenter} 
                zoom={tour.welcomeGpsLat ? 16 : 12} 
                style={{ height: '280px', width: '100%', borderRadius: '8px' }}
                ref={mapRef}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <MapClickHandler onClick={handleMapClick} />
                {tour.welcomeGpsLat && tour.welcomeGpsLng && (
                  <>
                    <Marker position={[tour.welcomeGpsLat, tour.welcomeGpsLng]} />
                    <Circle 
                      center={[tour.welcomeGpsLat, tour.welcomeGpsLng]} 
                      radius={tour.welcomeGpsRadiusMeters || 100}
                      pathOptions={{ color: '#7c3aed', fillColor: '#7c3aed', fillOpacity: 0.2 }}
                    />
                  </>
                )}
              </MapContainer>
              <p className="text-small map-hint">Click on the map to set location, or use the button above</p>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Latitude</label>
                <input 
                  type="number" 
                  step="any"
                  className="input" 
                  value={tour.welcomeGpsLat ?? ""} 
                  onChange={(e) => onUpdate("welcomeGpsLat", e.target.value ? parseFloat(e.target.value) : null)} 
                  placeholder="e.g. 40.7128" 
                  data-testid="welcome-gps-lat"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Longitude</label>
                <input 
                  type="number" 
                  step="any"
                  className="input" 
                  value={tour.welcomeGpsLng ?? ""} 
                  onChange={(e) => onUpdate("welcomeGpsLng", e.target.value ? parseFloat(e.target.value) : null)} 
                  placeholder="e.g. -74.0060" 
                  data-testid="welcome-gps-lng"
                />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Radius (meters) - Bubble Size</label>
              <input 
                type="number" 
                className="input" 
                value={tour.welcomeGpsRadiusMeters ?? 100} 
                onChange={(e) => onUpdate("welcomeGpsRadiusMeters", e.target.value ? parseInt(e.target.value) : 100)} 
                placeholder="100" 
                min="10"
                max="5000"
                data-testid="welcome-gps-radius"
              />
              <p className="text-small">How close players must be to start (10-5000m)</p>
            </div>
          </div>
        )}

        <div className="divider" />
        <h3 className="section-label">🎉 Completion Screen</h3>
        <p className="text-small helper-text">Shown when players finish the tour</p>
        
        <div className="form-group">
          <label className="form-label">Completion Title</label>
          <input 
            type="text" 
            className="input" 
            value={tour.completionTitle || ""} 
            onChange={(e) => onUpdate("completionTitle", e.target.value || null)} 
            placeholder="Tour Complete!" 
            data-testid="completion-title-input" 
          />
        </div>
        <div className="form-group">
          <label className="form-label">Completion Message</label>
          <textarea 
            className="input body-textarea" 
            value={tour.completionBody || ""} 
            onChange={(e) => onUpdate("completionBody", e.target.value || null)} 
            placeholder="Congratulations! You've completed the tour." 
            data-testid="completion-body-input" 
          />
        </div>
        <div className="form-group">
          <label className="form-label">Completion Image URL (optional)</label>
          <ClearableInput 
            type="url" 
            value={tour.completionImageUrl} 
            onChange={(val) => onUpdate("completionImageUrl", val)} 
            onClear={() => onUpdate("completionImageUrl", null)}
            placeholder="https://example.com/celebration.jpg" 
            data-testid="completion-image-input" 
          />
        </div>
        {tour.completionImageUrl && (
          <div className="image-preview">
            <img src={tour.completionImageUrl} alt="Completion preview" />
            <button 
              type="button" 
              className="btn btn-delete-media"
              onClick={() => onUpdate("completionImageUrl", null)}
              title="Remove image"
            >
              <Icons.Trash /> Remove Image
            </button>
          </div>
        )}
        <div className="form-group">
          <label className="form-label">Button Label</label>
          <input 
            type="text" 
            className="input" 
            value={tour.completionButtonLabel || ""} 
            onChange={(e) => onUpdate("completionButtonLabel", e.target.value || null)} 
            placeholder="Back to Start" 
            data-testid="completion-button-label-input" 
          />
        </div>
        <div className="form-group">
          <label className="form-label">Button URL (optional)</label>
          <ClearableInput 
            type="url" 
            value={tour.completionButtonUrl} 
            onChange={(val) => onUpdate("completionButtonUrl", val)} 
            onClear={() => onUpdate("completionButtonUrl", null)}
            placeholder="https://yourwebsite.com/book-now" 
            data-testid="completion-button-url-input" 
          />
          <p className="text-small">Leave empty to go back to tour start. Add a URL to redirect elsewhere (e.g., booking page).</p>
        </div>
      </div>
    </div>
  );
};

export default WelcomeEditor;
