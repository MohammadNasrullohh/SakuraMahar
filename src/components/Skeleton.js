import React from 'react';
import './Skeleton.css';

const Skeleton = ({ 
  variant = 'text', 
  width = '100%', 
  height = '20px',
  count = 1,
  circle = false,
  className = ''
}) => {
  const skeletons = Array(count).fill(null);

  return (
    <div className={`skeleton-wrapper ${className}`}>
      {skeletons.map((_, index) => (
        <div
          key={index}
          className={`skeleton skeleton-${variant} ${circle ? 'skeleton-circle' : ''}`}
          style={{
            width,
            height,
            ...(index > 0 && { marginTop: '12px' })
          }}
        />
      ))}
    </div>
  );
};

export default Skeleton;
