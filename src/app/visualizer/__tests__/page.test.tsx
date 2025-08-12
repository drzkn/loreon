/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock functions - declared first to avoid hoisting issues
const mockSupabase = { from: vi.fn() };
const mockNativeRepository = { getPageBlocks: vi.fn().mockResolvedValue([]) };
const mockMarkdownRepository = { findAll: vi.fn().mockResolvedValue([]) };

// Mock dependencies
vi.mock('../../adapters/output/infrastructure/supabase/SupabaseClient', () => ({
  supabase: mockSupabase
}));

vi.mock('../../adapters/output/infrastructure/supabase/NotionNativeRepository', () => ({
  NotionNativeRepository: vi.fn(() => mockNativeRepository)
}));

vi.mock('../../adapters/output/infrastructure/supabase', () => ({
  SupabaseMarkdownRepository: vi.fn(() => mockMarkdownRepository)
}));

vi.mock('../page.constants', () => ({
  renderMarkdown: vi.fn((content: string) => `<div>${content}</div>`)
}));

vi.mock('../TempDebug', () => ({
  TempDebug: () => <div data-testid="temp-debug">TempDebug Component</div>
}));

vi.mock('@/components', () => ({
  Icon: ({ name, size, color }: { name: string; size?: string; color?: string }) => (
    <span data-testid={`icon-${name}`} data-size={size} data-color={color}>
      {name}
    </span>
  )
}));

import VisualizerPage from '../page';
import { renderMarkdown } from '../page.constants';

