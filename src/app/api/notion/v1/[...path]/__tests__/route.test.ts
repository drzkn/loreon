import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';

// Usar el sistema centralizado de mocks
import {
  createTestSetup
} from '@/mocks';

// Mock global fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock más simple para NextResponse
vi.mock('next/server', async () => {
  const actual = await vi.importActual('next/server');

  class MockNextResponse {
    body: string | null;
    status: number;
    statusText: string;
    headers: {
      set: (key: string, value: string) => void;
      get: (key: string) => string | undefined;
      has: (key: string) => boolean;
      delete: (key: string) => boolean;
    };

    constructor(body?: string | null, init?: ResponseInit) {
      this.body = body || null;
      this.status = init?.status || 200;
      this.statusText = init?.statusText || 'OK';

      const headers = new Map();
      this.headers = {
        set: vi.fn((key: string, value: string) => headers.set(key, value)),
        get: vi.fn((key: string) => headers.get(key)),
        has: vi.fn((key: string) => headers.has(key)),
        delete: vi.fn((key: string) => headers.delete(key))
      };
    }

    static json(data: unknown, init?: ResponseInit) {
      const headers = new Map();
      return {
        body: JSON.stringify(data),
        status: init?.status || 200,
        statusText: init?.statusText || 'OK',
        headers: {
          set: vi.fn((key: string, value: string) => headers.set(key, value)),
          get: vi.fn((key: string) => headers.get(key)),
          has: vi.fn((key: string) => headers.has(key)),
          delete: vi.fn((key: string) => headers.delete(key))
        }
      };
    }
  }

  return {
    ...actual,
    NextResponse: MockNextResponse
  };
});

// Importar después de los mocks
import { GET, POST, OPTIONS } from '../route';

// Helper para crear un NextRequest más realista
const createMockRequest = (url: string, options?: RequestInit) => {
  const urlObj = new URL(url);
  const request = {
    method: options?.method || 'GET',
    url,
    nextUrl: {
      searchParams: urlObj.searchParams
    },
    text: vi.fn().mockResolvedValue(options?.body?.toString() || ''),
    json: vi.fn().mockResolvedValue(options?.body ? JSON.parse(options.body.toString()) : {}),
    headers: new Map(),
    ...options
  };
  return request as unknown as NextRequest;
};

const createParams = (path: string[]) => Promise.resolve({ path });

