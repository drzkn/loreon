import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useRouter } from 'next/navigation';

// Mock de useRouter
vi.mock('next/navigation', () => ({
  useRouter: vi.fn()
}));

// Mock del componente PageHeader
vi.mock('../../../components', () => ({
  PageHeader: vi.fn(({ title, description }: { title: string; description: string }) => (
    <div data-testid="page-header">
      <h1>{title}</h1>
      <p>{description}</p>
    </div>
  ))
}));

import SettingsPage from '../page';

describe('SettingsPage', () => {
  const mockPush = vi.fn();

  beforeEach(() => {
    (vi.mocked(useRouter)).mockReturnValue({
      push: mockPush,
      back: vi.fn(),
      forward: vi.fn(),
      refresh: vi.fn(),
      replace: vi.fn(),
      prefetch: vi.fn(),
    });
    vi.clearAllMocks();
  });

  it('should render page header with correct title and description', () => {
    render(<SettingsPage />);

    expect(screen.getByText('Configuración')).toBeInTheDocument();
    expect(screen.getByText('Configura las diferentes opciones de la aplicación')).toBeInTheDocument();
  });

  it('should render Connect tab', () => {
    render(<SettingsPage />);

    expect(screen.getByText('🔌')).toBeInTheDocument();
    expect(screen.getByText('Connect')).toBeInTheDocument();
  });

  it('should navigate to connect page when Connect tab is clicked', () => {
    render(<SettingsPage />);

    const connectTab = screen.getByRole('button', { name: /🔌 Connect/i });
    fireEvent.click(connectTab);

    expect(mockPush).toHaveBeenCalledWith('/connect');
  });

  it('should show active state for Connect tab by default', () => {
    render(<SettingsPage />);

    const connectTab = screen.getByRole('button', { name: /🔌 Connect/i });
    expect(connectTab).toHaveStyle('color: #10b981');
  });

  it('should render placeholder content', () => {
    render(<SettingsPage />);

    expect(screen.getByText('Selecciona una pestaña para configurar las opciones correspondientes')).toBeInTheDocument();
  });

  it('should render tabs container with correct styling', () => {
    render(<SettingsPage />);

    const tabsContainer = screen.getByRole('button', { name: /🔌 Connect/i }).parentElement;
    expect(tabsContainer).toHaveStyle('display: flex');
    expect(tabsContainer).toHaveStyle('gap: 1rem');
  });
}); 