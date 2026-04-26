import { createContext, useContext, useEffect, useState } from 'react';
import { darkTheme, lightTheme } from './themes';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [mode, setMode] = useState(() =>
    localStorage.getItem('layeroi-theme-mode') || 'auto'
  );

  const [resolved, setResolved] = useState('dark');

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: light)');
    const compute = () => {
      if (mode === 'auto') {
        setResolved(mq.matches ? 'light' : 'dark');
      } else {
        setResolved(mode);
      }
    };
    compute();
    mq.addEventListener('change', compute);
    return () => mq.removeEventListener('change', compute);
  }, [mode]);

  useEffect(() => {
    localStorage.setItem('layeroi-theme-mode', mode);
    document.documentElement.setAttribute('data-theme', resolved);
  }, [mode, resolved]);

  const colors = resolved === 'light' ? lightTheme : darkTheme;

  return (
    <ThemeContext.Provider value={{ mode, setMode, resolved, colors }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
