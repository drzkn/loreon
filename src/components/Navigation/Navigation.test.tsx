import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Navigation } from './Navigation';

const mockPush = vi.fn();
let mockPathname = '/';

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
      label: 'Home',
      description: 'Página principal',
      icon: '🏠'
    },
    {
      path: '/connect',
      label: 'Connect',
      description: 'Conectar con Notion',
      icon: '🔗'
    },
    {
      path: '/test',
      label: 'Test',
      description: 'Página de pruebas',
      icon: '🧪'
    }
  ]
}));

describe('Navigation', () => {
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
      render(<Navigation />);

      const nav = screen.getByRole('navigation');
      expect(nav).toBeInTheDocument();
      expect(nav.className).toContain('globalNavigation');
    });

    it('should render navigation icons', () => {
      render(<Navigation />);

      expect(screen.getByText('🏠')).toBeInTheDocument();
      expect(screen.getByText('🔗')).toBeInTheDocument();
      expect(screen.getByText('🧪')).toBeInTheDocument();
      expect(screen.getByText('⚙️')).toBeInTheDocument(); // Settings button
    });

    it('should render navigation buttons', () => {
      render(<Navigation />);

      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(4); // 3 navigation items + 1 settings button
    });

    it('should not be expanded initially', () => {
      render(<Navigation />);

      const nav = screen.getByRole('navigation');
      expect(nav.className).not.toContain('expanded');
    });
  });

  describe('Active State', () => {
    it('should mark current path as active', () => {
      mockPathname = '/';

      render(<Navigation />);

      const buttons = screen.getAllByRole('button');
      expect(buttons[0].className).toContain('active'); // Home button
    });

    it('should not mark other paths as active when on home', () => {
      mockPathname = '/';

      render(<Navigation />);

      const buttons = screen.getAllByRole('button');
      expect(buttons[1].className).not.toContain('active'); // Connect button
      expect(buttons[2].className).not.toContain('active'); // Test button
    });

    it('should mark connect path as active when on connect page', () => {
      mockPathname = '/connect';

      render(<Navigation />);

      const buttons = screen.getAllByRole('button');
      expect(buttons[1].className).toContain('active'); // Connect button
    });

    it('should mark settings path as active when on settings page', () => {
      mockPathname = '/settings';

      render(<Navigation />);

      const buttons = screen.getAllByRole('button');
      expect(buttons[3].className).toContain('active'); // Settings button (last button)
    });
  });

  describe('Expansion Functionality', () => {
    it('should expand navigation on mouse enter', async () => {
      render(<Navigation />);

      const nav = screen.getByRole('navigation');

      expect(nav.className).not.toContain('expanded');

      fireEvent.mouseEnter(nav);

      await waitFor(() => {
        expect(nav.className).toContain('expanded');
      });
    });

    it('should collapse navigation on mouse leave', async () => {
      render(<Navigation />);

      const nav = screen.getByRole('navigation');

      fireEvent.mouseEnter(nav);
      await waitFor(() => {
        expect(nav.className).toContain('expanded');
      });

      fireEvent.mouseLeave(nav);

      await waitFor(() => {
        expect(nav.className).not.toContain('expanded');
      });
    });

    it('should show labels when expanded', async () => {
      render(<Navigation />);

      const nav = screen.getByRole('navigation');

      fireEvent.mouseEnter(nav);

      await waitFor(() => {
        expect(screen.getByText('Home')).toBeInTheDocument();
        expect(screen.getByText('Connect')).toBeInTheDocument();
        expect(screen.getByText('Test')).toBeInTheDocument();
        expect(screen.getByText('Configuración')).toBeInTheDocument();
      });
    });
  });

  describe('CSS Variables Update', () => {
    it('should update CSS variables when expanding', async () => {
      render(<Navigation />);

      const nav = screen.getByRole('navigation');

      fireEvent.mouseEnter(nav);

      await waitFor(() => {
        expect(mockSetProperty).toHaveBeenCalledWith('--nav-expanded', '1');
        expect(mockSetProperty).toHaveBeenCalledWith('--nav-width', '200px');
      });
    });

    it('should update CSS variables when collapsing', async () => {
      render(<Navigation />);

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
      render(<Navigation />);

      const buttons = screen.getAllByRole('button');

      fireEvent.click(buttons[0]);
      expect(mockPush).toHaveBeenCalledWith('/');

      fireEvent.click(buttons[1]);
      expect(mockPush).toHaveBeenCalledWith('/connect');

      fireEvent.click(buttons[2]);
      expect(mockPush).toHaveBeenCalledWith('/test');

      fireEvent.click(buttons[3]);
      expect(mockPush).toHaveBeenCalledWith('/settings');
    });

    it('should handle multiple navigation calls', () => {
      render(<Navigation />);

      const buttons = screen.getAllByRole('button');

      fireEvent.click(buttons[0]);
      fireEvent.click(buttons[1]);
      fireEvent.click(buttons[0]);

      expect(mockPush).toHaveBeenCalledTimes(3);
      expect(mockPush).toHaveBeenNthCalledWith(1, '/');
      expect(mockPush).toHaveBeenNthCalledWith(2, '/connect');
      expect(mockPush).toHaveBeenNthCalledWith(3, '/');
    });
  });

  describe('Tooltips', () => {
    it('should show extended tooltips when collapsed', () => {
      render(<Navigation />);

      const buttons = screen.getAllByRole('button');

      expect(buttons[0]).toHaveAttribute('title', 'Home - Página principal');
      expect(buttons[1]).toHaveAttribute('title', 'Connect - Conectar con Notion');
      expect(buttons[2]).toHaveAttribute('title', 'Test - Página de pruebas');
      expect(buttons[3]).toHaveAttribute('title', 'Configuración - Configuración de la aplicación');
    });

    it('should show simple tooltips when expanded', async () => {
      render(<Navigation />);

      const nav = screen.getByRole('navigation');
      const buttons = screen.getAllByRole('button');

      fireEvent.mouseEnter(nav);

      await waitFor(() => {
        expect(buttons[0]).toHaveAttribute('title', 'Página principal');
        expect(buttons[1]).toHaveAttribute('title', 'Conectar con Notion');
        expect(buttons[2]).toHaveAttribute('title', 'Página de pruebas');
        expect(buttons[3]).toHaveAttribute('title', 'Configuración de la aplicación');
      });
    });
  });

  describe('Component Structure', () => {
    it('should have correct CSS structure', () => {
      render(<Navigation />);

      const nav = screen.getByRole('navigation');
      const container = nav.querySelector('[class*="navContainer"]');
      const items = nav.querySelectorAll('[class*="navItem"]');
      const icons = nav.querySelectorAll('[class*="navIcon"]');

      expect(nav.className).toContain('globalNavigation');
      expect(container).toBeInTheDocument();
      expect(items).toHaveLength(4); // 3 navigation items + 1 settings button
      expect(icons).toHaveLength(4); // 3 navigation icons + 1 settings icon
    });

    it('should have proper accessibility attributes', () => {
      render(<Navigation />);

      const buttons = screen.getAllByRole('button');

      buttons.forEach(button => {
        expect(button).toBeInTheDocument();
        expect(button.tagName).toBe('BUTTON');
      });
    });
  });

  describe('Event Handling', () => {
    it('should handle rapid mouse events', async () => {
      render(<Navigation />);

      const nav = screen.getByRole('navigation');

      fireEvent.mouseEnter(nav);
      fireEvent.mouseLeave(nav);
      fireEvent.mouseEnter(nav);
      fireEvent.mouseLeave(nav);

      await waitFor(() => {
        expect(nav.className).not.toContain('expanded');
      });
    });

    it('should maintain component integrity', () => {
      render(<Navigation />);

      const nav = screen.getByRole('navigation');
      expect(nav).toBeInTheDocument();
      expect(nav.className).toContain('globalNavigation');
    });
  });

  describe('Integration Tests', () => {
    it('should work with different pathnames', () => {
      const testPaths = ['/', '/connect', '/test', '/other'];

      testPaths.forEach(path => {
        mockPathname = path;
        const { unmount } = render(<Navigation />);

        const nav = screen.getByRole('navigation');
        expect(nav).toBeInTheDocument();

        unmount();
      });
    });

    it('should maintain functionality after re-renders', async () => {
      const { rerender } = render(<Navigation />);

      const nav = screen.getByRole('navigation');

      fireEvent.mouseEnter(nav);
      await waitFor(() => {
        expect(nav.className).toContain('expanded');
      });

      rerender(<Navigation />);

      const navAfterRerender = screen.getByRole('navigation');
      expect(navAfterRerender).toBeInTheDocument();
    });
  });
});
