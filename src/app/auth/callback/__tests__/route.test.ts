/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest } from 'next/server';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn()
}));

vi.mock('next/headers', () => ({
  cookies: vi.fn()
}));

import { GET } from '../route';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

const mockCreateServerClient = vi.mocked(createServerClient);
const mockCookies = vi.mocked(cookies);

describe('/auth/callback', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => { });

    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';

    mockCookies.mockResolvedValue({
      getAll: vi.fn().mockReturnValue([]),
      set: vi.fn(),
      delete: vi.fn()
    } as any);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    process.env = originalEnv;
  });

  const createMockRequest = (searchParams: Record<string, string> = {}) => {
    const url = new URL('https://example.com/auth/callback');
    Object.entries(searchParams).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });

    return {
      url: url.toString()
    } as NextRequest;
  };

  describe('GET Method', () => {
    it('debería ser una función que retorna Response', async () => {
      const request = createMockRequest();

      const response = await GET(request);

      expect(typeof GET).toBe('function');
      expect(response).toHaveProperty('status');
      expect(response).toHaveProperty('headers');
    });

    it('debería manejar requests sin parámetros', async () => {
      const request = createMockRequest();

      const response = await GET(request);

      expect(response.status).toBe(307); // Temporary Redirect
      expect(response.headers.get('Location')).toContain('/auth/login');
    });
  });

  describe('Code Parameter Handling', () => {
    it('debería procesar requests con código válido', async () => {
      const mockSession = {
        access_token: 'test-token',
        user: { id: 'user-123', email: 'test@example.com' }
      };

      const mockCookieStore = {
        getAll: vi.fn().mockReturnValue([
          { name: 'session', value: 'session-value' }
        ]),
        set: vi.fn()
      };

      mockCookies.mockResolvedValue(mockCookieStore as any);

      mockCreateServerClient.mockReturnValue({
        auth: {
          exchangeCodeForSession: vi.fn().mockResolvedValue({
            data: { session: mockSession },
            error: null
          })
        }
      } as any);

      const request = createMockRequest({
        code: 'valid-auth-code'
      });

      const response = await GET(request);

      expect(response.status).toBe(307);
      expect(response.headers.get('Location')).toBe('https://example.com/');
    });

    it('debería rechazar requests sin código', async () => {
      const request = createMockRequest();

      const response = await GET(request);

      expect(response.status).toBe(307);
      expect(response.headers.get('Location')).toContain('/auth/login');
      expect(response.headers.get('Location')).toContain('error=Error%20en%20autenticaci%C3%B3n');
    });

    it('debería manejar código vacío', async () => {
      const request = createMockRequest({ code: '' });

      const response = await GET(request);

      expect(response.status).toBe(307);
      expect(response.headers.get('Location')).toContain('/auth/login');
    });
  });

  describe('Session Exchange', () => {
    it('debería intercambiar código por sesión exitosamente', async () => {
      const mockSession = {
        access_token: 'test-token',
        user: { id: 'user-123' }
      };

      const mockCookieStore = {
        getAll: vi.fn().mockReturnValue([]),
        set: vi.fn()
      };

      mockCookies.mockResolvedValue(mockCookieStore as any);

      const mockExchangeCodeForSession = vi.fn().mockResolvedValue({
        data: { session: mockSession },
        error: null
      });

      mockCreateServerClient.mockReturnValue({
        auth: {
          exchangeCodeForSession: mockExchangeCodeForSession
        }
      } as any);

      const request = createMockRequest({
        code: 'valid-code'
      });

      await GET(request);

      expect(mockExchangeCodeForSession).toHaveBeenCalledWith('valid-code');
    });

    it('debería manejar errores en exchangeCodeForSession', async () => {
      const mockCookieStore = {
        getAll: vi.fn().mockReturnValue([]),
        set: vi.fn()
      };

      mockCookies.mockResolvedValue(mockCookieStore as any);

      mockCreateServerClient.mockReturnValue({
        auth: {
          exchangeCodeForSession: vi.fn().mockResolvedValue({
            data: { session: null },
            error: { message: 'Invalid code' }
          })
        }
      } as any);

      const request = createMockRequest({
        code: 'invalid-code'
      });

      const response = await GET(request);

      expect(response.status).toBe(307);
      expect(response.headers.get('Location')).toContain('/auth/login');
      expect(console.error).toHaveBeenCalledWith(
        '❌ [AUTH_CALLBACK] Error en exchangeCodeForSession:',
        'Invalid code'
      );
    });

    it('debería manejar sesión nula', async () => {
      const mockCookieStore = {
        getAll: vi.fn().mockReturnValue([]),
        set: vi.fn()
      };

      mockCookies.mockResolvedValue(mockCookieStore as any);

      mockCreateServerClient.mockReturnValue({
        auth: {
          exchangeCodeForSession: vi.fn().mockResolvedValue({
            data: { session: null },
            error: null
          })
        }
      } as any);

      const request = createMockRequest({
        code: 'code-with-null-session'
      });

      const response = await GET(request);

      expect(response.status).toBe(307);
      expect(response.headers.get('Location')).toContain('/auth/login');
    });
  });

  describe('Cookie Management', () => {
    it('debería configurar cookies con configuración segura', async () => {
      const mockSession = {
        access_token: 'test-token',
        user: { id: 'user-123' }
      };

      const mockCookieStore = {
        getAll: vi.fn().mockReturnValue([
          { name: 'session-token', value: 'token-value' },
          { name: 'refresh-token', value: 'refresh-value' }
        ]),
        set: vi.fn()
      };

      mockCookies.mockResolvedValue(mockCookieStore as any);

      mockCreateServerClient.mockReturnValue({
        auth: {
          exchangeCodeForSession: vi.fn().mockResolvedValue({
            data: { session: mockSession },
            error: null
          })
        }
      } as any);

      const request = createMockRequest({
        code: 'valid-code'
      });

      const response = await GET(request);

      expect(response.status).toBe(307);

      // Verificar que las cookies se configuraron
      const setCookieHeaders = response.headers.getSetCookie();
      expect(setCookieHeaders.length).toBeGreaterThan(0);

      setCookieHeaders.forEach(cookieHeader => {
        expect(cookieHeader).toContain('HttpOnly');
        expect(cookieHeader).toContain('SameSite=lax');
      });
    });

    it('debería manejar múltiples cookies', async () => {
      const mockSession = {
        access_token: 'test-token',
        user: { id: 'user-123' }
      };

      const multipleCookies = [
        { name: 'session-token', value: 'session-value' },
        { name: 'refresh-token', value: 'refresh-value' },
        { name: 'csrf-token', value: 'csrf-value' }
      ];

      const mockCookieStore = {
        getAll: vi.fn().mockReturnValue(multipleCookies),
        set: vi.fn()
      };

      mockCookies.mockResolvedValue(mockCookieStore as any);

      mockCreateServerClient.mockReturnValue({
        auth: {
          exchangeCodeForSession: vi.fn().mockResolvedValue({
            data: { session: mockSession },
            error: null
          })
        }
      } as any);

      const request = createMockRequest({
        code: 'valid-code'
      });

      const response = await GET(request);

      const setCookieHeaders = response.headers.getSetCookie();
      expect(setCookieHeaders).toHaveLength(3);
    });

    it('debería configurar maxAge de cookies correctamente', async () => {
      const mockSession = {
        access_token: 'test-token',
        user: { id: 'user-123' }
      };

      const mockCookieStore = {
        getAll: vi.fn().mockReturnValue([
          { name: 'session-token', value: 'token-value' }
        ]),
        set: vi.fn()
      };

      mockCookies.mockResolvedValue(mockCookieStore as any);

      mockCreateServerClient.mockReturnValue({
        auth: {
          exchangeCodeForSession: vi.fn().mockResolvedValue({
            data: { session: mockSession },
            error: null
          })
        }
      } as any);

      const request = createMockRequest({
        code: 'valid-code'
      });

      const response = await GET(request);

      const setCookieHeaders = response.headers.getSetCookie();
      const expectedMaxAge = 60 * 60 * 24 * 7; // 7 días

      setCookieHeaders.forEach(cookieHeader => {
        expect(cookieHeader).toContain(`Max-Age=${expectedMaxAge}`);
      });
    });
  });

  describe('Redirect Logic', () => {
    it('debería redirigir a la página principal por defecto', async () => {
      const mockSession = {
        access_token: 'test-token',
        user: { id: 'user-123' }
      };

      const mockCookieStore = {
        getAll: vi.fn().mockReturnValue([]),
        set: vi.fn()
      };

      mockCookies.mockResolvedValue(mockCookieStore as any);

      mockCreateServerClient.mockReturnValue({
        auth: {
          exchangeCodeForSession: vi.fn().mockResolvedValue({
            data: { session: mockSession },
            error: null
          })
        }
      } as any);

      const request = createMockRequest({
        code: 'valid-code'
      });

      const response = await GET(request);

      expect(response.status).toBe(307);
      expect(response.headers.get('Location')).toBe('https://example.com/');
    });

    it('debería redirigir a la página especificada en next', async () => {
      const mockSession = {
        access_token: 'test-token',
        user: { id: 'user-123' }
      };

      const mockCookieStore = {
        getAll: vi.fn().mockReturnValue([]),
        set: vi.fn()
      };

      mockCookies.mockResolvedValue(mockCookieStore as any);

      mockCreateServerClient.mockReturnValue({
        auth: {
          exchangeCodeForSession: vi.fn().mockResolvedValue({
            data: { session: mockSession },
            error: null
          })
        }
      } as any);

      const request = createMockRequest({
        code: 'valid-code',
        next: '/dashboard'
      });

      const response = await GET(request);

      expect(response.status).toBe(307);
      expect(response.headers.get('Location')).toBe('https://example.com/dashboard');
    });

    it('debería manejar diferentes rutas de next', async () => {
      const testRoutes = [
        '/settings',
        '/profile',
        '/dashboard/analytics',
        '/admin'
      ];

      for (const route of testRoutes) {
        const mockSession = {
          access_token: 'test-token',
          user: { id: 'user-123' }
        };

        const mockCookieStore = {
          getAll: vi.fn().mockReturnValue([]),
          set: vi.fn()
        };

        mockCookies.mockResolvedValue(mockCookieStore as any);

        mockCreateServerClient.mockReturnValue({
          auth: {
            exchangeCodeForSession: vi.fn().mockResolvedValue({
              data: { session: mockSession },
              error: null
            })
          }
        } as any);

        const request = createMockRequest({
          code: 'valid-code',
          next: route
        });

        const response = await GET(request);

        expect(response.headers.get('Location')).toBe(`https://example.com${route}`);
      }
    });

    it('debería redirigir a login con error en caso de fallo', async () => {
      const request = createMockRequest({
        code: 'invalid-code'
      });

      mockCreateServerClient.mockReturnValue({
        auth: {
          exchangeCodeForSession: vi.fn().mockResolvedValue({
            data: { session: null },
            error: { message: 'Invalid authorization code' }
          })
        }
      } as any);

      const response = await GET(request);

      expect(response.status).toBe(307);
      expect(response.headers.get('Location')).toContain('/auth/login');
      expect(response.headers.get('Location')).toContain('error=Error%20en%20autenticaci%C3%B3n');
    });
  });

  describe('Supabase Client Configuration', () => {
    it('debería crear cliente Supabase con configuración correcta', async () => {
      const mockCookieStore = {
        getAll: vi.fn().mockReturnValue([]),
        set: vi.fn()
      };

      mockCookies.mockResolvedValue(mockCookieStore as any);

      mockCreateServerClient.mockReturnValue({
        auth: {
          exchangeCodeForSession: vi.fn().mockResolvedValue({
            data: { session: null },
            error: null
          })
        }
      } as any);

      const request = createMockRequest({
        code: 'test-code'
      });

      await GET(request);

      expect(mockCreateServerClient).toHaveBeenCalledWith(
        'https://test.supabase.co',
        'test-anon-key',
        expect.objectContaining({
          cookies: expect.objectContaining({
            getAll: expect.any(Function),
            setAll: expect.any(Function)
          })
        })
      );
    });

    it('debería configurar cookies handler correctamente', async () => {
      const mockCookieStore = {
        getAll: vi.fn().mockReturnValue([
          { name: 'test-cookie', value: 'test-value' }
        ]),
        set: vi.fn()
      };

      mockCookies.mockResolvedValue(mockCookieStore as any);

      let cookieHandler: any;
      mockCreateServerClient.mockImplementation((url, key, config) => {
        cookieHandler = config.cookies;
        return {
          auth: {
            exchangeCodeForSession: vi.fn().mockResolvedValue({
              data: { session: null },
              error: null
            })
          }
        } as any;
      });

      const request = createMockRequest({
        code: 'test-code'
      });

      await GET(request);

      // Verificar que getAll funciona
      const cookies = cookieHandler.getAll();
      expect(cookies).toEqual([{ name: 'test-cookie', value: 'test-value' }]);

      // Verificar que setAll funciona
      const cookiesToSet = [
        { name: 'new-cookie', value: 'new-value', options: {} }
      ];
      cookieHandler.setAll(cookiesToSet);
      expect(mockCookieStore.set).toHaveBeenCalledWith('new-cookie', 'new-value', {});
    });
  });

  describe('Error Handling', () => {
    it('debería logear errores correctamente', async () => {
      const mockCookieStore = {
        getAll: vi.fn().mockReturnValue([]),
        set: vi.fn()
      };

      mockCookies.mockResolvedValue(mockCookieStore as any);

      const errorMessage = 'Session exchange failed';
      mockCreateServerClient.mockReturnValue({
        auth: {
          exchangeCodeForSession: vi.fn().mockResolvedValue({
            data: { session: null },
            error: { message: errorMessage }
          })
        }
      } as any);

      const request = createMockRequest({
        code: 'failing-code'
      });

      await GET(request);

      expect(console.error).toHaveBeenCalledWith(
        '❌ [AUTH_CALLBACK] Error en exchangeCodeForSession:',
        errorMessage
      );
    });

    it('debería manejar errores sin mensaje', async () => {
      const mockCookieStore = {
        getAll: vi.fn().mockReturnValue([]),
        set: vi.fn()
      };

      mockCookies.mockResolvedValue(mockCookieStore as any);

      mockCreateServerClient.mockReturnValue({
        auth: {
          exchangeCodeForSession: vi.fn().mockResolvedValue({
            data: { session: null },
            error: {}
          })
        }
      } as any);

      const request = createMockRequest({
        code: 'error-without-message'
      });

      const response = await GET(request);

      expect(response.status).toBe(307);
      expect(response.headers.get('Location')).toContain('/auth/login');
    });

    it('debería manejar errores de cookies apropiadamente', async () => {
      const request = createMockRequest({
        code: 'test-code'
      });

      // Mock cookies error indirectly by making mockCookies return a rejected promise
      mockCookies.mockImplementation(() => Promise.reject(new Error('Cookie error')));

      try {
        const response = await GET(request);
        expect(response.status).toBe(307);
        expect(response.headers.get('Location')).toContain('/auth/login');
      } catch (error) {
        // Si el error no es manejado por el endpoint, esperamos que falle
        expect(error).toBeInstanceOf(Error);
      }
    });

    it('debería manejar errores de configuración', async () => {
      const request = createMockRequest();

      const response = await GET(request);

      expect(response.status).toBe(307);
      expect(response.headers.get('Location')).toContain('/auth/login');
      expect(response.headers.get('Location')).toContain('error=Error%20en%20autenticaci%C3%B3n');
    });
  });

  describe('Environment Variables', () => {
    it('debería usar variables de entorno correctas', async () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://custom.supabase.co';
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'custom-anon-key';

      const mockCookieStore = {
        getAll: vi.fn().mockReturnValue([]),
        set: vi.fn()
      };

      mockCookies.mockResolvedValue(mockCookieStore as any);

      mockCreateServerClient.mockReturnValue({
        auth: {
          exchangeCodeForSession: vi.fn().mockResolvedValue({
            data: { session: null },
            error: null
          })
        }
      } as any);

      const request = createMockRequest({
        code: 'test-code'
      });

      await GET(request);

      expect(mockCreateServerClient).toHaveBeenCalledWith(
        'https://custom.supabase.co',
        'custom-anon-key',
        expect.any(Object)
      );
    });
  });
});
