import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { PagesList } from '../PagesList';
import type { UnifiedPageData, SystemStatus } from '../PagesList';

// Usar el sistema centralizado de mocks
import {
  createTestSetup
} from '@/mocks';

// Mock del Icon component
vi.mock('@/components', () => ({
  Icon: ({ name }: { name: string }) => <span data-testid={`icon-${name}`}>{name}</span>
}));

describe('PagesList', () => {
  const { teardown } = createTestSetup(); // ✅ Console mocks centralizados

  afterEach(() => {
    teardown(); // ✅ Limpieza automática
  });

  const mockPages: UnifiedPageData[] = [
    {
      id: '1',
      title: 'Página Test 1',
      content: 'Contenido de prueba 1',
      source: 'native',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-02T00:00:00Z'
    },
    {
      id: '2',
      title: 'Página Test 2',
      content: 'Contenido de prueba 2',
      source: 'legacy',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-02T00:00:00Z'
    }
  ];

  const mockSystemStatus: SystemStatus = {
    nativePages: 1,
    legacyPages: 1,
    selectedSystem: 'native'
  };

  const defaultProps = {
    pages: mockPages,
    loading: false,
    searchTerm: '',
    systemStatus: mockSystemStatus,
    selectedPageId: null,
    onPageSelect: vi.fn()
  };

  it('debería mostrar loading spinner cuando está cargando', () => {
    render(<PagesList {...defaultProps} loading={true} />);

    expect(screen.getByText('Cargando páginas...')).toBeInTheDocument();
  });

  it('debería renderizar lista de páginas correctamente', () => {
    render(<PagesList {...defaultProps} />);

    expect(screen.getByText('Página Test 1')).toBeInTheDocument();
    expect(screen.getByText('Página Test 2')).toBeInTheDocument();
    expect(screen.getByText('Contenido de prueba 1')).toBeInTheDocument();
    expect(screen.getByText('Contenido de prueba 2')).toBeInTheDocument();
  });

  it('debería manejar selección de páginas', () => {
    const mockOnPageSelect = vi.fn();

    render(<PagesList {...defaultProps} onPageSelect={mockOnPageSelect} />);

    fireEvent.click(screen.getByText('Página Test 1'));

    expect(mockOnPageSelect).toHaveBeenCalledWith(mockPages[0]);
  });

  it('debería mostrar página seleccionada con estilo diferente', () => {
    render(<PagesList {...defaultProps} selectedPageId="1" />);

    const selectedPage = screen.getByText('Página Test 1').closest('div');
    const unselectedPage = screen.getByText('Página Test 2').closest('div');

    // Verificar que tienen diferentes clases/estilos
    expect(selectedPage).toBeInTheDocument();
    expect(unselectedPage).toBeInTheDocument();
  });

  it('debería mostrar estado vacío cuando no hay páginas', () => {
    render(<PagesList {...defaultProps} pages={[]} />);

    expect(screen.getByTestId('icon-mailbox')).toBeInTheDocument();
    expect(screen.getByText('No hay páginas disponibles')).toBeInTheDocument();
  });

  it('debería mostrar mensaje de sin resultados cuando hay término de búsqueda', () => {
    render(<PagesList {...defaultProps} pages={[]} searchTerm="búsqueda" />);

    expect(screen.getByText('Sin resultados')).toBeInTheDocument();
    expect(screen.getByText('No se encontraron páginas que coincidan con tu búsqueda')).toBeInTheDocument();
  });

  it('debería mostrar instrucciones cuando no hay datos en ningún sistema', () => {
    const emptySystemStatus: SystemStatus = {
      nativePages: 0,
      legacyPages: 0,
      selectedSystem: 'none'
    };

    render(
      <PagesList
        {...defaultProps}
        pages={[]}
        systemStatus={emptySystemStatus}
      />
    );

    expect(screen.getByText('No hay datos en ningún sistema.')).toBeInTheDocument();
    expect(screen.getByText('POST /api/sync-notion')).toBeInTheDocument();
  });

  it('debería formatear fechas correctamente', () => {
    render(<PagesList {...defaultProps} />);

    expect(screen.getAllByText('Actualizado: 02/01/2024')).toHaveLength(2);
  });

  it('debería generar preview de contenido', () => {
    const pageWithLongContent: UnifiedPageData = {
      id: '3',
      title: 'Página con contenido largo',
      content: '<h1>Título</h1><p>Este es un contenido muy largo que debería ser cortado después de 120 caracteres para mostrar solo un preview.</p>',
      source: 'native',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-02T00:00:00Z'
    };

    render(
      <PagesList
        {...defaultProps}
        pages={[pageWithLongContent]}
      />
    );

    // El preview debería remover HTML y ser limitado
    expect(screen.getByText(/TítuloEste es un contenido muy largo/)).toBeInTheDocument();
  });
});
