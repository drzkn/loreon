import { NextRequest } from 'next/server';
import { POST } from '../route';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('/api/auth/notion/verify-token', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'log').mockImplementation(() => { });
    vi.spyOn(console, 'error').mockImplementation(() => { });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const createMockRequest = (body: Record<string, unknown>) => {
    const mockRequest = {
      json: vi.fn().mockResolvedValue(body),
    } as unknown as NextRequest;
    return mockRequest;
  };

  describe('POST', () => {
    it('debería retornar error 400 cuando no se proporciona token', async () => {
      const request = createMockRequest({});

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Token is required');
    });

    it('debería retornar error 400 cuando el token está vacío', async () => {
      const request = createMockRequest({ token: '' });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Token is required');
    });

    it('debería retornar error 400 cuando el token es null', async () => {
      const request = createMockRequest({ token: null });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Token is required');
    });

    it('debería verificar token válido y retornar datos del usuario', async () => {
      const mockUserData = {
        id: 'user123',
        name: 'Test User',
        avatar_url: 'https://example.com/avatar.jpg',
        type: 'person',
        person: { email: 'test@example.com' }
      };

      (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue(mockUserData),
      });

      const request = createMockRequest({ token: 'valid_token_123' });

      const response = await POST(request);
      const data = await response.json();

      expect(fetch).toHaveBeenCalledWith('https://api.notion.com/v1/users/me', {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer valid_token_123',
          'Content-Type': 'application/json',
          'Notion-Version': '2022-06-28'
        }
      });

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.user).toEqual(mockUserData);
      expect(console.log).toHaveBeenCalledWith('✅ [API] Usuario obtenido:', 'Test User');
    });

    it('debería manejar token inválido (401)', async () => {
      const errorMessage = 'Unauthorized';

      (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 401,
        text: vi.fn().mockResolvedValue(errorMessage),
      });

      const request = createMockRequest({ token: 'invalid_token' });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Invalid token or API error');
      expect(data.details).toBe(errorMessage);
      expect(data.status).toBe(401);
      expect(console.error).toHaveBeenCalledWith('❌ [API] Error de Notion:', 401, errorMessage);
    });

    it('debería manejar error de servidor de Notion (500)', async () => {
      const errorMessage = 'Internal Server Error';

      (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: vi.fn().mockResolvedValue(errorMessage),
      });

      const request = createMockRequest({ token: 'valid_token' });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Invalid token or API error');
      expect(data.details).toBe(errorMessage);
      expect(data.status).toBe(500);
    });

    it('debería manejar error de red', async () => {
      const networkError = new Error('Network Error');

      (fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(networkError);

      const request = createMockRequest({ token: 'valid_token' });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
      expect(data.details).toBe('Network Error');
      expect(console.error).toHaveBeenCalledWith('💥 [API] Error en verify-token:', networkError);
    });

    it('debería manejar error desconocido', async () => {
      (fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce('Unknown error');

      const request = createMockRequest({ token: 'valid_token' });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
      expect(data.details).toBe('Unknown error');
    });

    it('debería manejar JSON malformado en el request', async () => {
      const mockRequest = {
        json: vi.fn().mockRejectedValue(new Error('Invalid JSON')),
      } as unknown as NextRequest;

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
      expect(data.details).toBe('Invalid JSON');
    });

    it('debería usar la versión correcta de la API de Notion', async () => {
      const mockUserData = { id: 'user123', name: 'Test User' };

      (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue(mockUserData),
      });

      const request = createMockRequest({ token: 'test_token' });
      await POST(request);

      expect(fetch).toHaveBeenCalledWith(
        'https://api.notion.com/v1/users/me',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Notion-Version': '2022-06-28'
          })
        })
      );
    });

    it('debería usar el método GET correcto', async () => {
      const mockUserData = { id: 'user123', name: 'Test User' };

      (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue(mockUserData),
      });

      const request = createMockRequest({ token: 'test_token' });
      await POST(request);

      expect(fetch).toHaveBeenCalledWith(
        'https://api.notion.com/v1/users/me',
        expect.objectContaining({
          method: 'GET'
        })
      );
    });
  });
});
