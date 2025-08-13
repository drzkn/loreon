import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NotionService } from '../NotionService';
import { Page, Block } from '@/domain/entities';

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

import { supabase } from '@/adapters/output/infrastructure/supabase/SupabaseClient';
import { NotionContentExtractor } from '../NotionContentExtractor';

describe('NotionService', () => {
  let service: NotionService;
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new NotionService();
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => { });
    vi.spyOn(console, 'error').mockImplementation(() => { });
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it('debería crear instancia del servicio correctamente', () => {
    expect(service).toBeInstanceOf(NotionService);
    expect(typeof service.processAndSavePage).toBe('function');
    expect(typeof service.processAndSavePages).toBe('function');
    expect(typeof service.getStoredPage).toBe('function');
    expect(typeof service.getAllStoredPages).toBe('function');
    expect(typeof service.searchStoredPages).toBe('function');
    expect(typeof service.deleteStoredPage).toBe('function');
    expect(typeof service.getPageWithBlocks).toBe('function');
  });

  it('debería procesar página individual básicamente', async () => {
    const mockPage = new Page(
      'page-123',
      {
        title: [{ plain_text: 'Test Page', text: { content: 'Test Page' } }]
      },
      '2023-01-01T00:00:00.000Z',
      '2023-01-01T00:00:00.000Z',
      'https://notion.so/page-123'
    );
    const mockBlocks = [new Block('block-1', 'paragraph', { rich_text: [{ plain_text: 'Test content' }] })];

    // Configurar mocks básicos
    vi.mocked(NotionContentExtractor.extractPageContent).mockReturnValue({
      fullText: 'Test content',
      htmlStructure: '<p>Test</p>',
      sections: [],
      contentHash: 'hash123',
      wordCount: 2,
      characterCount: 12
    });

    vi.mocked(NotionContentExtractor.generateTextChunks).mockReturnValue([]);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mockRepository = (service as any).repository;
    mockRepository.savePage.mockResolvedValue({ id: 'uuid-1', notion_id: 'page-123' });
    mockRepository.saveBlocks.mockResolvedValue([]);

    const result = await service.processAndSavePage(mockPage, mockBlocks);
    expect(result).toHaveProperty('id', 'uuid-1');
    expect(mockRepository.savePage).toHaveBeenCalled();
  });

  it('debería manejar errores en procesamiento', async () => {
    const mockPage = new Page(
      'page-error',
      {},
      undefined,
      undefined,
      'https://notion.so/page-error'
    );
    const mockBlocks: Block[] = [];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mockRepository = (service as any).repository;
    mockRepository.savePage.mockRejectedValue(new Error('Database error'));

    await expect(service.processAndSavePage(mockPage, mockBlocks))
      .rejects.toThrow('Database error');
  });

  it('debería procesar múltiples páginas con errores mixtos', async () => {
    const mockPages = [
      {
        page: new Page(
          'page-1',
          {},
          undefined,
          undefined,
          'https://notion.so/page-1'
        ),
        blocks: []
      },
      {
        page: new Page(
          'page-2',
          {},
          undefined,
          undefined,
          'https://notion.so/page-2'
        ),
        blocks: []
      }
    ];

    vi.mocked(NotionContentExtractor.extractPageContent).mockReturnValue({
      fullText: '',
      htmlStructure: '',
      sections: [],
      contentHash: 'hash',
      wordCount: 0,
      characterCount: 0
    });
    vi.mocked(NotionContentExtractor.generateTextChunks).mockReturnValue([]);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mockRepository = (service as any).repository;
    mockRepository.savePage
      .mockResolvedValueOnce({ id: 'uuid-1', notion_id: 'page-1' })
      .mockRejectedValueOnce(new Error('Save failed'));
    mockRepository.saveBlocks.mockResolvedValue([]);

    const results = await service.processAndSavePages(mockPages);
    expect(results).toHaveLength(1);
    expect(console.error).toHaveBeenCalled();
  });

  it('debería obtener página almacenada', async () => {
    const mockPage = { id: 'uuid-1', notion_id: 'page-123', title: 'Test' };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mockRepository = (service as any).repository;
    mockRepository.getPageByNotionId.mockResolvedValue(mockPage);

    const result = await service.getStoredPage('page-123');
    expect(result).toEqual(mockPage);
    expect(mockRepository.getPageByNotionId).toHaveBeenCalledWith('page-123');
  });

  it('debería obtener todas las páginas con paginación', async () => {
    const mockPages = [{ id: 'uuid-1', title: 'Page 1' }];
    const mockSupabaseChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      range: vi.fn().mockResolvedValue({ data: mockPages, error: null })
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(supabase.from).mockReturnValue(mockSupabaseChain as any);

    const result = await service.getAllStoredPages({ limit: 50, offset: 10 });
    expect(result).toEqual(mockPages);
    expect(mockSupabaseChain.range).toHaveBeenCalledWith(10, 59);
  });

  it('debería buscar páginas por texto', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mockRepository = (service as any).repository;
    const mockBlockResults = [{ id: 'block-1', page_id: 'uuid-1' }];
    const mockPageData = { id: 'uuid-1', title: 'Test Page' };

    mockRepository.searchBlocks.mockResolvedValue(mockBlockResults);

    const mockSupabaseChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: mockPageData, error: null })
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(supabase.from).mockReturnValue(mockSupabaseChain as any);

    const result = await service.searchStoredPages('test query');
    expect(result).toEqual([mockPageData]);
    expect(mockRepository.searchBlocks).toHaveBeenCalledWith('test query', 20);
  });

  it('debería buscar páginas con embeddings', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mockRepository = (service as any).repository;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mockEmbeddingsService = (service as any).embeddingsService;

    mockEmbeddingsService.generateEmbedding.mockResolvedValue([0.1, 0.2, 0.3]);
    mockRepository.searchSimilarEmbeddings.mockResolvedValue([
      { page_id: 'page-123', similarity: 0.85 }
    ]);
    mockRepository.getPageByNotionId.mockResolvedValue({
      id: 'uuid-page',
      title: 'Found Page'
    });

    const result = await service.searchStoredPages('vector query', {
      useEmbeddings: true,
      threshold: 0.8,
      limit: 5
    });

    expect(mockEmbeddingsService.generateEmbedding).toHaveBeenCalledWith('vector query');
    expect(mockRepository.searchSimilarEmbeddings).toHaveBeenCalledWith([0.1, 0.2, 0.3], 5, 0.8);
    expect(result[0]).toHaveProperty('similarity', 0.85);
  });

  it('debería obtener página con bloques y HTML', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mockRepository = (service as any).repository;
    const mockPage = { id: 'uuid-1', notion_id: 'page-123', title: 'Test' };
    const mockBlocks = [
      { id: 'uuid-block-1', html_content: '<p>Block 1</p>' },
      { id: 'uuid-block-2', html_content: '<p>Block 2</p>' }
    ];

    mockRepository.getPageByNotionId.mockResolvedValue(mockPage);
    mockRepository.getPageBlocksHierarchical.mockResolvedValue(mockBlocks);

    const result = await service.getPageWithBlocks('page-123');
    expect(result).toEqual({
      page: mockPage,
      blocks: mockBlocks,
      htmlContent: '<p>Block 1</p>\n<p>Block 2</p>'
    });

    // Página no encontrada
    mockRepository.getPageByNotionId.mockResolvedValue(null);
    const notFound = await service.getPageWithBlocks('nonexistent');
    expect(notFound).toBeNull();
  });

  it('debería eliminar página y manejar errores', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mockRepository = (service as any).repository;

    // Eliminación exitosa
    mockRepository.archivePages.mockResolvedValue(undefined);
    await service.deleteStoredPage('page-123');
    expect(mockRepository.archivePages).toHaveBeenCalledWith(['page-123']);

    // Error en getAllStoredPages
    const mockSupabaseChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      range: vi.fn().mockResolvedValue({ data: null, error: { message: 'DB Error' } })
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(supabase.from).mockReturnValue(mockSupabaseChain as any);

    await expect(service.getAllStoredPages()).rejects.toThrow('Error al obtener páginas: DB Error');
  });

  it('debería manejar casos edge: sin embeddings, títulos fallback', async () => {
    const mockPage = new Page(
      'page-no-title',
      {}, // Sin título
      undefined,
      undefined,
      'https://notion.so/page-no-title'
    );

    vi.mocked(NotionContentExtractor.extractPageContent).mockReturnValue({
      fullText: '',
      htmlStructure: '',
      sections: [],
      contentHash: 'empty',
      wordCount: 0,
      characterCount: 0
    });

    // Sin chunks para embeddings
    vi.mocked(NotionContentExtractor.generateTextChunks).mockReturnValue([]);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mockRepository = (service as any).repository;
    mockRepository.savePage.mockResolvedValue({
      id: 'uuid-1',
      notion_id: 'page-no-title',
      title: 'Sin título'
    });
    mockRepository.saveBlocks.mockResolvedValue([]);

    const result = await service.processAndSavePage(mockPage, []);
    expect(result.title).toBe('Sin título');
    expect(mockRepository.saveEmbeddings).not.toHaveBeenCalled();

    // Error en embeddings no debería fallar
    vi.mocked(NotionContentExtractor.generateTextChunks).mockReturnValue([
      { text: 'content', metadata: { chunkIndex: 0, section: '', blockIds: [], startOffset: 0, endOffset: 7 } }
    ]);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mockEmbeddingsService = (service as any).embeddingsService;
    mockEmbeddingsService.generateEmbeddings.mockRejectedValue(new Error('Embedding failed'));

    await expect(service.processAndSavePage(mockPage, [])).resolves.not.toThrow();
    expect(console.error).toHaveBeenCalledWith('Error generando embeddings:', expect.any(Error));
  });
}); 