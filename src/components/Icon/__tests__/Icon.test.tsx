import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import { Icon } from '../Icon';
import { theme } from '../../../lib/theme';

const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <ThemeProvider theme={theme}>
      {component}
    </ThemeProvider>
  );
};

describe('Icon', () => {
  it('renders correctly', () => {
    const { container } = renderWithTheme(<Icon name="send" />);
    const iconContainer = container.firstChild;
    expect(iconContainer).toBeInTheDocument();
  });

  it('renders with different sizes', () => {
    const { rerender, container } = renderWithTheme(<Icon name="user" size="xs" />);
    let svg = container.querySelector('svg');
    expect(svg).toHaveStyle('width: 0.75rem');

    rerender(<Icon name="user" size="xl" />);
    svg = container.querySelector('svg');
    expect(svg).toHaveStyle('width: 2rem');
  });

  it('applies custom color', () => {
    const { container } = renderWithTheme(<Icon name="bot" color="#ff0000" />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveStyle('color: #ff0000');
  });

  it('handles click events', () => {
    const handleClick = vi.fn();
    renderWithTheme(<Icon name="settings" onClick={handleClick} />);

    const iconContainer = screen.getByRole('button');
    fireEvent.click(iconContainer);

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('becomes focusable when clickable', () => {
    renderWithTheme(<Icon name="home" onClick={() => { }} />);
    const iconContainer = screen.getByRole('button');
    expect(iconContainer).toHaveAttribute('tabIndex', '0');
  });

  it('applies custom className', () => {
    const { container } = renderWithTheme(<Icon name="menu" className="custom-class" />);
    const iconContainer = container.firstChild;
    expect(iconContainer).toHaveClass('custom-class');
  });

  it('handles keyboard navigation', () => {
    const handleClick = vi.fn();
    renderWithTheme(<Icon name="close" onClick={handleClick} />);

    const iconContainer = screen.getByRole('button');
    iconContainer.focus();

    expect(iconContainer).toHaveFocus();
  });

  it('logs warning for invalid icon name', () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => { });

    // @ts-expect-error Testing invalid icon name
    renderWithTheme(<Icon name={'invalid'} />);

    expect(consoleSpy).toHaveBeenCalledWith('Icon "invalid" not found');
    consoleSpy.mockRestore();
  });

  it('returns null for invalid icon name', () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => { });

    // @ts-expect-error Testing invalid icon name
    const { container } = renderWithTheme(<Icon name={'invalid'} />);

    expect(container.firstChild).toBeNull();
    consoleSpy.mockRestore();
  });
}); 