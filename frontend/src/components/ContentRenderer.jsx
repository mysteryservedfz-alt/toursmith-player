import React from 'react';

export const isAllowedEmbed = (url) => {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();
    return (
      host.includes('youtube.com') ||
      host.includes('youtu.be') ||
      host.includes('youtube-nocookie.com') ||
      host.includes('vimeo.com') ||
      host.includes('google.com/maps') ||
      host.includes('maps.google.com')
    );
  } catch {
    return false;
  }
};

export const getEmbedUrl = (url) => {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();
    
    if (host.includes('youtube.com') || host.includes('youtu.be') || host.includes('youtube-nocookie.com')) {
      let videoId = null;
      if (host.includes('youtu.be')) {
        videoId = parsed.pathname.slice(1);
      } else {
        videoId = parsed.searchParams.get('v');
      }
      if (videoId) {
        return `https://www.youtube-nocookie.com/embed/${videoId}`;
      }
    }
    
    if (host.includes('vimeo.com')) {
      const match = parsed.pathname.match(/\/(\d+)/);
      if (match) {
        return `https://player.vimeo.com/video/${match[1]}`;
      }
    }
    
    if (host.includes('google.com') && url.includes('/embed')) {
      return url;
    }
    
    return url;
  } catch {
    return url;
  }
};

export const renderContent = (data, isStop = false) => {
  if (!data) return null;
  
  return (
    <>
      {data.subtitle && (
        <p className="player-subtitle">{data.subtitle}</p>
      )}
      
      {data.taskInstructions && (
        <div className="player-task-instructions">
          <div className="task-label">📋 Your Task</div>
          <p>{data.taskInstructions}</p>
        </div>
      )}
      
      {(data.content || data.description) && (
        <div className="player-body">
          {(data.content || data.description || '').split('\n').map((line, i) => (
            <p key={i}>{line}</p>
          ))}
        </div>
      )}
      
      {(data.body2 || data.intro2) && (
        <div className="player-body player-body-secondary">
          {(data.body2 || data.intro2).split('\n').map((line, i) => (
            <p key={i}>{line}</p>
          ))}
        </div>
      )}
      
      {data.mediaUrl && data.mediaType && (
        <div className="player-media">
          {data.mediaType === 'image' && (
            <img src={data.mediaUrl} alt="Media content" loading="lazy" />
          )}
          {data.mediaType === 'video' && (
            <video controls src={data.mediaUrl}>
              Your browser does not support video.
            </video>
          )}
          {data.mediaType === 'youtube' && isAllowedEmbed(data.mediaUrl) && (
            <iframe
              src={getEmbedUrl(data.mediaUrl)}
              title="YouTube video"
              frameBorder="0"
              allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          )}
        </div>
      )}
      
      {data.audioUrl && data.audioUrl.trim() && (
        <div className="audio-player" data-testid={isStop ? "stop-audio-player" : "page-audio-player"}>
          <audio controls src={data.audioUrl}>
            Your browser does not support audio.
          </audio>
        </div>
      )}
      
      {data.imageUrl && data.imageUrl.trim() && (
        <div className="player-image">
          <img src={data.imageUrl} alt={data.imageAlt || ''} loading="lazy" />
        </div>
      )}
      
      {data.galleryUrls && data.galleryUrls.length > 0 && (
        <div className="player-gallery">
          {data.galleryUrls.filter(url => url).map((url, i) => (
            <img key={i} src={url} alt={`Gallery image ${i + 1}`} loading="lazy" />
          ))}
        </div>
      )}
      
      {data.embedUrl && (
        <div className="player-embed">
          {isAllowedEmbed(data.embedUrl) ? (
            <iframe
              src={getEmbedUrl(data.embedUrl)}
              title="Embedded content"
              frameBorder="0"
              allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <a href={data.embedUrl} target="_blank" rel="noopener noreferrer" className="btn btn-secondary">
              View External Content
            </a>
          )}
          {data.embedCaption && (
            <p className="embed-caption">{data.embedCaption}</p>
          )}
        </div>
      )}
      
      {data.ctaUrl && (
        <div className="player-cta">
          <a href={data.ctaUrl} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
            {data.ctaLabel || 'Learn More'}
          </a>
        </div>
      )}
    </>
  );
};
