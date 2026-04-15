/**
 * Accessibility (a11y) Utilities
 * WCAG 2.1 AAA compliant helpers and functions
 */

/**
 * Check if a color has sufficient contrast ratio
 * WCAG AA: 4.5:1 for normal text, 3:1 for large text
 * WCAG AAA: 7:1 for normal text, 4.5:1 for large text
 *
 * @param {string} foreground - Hex color string
 * @param {string} background - Hex color string
 * @returns {Object} - { ratio, isAACompliant, isAAACompliant }
 */
export function getContrastRatio(foreground, background) {
  const getLuminance = (color) => {
    const rgb = parseInt(color.slice(1), 16);
    const r = (rgb >> 16) & 0xff;
    const g = (rgb >> 8) & 0xff;
    const b = (rgb >> 0) & 0xff;

    const [rs, gs, bs] = [r, g, b].map((c) => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });

    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  };

  const l1 = getLuminance(foreground);
  const l2 = getLuminance(background);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  const ratio = (lighter + 0.05) / (darker + 0.05);

  return {
    ratio: Math.round(ratio * 100) / 100,
    isAACompliant: ratio >= 4.5,
    isAAACompliant: ratio >= 7,
  };
}

/**
 * Create accessible form label
 * Associates label with input via htmlFor attribute
 *
 * @param {string} htmlFor - ID of associated input
 * @param {string} text - Label text
 * @param {boolean} required - Is field required
 * @returns {string} - HTML string for label
 */
export function createAccessibleLabel(htmlFor, text, required = false) {
  const requiredSpan = required ? ' <span aria-label="required">*</span>' : '';
  return `<label for="${htmlFor}">${text}${requiredSpan}</label>`;
}

/**
 * Create accessible button with proper aria attributes
 *
 * @param {string} text - Button text/label
 * @param {string} ariaLabel - ARIA label (optional)
 * @param {Object} attributes - Additional attributes
 * @returns {Object} - Button configuration object
 */
export function createAccessibleButton(text, ariaLabel = null, attributes = {}) {
  return {
    role: 'button',
    tabIndex: 0,
    'aria-label': ariaLabel || text,
    ...attributes,
    // Keyboard support
    onKeyDown: (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        attributes.onClick?.();
      }
    },
  };
}

/**
 * Create accessible dropdown/select
 *
 * @param {Array} options - Array of { label, value }
 * @param {string} selectedValue - Currently selected value
 * @returns {Object} - Configuration object
 */
export function createAccessibleDropdown(options, selectedValue) {
  return {
    role: 'combobox',
    'aria-expanded': false,
    'aria-haspopup': 'listbox',
    'aria-label': 'Select an option',
    options: options,
    value: selectedValue,
  };
}

/**
 * Create accessible alert/notification
 *
 * @param {string} message - Alert message
 * @param {string} type - 'error' | 'success' | 'warning' | 'info'
 * @param {boolean} live - Should be announced live (true = polite, false = off)
 * @returns {Object} - Alert configuration
 */
export function createAccessibleAlert(message, type = 'info', live = true) {
  const roleMap = {
    error: 'alert',
    success: 'status',
    warning: 'alert',
    info: 'status',
  };

  return {
    role: roleMap[type] || 'status',
    'aria-live': live ? 'polite' : 'off',
    'aria-atomic': true,
    message,
    type,
  };
}

/**
 * Check if element is visible to screen readers
 *
 * @param {HTMLElement} element
 * @returns {boolean}
 */
export function isScreenReaderVisible(element) {
  if (!element) return false;

  const style = window.getComputedStyle(element);

  // Check for display: none
  if (style.display === 'none') return false;

  // Check for visibility: hidden
  if (style.visibility === 'hidden') return false;

  // Check for opacity: 0
  if (parseFloat(style.opacity) === 0) return false;

  // Check for aria-hidden="true"
  if (element.getAttribute('aria-hidden') === 'true') return false;

  return true;
}

/**
 * Create skip link for keyboard navigation
 * Allows users to skip repetitive content
 *
 * @param {string} targetId - ID of main content element
 * @returns {Object} - Skip link configuration
 */
export function createSkipLink(targetId) {
  return {
    href: `#${targetId}`,
    className: 'skip-link',
    children: 'Skip to main content',
    style: {
      position: 'absolute',
      top: '-40px',
      left: '0',
      background: '#000',
      color: '#fff',
      padding: '8px',
      zIndex: '100',
    },
    onFocus: (e) => {
      e.target.style.top = '0';
    },
    onBlur: (e) => {
      e.target.style.top = '-40px';
    },
  };
}

