import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NotionNativeRepository } from '../NotionNativeRepository';

// Usar el sistema centralizado de mocks
import {
  createTestSetup
} from '@/mocks';

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

describe('NotionNativeRepository - Simplified Tests', () => {
  let repository: NotionNativeRepository;
  let mockSupabaseClient: MockSupabaseClient;
  let mockResponse: { data: unknown; error: unknown };
  const { teardown } = createTestSetup();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'warn').mockImplementation(() => { });

    mockResponse = { data: null, error: null };

    mockSupabaseClient = {
      from: vi.fn(() => createMockChain(mockResponse)),
      rpc: vi.fn().mockResolvedValue(mockResponse)
    };

    repository = new NotionNativeRepository(mockSupabaseClient as unknown as import('@supabase/supabase-js').SupabaseClient);
  });

  afterEach(() => {
    teardown();
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
        updated_at: '2024-01-02T00:00:00Z'
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
    });

    it('should get page by notion ID', async () => {
      const mockPage = {
        id: 'uuid-123',
        notion_id: 'notion-123',
        title: 'Test Page'
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


  });

  describe('Bloques - Operaciones básicas', () => {




    it('should get hierarchical blocks using RPC', async () => {
      const mockHierarchicalBlocks = [
        {
          id: 'uuid-block-1',
          notion_id: 'block-1',
          depth: 0,
          path_array: [0]
        }
      ];

      mockSupabaseClient.rpc.mockResolvedValue({ data: mockHierarchicalBlocks, error: null });

      const result = await repository.getPageBlocksHierarchical('page-123');

      expect(mockSupabaseClient.rpc).toHaveBeenCalledWith('get_hierarchical_blocks', { page_uuid: 'page-123' });
      expect(result).toEqual(mockHierarchicalBlocks);
    });


  });

  describe('Embeddings - Operaciones básicas', () => {


    it('should search similar embeddings', async () => {
      const mockSimilarResults = [
        {
          id: 'embedding-1',
          block_id: 'block-1',
          page_id: 'page-123',
          similarity: 0.85,
          chunk_text: 'Similar content',
          metadata: {}
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



    it('should search by vector and format results', async () => {
      // Mock para searchSimilarEmbeddings
      const mockSimilarResults = [
        {
          id: 'embedding-1',
          block_id: 'block-1',
          page_id: 'page-123',
          similarity: 0.9,
          chunk_text: 'Relevant content',
          metadata: { section: 'Introduction' },
          embedding: [0.1, 0.2, 0.3],
          content_hash: 'hash1',
          chunk_index: 0,
          created_at: '2024-01-01T00:00:00Z'
        }
      ];

      // Mock para la búsqueda de página
      const mockPageChain = createMockChain({
        data: {
          id: 'page-123',
          title: 'Test Page',
          url: 'https://notion.so/test',
          archived: false
        },
        error: null
      });

      // Spy en el método searchSimilarEmbeddings
      vi.spyOn(repository, 'searchSimilarEmbeddings').mockResolvedValue(mockSimilarResults);

      // Setup mock para when .eq('id', embedding.page_id).single() es llamado
      mockSupabaseClient.from.mockReturnValue(mockPageChain);

      const result = await repository.searchByVector([0.1, 0.2, 0.3], {
        matchThreshold: 0.8,
        matchCount: 5
      });

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(
        expect.objectContaining({
          id: 'page-123',
          title: 'Test Page',
          similarity: 0.9,
          notion_url: 'https://notion.so/test'
        })
      );
    });
  });

  describe('Sincronización - Operaciones básicas', () => {
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

      expect(result).toEqual(mockSyncLog);
    });




  });

  describe('Error Handling', () => {
    it('should handle generic database errors', async () => {
      mockResponse.error = { message: 'Connection failed' };

      await expect(repository.getPageByNotionId('test')).rejects.toThrow('Failed to get page: Connection failed');
    });

    it('should handle RPC function errors', async () => {
      mockSupabaseClient.rpc.mockResolvedValue({ data: null, error: { message: 'RPC failed' } });

      await expect(repository.getPageBlocksHierarchical('page-123')).rejects.toThrow('Failed to get blocks: RPC failed');
    });

    it('should handle vector search errors', async () => {
      mockSupabaseClient.rpc.mockResolvedValue({ data: null, error: { message: 'Vector search failed' } });

      await expect(repository.searchSimilarEmbeddings([0.1, 0.2], 10, 0.7)).rejects.toThrow('Failed to search embeddings: Vector search failed');
    });
  });

  describe('Edge Cases', () => {


    it('should handle archived pages in vector search', async () => {
      const mockSimilarResults = [
        {
          id: 'emb-1',
          page_id: 'page-1',
          similarity: 0.9,
          chunk_text: 'content',
          metadata: {},
          block_id: 'block-1',
          embedding: [0.1, 0.2, 0.3],
          content_hash: 'hash1',
          chunk_index: 0,
          created_at: '2024-01-01T00:00:00Z'
        }
      ];

      const mockArchivedPageChain = createMockChain({
        data: { id: 'page-1', title: 'Archived Page', archived: true },
        error: null
      });

      vi.spyOn(repository, 'searchSimilarEmbeddings').mockResolvedValue(mockSimilarResults);
      mockSupabaseClient.from.mockReturnValue(mockArchivedPageChain);

      const result = await repository.searchByVector([0.1, 0.2, 0.3]);

      expect(result).toEqual([]);
    });


  });
});
