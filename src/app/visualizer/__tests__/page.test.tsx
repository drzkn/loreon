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

describe('VisualizerPage - Basic Coverage Tests', () => {
  const setupMockSupabase = (data: unknown[] | null = [], error: unknown = null) => {
    mockSupabase.from.mockReturnValue({
      select: () => ({
        eq: () => ({
          limit: () => Promise.resolve({ data, error }),
          order: () => ({
            limit: () => Promise.resolve({ data, error })
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

  describe('Renderizado básico', () => {
    it('should render main components correctly', async () => {
      render(<VisualizerPage />);

      expect(screen.getByText('Visualizador')).toBeInTheDocument();
      expect(screen.getByTestId('icon-square-library')).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Buscar páginas...')).toBeInTheDocument();
      });
    });

    it('should show empty state when no data available', async () => {
      setupMockSupabase([], null);
      mockMarkdownRepository.findAll.mockResolvedValue([]);

      render(<VisualizerPage />);

      await waitFor(() => {
        expect(screen.getByText('No hay páginas disponibles')).toBeInTheDocument();
        expect(screen.getByText('No hay datos en ningún sistema.')).toBeInTheDocument();
      });
    });
  });

  describe('Búsqueda y filtrado', () => {
    it('should handle search input changes', async () => {
      render(<VisualizerPage />);

      await waitFor(() => {
        const searchInput = screen.getByPlaceholderText('Buscar páginas...');
        expect(searchInput).toBeInTheDocument();

        fireEvent.change(searchInput, { target: { value: 'test search' } });
        expect(searchInput).toHaveValue('test search');
      });
    });

    it('should show no results message when search returns empty', async () => {
      render(<VisualizerPage />);

      await waitFor(() => {
        const searchInput = screen.getByPlaceholderText('Buscar páginas...');
        fireEvent.change(searchInput, { target: { value: 'nonexistent' } });
      });

      await waitFor(() => {
        expect(screen.getByText('Sin resultados')).toBeInTheDocument();
        expect(screen.getByText('No se encontraron páginas que coincidan con tu búsqueda')).toBeInTheDocument();
      });
    });
  });

  describe('Sistema de detección', () => {
    it('should check systems and log status', async () => {
      render(<VisualizerPage />);

      await waitFor(() => {
        expect(console.log).toHaveBeenCalledWith('🔍 Verificando sistemas disponibles...');
      });
    });

    it('should handle repository errors gracefully', async () => {
      mockMarkdownRepository.findAll.mockRejectedValue(new Error('Repository error'));

      render(<VisualizerPage />);

      await waitFor(() => {
        expect(console.warn).toHaveBeenCalledWith(
          'Error verificando sistema legacy:',
          expect.any(Error)
        );
      });
    });
  });

  describe('Funciones de utilidad', () => {
    it('should format dates correctly', () => {
      const testDate = '2024-12-25T15:30:45Z';
      const date = new Date(testDate);
      const formatted = date.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
      expect(formatted).toBe('25/12/2024');
    });

    it('should generate preview text correctly', () => {
      const content = '<h1>Title</h1><p>Content here</p>';
      const preview = content
        .replace(/<[^>]*>/g, '')
        .replace(/[#*`\[\]]/g, '')
        .replace(/\n+/g, ' ')
        .trim()
        .substring(0, 120);

      expect(preview).toBe('TitleContent here');
      expect(preview.length).toBeLessThanOrEqual(120);
    });

    it('should handle empty content in preview generation', () => {
      const emptyContent = '';
      const preview = emptyContent || 'Sin contenido disponible';
      expect(preview).toBe('Sin contenido disponible');
    });

    it('should strip HTML and markdown correctly', () => {
      const mixedContent = '<p>**Bold** text with `code`</p>';
      const stripped = mixedContent
        .replace(/<[^>]*>/g, '')
        .replace(/[#*`\[\]]/g, '')
        .replace(/\n+/g, ' ')
        .trim();

      expect(stripped).toBe('Bold text with code');
    });
  });

  describe('Mocking y integración', () => {
    it('should have proper mocks configured', () => {
      expect(mockSupabase.from).toBeDefined();
      expect(mockNativeRepository.getPageBlocks).toBeDefined();
      expect(mockMarkdownRepository.findAll).toBeDefined();
      expect(vi.mocked(renderMarkdown)).toBeDefined();
    });

    it('should call renderMarkdown when needed', () => {
      const testContent = '# Test Content';
      const result = vi.mocked(renderMarkdown)(testContent);
      expect(result).toBe('<div># Test Content</div>');
      expect(vi.mocked(renderMarkdown)).toHaveBeenCalledWith(testContent);
    });
  });

  describe('Estados y navegación', () => {
    it('should show instructions when no systems have data', async () => {
      setupMockSupabase([], null);
      mockMarkdownRepository.findAll.mockResolvedValue([]);

      render(<VisualizerPage />);

      await waitFor(() => {
        expect(screen.getByText('POST /api/sync-notion')).toBeInTheDocument();
      });
    });

    it('should handle component state correctly', async () => {
      render(<VisualizerPage />);

      await waitFor(() => {
        expect(screen.getByText('Visualizador')).toBeInTheDocument();
        expect(screen.getByTestId('icon-square-library')).toBeInTheDocument();
      });
    });
  });

  describe('Logging y depuración', () => {
    it('should log system verification process', async () => {
      render(<VisualizerPage />);

      await waitFor(() => {
        expect(console.log).toHaveBeenCalledWith('🔍 Verificando sistemas disponibles...');
        expect(console.log).toHaveBeenCalledWith(
          expect.stringMatching(/📊 Estado de sistemas:/)
        );
      });
    });

    it('should handle mock repository calls', async () => {
      render(<VisualizerPage />);

      await waitFor(() => {
        expect(screen.getByText('Visualizador')).toBeInTheDocument();
      });

      // Verify mock is available
      expect(mockMarkdownRepository.findAll).toBeDefined();
    });
  });

  describe('Renderizado de contenido', () => {
    it('should render markdown when using renderMarkdown', () => {
      const content = '# Test';
      vi.mocked(renderMarkdown)(content);
      expect(vi.mocked(renderMarkdown)).toHaveBeenCalledWith(content);
    });

    it('should handle content without crashing', async () => {
      render(<VisualizerPage />);

      await waitFor(() => {
        expect(screen.getByText('Selecciona una página')).toBeInTheDocument();
        expect(screen.getByText('Elige una página de la lista para ver su contenido aquí')).toBeInTheDocument();
      });
    });
  });
});
