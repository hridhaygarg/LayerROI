import {
  getContrastRatio,
  createAccessibleLabel,
  createAccessibleButton,
  isScreenReaderVisible,
  createSkipLink,
  formatNumberForA11y,
  announceToScreenReader,
} from '../utils/a11y';
import '@testing-library/jest-dom';

describe('Accessibility Utilities', () => {
  test('getContrastRatio calculates correct ratio', () => {
    // Black on white - should be 21:1
    const result = getContrastRatio('#000000', '#ffffff');
    expect(result.ratio).toBeGreaterThan(20);
    expect(result.isAACompliant).toBe(true);
    expect(result.isAAACompliant).toBe(true);
  });

  test('getContrastRatio identifies AA and AAA compliance', () => {
    // Dark blue on white - should pass AA but test AAA
    const result = getContrastRatio('#0066cc', '#ffffff');
    expect(result.ratio).toBeGreaterThan(0);
    expect(typeof result.isAACompliant).toBe('boolean');
    expect(typeof result.isAAACompliant).toBe('boolean');
  });

  test('createAccessibleLabel creates proper label HTML', () => {
    const label = createAccessibleLabel('email-input', 'Email Address', true);
    expect(label).toContain('for="email-input"');
    expect(label).toContain('Email Address');
    expect(label).toContain('required');
  });

  test('createAccessibleButton creates button configuration', () => {
    const button = createAccessibleButton('Click Me', 'Click to submit form');
    expect(button.role).toBe('button');
    expect(button['aria-label']).toBe('Click to submit form');
    expect(button.tabIndex).toBe(0);
    expect(typeof button.onKeyDown).toBe('function');
  });

  test('isScreenReaderVisible detects visibility', () => {
    // Create a visible element
    const visibleDiv = document.createElement('div');
    visibleDiv.textContent = 'Visible';
    document.body.appendChild(visibleDiv);

    expect(isScreenReaderVisible(visibleDiv)).toBe(true);

    // Create a hidden element
    const hiddenDiv = document.createElement('div');
    hiddenDiv.style.display = 'none';
    hiddenDiv.textContent = 'Hidden';
    document.body.appendChild(hiddenDiv);

    expect(isScreenReaderVisible(hiddenDiv)).toBe(false);

    // Cleanup
    document.body.removeChild(visibleDiv);
    document.body.removeChild(hiddenDiv);
  });

  test('createSkipLink creates proper skip link configuration', () => {
    const skipLink = createSkipLink('main-content');
    expect(skipLink.href).toBe('#main-content');
    expect(skipLink.children).toBe('Skip to main content');
    expect(skipLink.className).toBe('skip-link');
    expect(typeof skipLink.onFocus).toBe('function');
    expect(typeof skipLink.onBlur).toBe('function');
  });

  test('formatNumberForA11y formats numbers correctly', () => {
    const formatted = formatNumberForA11y(1234.56);
    expect(formatted).toContain('1');
    expect(formatted).toContain('234');
    expect(typeof formatted).toBe('string');
  });
});
