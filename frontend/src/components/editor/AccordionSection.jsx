import React from 'react';
import Icons from '../Icons';

const AccordionSection = ({ title, icon, isOpen, onToggle, hasContent, onClear, children }) => (
  <div className={`accordion-section ${isOpen ? 'open' : ''} ${hasContent ? 'has-content' : ''}`}>
    <div className="accordion-header">
      <button type="button" className="accordion-trigger" onClick={onToggle}>
        <span className="accordion-icon">{icon}</span>
        <span className="accordion-title">{title}</span>
        <span className="accordion-indicator">{hasContent && <span className="content-dot" />}{isOpen ? '−' : '+'}</span>
      </button>
      {hasContent && onClear && (
        <button 
          type="button" 
          className="accordion-clear-btn" 
          onClick={(e) => { e.stopPropagation(); onClear(); }}
          title="Clear this section"
        >
          <Icons.Trash />
        </button>
      )}
    </div>
    {isOpen && <div className="accordion-content">{children}</div>}
  </div>
);

export default AccordionSection;
