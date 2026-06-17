import React, { useState, useEffect, useCallback, useRef } from 'react';
import { authAxios, useAuth } from './authContext';
import Icons from './Icons';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const ImageLibrary = ({ onClose }) => {
  const { token } = useAuth();
  const api = authAxios(token);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const fetchImages = useCallback(async () => {
    try {
      const res = await api.get('/library/images');
      setImages(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchImages(); }, []);

  const buildAbsUrl = (relPath) => `${BACKEND_URL}${relPath}`;

  const uploadFiles = async (files) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    let okCount = 0;
    let errCount = 0;
    for (const f of files) {
      try {
        const fd = new FormData();
        fd.append('file', f);
        await api.post('/library/upload', fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        okCount += 1;
      } catch (err) {
        errCount += 1;
        console.error('Upload failed for', f.name, err);
      }
    }
    setUploading(false);
    if (errCount > 0) alert(`${okCount} uploaded, ${errCount} failed. Check file types (JPG/PNG/GIF/WebP/SVG) and size (max 10 MB).`);
    fetchImages();
  };

  const handleFileInput = (e) => {
    uploadFiles(Array.from(e.target.files || []));
    e.target.value = '';
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files || []).filter(f => f.type.startsWith('image/'));
    uploadFiles(files);
  };

  const copyUrl = async (img) => {
    const fullUrl = buildAbsUrl(img.url);
    try { await navigator.clipboard.writeText(fullUrl); } catch (e) { console.error(e); }
    setCopiedId(img.id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const deleteImage = async (img) => {
    if (!window.confirm(`Delete "${img.filename}"?\n\nThis breaks any tour using this image URL. Make sure no tour is using it.`)) return;
    try {
      await api.delete(`/library/images/${img.id}`);
      fetchImages();
    } catch (err) {
      alert('Delete failed: ' + (err.response?.data?.detail || err.message));
    }
  };

  return (
    <div className="merge-modal-backdrop" onClick={onClose} data-testid="library-modal-backdrop">
      <div className="merge-modal library-modal" onClick={(e) => e.stopPropagation()} data-testid="library-modal">
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1rem'}}>
          <h2 style={{margin:0}}>Image Library</h2>
          <button onClick={onClose} className="btn-icon" data-testid="library-close-btn" title="Close" style={{fontSize:'1.5rem', lineHeight:1}}>×</button>
        </div>

        <div
          className={`library-dropzone ${dragOver ? 'drag-over' : ''}`}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          data-testid="library-dropzone"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileInput}
            style={{ display: 'none' }}
            data-testid="library-file-input"
          />
          {uploading ? (
            <div>Uploading…</div>
          ) : (
            <div>
              <div style={{fontSize:'1rem', fontWeight:600, marginBottom:'0.25rem'}}>+ Upload Images</div>
              <div style={{fontSize:'0.75rem', color:'#6b7280'}}>Click or drag photos here • JPG, PNG, GIF, WebP, SVG • Max 10 MB each</div>
            </div>
          )}
        </div>

        <div style={{marginTop:'1rem'}}>
          {loading ? (
            <p style={{textAlign:'center', color:'#6b7280'}}>Loading…</p>
          ) : images.length === 0 ? (
            <p style={{textAlign:'center', color:'#6b7280', padding:'2rem'}}>No images yet. Upload your first photo above.</p>
          ) : (
            <div className="library-grid" data-testid="library-grid">
              {images.map((img) => (
                <div key={img.id} className="library-item" data-testid={`library-image-${img.id}`}>
                  <div className="library-thumb">
                    <img src={buildAbsUrl(img.url)} alt={img.filename} loading="lazy" />
                  </div>
                  <div className="library-meta">
                    <div className="library-filename" title={img.filename}>{img.filename}</div>
                    <div className="library-actions">
                      <button
                        className={`btn-copy-link ${copiedId === img.id ? 'copied' : ''}`}
                        onClick={() => copyUrl(img)}
                        data-testid={`copy-image-url-${img.id}`}
                      >
                        {copiedId === img.id ? <Icons.Check /> : <Icons.Link />}
                        <span style={{whiteSpace:'nowrap'}}>{copiedId === img.id ? 'Copied!' : 'Copy URL'}</span>
                      </button>
                      <button
                        className="btn-icon danger"
                        onClick={() => deleteImage(img)}
                        data-testid={`delete-image-${img.id}`}
                        title="Delete"
                      >
                        <Icons.Trash />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <p style={{fontSize:'0.75rem', color:'#9ca3af', marginTop:'1rem', textAlign:'center'}}>
          URLs are permanent and public — paste them directly into any tour, page, or external site.
        </p>
      </div>
    </div>
  );
};

export default ImageLibrary;
