import React, { useState, useCallback, useRef } from 'react';
import Toast from './Toast';
import './ToastContainer.css';

const ToastContainer = React.forwardRef((props, ref) => {
  const [toasts, setToasts] = useState([]);
  const toastIdRef = useRef(0);

  const addToast = useCallback((options = {}) => {
    const {
      type = 'info',
      title = '',
      message = '',
      duration = 5000
    } = options;

    const id = toastIdRef.current++;
    
    setToasts(prev => [...prev, {
      id,
      type,
      title,
      message,
      duration
    }]);

    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  React.useImperativeHandle(ref, () => ({
    success: (title, message, duration) => 
      addToast({ type: 'success', title, message, duration }),
    error: (title, message, duration) =>
      addToast({ type: 'error', title, message, duration }),
    warning: (title, message, duration) =>
      addToast({ type: 'warning', title, message, duration }),
    info: (title, message, duration) =>
      addToast({ type: 'info', title, message, duration }),
    clear: () => setToasts([])
  }), [addToast]);

  return (
    <div className="toast-container">
      {toasts.map(toast => (
        <Toast
          key={toast.id}
          id={toast.id}
          type={toast.type}
          title={toast.title}
          message={toast.message}
          duration={toast.duration}
          onClose={removeToast}
        />
      ))}
    </div>
  );
});

ToastContainer.displayName = 'ToastContainer';

export default ToastContainer;
