import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import axios, { AxiosResponse } from 'axios';
import { AxiosHttpClient } from '../AxiosHttpClient';
import { HttpRequestConfig } from '../../../../../ports/output/services/IHttpClient';

// Usar el sistema centralizado de mocks
import {
  createTestSetup
} from '@/mocks';

// Mock de axios
vi.mock('axios');

describe('AxiosHttpClient', () => {
  const mockAxios = vi.mocked(axios);
  const { teardown } = createTestSetup(); // ✅ Console mocks centralizados

  const mockAxiosInstance = {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockAxios.create = vi.fn().mockReturnValue(mockAxiosInstance);
  });

  afterEach(() => {
    teardown(); // ✅ Limpieza automática
  });

  describe('Constructor', () => {
    it('should create axios instance with default configuration', () => {
      new AxiosHttpClient();

      expect(mockAxios.create).toHaveBeenCalledWith({
        baseURL: undefined,
        headers: {
          'Content-Type': 'application/json',
        }
      });
    });

    it('should create axios instance with custom baseURL and headers', () => {
      const baseURL = 'https://api.example.com';
      const customHeaders = { 'Authorization': 'Bearer token123' };

      new AxiosHttpClient(baseURL, customHeaders);

      expect(mockAxios.create).toHaveBeenCalledWith({
        baseURL,
        headers: {
          'Content-Type': 'application/json',
          ...customHeaders
        }
      });
    });
  });

  describe('HTTP Methods - Success Cases', () => {
    let httpClient: AxiosHttpClient;
    const mockResponseData = { id: 1, name: 'Test' };
    const mockAxiosResponse: AxiosResponse = {
      data: mockResponseData,
      status: 200,
      statusText: 'OK',
      headers: { 'content-type': 'application/json' },
      config: {} as AxiosResponse['config'],
      request: {} as AxiosResponse['request']
    };

    beforeEach(() => {
      httpClient = new AxiosHttpClient();
    });

    it('should make GET request', async () => {
      const config: HttpRequestConfig = { headers: { 'X-Test': 'value' } };
      mockAxiosInstance.get.mockResolvedValue(mockAxiosResponse);

      const result = await httpClient.get('/test', config);

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/test', config);
      expect(result).toEqual({
        data: mockResponseData,
        status: 200,
        statusText: 'OK',
        headers: { 'content-type': 'application/json' }
      });
    });

    it('should make POST request', async () => {
      const data = { name: 'test' };
      const config: HttpRequestConfig = { headers: { 'X-Test': 'value' } };
      mockAxiosInstance.post.mockResolvedValue(mockAxiosResponse);

      const result = await httpClient.post('/test', data, config);

      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/test', data, config);
      expect(result).toEqual({
        data: mockResponseData,
        status: 200,
        statusText: 'OK',
        headers: { 'content-type': 'application/json' }
      });
    });

    it('should make PUT request', async () => {
      const data = { name: 'updated' };
      mockAxiosInstance.put.mockResolvedValue(mockAxiosResponse);

      const result = await httpClient.put('/test', data);

      expect(mockAxiosInstance.put).toHaveBeenCalledWith('/test', data, undefined);
      expect(result).toEqual({
        data: mockResponseData,
        status: 200,
        statusText: 'OK',
        headers: { 'content-type': 'application/json' }
      });
    });

    it('should make DELETE request', async () => {
      mockAxiosInstance.delete.mockResolvedValue(mockAxiosResponse);

      const result = await httpClient.delete('/test');

      expect(mockAxiosInstance.delete).toHaveBeenCalledWith('/test', undefined);
      expect(result).toEqual({
        data: mockResponseData,
        status: 200,
        statusText: 'OK',
        headers: { 'content-type': 'application/json' }
      });
    });
  });

  describe('Response Mapping', () => {
    let httpClient: AxiosHttpClient;

    beforeEach(() => {
      httpClient = new AxiosHttpClient();
    });

    it('should correctly map axios response to HttpResponse', async () => {
      const mockAxiosResponse: AxiosResponse = {
        data: { message: 'success' },
        status: 201,
        statusText: 'Created',
        headers: { 'content-type': 'application/json', 'x-custom-header': 'test-value' },
        config: {} as AxiosResponse['config'],
        request: {} as AxiosResponse['request']
      };

      mockAxiosInstance.get.mockResolvedValue(mockAxiosResponse);

      const result = await httpClient.get('/test');

      expect(result).toEqual({
        data: { message: 'success' },
        status: 201,
        statusText: 'Created',
        headers: { 'content-type': 'application/json', 'x-custom-header': 'test-value' }
      });
    });

    it('should handle different response types', async () => {
      const mockAxiosResponse: AxiosResponse = {
        data: 'plain text response',
        status: 200,
        statusText: 'OK',
        headers: { 'content-type': 'text/plain' },
        config: {} as AxiosResponse['config'],
        request: {} as AxiosResponse['request']
      };

      mockAxiosInstance.get.mockResolvedValue(mockAxiosResponse);

      const result = await httpClient.get<string>('/test');

      expect(result.data).toBe('plain text response');
      expect(result.headers['content-type']).toBe('text/plain');
    });

    it('should handle empty response data', async () => {
      const mockAxiosResponse: AxiosResponse = {
        data: null,
        status: 204,
        statusText: 'No Content',
        headers: {},
        config: {} as AxiosResponse['config'],
        request: {} as AxiosResponse['request']
      };

      mockAxiosInstance.delete.mockResolvedValue(mockAxiosResponse);

      const result = await httpClient.delete('/test');

      expect(result.data).toBeNull();
      expect(result.status).toBe(204);
      expect(result.statusText).toBe('No Content');
    });
  });

  describe('Type Safety', () => {
    let httpClient: AxiosHttpClient;

    beforeEach(() => {
      httpClient = new AxiosHttpClient();
    });

    it('should maintain type safety for response data', async () => {
      interface TestResponse {
        id: number;
        name: string;
      }

      const mockResponse: TestResponse = { id: 1, name: 'Test' };
      const mockAxiosResponse: AxiosResponse<TestResponse> = {
        data: mockResponse,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as AxiosResponse['config'],
        request: {} as AxiosResponse['request']
      };

      mockAxiosInstance.get.mockResolvedValue(mockAxiosResponse);

      const result = await httpClient.get<TestResponse>('/test');

      expect(result.data.id).toBe(1);
      expect(result.data.name).toBe('Test');
    });
  });
});
