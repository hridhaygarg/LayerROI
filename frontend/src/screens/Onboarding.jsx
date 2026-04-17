import { Copy, Check } from 'lucide-react';
import { useState } from 'react';

const colors = {
  bgSurface: '#ffffff',
  bgSubtle: '#f5f5f4',
  bgProfit: '#f0fdf4',
  borderDefault: 'rgba(0,0,0,0.08)',
  textPrimary: '#111827',
  textSecondary: '#6b7280',
  accentGreen: '#16a34a',
  accentGreenBorder: '#86efac',
  shadowSm: '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)',
};

export default function Onboarding() {
  const [copied, setCopied] = useState(false);
  const [provider, setProvider] = useState('openai');

  const codeBlocks = {
    openai: `const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: 'https://api.layeroi.com'
});`,
    anthropic: `const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  baseURL: 'https://api.layeroi.com'
});`
  };

  const codeBlock = codeBlocks[provider];

  return (
    <div style={{ maxWidth: '700px' }}>
      <h2 style={{
        fontFamily: 'Playfair Display, serif',
        fontSize: '32px',
        fontWeight: '700',
        marginBottom: '32px',
        color: colors.textPrimary,
      }}>
        Get Started in 4 Steps
      </h2>

      {[
        { step: 1, title: 'Name Your Agent', desc: 'Give your agent a human-readable name to track it in the dashboard' },
        { step: 2, title: 'Change One Line of Code', desc: 'Update your baseURL to point to layeroi for cost tracking' },
        { step: 3, title: 'Make an API Call', desc: 'Your agent will now route through layeroi and be monitored' },
        { step: 4, title: 'Watch the Dashboard', desc: 'See costs and ROI appear in real-time as your agent runs' },
      ].map(({ step, title, desc }) => (
        <div key={step} style={{
          background: colors.bgSurface,
          border: `1px solid ${colors.borderDefault}`,
          borderRadius: '8px',
          padding: '24px',
          marginBottom: '16px',
          display: 'flex',
          gap: '20px',
          boxShadow: colors.shadowSm,
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            background: colors.accentGreen,
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'Playfair Display, serif',
            fontSize: '20px',
            fontWeight: '700',
            flexShrink: 0,
          }}>
            {step}
          </div>
          <div style={{ flex: 1 }}>
            <h3 style={{
              fontFamily: 'Playfair Display, serif',
              fontSize: '18px',
              fontWeight: '600',
              marginBottom: '8px',
              color: colors.textPrimary,
            }}>
              {title}
            </h3>
            <p style={{
              color: colors.textSecondary,
              fontSize: '14px',
              lineHeight: '1.6',
            }}>
              {desc}
            </p>
          </div>
        </div>
      ))}

      <div style={{ marginTop: '40px' }}>
        <div style={{
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            <div style={{
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              background: colors.accentGreen,
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: 'Playfair Display, serif',
              fontSize: '14px',
              fontWeight: '700',
            }}>
              2
            </div>
            <p style={{
              fontFamily: 'IBM Plex Mono, monospace',
              fontSize: '13px',
              color: colors.textSecondary,
              fontWeight: '600',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}>
              Code Example
            </p>
          </div>
          <div style={{
            display: 'flex',
            gap: '8px',
          }}>
            {['openai', 'anthropic'].map((p) => (
              <button
                key={p}
                onClick={() => setProvider(p)}
                style={{
                  padding: '6px 14px',
                  borderRadius: '4px',
                  border: `1px solid ${provider === p ? colors.accentGreen : colors.borderDefault}`,
                  background: provider === p ? colors.bgProfit : 'transparent',
                  color: provider === p ? colors.accentGreen : colors.textSecondary,
                  fontFamily: 'IBM Plex Mono, monospace',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 200ms',
                  textTransform: 'capitalize'
                }}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        <div style={{
          background: colors.bgProfit,
          border: `1px solid ${colors.accentGreenBorder}`,
          borderRadius: '8px',
          padding: '20px',
          position: 'relative',
        }}>
          <pre style={{
            fontFamily: 'IBM Plex Mono, monospace',
            fontSize: '13px',
            color: colors.textPrimary,
            whiteSpace: 'pre-wrap',
            wordWrap: 'break-word',
            margin: 0,
            padding: '16px',
            background: colors.bgSurface,
            borderRadius: '6px',
            border: `1px solid ${colors.accentGreenBorder}`,
            overflow: 'auto',
          }}>
            {codeBlock}
          </pre>
          <button
            onClick={() => {
              navigator.clipboard.writeText(codeBlock);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }}
            style={{
              position: 'absolute',
              top: '20px',
              right: '20px',
              background: colors.accentGreen,
              color: '#ffffff',
              border: 'none',
              padding: '8px 12px',
              borderRadius: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12px',
              fontFamily: 'Inter, sans-serif',
              fontWeight: '600',
              transition: 'all 200ms',
            }}
            onMouseDown={(e) => (e.target.style.transform = 'scale(0.95)')}
            onMouseUp={(e) => (e.target.style.transform = 'scale(1)')}
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
      </div>

      <div style={{
        marginTop: '40px',
        background: colors.bgProfit,
        border: `1px solid ${colors.accentGreenBorder}`,
        borderRadius: '8px',
        padding: '24px',
      }}>
        <h3 style={{
          fontFamily: 'Playfair Display, serif',
          fontSize: '16px',
          fontWeight: '600',
          marginBottom: '12px',
          color: colors.accentGreen,
        }}>
          ✓ You're all set!
        </h3>
        <p style={{
          fontSize: '14px',
          color: colors.textSecondary,
          lineHeight: '1.6',
        }}>
          Your agent is now connected to layeroi. View it in your dashboard to see real-time cost tracking, ROI calculations, and anomaly alerts.
        </p>
      </div>
    </div>
  );
}
