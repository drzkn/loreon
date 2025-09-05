import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NotionMigrationService } from '../NotionMigrationService';

// Usar el sistema centralizado de mocks
import {
  createTestSetup
} from '@/mocks';

// Mocks inline para evitar problemas de hoisting
vi.mock('@/adapters/output/infrastructure/supabase/NotionNativeRepository', () => ({
  NotionNativeRepository: vi.fn(() => ({
    savePage: vi.fn(),
    saveBlocks: vi.fn(),
    saveEmbeddings: vi.fn(),
    getStorageStats: vi.fn(),
    getPageByNotionId: vi.fn(),
    getPageBlocks: vi.fn(),
    searchBlocks: vi.fn(),
    searchSimilarEmbeddings: vi.fn()
  }))
}));

vi.mock('@/services/embeddings', () => ({
  EmbeddingsService: vi.fn(() => ({
    generateEmbeddings: vi.fn(),
    generateEmbedding: vi.fn()
  }))
}));

vi.mock('@/adapters/output/infrastructure/supabase/SupabaseClient', () => ({
  supabase: {
    auth: {
      signInWithOAuth: vi.fn(),
      signInAnonymously: vi.fn(),
      getUser: vi.fn(),
      getSession: vi.fn(),
      signOut: vi.fn()
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn()
    }))
  }
}));

vi.mock('@/adapters/output/infrastructure/supabase/SupabaseServerClient', () => ({
  supabaseServer: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      or: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      single: vi.fn().mockReturnValue(Promise.resolve({ data: null, error: null })),
      maybeSingle: vi.fn().mockReturnValue(Promise.resolve({ data: null, error: null }))
    })),
    auth: {
      getUser: vi.fn(),
      signOut: vi.fn()
    },
    storage: {
      from: vi.fn()
    }
  }
}));

vi.mock('../NotionContentExtractor', () => ({
  NotionContentExtractor: {
    extractPageContent: vi.fn(),
    generateTextChunks: vi.fn()
  }
}));

vi.mock('@/infrastructure/di/container', () => ({
  container: {
    getPageUseCase: {
      execute: vi.fn()
    },
    getBlockChildrenRecursiveUseCase: {
      execute: vi.fn()
    }
  }
}));

