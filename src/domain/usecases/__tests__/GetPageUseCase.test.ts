import { GetPageUseCase } from '../GetPageUseCase';
import { INotionRepository } from '../../../ports/output/repositories/INotionRepository';
import { Page } from '../../entities/Page';

// Mock del repositorio
const createMockNotionRepository = (): jest.Mocked<INotionRepository> => ({
  getDatabase: jest.fn(),
  getPage: jest.fn(),
  getUser: jest.fn(),
  queryDatabase: jest.fn(),
  getBlockChildren: jest.fn(),
});

describe('GetPageUseCase', () => {
  let getPageUseCase: GetPageUseCase;
  let mockNotionRepository: jest.Mocked<INotionRepository>;

  beforeEach(() => {
    mockNotionRepository = createMockNotionRepository();
    getPageUseCase = new GetPageUseCase(mockNotionRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should successfully get a page when valid ID is provided', async () => {
      // Arrange
      const pageId = 'test-page-id';
      const mockPage = new Page(
        pageId,
        { Name: { title: [{ plain_text: 'Test Page' }] } },
        '2023-01-01T00:00:00.000Z',
        '2023-01-01T00:00:00.000Z',
        'https://notion.so/test-page'
      );
      mockNotionRepository.getPage.mockResolvedValue(mockPage);

      // Act
      const result = await getPageUseCase.execute(pageId);

      // Assert
      expect(mockNotionRepository.getPage).toHaveBeenCalledWith(pageId);
      expect(result).toBe(mockPage);
      expect(result.id).toBe(pageId);
      expect(result.properties).toEqual(mockPage.properties);
    });

    it('should throw error when page ID is empty string', async () => {
      // Arrange
      const pageId = '';

      // Act & Assert
      await expect(getPageUseCase.execute(pageId)).rejects.toThrow('Page ID es requerido');
      expect(mockNotionRepository.getPage).not.toHaveBeenCalled();
    });

    it('should throw error when page ID is null', async () => {
      // Arrange
      const pageId = null as unknown as string;

      // Act & Assert
      await expect(getPageUseCase.execute(pageId)).rejects.toThrow('Page ID es requerido');
      expect(mockNotionRepository.getPage).not.toHaveBeenCalled();
    });

    it('should throw error when page ID is undefined', async () => {
      // Arrange
      const pageId = undefined as unknown as string;

      // Act & Assert
      await expect(getPageUseCase.execute(pageId)).rejects.toThrow('Page ID es requerido');
      expect(mockNotionRepository.getPage).not.toHaveBeenCalled();
    });

    it('should propagate repository errors', async () => {
      // Arrange
      const pageId = 'test-page-id';
      const repositoryError = new Error('Repository error');
      mockNotionRepository.getPage.mockRejectedValue(repositoryError);

      // Act & Assert
      await expect(getPageUseCase.execute(pageId)).rejects.toThrow('Repository error');
      expect(mockNotionRepository.getPage).toHaveBeenCalledWith(pageId);
    });

    it('should handle API errors from repository', async () => {
      // Arrange
      const pageId = 'invalid-page-id';
      const apiError = {
        response: {
          status: 404,
          data: {
            message: 'Page not found',
            code: 'object_not_found'
          }
        }
      };
      mockNotionRepository.getPage.mockRejectedValue(apiError);

      // Act & Assert
      await expect(getPageUseCase.execute(pageId)).rejects.toEqual(apiError);
      expect(mockNotionRepository.getPage).toHaveBeenCalledWith(pageId);
    });
  });
}); 