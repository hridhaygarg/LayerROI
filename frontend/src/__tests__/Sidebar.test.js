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

// Import after mocking
import Sidebar from '../layouts/Sidebar';

const mockColors = {
  bgSurface: '#ffffff',
  borderDefault: '#e0e0e0',
  textPrimary: '#1a1a1a',
  textSecondary: '#666666',
  accentGreen: '#22c55e',
  bgSubtle: '#f5f5f5',
};

describe('Sidebar Component', () => {
  test('renders sidebar navigation', () => {
    const { container } = render(
      <Sidebar active="overview" onNavigate={() => {}} colors={mockColors} />
    );

    expect(container.querySelector('.sidebar')).toBeInTheDocument();
  });

  test('renders navigation items with correct labels', () => {
    render(
      <Sidebar active="overview" onNavigate={() => {}} colors={mockColors} />
    );

    expect(screen.getByLabelText('Overview')).toBeInTheDocument();
    expect(screen.getByLabelText('Agents')).toBeInTheDocument();
    expect(screen.getByLabelText('Budget')).toBeInTheDocument();
    expect(screen.getByLabelText('Reports')).toBeInTheDocument();
  });

  test('calls onNavigate when navigation item is clicked', () => {
    const onNavigate = jest.fn();
    render(
      <Sidebar active="overview" onNavigate={onNavigate} colors={mockColors} />
    );

    const agentsButton = screen.getByLabelText('Agents');
    fireEvent.click(agentsButton);

    expect(onNavigate).toHaveBeenCalledWith('agents');
  });

  test('highlights active navigation item', () => {
    const { container } = render(
      <Sidebar active="budget" onNavigate={() => {}} colors={mockColors} />
    );

    const buttons = container.querySelectorAll('button');
    const budgetButton = Array.from(buttons).find((btn) =>
      btn.getAttribute('aria-label') === 'Budget'
    );

    expect(budgetButton).toHaveStyle({
      color: mockColors.accentGreen,
      background: mockColors.bgSubtle,
    });
  });
});
