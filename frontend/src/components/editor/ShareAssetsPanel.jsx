import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import Icons from '../Icons';

const ShareAssetsPanel = ({ tourId, tourStatus }) => {
  const [copied, setCopied] = useState(false);
  
  const getPlayerUrl = () => {
    const backendUrl = process.env.REACT_APP_BACKEND_URL;
    if (backendUrl) {
      const baseUrl = backendUrl.replace(/\/api\/?$/, '');
      return `${baseUrl}/api/share/${tourId}`;
    }
    return `${window.location.origin}/api/share/${tourId}`;
  };
  const playerUrl = getPlayerUrl();

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(playerUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
      const textArea = document.createElement('textarea');
      textArea.value = playerUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const openPreview = () => {
    window.open(playerUrl, '_blank');
  };

  return (
    <aside className="editor-sidebar share-panel" data-testid="share-assets-panel">
      <div className="panel-header">
        <h3><Icons.QRCode /> Share Assets</h3>
      </div>
      
      <div className="share-panel-content">
        <div className="qr-code-container">
          <div className="qr-code-frame">
            <QRCodeSVG 
              value={playerUrl} 
              size={160} 
              level="M"
              includeMargin={true}
              bgColor="#ffffff"
              fgColor="#000000"
            />
          </div>
          <p className="qr-label">SCANNABLE TOUR LINK</p>
          <p className="qr-sublabel">Ready for print materials</p>
        </div>

        <div className="share-actions">
          <button 
            onClick={copyLink} 
            className="btn btn-share-action"
            data-testid="copy-link-btn"
          >
            {copied ? <><Icons.Check /> Copied!</> : <><Icons.Copy /> Copy Tour Link</>}
          </button>
          <button 
            onClick={openPreview} 
            className="btn btn-share-preview"
            data-testid="preview-btn"
          >
            <Icons.Eye /> Preview as Player
          </button>
        </div>

        {tourStatus !== 'published' && (
          <div className="share-warning">
            <p>⚠️ Draft tour - publish to allow public access</p>
          </div>
        )}

        <div className="player-url-display">
          <label className="form-label">Player URL</label>
          <div className="url-box">
            <code>{playerUrl}</code>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default ShareAssetsPanel;
