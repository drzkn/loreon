import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GetUser } from '../index';
import { User } from '../../../entities/User';
import { INotionRepository } from '../../../../ports/output/repositories/INotionRepository';

describe('GetUser UseCase', () => {
  let getUser: GetUser;
  let mockRepository: INotionRepository;

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
      const error = new Error('Repository error');
      vi.mocked(mockRepository.getUser).mockRejectedValue(error);

      await expect(getUser.execute()).rejects.toThrow('Repository error');
      expect(mockRepository.getUser).toHaveBeenCalledTimes(1);
    });

    it('debería manejar errores desconocidos', async () => {
      vi.mocked(mockRepository.getUser).mockRejectedValue('Unknown error');

      await expect(getUser.execute()).rejects.toBe('Unknown error');
    });
  });
});
