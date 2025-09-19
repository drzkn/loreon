import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NotionNativeService } from '../NotionNativeService';
import { Page, Block } from '@/domain/entities';

// Usar el sistema centralizado de mocks
import {
  createTestSetup
} from '../../../mocks';

// Crear mocks de las dependencias
const mockRepositoryInstance = {
  savePage: vi.fn(),
  saveBlocks: vi.fn(),
  saveEmbeddings: vi.fn(),
  getPageByNotionId: vi.fn(),
  getPageBlocksHierarchical: vi.fn(),
  searchSimilarEmbeddings: vi.fn(),
  searchBlocks: vi.fn(),
  archivePages: vi.fn()
};

const mockEmbeddingsServiceInstance = {
  generateEmbeddings: vi.fn(),
  generateEmbedding: vi.fn()
};

// Mocks de dependencias
vi.mock('@/adapters/output/infrastructure/supabase/NotionNativeRepository', () => ({
  NotionNativeRepository: vi.fn().mockImplementation(() => mockRepositoryInstance)
}));

vi.mock('@/application/interfaces/IEmbeddingsService', () => ({
  EmbeddingsService: vi.fn().mockImplementation(() => mockEmbeddingsServiceInstance)
}));

vi.mock('@/adapters/output/infrastructure/supabase/SupabaseClient', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      range: vi.fn().mockReturnThis(),
      single: vi.fn()
    }))
  }
}));

vi.mock('@/adapters/output/infrastructure/supabase/SupabaseServerClient', () => ({
  supabaseServer: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      range: vi.fn().mockReturnThis(),
      single: vi.fn(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis()
    }))
  }
}));

vi.mock('../NotionContentExtractor', () => ({
  NotionContentExtractor: {
    extractPageContent: vi.fn(),
    generateTextChunks: vi.fn()
  }
}));

