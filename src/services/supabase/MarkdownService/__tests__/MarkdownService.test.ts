/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SupabaseMarkdownService } from '../MarkdownService';
import { SupabaseMarkdownRepository } from '../../../../adapters/output/infrastructure/supabase';
import { MarkdownConverterService } from '../../../markdownConverter';
import { Page } from '../../../../domain/entities';

// Usar el sistema centralizado de mocks
import {
  createTestSetup
} from '@/mocks';

// Mocks
vi.mock('../../../../adapters/output/infrastructure/supabase', () => ({
  SupabaseMarkdownRepository: vi.fn()
}));

vi.mock('../../../markdownConverter', () => ({
  MarkdownConverterService: vi.fn()
}));

describe('SupabaseMarkdownService', () => {
  let service: SupabaseMarkdownService;
  const { teardown } = createTestSetup(); // ✅ Console mocks centralizados

  let mockSupabaseRepository: {
    upsert: ReturnType<typeof vi.fn>;
    findByNotionPageId: ReturnType<typeof vi.fn>;
    findAll: ReturnType<typeof vi.fn>;
    search: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };
  let mockMarkdownConverter: {
    convertPageWithBlocksToMarkdown: ReturnType<typeof vi.fn>;
    convertPageToMarkdown: ReturnType<typeof vi.fn>;
  };

  const mockPage: Page = {
    id: 'page-123',
    url: 'https://notion.so/page-123',
    createdTime: '2023-01-01T00:00:00.000Z',
    lastEditedTime: '2023-01-01T12:00:00.000Z',
    properties: {
      title: {
        title: [{ plain_text: 'Test Page Title' }]
      },
      tags: {
        multi_select: [
          { name: 'tag1' },
          { name: 'tag2' }
        ]
      },
      status: {
        select: { name: 'Published' }
      }
    },
    toJSON: vi.fn().mockReturnValue({
      id: 'page-123',
      url: 'https://notion.so/page-123',
      createdTime: '2023-01-01T00:00:00.000Z',
      lastEditedTime: '2023-01-01T12:00:00.000Z',
      properties: {}
    })
  };

  const mockPageWithoutTitle: Page = {
    id: 'page-no-title',
    url: 'https://notion.so/page-no-title',
    createdTime: '2023-01-01T00:00:00.000Z',
    lastEditedTime: '2023-01-01T12:00:00.000Z',
    properties: {},
    toJSON: vi.fn().mockReturnValue({
      id: 'page-no-title',
      properties: {}
    })
  };

  const mockMarkdownPage = {
    id: 'stored-page-123',
    notion_page_id: 'page-123',
    title: 'Test Page Title',
    content: '# Test Page Title\n\nContent here',
    notion_url: 'https://notion.so/page-123',
    created_at: '2023-01-01T00:00:00.000Z',
    updated_at: '2023-01-01T12:00:00.000Z',
    notion_created_time: '2023-01-01T00:00:00.000Z',
    notion_last_edited_time: '2023-01-01T12:00:00.000Z',
    tags: ['tag1', 'tag2'],
    metadata: {
      page_properties: mockPage.properties,
      include_blocks: true,
      conversion_timestamp: '2023-01-01T12:00:00.000Z'
    }
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock methods para SupabaseMarkdownRepository
    mockSupabaseRepository = {
      upsert: vi.fn(),
      findByNotionPageId: vi.fn(),
      findAll: vi.fn(),
      search: vi.fn(),
      delete: vi.fn()
    };

    // Mock methods para MarkdownConverterService
    mockMarkdownConverter = {
      convertPageWithBlocksToMarkdown: vi.fn(),
      convertPageToMarkdown: vi.fn()
    };

    // Configurar constructores mockeados
    vi.mocked(SupabaseMarkdownRepository).mockImplementation(() => mockSupabaseRepository as any);
    vi.mocked(MarkdownConverterService).mockImplementation(() => mockMarkdownConverter as any);

    service = new SupabaseMarkdownService(
      mockSupabaseRepository as unknown as SupabaseMarkdownRepository,
      mockMarkdownConverter as unknown as MarkdownConverterService
    );

    // Configurar valores por defecto
    mockMarkdownConverter.convertPageWithBlocksToMarkdown.mockReturnValue('# Test Page Title\n\nContent here');
    mockMarkdownConverter.convertPageToMarkdown.mockReturnValue('# Test Page Title\n\nContent here');
    mockSupabaseRepository.upsert.mockResolvedValue(mockMarkdownPage);
  });

  afterEach(() => {
    teardown(); // ✅ Limpieza automática
  });

  describe('Constructor', () => {
    it('should create service instance with correct dependencies', () => {
      expect(service).toBeInstanceOf(SupabaseMarkdownService);
      // Los constructores no se llaman cuando pasamos instancias directas
      expect(service).toBeDefined();
    });
  });

  describe('convertAndSavePage', () => {
    it('should convert page with blocks and save successfully', async () => {
      const result = await service.convertAndSavePage(mockPage, true);

      expect(mockMarkdownConverter.convertPageWithBlocksToMarkdown).toHaveBeenCalledWith(mockPage, []);
      expect(mockSupabaseRepository.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          notion_page_id: mockPage.id,
          title: 'Test Page Title',
          content: '# Test Page Title\n\nContent here',
          notion_url: mockPage.url,
          notion_created_time: mockPage.createdTime,
          notion_last_edited_time: mockPage.lastEditedTime,
          tags: ['tag1', 'tag2', 'Published'],
          metadata: expect.objectContaining({
            page_properties: mockPage.properties,
            include_blocks: true
          })
        })
      );
      expect(result).toEqual(mockMarkdownPage);
    });

    it('should convert page without blocks when includeBlocks is false', async () => {
      const result = await service.convertAndSavePage(mockPage, false);

      expect(mockMarkdownConverter.convertPageToMarkdown).toHaveBeenCalledWith(mockPage);
      expect(mockMarkdownConverter.convertPageWithBlocksToMarkdown).not.toHaveBeenCalled();
      expect(mockSupabaseRepository.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: expect.objectContaining({
            include_blocks: false
          })
        })
      );
      expect(result).toEqual(mockMarkdownPage);
    });

    it('should handle page without title property', async () => {
      const result = await service.convertAndSavePage(mockPageWithoutTitle, true);

      expect(mockSupabaseRepository.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Sin título'
        })
      );
      expect(result).toEqual(mockMarkdownPage);
    });

    it('should handle page with null url and timestamps', async () => {
      const pageWithNulls = {
        ...mockPage,
        url: null,
        createdTime: undefined,
        lastEditedTime: undefined,
        toJSON: vi.fn().mockReturnValue({})
      };

      const result = await service.convertAndSavePage(pageWithNulls as any, true);

      expect(mockSupabaseRepository.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          notion_url: null,
          notion_created_time: null,
          notion_last_edited_time: null
        })
      );
      expect(result).toEqual(mockMarkdownPage);
    });

    it('should handle object markdown result', async () => {
      const objectResult = {
        content: '# Object Content',
        metadata: { type: 'object' }
      };
      mockMarkdownConverter.convertPageWithBlocksToMarkdown.mockReturnValue(objectResult);

      const result = await service.convertAndSavePage(mockPage, true);

      expect(mockSupabaseRepository.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          content: '# Object Content'
        })
      );
      expect(result).toEqual(mockMarkdownPage);
    });

    it('should handle complex tag extraction', async () => {
      const pageWithComplexTags = {
        ...mockPage,
        properties: {
          title: {
            title: [{ plain_text: 'Complex Tags Page' }]
          },
          categories: {
            multi_select: [
              { name: 'category1' },
              { name: 'category2' }
            ]
          },
          priority: {
            select: { name: 'High' }
          },
          status: {
            select: { name: 'In Progress' }
          }
        },
        toJSON: vi.fn().mockReturnValue({})
      };

      const result = await service.convertAndSavePage(pageWithComplexTags as any, true);

      expect(mockSupabaseRepository.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          tags: ['category1', 'category2', 'High', 'In Progress']
        })
      );
      expect(result).toEqual(mockMarkdownPage);
    });

    it('should handle markdown converter errors', async () => {
      mockMarkdownConverter.convertPageWithBlocksToMarkdown.mockImplementation(() => {
        throw new Error('Conversion failed');
      });

      await expect(service.convertAndSavePage(mockPage, true)).rejects.toThrow(
        'Error al convertir y guardar página page-123: Conversion failed'
      );
    });

    it('should handle repository upsert errors', async () => {
      mockSupabaseRepository.upsert.mockRejectedValue(new Error('Database error'));

      await expect(service.convertAndSavePage(mockPage, true)).rejects.toThrow(
        'Error al convertir y guardar página page-123: Database error'
      );
    });

    it('should handle non-Error objects in catch block', async () => {
      mockSupabaseRepository.upsert.mockRejectedValue('String error');

      await expect(service.convertAndSavePage(mockPage, true)).rejects.toThrow(
        'Error al convertir y guardar página page-123: Error desconocido'
      );
    });
  });

  describe('convertAndSavePages', () => {
    it('should convert and save multiple pages successfully', async () => {
      const pages = [mockPage, { ...mockPage, id: 'page-456', toJSON: vi.fn().mockReturnValue({}) }];
      mockSupabaseRepository.upsert.mockResolvedValue(mockMarkdownPage);

      const results = await service.convertAndSavePages(pages as any, true);

      expect(mockMarkdownConverter.convertPageWithBlocksToMarkdown).toHaveBeenCalledTimes(2);
      expect(mockSupabaseRepository.upsert).toHaveBeenCalledTimes(2);
      expect(results).toHaveLength(2);
      expect(results[0]).toEqual(mockMarkdownPage);
      expect(results[1]).toEqual(mockMarkdownPage);
    });

    it('should handle mixed success and failure scenarios', async () => {
      const pages = [mockPage, { ...mockPage, id: 'page-fail', toJSON: vi.fn().mockReturnValue({}) }];
      mockSupabaseRepository.upsert
        .mockResolvedValueOnce(mockMarkdownPage)
        .mockRejectedValueOnce(new Error('Database error'));

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => { });

      const results = await service.convertAndSavePages(pages as any, true);

      expect(results).toHaveLength(1);
      expect(results[0]).toEqual(mockMarkdownPage);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error procesando página page-fail:',
        expect.any(Error)
      );
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Se encontraron 1 errores durante el procesamiento:',
        ['Página page-fail: Error al convertir y guardar página page-fail: Database error']
      );

      consoleErrorSpy.mockRestore();
      consoleWarnSpy.mockRestore();
    });

    it('should handle all pages failing', async () => {
      const pages = [mockPage, { ...mockPage, id: 'page-456', toJSON: vi.fn().mockReturnValue({}) }];
      mockSupabaseRepository.upsert.mockRejectedValue(new Error('Database error'));

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => { });

      const results = await service.convertAndSavePages(pages as any, true);

      expect(results).toHaveLength(0);
      expect(consoleErrorSpy).toHaveBeenCalledTimes(2);
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Se encontraron 2 errores durante el procesamiento:',
        expect.arrayContaining([
          expect.stringContaining('Página page-123:'),
          expect.stringContaining('Página page-456:')
        ])
      );

      consoleErrorSpy.mockRestore();
      consoleWarnSpy.mockRestore();
    });

    it('should handle empty pages array', async () => {
      const results = await service.convertAndSavePages([], true);

      expect(results).toHaveLength(0);
      expect(mockMarkdownConverter.convertPageWithBlocksToMarkdown).not.toHaveBeenCalled();
      expect(mockSupabaseRepository.upsert).not.toHaveBeenCalled();
    });

    it('should handle non-Error objects in batch processing', async () => {
      const pages = [mockPage];
      mockSupabaseRepository.upsert.mockRejectedValue('String error');

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => { });

      const results = await service.convertAndSavePages(pages, true);

      expect(results).toHaveLength(0);
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Se encontraron 1 errores durante el procesamiento:',
        ['Página page-123: Error al convertir y guardar página page-123: Error desconocido']
      );

      consoleErrorSpy.mockRestore();
      consoleWarnSpy.mockRestore();
    });
  });

  describe('getStoredPage', () => {
    it('should retrieve stored page successfully', async () => {
      mockSupabaseRepository.findByNotionPageId.mockResolvedValue(mockMarkdownPage);

      const result = await service.getStoredPage('page-123');

      expect(mockSupabaseRepository.findByNotionPageId).toHaveBeenCalledWith('page-123');
      expect(result).toEqual(mockMarkdownPage);
    });

    it('should return null when page not found', async () => {
      mockSupabaseRepository.findByNotionPageId.mockResolvedValue(null);

      const result = await service.getStoredPage('nonexistent-page');

      expect(mockSupabaseRepository.findByNotionPageId).toHaveBeenCalledWith('nonexistent-page');
      expect(result).toBeNull();
    });

    it('should handle repository errors', async () => {
      mockSupabaseRepository.findByNotionPageId.mockRejectedValue(new Error('Database error'));

      await expect(service.getStoredPage('page-123')).rejects.toThrow('Database error');
    });
  });

  describe('getAllStoredPages', () => {
    it('should retrieve all stored pages without options', async () => {
      const mockPages = [mockMarkdownPage, { ...mockMarkdownPage, id: 'page-456' }];
      mockSupabaseRepository.findAll.mockResolvedValue(mockPages);

      const result = await service.getAllStoredPages();

      expect(mockSupabaseRepository.findAll).toHaveBeenCalledWith(undefined);
      expect(result).toEqual(mockPages);
    });

    it('should retrieve all stored pages with options', async () => {
      const options = {
        limit: 10,
        offset: 0,
        orderBy: 'created_at',
        orderDirection: 'desc' as const
      };
      const mockPages = [mockMarkdownPage];
      mockSupabaseRepository.findAll.mockResolvedValue(mockPages);

      const result = await service.getAllStoredPages(options);

      expect(mockSupabaseRepository.findAll).toHaveBeenCalledWith(options);
      expect(result).toEqual(mockPages);
    });

    it('should handle empty results', async () => {
      mockSupabaseRepository.findAll.mockResolvedValue([]);

      const result = await service.getAllStoredPages();

      expect(result).toEqual([]);
    });

    it('should handle repository errors', async () => {
      mockSupabaseRepository.findAll.mockRejectedValue(new Error('Database error'));

      await expect(service.getAllStoredPages()).rejects.toThrow('Database error');
    });
  });

  describe('searchStoredPages', () => {
    it('should search stored pages successfully', async () => {
      const mockPages = [mockMarkdownPage];
      mockSupabaseRepository.search.mockResolvedValue(mockPages);

      const result = await service.searchStoredPages('test query');

      expect(mockSupabaseRepository.search).toHaveBeenCalledWith('test query', undefined);
      expect(result).toEqual(mockPages);
    });

    it('should search stored pages with options', async () => {
      const options = { limit: 5, offset: 10 };
      const mockPages = [mockMarkdownPage];
      mockSupabaseRepository.search.mockResolvedValue(mockPages);

      const result = await service.searchStoredPages('test query', options);

      expect(mockSupabaseRepository.search).toHaveBeenCalledWith('test query', options);
      expect(result).toEqual(mockPages);
    });

    it('should handle empty search results', async () => {
      mockSupabaseRepository.search.mockResolvedValue([]);

      const result = await service.searchStoredPages('nonexistent query');

      expect(result).toEqual([]);
    });

    it('should handle repository errors', async () => {
      mockSupabaseRepository.search.mockRejectedValue(new Error('Search error'));

      await expect(service.searchStoredPages('test query')).rejects.toThrow('Search error');
    });
  });

  describe('syncPage', () => {
    it('should throw error for unimplemented method', async () => {
      await expect(service.syncPage()).rejects.toThrow(
        'syncPage requiere implementación con repositorio de Notion'
      );
    });
  });

  describe('deleteStoredPage', () => {
    it('should delete stored page successfully', async () => {
      mockSupabaseRepository.delete.mockResolvedValue(undefined);

      await service.deleteStoredPage('page-123');

      expect(mockSupabaseRepository.delete).toHaveBeenCalledWith('page-123');
    });

    it('should handle repository errors', async () => {
      mockSupabaseRepository.delete.mockRejectedValue(new Error('Delete error'));

      await expect(service.deleteStoredPage('page-123')).rejects.toThrow('Delete error');
    });
  });

  describe('Edge Cases and Data Validation', () => {
    it('should handle page with empty properties', async () => {
      const emptyPage = {
        ...mockPage,
        properties: null,
        toJSON: vi.fn().mockReturnValue({})
      };

      const result = await service.convertAndSavePage(emptyPage as any, true);

      expect(mockSupabaseRepository.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          tags: [],
          title: 'Sin título'
        })
      );
      expect(result).toEqual(mockMarkdownPage);
    });

    it('should handle page with malformed tag properties', async () => {
      const pageWithMalformedTags = {
        ...mockPage,
        properties: {
          title: {
            title: [{ plain_text: 'Title' }]
          },
          malformed_multi_select: {
            multi_select: [
              { name: 'good_tag' },
              { /* missing name */ }
            ]
          },
          malformed_select: {
            select: { /* missing name */ }
          },
          not_a_tag: {
            type: 'number',
            number: 42
          }
        },
        toJSON: vi.fn().mockReturnValue({})
      };

      const result = await service.convertAndSavePage(pageWithMalformedTags as any, true);

      expect(mockSupabaseRepository.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          tags: ['good_tag'] // Solo extrae tags válidos
        })
      );
      expect(result).toEqual(mockMarkdownPage);
    });

    it('should handle page with complex title structure', async () => {
      const pageWithComplexTitle = {
        ...mockPage,
        properties: {
          title: {
            title: [
              { plain_text: 'Part 1 ' },
              { plain_text: 'Part 2 ' },
              { plain_text: 'Part 3' }
            ]
          }
        },
        toJSON: vi.fn().mockReturnValue({})
      };

      const result = await service.convertAndSavePage(pageWithComplexTitle as any, true);

      expect(mockSupabaseRepository.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Part 1 Part 2 Part 3'
        })
      );
      expect(result).toEqual(mockMarkdownPage);
    });

    it('should handle page with empty title array', async () => {
      const pageWithEmptyTitle = {
        ...mockPage,
        properties: {
          title: {
            title: []
          }
        },
        toJSON: vi.fn().mockReturnValue({})
      };

      const result = await service.convertAndSavePage(pageWithEmptyTitle as any, true);

      expect(mockSupabaseRepository.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Sin título'
        })
      );
      expect(result).toEqual(mockMarkdownPage);
    });

    it('should handle page with title containing only whitespace', async () => {
      const pageWithWhitespaceTitle = {
        ...mockPage,
        properties: {
          title: {
            title: [
              { plain_text: '   ' },
              { plain_text: '\t\n' }
            ]
          }
        },
        toJSON: vi.fn().mockReturnValue({})
      };

      const result = await service.convertAndSavePage(pageWithWhitespaceTitle as any, true);

      expect(mockSupabaseRepository.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Sin título'
        })
      );
      expect(result).toEqual(mockMarkdownPage);
    });

    it('should handle page with undefined properties', async () => {
      const pageWithUndefinedProps = {
        ...mockPage,
        properties: undefined,
        toJSON: vi.fn().mockReturnValue({})
      };

      const result = await service.convertAndSavePage(pageWithUndefinedProps as any, true);

      expect(mockSupabaseRepository.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          tags: [],
          title: 'Sin título'
        })
      );
      expect(result).toEqual(mockMarkdownPage);
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle large batch processing', async () => {
      const largePagesBatch = Array.from({ length: 100 }, (_, i) => ({
        ...mockPage,
        id: `page-${i}`,
        properties: {
          title: {
            title: [{ plain_text: `Page ${i}` }]
          }
        },
        toJSON: vi.fn().mockReturnValue({})
      }));

      mockSupabaseRepository.upsert.mockResolvedValue(mockMarkdownPage);

      const results = await service.convertAndSavePages(largePagesBatch as any, true);

      expect(results).toHaveLength(100);
      expect(mockMarkdownConverter.convertPageWithBlocksToMarkdown).toHaveBeenCalledTimes(100);
      expect(mockSupabaseRepository.upsert).toHaveBeenCalledTimes(100);
    });

    it('should handle concurrent operations gracefully', async () => {
      // Configurar mocks antes de crear las promises
      mockSupabaseRepository.upsert.mockResolvedValue(mockMarkdownPage);
      mockSupabaseRepository.findByNotionPageId.mockResolvedValue(mockMarkdownPage);
      mockSupabaseRepository.delete.mockResolvedValue(undefined);

      const promises = [
        service.convertAndSavePage(mockPage, true),
        service.getStoredPage('page-123'),
        service.deleteStoredPage('page-456')
      ];

      const results = await Promise.all(promises);

      expect(results[0]).toEqual(mockMarkdownPage);
      expect(results[1]).toEqual(mockMarkdownPage);
      expect(results[2]).toBeUndefined();
    });
  });
});
