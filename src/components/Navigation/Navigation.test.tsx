import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import { Navigation } from './Navigation';

const mockPush = vi.fn();
let mockPathname = '/';

// Mock theme para styled components
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

vi.mock('./Navigation.constants', () => ({
  navigationItems: [
    {
      path: '/',
      label: 'Inicio',
      description: 'Página principal',
      icon: '🏠'
    },
    {
      path: '/visualizer',
      label: 'Visualizador',
      description: 'Ver archivos markdown',
      icon: '📚'
    },
    {
      path: '/test',
      label: 'Tester',
      description: 'Probar repositorio',
      icon: '🧪'
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

describe.skip('Navigation', () => {
  let mockSetProperty: ReturnType<typeof vi.fn>;

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
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Rendering', () => {
    it('should render navigation component', () => {
      renderWithTheme(<Navigation />);

      const nav = screen.getByRole('navigation');
      expect(nav).toBeInTheDocument();
    });

    it('should render navigation icons', () => {
      renderWithTheme(<Navigation />);

      expect(screen.getByText('🏠')).toBeInTheDocument();
      expect(screen.getByText('📚')).toBeInTheDocument();
      expect(screen.getByText('🧪')).toBeInTheDocument();
      expect(screen.getByText('⚙️')).toBeInTheDocument(); // Settings button
    });

    it('should render navigation buttons', () => {
      renderWithTheme(<Navigation />);

      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(4); // 3 navigation items + 1 settings button
    });
  });

  describe('Active State', () => {
    it('should mark current path as active with data-active attribute', () => {
      mockPathname = '/';

      renderWithTheme(<Navigation />);

      const buttons = screen.getAllByRole('button');
      expect(buttons[0]).toHaveAttribute('data-active', 'true');
    });

    it('should not mark other paths as active when on home', () => {
      mockPathname = '/';

      renderWithTheme(<Navigation />);

      const buttons = screen.getAllByRole('button');
      expect(buttons[1]).toHaveAttribute('data-active', 'false');
      expect(buttons[2]).toHaveAttribute('data-active', 'false');
    });

    it('should mark visualizer path as active when on visualizer page', () => {
      mockPathname = '/visualizer';

      renderWithTheme(<Navigation />);

      const buttons = screen.getAllByRole('button');
      expect(buttons[1]).toHaveAttribute('data-active', 'true');
    });

    it('should mark settings path as active when on settings page', () => {
      mockPathname = '/settings';

      renderWithTheme(<Navigation />);

      const buttons = screen.getAllByRole('button');
      expect(buttons[3]).toHaveAttribute('data-active', 'true');
    });
  });

  describe('Expansion Functionality', () => {
    it('should show labels when expanded', async () => {
      renderWithTheme(<Navigation />);

      const nav = screen.getByRole('navigation');

      fireEvent.mouseEnter(nav);

      await waitFor(() => {
        expect(screen.getByText('Inicio')).toBeVisible();
        expect(screen.getByText('Visualizador')).toBeVisible();
        expect(screen.getByText('Tester')).toBeVisible();
        expect(screen.getByText('Configuración')).toBeVisible();
      });
    });
  });

  describe('CSS Variables Update', () => {
    it('should update CSS variables when expanding', async () => {
      renderWithTheme(<Navigation />);

      const nav = screen.getByRole('navigation');

      fireEvent.mouseEnter(nav);

      await waitFor(() => {
        expect(mockSetProperty).toHaveBeenCalledWith('--nav-expanded', '1');
        expect(mockSetProperty).toHaveBeenCalledWith('--nav-width', '200px');
      });
    });

    it('should update CSS variables when collapsing', async () => {
      renderWithTheme(<Navigation />);

      const nav = screen.getByRole('navigation');

      fireEvent.mouseEnter(nav);
      await waitFor(() => {
        expect(mockSetProperty).toHaveBeenCalledWith('--nav-expanded', '1');
      });

      mockSetProperty.mockClear();

      fireEvent.mouseLeave(nav);

      await waitFor(() => {
        expect(mockSetProperty).toHaveBeenCalledWith('--nav-expanded', '0');
        expect(mockSetProperty).toHaveBeenCalledWith('--nav-width', '60px');
      });
    });
  });

  describe('Navigation Functionality', () => {
    it('should navigate when buttons are clicked', () => {
      renderWithTheme(<Navigation />);

      const buttons = screen.getAllByRole('button');

      fireEvent.click(buttons[0]);
      expect(mockPush).toHaveBeenCalledWith('/');

      fireEvent.click(buttons[1]);
      expect(mockPush).toHaveBeenCalledWith('/visualizer');

      fireEvent.click(buttons[2]);
      expect(mockPush).toHaveBeenCalledWith('/test');

      fireEvent.click(buttons[3]);
      expect(mockPush).toHaveBeenCalledWith('/settings/connect');
    });

    it('should handle multiple navigation calls', () => {
      renderWithTheme(<Navigation />);

      const buttons = screen.getAllByRole('button');

      fireEvent.click(buttons[0]);
      fireEvent.click(buttons[1]);
      fireEvent.click(buttons[0]);

      expect(mockPush).toHaveBeenCalledTimes(3);
      expect(mockPush).toHaveBeenNthCalledWith(1, '/');
      expect(mockPush).toHaveBeenNthCalledWith(2, '/visualizer');
      expect(mockPush).toHaveBeenNthCalledWith(3, '/');
    });
  });

  describe('Tooltips', () => {
    it('should show extended tooltips when collapsed', () => {
      renderWithTheme(<Navigation />);

      const buttons = screen.getAllByRole('button');

      expect(buttons[0]).toHaveAttribute('title', 'Inicio - Página principal');
      expect(buttons[1]).toHaveAttribute('title', 'Visualizador - Ver archivos markdown');
      expect(buttons[2]).toHaveAttribute('title', 'Tester - Probar repositorio');
      expect(buttons[3]).toHaveAttribute('title', 'Configuración - Configuración de la aplicación');
    });

    it('should show simple tooltips when expanded', async () => {
      renderWithTheme(<Navigation />);

      const nav = screen.getByRole('navigation');
      const buttons = screen.getAllByRole('button');

      fireEvent.mouseEnter(nav);

      await waitFor(() => {
        expect(buttons[0]).toHaveAttribute('title', 'Página principal');
        expect(buttons[1]).toHaveAttribute('title', 'Ver archivos markdown');
        expect(buttons[2]).toHaveAttribute('title', 'Probar repositorio');
        expect(buttons[3]).toHaveAttribute('title', 'Configuración de la aplicación');
      });
    });
  });

  describe('Component Structure', () => {
    it('should have proper accessibility attributes', () => {
      renderWithTheme(<Navigation />);

      const buttons = screen.getAllByRole('button');

      buttons.forEach(button => {
        expect(button).toBeInTheDocument();
        expect(button.tagName).toBe('BUTTON');
      });
    });
  });

  describe('Event Handling', () => {
    it('should maintain component integrity', () => {
      renderWithTheme(<Navigation />);

      const nav = screen.getByRole('navigation');
      expect(nav).toBeInTheDocument();
    });
  });

  describe('Integration Tests', () => {
    it('should work with different pathnames', () => {
      const testPaths = ['/', '/visualizer', '/test', '/other'];

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

      const nav = screen.getByRole('navigation');

      fireEvent.mouseEnter(nav);

      rerender(
        <ThemeProvider theme={mockTheme}>
          <Navigation />
        </ThemeProvider>
      );

      const navAfterRerender = screen.getByRole('navigation');
      expect(navAfterRerender).toBeInTheDocument();
    });
  });
});
