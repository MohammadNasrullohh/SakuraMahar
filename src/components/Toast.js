import React, { useEffect } from 'react';
import './Toast.css';

const Toast = ({ id, type = 'info', title, message, onClose, duration = 5000 }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(id);
    }, duration);

    return () => clearTimeout(timer);
  }, [id, onClose, duration]);

  return (
    <div className={`toast toast-${type} animate-slide-in-up`} role="alert">
      <div className="toast-icon">
        {type === 'success' && <i className="fas fa-check-circle"></i>}
        {type === 'error' && <i className="fas fa-exclamation-circle"></i>}
        {type === 'warning' && <i className="fas fa-exclamation-triangle"></i>}
        {type === 'info' && <i className="fas fa-info-circle"></i>}
      </div>
      <div className="toast-content">
        {title && <div className="toast-title">{title}</div>}
        {message && <div className="toast-message">{message}</div>}
      </div>
      <button 
        className="toast-close" 
        onClick={() => onClose(id)}
        aria-label="Close notification"
      >
        <i className="fas fa-times"></i>
      </button>
    </div>
  );
};

export default Toast;
