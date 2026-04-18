import React from 'react';
import './LoadingSpinner.css';

const LoadingSpinner = ({ size = 'md', variant = 'primary', fullPage = false }) => {
  if (fullPage) {
    return (
      <div className="loading-overlay">
        <div className={`spinner spinner-${size} spinner-${variant}`}>
          <div className="spinner-ring"></div>
          <div className="spinner-ring"></div>
          <div className="spinner-ring"></div>
          <div className="spinner-ring"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`spinner spinner-${size} spinner-${variant}`}>
      <div className="spinner-ring"></div>
      <div className="spinner-ring"></div>
      <div className="spinner-ring"></div>
      <div className="spinner-ring"></div>
    </div>
  );
};

export default LoadingSpinner;
