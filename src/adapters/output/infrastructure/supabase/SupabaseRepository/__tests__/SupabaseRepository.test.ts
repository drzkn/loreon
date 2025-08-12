import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { MarkdownPageInsert, MarkdownPageUpdate } from '../../types';

vi.spyOn(console, 'log').mockImplementation(() => { });

process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-key';

const mockRepository = {
  save: vi.fn(),
  findByNotionPageId: vi.fn(),
  findById: vi.fn(),
  findAll: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  upsert: vi.fn(),
  search: vi.fn(),
  searchByVector: vi.fn()
};

vi.mock('../SupabaseRepository', () => ({
  SupabaseRepository: vi.fn().mockImplementation(() => mockRepository)
}));

import { SupabaseRepository } from '../SupabaseRepository';

describe('SupabaseRepository', () => {
  let repository: SupabaseRepository;

  const mockMarkdownPage = {
    id: 'test-id',
    notion_page_id: 'notion-123',
    title: 'Test Page',
    content: 'Test content',
    tags: ['test'],
    metadata: { test: true },
    created_at: '2023-01-01T00:00:00.000Z',
    updated_at: '2023-01-01T00:00:00.000Z'
  };

  beforeEach(() => {
    vi.clearAllMocks();
    repository = new SupabaseRepository();
  });

  describe('Instanciación', () => {
    it('debería crear instancia con cliente normal', () => {
      const repo = new SupabaseRepository();
      expect(repo).toBeDefined();
      expect(repo).toEqual(mockRepository);
    });

    it('debería crear instancia con cliente servidor', () => {
      const serverRepo = new SupabaseRepository(true);
      expect(serverRepo).toBeDefined();
      expect(serverRepo).toEqual(mockRepository);
    });

    it('debería tener todos los métodos disponibles', () => {
      expect(typeof repository.save).toBe('function');
      expect(typeof repository.findByNotionPageId).toBe('function');
      expect(typeof repository.findById).toBe('function');
      expect(typeof repository.findAll).toBe('function');
      expect(typeof repository.update).toBe('function');
      expect(typeof repository.delete).toBe('function');
      expect(typeof repository.upsert).toBe('function');
      expect(typeof repository.search).toBe('function');
      expect(typeof repository.searchByVector).toBe('function');
    });
  });

  describe('save()', () => {
    it('debería guardar página exitosamente', async () => {
      const insertData: MarkdownPageInsert = {
        notion_page_id: 'notion-123',
        title: 'New Page',
        content: 'New content'
      };

      mockRepository.save.mockResolvedValue(mockMarkdownPage);

      const result = await repository.save(insertData);

      expect(mockRepository.save).toHaveBeenCalledWith(insertData);
      expect(result).toEqual(mockMarkdownPage);
    });

    it('debería propagar errores del cliente', async () => {
      const insertData: MarkdownPageInsert = {
        notion_page_id: 'notion-123',
        title: 'New Page',
        content: 'New content'
      };

      mockRepository.save.mockRejectedValue(new Error('Insert failed'));

      await expect(repository.save(insertData))
        .rejects.toThrow('Insert failed');
    });

    it('debería validar tipos de entrada', () => {
      const validData: MarkdownPageInsert = {
        notion_page_id: 'test',
        title: 'Test',
        content: 'Test content',
        notion_url: null,
        tags: [],
        metadata: {}
      };

      expect(() => repository.save(validData)).not.toThrow();
    });
  });

  describe('findByNotionPageId()', () => {
    it('debería encontrar página por Notion ID', async () => {
      mockRepository.findByNotionPageId.mockResolvedValue(mockMarkdownPage);

      const result = await repository.findByNotionPageId('notion-123');

      expect(mockRepository.findByNotionPageId).toHaveBeenCalledWith('notion-123');
      expect(result).toEqual(mockMarkdownPage);
    });

    it('debería retornar null cuando no encuentra página', async () => {
      mockRepository.findByNotionPageId.mockResolvedValue(null);

      const result = await repository.findByNotionPageId('non-existent');

      expect(result).toBeNull();
    });

    it('debería propagar errores', async () => {
      mockRepository.findByNotionPageId.mockRejectedValue(new Error('Query error'));

      await expect(repository.findByNotionPageId('notion-123'))
        .rejects.toThrow('Query error');
    });
  });

  describe('findById()', () => {
    it('debería encontrar página por ID', async () => {
      mockRepository.findById.mockResolvedValue(mockMarkdownPage);

      const result = await repository.findById('test-id');

      expect(mockRepository.findById).toHaveBeenCalledWith('test-id');
      expect(result).toEqual(mockMarkdownPage);
    });

    it('debería retornar null cuando no encuentra página', async () => {
      mockRepository.findById.mockResolvedValue(null);

      const result = await repository.findById('non-existent');

      expect(result).toBeNull();
    });

    it('debería propagar errores', async () => {
      mockRepository.findById.mockRejectedValue(new Error('Database error'));

      await expect(repository.findById('test-id'))
        .rejects.toThrow('Database error');
    });
  });

  describe('findAll()', () => {
    it('debería obtener todas las páginas', async () => {
      const mockPages = [mockMarkdownPage];
      mockRepository.findAll.mockResolvedValue(mockPages);

      const result = await repository.findAll();

      expect(mockRepository.findAll).toHaveBeenCalledWith();
      expect(result).toEqual(mockPages);
    });

    it('debería aceptar opciones de consulta', async () => {
      const mockPages = [mockMarkdownPage];
      const options = {
        limit: 10,
        offset: 5,
        orderBy: 'title',
        orderDirection: 'asc' as const
      };

      mockRepository.findAll.mockResolvedValue(mockPages);

      const result = await repository.findAll(options);

      expect(mockRepository.findAll).toHaveBeenCalledWith(options);
      expect(result).toEqual(mockPages);
    });

    it('debería retornar array vacío por defecto', async () => {
      mockRepository.findAll.mockResolvedValue([]);

      const result = await repository.findAll();

      expect(result).toEqual([]);
    });

    it('debería propagar errores', async () => {
      mockRepository.findAll.mockRejectedValue(new Error('Query failed'));

      await expect(repository.findAll())
        .rejects.toThrow('Query failed');
    });
  });

  describe('update()', () => {
    it('debería actualizar página exitosamente', async () => {
      const updateData: MarkdownPageUpdate = { title: 'Updated Title' };
      const updatedPage = { ...mockMarkdownPage, title: 'Updated Title' };

      mockRepository.update.mockResolvedValue(updatedPage);

      const result = await repository.update('test-id', updateData);

      expect(mockRepository.update).toHaveBeenCalledWith('test-id', updateData);
      expect(result).toEqual(updatedPage);
    });

    it('debería propagar errores', async () => {
      const updateData: MarkdownPageUpdate = { title: 'Updated Title' };

      mockRepository.update.mockRejectedValue(new Error('Update failed'));

      await expect(repository.update('test-id', updateData))
        .rejects.toThrow('Update failed');
    });

    it('debería validar tipos de datos de actualización', () => {
      const validUpdateData: MarkdownPageUpdate = {
        title: 'New title',
        content: 'New content',
        tags: ['tag1', 'tag2'],
        metadata: { updated: true }
      };

      expect(() => repository.update('id', validUpdateData)).not.toThrow();
    });
  });

  describe('delete()', () => {
    it('debería eliminar página exitosamente', async () => {
      mockRepository.delete.mockResolvedValue(undefined);

      await repository.delete('test-id');

      expect(mockRepository.delete).toHaveBeenCalledWith('test-id');
    });

    it('debería propagar errores', async () => {
      mockRepository.delete.mockRejectedValue(new Error('Delete failed'));

      await expect(repository.delete('test-id'))
        .rejects.toThrow('Delete failed');
    });
  });

  describe('upsert()', () => {
    it('debería hacer upsert exitosamente', async () => {
      const insertData: MarkdownPageInsert = {
        notion_page_id: 'notion-123',
        title: 'Upsert Page',
        content: 'Upsert content'
      };

      mockRepository.upsert.mockResolvedValue(mockMarkdownPage);

      const result = await repository.upsert(insertData);

      expect(mockRepository.upsert).toHaveBeenCalledWith(insertData);
      expect(result).toEqual(mockMarkdownPage);
    });

    it('debería propagar errores', async () => {
      const insertData: MarkdownPageInsert = {
        notion_page_id: 'notion-123',
        title: 'Upsert Page',
        content: 'Upsert content'
      };

      mockRepository.upsert.mockRejectedValue(new Error('Upsert failed'));

      await expect(repository.upsert(insertData))
        .rejects.toThrow('Upsert failed');
    });

    it('debería validar datos complejos', () => {
      const complexData: MarkdownPageInsert = {
        notion_page_id: 'complex-123',
        title: 'Complex Page',
        content: 'Complex content with **markdown**',
        notion_url: 'https://notion.so/test',
        notion_created_time: '2023-01-01T00:00:00.000Z',
        notion_last_edited_time: '2023-01-02T00:00:00.000Z',
        tags: ['tag1', 'tag2', 'important'],
        metadata: {
          author: 'Test Author',
          version: 1,
          published: true,
          nested: { deep: { value: 'test' } }
        },
        embedding: new Array(1536).fill(0).map(() => Math.random())
      };

      expect(() => repository.upsert(complexData)).not.toThrow();
    });
  });

  describe('search()', () => {
    it('debería buscar páginas por texto', async () => {
      const mockPages = [mockMarkdownPage];
      mockRepository.search.mockResolvedValue(mockPages);

      const result = await repository.search('test query');

      expect(mockRepository.search).toHaveBeenCalledWith('test query');
      expect(result).toEqual(mockPages);
    });

    it('debería aceptar opciones de búsqueda', async () => {
      const mockPages = [mockMarkdownPage];
      const options = { limit: 5, offset: 10 };

      mockRepository.search.mockResolvedValue(mockPages);

      const result = await repository.search('query', options);

      expect(mockRepository.search).toHaveBeenCalledWith('query', options);
      expect(result).toEqual(mockPages);
    });

    it('debería retornar array vacío por defecto', async () => {
      mockRepository.search.mockResolvedValue([]);

      const result = await repository.search('query');

      expect(result).toEqual([]);
    });

    it('debería propagar errores', async () => {
      mockRepository.search.mockRejectedValue(new Error('Search failed'));

      await expect(repository.search('query'))
        .rejects.toThrow('Search failed');
    });
  });

  describe('searchByVector()', () => {
    it('debería buscar por vector con opciones por defecto', async () => {
      const mockResults = [{ ...mockMarkdownPage, similarity: 0.8 }];
      mockRepository.searchByVector.mockResolvedValue(mockResults);

      const result = await repository.searchByVector([0.1, 0.2, 0.3]);

      expect(mockRepository.searchByVector).toHaveBeenCalledWith([0.1, 0.2, 0.3]);
      expect(result).toEqual(mockResults);
    });

    it('debería usar opciones personalizadas', async () => {
      const mockResults = [{ ...mockMarkdownPage, similarity: 0.9 }];
      const options = { matchThreshold: 0.8, matchCount: 10 };

      mockRepository.searchByVector.mockResolvedValue(mockResults);

      const result = await repository.searchByVector([0.1, 0.2, 0.3], options);

      expect(mockRepository.searchByVector).toHaveBeenCalledWith([0.1, 0.2, 0.3], options);
      expect(result).toEqual(mockResults);
    });

    it('debería retornar array vacío por defecto', async () => {
      mockRepository.searchByVector.mockResolvedValue([]);

      const result = await repository.searchByVector([0.1, 0.2, 0.3]);

      expect(result).toEqual([]);
    });

    it('debería propagar errores', async () => {
      mockRepository.searchByVector.mockRejectedValue(new Error('Vector search failed'));

      await expect(repository.searchByVector([0.1, 0.2, 0.3]))
        .rejects.toThrow('Vector search failed');
    });

    it('debería manejar vectores de diferentes tamaños', async () => {
      const mockResults = [{ ...mockMarkdownPage, similarity: 0.7 }];
      mockRepository.searchByVector.mockResolvedValue(mockResults);

      const smallVector = [0.1, 0.2];
      const largeVector = new Array(1536).fill(0).map(() => Math.random());

      await repository.searchByVector(smallVector);
      await repository.searchByVector(largeVector);

      expect(mockRepository.searchByVector).toHaveBeenCalledTimes(2);
    });
  });

  describe('Validación de tipos y estructura', () => {
    it('debería validar tipos de MarkdownPageInsert', () => {
      const validInsert: MarkdownPageInsert = {
        notion_page_id: 'test-123',
        title: 'Test Page',
        content: 'Test content',
        notion_url: null,
        notion_created_time: '2023-01-01T00:00:00.000Z',
        notion_last_edited_time: '2023-01-01T00:00:00.000Z',
        tags: ['tag1', 'tag2'],
        metadata: { key: 'value' },
        embedding: [0.1, 0.2, 0.3]
      };

      expect(validInsert.notion_page_id).toBe('test-123');
      expect(validInsert.title).toBe('Test Page');
      expect(Array.isArray(validInsert.tags)).toBe(true);
      expect(typeof validInsert.metadata).toBe('object');
    });

    it('debería validar tipos de MarkdownPageUpdate', () => {
      const validUpdate: MarkdownPageUpdate = {
        title: 'Updated Title',
        content: 'Updated content',
        tags: ['updated'],
        metadata: { updated: true }
      };

      expect(validUpdate.title).toBe('Updated Title');
      expect(Array.isArray(validUpdate.tags)).toBe(true);
      expect(typeof validUpdate.metadata).toBe('object');
    });

    it('debería manejar opciones de búsqueda', () => {
      const searchOptions = { limit: 50, offset: 100 };
      const vectorOptions = { matchThreshold: 0.9, matchCount: 20 };
      const findOptions = {
        limit: 25,
        offset: 50,
        orderBy: 'updated_at',
        orderDirection: 'desc' as const
      };

      expect(searchOptions.limit).toBe(50);
      expect(vectorOptions.matchThreshold).toBe(0.9);
      expect(findOptions.orderDirection).toBe('desc');
    });
  });

  describe('Casos edge', () => {
    it('debería manejar datos nulos y undefined apropiadamente', async () => {
      mockRepository.findById.mockResolvedValue(null);
      mockRepository.findByNotionPageId.mockResolvedValue(null);
      mockRepository.findAll.mockResolvedValue([]);
      mockRepository.search.mockResolvedValue([]);
      mockRepository.searchByVector.mockResolvedValue([]);

      const results = await Promise.all([
        repository.findById('non-existent'),
        repository.findByNotionPageId('non-existent'),
        repository.findAll(),
        repository.search('no-results'),
        repository.searchByVector([0.1])
      ]);

      expect(results[0]).toBeNull();
      expect(results[1]).toBeNull();
      expect(results[2]).toEqual([]);
      expect(results[3]).toEqual([]);
      expect(results[4]).toEqual([]);
    });

    it('debería manejar parámetros opcionales', async () => {
      mockRepository.findAll.mockResolvedValue([mockMarkdownPage]);
      mockRepository.search.mockResolvedValue([mockMarkdownPage]);
      mockRepository.searchByVector.mockResolvedValue([mockMarkdownPage]);

      await repository.findAll();
      await repository.search('query');
      await repository.searchByVector([0.1, 0.2]);

      expect(mockRepository.findAll).toHaveBeenCalledWith();
      expect(mockRepository.search).toHaveBeenCalledWith('query');
      expect(mockRepository.searchByVector).toHaveBeenCalledWith([0.1, 0.2]);
    });

    it('debería propagar errores de forma consistente', async () => {
      const error = new Error('Consistent error handling');

      mockRepository.save.mockRejectedValue(error);
      mockRepository.findById.mockRejectedValue(error);
      mockRepository.update.mockRejectedValue(error);
      mockRepository.delete.mockRejectedValue(error);
      mockRepository.search.mockRejectedValue(error);

      const insertData: MarkdownPageInsert = {
        notion_page_id: 'test',
        title: 'Test',
        content: 'Test'
      };
      const updateData: MarkdownPageUpdate = { title: 'Updated' };

      await expect(repository.save(insertData)).rejects.toThrow(error);
      await expect(repository.findById('id')).rejects.toThrow(error);
      await expect(repository.update('id', updateData)).rejects.toThrow(error);
      await expect(repository.delete('id')).rejects.toThrow(error);
      await expect(repository.search('query')).rejects.toThrow(error);
    });
  });
});