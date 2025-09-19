import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryDatabaseUseCase } from '../QueryDatabase';
import { Page } from '../../../entities/Page';
import { INotionRepository } from '../../../../ports/output/repositories/INotionRepository';

describe('QueryDatabaseUseCase', () => {
  let queryDatabaseUseCase: QueryDatabaseUseCase;
  let mockRepository: INotionRepository;

  beforeEach(() => {
    mockRepository = {
      getDatabase: vi.fn(),
      queryDatabase: vi.fn(),
      getPage: vi.fn(),
      getBlockChildren: vi.fn()
    };

    queryDatabaseUseCase = new QueryDatabaseUseCase(mockRepository);
  });

  describe('Constructor', () => {
    it('debería inicializar correctamente con el repositorio', () => {
      expect(queryDatabaseUseCase['notionRepository']).toBe(mockRepository);
    });
  });

  describe('execute', () => {
    const mockPages = [
      new Page('page1', { title: 'Page 1' }),
      new Page('page2', { title: 'Page 2' })
    ];

    it('debería ejecutar exitosamente con solo databaseId', async () => {
      vi.mocked(mockRepository.queryDatabase).mockResolvedValue(mockPages);

      const result = await queryDatabaseUseCase.execute('db-123');

      expect(mockRepository.queryDatabase).toHaveBeenCalledWith('db-123', undefined, undefined);
      expect(result).toBe(mockPages);
    });

    it('debería ejecutar exitosamente con todos los parámetros', async () => {
      const filter = { property: 'Status', select: { equals: 'Published' } };
      const sorts = [{ property: 'Created', direction: 'ascending' }];

      vi.mocked(mockRepository.queryDatabase).mockResolvedValue(mockPages);

      const result = await queryDatabaseUseCase.execute('db-123', filter, sorts);

      expect(mockRepository.queryDatabase).toHaveBeenCalledWith('db-123', filter, sorts);
      expect(result).toBe(mockPages);
    });

    it('debería lanzar error cuando databaseId está vacío', async () => {
      await expect(queryDatabaseUseCase.execute('')).rejects.toThrow('Database ID es requerido');
      expect(mockRepository.queryDatabase).not.toHaveBeenCalled();
    });

    it('debería lanzar error cuando databaseId es undefined', async () => {
      await expect(queryDatabaseUseCase.execute(undefined as unknown as string)).rejects.toThrow('Database ID es requerido');
      expect(mockRepository.queryDatabase).not.toHaveBeenCalled();
    });

    it('debería lanzar error cuando databaseId es null', async () => {
      await expect(queryDatabaseUseCase.execute(null as unknown as string)).rejects.toThrow('Database ID es requerido');
      expect(mockRepository.queryDatabase).not.toHaveBeenCalled();
    });

    it('debería propagar errores del repositorio', async () => {
      const error = new Error('Repository error');
      vi.mocked(mockRepository.queryDatabase).mockRejectedValue(error);

      await expect(queryDatabaseUseCase.execute('db-123')).rejects.toThrow('Repository error');
      expect(mockRepository.queryDatabase).toHaveBeenCalledWith('db-123', undefined, undefined);
    });

    it('debería manejar errores desconocidos', async () => {
      vi.mocked(mockRepository.queryDatabase).mockRejectedValue('Unknown error');

      await expect(queryDatabaseUseCase.execute('db-123')).rejects.toBe('Unknown error');
    });
  });
});
