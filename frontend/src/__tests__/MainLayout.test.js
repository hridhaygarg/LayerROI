import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock the dependencies
jest.mock('../layouts/Sidebar', () => {
  return function MockSidebar() {
    return <div data-testid="sidebar">Sidebar</div>;
  };
});

jest.mock('../layouts/TopBar', () => {
  return function MockTopBar() {
    return <div data-testid="topbar">TopBar</div>;
  };
});

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
      bg: '#ffffff',
    },
  },
}));

// Import after mocking
import MainLayout from '../layouts/MainLayout';

describe('MainLayout Component', () => {
  test('renders layout container', () => {
    const { container } = render(
      <MainLayout active="overview">
        <div>Test Content</div>
      </MainLayout>
    );

    expect(container.querySelector('.main-layout')).toBeInTheDocument();
  });

  test('renders children content', () => {
    render(
      <MainLayout active="overview">
        <div>Test Content</div>
      </MainLayout>
    );

    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  test('renders main content area', () => {
    const { container } = render(
      <MainLayout active="overview">
        <div>Test Content</div>
      </MainLayout>
    );

    expect(container.querySelector('.main-content')).toBeInTheDocument();
  });
});
