import { useTheme } from '../theme/ThemeContext';

const modes = [
  { id: 'light', label: '☀' },
  { id: 'dark', label: '☾' },
  { id: 'auto', label: '⚙' },
];

export function ThemeToggle({ compact }) {
  const { mode, setMode, colors } = useTheme();

  return (
    <div style={{
      display: 'inline-flex',
      borderRadius: '8px',
      border: `1px solid ${colors.borderDefault}`,
      overflow: 'hidden',
    }}>
      {modes.map(m => (
        <button
          key={m.id}
          onClick={() => setMode(m.id)}
          title={m.id.charAt(0).toUpperCase() + m.id.slice(1)}
          style={{
            padding: compact ? '4px 8px' : '5px 12px',
            background: mode === m.id ? colors.accentGreenSubtle : 'transparent',
            color: mode === m.id ? colors.accentGreen : colors.textMuted,
            border: 'none',
            borderRight: m.id !== 'auto' ? `1px solid ${colors.borderDefault}` : 'none',
            cursor: 'pointer',
            fontSize: compact ? '12px' : '14px',
            fontWeight: mode === m.id ? 600 : 400,
            transition: 'all 150ms ease',
          }}
        >
          {m.label}
        </button>
      ))}
    </div>
  );
}
