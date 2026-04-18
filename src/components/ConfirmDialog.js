import React from 'react';
import './ConfirmDialog.css';

const ConfirmDialog = ({ 
  isOpen, 
  title, 
  message, 
  confirmText = 'Ya, Lanjutkan', 
  cancelText = 'Batal', 
  onConfirm, 
  onCancel,
  variant = 'default'
}) => {
  if (!isOpen) return null;

  return (
    <div className="confirm-overlay" onClick={onCancel} role="presentation">
      <div className="confirm-dialog animate-scale-in" onClick={e => e.stopPropagation()}>
        <div className={`confirm-header confirm-${variant}`}>
          <h2>{title}</h2>
          <button 
            className="confirm-close" 
            onClick={onCancel}
            aria-label="Close"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>
        
        <div className="confirm-body">
          <p>{message}</p>
        </div>
        
        <div className="confirm-actions">
          <button 
            className="btn-secondary" 
            onClick={onCancel}
            autoFocus
          >
            {cancelText}
          </button>
          <button 
            className={`btn-primary btn-${variant}`}
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
