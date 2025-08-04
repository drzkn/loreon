import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NotionService } from '../NotionService';

// Mocks simplificados
vi.mock('@/adapters/output/infrastructure/supabase/NotionStorageRepository/NotionStorageRepository', () => ({
  NotionStorageRepository: vi.fn().mockImplementation(() => ({
    savePage: vi.fn(),
    saveBlocks: vi.fn(),
    saveEmbeddings: vi.fn(),
    getPageByNotionId: vi.fn(),
    getPageBlocksHierarchical: vi.fn(),
    searchSimilarEmbeddings: vi.fn(),
    searchBlocks: vi.fn(),
    archivePages: vi.fn()
  }))
}));

vi.mock('@/services/embeddings', () => ({
  EmbeddingsService: vi.fn().mockImplementation(() => ({
    generateEmbeddings: vi.fn(),
    generateEmbedding: vi.fn()
  }))
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

vi.mock('../NotionContentExtractor', () => ({
  NotionContentExtractor: {
    extractPageContent: vi.fn(),
    generateTextChunks: vi.fn()
  }
}));

describe('NotionService', () => {
  let service: NotionService;

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock console methods
    vi.spyOn(console, 'log').mockImplementation(() => { });
    vi.spyOn(console, 'error').mockImplementation(() => { });

    service = new NotionService();
  });

  describe('Basic functionality', () => {
    it('should create service instance', () => {
      expect(service).toBeDefined();
      expect(service).toBeInstanceOf(NotionService);
    });

    it('should have processAndSavePage method', () => {
      expect(typeof service.processAndSavePage).toBe('function');
    });

    it('should have processAndSavePages method', () => {
      expect(typeof service.processAndSavePages).toBe('function');
    });

    it('should have getStoredPage method', () => {
      expect(typeof service.getStoredPage).toBe('function');
    });

    it('should have getAllStoredPages method', () => {
      expect(typeof service.getAllStoredPages).toBe('function');
    });

    it('should have searchStoredPages method', () => {
      expect(typeof service.searchStoredPages).toBe('function');
    });

    it('should have deleteStoredPage method', () => {
      expect(typeof service.deleteStoredPage).toBe('function');
    });

    it('should have getPageWithBlocks method', () => {
      expect(typeof service.getPageWithBlocks).toBe('function');
    });
  });

  describe('Method signatures', () => {
    it('should handle getStoredPage call', async () => {
      const mockRepository = (service as unknown as { repository: { getPageByNotionId: ReturnType<typeof vi.fn> } }).repository;
      mockRepository.getPageByNotionId.mockResolvedValue(null);

      const result = await service.getStoredPage('test-id');

      expect(result).toBeNull();
      expect(mockRepository.getPageByNotionId).toHaveBeenCalledWith('test-id');
    });

    it('should handle deleteStoredPage call', async () => {
      const mockRepository = (service as unknown as { repository: { archivePages: ReturnType<typeof vi.fn> } }).repository;
      mockRepository.archivePages.mockResolvedValue(undefined);

      await service.deleteStoredPage('test-id');

      expect(mockRepository.archivePages).toHaveBeenCalledWith(['test-id']);
    });

    it('should handle getAllStoredPages with default options', async () => {
      const mockPages = [
        { id: 'uuid-1', notion_id: 'page-1', title: 'Page 1' }
      ];

      const mockSupabase = await import('@/adapters/output/infrastructure/supabase/SupabaseClient');
      const mockFrom = vi.mocked(mockSupabase.supabase.from);

      // Mock the full chain properly
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({ data: mockPages, error: null })
      };

      mockFrom.mockReturnValue(mockChain as unknown as ReturnType<typeof mockFrom>);

      const result = await service.getAllStoredPages();

      expect(result).toEqual(mockPages);
    });

    it('should handle searchStoredPages basic call', async () => {
      const mockRepository = (service as unknown as { repository: { searchBlocks: ReturnType<typeof vi.fn> } }).repository;
      mockRepository.searchBlocks.mockResolvedValue([]);

      const result = await service.searchStoredPages('test query');

      expect(result).toEqual([]);
      expect(mockRepository.searchBlocks).toHaveBeenCalledWith('test query', 20);
    });

    it('should handle getPageWithBlocks for non-existent page', async () => {
      const mockRepository = (service as unknown as { repository: { getPageByNotionId: ReturnType<typeof vi.fn> } }).repository;
      mockRepository.getPageByNotionId.mockResolvedValue(null);

      const result = await service.getPageWithBlocks('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('Error handling', () => {
    it('should handle database errors in getAllStoredPages', async () => {
      const mockSupabase = await import('@/adapters/output/infrastructure/supabase/SupabaseClient');
      const mockFrom = vi.mocked(mockSupabase.supabase.from);

      // Mock the chain to return an error
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({ data: null, error: { message: 'Database error' } })
      };

      mockFrom.mockReturnValue(mockChain as unknown as ReturnType<typeof mockFrom>);

      await expect(service.getAllStoredPages()).rejects.toThrow('Error al obtener páginas: Database error');
    });

    it('should handle search with embeddings option', async () => {
      const mockRepository = (service as unknown as { repository: { searchBlocks: ReturnType<typeof vi.fn>; searchSimilarEmbeddings: ReturnType<typeof vi.fn> } }).repository;
      const mockEmbeddingsService = (service as unknown as { embeddingsService: { generateEmbedding: ReturnType<typeof vi.fn> } }).embeddingsService;

      mockRepository.searchBlocks.mockResolvedValue([]);
      mockRepository.searchSimilarEmbeddings.mockResolvedValue([]);
      mockEmbeddingsService.generateEmbedding.mockResolvedValue([0.1, 0.2, 0.3]);

      const result = await service.searchStoredPages('test', { useEmbeddings: true });

      expect(result).toEqual([]);
      expect(mockEmbeddingsService.generateEmbedding).toHaveBeenCalledWith('test');
      expect(mockRepository.searchSimilarEmbeddings).toHaveBeenCalledWith([0.1, 0.2, 0.3], 20, 0.7);
    });
  });

  describe('Edge cases', () => {
    it('should handle empty search results', async () => {
      const mockRepository = (service as unknown as { repository: { searchBlocks: ReturnType<typeof vi.fn> } }).repository;
      mockRepository.searchBlocks.mockResolvedValue([]);

      const result = await service.searchStoredPages('no results');

      expect(result).toEqual([]);
    });

    it('should handle search with custom limit', async () => {
      const mockRepository = (service as unknown as { repository: { searchBlocks: ReturnType<typeof vi.fn> } }).repository;
      mockRepository.searchBlocks.mockResolvedValue([]);

      await service.searchStoredPages('test', { limit: 50 });

      expect(mockRepository.searchBlocks).toHaveBeenCalledWith('test', 50);
    });

    it('should handle getAllStoredPages with custom options', async () => {
      const mockPages: unknown[] = [];

      const mockSupabase = await import('@/adapters/output/infrastructure/supabase/SupabaseClient');
      const mockFrom = vi.mocked(mockSupabase.supabase.from);
      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockPages, error: null })
      } as unknown as ReturnType<typeof mockFrom>);

      const result = await service.getAllStoredPages({
        limit: 50,
        offset: 10
      });

      expect(result).toEqual(mockPages);
    });
  });
}); 