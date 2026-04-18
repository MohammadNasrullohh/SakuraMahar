/**
 * Responsive Utilities
 * Helper functions and hooks for responsive design
 */

import React from 'react';

/**
 * Get current breakpoint
 */
export const getBreakpoint = () => {
  if (typeof window === 'undefined') return 'desktop';
  
  const width = window.innerWidth;
  if (width < 480) return 'mobile';
  if (width < 640) return 'small';
  if (width < 768) return 'tablet';
  if (width < 1024) return 'laptop';
  return 'desktop';
};

/**
 * Check if screen is mobile
 */
export const isMobile = () => {
  if (typeof window === 'undefined') return false;
  return window.innerWidth < 768;
};

/**
 * Check if screen is tablet
 */
export const isTablet = () => {
  if (typeof window === 'undefined') return false;
  const width = window.innerWidth;
  return width >= 768 && width < 1024;
};

/**
 * Check if screen is desktop
 */
export const isDesktop = () => {
  if (typeof window === 'undefined') return true;
  return window.innerWidth >= 1024;
};

/**
 * Get touch target size (minimum 44x44px for accessibility)
 */
export const getTouchTargetSize = () => {
  return isMobile() ? '44px' : 'auto';
};

/**
 * Get font size for responsive typography
 */
export const getResponsiveFontSize = (mobileSize, tabletSize, desktopSize) => {
  const breakpoint = getBreakpoint();
  
  if (breakpoint === 'mobile' || breakpoint === 'small') return mobileSize;
  if (breakpoint === 'tablet' || breakpoint === 'laptop') return tabletSize;
  return desktopSize;
};

/**
 * Get spacing value for responsive design
 */
export const getResponsiveSpacing = (mobileSpacing, tabletSpacing, desktopSpacing) => {
  const breakpoint = getBreakpoint();
  
  if (breakpoint === 'mobile' || breakpoint === 'small') return mobileSpacing;
  if (breakpoint === 'tablet' || breakpoint === 'laptop') return tabletSpacing;
  return desktopSpacing;
};

/**
 * Debounce function for resize events
 */
export const debounce = (func, wait = 250) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * Throttle function for scroll events
 */
export const throttle = (func, limit = 100) => {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

/**
 * React Hook for responsive state
 */
export const useResponsive = () => {
  const [breakpoint, setBreakpoint] = React.useState(() => getBreakpoint());

  React.useEffect(() => {
    const handleResize = debounce(() => {
      setBreakpoint(getBreakpoint());
    }, 150);

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return {
    breakpoint,
    isMobile: breakpoint === 'mobile' || breakpoint === 'small',
    isTablet: breakpoint === 'tablet' || breakpoint === 'laptop',
    isDesktop: breakpoint === 'desktop' || breakpoint === 'laptop'
  };
};

/**
 * Get CSS media query
 */
export const getMediaQuery = (breakpoint) => {
  const queries = {
    mobile: '(max-width: 479px)',
    small: '(max-width: 639px)',
    tablet: '(max-width: 767px)',
    laptop: '(max-width: 1023px)',
    desktop: '(min-width: 1024px)',
    touch: '(hover: none) and (pointer: coarse)',
    noTouch: '(hover: hover) and (pointer: fine)',
    darkMode: '(prefers-color-scheme: dark)',
    reducedMotion: '(prefers-reduced-motion: reduce)'
  };
  
  return queries[breakpoint] || '';
};

/**
 * Format number for mobile display
 */
export const formatNumberForDisplay = (number, decimals = 0) => {
  return new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(number);
};

/**
 * Truncate text for mobile
 */
export const truncateText = (text, maxLength, breakpoint) => {
  if (!text) return '';
  
  const isMobileScreen = breakpoint === 'mobile' || breakpoint === 'small';
  const length = isMobileScreen ? Math.max(maxLength - 10, 20) : maxLength;
  
  return text.length > length ? text.substring(0, length) + '...' : text;
};
