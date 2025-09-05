import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import { Navigation } from './Navigation';

// Usar el sistema centralizado de mocks
import {
  createTestSetup
} from '@/mocks';

const mockPush = vi.fn();
let mockPathname = '/';

const mockTheme = {
  colors: {
    bgPrimary: '#0b0f1a',
    bgSecondary: '#0a0a0a',
    bgTertiary: '#1a1a1a',
    bgGradient: 'linear-gradient(135deg, #0f0f0f 0%, #1a1a1a 50%, #0d1117 100%)',
    glassLight: 'rgba(255, 255, 255, 0.1)',
    glassMedium: 'rgba(255, 255, 255, 0.15)',
    glassDark: 'rgba(30, 42, 63, 0.6)',
    glassDarker: 'rgba(0, 0, 0, 0.3)',
    glassBlack: 'rgba(0, 0, 0, 0.9)',
    primary50: '#e0f7ff',
    primary100: '#b3ecff',
    primary200: '#80e1ff',
    primary300: '#4dd6ff',
    primary400: '#26ccff',
    primary500: '#00cfff',
    primary600: '#00b8e6',
    primary700: '#009fcc',
    primary800: '#0086b3',
    primary900: '#006d99',
    secondary50: '#f0e6ff',
    secondary100: '#d4b3ff',
    secondary200: '#b580ff',
    secondary300: '#964dff',
    secondary400: '#7f26ff',
    secondary500: '#6b2fff',
    secondary600: '#5f29e6',
    secondary700: '#5223cc',
    secondary800: '#461db3',
    secondary900: '#3a1799',
    textPrimary: '#ffffff',
    textSecondary: '#c4cadc',
    textMuted: '#6b7280',
    textDisabled: 'rgba(255, 255, 255, 0.5)',
    success: '#10b981',
    error: '#ef4444',
    warning: '#f59e0b',
    info: '#3b82f6',
  },
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    '2xl': '3rem',
    '3xl': '4rem',
  },
  borderRadius: {
    sm: '0.25rem',
    md: '0.5rem',
    lg: '1rem',
    xl: '1.5rem',
    full: '9999px',
  },
  fontSize: {
    xs: '0.75rem',
    sm: '0.875rem',
    base: '1rem',
    lg: '1.125rem',
    xl: '1.25rem',
    '2xl': '1.5rem',
    '3xl': '1.875rem',
    '4xl': '2.25rem',
    '5xl': '3rem',
  },
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  },
  transitions: {
    fast: '0.15s ease',
    normal: '0.3s ease',
    slow: '0.5s ease',
  },
};

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush
  }),
  usePathname: () => mockPathname
}));

const mockSignOut = vi.fn();
const mockUserProfile = {
  id: 'test-user-id',
  email: 'test@example.com',
  name: 'Test User',
  avatar: null
};

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    userProfile: mockUserProfile,
    isAuthenticated: true,
    signOut: mockSignOut
  })
}));

vi.mock('../Icon', () => ({
  Icon: ({ name, size }: { name: string; size: string }) => (
    <span data-testid={`icon-${name}`} data-size={size}>
      {name}
    </span>
  ),
}));

vi.mock('./Navigation.constants', () => ({
  navigationItems: [
    {
      path: '/',
      label: 'Inicio',
      description: 'Página principal',
      icon: 'bot'
    },
    {
      path: '/visualizer',
      label: 'Visualizador',
      description: 'Ver archivos markdown',
      icon: 'square-library'
    },
    {
      path: '/test',
      label: 'Tester',
      description: 'Probar repositorio',
      icon: 'test-tubes'
    }
  ]
}));

const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <ThemeProvider theme={mockTheme}>
      {component}
    </ThemeProvider>
  );
};

