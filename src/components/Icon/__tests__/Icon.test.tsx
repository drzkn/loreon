import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
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
    const { container } = renderWithTheme(<Icon name="bot" />);
    const iconContainer = container.firstChild;
    expect(iconContainer).toBeInTheDocument();
  });
}); 