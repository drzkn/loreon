import { GetDatabaseUseCase } from '../GetDatabaseUseCase';
import { INotionRepository } from '../../../ports/output/repositories/INotionRepository';
import { Database } from '../../entities/Database';

// Mock del repositorio
const createMockNotionRepository = (): jest.Mocked<INotionRepository> => ({
  getDatabase: jest.fn(),
  getPage: jest.fn(),
  getUser: jest.fn(),
  queryDatabase: jest.fn(),
  getBlockChildren: jest.fn(),
});

describe('GetDatabaseUseCase', () => {
  let getDatabaseUseCase: GetDatabaseUseCase;
  let mockNotionRepository: jest.Mocked<INotionRepository>;

  beforeEach(() => {
    mockNotionRepository = createMockNotionRepository();
    getDatabaseUseCase = new GetDatabaseUseCase(mockNotionRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should successfully get a database when valid ID is provided', async () => {
      // Arrange
      const databaseId = 'test-database-id';
      const mockDatabase = new Database(
        databaseId,
        'Test Database',
        { Name: { title: {} } },
        '2023-01-01T00:00:00.000Z',
        '2023-01-01T00:00:00.000Z',
        'https://notion.so/test-database'
      );
      mockNotionRepository.getDatabase.mockResolvedValue(mockDatabase);

      // Act
      const result = await getDatabaseUseCase.execute(databaseId);

      // Assert
      expect(mockNotionRepository.getDatabase).toHaveBeenCalledWith(databaseId);
      expect(result).toBe(mockDatabase);
      expect(result.id).toBe(databaseId);
      expect(result.title).toBe('Test Database');
    });

    it('should throw error when database ID is empty string', async () => {
      // Arrange
      const databaseId = '';

      // Act & Assert
      await expect(getDatabaseUseCase.execute(databaseId)).rejects.toThrow('Database ID es requerido');
      expect(mockNotionRepository.getDatabase).not.toHaveBeenCalled();
    });

    it('should throw error when database ID is null', async () => {
      // Arrange
      const databaseId = null as unknown as string;

      // Act & Assert
      await expect(getDatabaseUseCase.execute(databaseId)).rejects.toThrow('Database ID es requerido');
      expect(mockNotionRepository.getDatabase).not.toHaveBeenCalled();
    });

    it('should throw error when database ID is undefined', async () => {
      // Arrange
      const databaseId = undefined as unknown as string;

      // Act & Assert
      await expect(getDatabaseUseCase.execute(databaseId)).rejects.toThrow('Database ID es requerido');
      expect(mockNotionRepository.getDatabase).not.toHaveBeenCalled();
    });

    it('should propagate repository errors', async () => {
      // Arrange
      const databaseId = 'test-database-id';
      const repositoryError = new Error('Repository error');
      mockNotionRepository.getDatabase.mockRejectedValue(repositoryError);

      // Act & Assert
      await expect(getDatabaseUseCase.execute(databaseId)).rejects.toThrow('Repository error');
      expect(mockNotionRepository.getDatabase).toHaveBeenCalledWith(databaseId);
    });

    it('should handle API errors from repository', async () => {
      // Arrange
      const databaseId = 'invalid-database-id';
      const apiError = {
        response: {
          status: 404,
          data: {
            message: 'Database not found',
            code: 'object_not_found'
          }
        }
      };
      mockNotionRepository.getDatabase.mockRejectedValue(apiError);

      // Act & Assert
      await expect(getDatabaseUseCase.execute(databaseId)).rejects.toEqual(apiError);
      expect(mockNotionRepository.getDatabase).toHaveBeenCalledWith(databaseId);
    });
  });
}); 