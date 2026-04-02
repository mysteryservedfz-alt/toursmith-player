import React from 'react';
import Icons from '../Icons';

const ClearableInput = ({ value, onChange, onClear, placeholder, type = "text", ...props }) => {
  return (
    <div className="clearable-input-wrapper">
      <input 
        type={type} 
        className="input" 
        value={value || ""} 
        onChange={(e) => onChange(e.target.value || null)} 
        placeholder={placeholder}
        {...props}
      />
      {value && (
        <button 
          type="button" 
          className="clear-input-btn" 
          onClick={() => onClear()}
          title="Clear"
        >
          <Icons.X />
        </button>
      )}
    </div>
  );
};

export default ClearableInput;
