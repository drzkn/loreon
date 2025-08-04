import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NotionStorageRepository } from '../NotionStorageRepository';

// Tipo para el mock de SupabaseClient
type MockSupabaseClient = {
  from: ReturnType<typeof vi.fn>;
  rpc: ReturnType<typeof vi.fn>;
};

// Mock simplificado de SupabaseClient
const createMockChain = (mockResponse: { data: unknown; error: unknown }) => ({
  select: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
  upsert: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  delete: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  in: vi.fn().mockReturnThis(),
  gt: vi.fn().mockReturnThis(),
  lt: vi.fn().mockReturnThis(),
  order: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
  textSearch: vi.fn().mockReturnThis(),
  head: vi.fn().mockReturnThis(),
  single: vi.fn().mockResolvedValue(mockResponse),
  maybeSingle: vi.fn().mockResolvedValue(mockResponse),
  then: vi.fn().mockResolvedValue(mockResponse)
});

describe('NotionStorageRepository', () => {
  let repository: NotionStorageRepository;
  let mockSupabaseClient: MockSupabaseClient;
  let mockResponse: { data: unknown; error: unknown };

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock console methods
    vi.spyOn(console, 'error').mockImplementation(() => { });
    vi.spyOn(console, 'log').mockImplementation(() => { });
    vi.spyOn(console, 'warn').mockImplementation(() => { });

    mockResponse = { data: null, error: null };

    mockSupabaseClient = {
      from: vi.fn(() => createMockChain(mockResponse)),
      rpc: vi.fn().mockResolvedValue(mockResponse)
    };

    repository = new NotionStorageRepository(mockSupabaseClient as unknown as import('@supabase/supabase-js').SupabaseClient);
  });

  describe('Páginas - Operaciones básicas', () => {
    it('should save a page successfully', async () => {
      const mockPageData = {
        notion_id: 'notion-123',
        title: 'Test Page',
        properties: { status: 'active' },
        raw_data: { original: 'data' }
      };

      const mockSavedPage = {
        id: 'uuid-123',
        ...mockPageData,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z',
        archived: false
      };

      mockResponse.data = mockSavedPage;

      const result = await repository.savePage(mockPageData);

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('notion_pages');
      expect(result).toEqual(mockSavedPage);
    });

    it('should handle save page errors', async () => {
      const mockPageData = {
        notion_id: 'notion-123',
        title: 'Test Page',
        properties: {},
        raw_data: {}
      };

      mockResponse.error = { message: 'Database error' };

      await expect(repository.savePage(mockPageData)).rejects.toThrow('Failed to save page: Database error');
      expect(console.error).toHaveBeenCalledWith('Error saving page:', expect.any(Object));
    });

    it('should get page by notion ID', async () => {
      const mockPage = {
        id: 'uuid-123',
        notion_id: 'notion-123',
        title: 'Test Page',
        archived: false
      };

      mockResponse.data = mockPage;

      const result = await repository.getPageByNotionId('notion-123');

      expect(result).toEqual(mockPage);
    });

    it('should return null when page not found', async () => {
      mockResponse.error = { code: 'PGRST116' };

      const result = await repository.getPageByNotionId('nonexistent');

      expect(result).toBeNull();
    });

    it('should handle generic page errors', async () => {
      mockResponse.error = { message: 'Connection failed' };

      await expect(repository.getPageByNotionId('test')).rejects.toThrow('Failed to get page: Connection failed');
      expect(console.error).toHaveBeenCalledWith('Error getting page:', expect.any(Object));
    });
  });

  describe('Bloques - Operaciones básicas', () => {
    it('should get hierarchical blocks using RPC', async () => {
      const mockHierarchicalBlocks = [
        {
          id: 'uuid-block-1',
          notion_id: 'block-1',
          page_id: 'page-123',
          type: 'paragraph',
          content: { text: 'Test content' },
          depth: 0,
          path_array: [0]
        }
      ];

      mockSupabaseClient.rpc.mockResolvedValue({ data: mockHierarchicalBlocks, error: null });

      const result = await repository.getPageBlocksHierarchical('page-123');

      expect(mockSupabaseClient.rpc).toHaveBeenCalledWith('get_hierarchical_blocks', { page_uuid: 'page-123' });
      expect(result).toEqual(mockHierarchicalBlocks);
    });

    it('should handle hierarchical blocks RPC errors', async () => {
      mockSupabaseClient.rpc.mockResolvedValue({ data: null, error: { message: 'RPC failed' } });

      await expect(repository.getPageBlocksHierarchical('page-123')).rejects.toThrow('Failed to get blocks: RPC failed');
      expect(console.error).toHaveBeenCalledWith('Error getting hierarchical blocks:', expect.any(Object));
    });
  });

  describe('Embeddings - Operaciones de vectores', () => {
    it('should search similar embeddings', async () => {
      const mockSimilarResults = [
        {
          id: 'embedding-1',
          block_id: 'block-1',
          page_id: 'page-123',
          embedding: [0.1, 0.2, 0.3],
          content_hash: 'hash1',
          chunk_index: 0,
          chunk_text: 'Similar content',
          metadata: {},
          created_at: '2024-01-01T00:00:00Z',
          similarity: 0.85
        }
      ];

      mockSupabaseClient.rpc.mockResolvedValue({ data: mockSimilarResults, error: null });

      const queryEmbedding = [0.1, 0.2, 0.3];
      const result = await repository.searchSimilarEmbeddings(queryEmbedding, 10, 0.7);

      expect(mockSupabaseClient.rpc).toHaveBeenCalledWith('match_embeddings', {
        query_embedding: queryEmbedding,
        match_threshold: 0.7,
        match_count: 10
      });
      expect(result).toEqual(mockSimilarResults);
    });

    it('should handle embedding search errors', async () => {
      mockSupabaseClient.rpc.mockResolvedValue({ data: null, error: { message: 'Vector search failed' } });

      await expect(repository.searchSimilarEmbeddings([0.1, 0.2], 10, 0.7)).rejects.toThrow('Failed to search embeddings: Vector search failed');
      expect(console.error).toHaveBeenCalledWith('Error searching embeddings:', expect.any(Object));
    });

    it('should return empty array when no similar embeddings found', async () => {
      mockSupabaseClient.rpc.mockResolvedValue({ data: null, error: null });

      const result = await repository.searchSimilarEmbeddings([0.1, 0.2, 0.3]);

      expect(result).toEqual([]);
    });
  });

  describe('Sincronización - Operaciones de logs', () => {
    it('should create sync log', async () => {
      const mockSyncLog = {
        id: 'sync-123',
        sync_type: 'full' as const,
        status: 'pending' as const,
        started_at: '2024-01-01T00:00:00Z',
        pages_processed: 0,
        blocks_processed: 0,
        embeddings_generated: 0,
        metadata: { test: 'data' }
      };

      mockResponse.data = mockSyncLog;

      const result = await repository.createSyncLog('full', { test: 'data' });

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('notion_sync_log');
      expect(result).toEqual(mockSyncLog);
    });

    it('should handle sync log creation errors', async () => {
      mockResponse.error = { message: 'Sync log error' };

      await expect(repository.createSyncLog('full')).rejects.toThrow('Failed to create sync log: Sync log error');
      expect(console.error).toHaveBeenCalledWith('Error creating sync log:', expect.any(Object));
    });
  });

  describe('Validación de mocks', () => {
    it('should have proper mocks configured', () => {
      expect(mockSupabaseClient.from).toBeDefined();
      expect(mockSupabaseClient.rpc).toBeDefined();
      expect(vi.isMockFunction(mockSupabaseClient.from)).toBe(true);
      expect(vi.isMockFunction(mockSupabaseClient.rpc)).toBe(true);
    });

    it('should reset mocks between tests', () => {
      const initialCallCount = mockSupabaseClient.from.mock.calls.length;
      repository.getPageByNotionId('test-id');
      expect(mockSupabaseClient.from.mock.calls.length).toBeGreaterThan(initialCallCount);
    });
  });

  describe('Parámetros por defecto', () => {
    it('should handle optional metadata in sync log', async () => {
      const mockSyncLog = {
        id: 'sync-456',
        sync_type: 'incremental' as const,
        status: 'pending' as const,
        started_at: '2024-01-01T00:00:00Z',
        pages_processed: 0,
        blocks_processed: 0,
        embeddings_generated: 0
      };

      mockResponse.data = mockSyncLog;

      const result = await repository.createSyncLog('incremental');

      expect(result).toEqual(mockSyncLog);
    });
  });
}); 