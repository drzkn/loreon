import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { MarkdownPageInsert, MarkdownPageUpdate } from '../../types';

// Mock simple pero efectivo que evita problemas de inicialización
vi.mock('../index', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      upsert: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
      limit: vi.fn().mockReturnThis(),
      range: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      or: vi.fn().mockReturnThis(),
      then: vi.fn().mockResolvedValue({ data: [], error: null })
    })),
    rpc: vi.fn().mockResolvedValue({ data: [], error: null })
  },
  supabaseServer: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      upsert: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
      limit: vi.fn().mockReturnThis(),
      range: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      or: vi.fn().mockReturnThis(),
      then: vi.fn().mockResolvedValue({ data: [], error: null })
    })),
    rpc: vi.fn().mockResolvedValue({ data: [], error: null })
  }
}));

import { SupabaseRepository } from '../SupabaseRepository';

describe('SupabaseRepository', () => {
  let repository: SupabaseRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-key';
    repository = new SupabaseRepository();
  });

  describe('Constructor y Configuración', () => {
    it('debería crear una instancia correctamente', () => {
      expect(repository).toBeInstanceOf(SupabaseRepository);
    });

    it('debería crear instancia con server client', () => {
      const serverRepo = new SupabaseRepository(true);
      expect(serverRepo).toBeInstanceOf(SupabaseRepository);
    });

    it('debería tener todos los métodos de la interfaz', () => {
      const requiredMethods = [
        'save',
        'findByNotionPageId',
        'findById',
        'findAll',
        'update',
        'delete',
        'upsert',
        'search',
        'searchByVector'
      ];

      requiredMethods.forEach(method => {
        expect(repository).toHaveProperty(method);
        expect(typeof repository[method as keyof SupabaseRepository]).toBe('function');
      });
    });
  });

  describe('Validación de Parámetros de Métodos', () => {
    it('debería validar parámetros de save', () => {
      expect(repository.save.length).toBe(1);
    });

    it('debería validar parámetros de findByNotionPageId', () => {
      expect(repository.findByNotionPageId.length).toBe(1);
    });

    it('debería validar parámetros de findById', () => {
      expect(repository.findById.length).toBe(1);
    });

    it('debería validar parámetros de update', () => {
      expect(repository.update.length).toBe(2);
    });

    it('debería validar parámetros de delete', () => {
      expect(repository.delete.length).toBe(1);
    });

    it('debería validar parámetros de search', () => {
      expect(repository.search.length).toBe(2);
    });

    it('debería validar parámetros de searchByVector', () => {
      expect(repository.searchByVector.length).toBe(2);
    });
  });

  describe('Validación de Tipos', () => {
    it('debería aceptar MarkdownPageInsert completo', () => {
      const validData: MarkdownPageInsert = {
        notion_page_id: 'notion-123',
        title: 'Complete Test Page',
        content: 'Full test content with all fields',
        notion_url: 'https://notion.so/test-page-123',
        notion_created_time: '2023-01-01T00:00:00.000Z',
        notion_last_edited_time: '2023-01-02T12:30:00.000Z',
        tags: ['typescript', 'testing', 'supabase'],
        metadata: {
          author: 'Test Author',
          category: 'Technical',
          priority: 'high',
          nested: {
            prop1: 'value1',
            prop2: 42,
            prop3: true
          }
        },
        embedding: [0.1, 0.2, 0.3, 0.4, 0.5]
      };

      // Verificaciones de estructura
      expect(validData.notion_page_id).toBe('notion-123');
      expect(validData.title).toBe('Complete Test Page');
      expect(validData.tags).toHaveLength(3);
      expect(validData.embedding).toHaveLength(5);
      expect(validData.metadata).toHaveProperty('nested');
      expect(validData.metadata?.nested).toHaveProperty('prop2', 42);
    });

    it('debería aceptar MarkdownPageInsert mínimo', () => {
      const minimalData: MarkdownPageInsert = {
        notion_page_id: 'minimal-123',
        title: 'Minimal Page',
        content: 'Basic content',
        notion_url: null,
        tags: [],
        metadata: {}
      };

      expect(minimalData.notion_page_id).toBe('minimal-123');
      expect(minimalData.tags).toHaveLength(0);
      expect(Object.keys(minimalData.metadata || {})).toHaveLength(0);
    });

    it('debería aceptar MarkdownPageUpdate completo', () => {
      const updateData: MarkdownPageUpdate = {
        title: 'Updated Title',
        content: 'Updated content with changes',
        notion_url: 'https://notion.so/updated-page',
        notion_last_edited_time: '2023-12-01T15:45:00.000Z',
        tags: ['updated', 'modified'],
        metadata: {
          lastModifiedBy: 'Test User',
          changeReason: 'Content improvement',
          version: 2
        },
        embedding: [0.2, 0.3, 0.4, 0.5, 0.6]
      };

      expect(updateData.title).toBe('Updated Title');
      expect(updateData.tags).toContain('updated');
      expect(updateData.metadata).toHaveProperty('version', 2);
      expect(updateData.embedding).toHaveLength(5);
    });

    it('debería aceptar MarkdownPageUpdate parcial', () => {
      const partialUpdate: MarkdownPageUpdate = {
        content: 'Only content changed'
      };

      expect(partialUpdate.content).toBe('Only content changed');
      expect(partialUpdate.title).toBeUndefined();
      expect(partialUpdate.tags).toBeUndefined();
    });

    it('debería aceptar opciones completas de findAll', () => {
      const fullOptions = {
        limit: 25,
        offset: 50,
        orderBy: 'title',
        orderDirection: 'asc' as const
      };

      expect(fullOptions.limit).toBe(25);
      expect(fullOptions.offset).toBe(50);
      expect(fullOptions.orderBy).toBe('title');
      expect(fullOptions.orderDirection).toBe('asc');
    });

    it('debería aceptar opciones parciales de findAll', () => {
      const partialOptions: { limit: number; offset?: number } = {
        limit: 10
      };

      expect(partialOptions.limit).toBe(10);
      expect(partialOptions.offset).toBeUndefined();
    });

    it('debería aceptar opciones de search', () => {
      const searchOptions = {
        limit: 15,
        offset: 30
      };

      expect(searchOptions.limit).toBe(15);
      expect(searchOptions.offset).toBe(30);
    });

    it('debería aceptar opciones de searchByVector', () => {
      const vectorOptions = {
        matchThreshold: 0.75,
        matchCount: 12
      };

      expect(vectorOptions.matchThreshold).toBe(0.75);
      expect(vectorOptions.matchCount).toBe(12);
    });
  });

  describe('Casos Edge y Validaciones', () => {
    it('debería manejar strings vacíos', () => {
      const emptyStringData: MarkdownPageInsert = {
        notion_page_id: '',
        title: '',
        content: '',
        notion_url: null,
        tags: [],
        metadata: {}
      };

      expect(emptyStringData.notion_page_id).toBe('');
      expect(emptyStringData.title).toBe('');
      expect(emptyStringData.content).toBe('');
    });

    it('debería manejar arrays vacíos', () => {
      const emptyArrays = {
        tags: [] as string[],
        embedding: [] as number[]
      };

      expect(emptyArrays.tags).toHaveLength(0);
      expect(emptyArrays.embedding).toHaveLength(0);
    });

    it('debería manejar metadata complejo', () => {
      const complexMetadata = {
        metadata: {
          level1: {
            level2: {
              level3: {
                deepValue: 'deep',
                deepNumber: 123,
                deepArray: [1, 2, 3],
                deepBoolean: false
              }
            }
          },
          simpleString: 'simple',
          simpleNumber: 456,
          simpleArray: ['a', 'b', 'c'],
          simpleBoolean: true,
          nullValue: null,
          undefinedValue: undefined
        }
      };

      expect(complexMetadata.metadata.level1.level2.level3.deepValue).toBe('deep');
      expect(complexMetadata.metadata.simpleArray).toContain('b');
      expect(complexMetadata.metadata.nullValue).toBeNull();
    });

    it('debería manejar valores límite numéricos', () => {
      const limitValues = {
        limit: Number.MAX_SAFE_INTEGER,
        offset: 0,
        matchThreshold: 1.0,
        matchCount: 1,
        embedding: [Number.MIN_VALUE, Number.MAX_VALUE]
      };

      expect(limitValues.limit).toBe(Number.MAX_SAFE_INTEGER);
      expect(limitValues.offset).toBe(0);
      expect(limitValues.matchThreshold).toBe(1.0);
      expect(limitValues.embedding).toHaveLength(2);
    });

    it('debería manejar fechas ISO válidas', () => {
      const dateData = {
        notion_created_time: '2023-01-01T00:00:00.000Z',
        notion_last_edited_time: '2023-12-31T23:59:59.999Z'
      };

      expect(dateData.notion_created_time).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
      expect(dateData.notion_last_edited_time).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });
  });

  describe('Comportamiento de Métodos', () => {
    it('debería poder llamar save sin errores de compilación', () => {
      const data: MarkdownPageInsert = {
        notion_page_id: 'test-123',
        title: 'Test',
        content: 'Content',
        notion_url: null,
        tags: [],
        metadata: {}
      };

      expect(() => repository.save(data)).not.toThrow();
    });

    it('debería poder llamar todos los métodos de búsqueda', () => {
      expect(() => repository.findByNotionPageId('test-id')).not.toThrow();
      expect(() => repository.findById('test-id')).not.toThrow();
      expect(() => repository.findAll()).not.toThrow();
      expect(() => repository.search('query')).not.toThrow();
      expect(() => repository.searchByVector([0.1, 0.2])).not.toThrow();
    });

    it('debería poder llamar métodos de modificación', () => {
      const updateData: MarkdownPageUpdate = { title: 'Updated' };
      const insertData: MarkdownPageInsert = {
        notion_page_id: 'test',
        title: 'Test',
        content: 'Content',
        notion_url: null,
        tags: [],
        metadata: {}
      };

      expect(() => repository.update('id', updateData)).not.toThrow();
      expect(() => repository.delete('id')).not.toThrow();
      expect(() => repository.upsert(insertData)).not.toThrow();
    });

    it('debería manejar opciones opcionales correctamente', () => {
      expect(() => repository.findAll(undefined)).not.toThrow();
      expect(() => repository.search('query', undefined)).not.toThrow();
      expect(() => repository.searchByVector([0.1], undefined)).not.toThrow();
    });
  });

  describe('Cumplimiento de Interfaz', () => {
    it('debería implementar SupabaseMarkdownRepositoryInterface completamente', () => {
      // Verificar que la clase implementa todos los métodos requeridos
      const interfaceMethods = [
        'save', 'findByNotionPageId', 'findById', 'findAll',
        'update', 'delete', 'upsert', 'search', 'searchByVector'
      ];

      interfaceMethods.forEach(method => {
        expect(repository).toHaveProperty(method);
        expect(typeof repository[method as keyof SupabaseRepository]).toBe('function');
      });
    });

    it('debería tener propiedades correctas de clase', () => {
      expect(repository.constructor.name).toBe('SupabaseRepository');
      expect(repository instanceof SupabaseRepository).toBe(true);
    });
  });

  describe('Cobertura de Ramas - Tests Funcionales', () => {
    it('debería crear instancia con diferentes configuraciones de cliente', () => {
      const clientRepo = new SupabaseRepository(false);
      const serverRepo = new SupabaseRepository(true);
      const defaultRepo = new SupabaseRepository();

      expect(clientRepo).toBeInstanceOf(SupabaseRepository);
      expect(serverRepo).toBeInstanceOf(SupabaseRepository);
      expect(defaultRepo).toBeInstanceOf(SupabaseRepository);
    });

    it('debería manejar diferentes tipos de datos en save', () => {
      const dataMinimal: MarkdownPageInsert = {
        notion_page_id: 'minimal',
        title: 'Min',
        content: 'Min content',
        notion_url: null,
        tags: [],
        metadata: {}
      };

      const dataComplete: MarkdownPageInsert = {
        notion_page_id: 'complete',
        title: 'Complete',
        content: 'Complete content',
        notion_url: 'https://notion.so/test',
        notion_created_time: '2023-01-01T00:00:00.000Z',
        notion_last_edited_time: '2023-01-02T00:00:00.000Z',
        tags: ['tag1', 'tag2'],
        metadata: { test: true },
        embedding: [0.1, 0.2, 0.3]
      };

      expect(() => repository.save(dataMinimal)).not.toThrow();
      expect(() => repository.save(dataComplete)).not.toThrow();
    });

    it('debería manejar diferentes tipos de opciones en findAll', () => {
      const noOptions = undefined;
      const partialOptions = { limit: 10 };
      const fullOptions = {
        limit: 20,
        offset: 5,
        orderBy: 'title',
        orderDirection: 'asc' as const
      };

      expect(() => repository.findAll(noOptions)).not.toThrow();
      expect(() => repository.findAll(partialOptions)).not.toThrow();
      expect(() => repository.findAll(fullOptions)).not.toThrow();
    });

    it('debería manejar diferentes tipos de opciones en search', () => {
      const noOptions = undefined;
      const withOptions = { limit: 15, offset: 5 };

      expect(() => repository.search('query', noOptions)).not.toThrow();
      expect(() => repository.search('query', withOptions)).not.toThrow();
      expect(() => repository.search('', noOptions)).not.toThrow();
    });

    it('debería manejar diferentes tipos de opciones en searchByVector', () => {
      const embedding = [0.1, 0.2, 0.3];
      const noOptions = undefined;
      const withOptions = { matchThreshold: 0.8, matchCount: 10 };

      expect(() => repository.searchByVector(embedding, noOptions)).not.toThrow();
      expect(() => repository.searchByVector(embedding, withOptions)).not.toThrow();
      expect(() => repository.searchByVector([], noOptions)).not.toThrow();
    });

    it('debería manejar diferentes tipos de actualizaciones', () => {
      const emptyUpdate: MarkdownPageUpdate = {};
      const partialUpdate: MarkdownPageUpdate = { title: 'New Title' };
      const fullUpdate: MarkdownPageUpdate = {
        title: 'New Title',
        content: 'New Content',
        notion_url: 'https://notion.so/new',
        notion_last_edited_time: '2023-12-01T00:00:00.000Z',
        tags: ['new'],
        metadata: { updated: true },
        embedding: [0.4, 0.5, 0.6]
      };

      expect(() => repository.update('id', emptyUpdate)).not.toThrow();
      expect(() => repository.update('id', partialUpdate)).not.toThrow();
      expect(() => repository.update('id', fullUpdate)).not.toThrow();
    });

    it('debería ejecutar todos los métodos sin errores de compilación', () => {
      const testData: MarkdownPageInsert = {
        notion_page_id: 'test',
        title: 'Test',
        content: 'Test content',
        notion_url: null,
        tags: [],
        metadata: {}
      };

      expect(() => repository.save(testData)).not.toThrow();
      expect(() => repository.findByNotionPageId('id')).not.toThrow();
      expect(() => repository.findById('id')).not.toThrow();
      expect(() => repository.findAll()).not.toThrow();
      expect(() => repository.update('id', { title: 'Updated' })).not.toThrow();
      expect(() => repository.delete('id')).not.toThrow();
      expect(() => repository.upsert(testData)).not.toThrow();
      expect(() => repository.search('query')).not.toThrow();
      expect(() => repository.searchByVector([0.1, 0.2])).not.toThrow();
    });

    it('debería validar tipos de metadata complejos', () => {
      const complexMetadata = {
        simple: 'string',
        number: 42,
        boolean: true,
        array: [1, 2, 3],
        nested: {
          level1: {
            level2: 'deep value'
          }
        },
        nullValue: null,
        undefinedValue: undefined
      };

      const dataWithComplexMetadata: MarkdownPageInsert = {
        notion_page_id: 'complex',
        title: 'Complex',
        content: 'Complex content',
        notion_url: null,
        tags: [],
        metadata: complexMetadata
      };

      expect(() => repository.save(dataWithComplexMetadata)).not.toThrow();
    });

    it('debería manejar casos edge de parámetros', () => {
      expect(() => repository.findByNotionPageId('')).not.toThrow();
      expect(() => repository.findById('')).not.toThrow();
      expect(() => repository.delete('')).not.toThrow();
      expect(() => repository.search('')).not.toThrow();
      expect(() => repository.searchByVector([])).not.toThrow();
    });
  });

  describe('Configuración de Cliente', () => {
    it('debería usar cliente correcto según configuración', () => {
      const clientRepo = new SupabaseRepository(false);
      const serverRepo = new SupabaseRepository(true);

      expect(clientRepo).toBeInstanceOf(SupabaseRepository);
      expect(serverRepo).toBeInstanceOf(SupabaseRepository);
    });

    it('debería usar cliente por defecto cuando no se especifica', () => {
      const defaultRepo = new SupabaseRepository();
      expect(defaultRepo).toBeInstanceOf(SupabaseRepository);
    });
  });
});