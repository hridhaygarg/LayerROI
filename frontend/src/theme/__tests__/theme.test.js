import '@testing-library/jest-dom';
import theme from '../index';
import colors from '../colors';
import spacing from '../spacing';
import typography from '../typography';
import shadows from '../shadows';

describe('Design Tokens System', () => {
  describe('Colors', () => {
    test('should export primary color palette', () => {
      expect(colors.primary).toBe('#3b82f6');
      expect(colors.primaryLight).toBe('#60a5fa');
      expect(colors.primaryDark).toBe('#1d4ed8');
    });

    test('should export success color palette', () => {
      expect(colors.success).toBe('#10b981');
      expect(colors.successLight).toBe('#6ee7b7');
      expect(colors.successDark).toBe('#059669');
    });

    test('should export warning color palette', () => {
      expect(colors.warning).toBe('#f59e0b');
      expect(colors.warningLight).toBe('#fcd34d');
      expect(colors.warningDark).toBe('#d97706');
    });

    test('should export danger color palette', () => {
      expect(colors.danger).toBe('#ef4444');
      expect(colors.dangerLight).toBe('#fca5a5');
      expect(colors.dangerDark).toBe('#dc2626');
    });

    test('should export neutral color palette', () => {
      expect(colors.neutral).toBe('#6b7280');
      expect(colors.neutralLight).toBe('#f3f4f6');
      expect(colors.neutralDark).toBe('#1f2937');
    });

    test('should export base colors', () => {
      expect(colors.white).toBe('#ffffff');
      expect(colors.black).toBe('#000000');
    });
  });

  describe('Spacing', () => {
    test('should export spacing scale in pixels', () => {
      expect(spacing.xs).toBe('4px');
      expect(spacing.sm).toBe('8px');
      expect(spacing.md).toBe('16px');
      expect(spacing.lg).toBe('24px');
      expect(spacing.xl).toBe('32px');
      expect(spacing['2xl']).toBe('48px');
    });
  });

  describe('Typography', () => {
    test('should export heading typography definitions', () => {
      expect(typography.h1).toEqual({
        fontSize: '32px',
        fontWeight: 600,
        lineHeight: 1.2,
      });
      expect(typography.h2).toEqual({
        fontSize: '28px',
        fontWeight: 600,
        lineHeight: 1.2,
      });
      expect(typography.h3).toEqual({
        fontSize: '24px',
        fontWeight: 600,
        lineHeight: 1.2,
      });
    });

    test('should export body typography definitions', () => {
      expect(typography.bodySm).toEqual({
        fontSize: '12px',
        fontWeight: 400,
        lineHeight: 1.5,
      });
      expect(typography.bodyMd).toEqual({
        fontSize: '14px',
        fontWeight: 400,
        lineHeight: 1.5,
      });
      expect(typography.bodyLg).toEqual({
        fontSize: '16px',
        fontWeight: 400,
        lineHeight: 1.5,
      });
    });
  });

  describe('Shadows', () => {
    test('should export shadow definitions', () => {
      expect(shadows.sm).toBe('0 1px 2px 0 rgba(0, 0, 0, 0.05)');
      expect(shadows.md).toBe('0 4px 6px -1px rgba(0, 0, 0, 0.1)');
      expect(shadows.lg).toBe('0 10px 15px -3px rgba(0, 0, 0, 0.1)');
      expect(shadows.xl).toBe('0 20px 25px -5px rgba(0, 0, 0, 0.1)');
    });
  });

  describe('Theme Index', () => {
    test('should export complete theme object as default', () => {
      expect(theme).toBeDefined();
      expect(theme.colors).toBeDefined();
      expect(theme.spacing).toBeDefined();
      expect(theme.typography).toBeDefined();
      expect(theme.shadows).toBeDefined();
    });

    test('should include all color tokens in theme', () => {
      expect(theme.colors.primary).toBe('#3b82f6');
      expect(theme.colors.success).toBe('#10b981');
      expect(theme.colors.warning).toBe('#f59e0b');
      expect(theme.colors.danger).toBe('#ef4444');
      expect(theme.colors.neutral).toBe('#6b7280');
    });

    test('should include all spacing tokens in theme', () => {
      expect(theme.spacing.xs).toBe('4px');
      expect(theme.spacing.md).toBe('16px');
      expect(theme.spacing.xl).toBe('32px');
    });

    test('should include all typography tokens in theme', () => {
      expect(theme.typography.h1).toBeDefined();
      expect(theme.typography.bodyMd).toBeDefined();
    });

    test('should include all shadow tokens in theme', () => {
      expect(theme.shadows.sm).toBeDefined();
      expect(theme.shadows.lg).toBeDefined();
    });
  });
});
