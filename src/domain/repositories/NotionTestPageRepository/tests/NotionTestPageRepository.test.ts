import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NotionTestPageRepository } from '../NotionTestPageRepository';
import { TestResult } from '../NotionTestPageRepository.types';
import { container } from '../../../../infrastructure/di/container';
import { Block } from '../../../entities/Block';

// Mock del container
vi.mock('../../../../infrastructure/di/container', () => ({
  container: {
    getDatabaseUseCase: {
      execute: vi.fn()
    },
    queryDatabaseUseCase: {
      execute: vi.fn()
    },
    getBlockChildrenRecursiveUseCase: {
      execute: vi.fn()
    },
    getPageUseCase: {
      execute: vi.fn()
    },
    getBlockChildrenUseCase: {
      execute: vi.fn()
    }
  }
}));

describe('NotionTestPageRepository', () => {
  let repository: NotionTestPageRepository;
  let mockSetLoading: ReturnType<typeof vi.fn>;
  let mockSetResults: ReturnType<typeof vi.fn>;
  let testIds: Record<string, string>;

  beforeEach(() => {
    mockSetLoading = vi.fn();
    mockSetResults = vi.fn();
    testIds = {
      databaseId: 'test-db-id',
      pageId: 'test-page-id',
      blockId: 'test-block-id'
    };

    repository = new NotionTestPageRepository(testIds, mockSetLoading, mockSetResults);

    // Mock de console.log y console.warn
    vi.spyOn(console, 'log').mockImplementation(() => { });
    vi.spyOn(console, 'warn').mockImplementation(() => { });

    // Mock de alert
    vi.stubGlobal('alert', vi.fn());

    // Mock de Date.now para controlar timing
    vi.spyOn(Date, 'now').mockReturnValue(1000);
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  describe('Constructor', () => {
    it('debería inicializar correctamente las propiedades', () => {
      expect(repository['testIds']).toBe(testIds);
      expect(repository['setLoading']).toBe(mockSetLoading);
      expect(repository['setResults']).toBe(mockSetResults);
    });
  });

  describe('addResult', () => {
    it('debería añadir resultado al estado', async () => {
      const testResult: TestResult = {
        method: 'testMethod',
        success: true,
        data: { test: 'data' },
        timestamp: '2023-01-01 10:00:00',
        duration: 100
      };

      await repository.addResult(testResult);

      expect(mockSetResults).toHaveBeenCalledWith(expect.any(Function));

      // Verificar que la función actualiza el estado correctamente
      const updateFunction = mockSetResults.mock.calls[0][0];
      const previousResults = [{ method: 'old', success: true, timestamp: '', duration: 0 }];
      const newResults = updateFunction(previousResults);

      expect(newResults).toEqual([testResult, ...previousResults]);
    });
  });

  describe('execute', () => {
    it('debería ejecutar función exitosamente', async () => {
      const testFunction = vi.fn().mockResolvedValue({ data: 'test' });
      vi.spyOn(repository, 'addResult').mockResolvedValue();

      // Simular paso de tiempo
      vi.spyOn(Date, 'now')
        .mockReturnValueOnce(1000)  // inicio
        .mockReturnValueOnce(1100); // fin

      await repository.execute('testMethod', testFunction);

      expect(mockSetLoading).toHaveBeenCalledWith('testMethod');
      expect(testFunction).toHaveBeenCalled();
      expect(repository.addResult).toHaveBeenCalledWith({
        method: 'testMethod',
        success: true,
        data: { data: 'test' },
        timestamp: expect.any(String),
        duration: 100
      });
      expect(mockSetLoading).toHaveBeenCalledWith(null);
    });

    it('debería manejar errores correctamente', async () => {
      const testFunction = vi.fn().mockRejectedValue(new Error('Test error'));
      vi.spyOn(repository, 'addResult').mockResolvedValue();

      vi.spyOn(Date, 'now')
        .mockReturnValueOnce(1000)
        .mockReturnValueOnce(1150);

      await repository.execute('testMethod', testFunction);

      expect(repository.addResult).toHaveBeenCalledWith({
        method: 'testMethod',
        success: false,
        error: 'Test error',
        timestamp: expect.any(String),
        duration: 150
      });
      expect(mockSetLoading).toHaveBeenCalledWith(null);
    });

    it('debería manejar errores desconocidos', async () => {
      const testFunction = vi.fn().mockRejectedValue('Unknown error');
      vi.spyOn(repository, 'addResult').mockResolvedValue();

      await repository.execute('testMethod', testFunction);

      expect(repository.addResult).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Error desconocido'
        })
      );
    });
  });


  describe('testGetDatabase', () => {
    it('debería ejecutar el caso de uso con databaseId válido', async () => {
      vi.spyOn(repository, 'execute').mockResolvedValue();

      await repository.testGetDatabase();

      expect(repository.execute).toHaveBeenCalledWith('getDatabase', expect.any(Function));

      const testFunction = (repository.execute as ReturnType<typeof vi.fn>).mock.calls[0][1];
      await testFunction();
      expect(container.getDatabaseUseCase.execute).toHaveBeenCalledWith('test-db-id');
    });

    it('debería mostrar alerta cuando no hay databaseId', async () => {
      repository = new NotionTestPageRepository({}, mockSetLoading, mockSetResults);

      await repository.testGetDatabase();

      expect(alert).toHaveBeenCalledWith('Por favor, ingresa un Database ID');
    });
  });

  describe('testQueryDatabase', () => {
    it('debería ejecutar el caso de uso con databaseId válido', async () => {
      vi.spyOn(repository, 'execute').mockResolvedValue();

      await repository.testQueryDatabase();

      expect(repository.execute).toHaveBeenCalledWith('queryDatabase', expect.any(Function));

      const testFunction = (repository.execute as ReturnType<typeof vi.fn>).mock.calls[0][1];
      await testFunction();
      expect(container.queryDatabaseUseCase.execute).toHaveBeenCalledWith('test-db-id');
    });

    it('debería mostrar alerta cuando no hay databaseId', async () => {
      repository = new NotionTestPageRepository({}, mockSetLoading, mockSetResults);

      await repository.testQueryDatabase();

      expect(alert).toHaveBeenCalledWith('Por favor, ingresa un Database ID');
    });
  });

  describe('testQueryDatabaseWithBlocks', () => {
    it('debería procesar páginas con bloques exitosamente', async () => {
      const mockPages = [
        {
          id: 'page1',
          properties: { title: 'Page 1' },
          toJSON: () => ({
            id: 'page1',
            properties: { title: 'Page 1' },
            createdTime: undefined,
            lastEditedTime: undefined,
            url: undefined
          })
        },
        {
          id: 'page2',
          properties: { title: 'Page 2' },
          toJSON: () => ({
            id: 'page2',
            properties: { title: 'Page 2' },
            createdTime: undefined,
            lastEditedTime: undefined,
            url: undefined
          })
        }
      ];

      const mockBlocks = {
        blocks: [new Block('block1', 'paragraph', { content: 'test' })],
        totalBlocks: 5,
        maxDepthReached: 2,
        apiCallsCount: 3
      };

      vi.mocked(container.queryDatabaseUseCase.execute).mockResolvedValue(mockPages);
      vi.mocked(container.getBlockChildrenRecursiveUseCase.execute).mockResolvedValue(mockBlocks);
      vi.spyOn(repository, 'addResult').mockResolvedValue();

      vi.spyOn(Date, 'now')
        .mockReturnValueOnce(1000)
        .mockReturnValueOnce(1500);

      await repository.testQueryDatabaseWithBlocks();

      expect(container.queryDatabaseUseCase.execute).toHaveBeenCalledWith('test-db-id');
      expect(container.getBlockChildrenRecursiveUseCase.execute).toHaveBeenCalledTimes(2);
      expect(repository.addResult).toHaveBeenCalledWith({
        method: 'queryDatabase con bloques recursivos',
        success: true,
        data: expect.objectContaining({
          pages: expect.arrayContaining([
            expect.objectContaining({
              id: 'page1',
              blocks: mockBlocks.blocks,
              blocksStats: expect.objectContaining({
                totalBlocks: 5,
                maxDepthReached: 2,
                totalApiCalls: 3
              })
            })
          ]),
          summary: expect.objectContaining({
            totalPages: 2,
            totalBlocks: 10,
            totalApiCalls: 6
          })
        }),
        timestamp: expect.any(String),
        duration: 500
      });
    });

    it('debería manejar errores en bloques individuales', async () => {
      const mockPages = [{
        id: 'page1',
        properties: { title: 'Page 1' },
        toJSON: () => ({
          id: 'page1',
          properties: { title: 'Page 1' },
          createdTime: undefined,
          lastEditedTime: undefined,
          url: undefined
        })
      }];

      vi.mocked(container.queryDatabaseUseCase.execute).mockResolvedValue(mockPages);
      vi.mocked(container.getBlockChildrenRecursiveUseCase.execute).mockRejectedValue(new Error('Block error'));
      vi.spyOn(repository, 'addResult').mockResolvedValue();

      await repository.testQueryDatabaseWithBlocks();

      expect(console.warn).toHaveBeenCalledWith('Error obteniendo bloques para página page1:', expect.any(Error));
    });

    it('debería mostrar alerta cuando no hay databaseId', async () => {
      repository = new NotionTestPageRepository({}, mockSetLoading, mockSetResults);

      await repository.testQueryDatabaseWithBlocks();

      expect(alert).toHaveBeenCalledWith('Por favor, ingresa un Database ID');
    });
  });

  describe('testGetPage', () => {
    it('debería ejecutar el caso de uso con pageId válido', async () => {
      vi.spyOn(repository, 'execute').mockResolvedValue();

      await repository.testGetPage();

      expect(repository.execute).toHaveBeenCalledWith('getPage', expect.any(Function));

      const testFunction = (repository.execute as ReturnType<typeof vi.fn>).mock.calls[0][1];
      await testFunction();
      expect(container.getPageUseCase.execute).toHaveBeenCalledWith('test-page-id');
    });

    it('debería mostrar alerta cuando no hay pageId', async () => {
      repository = new NotionTestPageRepository({}, mockSetLoading, mockSetResults);

      await repository.testGetPage();

      expect(alert).toHaveBeenCalledWith('Por favor, ingresa un Page ID');
    });
  });

  describe('testGetBlockChildren', () => {
    it('debería ejecutar el caso de uso con blockId válido', async () => {
      vi.spyOn(repository, 'execute').mockResolvedValue();

      await repository.testGetBlockChildren();

      expect(repository.execute).toHaveBeenCalledWith('getBlockChildren', expect.any(Function));

      const testFunction = (repository.execute as ReturnType<typeof vi.fn>).mock.calls[0][1];
      await testFunction();
      expect(container.getBlockChildrenUseCase.execute).toHaveBeenCalledWith('test-block-id');
    });

    it('debería mostrar alerta cuando no hay blockId', async () => {
      repository = new NotionTestPageRepository({}, mockSetLoading, mockSetResults);

      await repository.testGetBlockChildren();

      expect(alert).toHaveBeenCalledWith('Por favor, ingresa un Block ID');
    });
  });

  describe('testGetBlockChildrenRecursive', () => {
    it('debería ejecutar el caso de uso con blockId válido y opciones', async () => {
      vi.spyOn(repository, 'execute').mockResolvedValue();

      await repository.testGetBlockChildrenRecursive();

      expect(repository.execute).toHaveBeenCalledWith('getBlockChildren (recursivo)', expect.any(Function));

      const testFunction = (repository.execute as ReturnType<typeof vi.fn>).mock.calls[0][1];
      await testFunction();
      expect(container.getBlockChildrenRecursiveUseCase.execute).toHaveBeenCalledWith('test-block-id', {
        maxDepth: 3,
        includeEmptyBlocks: false,
        delayBetweenRequests: 100
      });
    });

    it('debería mostrar alerta cuando no hay blockId', async () => {
      repository = new NotionTestPageRepository({}, mockSetLoading, mockSetResults);

      await repository.testGetBlockChildrenRecursive();

      expect(alert).toHaveBeenCalledWith('Por favor, ingresa un Block ID');
    });
  });
});
