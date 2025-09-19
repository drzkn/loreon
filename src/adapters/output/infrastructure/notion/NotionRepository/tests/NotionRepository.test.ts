import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { NotionRepository } from '..';
import { IHttpClient, HttpResponse } from '@/ports/output/services/IHttpClient';
import { Database } from '@/domain/entities/Database';
import { Page } from '@/domain/entities/Page';
import { NotionDatabaseResponse, NotionPageResponse } from '@/shared/types/notion.types';

// Usar el sistema centralizado de mocks
import {
  createTestSetup
} from '@/mocks';

// Mock del IHttpClient
const createMockHttpClient = (): IHttpClient => ({
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
});

describe('NotionRepository', () => {
  let notionRepository: NotionRepository;
  let mockHttpClient: IHttpClient;
  const { teardown } = createTestSetup();

  beforeEach(() => {
    mockHttpClient = createMockHttpClient();
    notionRepository = new NotionRepository(mockHttpClient);
  });

  afterEach(() => {
    teardown();
    vi.clearAllMocks();
  });

  describe('getDatabase', () => {
    const mockDatabaseResponse: NotionDatabaseResponse = {
      id: 'test-database-id',
      title: [{ plain_text: 'Test Database', href: undefined }],
      properties: { Name: { title: {} } },
      created_time: '2023-01-01T00:00:00.000Z',
      last_edited_time: '2023-01-01T00:00:00.000Z',
      url: 'https://notion.so/test-database'
    };

    it('should successfully get a database', async () => {
      // Arrange
      const databaseId = 'test-database-id';
      const mockHttpResponse: HttpResponse<NotionDatabaseResponse> = {
        data: mockDatabaseResponse,
        status: 200,
        statusText: 'OK',
        headers: {}
      };
      vi.mocked(mockHttpClient.get).mockResolvedValue(mockHttpResponse);

      // Act
      const result = await notionRepository.getDatabase(databaseId);

      // Assert
      expect(mockHttpClient.get).toHaveBeenCalledWith(`/databases/${databaseId}`);
      expect(result).toBeInstanceOf(Database);
      expect(result.id).toBe(databaseId);
      expect(result.title).toBe('Test Database');
      expect(result.properties).toEqual(mockDatabaseResponse.properties);
    });

    it('should handle API errors when getting database', async () => {
      // Arrange
      const databaseId = 'invalid-database-id';
      const mockError = {
        response: {
          status: 404,
          data: {
            message: 'Database not found',
            code: 'object_not_found',
            request_id: 'test-request-id'
          }
        }
      };
      vi.mocked(mockHttpClient.get).mockRejectedValue(mockError);

      // Act & Assert
      await expect(notionRepository.getDatabase(databaseId)).rejects.toEqual(mockError);
      expect(mockHttpClient.get).toHaveBeenCalledWith(`/databases/${databaseId}`);
    });

    it('should handle network errors when getting database', async () => {
      // Arrange
      const databaseId = 'test-database-id';
      const mockError = new Error('Network error');
      vi.mocked(mockHttpClient.get).mockRejectedValue(mockError);

      // Act & Assert
      await expect(notionRepository.getDatabase(databaseId)).rejects.toEqual(mockError);
    });
  });

  describe('getPage', () => {
    const mockPageResponse: NotionPageResponse = {
      id: 'test-page-id',
      properties: { Name: { title: [{ plain_text: 'Test Page' }] } },
      created_time: '2023-01-01T00:00:00.000Z',
      last_edited_time: '2023-01-01T00:00:00.000Z',
      url: 'https://notion.so/test-page'
    };

    it('should successfully get a page', async () => {
      // Arrange
      const pageId = 'test-page-id';
      const mockHttpResponse: HttpResponse<NotionPageResponse> = {
        data: mockPageResponse,
        status: 200,
        statusText: 'OK',
        headers: {}
      };
      vi.mocked(mockHttpClient.get).mockResolvedValue(mockHttpResponse);

      // Act
      const result = await notionRepository.getPage(pageId);

      // Assert
      expect(mockHttpClient.get).toHaveBeenCalledWith(`/pages/${pageId}`);
      expect(result).toBeInstanceOf(Page);
      expect(result.id).toBe(pageId);
      expect(result.properties).toEqual(mockPageResponse.properties);
    });

    it('should handle errors when getting page', async () => {
      // Arrange
      const pageId = 'invalid-page-id';
      const mockError = new Error('Page not found');
      vi.mocked(mockHttpClient.get).mockRejectedValue(mockError);

      // Act & Assert
      await expect(notionRepository.getPage(pageId)).rejects.toEqual(mockError);
    });
  });


  describe('queryDatabase', () => {
    const mockPagesResponse = {
      results: [
        {
          id: 'page-1',
          properties: { Name: { title: [{ plain_text: 'Page 1' }] } },
          created_time: '2023-01-01T00:00:00.000Z',
          last_edited_time: '2023-01-01T00:00:00.000Z',
          url: 'https://notion.so/page-1'
        },
        {
          id: 'page-2',
          properties: { Name: { title: [{ plain_text: 'Page 2' }] } },
          created_time: '2023-01-02T00:00:00.000Z',
          last_edited_time: '2023-01-02T00:00:00.000Z',
          url: 'https://notion.so/page-2'
        }
      ] as NotionPageResponse[]
    };

    it('should successfully query database without filters', async () => {
      // Arrange
      const databaseId = 'test-database-id';
      const mockHttpResponse: HttpResponse<{ results: NotionPageResponse[] }> = {
        data: mockPagesResponse,
        status: 200,
        statusText: 'OK',
        headers: {}
      };
      vi.mocked(mockHttpClient.post).mockResolvedValue(mockHttpResponse);

      // Act
      const result = await notionRepository.queryDatabase(databaseId);

      // Assert
      expect(mockHttpClient.post).toHaveBeenCalledWith(
        `/databases/${databaseId}/query`,
        {}
      );
      expect(result).toHaveLength(2);
      expect(result[0]).toBeInstanceOf(Page);
      expect(result[1]).toBeInstanceOf(Page);
      expect(result[0].id).toBe('page-1');
      expect(result[1].id).toBe('page-2');
    });

    it('should successfully query database with filters and sorts', async () => {
      // Arrange
      const databaseId = 'test-database-id';
      const filter = { property: 'Status', select: { equals: 'Done' } };
      const sorts = [{ property: 'Name', direction: 'ascending' }];
      const mockHttpResponse: HttpResponse<{ results: NotionPageResponse[] }> = {
        data: mockPagesResponse,
        status: 200,
        statusText: 'OK',
        headers: {}
      };
      vi.mocked(mockHttpClient.post).mockResolvedValue(mockHttpResponse);

      // Act
      const result = await notionRepository.queryDatabase(databaseId, filter, sorts);

      // Assert
      expect(mockHttpClient.post).toHaveBeenCalledWith(
        `/databases/${databaseId}/query`,
        {
          filter,
          sorts
        }
      );
      expect(result).toHaveLength(2);
    });

    it('should handle errors when querying database', async () => {
      // Arrange
      const databaseId = 'invalid-database-id';
      const mockError = new Error('Database query failed');
      vi.mocked(mockHttpClient.post).mockRejectedValue(mockError);

      // Act & Assert
      await expect(notionRepository.queryDatabase(databaseId)).rejects.toEqual(mockError);
    });

    it('should handle empty results from database query', async () => {
      // Arrange
      const databaseId = 'test-database-id';
      const mockHttpResponse: HttpResponse<{ results: NotionPageResponse[] }> = {
        data: { results: [] },
        status: 200,
        statusText: 'OK',
        headers: {}
      };
      vi.mocked(mockHttpClient.post).mockResolvedValue(mockHttpResponse);

      // Act
      const result = await notionRepository.queryDatabase(databaseId);

      // Assert
      expect(result).toHaveLength(0);
    });
  });

  describe('error handling', () => {
    it('should preserve original error when re-throwing', async () => {
      // Arrange
      const customError = new Error('Custom error message');
      vi.mocked(mockHttpClient.get).mockRejectedValue(customError);

      // Act & Assert
      await expect(notionRepository.getDatabase('test-id')).rejects.toEqual(customError);
    });

    it('should handle errors without response property', async () => {
      // Arrange
      const networkError = new Error('Network timeout');
      vi.mocked(mockHttpClient.get).mockRejectedValue(networkError);

      // Act & Assert
      await expect(notionRepository.getDatabase('test-id')).rejects.toEqual(networkError);
    });
  });
}); 