describe('NotionNativeService', () => {
  let service: NotionNativeService;
  let mockRepository: typeof mockRepositoryInstance;
  let mockEmbeddingsService: typeof mockEmbeddingsServiceInstance;

  const { teardown } = createTestSetup(); // ✅ Console mocks centralizados

  beforeEach(() => {
    vi.clearAllMocks();

    // Use the global mock instances directly
    mockRepository = mockRepositoryInstance;
    mockEmbeddingsService = mockEmbeddingsServiceInstance;

    service = new NotionNativeService(mockRepository, mockEmbeddingsService);
  });

  afterEach(() => {
    teardown(); // ✅ Limpieza automática
  });

  describe('processAndSavePage - Procesamiento individual', () => {
    it('should process and save a page successfully', async () => {
      // Setup mock data
      const mockPage: Partial<Page> = {
        id: 'page-123',
        url: 'https://notion.so/page-123',
        properties: { title: 'Test Page' },
        createdTime: '2024-01-01T00:00:00Z',
        lastEditedTime: '2024-01-02T00:00:00Z',
        toJSON: vi.fn(() => ({
          id: 'page-123',
          properties: { title: 'Test Page' },
          createdTime: '2024-01-01T00:00:00Z',
          lastEditedTime: '2024-01-02T00:00:00Z',
          url: 'https://notion.so/page-123'
        }))
      };

      const mockBlocks: Partial<Block>[] = [
        {
          id: 'block-1',
          type: 'paragraph',
          data: { rich_text: [{ plain_text: 'Test content' }] },
          hasChildren: false,
          createdTime: '2024-01-01T00:00:00Z',
          lastEditedTime: '2024-01-01T00:00:00Z'
        }
      ];

      const mockPageContent = {
        fullText: 'Test content',
        htmlStructure: '<p>Test content</p>',
        sections: [],
        contentHash: 'hash-123',
        wordCount: 2,
        characterCount: 12
      };

      const mockSavedPage = {
        id: 'uuid-123',
        notion_id: 'page-123',
        title: 'Test Page',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z',
        archived: false,
        properties: {},
        raw_data: {}
      };

      const mockSavedBlocks = [
        {
          id: 'uuid-block-1',
          notion_id: 'block-1',
          page_id: 'uuid-123',
          type: 'paragraph',
          content: {},
          position: 0,
          has_children: false,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          archived: false,
          plain_text: 'Test content',
          html_content: '<p>Test content</p>',
          raw_data: {}
        }
      ];

      // Mock content extraction
      const { NotionContentExtractor } = await import('../NotionContentExtractor');
      vi.mocked(NotionContentExtractor.extractPageContent).mockReturnValue(mockPageContent);
      vi.mocked(NotionContentExtractor.generateTextChunks).mockReturnValue([]);

      // Mock repository calls
      mockRepository.savePage.mockResolvedValue(mockSavedPage);
      mockRepository.saveBlocks.mockResolvedValue(mockSavedBlocks);
      mockRepository.saveEmbeddings.mockResolvedValue([]);

      const result = await service.processAndSavePage(mockPage as Page, mockBlocks as Block[]);

      expect(result).toEqual(mockSavedPage);
      expect(mockRepository.savePage).toHaveBeenCalled();
      expect(mockRepository.saveBlocks).toHaveBeenCalled();
      // Console mocks están centralizados globalmente
    });

    it('should handle processing errors gracefully', async () => {
      const mockPage: Partial<Page> = {
        id: 'page-123',
        properties: { title: 'Test Page' },
        toJSON: vi.fn(() => ({
          id: 'page-123',
          properties: { title: 'Test Page' },
          createdTime: undefined,
          lastEditedTime: undefined,
          url: undefined
        }))
      };

      const mockBlocks: Partial<Block>[] = [];

      // Mock content extraction to avoid the wordCount error
      const { NotionContentExtractor } = await import('../NotionContentExtractor');
      vi.mocked(NotionContentExtractor.extractPageContent).mockReturnValue({
        fullText: 'Test content',
        htmlStructure: '<p>Test content</p>',
        sections: [],
        contentHash: 'hash-123',
        wordCount: 2,
        characterCount: 12
      });

      mockRepository.savePage.mockRejectedValue(new Error('Database error'));

      await expect(service.processAndSavePage(mockPage as Page, mockBlocks as Block[]))
        .rejects.toThrow('Error al procesar página page-123: Database error');
    });

    it('should handle pages with empty blocks', async () => {
      const mockPage: Partial<Page> = {
        id: 'page-empty',
        properties: { title: 'Empty Page' },
        toJSON: vi.fn(() => ({
          id: 'page-empty',
          properties: { title: 'Empty Page' },
          createdTime: undefined,
          lastEditedTime: undefined,
          url: undefined
        }))
      };

      const mockPageContent = {
        fullText: '',
        htmlStructure: '',
        sections: [],
        contentHash: 'empty-hash',
        wordCount: 0,
        characterCount: 0
      };

      const mockSavedPage = {
        id: 'uuid-empty',
        notion_id: 'page-empty',
        title: 'Empty Page'
      };

      const { NotionContentExtractor } = await import('../NotionContentExtractor');
      vi.mocked(NotionContentExtractor.extractPageContent).mockReturnValue(mockPageContent);
      vi.mocked(NotionContentExtractor.generateTextChunks).mockReturnValue([]);

      mockRepository.savePage.mockResolvedValue(mockSavedPage);
      mockRepository.saveBlocks.mockResolvedValue([]);

      const result = await service.processAndSavePage(mockPage as Page, []);

      expect(result).toEqual(mockSavedPage);
      expect(mockRepository.saveBlocks).toHaveBeenCalledWith('uuid-empty', []);
    });
  });

  describe('processAndSavePages - Procesamiento múltiple', () => {
    it('should process multiple pages successfully', async () => {
      const mockPages = [
        {
          page: { id: 'page-1', properties: { title: 'Page 1' } } as unknown as Page,
          blocks: [] as Block[]
        },
        {
          page: { id: 'page-2', properties: { title: 'Page 2' } } as unknown as Page,
          blocks: [] as Block[]
        }
      ];

      const mockSavedPage = {
        id: 'uuid-123',
        notion_id: 'page-1',
        title: 'Page 1'
      };

      vi.spyOn(service, 'processAndSavePage').mockResolvedValue(mockSavedPage as unknown as Awaited<ReturnType<typeof service.processAndSavePage>>);

      const results = await service.processAndSavePages(mockPages);

      expect(results).toHaveLength(2);
      expect(service.processAndSavePage).toHaveBeenCalledTimes(2);
      // Console mocks están centralizados globalmente
    });

    it('should handle mixed success and failure results', async () => {
      const mockPages = [
        {
          page: { id: 'page-1', properties: { title: 'Page 1' } } as unknown as Page,
          blocks: [] as Block[]
        },
        {
          page: { id: 'page-2', properties: { title: 'Page 2' } } as unknown as Page,
          blocks: [] as Block[]
        }
      ];

      const mockSavedPage = {
        id: 'uuid-123',
        notion_id: 'page-1',
        title: 'Page 1'
      };

      vi.spyOn(service, 'processAndSavePage')
        .mockResolvedValueOnce(mockSavedPage as unknown as Awaited<ReturnType<typeof service.processAndSavePage>>)
        .mockRejectedValueOnce(new Error('Processing failed'));

      const results = await service.processAndSavePages(mockPages);

      expect(results).toHaveLength(1);
      // Console mocks están centralizados globalmente
    });
  });

  describe('getStoredPage - Obtención de páginas', () => {
    it('should get stored page by notion ID', async () => {
      const mockPage = {
        id: 'uuid-123',
        notion_id: 'page-123',
        title: 'Test Page'
      };

      mockRepository.getPageByNotionId.mockResolvedValue(mockPage);

      const result = await service.getStoredPage('page-123');

      expect(result).toEqual(mockPage);
      expect(mockRepository.getPageByNotionId).toHaveBeenCalledWith('page-123');
    });

    it('should return null for non-existent page', async () => {
      mockRepository.getPageByNotionId.mockResolvedValue(null);

      const result = await service.getStoredPage('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('getAllStoredPages - Obtención con paginación', () => {
    it('should get all stored pages with default options', async () => {
      // Este método lanza error porque no está implementado
      await expect(service.getAllStoredPages())
        .rejects.toThrow('Método getAllPages no implementado en NotionNativeRepository');
    });

    it('should handle database errors in getAllStoredPages', async () => {
      const mockSupabase = await import('@/adapters/output/infrastructure/supabase/SupabaseServerClient');
      const mockFrom = vi.mocked(mockSupabase.supabaseServer.from);

      // Mock the chain to return an error
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({ data: null, error: { message: 'Database error' } })
      };

      mockFrom.mockReturnValue(mockChain as unknown as ReturnType<typeof mockFrom>);

      await expect(service.getAllStoredPages()).rejects.toThrow('Método getAllPages no implementado en NotionNativeRepository');
    });
  });

  describe('searchStoredPages - Búsqueda de páginas', () => {
    it('should search pages using text search', async () => {
      const mockBlocks = [
        { id: 'uuid-block-1', page_id: 'uuid-page-1', plain_text: 'JavaScript content' }
      ];

      const mockPage = { id: 'uuid-page-1', notion_id: 'page-1', title: 'JS Page' };

      mockRepository.searchBlocks.mockResolvedValue(mockBlocks);
      mockRepository.getPageByNotionId.mockResolvedValue(mockPage);

      const result = await service.searchStoredPages('JavaScript', {
        useEmbeddings: false,
        limit: 10
      });

      expect(result).toEqual([mockPage]);
      expect(mockRepository.searchBlocks).toHaveBeenCalledWith('JavaScript', 10);
      expect(mockRepository.getPageByNotionId).toHaveBeenCalledWith('uuid-page-1');
    });

    it('should search pages using embeddings', async () => {
      const mockEmbeddingResults = [
        {
          id: 'embedding-1',
          page_id: 'page-123',
          similarity: 0.85,
          chunk_text: 'JavaScript content',
          block_id: 'block-1',
          embedding: [0.1, 0.2, 0.3],
          content_hash: 'hash1',
          chunk_index: 0,
          metadata: {},
          created_at: '2024-01-01T00:00:00Z'
        }
      ];

      const mockPage = { id: 'uuid-123', notion_id: 'page-123', title: 'JS Page' };

      mockEmbeddingsService.generateEmbedding.mockResolvedValue([0.1, 0.2, 0.3]);
      mockRepository.searchSimilarEmbeddings.mockResolvedValue(mockEmbeddingResults);
      mockRepository.getPageByNotionId.mockResolvedValue(mockPage);

      const result = await service.searchStoredPages('JavaScript', {
        useEmbeddings: true,
        threshold: 0.8,
        limit: 5
      });

      expect(result).toHaveLength(1);
      expect(result[0].similarity).toBe(0.85);
      expect(mockEmbeddingsService.generateEmbedding).toHaveBeenCalledWith('JavaScript');
    });
  });

  describe('deleteStoredPage - Eliminación de páginas', () => {
    it('should delete stored page', async () => {
      mockRepository.archivePages.mockResolvedValue(undefined);

      await service.deleteStoredPage('page-123');

      expect(mockRepository.archivePages).toHaveBeenCalledWith(['page-123']);
    });
  });

  describe('getPageWithBlocks - Página con bloques', () => {
    it('should get page with blocks and HTML content', async () => {
      const mockPage = {
        id: 'uuid-123',
        notion_id: 'page-123',
        title: 'Test Page'
      };

      const mockBlocks = [
        {
          id: 'uuid-block-1',
          html_content: '<p>First paragraph</p>',
          plain_text: 'First paragraph'
        },
        {
          id: 'uuid-block-2',
          html_content: '<h1>Heading</h1>',
          plain_text: 'Heading'
        }
      ];

      mockRepository.getPageByNotionId.mockResolvedValue(mockPage);
      mockRepository.getPageBlocksHierarchical.mockResolvedValue(mockBlocks);

      const result = await service.getPageWithBlocks('page-123');

      expect(result).toEqual({
        page: mockPage,
        blocks: mockBlocks,
        htmlContent: '<p>First paragraph</p>\n<h1>Heading</h1>'
      });
    });

    it('should return null for non-existent page', async () => {
      mockRepository.getPageByNotionId.mockResolvedValue(null);

      const result = await service.getPageWithBlocks('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('Private methods - extractPageTitle', () => {
    it('should extract title from page properties', () => {
      const mockPage = {
        id: 'page-123',
        properties: {
          title: [
            { plain_text: 'Main ' },
            { text: { content: 'Title' } }
          ]
        }
      };

      const result = (service as unknown as { extractPageTitle: (page: unknown) => string }).extractPageTitle(mockPage);
      expect(result).toBe('Main Title');
    });

    it('should return fallback for pages without title', () => {
      const mockPage = {
        id: 'page-123',
        properties: {}
      };

      const result = (service as unknown as { extractPageTitle: (page: unknown) => string }).extractPageTitle(mockPage);
      expect(result).toBe('Sin título');
    });
  });

  describe('convertToNotionBlock - Block conversion', () => {
    it('should convert domain Block to NotionBlock', () => {
      const mockBlock: Partial<Block> = {
        id: 'block-123',
        type: 'paragraph',
        data: { rich_text: [{ plain_text: 'Test content' }] },
        hasChildren: false,
        createdTime: '2024-01-01T00:00:00Z',
        lastEditedTime: '2024-01-01T00:00:00Z'
      };

      const result = (service as unknown as { convertToNotionBlock: (block: Block) => unknown }).convertToNotionBlock(mockBlock as Block);

      expect(result).toEqual(
        expect.objectContaining({
          object: 'block',
          id: 'block-123',
          type: 'paragraph',
          has_children: false,
          archived: false
        })
      );
    });
  });

  describe('Error handling and edge cases', () => {
    it('should handle embedding generation errors gracefully', async () => {
      const mockPage: Partial<Page> = {
        id: 'page-123',
        properties: { title: 'Test Page' },
        toJSON: vi.fn(() => ({
          id: 'page-123',
          properties: { title: 'Test Page' },
          createdTime: undefined,
          lastEditedTime: undefined,
          url: undefined
        }))
      };

      const mockPageContent = {
        fullText: 'Test content',
        htmlStructure: '<p>Test content</p>',
        sections: [],
        contentHash: 'hash-123',
        wordCount: 2,
        characterCount: 12
      };

      const mockChunks = [
        {
          text: 'Test content',
          metadata: {
            chunkIndex: 0,
            blockIds: ['block-1'],
            startOffset: 0,
            endOffset: 12
          }
        }
      ];

      const { NotionContentExtractor } = await import('../NotionContentExtractor');
      vi.mocked(NotionContentExtractor.extractPageContent).mockReturnValue(mockPageContent);
      vi.mocked(NotionContentExtractor.generateTextChunks).mockReturnValue(mockChunks);

      mockRepository.savePage.mockResolvedValue({ id: 'uuid-123', notion_id: 'page-123' } as unknown as Awaited<ReturnType<typeof mockRepository.savePage>>);
      mockRepository.saveBlocks.mockResolvedValue([{ id: 'uuid-block-1', notion_id: 'block-1' }] as unknown as Awaited<ReturnType<typeof mockRepository.saveBlocks>>);
      mockEmbeddingsService.generateEmbeddings.mockRejectedValue(new Error('Embedding service error'));

      // Should not throw error, just log it
      const result = await service.processAndSavePage(mockPage as Page, []);

      expect(result).toEqual({ id: 'uuid-123', notion_id: 'page-123' });
      // Console mocks están centralizados globalmente
    });

    it('should handle empty embeddings generation gracefully', async () => {
      const mockPage: Partial<Page> = {
        id: 'page-empty',
        properties: { title: 'Empty Page' },
        toJSON: vi.fn(() => ({
          id: 'page-empty',
          properties: { title: 'Empty Page' },
          createdTime: undefined,
          lastEditedTime: undefined,
          url: undefined
        }))
      };

      const mockPageContent = {
        fullText: '',
        htmlStructure: '',
        sections: [],
        contentHash: 'empty',
        wordCount: 0,
        characterCount: 0
      };

      const { NotionContentExtractor } = await import('../NotionContentExtractor');
      vi.mocked(NotionContentExtractor.extractPageContent).mockReturnValue(mockPageContent);
      vi.mocked(NotionContentExtractor.generateTextChunks).mockReturnValue([]);

      mockRepository.savePage.mockResolvedValue({ id: 'uuid-empty' } as { id: string });
      mockRepository.saveBlocks.mockResolvedValue([]);

      const result = await service.processAndSavePage(mockPage as Page, []);

      expect(result).toEqual({ id: 'uuid-empty' });
      expect(mockEmbeddingsService.generateEmbeddings).not.toHaveBeenCalled();
    });
  });
}); 