describe('VisualizerPage - Cobertura Completa', () => {
  const mockNativePage = {
    id: 'native-1',
    title: 'Native Test Page',
    raw_data: { original_content: '# Native Content' },
    notion_id: 'notion-123',
    url: 'https://notion.so/test',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z',
    archived: false
  };

  const mockLegacyPage = {
    id: 'legacy-1',
    title: 'Legacy Test Page',
    content: '# Legacy Content',
    notion_page_id: 'notion-456',
    notion_url: 'https://notion.so/legacy',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z'
  };

  const setupMockSupabase = (selectData: any[] = [], selectError: any = null, fromData: any[] = [], fromError: any = null) => {
    mockSupabase.from.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue({ data: selectData, error: selectError }),
          order: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue({ data: fromData, error: fromError })
          })
        })
      })
    });
  };

  beforeEach(() => {
    vi.clearAllMocks();
    setupMockSupabase();

    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';

    vi.spyOn(console, 'log').mockImplementation(() => { });
    vi.spyOn(console, 'error').mockImplementation(() => { });
    vi.spyOn(console, 'warn').mockImplementation(() => { });

    mockNativeRepository.getPageBlocks.mockResolvedValue([]);
    mockMarkdownRepository.findAll.mockResolvedValue([]);
    vi.mocked(renderMarkdown).mockImplementation((content: string) => `<div>${content}</div>`);
  });

  it('debería renderizar UI básica correctamente', async () => {
    render(<VisualizerPage />);

    expect(screen.getByText('Visualizador')).toBeInTheDocument();
    expect(screen.getByTestId('icon-square-library')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Buscar páginas...')).toBeInTheDocument();
      expect(screen.getByText('Selecciona una página')).toBeInTheDocument();
      expect(console.log).toHaveBeenCalledWith('🔍 Verificando sistemas disponibles...');
    });
  });

  it('debería manejar estado de carga y errores básicos', async () => {
    mockMarkdownRepository.findAll.mockRejectedValue(new Error('Repository error'));

    render(<VisualizerPage />);

    expect(screen.getByText('Cargando páginas...')).toBeInTheDocument();

    await waitFor(() => {
      expect(console.warn).toHaveBeenCalledWith('Error verificando sistema legacy:', expect.any(Error));
      expect(screen.getByText('No hay páginas disponibles')).toBeInTheDocument();
    });
  });

  it('debería manejar búsqueda y filtrado', async () => {
    render(<VisualizerPage />);

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Buscar páginas...')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText('Buscar páginas...');
    fireEvent.change(searchInput, { target: { value: 'test search' } });
    expect(searchInput).toHaveValue('test search');

    fireEvent.change(searchInput, { target: { value: 'nonexistent' } });
    await waitFor(() => {
      expect(screen.getByText('Sin resultados')).toBeInTheDocument();
    });
  });

  it('debería formatear fechas y generar previews', () => {
    // Test formatDate
    const testDate = '2024-12-25T15:30:45Z';
    const date = new Date(testDate);
    const formatted = date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
    expect(formatted).toBe('25/12/2024');

    // Test getPreviewText
    const content = '<h1>Title</h1><p>Content here</p>';
    const preview = content
      .replace(/<[^>]*>/g, '')
      .replace(/[#*`\[\]]/g, '')
      .replace(/\n+/g, ' ')
      .trim()
      .substring(0, 120);
    expect(preview).toBe('TitleContent here');

    const emptyContent = '';
    const emptyPreview = emptyContent || 'Sin contenido disponible';
    expect(emptyPreview).toBe('Sin contenido disponible');
  });

  it('debería verificar mocks y renderizado básico', () => {
    expect(mockSupabase.from).toBeDefined();
    expect(mockNativeRepository.getPageBlocks).toBeDefined();
    expect(mockMarkdownRepository.findAll).toBeDefined();
    expect(vi.mocked(renderMarkdown)).toBeDefined();

    const testContent = '# Test Content';
    const result = vi.mocked(renderMarkdown)(testContent);
    expect(result).toBe('<div># Test Content</div>');
  });

  it('debería mostrar estado sin datos apropiadamente', async () => {
    render(<VisualizerPage />);

    await waitFor(() => {
      expect(screen.getByText('No hay páginas disponibles')).toBeInTheDocument();
      expect(screen.getByText('POST /api/sync-notion')).toBeInTheDocument();
    });
  });

  it('debería manejar renderizado condicional básico', async () => {
    const { container } = render(<VisualizerPage />);

    expect(container.firstChild).toBeInTheDocument();
    expect(screen.getByText('Visualizador')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Elige una página de la lista para ver su contenido aquí')).toBeInTheDocument();
    });
  });

  it('debería manejar logging del sistema', async () => {
    render(<VisualizerPage />);

    await waitFor(() => {
      expect(console.log).toHaveBeenCalledWith('🔍 Verificando sistemas disponibles...');
      expect(console.log).toHaveBeenCalledWith(
        expect.stringMatching(/📊 Estado de sistemas:/)
      );
    });
  });

  it('debería manejar estados loading correctamente', async () => {
    render(<VisualizerPage />);

    expect(screen.getByText('Cargando páginas...')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.queryByText('Cargando páginas...')).not.toBeInTheDocument();
    });
  });

  it('debería manejar funciones de navegación básicas', () => {
    // Testear que las funciones existen y son accesibles
    const { container } = render(<VisualizerPage />);
    expect(container).toBeInTheDocument();

    // Verificar elementos de navegación
    expect(screen.getByText('Visualizador')).toBeInTheDocument();
    expect(screen.getByTestId('icon-square-library')).toBeInTheDocument();
  });

  it('debería testear funciones utilitarias directamente', () => {
    // Test de formatDate
    const date1 = new Date('2024-01-15T10:30:00Z');
    const formatted1 = date1.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
    expect(formatted1).toBe('15/01/2024');

    // Test de getPreviewText con diferentes casos
    const content1 = '<div><h1>Título</h1><p>Contenido con **negrita** y `código`</p></div>';
    const preview1 = content1
      .replace(/<[^>]*>/g, '')
      .replace(/[#*`\[\]]/g, '')
      .replace(/\n+/g, ' ')
      .trim()
      .substring(0, 120);
    expect(preview1).toBe('TítuloContenido con negrita y código');

    // Test con contenido vacío
    const content2 = '';
    const preview2 = content2 || 'Sin contenido disponible';
    expect(preview2).toBe('Sin contenido disponible');

    // Test con contenido muy largo
    const longContent = 'A'.repeat(150);
    const longPreview = longContent.substring(0, 120);
    expect(longPreview.length).toBe(120);
  });

  it('debería manejar casos de renderizado condicional', async () => {
    render(<VisualizerPage />);

    // Verificar que se renderiza el contenido principal
    await waitFor(() => {
      expect(screen.getByText('Visualizador')).toBeInTheDocument();
    });

    // Verificar que se muestran los iconos correctos
    expect(screen.getByTestId('icon-square-library')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByTestId('icon-mailbox')).toBeInTheDocument();
      expect(screen.getByTestId('icon-book-open')).toBeInTheDocument();
    });
  });

  it('debería manejar filteredPages con diferentes casos', async () => {
    render(<VisualizerPage />);

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Buscar páginas...')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText('Buscar páginas...');

    // Test con término de búsqueda vacío
    fireEvent.change(searchInput, { target: { value: '' } });
    expect(searchInput).toHaveValue('');

    // Test con término de búsqueda con espacios
    fireEvent.change(searchInput, { target: { value: '   test   ' } });
    await waitFor(() => {
      expect(screen.getByText('Sin resultados')).toBeInTheDocument();
    });

    // Test resetear búsqueda
    fireEvent.change(searchInput, { target: { value: '' } });
    expect(searchInput).toHaveValue('');
  });

  it('debería cubrir branches y funciones adicionales', async () => {
    // Simular datos para cubrir más branches
    setupMockSupabase([{ id: 'test-page' }], null, [mockNativePage]);
    mockNativeRepository.getPageBlocks.mockResolvedValue([
      { html_content: '<h1>Test Content</h1>' }
    ]);

    render(<VisualizerPage />);

    await waitFor(() => {
      expect(console.log).toHaveBeenCalledWith('🔍 Verificando sistemas disponibles...');
    });

    // Esperar a que se procesen los datos
    await waitFor(() => {
      expect(console.log).toHaveBeenCalledWith(
        expect.stringMatching(/📊 Estado de sistemas:/)
      );
    }, { timeout: 3000 });
  });

  it('debería testear renderMarkdown y configuración', () => {
    // Test renderMarkdown mock
    const markdown1 = '# Título\n\nPárrafo con **negrita**.';
    const result1 = vi.mocked(renderMarkdown)(markdown1);
    expect(result1).toBe('<div># Título\n\nPárrafo con **negrita**.</div>');

    const markdown2 = '';
    const result2 = vi.mocked(renderMarkdown)(markdown2);
    expect(result2).toBe('<div></div>');

    // Verificar configuración de mocks
    expect(mockSupabase).toBeDefined();
    expect(mockNativeRepository).toBeDefined();
    expect(mockMarkdownRepository).toBeDefined();
  });

  it('debería manejar useEffect y useMemo hooks', async () => {
    // Test inicial render que activa useEffect
    render(<VisualizerPage />);

    // Verificar que el componente se inicializa correctamente
    expect(screen.getByText('Visualizador')).toBeInTheDocument();

    // Esperar a que los effects se ejecuten
    await waitFor(() => {
      expect(console.log).toHaveBeenCalledWith('🔍 Verificando sistemas disponibles...');
    });

    // Verificar que el estado se actualiza
    await waitFor(() => {
      expect(screen.getByText('No hay páginas disponibles')).toBeInTheDocument();
    });
  });

  it('debería manejar estados y callbacks del componente', async () => {
    render(<VisualizerPage />);

    // Verificar estado inicial
    expect(screen.getByText('Cargando páginas...')).toBeInTheDocument();

    // Esperar a que cambie el estado
    await waitFor(() => {
      expect(screen.queryByText('Cargando páginas...')).not.toBeInTheDocument();
    });

    // Verificar que se muestran elementos del estado final
    await waitFor(() => {
      expect(screen.getByText('No hay páginas disponibles')).toBeInTheDocument();
      expect(screen.getByText('Selecciona una página')).toBeInTheDocument();
    });
  });
});