describe('Notion API Proxy', () => {
  let originalEnv: NodeJS.ProcessEnv;
  const { teardown } = createTestSetup(); // ✅ Console mocks centralizados

  beforeEach(() => {
    originalEnv = process.env;
    vi.clearAllMocks();

    // Setup default environment
    process.env.NOTION_API_KEY = 'test-api-key';
  });

  afterEach(() => {
    teardown(); // ✅ Limpieza automática
    process.env = originalEnv;
  });

  describe('🔑 Authentication & Configuration', () => {
    it('should fallback to NOTION_API_KEY', async () => {
      process.env.NOTION_API_KEY = 'fallback-api-key';

      mockFetch.mockResolvedValue({
        status: 200,
        statusText: 'OK',
        text: () => Promise.resolve('{"data": "success"}'),
        headers: new Map([['content-type', 'application/json']])
      });

      const request = createMockRequest('http://localhost:3000/api/notion/v1/databases');
      const params = createParams(['databases']);

      await GET(request, { params });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.notion.com/v1/databases',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer fallback-api-key'
          })
        })
      );
    });

    it('should return 500 when no API key is configured', async () => {
      delete process.env.VITE_NOTION_API_KEY;
      delete process.env.NOTION_API_KEY;

      const request = createMockRequest('http://localhost:3000/api/notion/v1/databases');
      const params = createParams(['databases']);

      const response = await GET(request, { params });

      expect(response.body).toContain('Notion API key not configured on server');
      expect(response.status).toBe(500);
    });
  });

  describe('🛣️ Path & URL Construction', () => {
    beforeEach(() => {
      mockFetch.mockResolvedValue({
        status: 200,
        statusText: 'OK',
        text: () => Promise.resolve('{"data": "success"}'),
        headers: new Map()
      });
    });

    it('should handle simple paths correctly', async () => {
      const request = createMockRequest('http://localhost:3000/api/notion/v1/databases');
      const params = createParams(['databases']);

      await GET(request, { params });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.notion.com/v1/databases',
        expect.any(Object)
      );
    });

    it('should handle nested paths correctly', async () => {
      const request = createMockRequest('http://localhost:3000/api/notion/v1/databases/123/query');
      const params = createParams(['databases', '123', 'query']);

      await POST(request, { params });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.notion.com/v1/databases/123/query',
        expect.any(Object)
      );
    });

    it('should preserve query parameters', async () => {
      const request = createMockRequest('http://localhost:3000/api/notion/v1/databases?page_size=10&start_cursor=abc');
      const params = createParams(['databases']);

      await GET(request, { params });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.notion.com/v1/databases?page_size=10&start_cursor=abc',
        expect.any(Object)
      );
    });
  });

  describe('🔧 HTTP Methods', () => {
    beforeEach(() => {
      mockFetch.mockResolvedValue({
        status: 200,
        statusText: 'OK',
        text: () => Promise.resolve('{"data": "success"}'),
        headers: new Map()
      });
    });

    it('should handle GET requests', async () => {
      const request = createMockRequest('http://localhost:3000/api/notion/v1/databases');
      const params = createParams(['databases']);

      await GET(request, { params });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: 'GET'
        })
      );
    });

    it('should handle POST requests with body', async () => {
      const requestBody = JSON.stringify({ filter: { property: 'Status', checkbox: { equals: true } } });
      const request = createMockRequest('http://localhost:3000/api/notion/v1/databases/123/query', {
        method: 'POST',
        body: requestBody
      });

      const params = createParams(['databases', '123', 'query']);

      await POST(request, { params });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: 'POST',
          body: requestBody
        })
      );
    });

    it('should handle OPTIONS requests correctly', async () => {
      const response = await OPTIONS();

      expect(response.status).toBe(200);
      expect(response.body).toBeNull();
    });
  });

  describe('📝 Request Headers', () => {
    beforeEach(() => {
      mockFetch.mockResolvedValue({
        status: 200,
        statusText: 'OK',
        text: () => Promise.resolve('{"data": "success"}'),
        headers: new Map()
      });
    });

    it('should include required Notion headers', async () => {
      const request = createMockRequest('http://localhost:3000/api/notion/v1/databases');
      const params = createParams(['databases']);

      await GET(request, { params });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-api-key',
            'Notion-Version': '2022-06-28',
            'Content-Type': 'application/json'
          })
        })
      );
    });
  });

  describe('📤 Response Handling', () => {
    it('should proxy successful responses with correct status', async () => {
      const responseData = '{"results": [{"id": "123"}]}';
      mockFetch.mockResolvedValue({
        status: 200,
        statusText: 'OK',
        text: () => Promise.resolve(responseData),
        headers: new Map([['content-type', 'application/json']])
      });

      const request = createMockRequest('http://localhost:3000/api/notion/v1/databases');
      const params = createParams(['databases']);

      const response = await GET(request, { params });

      expect(response.body).toBe(responseData);
      expect(response.status).toBe(200);
      expect(response.statusText).toBe('OK');
    });

    it('should proxy error responses with correct status', async () => {
      const errorData = '{"object": "error", "status": 404, "code": "object_not_found"}';
      mockFetch.mockResolvedValue({
        status: 404,
        statusText: 'Not Found',
        text: () => Promise.resolve(errorData),
        headers: new Map([['content-type', 'application/json']])
      });

      const request = createMockRequest('http://localhost:3000/api/notion/v1/databases/invalid');
      const params = createParams(['databases', 'invalid']);

      const response = await GET(request, { params });

      expect(response.body).toBe(errorData);
      expect(response.status).toBe(404);
      expect(response.statusText).toBe('Not Found');
    });

    it('should handle network errors gracefully', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      const request = createMockRequest('http://localhost:3000/api/notion/v1/databases');
      const params = createParams(['databases']);

      const response = await GET(request, { params });

      expect(response.body).toContain('Proxy error');
      expect(response.status).toBe(500);
    });
  });

  describe('🔄 Body Handling', () => {
    beforeEach(() => {
      mockFetch.mockResolvedValue({
        status: 200,
        statusText: 'OK',
        text: () => Promise.resolve('{"data": "success"}'),
        headers: new Map()
      });
    });

    it('should handle empty body for POST requests', async () => {
      const request = createMockRequest('http://localhost:3000/api/notion/v1/databases/123/query', {
        method: 'POST'
      });
      request.text = vi.fn().mockResolvedValue('');

      const params = createParams(['databases', '123', 'query']);

      await POST(request, { params });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: 'POST'
        })
      );
    });

    it('should handle body reading errors gracefully', async () => {
      const request = createMockRequest('http://localhost:3000/api/notion/v1/databases/123/query', {
        method: 'POST'
      });
      request.text = vi.fn().mockRejectedValue(new Error('Body reading error'));

      const params = createParams(['databases', '123', 'query']);

      const response = await POST(request, { params });

      expect(response).toBeDefined();
      expect(mockFetch).toHaveBeenCalled();
    });
  });

  describe('🌐 CORS Handling', () => {
    beforeEach(() => {
      mockFetch.mockResolvedValue({
        status: 200,
        statusText: 'OK',
        text: () => Promise.resolve('{"data": "success"}'),
        headers: new Map([['content-type', 'application/json']])
      });
    });

    it('should add CORS headers to successful responses', async () => {
      const request = createMockRequest('http://localhost:3000/api/notion/v1/databases');
      const params = createParams(['databases']);

      const response = await GET(request, { params });

      expect(response.headers.set).toHaveBeenCalledWith('Access-Control-Allow-Origin', '*');
      expect(response.headers.set).toHaveBeenCalledWith('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      expect(response.headers.set).toHaveBeenCalledWith('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    });
  });
}); 