import { renderHook } from '@testing-library/react';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { useResponsive } from '../hooks/useResponsive';
import '@testing-library/jest-dom';

describe('Responsive Hooks', () => {
  // Mock window.matchMedia
  beforeEach(() => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation((query) => ({
        matches: false,
        media: query,
        onchange: null,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        addListener: jest.fn(),
        removeListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    });
  });

  test('useMediaQuery returns initial false state for non-matching query', () => {
    const { result } = renderHook(() => useMediaQuery('(min-width: 1024px)'));
    expect(result.current).toBe(false);
  });

  test('useResponsive returns all breakpoint states', () => {
    const { result } = renderHook(() => useResponsive());

    expect(result.current).toHaveProperty('isMobile');
    expect(result.current).toHaveProperty('isTablet');
    expect(result.current).toHaveProperty('isDesktop');
    expect(result.current).toHaveProperty('isWide');
    expect(result.current).toHaveProperty('isXLarge');
    expect(result.current).toHaveProperty('isTabletUp');
    expect(result.current).toHaveProperty('isDesktopUp');
    expect(result.current).toHaveProperty('isWideUp');
  });

  test('useResponsive has initial states', () => {
    const { result } = renderHook(() => useResponsive());

    expect(typeof result.current.isMobile).toBe('boolean');
    expect(typeof result.current.isTablet).toBe('boolean');
    expect(typeof result.current.isDesktop).toBe('boolean');
    expect(typeof result.current.isWide).toBe('boolean');
  });
});
