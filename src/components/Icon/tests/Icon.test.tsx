import { describe, it, expect, afterEach } from 'vitest';
import { render } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import { Icon } from '../Icon';
import { theme } from '../../../lib/theme';

// Usar el sistema centralizado de mocks
import {
  createTestSetup
} from '@/mocks';

const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <ThemeProvider theme={theme}>
      {component}
    </ThemeProvider>
  );
};

describe('Icon', () => {
  const { teardown } = createTestSetup(); // ✅ Console mocks centralizados

  afterEach(() => {
    teardown(); // ✅ Limpieza automática
  });

  it('renders correctly', () => {
    const { container } = renderWithTheme(<Icon name="bot" />);
    const iconContainer = container.firstChild;
    expect(iconContainer).toBeInTheDocument();
  });
}); 