/**
 * Format number for screen readers
 * Converts numbers to readable format
 *
 * @param {number} num - Number to format
 * @returns {string} - Formatted readable string
 */
export function formatNumberForA11y(num) {
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });

  return formatter.format(num);
}

/**
 * Create accessible link
 *
 * @param {string} text - Link text
 * @param {string} href - Link URL
 * @param {string} ariaLabel - ARIA label (optional, for icon-only links)
 * @returns {Object} - Link configuration
 */
export function createAccessibleLink(text, href, ariaLabel = null) {
  return {
    href,
    children: text,
    'aria-label': ariaLabel || text,
    rel: 'noopener noreferrer', // Security for external links
  };
}

/**
 * Create accessible tab component
 *
 * @param {Array} tabs - Array of { id, label, panel }
 * @param {string} activeTabId - ID of active tab
 * @returns {Object} - Tab configuration
 */
export function createAccessibleTabs(tabs, activeTabId) {
  return {
    tabs: tabs.map((tab) => ({
      ...tab,
      role: 'tab',
      'aria-selected': tab.id === activeTabId,
      'aria-controls': `panel-${tab.id}`,
      tabIndex: tab.id === activeTabId ? 0 : -1,
    })),
    panels: tabs.map((tab) => ({
      id: `panel-${tab.id}`,
      role: 'tabpanel',
      'aria-labelledby': tab.id,
      hidden: tab.id !== activeTabId,
    })),
  };
}

/**
 * Focus management utilities
 * Trap focus within a modal dialog
 *
 * @param {HTMLElement} element - Element to trap focus in
 */
export function trapFocus(element) {
  const focusableElements = element.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );

  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];

  const handleKeyDown = (e) => {
    if (e.key !== 'Tab') return;

    if (e.shiftKey) {
      // Shift + Tab
      if (document.activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      }
    } else {
      // Tab
      if (document.activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    }
  };

  element.addEventListener('keydown', handleKeyDown);

  return () => {
    element.removeEventListener('keydown', handleKeyDown);
  };
}

/**
 * Create accessible modal dialog
 *
 * @param {string} titleId - ID of modal title
 * @param {boolean} isOpen - Whether modal is open
 * @returns {Object} - Modal configuration
 */
export function createAccessibleModal(titleId, isOpen = false) {
  return {
    role: 'dialog',
    'aria-modal': true,
    'aria-labelledby': titleId,
    'aria-hidden': !isOpen,
    open: isOpen,
  };
}

/**
 * Announce messages to screen readers
 * Useful for dynamic content updates
 *
 * @param {string} message - Message to announce
 * @param {boolean} assertive - Use assertive politeness (true) or polite (false)
 */
export function announceToScreenReader(message, assertive = false) {
  const ariaLive = assertive ? 'assertive' : 'polite';
  const announcement = document.createElement('div');

  announcement.setAttribute('role', 'status');
  announcement.setAttribute('aria-live', ariaLive);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = message;

  document.body.appendChild(announcement);

  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
}

/**
 * Check if keyboard navigation is active
 * Useful for showing focus outlines only for keyboard users
 *
 * @returns {boolean}
 */
export let isKeyboardNavigationActive = false;

document.addEventListener('keydown', (e) => {
  if (e.key === 'Tab') {
    isKeyboardNavigationActive = true;
  }
});

document.addEventListener('mousedown', () => {
  isKeyboardNavigationActive = false;
});

/**
 * Get keyboard navigation status
 *
 * @returns {boolean}
 */
export function getKeyboardNavigationStatus() {
  return isKeyboardNavigationActive;
}

/**
 * Create accessible data table
 *
 * @param {string} caption - Table caption
 * @param {Array} headers - Column headers
 * @returns {Object} - Table configuration
 */
export function createAccessibleTable(caption, headers) {
  return {
    role: 'table',
    'aria-label': caption,
    caption,
    headers: headers.map((header, index) => ({
      ...header,
      role: 'columnheader',
      scope: 'col',
      id: `header-${index}`,
    })),
  };
}

export default {
  getContrastRatio,
  createAccessibleLabel,
  createAccessibleButton,
  createAccessibleDropdown,
  createAccessibleAlert,
  isScreenReaderVisible,
  createSkipLink,
  formatNumberForA11y,
  createAccessibleLink,
  createAccessibleTabs,
  trapFocus,
  createAccessibleModal,
  announceToScreenReader,
  getKeyboardNavigationStatus,
  createAccessibleTable,
};
