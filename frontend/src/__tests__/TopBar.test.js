import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock dependencies
jest.mock('../hooks/useResponsive', () => ({
  useResponsive: () => ({
    isMobile: false,
    isTablet: true,
    isDesktop: false,
    isTabletUp: true,
    isDesktopUp: false,
  }),
}));

jest.mock('../styles/theme', () => ({
  theme: {
    colors: {
      card: '#ffffff',
      border: '#e0e0e0',
      text: {
        primary: '#1a1a1a',
        secondary: '#666666',
      },
      accent: '#0066cc',
      danger: '#b30000',
    },
    fonts: {
      serif: "'Playfair Display', serif",
      mono: "'IBM Plex Mono', monospace",
    },
  },
}));

// Import after mocking
import TopBar from '../layouts/TopBar';

describe('TopBar Component', () => {
  test('renders TopBar container', () => {
    const { container } = render(
      <TopBar isActive={true} onMenuToggle={() => {}} sidebarOpen={false} isMobile={false} />
    );

    expect(container.querySelector('.top-bar')).toBeInTheDocument();
  });

  test('renders title "layeroi"', () => {
    render(
      <TopBar isActive={true} onMenuToggle={() => {}} sidebarOpen={false} isMobile={false} />
    );

    expect(screen.getByText('layeroi')).toBeInTheDocument();
  });

  test('calls onMenuToggle when mobile menu button is clicked', () => {
    const onMenuToggle = jest.fn();
    render(
      <TopBar isActive={true} onMenuToggle={onMenuToggle} sidebarOpen={false} isMobile={true} />
    );

    const menuButton = screen.getByRole('button', { name: /menu/i });
    fireEvent.click(menuButton);

    expect(onMenuToggle).toHaveBeenCalled();
  });
});
