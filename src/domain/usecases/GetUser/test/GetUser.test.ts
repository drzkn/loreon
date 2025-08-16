import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GetUser } from '../index';
import { User } from '../../../entities/User';
import { INotionRepository } from '../../../../ports/output/repositories/INotionRepository';
import { createTestSetup, mockErrors } from '@/mocks';

describe('GetUser UseCase', () => {
  let getUser: GetUser;
  let mockRepository: INotionRepository;
  const { teardown } = createTestSetup();

  beforeEach(() => {
    mockRepository = {
      getUser: vi.fn(),
      getDatabase: vi.fn(),
      queryDatabase: vi.fn(),
      getPage: vi.fn(),
      getBlockChildren: vi.fn()
    };

    getUser = new GetUser(mockRepository);
  });

  afterEach(() => {
    teardown();
  });

  describe('Constructor', () => {
    it('debería inicializar correctamente con el repositorio', () => {
      expect(getUser['notionRepository']).toBe(mockRepository);
    });
  });

  describe('execute', () => {
    it('debería ejecutar exitosamente y devolver un usuario', async () => {
      const mockUser = new User('user-123', 'John Doe', 'https://avatar.url', 'person', 'john@example.com');
      vi.mocked(mockRepository.getUser).mockResolvedValue(mockUser);

      const result = await getUser.execute();

      expect(mockRepository.getUser).toHaveBeenCalledTimes(1);
      expect(mockRepository.getUser).toHaveBeenCalledWith();
      expect(result).toBe(mockUser);
    });

    it('debería propagar errores del repositorio', async () => {
      vi.mocked(mockRepository.getUser).mockRejectedValue(mockErrors.notFoundError);

      await expect(getUser.execute()).rejects.toThrow('Resource not found');
      expect(mockRepository.getUser).toHaveBeenCalledTimes(1);
    });

    it('debería manejar errores de red', async () => {
      vi.mocked(mockRepository.getUser).mockRejectedValue(mockErrors.networkError);

      await expect(getUser.execute()).rejects.toThrow('Network error');
    });
  });
});
