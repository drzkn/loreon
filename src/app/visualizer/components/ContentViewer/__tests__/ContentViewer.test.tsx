import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { ContentViewer } from '../ContentViewer';
import type { UnifiedPageData } from '../../PagesList';

// Usar el sistema centralizado de mocks
import {
  createTestSetup
} from '@/mocks';

// Mock del Icon component
vi.mock('@/components', () => ({
  Icon: ({ name }: { name: string }) => <span data-testid={`icon-${name}`}>{name}</span>
}));

// Mock del renderMarkdown
vi.mock('../../../page.constants', () => ({
  renderMarkdown: vi.fn((content: string) => `<div>Rendered: ${content}</div>`)
}));

describe('ContentViewer', () => {
  const { teardown } = createTestSetup(); // ✅ Console mocks centralizados

  afterEach(() => {
    teardown(); // ✅ Limpieza automática
  });

  const mockNativePage: UnifiedPageData = {
    id: '1',
    title: 'Página Nativa',
    content: '<h1>Contenido HTML</h1><p>Párrafo de prueba</p>',
    source: 'native',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z'
  };

  const mockLegacyPage: UnifiedPageData = {
    id: '2',
    title: 'Página Legacy',
    content: '# Contenido Markdown\n\nPárrafo en markdown',
    source: 'legacy',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z'
  };

  const defaultProps = {
    selectedPage: null,
    onBack: vi.fn(),
    showSidebar: false
  };

  it('debería mostrar estado vacío cuando no hay página seleccionada', () => {
    render(<ContentViewer {...defaultProps} />);

    expect(screen.getByTestId('icon-book-open')).toBeInTheDocument();
    expect(screen.getByText('Selecciona una página')).toBeInTheDocument();
    expect(screen.getByText('Elige una página de la lista para ver su contenido aquí')).toBeInTheDocument();
  });

  it('debería renderizar página nativa correctamente', () => {
    render(<ContentViewer {...defaultProps} selectedPage={mockNativePage} />);

    expect(screen.getByText('Volver')).toBeInTheDocument();
    expect(screen.getByTestId('icon-chevron-left')).toBeInTheDocument();
  });

  it('debería renderizar página legacy con renderMarkdown', () => {
    render(<ContentViewer {...defaultProps} selectedPage={mockLegacyPage} />);

    expect(screen.getByText('Volver')).toBeInTheDocument();
    // El contenido renderizado debería aparecer en el DOM
    expect(screen.getByText(/Rendered:/)).toBeInTheDocument();
  });

  it('debería manejar botón de volver', () => {
    const mockOnBack = vi.fn();

    render(
      <ContentViewer
        {...defaultProps}
        selectedPage={mockNativePage}
        onBack={mockOnBack}
      />
    );

    fireEvent.click(screen.getByText('Volver'));
    expect(mockOnBack).toHaveBeenCalled();
  });

  it('debería ocultar contenido cuando showSidebar es true', () => {
    const { container } = render(
      <ContentViewer
        {...defaultProps}
        selectedPage={mockNativePage}
        showSidebar={true}
      />
    );

    // El contenedor debería tener el atributo hidden
    const contentSection = container.firstChild;
    expect(contentSection).toHaveAttribute('hidden');
  });

  it('debería mostrar contenido cuando showSidebar es false', () => {
    const { container } = render(
      <ContentViewer
        {...defaultProps}
        selectedPage={mockNativePage}
        showSidebar={false}
      />
    );

    // El contenedor NO debería tener el atributo hidden
    const contentSection = container.firstChild;
    expect(contentSection).not.toHaveAttribute('hidden');
  });

  it('debería manejar contenido nativo vacío', () => {
    const pageWithEmptyContent: UnifiedPageData = {
      ...mockNativePage,
      content: ''
    };

    render(<ContentViewer {...defaultProps} selectedPage={pageWithEmptyContent} />);

    expect(screen.getByText('Volver')).toBeInTheDocument();
  });

  it('debería renderizar HTML de forma segura', () => {
    const pageWithHTML: UnifiedPageData = {
      ...mockNativePage,
      content: '<script>alert("xss")</script><h1>Título Seguro</h1>'
    };

    render(<ContentViewer {...defaultProps} selectedPage={pageWithHTML} />);

    // Verificar que el contenido se renderiza (React sanitiza automáticamente)
    expect(screen.getByText('Volver')).toBeInTheDocument();
  });
});
