import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useRouter, usePathname } from 'next/navigation';

// Mock de Next.js navigation
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
  usePathname: vi.fn()
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

  it('should show connection content by default', () => {
    render(<SettingsPage />);

    expect(screen.getByTestId('connection-content')).toBeInTheDocument();
  });

  it('should render tabs and content with styled-components', () => {
    render(<SettingsPage />);

    // Verificar que los elementos están presentes (sin verificar estilos específicos)
    const connectTab = screen.getByRole('button', { name: /🔌 Conexión/i });
    expect(connectTab).toBeInTheDocument();

    // Verificar que el tab es clickeable
    expect(connectTab).not.toBeDisabled();
  });

  it('should render default content when on /settings path', () => {
    (vi.mocked(usePathname)).mockReturnValue('/settings');

    render(<SettingsPage />);

    // Debería mostrar el contenido por defecto si no hay tab específico
    expect(screen.getByTestId('connection-content')).toBeInTheDocument();
  });

  it('should handle /settings/connect path correctly', () => {
    (vi.mocked(usePathname)).mockReturnValue('/settings/connect');

    render(<SettingsPage />);

    expect(screen.getByTestId('connection-content')).toBeInTheDocument();
  });

  it('should show tab icon and label', () => {
    render(<SettingsPage />);

    const tabButton = screen.getByRole('button', { name: /🔌 Conexión/i });

    // Verificar que contiene tanto el icono como el label
    expect(tabButton).toHaveTextContent('🔌');
    expect(tabButton).toHaveTextContent('Conexión');
  });
}); 