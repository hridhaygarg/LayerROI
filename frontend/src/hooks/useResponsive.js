import { useMediaQuery } from './useMediaQuery';

/**
 * High-level responsive hook that provides common breakpoint states
 * Returns object with boolean flags for each breakpoint
 *
 * @returns {Object} - Object with isMobile, isTablet, isDesktop, isWide properties
 *
 * @example
 * const { isMobile, isTablet, isDesktop, isWide } = useResponsive();
 * return (
 *   {isMobile && <MobileLayout />}
 *   {isDesktop && <DesktopLayout />}
 * );
 */
export function useResponsive() {
  // Mobile: 0px - 767px
  const isMobile = useMediaQuery('(max-width: 767px)');

  // Tablet: 768px - 1023px
  const isTablet = useMediaQuery('(min-width: 768px) and (max-width: 1023px)');

  // Desktop: 1024px - 1279px
  const isDesktop = useMediaQuery('(min-width: 1024px) and (max-width: 1279px)');

  // Wide: 1280px and above
  const isWide = useMediaQuery('(min-width: 1280px)');

  // Extra large: 1536px and above
  const isXLarge = useMediaQuery('(min-width: 1536px)');

  // Tablet and above
  const isTabletUp = useMediaQuery('(min-width: 768px)');

  // Desktop and above
  const isDesktopUp = useMediaQuery('(min-width: 1024px)');

  // Wide and above
  const isWideUp = useMediaQuery('(min-width: 1280px)');

  return {
    isMobile,
    isTablet,
    isDesktop,
    isWide,
    isXLarge,
    isTabletUp,
    isDesktopUp,
    isWideUp,
  };
}

export default useResponsive;
