import React from 'react';

const DeleteConfirmModal = ({ isOpen, onClose, onConfirm, itemType }) => {
  if (!isOpen) return null;
  
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h3>Delete {itemType}?</h3>
        <p>This action cannot be undone. Are you sure you want to delete this {itemType.toLowerCase()}?</p>
        <div className="modal-actions">
          <button onClick={onClose} className="btn btn-secondary">Cancel</button>
          <button onClick={onConfirm} className="btn btn-danger">Delete</button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmModal;
