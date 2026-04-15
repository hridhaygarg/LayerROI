import { useState, useEffect } from 'react';

/**
 * Custom hook for matching media queries
 * Returns true if the media query matches, false otherwise
 *
 * @param {string} query - CSS media query string (e.g., '(min-width: 768px)')
 * @returns {boolean} - Whether the media query matches
 *
 * @example
 * const isMobile = useMediaQuery('(max-width: 767px)');
 * const isTablet = useMediaQuery('(min-width: 768px) and (max-width: 1023px)');
 * const isDesktop = useMediaQuery('(min-width: 1024px)');
 */
export function useMediaQuery(query) {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    // Create media query list
    const mediaQuery = window.matchMedia(query);

    // Set initial state
    setMatches(mediaQuery.matches);

    // Define event listener
    const handleChange = (e) => {
      setMatches(e.matches);
    };

    // Add listener using modern addEventListener API
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
    // Fallback for older browsers
    else {
      mediaQuery.addListener(handleChange);
      return () => mediaQuery.removeListener(handleChange);
    }
  }, [query]);

  return matches;
}

export default useMediaQuery;
