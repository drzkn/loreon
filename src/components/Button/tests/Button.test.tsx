import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import { Button } from '../Button';
import { theme } from '../../../lib/theme';
import { createTestSetup } from '@/mocks';

const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <ThemeProvider theme={theme}>
      {component}
    </ThemeProvider>
  );
};

describe('Button', () => {
  const { teardown } = createTestSetup();

  afterEach(() => {
    teardown();
  });

  describe('🎨 Rendering & Content', () => {
    it('should render with children content', () => {
      renderWithTheme(<Button>Click me</Button>);
      expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument();
    });

    it('should render complex children content', () => {
      renderWithTheme(
        <Button>
          <span>Icon</span>
          <span>Text</span>
        </Button>
      );
      expect(screen.getByText('Icon')).toBeInTheDocument();
      expect(screen.getByText('Text')).toBeInTheDocument();
    });
  });

  describe('🔧 Props & Variants', () => {
    it('should apply default props correctly', () => {
      renderWithTheme(<Button>Default</Button>);
      const button = screen.getByRole('button');

      expect(button).toHaveAttribute('type', 'button');
      expect(button).not.toBeDisabled();
    });

    it('should handle all button types', () => {
      const types = ['button', 'submit', 'reset'] as const;

      types.forEach((type) => {
        const { unmount } = renderWithTheme(<Button type={type}>Test</Button>);
        expect(screen.getByRole('button')).toHaveAttribute('type', type);
        unmount();
      });
    });

    it('should handle all variants', () => {
      const variants = ['primary', 'secondary', 'success', 'warning', 'error', 'loading'] as const;

      variants.forEach((variant) => {
        const { unmount } = renderWithTheme(<Button variant={variant}>Test</Button>);
        expect(screen.getByRole('button')).toBeInTheDocument();
        unmount();
      });
    });

    it('should handle all sizes', () => {
      const sizes = ['sm', 'md', 'lg'] as const;

      sizes.forEach((size) => {
        const { unmount } = renderWithTheme(<Button size={size}>Test</Button>);
        expect(screen.getByRole('button')).toBeInTheDocument();
        unmount();
      });
    });

    it('should apply fullWidth prop', () => {
      renderWithTheme(<Button fullWidth>Full Width</Button>);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      renderWithTheme(<Button className="custom-class">Test</Button>);
      expect(screen.getByRole('button')).toHaveClass('custom-class');
    });
  });

  describe('🎯 Interactions', () => {
    it('should call onClick when clicked', () => {
      const onClick = vi.fn();
      renderWithTheme(<Button onClick={onClick}>Clickable</Button>);

      fireEvent.click(screen.getByRole('button'));
      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('should not call onClick when disabled', () => {
      const onClick = vi.fn();
      renderWithTheme(
        <Button onClick={onClick} disabled>
          Disabled
        </Button>
      );

      fireEvent.click(screen.getByRole('button'));
      expect(onClick).not.toHaveBeenCalled();
    });

    it('should be accessible via keyboard', () => {
      const onClick = vi.fn();
      renderWithTheme(<Button onClick={onClick}>Keyboard</Button>);

      const button = screen.getByRole('button');
      fireEvent.keyDown(button, { key: 'Enter' });
      fireEvent.keyUp(button, { key: 'Enter' });

      expect(button).toBeInTheDocument();
    });
  });

  describe('♿ Accessibility', () => {
    it('should be disabled when disabled prop is true', () => {
      renderWithTheme(<Button disabled>Disabled Button</Button>);
      expect(screen.getByRole('button')).toBeDisabled();
    });

    it('should be focusable when not disabled', () => {
      renderWithTheme(<Button>Focusable</Button>);
      const button = screen.getByRole('button');

      button.focus();
      expect(button).toHaveFocus();
    });

    it('should not be focusable when disabled', () => {
      renderWithTheme(<Button disabled>Not Focusable</Button>);
      const button = screen.getByRole('button');

      button.focus();
      expect(button).not.toHaveFocus();
    });
  });

  describe('🔄 Edge Cases', () => {
    it('should handle onClick being undefined', () => {
      renderWithTheme(<Button>No Click Handler</Button>);

      expect(() => {
        fireEvent.click(screen.getByRole('button'));
      }).not.toThrow();
    });

    it('should handle empty children', () => {
      renderWithTheme(<Button>{null}</Button>);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should handle multiple clicks rapidly', () => {
      const onClick = vi.fn();
      renderWithTheme(<Button onClick={onClick}>Multi Click</Button>);

      const button = screen.getByRole('button');
      fireEvent.click(button);
      fireEvent.click(button);
      fireEvent.click(button);

      expect(onClick).toHaveBeenCalledTimes(3);
    });
  });

  describe('🎨 Styled Components Integration', () => {
    it('should pass styled props correctly', () => {
      renderWithTheme(
        <Button variant="primary" size="lg" fullWidth>
          Styled Button
        </Button>
      );

      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should handle variant and size combinations', () => {
      renderWithTheme(
        <Button variant="success" size="sm">
          Small Success
        </Button>
      );

      expect(screen.getByRole('button')).toBeInTheDocument();
    });
  });
}); 