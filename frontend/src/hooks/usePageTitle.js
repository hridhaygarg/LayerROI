import { useEffect } from 'react';

/**
 * Custom hook to set the document title on component mount
 * @param {string} title - The title to display in the browser tab
 */
export function usePageTitle(title) {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = title ? `${title} | layeroi` : 'layeroi';

    return () => {
      document.title = previousTitle;
    };
  }, [title]);
}