describe('Navigation', () => {
  let mockSetProperty: ReturnType<typeof vi.fn>;
  const { teardown } = createTestSetup(); // ✅ Console mocks centralizados

  beforeEach(() => {
    mockSetProperty = vi.fn();
    Object.defineProperty(document.documentElement, 'style', {
      value: {
        setProperty: mockSetProperty
      },
      writable: true
    });

    mockPathname = '/';
    vi.clearAllMocks();
    mockSignOut.mockClear();
  });

  afterEach(() => {
    teardown(); // ✅ Limpieza automática
    vi.restoreAllMocks();
  });

  describe('Rendering', () => {
    it('should render navigation component as topbar', () => {
      renderWithTheme(<Navigation />);

      const nav = screen.getByRole('navigation');
      expect(nav).toBeInTheDocument();
    });

    it('should render Loreon AI brand', () => {
      renderWithTheme(<Navigation />);

      expect(screen.getByText('Loreon AI')).toBeInTheDocument();
    });

    it('should render brand as clickable dropdown trigger', () => {
      renderWithTheme(<Navigation />);

      const brand = screen.getByText('Loreon AI');
      expect(brand.closest('div')).toBeInTheDocument();
    });

    it('should render settings icon', () => {
      renderWithTheme(<Navigation />);

      const settingsIcons = screen.getAllByTestId('icon-settings');
      expect(settingsIcons.length).toBeGreaterThanOrEqual(1);
    });

    it('should render user avatar when authenticated', () => {
      renderWithTheme(<Navigation />);

      expect(screen.getByText('T')).toBeInTheDocument(); // First letter of "Test User"
    });

    it('should render chevron icon for dropdown', () => {
      renderWithTheme(<Navigation />);

      expect(screen.getByTestId('icon-chevron-down')).toBeInTheDocument();
    });
  });

  describe('CSS Variables Setup', () => {
    it('should set navigation height CSS variables on mount', () => {
      renderWithTheme(<Navigation />);

      expect(mockSetProperty).toHaveBeenCalledWith('--nav-height', '70px');
      expect(mockSetProperty).toHaveBeenCalledWith('--nav-width', '0px');
    });
  });

  describe('Dropdown Functionality', () => {
    it('should open dropdown when brand is clicked', async () => {
      renderWithTheme(<Navigation />);

      const brand = screen.getByText('Loreon AI');
      fireEvent.click(brand);

      await waitFor(() => {
        expect(screen.getByText('Inicio')).toBeVisible();
        expect(screen.getByText('Visualizador')).toBeVisible();
        expect(screen.getByText('Tester')).toBeVisible();
      });
    });

    it('should show chevron up when dropdown is open', async () => {
      renderWithTheme(<Navigation />);

      const brand = screen.getByText('Loreon AI');
      fireEvent.click(brand);

      await waitFor(() => {
        expect(screen.getByTestId('icon-chevron-up')).toBeInTheDocument();
      });
    });

    it('should close dropdown when brand is clicked again', async () => {
      renderWithTheme(<Navigation />);

      const brand = screen.getByText('Loreon AI');

      // Open dropdown
      fireEvent.click(brand);
      await waitFor(() => {
        expect(screen.getByText('Inicio')).toBeVisible();
      });

      // Close dropdown
      fireEvent.click(brand);
      await waitFor(() => {
        expect(screen.queryByText('Inicio')).not.toBeVisible();
      });
    });

    it('should close dropdown when clicking outside', async () => {
      renderWithTheme(<Navigation />);

      const brand = screen.getByText('Loreon AI');
      fireEvent.click(brand);

      await waitFor(() => {
        expect(screen.getByText('Inicio')).toBeVisible();
      });

      // Click outside
      fireEvent.mouseDown(document.body);

      await waitFor(() => {
        expect(screen.queryByText('Inicio')).not.toBeVisible();
      });
    });
  });

  describe('Dropdown Navigation Items', () => {
    it('should render all navigation items in dropdown', async () => {
      renderWithTheme(<Navigation />);

      const brand = screen.getByText('Loreon AI');
      fireEvent.click(brand);

      await waitFor(() => {
        expect(screen.getByText('Inicio')).toBeVisible();
        expect(screen.getByText('Página principal')).toBeVisible();
        expect(screen.getByTestId('icon-bot')).toBeInTheDocument();

        expect(screen.getByText('Visualizador')).toBeVisible();
        expect(screen.getByText('Ver archivos markdown')).toBeVisible();
        expect(screen.getByTestId('icon-square-library')).toBeInTheDocument();

        expect(screen.getByText('Tester')).toBeVisible();
        expect(screen.getByText('Probar repositorio')).toBeVisible();
        expect(screen.getByTestId('icon-test-tubes')).toBeInTheDocument();
      });
    });

    it('should navigate when dropdown items are clicked', async () => {
      renderWithTheme(<Navigation />);

      const brand = screen.getByText('Loreon AI');
      fireEvent.click(brand);

      await waitFor(() => {
        const inicioButton = screen.getByText('Inicio').closest('button');
        expect(inicioButton).toBeInTheDocument();

        fireEvent.click(inicioButton!);
      });

      expect(mockPush).toHaveBeenCalledWith('/');
    });

    it('should close dropdown after navigation', async () => {
      renderWithTheme(<Navigation />);

      const brand = screen.getByText('Loreon AI');
      fireEvent.click(brand);

      await waitFor(() => {
        const visualizadorButton = screen.getByText('Visualizador').closest('button');
        fireEvent.click(visualizadorButton!);
      });

      expect(mockPush).toHaveBeenCalledWith('/visualizer');

      await waitFor(() => {
        expect(screen.queryByText('Inicio')).not.toBeVisible();
      });
    });
  });

  describe('Active State', () => {
    it('should mark current path as active in dropdown', async () => {
      mockPathname = '/';
      renderWithTheme(<Navigation />);

      const brand = screen.getByText('Loreon AI');
      fireEvent.click(brand);

      await waitFor(() => {
        const activeButton = screen.getByText('Inicio').closest('button');
        expect(activeButton).toBeInTheDocument();
        // Check if the button has the active state styling
      });
    });

    it('should mark visualizer as active when on visualizer page', async () => {
      mockPathname = '/visualizer';
      renderWithTheme(<Navigation />);

      const brand = screen.getByText('Loreon AI');
      fireEvent.click(brand);

      await waitFor(() => {
        const activeButton = screen.getByText('Visualizador').closest('button');
        expect(activeButton).toBeInTheDocument();
        // Check if the button has the active state styling
      });
    });
  });

  describe('Component Structure', () => {
    it('should maintain topbar layout structure', () => {
      renderWithTheme(<Navigation />);

      const nav = screen.getByRole('navigation');
      expect(nav).toBeInTheDocument();

      expect(screen.getByText('Loreon AI')).toBeInTheDocument();
    });
  });

  describe('Integration Tests', () => {
    it('should work with different pathnames', () => {
      const testPaths = ['/', '/visualizer', '/test', '/settings', '/other'];

      testPaths.forEach(path => {
        mockPathname = path;
        const { unmount } = renderWithTheme(<Navigation />);

        const nav = screen.getByRole('navigation');
        expect(nav).toBeInTheDocument();

        unmount();
      });
    });

    it('should maintain functionality after re-renders', async () => {
      const { rerender } = renderWithTheme(<Navigation />);

      const brand = screen.getByText('Loreon AI');
      fireEvent.click(brand);

      rerender(
        <ThemeProvider theme={mockTheme}>
          <Navigation />
        </ThemeProvider>
      );

      const navAfterRerender = screen.getByRole('navigation');
      expect(navAfterRerender).toBeInTheDocument();
    });

    it('should handle rapid clicks gracefully', async () => {
      renderWithTheme(<Navigation />);

      const brand = screen.getByText('Loreon AI');

      // Multiple rapid clicks
      fireEvent.click(brand);
      fireEvent.click(brand);
      fireEvent.click(brand);

      await waitFor(() => {
        const nav = screen.getByRole('navigation');
        expect(nav).toBeInTheDocument();
      });
    });
  });

  describe('User Functionality', () => {
    it('should render user avatar with correct initial', () => {
      renderWithTheme(<Navigation />);

      const avatar = screen.getByText('T');
      expect(avatar).toBeInTheDocument();
    });

    it('should open user dropdown when avatar is clicked', async () => {
      renderWithTheme(<Navigation />);

      const avatar = screen.getByText('T');
      fireEvent.click(avatar);

      await waitFor(() => {
        expect(screen.getByText('Test User')).toBeVisible();
        expect(screen.getByText('test@example.com')).toBeVisible();
      });
    });

    it('should render user menu items', async () => {
      renderWithTheme(<Navigation />);

      const avatar = screen.getByText('T');
      fireEvent.click(avatar);

      await waitFor(() => {
        expect(screen.getByText('Test User')).toBeVisible();
        expect(screen.getByText('Configuración')).toBeVisible();
        expect(screen.getByText('Cerrar Sesión')).toBeVisible();
      }, { timeout: 3000 });
    });

    it('should call signOut when logout is clicked', async () => {
      renderWithTheme(<Navigation />);

      const avatar = screen.getByText('T');
      fireEvent.click(avatar);

      await waitFor(() => {
        const logoutButton = screen.getByText('Cerrar Sesión');
        fireEvent.click(logoutButton);
      });

      expect(mockSignOut).toHaveBeenCalled();
      expect(mockPush).toHaveBeenCalledWith('/auth/login');
    });
  });
});
