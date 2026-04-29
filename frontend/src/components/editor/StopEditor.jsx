import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import Icons from '../Icons';
import ClearableInput from './ClearableInput';
import AccordionSection from './AccordionSection';
import DeleteConfirmModal from './DeleteConfirmModal';
import GalleryUrlsEditor from './GalleryUrlsEditor';

const StopEditor = ({ stop, onUpdate, onDelete, onDuplicate, onAddPage, onSelectPage, onDeletePage, onReorderPages }) => {
  const [openSections, setOpenSections] = useState({ pages: true });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const toggleSection = (section) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

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

  const handlePageDragEnd = (result) => {
    if (!result.destination) return;
    const pages = Array.from(stop.pages || []);
    const [removed] = pages.splice(result.source.index, 1);
    pages.splice(result.destination.index, 0, removed);
    const reorderedPages = pages.map((p, idx) => ({ ...p, order: idx }));
    onReorderPages(reorderedPages);
  };

  const addMcOption = () => {
    const currentOptions = stop.mcOptions || [];
    onUpdate({ mcOptions: [...currentOptions, ''] });
  };

  const updateMcOption = (index, value) => {
    const newOptions = [...(stop.mcOptions || [])];
    newOptions[index] = value;
    onUpdate({ mcOptions: newOptions });
  };

  const removeMcOption = (index) => {
    const newOptions = (stop.mcOptions || []).filter((_, i) => i !== index);
    let newCorrectIndex = stop.mcCorrectIndex;
    if (newCorrectIndex !== null && newCorrectIndex !== undefined) {
      if (index === newCorrectIndex) {
        newCorrectIndex = null;
      } else if (index < newCorrectIndex) {
        newCorrectIndex = newCorrectIndex - 1;
      }
    }
    onUpdate({ mcOptions: newOptions.length > 0 ? newOptions : null, mcCorrectIndex: newCorrectIndex });
  };

  const hasImage = !!(stop.imageUrl || (stop.galleryUrls && stop.galleryUrls.length > 0));
  const hasEmbed = !!stop.embedUrl;
  const hasAudio = !!stop.audioUrl;
  const hasBroadcast = !!(stop.ctaLabel || stop.ctaUrl);
  const hasUnlock = stop.unlockMode && stop.unlockMode !== 'continue';
  const hasTask = !!stop.taskInstructions;
  const hasHint = !!stop.hintText;
  const hasMedia = !!stop.mediaUrl;

  return (
    <div className="content-editor" data-testid="stop-editor">
      <div className="editor-content-header">
        <h2>Edit Stop</h2>
        <div className="overflow-menu-container">
          <button 
            className="btn btn-ghost btn-sm overflow-trigger" 
            onClick={() => setShowMenu(!showMenu)}
            data-testid="stop-menu-btn"
          >
            ⋯
          </button>
          {showMenu && (
            <div className="overflow-menu">
              <button 
                onClick={handleDuplicate} 
                className="overflow-menu-item"
                data-testid="duplicate-stop-btn"
              >
                <Icons.Copy /> Duplicate Stop
              </button>
              <button 
                onClick={handleDelete} 
                className="overflow-menu-item danger"
                data-testid="delete-stop-btn"
              >
                <Icons.Trash /> Delete Stop
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="editor-section main-text-section">
        <div className="form-group">
          <label className="form-label">Title</label>
          <input type="text" className="input" value={stop.title || ""} onChange={(e) => onUpdate({ title: e.target.value })} placeholder="Stop title" data-testid="stop-title-input" />
        </div>
        <div className="form-group">
          <label className="form-label">Subtitle</label>
          <input type="text" className="input" value={stop.subtitle || ""} onChange={(e) => onUpdate({ subtitle: e.target.value || null })} placeholder="Optional subtitle" data-testid="stop-subtitle-input" />
        </div>
        <div className="form-group">
          <label className="form-label">Story Text</label>
          <textarea className="input body-textarea" value={stop.description || ""} onChange={(e) => onUpdate({ description: e.target.value })} placeholder="The narrative shown to players..." data-testid="stop-description-input" />
        </div>
        <div className="form-group">
          <label className="form-label">Story Text 2</label>
          <textarea className="input" value={stop.intro2 || ""} onChange={(e) => onUpdate({ intro2: e.target.value || null })} placeholder="Optional secondary text" data-testid="stop-intro2-input" />
        </div>
        <div className="form-group">
          <label className="form-label">Text Color</label>
          <div className="color-picker-container">
            <div className="color-presets">
              {["#1a1a1a", "#ffffff", "#333333", "#666666", "#f5f5f5", "#d4af37"].map(color => (
                <button
                  key={color}
                  type="button"
                  className={`color-preset ${stop.textColor === color ? 'selected' : ''}`}
                  style={{ backgroundColor: color, border: color === '#ffffff' || color === '#f5f5f5' ? '1px solid #ccc' : 'none' }}
                  onClick={() => onUpdate({ textColor: color })}
                />
              ))}
            </div>
            <div className="color-custom">
              <input
                type="color"
                value={stop.textColor || "#1a1a1a"}
                onChange={(e) => onUpdate({ textColor: e.target.value })}
              />
              <span className="color-value">{stop.textColor || "#1a1a1a"}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="accordion-container">
        <AccordionSection title="On-Site Task / Instructions" icon={<Icons.FileText />} isOpen={openSections.task} onToggle={() => toggleSection('task')} hasContent={hasTask} onClear={() => onUpdate({ taskInstructions: null })}>
          <div className="form-group">
            <label className="form-label">Task Instructions</label>
            <textarea className="input body-textarea" value={stop.taskInstructions || ""} onChange={(e) => onUpdate({ taskInstructions: e.target.value || null })} placeholder="e.g. 'Ask the server for the Blue Envelope'..." data-testid="stop-task-input" />
            <p className="text-small">Instructions for physical tasks at this location</p>
          </div>
        </AccordionSection>

        <AccordionSection title="Media" icon={<Icons.Video />} isOpen={openSections.media} onToggle={() => toggleSection('media')} hasContent={hasMedia} onClear={() => onUpdate({ mediaUrl: null, mediaType: null })}>
          <div className="form-group">
            <label className="form-label">Media Type</label>
            <div className="media-type-buttons">
              <button type="button" className={`media-type-btn ${stop.mediaType === 'image' ? 'active' : ''}`} onClick={() => onUpdate({ mediaType: 'image' })}>IMAGE</button>
              <button type="button" className={`media-type-btn ${stop.mediaType === 'video' ? 'active' : ''}`} onClick={() => onUpdate({ mediaType: 'video' })}>VIDEO</button>
              <button type="button" className={`media-type-btn ${stop.mediaType === 'youtube' ? 'active' : ''}`} onClick={() => onUpdate({ mediaType: 'youtube' })}>YOUTUBE</button>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Media URL</label>
            <ClearableInput type="url" value={stop.mediaUrl} onChange={(val) => onUpdate({ mediaUrl: val })} onClear={() => onUpdate({ mediaUrl: null, mediaType: null })} placeholder="https://..." data-testid="stop-media-url-input" />
          </div>
        </AccordionSection>

        <AccordionSection title="Add Image / Gallery" icon={<Icons.Image />} isOpen={openSections.image} onToggle={() => toggleSection('image')} hasContent={hasImage}>
          <div className="form-group">
            <label className="form-label">Background Image (Optional)</label>
            <ClearableInput type="url" value={stop.imageUrl} onChange={(val) => onUpdate({ imageUrl: val })} onClear={() => onUpdate({ imageUrl: null })} placeholder="Custom background URL for this stop..." data-testid="stop-image-url-input" />
          </div>
          <div className="form-group">
            <label className="form-label">Image Alt Text</label>
            <input type="text" className="input" value={stop.imageAlt || ""} onChange={(e) => onUpdate({ imageAlt: e.target.value || null })} placeholder="Describe the image" data-testid="stop-image-alt-input" />
          </div>
          <div className="form-group">
            <label className="form-label">Gallery Images</label>
            <GalleryUrlsEditor urls={stop.galleryUrls} onChange={(urls) => onUpdate({ galleryUrls: urls })} />
          </div>
        </AccordionSection>

        <AccordionSection title="Add Embed (YouTube / Map)" icon={<Icons.Video />} isOpen={openSections.embed} onToggle={() => toggleSection('embed')} hasContent={hasEmbed} onClear={() => onUpdate({ embedUrl: null, embedCaption: null })}>
          <div className="form-group">
            <label className="form-label">Embed URL</label>
            <ClearableInput type="url" value={stop.embedUrl} onChange={(val) => onUpdate({ embedUrl: val })} onClear={() => onUpdate({ embedUrl: null, embedCaption: null })} placeholder="YouTube, Vimeo, or Google Maps URL" data-testid="stop-embed-url-input" />
            <p className="text-small">Allowed: YouTube, Vimeo, Google Maps</p>
          </div>
          <div className="form-group">
            <label className="form-label">Caption</label>
            <input type="text" className="input" value={stop.embedCaption || ""} onChange={(e) => onUpdate({ embedCaption: e.target.value || null })} placeholder="Optional caption" data-testid="stop-embed-caption-input" />
          </div>
        </AccordionSection>

        <AccordionSection title="Add Audio" icon={<Icons.Audio />} isOpen={openSections.audio} onToggle={() => toggleSection('audio')} hasContent={hasAudio} onClear={() => onUpdate({ audioUrl: null })}>
          <div className="form-group">
            <label className="form-label">Audio URL</label>
            <ClearableInput type="url" value={stop.audioUrl} onChange={(val) => onUpdate({ audioUrl: val })} onClear={() => onUpdate({ audioUrl: null })} placeholder="https://example.com/audio.mp3" data-testid="stop-audio-url-input" />
          </div>
          {stop.audioUrl && (
            <div className="audio-preview">
              <audio controls src={stop.audioUrl} />
            </div>
          )}
        </AccordionSection>

        <AccordionSection title="Broadcast" icon={<Icons.Broadcast />} isOpen={openSections.broadcast} onToggle={() => toggleSection('broadcast')} hasContent={hasBroadcast}>
          <div className="form-group">
            <label className="form-label">Button Label</label>
            <input type="text" className="input" value={stop.ctaLabel || ""} onChange={(e) => onUpdate({ ctaLabel: e.target.value || null })} placeholder="Learn More" data-testid="stop-cta-label-input" />
          </div>
          <div className="form-group">
            <label className="form-label">Button URL</label>
            <input type="url" className="input" value={stop.ctaUrl || ""} onChange={(e) => onUpdate({ ctaUrl: e.target.value || null })} placeholder="https://example.com" data-testid="stop-cta-url-input" />
          </div>
        </AccordionSection>

        <AccordionSection title="Hint" icon={<Icons.HelpCircle />} isOpen={openSections.hint} onToggle={() => toggleSection('hint')} hasContent={hasHint}>
          <div className="form-group">
            <label className="form-label">Hint Text</label>
            <textarea className="input body-textarea" value={stop.hintText || ""} onChange={(e) => onUpdate({ hintText: e.target.value || null })} placeholder="A helpful hint for players who get stuck..." data-testid="stop-hint-input" />
          </div>
          <div className="form-group">
            <label className="toggle-label">
              <input type="checkbox" checked={stop.autoShowHint || false} onChange={(e) => onUpdate({ autoShowHint: e.target.checked })} data-testid="stop-auto-hint-toggle" />
              <span className="toggle-switch"></span>
              <span>Auto-Show Hints</span>
            </label>
            <p className="text-small">Automatically show hint when player arrives</p>
          </div>
          <div className="form-group">
            <label className="form-label">Custom Wrong Answer Message</label>
            <input type="text" className="input" value={stop.wrongAnswerMessage || ""} onChange={(e) => onUpdate({ wrongAnswerMessage: e.target.value || null })} placeholder="Not quite. Take another look..." data-testid="stop-wrong-msg-input" />
            <p className="text-small">Shown when player gives wrong answer. Leave blank for default.</p>
          </div>
          <div className="form-group">
            <label className="form-label">Custom Correct Answer Message</label>
            <input type="text" className="input" value={stop.correctAnswerMessage || ""} onChange={(e) => onUpdate({ correctAnswerMessage: e.target.value || null })} placeholder="There it is." data-testid="stop-correct-msg-input" />
            <p className="text-small">Shown when player gets it right. Leave blank for default.</p>
          </div>
        </AccordionSection>

        <AccordionSection title="Verification" icon={<Icons.Lock />} isOpen={openSections.unlock} onToggle={() => toggleSection('unlock')} hasContent={hasUnlock}>
          <div className="form-group">
            <label className="toggle-label">
              <input type="checkbox" checked={stop.storyMode || false} onChange={(e) => onUpdate({ storyMode: e.target.checked })} data-testid="stop-story-mode-toggle" />
              <span className="toggle-switch"></span>
              <span>Story Mode (No Verification)</span>
            </label>
            <p className="text-small">Skip verification - players just read and continue</p>
          </div>

          {!stop.storyMode && (
            <>
              <div className="form-group">
                <label className="form-label">Verification Type</label>
                <div className="verification-type-buttons">
                  <button type="button" className={`verification-type-btn ${stop.unlockMode === 'text' ? 'active' : ''}`} onClick={() => onUpdate({ unlockMode: 'text' })}>TEXT</button>
                  <button type="button" className={`verification-type-btn ${stop.unlockMode === 'multiple_choice' ? 'active' : ''}`} onClick={() => onUpdate({ unlockMode: 'multiple_choice' })}>MULTIPLE CHOICE</button>
                  <button type="button" className={`verification-type-btn ${stop.unlockMode === 'whiteboard' ? 'active' : ''}`} onClick={() => onUpdate({ unlockMode: 'whiteboard' })}>WHITEBOARD</button>
                  <button type="button" className={`verification-type-btn ${stop.unlockMode === 'photo' ? 'active' : ''}`} onClick={() => onUpdate({ unlockMode: 'photo' })}>PHOTO</button>
                  <button type="button" className={`verification-type-btn ${stop.unlockMode === 'ranking' ? 'active' : ''}`} onClick={() => onUpdate({ unlockMode: 'ranking' })}>RANKING</button>
                  <button type="button" className={`verification-type-btn ${stop.unlockMode === 'timer' ? 'active' : ''}`} onClick={() => onUpdate({ unlockMode: 'timer', answer: '60' })}>TIMER</button>
                  <button type="button" className={`verification-type-btn ${stop.unlockMode === 'checklist' ? 'active' : ''}`} onClick={() => onUpdate({ unlockMode: 'checklist' })}>CHECKLIST</button>
                  <button type="button" className={`verification-type-btn ${stop.unlockMode === 'shake' ? 'active' : ''}`} onClick={() => onUpdate({ unlockMode: 'shake' })}>SHAKE</button>
                </div>
              </div>

              {stop.unlockMode === 'photo' && (
                <p className="text-small helper-text">Players must upload a photo to proceed. Any photo is accepted.</p>
              )}

              {stop.unlockMode === 'ranking' && (
                <div className="form-group">
                  <label className="form-label">Items (enter in correct order — players see them shuffled)</label>
                  <div className="mc-options-editor">
                    {(stop.mcOptions || []).map((option, index) => (
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

              {stop.unlockMode === 'text' && (
                <>
                  <div className="form-group">
                    <label className="form-label">Password / Code</label>
                    <input type="text" className="input" value={stop.answer || ""} onChange={(e) => onUpdate({ answer: e.target.value })} placeholder="Required answer" data-testid="stop-answer-input" />
                  </div>
                  <div className="form-group">
                    <label className="toggle-label">
                      <input type="checkbox" checked={stop.caseInsensitive !== false} onChange={(e) => onUpdate({ caseInsensitive: e.target.checked })} data-testid="stop-case-insensitive-toggle" />
                      <span className="toggle-switch"></span>
                      <span>Accept any capitalization</span>
                    </label>
                    <p className="text-small">Recommended ON. Players typing "paris", "PARIS", or "Paris" all work. Turn OFF only if letter case matters to the puzzle.</p>
                  </div>
                </>
              )}

              {stop.unlockMode === 'multiple_choice' && (
                <div className="form-group">
                  <label className="form-label">Options</label>
                  <div className="mc-options-editor">
                    {(stop.mcOptions || []).map((option, index) => (
                      <div key={index} className="mc-option-row">
                        <label className="mc-correct-radio">
                          <input type="radio" name="stop-mc-correct" checked={stop.mcCorrectIndex === index} onChange={() => onUpdate({ mcCorrectIndex: index })} />
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

              {stop.unlockMode === 'whiteboard' && (
                <p className="text-small helper-text">Players can type anything to proceed - no correct answer required</p>
              )}

              {stop.unlockMode === 'timer' && (
                <div className="form-group">
                  <label className="form-label">Duration (seconds)</label>
                  <input type="number" className="input" value={stop.answer || "60"} onChange={(e) => onUpdate({ answer: e.target.value })} placeholder="60" min="5" max="600" />
                  <p className="text-small">Page auto-unlocks when the countdown reaches zero</p>
                </div>
              )}

              {stop.unlockMode === 'checklist' && (
                <div className="form-group">
                  <label className="form-label">Checklist Items</label>
                  <div className="mc-options-editor">
                    {(stop.mcOptions || []).map((option, index) => (
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

              {stop.unlockMode === 'shake' && (
                <p className="text-small helper-text">Players shake their phone to unlock. On desktop, they tap a button instead.</p>
              )}
            </>
          )}
        </AccordionSection>

        <div className={`accordion-section pages-accordion ${openSections.pages ? 'open' : ''}`}>
          <button type="button" className="accordion-trigger pages-trigger" onClick={() => toggleSection('pages')}>
            <span className="accordion-icon"><Icons.FileText /></span>
            <span className="accordion-title">Pages ({stop.pages?.length || 0})</span>
            <span className="accordion-indicator">{openSections.pages ? '−' : '+'}</span>
          </button>
          {openSections.pages && (
            <div className="accordion-content pages-content">
              <DragDropContext onDragEnd={handlePageDragEnd}>
                <Droppable droppableId="stop-pages">
                  {(provided) => (
                    <div className="pages-list-inline" {...provided.droppableProps} ref={provided.innerRef}>
                      {(stop.pages || []).sort((a, b) => a.order - b.order).map((page, index) => (
                        <Draggable key={page.id} draggableId={page.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className={`page-item-inline ${snapshot.isDragging ? 'dragging' : ''}`}
                              data-testid={`page-item-${page.id}`}
                            >
                              <span {...provided.dragHandleProps} className="drag-handle"><Icons.Grip /></span>
                              <span className="page-info" onClick={() => onSelectPage(page.id)}>
                                <span className="page-title-inline">{page.title || 'Untitled Page'}</span>
                                <span className="page-badges">
                                  {page.storyMode && <span className="badge badge-sm">Story</span>}
                                  {page.unlockMode === 'text' && <Icons.Type />}
                                  {page.unlockMode === 'multiple_choice' && <Icons.ListChecks />}
                                  {page.unlockMode === 'whiteboard' && <Icons.Edit />}
                                  {page.unlockMode === 'photo' && <Icons.Camera />}
                                  {page.unlockMode === 'ranking' && <Icons.Grip />}
                                </span>
                              </span>
                              <button 
                                type="button" 
                                className="btn btn-ghost btn-sm page-delete-btn"
                                onClick={(e) => { e.stopPropagation(); onDeletePage(page.id); }}
                              >
                                <Icons.Trash />
                              </button>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
            </div>
          )}
        </div>
      </div>

      <DeleteConfirmModal 
        isOpen={showDeleteModal} 
        onClose={() => setShowDeleteModal(false)} 
        onConfirm={confirmDelete}
        itemType="Stop"
      />
    </div>
  );
};

export default StopEditor;
