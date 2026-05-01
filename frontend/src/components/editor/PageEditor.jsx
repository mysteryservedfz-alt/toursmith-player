import React, { useState, useEffect, useRef } from 'react';
import Icons from '../Icons';
import ClearableInput from './ClearableInput';
import AccordionSection from './AccordionSection';
import DeleteConfirmModal from './DeleteConfirmModal';
import GalleryUrlsEditor from './GalleryUrlsEditor';

const PageEditor = ({ page, stopUnlockMode, stopAnswer, onUpdate, onDelete, onDuplicate, onBack }) => {
  const [openSections, setOpenSections] = useState({});
  const [localTitle, setLocalTitle] = useState(page.title || "");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const saveTimeoutRef = useRef(null);

  useEffect(() => {
    setLocalTitle(page.title || "");
  }, [page.id]);

  const toggleSection = (section) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const handleTitleChange = (value) => {
    setLocalTitle(value);
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(() => {
      onUpdate({ title: value });
    }, 300);
  };

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  const handleDelete = () => {
    setShowMenu(false);
    setShowDeleteModal(true);
  };

  const handleDuplicate = () => {
    setShowMenu(false);
    onDuplicate();
  };

  const confirmDelete = () => {
    setShowDeleteModal(false);
    onDelete();
  };

  const getDisplayUnlockMode = (mode) => {
    switch(mode) {
      case "continue": return "Continue";
      case "text": return "Text";
      case "multiple_choice": return "Multiple Choice";
      case "whiteboard": return "Whiteboard";
      case "photo": return "Photo";
      case "ranking": return "Ranking";
      case "timer": return "Timer";
      case "checklist": return "Checklist";
      case "shake": return "Shake";
      default: return mode;
    }
  };

  const addMcOption = () => {
    const currentOptions = page.mcOptions || [];
    onUpdate({ mcOptions: [...currentOptions, ''] });
  };

  const updateMcOption = (index, value) => {
    const newOptions = [...(page.mcOptions || [])];
    newOptions[index] = value;
    onUpdate({ mcOptions: newOptions });
  };

  const removeMcOption = (index) => {
    const newOptions = (page.mcOptions || []).filter((_, i) => i !== index);
    let newCorrectIndex = page.mcCorrectIndex;
    if (newCorrectIndex !== null && newCorrectIndex !== undefined) {
      if (index === newCorrectIndex) {
        newCorrectIndex = null;
      } else if (index < newCorrectIndex) {
        newCorrectIndex = newCorrectIndex - 1;
      }
    }
    onUpdate({ mcOptions: newOptions.length > 0 ? newOptions : null, mcCorrectIndex: newCorrectIndex });
  };

  const hasImage = !!(page.imageUrl || (page.galleryUrls && page.galleryUrls.length > 0));
  const hasEmbed = !!page.embedUrl;
  const hasAudio = !!page.audioUrl;
  const hasBroadcast = !!(page.ctaLabel || page.ctaUrl);
  const hasUnlock = page.unlockMode && page.unlockMode !== 'continue' && page.unlockMode !== '';
  const hasTask = !!page.taskInstructions;
  const hasHint = !!page.hintText;
  const hasMedia = !!page.mediaUrl;

  return (
    <div className="content-editor" data-testid="page-editor">
      <div className="editor-top-actions">
        <button onClick={onBack} className="btn btn-back-to-stop" data-testid="back-to-stop-btn">
          <Icons.ChevronLeft /> Back to Stop
        </button>
        <button onClick={handleDelete} className="btn-delete-inline" data-testid="delete-page-inline-btn" title="Delete this page">
          <Icons.Trash /> Delete Page
        </button>
      </div>

      <div className="editor-content-header">
        <h2>Edit Page</h2>
        <div className="overflow-menu-container">
          <button 
            className="btn btn-ghost btn-sm overflow-trigger" 
            onClick={() => setShowMenu(!showMenu)}
            data-testid="page-menu-btn"
          >
            ⋯
          </button>
          {showMenu && (
            <div className="overflow-menu">
              <button onClick={handleDuplicate} className="overflow-menu-item" data-testid="duplicate-page-btn">
                <Icons.Copy /> Duplicate Page
              </button>
              <button onClick={handleDelete} className="overflow-menu-item danger" data-testid="delete-page-btn">
                <Icons.Trash /> Delete Page
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="editor-section main-text-section">
        <div className="form-group">
          <label className="form-label">Title</label>
          <input type="text" className="input" value={localTitle} onChange={(e) => handleTitleChange(e.target.value)} placeholder="Page title" data-testid="page-title-input" />
        </div>
        <div className="form-group">
          <label className="form-label">Subtitle</label>
          <input type="text" className="input" value={page.subtitle || ""} onChange={(e) => onUpdate({ subtitle: e.target.value || null })} placeholder="Optional subtitle" data-testid="page-subtitle-input" />
        </div>
        <div className="form-group">
          <label className="form-label">Story Text</label>
          <textarea className="input body-textarea" value={page.content || ""} onChange={(e) => onUpdate({ content: e.target.value })} placeholder="The narrative shown to players..." data-testid="page-content-input" />
        </div>
        <div className="form-group">
          <label className="form-label">Story Text 2</label>
          <textarea className="input" value={page.body2 || ""} onChange={(e) => onUpdate({ body2: e.target.value || null })} placeholder="Optional secondary text" data-testid="page-body2-input" />
        </div>
        <div className="form-group">
          <label className="form-label">Text Color</label>
          <div className="color-picker-container">
            <div className="color-presets">
              {["#1a1a1a", "#ffffff", "#333333", "#666666", "#f5f5f5", "#d4af37"].map(color => (
                <button
                  key={color}
                  type="button"
                  className={`color-preset ${page.textColor === color ? 'selected' : ''}`}
                  style={{ backgroundColor: color, border: color === '#ffffff' || color === '#f5f5f5' ? '1px solid #ccc' : 'none' }}
                  onClick={() => onUpdate({ textColor: color })}
                />
              ))}
            </div>
            <div className="color-custom">
              <input type="color" value={page.textColor || "#1a1a1a"} onChange={(e) => onUpdate({ textColor: e.target.value })} />
              <span className="color-value">{page.textColor || "#1a1a1a"}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="accordion-container">
        <AccordionSection title="On-Site Task / Instructions" icon={<Icons.FileText />} isOpen={openSections.task} onToggle={() => toggleSection('task')} hasContent={hasTask} onClear={() => onUpdate({ taskInstructions: null })}>
          <div className="form-group">
            <label className="form-label">Task Instructions</label>
            <textarea className="input body-textarea" value={page.taskInstructions || ""} onChange={(e) => onUpdate({ taskInstructions: e.target.value || null })} placeholder="e.g. 'Ask the server for the Blue Envelope'..." data-testid="page-task-input" />
            <p className="text-small">Instructions for physical tasks at this location</p>
          </div>
        </AccordionSection>

        <AccordionSection title="Media" icon={<Icons.Video />} isOpen={openSections.media} onToggle={() => toggleSection('media')} hasContent={hasMedia} onClear={() => onUpdate({ mediaUrl: null, mediaType: null })}>
          <div className="form-group">
            <label className="form-label">Media Type</label>
            <div className="media-type-buttons">
              <button type="button" className={`media-type-btn ${page.mediaType === 'image' ? 'active' : ''}`} onClick={() => onUpdate({ mediaType: 'image' })}>IMAGE</button>
              <button type="button" className={`media-type-btn ${page.mediaType === 'video' ? 'active' : ''}`} onClick={() => onUpdate({ mediaType: 'video' })}>VIDEO</button>
              <button type="button" className={`media-type-btn ${page.mediaType === 'youtube' ? 'active' : ''}`} onClick={() => onUpdate({ mediaType: 'youtube' })}>YOUTUBE</button>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Media URL</label>
            <input type="url" className="input" value={page.mediaUrl || ""} onChange={(e) => onUpdate({ mediaUrl: e.target.value || null })} placeholder="https://..." data-testid="page-media-url-input" />
          </div>
        </AccordionSection>

        <AccordionSection title="Add Image / Gallery" icon={<Icons.Image />} isOpen={openSections.image} onToggle={() => toggleSection('image')} hasContent={hasImage} onClear={() => onUpdate({ imageUrl: null, imageAlt: null, galleryUrls: [] })}>
          <div className="form-group">
            <label className="form-label">Background Image (Optional)</label>
            <ClearableInput type="url" value={page.imageUrl} onChange={(val) => onUpdate({ imageUrl: val })} onClear={() => onUpdate({ imageUrl: null })} placeholder="Custom background URL for this page..." data-testid="page-image-url-input" />
          </div>
          <div className="form-group">
            <label className="form-label">Image Alt Text</label>
            <input type="text" className="input" value={page.imageAlt || ""} onChange={(e) => onUpdate({ imageAlt: e.target.value || null })} placeholder="Describe the image" data-testid="page-image-alt-input" />
          </div>
          <div className="form-group">
            <label className="form-label">Gallery Images</label>
            <GalleryUrlsEditor urls={page.galleryUrls} onChange={(urls) => onUpdate({ galleryUrls: urls })} />
          </div>
        </AccordionSection>

        <AccordionSection title="Add Embed (YouTube / Map)" icon={<Icons.Video />} isOpen={openSections.embed} onToggle={() => toggleSection('embed')} hasContent={hasEmbed} onClear={() => onUpdate({ embedUrl: null, embedCaption: null })}>
          <div className="form-group">
            <label className="form-label">Embed URL</label>
            <ClearableInput type="url" value={page.embedUrl} onChange={(val) => onUpdate({ embedUrl: val })} onClear={() => onUpdate({ embedUrl: null })} placeholder="YouTube, Vimeo, or Google Maps URL" data-testid="page-embed-url-input" />
            <p className="text-small">Allowed: YouTube, Vimeo, Google Maps</p>
          </div>
          <div className="form-group">
            <label className="form-label">Caption</label>
            <input type="text" className="input" value={page.embedCaption || ""} onChange={(e) => onUpdate({ embedCaption: e.target.value || null })} placeholder="Optional caption" data-testid="page-embed-caption-input" />
          </div>
        </AccordionSection>

        <AccordionSection title="Add Audio" icon={<Icons.Audio />} isOpen={openSections.audio} onToggle={() => toggleSection('audio')} hasContent={hasAudio} onClear={() => onUpdate({ audioUrl: null })}>
          <div className="form-group">
            <label className="form-label">Audio URL</label>
            <ClearableInput type="url" value={page.audioUrl} onChange={(val) => onUpdate({ audioUrl: val })} onClear={() => onUpdate({ audioUrl: null })} placeholder="https://example.com/audio.mp3" data-testid="page-audio-url-input" />
          </div>
          {page.audioUrl && (
            <div className="audio-preview">
              <audio controls src={page.audioUrl} />
            </div>
          )}
        </AccordionSection>

        <AccordionSection title="Broadcast" icon={<Icons.Broadcast />} isOpen={openSections.broadcast} onToggle={() => toggleSection('broadcast')} hasContent={hasBroadcast} onClear={() => onUpdate({ ctaLabel: null, ctaUrl: null })}>
          <div className="form-group">
            <label className="form-label">Button Label</label>
            <input type="text" className="input" value={page.ctaLabel || ""} onChange={(e) => onUpdate({ ctaLabel: e.target.value || null })} placeholder="Learn More" data-testid="page-cta-label-input" />
          </div>
          <div className="form-group">
            <label className="form-label">Button URL</label>
            <ClearableInput type="url" value={page.ctaUrl} onChange={(val) => onUpdate({ ctaUrl: val })} onClear={() => onUpdate({ ctaUrl: null })} placeholder="https://example.com" data-testid="page-cta-url-input" />
          </div>
        </AccordionSection>

        <AccordionSection title="Hint" icon={<Icons.HelpCircle />} isOpen={openSections.hint} onToggle={() => toggleSection('hint')} hasContent={hasHint}>
          <div className="form-group">
            <label className="form-label">Hint Text</label>
            <textarea className="input body-textarea" value={page.hintText || ""} onChange={(e) => onUpdate({ hintText: e.target.value || null })} placeholder="A helpful hint for players who get stuck..." data-testid="page-hint-input" />
          </div>
          <div className="form-group">
            <label className="toggle-label">
              <input type="checkbox" checked={page.autoShowHint || false} onChange={(e) => onUpdate({ autoShowHint: e.target.checked })} data-testid="page-auto-hint-toggle" />
              <span className="toggle-switch"></span>
              <span>Auto-Show Hints</span>
            </label>
            <p className="text-small">Automatically show hint when player arrives</p>
          </div>
          <div className="form-group">
            <label className="form-label">Custom Wrong Answer Message</label>
            <input type="text" className="input" value={page.wrongAnswerMessage || ""} onChange={(e) => onUpdate({ wrongAnswerMessage: e.target.value || null })} placeholder="Not quite. Take another look..." data-testid="page-wrong-msg-input" />
            <p className="text-small">Shown when player gives wrong answer. Leave blank for default.</p>
          </div>
          <div className="form-group">
            <label className="form-label">Custom Correct Answer Message</label>
            <input type="text" className="input" value={page.correctAnswerMessage || ""} onChange={(e) => onUpdate({ correctAnswerMessage: e.target.value || null })} placeholder="There it is." data-testid="page-correct-msg-input" />
            <p className="text-small">Shown when player gets it right. Leave blank for default.</p>
          </div>
        </AccordionSection>

        <AccordionSection title="Verification" icon={<Icons.Lock />} isOpen={openSections.unlock} onToggle={() => toggleSection('unlock')} hasContent={hasUnlock}>
          <p className="text-small helper-text">Overrides the stop setting for this page only</p>
          
          <div className="form-group">
            <label className="toggle-label">
              <input type="checkbox" checked={page.storyMode || false} onChange={(e) => onUpdate({ storyMode: e.target.checked })} data-testid="page-story-mode-toggle" />
              <span className="toggle-switch"></span>
              <span>Story Mode (No Verification)</span>
            </label>
            <p className="text-small">Skip verification - players just read and continue</p>
          </div>

          {!page.storyMode && (
            <>
              <div className="form-group">
                <label className="form-label">Verification Type</label>
                <div className="verification-type-buttons">
                  <button type="button" className={`verification-type-btn ${!page.unlockMode || page.unlockMode === '' ? 'active' : ''}`} onClick={() => onUpdate({ unlockMode: null })}>INHERIT</button>
                  <button type="button" className={`verification-type-btn ${page.unlockMode === 'text' ? 'active' : ''}`} onClick={() => onUpdate({ unlockMode: 'text' })}>TEXT</button>
                  <button type="button" className={`verification-type-btn ${page.unlockMode === 'multiple_choice' ? 'active' : ''}`} onClick={() => onUpdate({ unlockMode: 'multiple_choice' })}>MULTIPLE CHOICE</button>
                  <button type="button" className={`verification-type-btn ${page.unlockMode === 'whiteboard' ? 'active' : ''}`} onClick={() => onUpdate({ unlockMode: 'whiteboard' })}>WHITEBOARD</button>
                  <button type="button" className={`verification-type-btn ${page.unlockMode === 'photo' ? 'active' : ''}`} onClick={() => onUpdate({ unlockMode: 'photo' })}>PHOTO</button>
                  <button type="button" className={`verification-type-btn ${page.unlockMode === 'ranking' ? 'active' : ''}`} onClick={() => onUpdate({ unlockMode: 'ranking' })}>RANKING</button>
                  <button type="button" className={`verification-type-btn ${page.unlockMode === 'timer' ? 'active' : ''}`} onClick={() => onUpdate({ unlockMode: 'timer', answer: '60' })}>TIMER</button>
                  <button type="button" className={`verification-type-btn ${page.unlockMode === 'checklist' ? 'active' : ''}`} onClick={() => onUpdate({ unlockMode: 'checklist' })}>CHECKLIST</button>
                  <button type="button" className={`verification-type-btn ${page.unlockMode === 'shake' ? 'active' : ''}`} onClick={() => onUpdate({ unlockMode: 'shake' })}>SHAKE</button>
                </div>
                {(!page.unlockMode || page.unlockMode === '') && (
                  <p className="text-small">Inheriting from stop: {getDisplayUnlockMode(stopUnlockMode)}</p>
                )}
              </div>

              {page.unlockMode === 'photo' && (
                <p className="text-small helper-text">Players must upload a photo to proceed. Any photo is accepted.</p>
              )}

              {page.unlockMode === 'ranking' && (
                <div className="form-group">
                  <label className="form-label">Items (enter in correct order — players see them shuffled)</label>
                  <div className="mc-options-editor">
                    {(page.mcOptions || []).map((option, index) => (
                      <div key={index} className="mc-option-row">
                        <span className="ranking-number">{index + 1}</span>
                        <input type="text" className="input" value={option} onChange={(e) => updateMcOption(index, e.target.value)} placeholder={`#${index + 1}`} />
                        <button type="button" onClick={() => removeMcOption(index)} className="btn btn-ghost btn-sm"><Icons.Trash /></button>
                      </div>
                    ))}
                    <button type="button" onClick={addMcOption} className="btn btn-secondary btn-sm"><Icons.Plus /> Add Item</button>
                  </div>
                  <p className="text-small">Players will drag these into the correct order to unlock</p>
                </div>
              )}

              {page.unlockMode === 'text' && (
                <>
                  <div className="form-group">
                    <label className="form-label">Password / Code</label>
                    <input type="text" className="input" value={page.answer || ""} onChange={(e) => onUpdate({ answer: e.target.value })} placeholder="Required answer" data-testid="page-answer-input" />
                  </div>
                  <div className="form-group">
                    <label className="toggle-label">
                      <input type="checkbox" checked={page.caseInsensitive !== false} onChange={(e) => onUpdate({ caseInsensitive: e.target.checked })} data-testid="page-case-insensitive-toggle" />
                      <span className="toggle-switch"></span>
                      <span>Accept any capitalization</span>
                    </label>
                    <p className="text-small">Recommended ON. Players typing "paris", "PARIS", or "Paris" all work. Turn OFF only if letter case matters to the puzzle.</p>
                  </div>
                </>
              )}

              {page.unlockMode === 'multiple_choice' && (
                <div className="form-group">
                  <label className="form-label">Options</label>
                  <div className="mc-options-editor">
                    {(page.mcOptions || []).map((option, index) => (
                      <div key={index} className="mc-option-row">
                        <label className="mc-correct-radio">
                          <input type="radio" name="page-mc-correct" checked={page.mcCorrectIndex === index} onChange={() => onUpdate({ mcCorrectIndex: index })} />
                          <span className="radio-indicator"></span>
                        </label>
                        <input type="text" className="input" value={option} onChange={(e) => updateMcOption(index, e.target.value)} placeholder={`Option ${index + 1}`} />
                        <button type="button" onClick={() => removeMcOption(index)} className="btn btn-ghost btn-sm"><Icons.Trash /></button>
                      </div>
                    ))}
                    <button type="button" onClick={addMcOption} className="btn btn-secondary btn-sm"><Icons.Plus /> Add Option</button>
                  </div>
                  <p className="text-small">Select the radio button next to the correct answer</p>
                </div>
              )}

              {page.unlockMode === 'whiteboard' && (
                <p className="text-small helper-text">Players can type anything to proceed - no correct answer required</p>
              )}

              {page.unlockMode === 'timer' && (
                <div className="form-group">
                  <label className="form-label">Duration (seconds)</label>
                  <input type="number" className="input" value={page.answer || "60"} onChange={(e) => onUpdate({ answer: e.target.value })} placeholder="60" min="5" max="600" />
                  <p className="text-small">Page auto-unlocks when the countdown reaches zero</p>
                </div>
              )}

              {page.unlockMode === 'checklist' && (
                <div className="form-group">
                  <label className="form-label">Checklist Items</label>
                  <div className="mc-options-editor">
                    {(page.mcOptions || []).map((option, index) => (
                      <div key={index} className="mc-option-row">
                        <span className="ranking-number">{index + 1}</span>
                        <input type="text" className="input" value={option} onChange={(e) => updateMcOption(index, e.target.value)} placeholder={`Task ${index + 1}`} />
                        <button type="button" onClick={() => removeMcOption(index)} className="btn btn-ghost btn-sm"><Icons.Trash /></button>
                      </div>
                    ))}
                    <button type="button" onClick={addMcOption} className="btn btn-secondary btn-sm"><Icons.Plus /> Add Task</button>
                  </div>
                  <p className="text-small">Players check off each task to unlock. All must be checked.</p>
                </div>
              )}

              {page.unlockMode === 'shake' && (
                <p className="text-small helper-text">Players shake their phone to unlock. On desktop, they tap a button instead.</p>
              )}
            </>
          )}
        </AccordionSection>

        <AccordionSection title="Page Skin (Background)" icon={<Icons.Image />} isOpen={openSections.skin} onToggle={() => toggleSection('skin')} hasContent={!!page.skinImageUrl} onClear={() => onUpdate({ skinImageUrl: null })}>
          <div className="form-group">
            <label className="form-label">Skin Image URL</label>
            <p className="text-small helper-text">Overrides the tour's default skin for this page only</p>
            <ClearableInput
              type="text"
              className="input"
              value={page.skinImageUrl || ""}
              onChange={(eOrValue) => {
                const value = typeof eOrValue === 'string' ? eOrValue : eOrValue?.target?.value;
                onUpdate({ skinImageUrl: value || null });
              }}
              onClear={() => onUpdate({ skinImageUrl: null })}
              placeholder="https://example.com/page-background.jpg"
              data-testid="page-skin-url-input"
            />
            {page.skinImageUrl && (
              <div className="skin-preview" style={{ marginTop: '0.5rem' }}>
                <img 
                  src={page.skinImageUrl} 
                  alt="Skin preview" 
                  style={{ maxWidth: '100%', maxHeight: '100px', borderRadius: '8px', objectFit: 'cover' }} 
                />
              </div>
            )}
          </div>
        </AccordionSection>
      </div>

      <DeleteConfirmModal 
        isOpen={showDeleteModal} 
        onClose={() => setShowDeleteModal(false)} 
        onConfirm={confirmDelete}
        itemType="Page"
      />
    </div>
  );
};

export default PageEditor;
