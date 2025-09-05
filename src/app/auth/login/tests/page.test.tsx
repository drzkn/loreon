/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useRouter } from 'next/navigation';
import { ThemeProvider } from 'styled-components';
import { theme } from '@/lib/theme';
import { useAuth } from '@/hooks/useAuth';
import LoginPage from '../page';

// Usar el sistema centralizado de mocks
import {
  createTestSetup
} from '@/mocks';

vi.mock('next/navigation');
vi.mock('@/hooks/useAuth');

const mockPush = vi.fn();
const mockSignInWithGoogle = vi.fn();

describe('LoginPage', () => {
  const { teardown } = createTestSetup(); // ✅ Console mocks centralizados

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useRouter).mockReturnValue({ push: mockPush } as any);
    vi.mocked(useAuth).mockReturnValue({
      isAuthenticated: false,
      signInWithGoogle: mockSignInWithGoogle
    } as any);
  });

  afterEach(() => {
    teardown(); // ✅ Limpieza automática
  });

  const renderWithTheme = (component: React.ReactElement) => {
    return render(<ThemeProvider theme={theme}>{component}</ThemeProvider>);
  };
  it('debería renderizar UI completa y manejar estados de autenticación', async () => {
    renderWithTheme(<LoginPage />);

    expect(screen.getByText('Loreon AI')).toBeInTheDocument();
    expect(screen.getByText('Inicia sesión para continuar')).toBeInTheDocument();
    expect(screen.getByText('Continuar con Google')).toBeInTheDocument();
    expect(screen.getByText(/Después podrás configurar/)).toBeInTheDocument();

    const button = screen.getByRole('button');
    expect(button).not.toBeDisabled();

    fireEvent.click(button);
    expect(screen.getByText('Conectando...')).toBeInTheDocument();
    expect(button).toBeDisabled();
    expect(mockSignInWithGoogle).toHaveBeenCalled();
  });

  it('debería manejar errores y redirección cuando está autenticado', async () => {
    mockSignInWithGoogle.mockRejectedValue(new Error('Test error'));
    renderWithTheme(<LoginPage />);

    fireEvent.click(screen.getByRole('button'));

    await waitFor(() => {
      expect(screen.getByText(/Error al conectar con Google/)).toBeInTheDocument();
      expect(screen.getByText(/Test error/)).toBeInTheDocument();
    });

    vi.mocked(useAuth).mockReturnValue({
      isAuthenticated: true,
      signInWithGoogle: mockSignInWithGoogle
    } as any);

    renderWithTheme(<LoginPage />);
    expect(mockPush).toHaveBeenCalledWith('/chat');
  });

  it('debería manejar errores que no son instancia de Error', async () => {
    mockSignInWithGoogle.mockRejectedValue('String error');
    renderWithTheme(<LoginPage />);

    fireEvent.click(screen.getByRole('button'));

    await waitFor(() => {
      expect(screen.getByText(/Error al conectar con Google/)).toBeInTheDocument();
      expect(screen.getByText(/Por favor, inténtalo de nuevo/)).toBeInTheDocument();
    });
  });
});