describe('NotionMigrationService', () => {
  let service: NotionMigrationService;
  let mockRepository: unknown;
  let mockEmbeddingsService: unknown;
  let mockContainer: unknown;
  const { teardown } = createTestSetup(); // ✅ Console mocks centralizados

  beforeEach(async () => {
    vi.clearAllMocks();
    service = new NotionMigrationService();

    // Obtener referencias a los mocks después de la instanciación
    mockRepository = (service as unknown as { repository: unknown }).repository;
    mockEmbeddingsService = (service as unknown as { embeddingsService: unknown }).embeddingsService;

    // Obtener referencia al mock container
    const { container } = await import('@/infrastructure/di/container');
    mockContainer = container;
  });

  afterEach(() => {
    teardown(); // ✅ Limpieza automática
  });

  describe('migratePage - Migración individual', () => {
    it('should successfully migrate a single page', async () => {
      // Setup mocks
      const mockPage = {
        id: 'page-123',
        title: 'Test Page',
        url: 'https://notion.so/test',
        properties: { title: 'Test' },
        created_time: '2024-01-01T00:00:00Z',
        last_edited_time: '2024-01-02T00:00:00Z',
        archived: false
      };

      const mockBlocks = [
        {
          id: 'block-1',
          object: 'block',
          type: 'paragraph',
          parent: { type: 'page_id', page_id: 'page-123' },
          created_time: '2024-01-01T00:00:00Z',
          last_edited_time: '2024-01-01T00:00:00Z',
          created_by: { object: 'user', id: 'user-123' },
          last_edited_by: { object: 'user', id: 'user-123' },
          has_children: false,
          archived: false
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

      // Mock API calls
      mockContainer.getPageUseCase.execute.mockResolvedValue(mockPage);
      mockContainer.getBlockChildrenRecursiveUseCase.execute.mockResolvedValue({
        blocks: mockBlocks
      });

      // Mock content extraction
      const { NotionContentExtractor } = await import('../NotionContentExtractor');
      vi.mocked(NotionContentExtractor.extractPageContent).mockReturnValue(mockPageContent);
      vi.mocked(NotionContentExtractor.generateTextChunks).mockReturnValue([
        {
          text: 'Test content',
          metadata: {
            chunkIndex: 0,
            blockIds: ['block-1'],
            startOffset: 0,
            endOffset: 12
          }
        }
      ]);

      // Mock repository calls
      mockRepository.savePage.mockResolvedValue(mockSavedPage);
      mockRepository.saveBlocks.mockResolvedValue(mockSavedBlocks);
      mockRepository.saveEmbeddings.mockResolvedValue([]);

      // Mock embeddings service
      mockEmbeddingsService.generateEmbeddings.mockResolvedValue([[0.1, 0.2, 0.3]]);

      const result = await service.migratePage('page-123');

      expect(result.success).toBe(true);
      expect(result.pageId).toBe('uuid-123');
      expect(result.blocksProcessed).toBe(1);
      expect(result.embeddingsGenerated).toBe(1);
      expect(mockContainer.getPageUseCase.execute).toHaveBeenCalledWith('page-123');
      expect(mockRepository.savePage).toHaveBeenCalled();
      expect(mockRepository.saveBlocks).toHaveBeenCalled();
    });

    it('should handle migration errors gracefully', async () => {
      const errorMessage = 'Failed to fetch page';
      mockContainer.getPageUseCase.execute.mockRejectedValue(new Error(errorMessage));

      const result = await service.migratePage('invalid-page');

      expect(result.success).toBe(false);
      expect(result.errors![0]).toContain('Failed to fetch page');
      // El console.error ya está mockeado globalmente
    });

    it('should handle content extraction errors', async () => {
      // Setup successful API calls
      mockContainer.getPageUseCase.execute.mockResolvedValue({
        id: 'page-123',
        title: 'Test Page'
      });
      mockContainer.getBlockChildrenRecursiveUseCase.execute.mockResolvedValue({
        blocks: []
      });

      // Mock content extraction to throw error
      const { NotionContentExtractor } = await import('../NotionContentExtractor');
      vi.mocked(NotionContentExtractor.extractPageContent).mockImplementation(() => {
        throw new Error('Content extraction failed');
      });

      const result = await service.migratePage('page-123');

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Content extraction failed');
    });
  });

  describe('migrateMultiplePages - Migración por lotes', () => {
    it('should migrate multiple pages successfully', async () => {
      const pageIds = ['page-1', 'page-2', 'page-3'];

      // Mock successful migrations
      vi.spyOn(service, 'migratePage').mockImplementation(async (pageId) => ({
        success: true,
        pageId: `uuid-${pageId}`,
        blocksProcessed: 5,
        embeddingsGenerated: 10,
        errors: undefined
      }));

      const result = await service.migrateMultiplePages(pageIds, 2);

      expect(result.summary.total).toBe(3);
      expect(result.summary.successful).toBe(3);
      expect(result.summary.failed).toBe(0);
      expect(result.summary.totalBlocks).toBe(15);
      expect(result.summary.totalEmbeddings).toBe(30);
      expect(result.results).toHaveLength(3);
    });

    it('should handle mixed success and failure results', async () => {
      const pageIds = ['page-1', 'page-2', 'page-3'];

      // Mock mixed results
      vi.spyOn(service, 'migratePage')
        .mockResolvedValueOnce({
          success: true,
          pageId: 'uuid-page-1',
          blocksProcessed: 5,
          embeddingsGenerated: 10
        })
        .mockResolvedValueOnce({
          success: false,
          errors: ['Migration failed']
        })
        .mockResolvedValueOnce({
          success: true,
          pageId: 'uuid-page-3',
          blocksProcessed: 3,
          embeddingsGenerated: 6
        });

      const result = await service.migrateMultiplePages(pageIds, 3);

      expect(result.summary.total).toBe(3);
      expect(result.summary.successful).toBe(2);
      expect(result.summary.failed).toBe(1);
      expect(result.summary.totalBlocks).toBe(8);
      expect(result.summary.totalEmbeddings).toBe(16);
    });

    it('should handle rejected promises in batch processing', async () => {
      const pageIds = ['page-1', 'page-2'];

      // Mock one success and one rejection
      vi.spyOn(service, 'migratePage')
        .mockResolvedValueOnce({
          success: true,
          pageId: 'uuid-page-1',
          blocksProcessed: 5,
          embeddingsGenerated: 10
        })
        .mockRejectedValueOnce(new Error('Network error'));

      const result = await service.migrateMultiplePages(pageIds, 2);

      expect(result.summary.total).toBe(2);
      expect(result.summary.successful).toBe(1);
      expect(result.summary.failed).toBe(1);
      expect(result.results).toHaveLength(2);
      expect(result.results[1].success).toBe(false);
      expect(result.results[1].errors![0]).toContain('Network error');
    });
  });

  describe('getContentInFormat - Conversión de formatos', () => {
    it('should return content in JSON format', async () => {
      const mockPage = {
        id: 'uuid-123',
        notion_id: 'page-123',
        title: 'Test Page'
      };
      const mockBlocks = [
        {
          id: 'uuid-block-1',
          notion_id: 'block-1',
          type: 'paragraph',
          plain_text: 'Test content'
        }
      ];

      mockRepository.getPageByNotionId.mockResolvedValue(mockPage);
      mockRepository.getPageBlocks.mockResolvedValue(mockBlocks);

      const result = await service.getContentInFormat('page-123', 'json');

      expect(typeof result).toBe('string');
      const parsed = JSON.parse(result);
      expect(parsed.page).toEqual(mockPage);
      expect(parsed.blocks).toEqual(mockBlocks);
    });

    it('should return content in plain text format', async () => {
      const mockPage = {
        id: 'uuid-123',
        notion_id: 'page-123',
        title: 'Test Page'
      };
      const mockBlocks = [
        {
          id: 'uuid-block-1',
          plain_text: 'First paragraph',
          html_content: '<p>First paragraph</p>'
        },
        {
          id: 'uuid-block-2',
          plain_text: 'Second paragraph',
          html_content: '<p>Second paragraph</p>'
        }
      ];

      mockRepository.getPageByNotionId.mockResolvedValue(mockPage);
      mockRepository.getPageBlocks.mockResolvedValue(mockBlocks);

      const result = await service.getContentInFormat('page-123', 'plain');

      expect(result).toBe('First paragraph\nSecond paragraph');
    });

    it('should handle page not found', async () => {
      mockRepository.getPageByNotionId.mockResolvedValue(null);

      await expect(service.getContentInFormat('nonexistent', 'json'))
        .rejects.toThrow('Página no encontrada: nonexistent');
    });

    it('should handle unsupported format', async () => {
      const mockPage = { id: 'uuid-123', notion_id: 'page-123' };
      mockRepository.getPageByNotionId.mockResolvedValue(mockPage);

      await expect(service.getContentInFormat('page-123', 'unsupported' as 'json' | 'plain'))
        .rejects.toThrow('Formato no soportado: unsupported');
    });
  });

  describe('searchContent - Búsqueda de contenido', () => {
    it('should search content using text search only', async () => {
      const mockBlocks = [
        {
          id: 'uuid-block-1',
          notion_id: 'block-1',
          page_id: 'uuid-page-1',
          plain_text: 'JavaScript is awesome',
          type: 'paragraph'
        }
      ];

      mockRepository.searchBlocks.mockResolvedValue(mockBlocks);

      const result = await service.searchContent('JavaScript', {
        useEmbeddings: false,
        limit: 10
      });

      expect(result.textResults).toEqual(mockBlocks);
      expect(result.embeddingResults).toBeUndefined();
      expect(mockRepository.searchBlocks).toHaveBeenCalledWith('JavaScript', 10);
    });

    it('should search content using embeddings', async () => {
      const mockEmbeddingResults = [
        {
          id: 'embedding-1',
          block_id: 'uuid-block-1',
          page_id: 'uuid-page-1',
          similarity: 0.85,
          chunk_text: 'JavaScript content',
          embedding: [0.1, 0.2, 0.3],
          content_hash: 'hash1',
          chunk_index: 0,
          metadata: {},
          created_at: '2024-01-01T00:00:00Z'
        }
      ];

      const mockBlocks = [
        {
          id: 'uuid-block-1',
          notion_id: 'block-1',
          page_id: 'uuid-page-1',
          plain_text: 'JavaScript content',
          type: 'paragraph'
        }
      ];

      mockRepository.searchBlocks.mockResolvedValue([]);
      mockEmbeddingsService.generateEmbedding.mockResolvedValue([0.1, 0.2, 0.3]);
      mockRepository.searchSimilarEmbeddings.mockResolvedValue(mockEmbeddingResults);
      mockRepository.getPageBlocks.mockResolvedValue(mockBlocks);

      const result = await service.searchContent('JavaScript', {
        useEmbeddings: true,
        threshold: 0.8,
        limit: 5
      });

      expect(result.textResults).toEqual([]);
      expect(result.embeddingResults).toHaveLength(1);
      expect(result.embeddingResults![0].similarity).toBe(0.85);
      expect(mockEmbeddingsService.generateEmbedding).toHaveBeenCalledWith('JavaScript');
      expect(mockRepository.searchSimilarEmbeddings).toHaveBeenCalledWith([0.1, 0.2, 0.3], 5, 0.8);
    });
  });

  describe('getMigrationStats - Estadísticas del sistema', () => {
    it('should return migration statistics', async () => {
      const mockStorageStats = {
        totalPages: 100,
        totalBlocks: 500,
        totalEmbeddings: 1000,
        lastSync: '2024-01-01T00:00:00Z'
      };

      const mockContentStats = [
        { type: 'paragraph', plain_text: 'Some content with multiple words here' },
        { type: 'heading_1', plain_text: 'Title' },
        { type: 'paragraph', plain_text: 'More content' },
        { type: 'code', plain_text: 'const x = 42;' }
      ];

      mockRepository.getStorageStats.mockResolvedValue(mockStorageStats);

      // Mock supabaseServer call
      const mockSupabaseServer = await import('@/adapters/output/infrastructure/supabase/SupabaseServerClient');
      const mockFrom = vi.mocked(mockSupabaseServer.supabaseServer.from);
      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: mockContentStats, error: null })
      } as unknown as ReturnType<typeof mockFrom>);

      const result = await service.getMigrationStats();

      expect(result.storage).toEqual(mockStorageStats);
      // Los datos mock tienen: 'Some content with multiple words here' (6) + 'Title' (1) + 'More content' (2) + 'const x = 42;' (4) = 13 palabras
      expect(result.content.totalWords).toBe(13);
      expect(result.content.averageWordsPerPage).toBe(0); // 13/100 = 0.13 -> Math.round = 0
      expect(result.content.topContentTypes).toHaveLength(3);
      expect(result.content.topContentTypes[0].type).toBe('paragraph');
      expect(result.content.topContentTypes[0].count).toBe(2);
    });
  });

  describe('Private methods - extractPlainTextFromBlock', () => {
    it('should extract plain text from rich_text blocks', () => {
      const mockBlock = {
        id: 'block-1',
        type: 'paragraph',
        data: {
          rich_text: [
            { plain_text: 'Hello ' },
            { text: { content: 'world' } }
          ]
        }
      };

      const result = (service as unknown as { extractPlainTextFromBlock: (block: unknown) => string }).extractPlainTextFromBlock(mockBlock);
      expect(result).toBe('Hello world');
    });

    it('should extract plain text from title blocks', () => {
      const mockBlock = {
        id: 'block-1',
        type: 'heading_1',
        data: {
          title: [
            { plain_text: 'Main ' },
            { text: { content: 'Title' } }
          ]
        }
      };

      const result = (service as unknown as { extractPlainTextFromBlock: (block: unknown) => string }).extractPlainTextFromBlock(mockBlock);
      expect(result).toBe('Main Title');
    });

    it('should handle blocks with no extractable text', () => {
      const mockBlock = {
        id: 'block-1',
        type: 'divider',
        data: {}
      };

      const result = (service as unknown as { extractPlainTextFromBlock: (block: unknown) => string }).extractPlainTextFromBlock(mockBlock);
      expect(result).toBe('');
    });
  });

  describe('Error handling and edge cases', () => {
    it('should handle empty block arrays', async () => {
      mockContainer.getPageUseCase.execute.mockResolvedValue({
        id: 'page-123',
        title: 'Empty Page'
      });
      mockContainer.getBlockChildrenRecursiveUseCase.execute.mockResolvedValue({
        blocks: []
      });

      const { NotionContentExtractor } = await import('../NotionContentExtractor');
      vi.mocked(NotionContentExtractor.extractPageContent).mockReturnValue({
        fullText: '',
        htmlStructure: '',
        sections: [],
        contentHash: 'empty',
        wordCount: 0,
        characterCount: 0
      });
      vi.mocked(NotionContentExtractor.generateTextChunks).mockReturnValue([]);

      mockRepository.savePage.mockResolvedValue({
        id: 'uuid-123',
        notion_id: 'page-123',
        title: 'Empty Page'
      } as { id: string; notion_id: string; title: string });
      mockRepository.saveBlocks.mockResolvedValue([]);

      const result = await service.migratePage('page-123');

      expect(result.success).toBe(true);
      expect(result.blocksProcessed).toBe(0);
      expect(result.embeddingsGenerated).toBe(0);
    });

    it('should handle network timeouts gracefully', async () => {
      const timeoutError = new Error('Network timeout');
      timeoutError.name = 'TimeoutError';

      mockContainer.getPageUseCase.execute.mockRejectedValue(timeoutError);

      const result = await service.migratePage('page-123');

      expect(result.success).toBe(false);
      expect(result.errors![0]).toContain('Network timeout');
    });
  });
}); 