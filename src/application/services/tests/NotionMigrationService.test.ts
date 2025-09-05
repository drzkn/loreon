import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NotionMigrationService, MigrationResult, ValidationResult } from '../NotionMigrationService';
import { IEmbeddingsService } from '@/application/interfaces/IEmbeddingsService';
import { ILogger } from '@/application/interfaces/ILogger';
import { NotionNativeRepository, NotionPageRow, NotionBlockRow } from '@/adapters/output/infrastructure/supabase/NotionNativeRepository';
import { GetPage } from '@/domain/usecases/GetPage';
import { GetBlockChildrenRecursive } from '@/domain/usecases/GetBlockChildrenRecursive';
import { createTestSetup } from '@/mocks';

// Mock NotionContentExtractor
vi.mock('@/services/notion/NotionContentExtractor', () => ({
  NotionContentExtractor: {
    extractPageContent: vi.fn(),
    generateTextChunks: vi.fn()
  }
}));

describe('NotionMigrationService (Application Layer)', () => {
  let service: NotionMigrationService;
  let mockRepository: NotionNativeRepository;
  let mockEmbeddingsService: IEmbeddingsService;
  let mockGetPageUseCase: GetPage;
  let mockGetBlockChildrenRecursiveUseCase: GetBlockChildrenRecursive;
  let mockLogger: ILogger;
  const { teardown } = createTestSetup();

  beforeEach(async () => {
    vi.clearAllMocks();

    // Mock dependencies
    mockRepository = {
      savePage: vi.fn(),
      saveBlocks: vi.fn(),
      saveEmbeddings: vi.fn(),
      getStorageStats: vi.fn(),
      getPageByNotionId: vi.fn(),
      getPageBlocks: vi.fn(),
      searchBlocks: vi.fn(),
      searchPagesByTitle: vi.fn(),
      searchSimilarEmbeddings: vi.fn(),
      getPageByTitle: vi.fn(),
      getPagesByIds: vi.fn(),
      getBlocksByPageId: vi.fn(),
      updatePage: vi.fn(),
      deletePage: vi.fn(),
      getRecentPages: vi.fn(),
      archivePages: vi.fn()
    } as unknown as NotionNativeRepository;

    mockEmbeddingsService = {
      generateEmbedding: vi.fn(),
      generateEmbeddings: vi.fn()
    };

    mockGetPageUseCase = {
      execute: vi.fn()
    } as unknown as GetPage;

    mockGetBlockChildrenRecursiveUseCase = {
      execute: vi.fn()
    } as unknown as GetBlockChildrenRecursive;

    mockLogger = {
      info: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
      warn: vi.fn()
    };

    service = new NotionMigrationService(
      mockRepository,
      mockEmbeddingsService,
      mockGetPageUseCase,
      mockGetBlockChildrenRecursiveUseCase,
      mockLogger
    );
  });

  afterEach(() => {
    teardown();
  });

  describe('Constructor and Initialization', () => {
    it('should initialize service with all dependencies', () => {
      expect(service).toBeInstanceOf(NotionMigrationService);
      expect(mockLogger.info).toHaveBeenCalledWith('NotionMigrationService initialized with dependency injection');
    });
  });

  describe('migratePage - Core migration functionality', () => {
    const mockNotionPageId = 'page-123';
    const mockPageData = {
      id: mockNotionPageId,
      title: 'Test Page',
      url: 'https://notion.so/test',
      properties: { title: [{ plain_text: 'Test Page' }] },
      createdTime: '2024-01-01T00:00:00Z',
      lastEditedTime: '2024-01-02T00:00:00Z'
    };

    const mockBlocksData = [
      {
        id: 'block-1',
        type: 'paragraph',
        data: {
          rich_text: [{ plain_text: 'Test content' }]
        },
        hasChildren: false,
        createdTime: '2024-01-01T00:00:00Z',
        lastEditedTime: '2024-01-01T00:00:00Z'
      }
    ];

    const mockPageContent = {
      fullText: 'Test content',
      htmlStructure: '<p>Test content</p>',
      sections: [{ heading: 'Test Page', content: 'Test content' }],
      contentHash: 'hash-123',
      wordCount: 2,
      characterCount: 12
    };

    const mockSavedPage: NotionPageRow = {
      id: 'uuid-123',
      notion_id: mockNotionPageId,
      title: 'Test Page',
      parent_id: null,
      database_id: null,
      url: 'https://notion.so/test',
      icon_emoji: null,
      icon_url: null,
      cover_url: null,
      notion_created_time: '2024-01-01T00:00:00Z',
      notion_last_edited_time: '2024-01-02T00:00:00Z',
      archived: false,
      properties: {},
      raw_data: {},
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-02T00:00:00Z'
    };

    const mockSavedBlocks: NotionBlockRow[] = [
      {
        id: 'uuid-block-1',
        notion_id: 'block-1',
        page_id: 'uuid-123',
        parent_block_id: null,
        type: 'paragraph',
        content: {},
        plain_text: 'Test content',
        html_content: '<p>Test content</p>',
        position: 0,
        has_children: false,
        notion_created_time: '2024-01-01T00:00:00Z',
        notion_last_edited_time: '2024-01-01T00:00:00Z',
        archived: false,
        raw_data: {},
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }
    ];

    it('should successfully migrate a page with complete flow', async () => {
      // Setup mocks
      mockGetPageUseCase.execute.mockResolvedValue(mockPageData);
      mockGetBlockChildrenRecursiveUseCase.execute.mockResolvedValue({
        blocks: mockBlocksData,
        totalBlocks: 1,
        processedDepth: 1
      });

      const { NotionContentExtractor } = await import('@/services/notion/NotionContentExtractor');
      vi.mocked(NotionContentExtractor.extractPageContent).mockReturnValue(mockPageContent);
      vi.mocked(NotionContentExtractor.generateTextChunks).mockReturnValue([
        {
          text: 'Test content',
          metadata: {
            chunkIndex: 0,
            blockIds: ['block-1'],
            startOffset: 0,
            endOffset: 12,
            section: 'Test Page'
          }
        }
      ]);

      mockRepository.savePage.mockResolvedValue(mockSavedPage);
      mockRepository.saveBlocks.mockResolvedValue(mockSavedBlocks);
      mockRepository.saveEmbeddings.mockResolvedValue([]);
      mockEmbeddingsService.generateEmbeddings.mockResolvedValue([[0.1, 0.2, 0.3]]);

      const result = await service.migratePage(mockNotionPageId);

      expect(result.success).toBe(true);
      expect(result.pageId).toBe('uuid-123');
      expect(result.blocksProcessed).toBe(1);
      expect(result.embeddingsGenerated).toBe(1);
      expect(result.errors).toBeUndefined();
      expect(result.validationResult).toBeDefined();

      // Verify all steps were called
      expect(mockGetPageUseCase.execute).toHaveBeenCalledWith(mockNotionPageId);
      expect(mockGetBlockChildrenRecursiveUseCase.execute).toHaveBeenCalledWith(mockNotionPageId, {
        maxDepth: 10,
        includeEmptyBlocks: true
      });
      expect(mockRepository.savePage).toHaveBeenCalled();
      expect(mockRepository.saveBlocks).toHaveBeenCalled();
      expect(mockRepository.saveEmbeddings).toHaveBeenCalled();
      expect(mockEmbeddingsService.generateEmbeddings).toHaveBeenCalled();
    });

    it('should handle errors during page fetching', async () => {
      const error = new Error('Failed to fetch page from Notion API');
      mockGetPageUseCase.execute.mockRejectedValue(error);

      const result = await service.migratePage(mockNotionPageId);

      expect(result.success).toBe(false);
      expect(result.errors).toContain(`Failed to fetch page ${mockNotionPageId} from Notion: Failed to fetch page from Notion API`);
      expect(mockLogger.error).toHaveBeenCalled();
    });

    it('should handle errors during content extraction', async () => {
      mockGetPageUseCase.execute.mockResolvedValue(mockPageData);
      mockGetBlockChildrenRecursiveUseCase.execute.mockResolvedValue({
        blocks: mockBlocksData,
        totalBlocks: 1,
        processedDepth: 1
      });

      const { NotionContentExtractor } = await import('@/services/notion/NotionContentExtractor');
      vi.mocked(NotionContentExtractor.extractPageContent).mockImplementation(() => {
        throw new Error('Content extraction failed');
      });

      const result = await service.migratePage(mockNotionPageId);

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Content extraction failed');
    });

    it('should handle errors during page saving', async () => {
      mockGetPageUseCase.execute.mockResolvedValue(mockPageData);
      mockGetBlockChildrenRecursiveUseCase.execute.mockResolvedValue({
        blocks: mockBlocksData,
        totalBlocks: 1,
        processedDepth: 1
      });

      const { NotionContentExtractor } = await import('@/services/notion/NotionContentExtractor');
      vi.mocked(NotionContentExtractor.extractPageContent).mockReturnValue(mockPageContent);

      mockRepository.savePage.mockRejectedValue(new Error('Database error'));

      const result = await service.migratePage(mockNotionPageId);

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Database error');
    });

    it('should handle pages with no content chunks', async () => {
      mockGetPageUseCase.execute.mockResolvedValue(mockPageData);
      mockGetBlockChildrenRecursiveUseCase.execute.mockResolvedValue({
        blocks: [],
        totalBlocks: 0,
        processedDepth: 0
      });

      const { NotionContentExtractor } = await import('@/services/notion/NotionContentExtractor');
      vi.mocked(NotionContentExtractor.extractPageContent).mockReturnValue({
        ...mockPageContent,
        wordCount: 0,
        characterCount: 0
      });
      vi.mocked(NotionContentExtractor.generateTextChunks).mockReturnValue([]);

      mockRepository.savePage.mockResolvedValue(mockSavedPage);
      mockRepository.saveBlocks.mockResolvedValue([]);

      const result = await service.migratePage(mockNotionPageId);

      expect(result.success).toBe(true);
      expect(result.embeddingsGenerated).toBe(0);
      expect(mockLogger.warn).toHaveBeenCalledWith('No chunks generated for page', { pageId: 'uuid-123' });
    });
  });

  describe('migrateMultiplePages - Batch migration', () => {
    const pageIds = ['page-1', 'page-2', 'page-3', 'page-4'];

    it('should migrate multiple pages in batches successfully', async () => {
      // Mock successful migrations
      vi.spyOn(service, 'migratePage').mockImplementation(async (pageId) => ({
        success: true,
        pageId: `uuid-${pageId}`,
        blocksProcessed: 5,
        embeddingsGenerated: 10
      }));

      const result = await service.migrateMultiplePages(pageIds, 2);

      expect(result.summary.total).toBe(4);
      expect(result.summary.successful).toBe(4);
      expect(result.summary.failed).toBe(0);
      expect(result.summary.totalBlocks).toBe(20);
      expect(result.summary.totalEmbeddings).toBe(40);
      expect(result.results).toHaveLength(4);

      // Should be called with correct batch info
      expect(mockLogger.info).toHaveBeenCalledWith('Starting batch migration', {
        totalPages: 4,
        batchSize: 2
      });
    });

    it('should handle mixed success and failure results', async () => {
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
        })
        .mockResolvedValueOnce({
          success: false,
          errors: ['Another error']
        });

      const result = await service.migrateMultiplePages(pageIds, 2);

      expect(result.summary.total).toBe(4);
      expect(result.summary.successful).toBe(2);
      expect(result.summary.failed).toBe(2);
      expect(result.summary.totalBlocks).toBe(8);
      expect(result.summary.totalEmbeddings).toBe(16);
    });

    it('should handle Promise.allSettled rejections', async () => {
      vi.spyOn(service, 'migratePage')
        .mockResolvedValueOnce({
          success: true,
          pageId: 'uuid-page-1',
          blocksProcessed: 5,
          embeddingsGenerated: 10
        })
        .mockRejectedValueOnce(new Error('Network timeout'));

      const result = await service.migrateMultiplePages(['page-1', 'page-2'], 2);

      expect(result.summary.total).toBe(2);
      expect(result.summary.successful).toBe(1);
      expect(result.summary.failed).toBe(1);
      expect(result.results[1].success).toBe(false);
      expect(result.results[1].errors![0]).toContain('Network timeout');
    });

    it('should use default batch size of 5', async () => {
      vi.spyOn(service, 'migratePage').mockResolvedValue({
        success: true,
        pageId: 'uuid-test',
        blocksProcessed: 1,
        embeddingsGenerated: 1
      });

      await service.migrateMultiplePages(['page-1']);

      expect(mockLogger.info).toHaveBeenCalledWith('Starting batch migration', {
        totalPages: 1,
        batchSize: 5
      });
    });
  });

  describe('getContentInFormat - Content formatting', () => {
    const mockPage: NotionPageRow = {
      id: 'uuid-123',
      notion_id: 'page-123',
      title: 'Test Page',
      parent_id: null,
      database_id: null,
      url: null,
      icon_emoji: null,
      icon_url: null,
      cover_url: null,
      notion_created_time: '2024-01-01T00:00:00Z',
      notion_last_edited_time: '2024-01-02T00:00:00Z',
      archived: false,
      properties: {},
      raw_data: {},
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-02T00:00:00Z'
    };

    const mockBlocks: NotionBlockRow[] = [
      {
        id: 'uuid-block-1',
        notion_id: 'block-1',
        page_id: 'uuid-123',
        parent_block_id: null,
        type: 'heading_1',
        content: {},
        plain_text: 'Main Title',
        html_content: '<h1>Main Title</h1>',
        position: 0,
        has_children: false,
        notion_created_time: '2024-01-01T00:00:00Z',
        notion_last_edited_time: '2024-01-01T00:00:00Z',
        archived: false,
        raw_data: {},
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      },
      {
        id: 'uuid-block-2',
        notion_id: 'block-2',
        page_id: 'uuid-123',
        parent_block_id: null,
        type: 'paragraph',
        content: {},
        plain_text: 'Test paragraph content',
        html_content: '<p>Test paragraph content</p>',
        position: 1,
        has_children: false,
        notion_created_time: '2024-01-01T00:00:00Z',
        notion_last_edited_time: '2024-01-01T00:00:00Z',
        archived: false,
        raw_data: {},
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }
    ];

    beforeEach(() => {
      mockRepository.getPageByNotionId.mockResolvedValue(mockPage);
      mockRepository.getPageBlocks.mockResolvedValue(mockBlocks);
    });

    it('should return content in JSON format', async () => {
      const result = await service.getContentInFormat('page-123', 'json');

      expect(typeof result).toBe('string');
      const parsed = JSON.parse(result);
      expect(parsed.page).toEqual(mockPage);
      expect(parsed.blocks).toEqual(mockBlocks);
    });

    it('should return content in plain text format', async () => {
      const result = await service.getContentInFormat('page-123', 'plain');

      expect(result).toBe('Main Title\nTest paragraph content');
    });

    it('should return content in HTML format', async () => {
      const result = await service.getContentInFormat('page-123', 'html');

      expect(result).toBe('<h1>Main Title</h1>\n<p>Test paragraph content</p>');
    });

    it('should return content in Markdown format', async () => {
      const result = await service.getContentInFormat('page-123', 'markdown');

      expect(result).toBe('# Main Title\n\nTest paragraph content');
    });

    it('should handle different block types in Markdown', async () => {
      const complexBlocks: NotionBlockRow[] = [
        {
          ...mockBlocks[0],
          type: 'heading_2',
          plain_text: 'Subtitle'
        },
        {
          ...mockBlocks[1],
          type: 'bulleted_list_item',
          plain_text: 'List item'
        },
        {
          ...mockBlocks[1],
          id: 'uuid-block-3',
          type: 'code',
          plain_text: 'const x = 42;'
        },
        {
          ...mockBlocks[1],
          id: 'uuid-block-4',
          type: 'quote',
          plain_text: 'Inspirational quote'
        }
      ];

      mockRepository.getPageBlocks.mockResolvedValue(complexBlocks);

      const result = await service.getContentInFormat('page-123', 'markdown');

      expect(result).toContain('## Subtitle');
      expect(result).toContain('- List item');
      expect(result).toContain('```\nconst x = 42;\n```');
      expect(result).toContain('> Inspirational quote');
    });

    it('should throw error for non-existent page', async () => {
      mockRepository.getPageByNotionId.mockResolvedValue(null);

      await expect(service.getContentInFormat('nonexistent', 'json'))
        .rejects.toThrow('Página no encontrada: nonexistent');

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Page not found',
        expect.any(Error),
        { pageId: 'nonexistent' }
      );
    });

    it('should throw error for unsupported format', async () => {
      await expect(service.getContentInFormat('page-123', 'xml' as any))
        .rejects.toThrow('Formato no soportado: xml');

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Unsupported format',
        expect.any(Error),
        { pageId: 'page-123', format: 'xml' }
      );
    });
  });

  describe('searchContent - Content search functionality', () => {
    const mockTextResults: NotionBlockRow[] = [
      {
        id: 'uuid-block-1',
        notion_id: 'block-1',
        page_id: 'uuid-page-1',
        parent_block_id: null,
        type: 'paragraph',
        content: {},
        plain_text: 'JavaScript is awesome',
        html_content: '<p>JavaScript is awesome</p>',
        position: 0,
        has_children: false,
        notion_created_time: '2024-01-01T00:00:00Z',
        notion_last_edited_time: '2024-01-01T00:00:00Z',
        archived: false,
        raw_data: {},
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }
    ];

    const mockPageResults: NotionPageRow[] = [
      {
        id: 'uuid-page-1',
        notion_id: 'page-1',
        title: 'JavaScript Guide',
        parent_id: null,
        database_id: null,
        url: null,
        icon_emoji: null,
        icon_url: null,
        cover_url: null,
        notion_created_time: '2024-01-01T00:00:00Z',
        notion_last_edited_time: '2024-01-02T00:00:00Z',
        archived: false,
        properties: {},
        raw_data: {},
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z'
      }
    ];

    it('should search content using text search only', async () => {
      mockRepository.searchBlocks.mockResolvedValue(mockTextResults);
      mockRepository.searchPagesByTitle.mockResolvedValue(mockPageResults);

      const result = await service.searchContent('JavaScript', {
        useEmbeddings: false,
        limit: 10
      });

      expect(result.textResults).toEqual(mockTextResults);
      expect(result.pageResults).toEqual(mockPageResults);
      expect(result.embeddingResults).toBeUndefined();
      expect(mockRepository.searchBlocks).toHaveBeenCalledWith('JavaScript', 10);
      expect(mockRepository.searchPagesByTitle).toHaveBeenCalledWith('JavaScript', 10);
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

      mockRepository.searchBlocks.mockResolvedValue(mockTextResults);
      mockRepository.searchPagesByTitle.mockResolvedValue(mockPageResults);
      mockEmbeddingsService.generateEmbedding.mockResolvedValue([0.1, 0.2, 0.3]);
      mockRepository.searchSimilarEmbeddings.mockResolvedValue(mockEmbeddingResults);
      mockRepository.getPageBlocks.mockResolvedValue(mockTextResults);

      const result = await service.searchContent('JavaScript', {
        useEmbeddings: true,
        threshold: 0.8,
        limit: 5
      });

      expect(result.textResults).toEqual(mockTextResults);
      expect(result.pageResults).toEqual(mockPageResults);
      expect(result.embeddingResults).toHaveLength(1);
      expect(result.embeddingResults![0].similarity).toBe(0.85);
      expect(result.embeddingResults![0].block).toEqual(mockTextResults[0]);

      expect(mockEmbeddingsService.generateEmbedding).toHaveBeenCalledWith('JavaScript');
      expect(mockRepository.searchSimilarEmbeddings).toHaveBeenCalledWith([0.1, 0.2, 0.3], 5, 0.8);
    });

    it('should use default search options', async () => {
      mockRepository.searchBlocks.mockResolvedValue([]);
      mockRepository.searchPagesByTitle.mockResolvedValue([]);

      await service.searchContent('test');

      expect(mockRepository.searchBlocks).toHaveBeenCalledWith('test', 20);
      expect(mockRepository.searchPagesByTitle).toHaveBeenCalledWith('test', 20);
    });

    it('should handle embeddings search with no matching blocks', async () => {
      const mockEmbeddingResults = [
        {
          id: 'embedding-1',
          block_id: 'nonexistent-block',
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

      mockRepository.searchBlocks.mockResolvedValue([]);
      mockRepository.searchPagesByTitle.mockResolvedValue([]);
      mockEmbeddingsService.generateEmbedding.mockResolvedValue([0.1, 0.2, 0.3]);
      mockRepository.searchSimilarEmbeddings.mockResolvedValue(mockEmbeddingResults);
      mockRepository.getPageBlocks.mockResolvedValue(mockTextResults);

      const result = await service.searchContent('test', { useEmbeddings: true });

      expect(result.embeddingResults).toHaveLength(1);
      expect(result.embeddingResults![0].block).toBeUndefined();
    });
  });

  describe('getMigrationStats - Statistics retrieval', () => {
    it('should return migration statistics', async () => {
      const mockStorageStats = {
        totalPages: 100,
        totalBlocks: 500,
        totalEmbeddings: 1000,
        lastSync: '2024-01-01T00:00:00Z'
      };

      mockRepository.getStorageStats.mockResolvedValue(mockStorageStats);

      const result = await service.getMigrationStats();

      expect(result.storage).toEqual(mockStorageStats);
      expect(result.content.totalWords).toBe(0); // Placeholder implementation
      expect(result.content.averageWordsPerPage).toBe(0);
      expect(result.content.topContentTypes).toEqual([]);

      expect(mockLogger.info).toHaveBeenCalledWith('Migration statistics retrieved', {
        totalPages: 100,
        totalBlocks: 500,
        totalEmbeddings: 1000,
        totalWords: 0
      });
    });

    it('should handle empty storage stats', async () => {
      const emptyStats = {
        totalPages: 0,
        totalBlocks: 0,
        totalEmbeddings: 0
      };

      mockRepository.getStorageStats.mockResolvedValue(emptyStats);

      const result = await service.getMigrationStats();

      expect(result.storage).toEqual(emptyStats);
      expect(result.content.averageWordsPerPage).toBe(0);
    });
  });

  describe('Private methods - extractPlainTextFromBlock', () => {
    it('should extract text from rich_text blocks', () => {
      const block = {
        id: 'block-1',
        type: 'paragraph',
        data: {
          rich_text: [
            { plain_text: 'Hello ' },
            { text: { content: 'world' } }
          ]
        }
      };

      const result = (service as any).extractPlainTextFromBlock(block);
      expect(result).toBe('Hello world');
    });

    it('should extract text from title blocks', () => {
      const block = {
        id: 'block-1',
        type: 'heading_1',
        data: {
          title: [
            { plain_text: 'Main ' },
            { text: { content: 'Title' } }
          ]
        }
      };

      const result = (service as any).extractPlainTextFromBlock(block);
      expect(result).toBe('Main Title');
    });

    it('should handle blocks with direct text property', () => {
      const block = {
        id: 'block-1',
        type: 'paragraph',
        data: {
          text: 'Simple text'
        }
      };

      const result = (service as any).extractPlainTextFromBlock(block);
      expect(result).toBe('Simple text');
    });

    it('should handle blocks with plain_text property', () => {
      const block = {
        id: 'block-1',
        type: 'paragraph',
        data: {
          plain_text: 'Plain text content'
        }
      };

      const result = (service as any).extractPlainTextFromBlock(block);
      expect(result).toBe('Plain text content');
    });

    it('should return empty string for blocks with no extractable text', () => {
      const block = {
        id: 'block-1',
        type: 'divider',
        data: {}
      };

      const result = (service as any).extractPlainTextFromBlock(block);
      expect(result).toBe('');
    });

    it('should handle blocks with no data', () => {
      const block = {
        id: 'block-1',
        type: 'paragraph'
      };

      const result = (service as any).extractPlainTextFromBlock(block);
      expect(result).toBe('');
    });
  });

  describe('Private methods - extractPageTitle', () => {
    it('should extract title from page properties', () => {
      const page = {
        id: 'page-1',
        title: 'Fallback Title',
        properties: {
          'Name': {
            type: 'title',
            title: [
              { plain_text: 'Actual ' },
              { plain_text: 'Title' }
            ]
          }
        }
      };

      const result = (service as any).extractPageTitle(page);
      expect(result).toBe('Actual Title');
    });

    it('should return "Sin título" when no title property found', () => {
      const page = {
        id: 'page-1',
        title: 'Fallback Title',
        properties: {
          'Description': {
            type: 'rich_text',
            rich_text: [{ plain_text: 'Some description' }]
          }
        }
      };

      const result = (service as any).extractPageTitle(page);
      expect(result).toBe('Sin título');
    });

    it('should handle empty properties', () => {
      const page = {
        id: 'page-1',
        title: 'Fallback Title',
        properties: {}
      };

      const result = (service as any).extractPageTitle(page);
      expect(result).toBe('Sin título');
    });
  });

  describe('Error handling and edge cases', () => {
    it('should handle non-Error exceptions in migratePage', async () => {
      mockGetPageUseCase.execute.mockRejectedValue('String error');

      const result = await service.migratePage('page-123');

      expect(result.success).toBe(false);
      expect(result.errors![0]).toContain('Failed to fetch page page-123 from Notion: Unknown error');
    });

    it('should handle timeout errors gracefully', async () => {
      const timeoutError = new Error('Request timeout');
      timeoutError.name = 'TimeoutError';

      mockGetPageUseCase.execute.mockRejectedValue(timeoutError);

      const result = await service.migratePage('page-123');

      expect(result.success).toBe(false);
      expect(result.errors![0]).toContain('Request timeout');
    });

    it('should log detailed information during migration', async () => {
      const mockPageData = {
        id: 'page-123',
        title: 'Test Page',
        createdTime: '2024-01-01T00:00:00Z',
        lastEditedTime: '2024-01-02T00:00:00Z'
      };

      mockGetPageUseCase.execute.mockResolvedValue(mockPageData);
      mockGetBlockChildrenRecursiveUseCase.execute.mockResolvedValue({
        blocks: [],
        totalBlocks: 0,
        processedDepth: 0
      });

      const { NotionContentExtractor } = await import('@/services/notion/NotionContentExtractor');
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
        notion_id: 'page-123'
      } as NotionPageRow);
      mockRepository.saveBlocks.mockResolvedValue([]);

      await service.migratePage('page-123');

      expect(mockLogger.info).toHaveBeenCalledWith('Starting page migration', { pageId: 'page-123' });
      expect(mockLogger.info).toHaveBeenCalledWith('Page migration completed successfully', {
        pageId: 'page-123',
        blocksProcessed: 0,
        embeddingsGenerated: 0
      });
    });
  });

  describe('Validation and quality assurance', () => {
    it('should return validation result with migration', async () => {
      const mockPageData = {
        id: 'page-123',
        title: 'Test Page',
        createdTime: '2024-01-01T00:00:00Z',
        lastEditedTime: '2024-01-02T00:00:00Z'
      };

      mockGetPageUseCase.execute.mockResolvedValue(mockPageData);
      mockGetBlockChildrenRecursiveUseCase.execute.mockResolvedValue({
        blocks: [],
        totalBlocks: 0,
        processedDepth: 0
      });

      const { NotionContentExtractor } = await import('@/services/notion/NotionContentExtractor');
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
        notion_id: 'page-123'
      } as NotionPageRow);
      mockRepository.saveBlocks.mockResolvedValue([]);

      const result = await service.migratePage('page-123');

      expect(result.validationResult).toBeDefined();
      expect(result.validationResult!.similarity).toBe(1.0);
      expect(result.validationResult!.isValid).toBe(true);
      expect(result.validationResult!.differences).toEqual([]);
      expect(result.validationResult!.textLengthDiff).toBe(0);
    });
  });
});
