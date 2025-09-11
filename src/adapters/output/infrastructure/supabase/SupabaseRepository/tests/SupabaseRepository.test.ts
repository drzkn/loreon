import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { MarkdownPageInsert, MarkdownPageUpdate } from '../../types';

process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-key';

// Mock de los clientes de Supabase - debe estar antes de las importaciones
vi.mock('../../index', () => ({
  supabase: {
    from: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    single: vi.fn(),
    eq: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    upsert: vi.fn().mockReturnThis(),
    or: vi.fn().mockReturnThis(),
    rpc: vi.fn()
  },
  supabaseServer: {
    from: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    single: vi.fn(),
    eq: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    upsert: vi.fn().mockReturnThis(),
    or: vi.fn().mockReturnThis(),
    rpc: vi.fn()
  }
}));

// Usar el sistema centralizado de mocks
import {
  createTestSetup
} from '@/mocks';

import { SupabaseRepository } from '../SupabaseRepository';
import { supabase } from '../../index';

const mockSupabaseClient = vi.mocked(supabase);

describe('SupabaseRepository', () => {
  let repository: SupabaseRepository;
  const { teardown } = createTestSetup();

  afterEach(() => {
    teardown();
  });

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
      expect(repo).toBeInstanceOf(SupabaseRepository);
    });

    it('debería crear instancia con cliente servidor', () => {
      const serverRepo = new SupabaseRepository(true);
      expect(serverRepo).toBeDefined();
      expect(serverRepo).toBeInstanceOf(SupabaseRepository);
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

      mockSupabaseClient.single.mockResolvedValue({ data: mockMarkdownPage, error: null });

      const result = await repository.save(insertData);

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('markdown_pages');
      expect(mockSupabaseClient.insert).toHaveBeenCalledWith(insertData);
      expect(result).toEqual(mockMarkdownPage);
    });

    it('debería propagar errores del cliente', async () => {
      const insertData: MarkdownPageInsert = {
        notion_page_id: 'notion-123',
        title: 'New Page',
        content: 'New content'
      };

      const error = { message: 'Insert failed' };
      mockSupabaseClient.single.mockResolvedValue({ data: null, error });

      await expect(repository.save(insertData))
        .rejects.toThrow('Error al guardar página de markdown: Insert failed');
    });

    it('debería validar tipos de entrada', async () => {
      const validData: MarkdownPageInsert = {
        notion_page_id: 'test',
        title: 'Test',
        content: 'Test content',
        notion_url: null,
        tags: [],
        metadata: {}
      };

      mockSupabaseClient.single.mockResolvedValue({ data: mockMarkdownPage, error: null });

      await expect(repository.save(validData)).resolves.toEqual(mockMarkdownPage);
    });
  });

  describe('findByNotionPageId()', () => {
    it('debería encontrar página por Notion ID', async () => {
      mockSupabaseClient.single.mockResolvedValue({ data: mockMarkdownPage, error: null });

      const result = await repository.findByNotionPageId('notion-123');

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('markdown_pages');
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('notion_page_id', 'notion-123');
      expect(result).toEqual(mockMarkdownPage);
    });

    it('debería retornar null cuando no encuentra página', async () => {
      const error = { code: 'PGRST116', message: 'No rows found' };
      mockSupabaseClient.single.mockResolvedValue({ data: null, error });

      const result = await repository.findByNotionPageId('non-existent');

      expect(result).toBeNull();
    });

    it('debería propagar errores', async () => {
      const error = { message: 'Query error' };
      mockSupabaseClient.single.mockResolvedValue({ data: null, error });

      await expect(repository.findByNotionPageId('notion-123'))
        .rejects.toThrow('Error al buscar página por Notion ID: Query error');
    });
  });

  describe('findById()', () => {
    it('debería encontrar página por ID', async () => {
      mockSupabaseClient.single.mockResolvedValue({ data: mockMarkdownPage, error: null });

      const result = await repository.findById('test-id');

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('markdown_pages');
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('id', 'test-id');
      expect(result).toEqual(mockMarkdownPage);
    });

    it('debería retornar null cuando no encuentra página', async () => {
      const error = { code: 'PGRST116', message: 'No rows found' };
      mockSupabaseClient.single.mockResolvedValue({ data: null, error });

      const result = await repository.findById('non-existent');

      expect(result).toBeNull();
    });

    it('debería propagar errores', async () => {
      const error = { message: 'Database error' };
      mockSupabaseClient.single.mockResolvedValue({ data: null, error });

      await expect(repository.findById('test-id'))
        .rejects.toThrow('Error al buscar página por ID: Database error');
    });
  });

  describe('findAll()', () => {
    beforeEach(() => {
      // Reset the mock chain for findAll tests
      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          limit: vi.fn().mockReturnThis(),
          range: vi.fn().mockReturnThis(),
          order: vi.fn().mockResolvedValue({ data: [mockMarkdownPage], error: null })
        })
      });
    });

    it('debería obtener todas las páginas', async () => {
      const result = await repository.findAll();

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('markdown_pages');
      expect(result).toEqual([mockMarkdownPage]);
    });

    it('debería aceptar opciones de consulta', async () => {
      const options = {
        limit: 10,
        offset: 5,
        orderBy: 'title',
        orderDirection: 'asc' as const
      };

      const result = await repository.findAll(options);

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('markdown_pages');
      expect(result).toEqual([mockMarkdownPage]);
    });

    it('debería retornar array vacío por defecto', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          limit: vi.fn().mockReturnThis(),
          range: vi.fn().mockReturnThis(),
          order: vi.fn().mockResolvedValue({ data: [], error: null })
        })
      });

      const result = await repository.findAll();

      expect(result).toEqual([]);
    });

    it('debería propagar errores', async () => {
      const error = { message: 'Query failed' };
      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          limit: vi.fn().mockReturnThis(),
          range: vi.fn().mockReturnThis(),
          order: vi.fn().mockResolvedValue({ data: null, error })
        })
      });

      await expect(repository.findAll())
        .rejects.toThrow('Error al obtener páginas: Query failed');
    });
  });

  describe('update()', () => {
    it('debería actualizar página exitosamente', async () => {
      const updateData: MarkdownPageUpdate = { title: 'Updated Title' };
      const updatedPage = { ...mockMarkdownPage, title: 'Updated Title' };

      mockSupabaseClient.single.mockResolvedValue({ data: updatedPage, error: null });

      const result = await repository.update('test-id', updateData);

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('markdown_pages');
      expect(mockSupabaseClient.update).toHaveBeenCalledWith(updateData);
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('id', 'test-id');
      expect(result).toEqual(updatedPage);
    });

    it('debería propagar errores', async () => {
      const updateData: MarkdownPageUpdate = { title: 'Updated Title' };
      const error = { message: 'Update failed' };

      mockSupabaseClient.single.mockResolvedValue({ data: null, error });

      await expect(repository.update('test-id', updateData))
        .rejects.toThrow('Error al actualizar página: Update failed');
    });
  });

  describe('delete()', () => {
    it('debería eliminar página exitosamente', async () => {
      mockSupabaseClient.delete.mockResolvedValue({ error: null });

      await repository.delete('test-id');

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('markdown_pages');
      expect(mockSupabaseClient.delete).toHaveBeenCalled();
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('id', 'test-id');
    });

    it('debería propagar errores', async () => {
      const error = { message: 'Delete failed' };
      mockSupabaseClient.delete.mockResolvedValue({ error });

      await expect(repository.delete('test-id'))
        .rejects.toThrow('Error al eliminar página: Delete failed');
    });
  });

  describe('upsert()', () => {
    it('debería hacer upsert exitosamente cuando la página no existe', async () => {
      const insertData: MarkdownPageInsert = {
        notion_page_id: 'notion-123',
        title: 'Upsert Page',
        content: 'Upsert content'
      };

      // Mock para findByNotionPageId (no existe)
      mockSupabaseClient.single
        .mockResolvedValueOnce({ data: null, error: { code: 'PGRST116' } })
        .mockResolvedValueOnce({ data: mockMarkdownPage, error: null });

      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => { });

      const result = await repository.upsert(insertData);

      expect(result).toEqual(mockMarkdownPage);
      expect(consoleSpy).toHaveBeenCalledWith(`✨ Página creada: ${insertData.title} (${insertData.notion_page_id})`);

      consoleSpy.mockRestore();
    });

    it('debería hacer upsert exitosamente cuando la página existe', async () => {
      const insertData: MarkdownPageInsert = {
        notion_page_id: 'notion-123',
        title: 'Upsert Page',
        content: 'Upsert content'
      };

      // Mock para findByNotionPageId (existe)
      mockSupabaseClient.single
        .mockResolvedValueOnce({ data: mockMarkdownPage, error: null })
        .mockResolvedValueOnce({ data: mockMarkdownPage, error: null });

      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => { });

      const result = await repository.upsert(insertData);

      expect(result).toEqual(mockMarkdownPage);
      expect(consoleSpy).toHaveBeenCalledWith(`🔄 Página actualizada: ${insertData.title} (${insertData.notion_page_id})`);

      consoleSpy.mockRestore();
    });

    it('debería propagar errores', async () => {
      const insertData: MarkdownPageInsert = {
        notion_page_id: 'notion-123',
        title: 'Upsert Page',
        content: 'Upsert content'
      };

      const error = { message: 'Upsert failed' };
      mockSupabaseClient.single
        .mockResolvedValueOnce({ data: null, error: { code: 'PGRST116' } })
        .mockResolvedValueOnce({ data: null, error });

      await expect(repository.upsert(insertData))
        .rejects.toThrow('Error al hacer upsert de página: Upsert failed');
    });
  });

  describe('search()', () => {
    beforeEach(() => {
      // Reset the mock chain for search tests
      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          or: vi.fn().mockReturnValue({
            limit: vi.fn().mockReturnThis(),
            range: vi.fn().mockReturnThis(),
            order: vi.fn().mockResolvedValue({ data: [mockMarkdownPage], error: null })
          })
        })
      });
    });

    it('debería buscar páginas por texto', async () => {
      const result = await repository.search('test query');

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('markdown_pages');
      expect(result).toEqual([mockMarkdownPage]);
    });

    it('debería aceptar opciones de búsqueda', async () => {
      const options = { limit: 5, offset: 10 };

      const result = await repository.search('query', options);

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('markdown_pages');
      expect(result).toEqual([mockMarkdownPage]);
    });

    it('debería retornar array vacío por defecto', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          or: vi.fn().mockReturnValue({
            limit: vi.fn().mockReturnThis(),
            range: vi.fn().mockReturnThis(),
            order: vi.fn().mockResolvedValue({ data: [], error: null })
          })
        })
      });

      const result = await repository.search('query');

      expect(result).toEqual([]);
    });

    it('debería propagar errores', async () => {
      const error = { message: 'Search failed' };
      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          or: vi.fn().mockReturnValue({
            limit: vi.fn().mockReturnThis(),
            range: vi.fn().mockReturnThis(),
            order: vi.fn().mockResolvedValue({ data: null, error })
          })
        })
      });

      await expect(repository.search('query'))
        .rejects.toThrow('Error al buscar páginas: Search failed');
    });
  });

  describe('searchByVector()', () => {
    it('debería buscar por vector con opciones por defecto', async () => {
      const mockResults = [{ ...mockMarkdownPage, similarity: 0.8 }];
      mockSupabaseClient.rpc.mockResolvedValue({ data: mockResults, error: null });

      const result = await repository.searchByVector([0.1, 0.2, 0.3]);

      expect(mockSupabaseClient.rpc).toHaveBeenCalledWith('match_documents', {
        query_embedding: [0.1, 0.2, 0.3],
        match_threshold: 0.6,
        match_count: 5
      });
      expect(result).toEqual(mockResults);
    });

    it('debería usar opciones personalizadas', async () => {
      const mockResults = [{ ...mockMarkdownPage, similarity: 0.9 }];
      const options = { matchThreshold: 0.8, matchCount: 10 };

      mockSupabaseClient.rpc.mockResolvedValue({ data: mockResults, error: null });

      const result = await repository.searchByVector([0.1, 0.2, 0.3], options);

      expect(mockSupabaseClient.rpc).toHaveBeenCalledWith('match_documents', {
        query_embedding: [0.1, 0.2, 0.3],
        match_threshold: 0.8,
        match_count: 10
      });
      expect(result).toEqual(mockResults);
    });

    it('debería retornar array vacío por defecto', async () => {
      mockSupabaseClient.rpc.mockResolvedValue({ data: [], error: null });

      const result = await repository.searchByVector([0.1, 0.2, 0.3]);

      expect(result).toEqual([]);
    });

    it('debería propagar errores', async () => {
      const error = { message: 'Vector search failed' };
      mockSupabaseClient.rpc.mockResolvedValue({ data: null, error });

      await expect(repository.searchByVector([0.1, 0.2, 0.3]))
        .rejects.toThrow('Error en búsqueda vectorial: Vector search failed');
    });

    it('debería manejar vectores de diferentes tamaños', async () => {
      const mockResults = [{ ...mockMarkdownPage, similarity: 0.7 }];
      mockSupabaseClient.rpc.mockResolvedValue({ data: mockResults, error: null });

      const smallVector = [0.1, 0.2];
      const largeVector = new Array(1536).fill(0).map(() => Math.random());

      await repository.searchByVector(smallVector);
      await repository.searchByVector(largeVector);

      expect(mockSupabaseClient.rpc).toHaveBeenCalledTimes(2);
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
      // Mock responses for different scenarios
      mockSupabaseClient.single
        .mockResolvedValueOnce({ data: null, error: { code: 'PGRST116' } })
        .mockResolvedValueOnce({ data: null, error: { code: 'PGRST116' } });

      mockSupabaseClient.from
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            limit: vi.fn().mockReturnThis(),
            range: vi.fn().mockReturnThis(),
            order: vi.fn().mockResolvedValue({ data: [], error: null })
          })
        })
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            or: vi.fn().mockReturnValue({
              limit: vi.fn().mockReturnThis(),
              range: vi.fn().mockReturnThis(),
              order: vi.fn().mockResolvedValue({ data: [], error: null })
            })
          })
        });

      mockSupabaseClient.rpc.mockResolvedValue({ data: [], error: null });

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
  });
});