import React, { useEffect } from 'react';

const AdminOverlayForm = ({
  isOpen = false,
  title = 'Form',
  description = '',
  tag = '',
  actions = null,
  onClose,
  children
}) => {
  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose?.();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="admin-overlay"
      role="presentation"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose?.();
        }
      }}
    >
      <div className="admin-overlay-panel" role="dialog" aria-modal="true" aria-label={title}>
        <div className="admin-overlay-header">
          <div className="admin-overlay-copy">
            {tag ? <span className="admin-page-label">{tag}</span> : null}
            <h3>{title}</h3>
            {description ? <p>{description}</p> : null}
          </div>
          <button type="button" className="admin-overlay-close" onClick={() => onClose?.()} aria-label="Tutup form">
            <i className="fas fa-times" aria-hidden="true"></i>
          </button>
        </div>

        <div className="admin-overlay-body">
          {children}
        </div>

        {actions ? <div className="admin-overlay-footer">{actions}</div> : null}
      </div>
    </div>
  );
};

export default AdminOverlayForm;
