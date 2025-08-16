import { render, screen } from '@testing-library/react';
import { describe, it, expect, afterEach } from 'vitest';
import { ThemeProvider } from 'styled-components';
import { theme } from '@/lib/theme';
import InstructionsPage from '../page';

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

describe('InstructionsPage', () => {
  const { teardown } = createTestSetup(); // ✅ Console mocks centralizados

  afterEach(() => {
    teardown(); // ✅ Limpieza automática
  });

  it('debería renderizar estructura completa de pasos e instrucciones', () => {
    renderWithTheme(<InstructionsPage />);

    expect(screen.getByText('Cómo obtener tu Token de Notion')).toBeInTheDocument();

    const stepTitles = [
      'Ve a tus integraciones de Notion',
      'Crea una nueva integración',
      'Copia tu token',
      'Conecta tus páginas (opcional)'
    ];
    stepTitles.forEach(title => {
      expect(screen.getByText(title)).toBeInTheDocument();
    });

    ['1', '2', '3', '4'].forEach(num => {
      expect(screen.getByText(num)).toBeInTheDocument();
    });

    const fields = ['Nombre:', 'Espacio de trabajo:', 'Tipo:'];
    fields.forEach(field => {
      expect(screen.getByText(field, { exact: false })).toBeInTheDocument();
    });
  });
});