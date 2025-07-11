import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useRouter, usePathname } from 'next/navigation';

// Mock de Next.js navigation
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
  usePathname: vi.fn()
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

// Mock del componente ConnectionContent
vi.mock('../components/ConnectionContent', () => ({
  ConnectionContent: vi.fn(() => (
    <div data-testid="connection-content">Connection Content</div>
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

    (vi.mocked(usePathname)).mockReturnValue('/settings');

    vi.clearAllMocks();
  });

  it('should render page header with correct title and description', () => {
    render(<SettingsPage />);

    expect(screen.getByText('Configuración')).toBeInTheDocument();
    expect(screen.getByText('Configura las diferentes opciones de la aplicación')).toBeInTheDocument();
  });

  it('should render Conexión tab', () => {
    render(<SettingsPage />);

    expect(screen.getByText('🔌')).toBeInTheDocument();
    expect(screen.getByText('Conexión')).toBeInTheDocument();
  });

  it('should navigate to connect page when Conexión tab is clicked', () => {
    render(<SettingsPage />);

    const connectTab = screen.getByRole('button', { name: /🔌 Conexión/i });
    fireEvent.click(connectTab);

    expect(mockPush).toHaveBeenCalledWith('/settings/connect');
  });

  it('should show active state for Conexión tab by default', () => {
    render(<SettingsPage />);

    const connectTab = screen.getByRole('button', { name: /🔌 Conexión/i });
    expect(connectTab).toHaveStyle('color: #10b981');
  });

  it('should render connection content by default', () => {
    render(<SettingsPage />);

    expect(screen.getByTestId('connection-content')).toBeInTheDocument();
  });

  it('should render tabs container with correct styling', () => {
    render(<SettingsPage />);

    const tabsContainer = screen.getByRole('button', { name: /🔌 Conexión/i }).parentElement;
    expect(tabsContainer).toHaveStyle('display: flex');
    expect(tabsContainer).toHaveStyle('gap: 1rem');
  });
}); 