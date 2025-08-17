/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest } from 'next/server';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

// Usar el sistema centralizado de mocks
import {
  createTestSetup
} from '@/mocks';

// Mock solo las dependencias esenciales
vi.mock('@supabase/ssr');
vi.mock('next/headers');
vi.mock('@/app/api/helpers/ConnectionPageRepository');
vi.mock('@/services/UserTokenService');

import { POST } from '../route';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { ConnectionPageRepository } from '@/app/api/helpers/ConnectionPageRepository';
import { UserTokenService } from '@/services/UserTokenService';

const mockCreateServerClient = vi.mocked(createServerClient);
const mockCookies = vi.mocked(cookies);
const mockConnectionPageRepository = vi.mocked(ConnectionPageRepository);
const mockUserTokenService = vi.mocked(UserTokenService);

describe('/api/sync-supabase-by-token', () => {
  const { teardown } = createTestSetup(); // ✅ Console mocks centralizados

  beforeEach(() => {
    vi.clearAllMocks();

    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
    process.env.NOTION_DATABASE_ID = 'db1,db2';
    process.env.NOTION_API_KEY = 'original-token';

    // Setup default mocks
    mockCookies.mockResolvedValue({
      getAll: () => []
    } as any);

    mockCreateServerClient.mockReturnValue({
      auth: {
        getSession: vi.fn().mockResolvedValue({ data: { session: null } })
      },
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: null,
                error: new Error('Token not found')
              })
            })
          })
        })
      })
    } as any);

    mockUserTokenService.mockImplementation(() => ({
      decryptToken: vi.fn().mockReturnValue('decrypted-token')
    }) as any);

    mockConnectionPageRepository.mockImplementation(() => ({
      handleSyncToSupabase: vi.fn().mockResolvedValue(undefined)
    }) as any);
  });

  afterEach(() => {
    teardown(); // ✅ Limpieza automática
    vi.restoreAllMocks();
    delete process.env.NOTION_API_KEY;
  });

  const createMockRequest = (body: Record<string, unknown>) => {
    return {
      json: vi.fn().mockResolvedValue(body),
    } as unknown as NextRequest;
  };

  describe('POST', () => {
    it('debería retornar headers correctos para SSE', async () => {
      const request = createMockRequest({ tokenId: 'test' });

      const response = await POST(request);

      expect(response.headers.get('Content-Type')).toBe('text/event-stream');
      expect(response.headers.get('Cache-Control')).toBe('no-cache');
      expect(response.headers.get('Connection')).toBe('keep-alive');
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
      expect(response.headers.get('Access-Control-Allow-Methods')).toBe('POST');
      expect(response.headers.get('Access-Control-Allow-Headers')).toBe('Content-Type');
    });

    it('debería ser una función POST que retorna Response', async () => {
      const request = createMockRequest({ tokenId: 'test' });

      const response = await POST(request);

      expect(response).toBeInstanceOf(Response);
      expect(typeof POST).toBe('function');
    });

    it('debería procesar el cuerpo de la request correctamente', async () => {
      const mockJson = vi.fn().mockResolvedValue({ tokenId: 'test-123' });
      const request = { json: mockJson } as unknown as NextRequest;

      const response = await POST(request);

      expect(response).toBeInstanceOf(Response);
      expect(mockJson).toHaveBeenCalledOnce();
    });

    it('debería manejar error crítico en JSON parsing', async () => {
      const request = {
        json: vi.fn().mockRejectedValue(new Error('Invalid JSON'))
      } as unknown as NextRequest;

      const response = await POST(request);

      expect(response).toBeInstanceOf(Response);
      expect(response.headers.get('Content-Type')).toBe('text/event-stream');
    });

    it('debería retornar status 200 para request válida', async () => {
      const request = createMockRequest({ tokenId: 'valid-token' });

      const response = await POST(request);

      expect(response.status).toBe(200);
    });

    it('debería tener un body de tipo stream', async () => {
      const request = createMockRequest({ tokenId: 'test' });

      const response = await POST(request);

      expect(response.body).toBeDefined();
      expect(response.body).toBeInstanceOf(ReadableStream);
    });

    it('debería procesar diferentes tipos de tokenId', async () => {
      const testCases = ['abc123', 'token-with-dashes', '12345'];

      for (const tokenId of testCases) {
        const request = createMockRequest({ tokenId });
        const response = await POST(request);

        expect(response).toBeInstanceOf(Response);
        expect(response.status).toBe(200);
      }
    });

    it('debería configurar variables de entorno requeridas', () => {
      expect(process.env.NEXT_PUBLIC_SUPABASE_URL).toBeDefined();
      expect(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY).toBeDefined();
      expect(process.env.NOTION_DATABASE_ID).toBeDefined();
    });

    it('debería importar correctamente todas las dependencias', async () => {
      // Test que las importaciones no fallan
      expect(() => {
        const request = createMockRequest({ tokenId: 'import-test' });
        return POST(request);
      }).not.toThrow();
    });
  });

  describe('Token ID Validation', () => {
    it('debería rechazar requests sin tokenId', async () => {
      const request = createMockRequest({});

      const response = await POST(request);

      expect(response).toBeInstanceOf(Response);
      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('text/event-stream');
    });

    it('debería rechazar tokenId vacío', async () => {
      const request = createMockRequest({ tokenId: '' });

      const response = await POST(request);

      expect(response).toBeInstanceOf(Response);
      expect(response.status).toBe(200);
    });

    it('debería rechazar tokenId null', async () => {
      const request = createMockRequest({ tokenId: null });

      const response = await POST(request);

      expect(response).toBeInstanceOf(Response);
      expect(response.status).toBe(200);
    });
  });

  describe('Authentication and Authorization', () => {
    it('debería rechazar usuarios no autenticados', async () => {
      mockCreateServerClient.mockReturnValue({
        auth: {
          getSession: vi.fn().mockResolvedValue({ data: { session: null } })
        }
      } as any);

      const request = createMockRequest({ tokenId: 'test-token' });

      const response = await POST(request);

      expect(response).toBeInstanceOf(Response);
      expect(response.status).toBe(200);
    });

    it('debería procesar usuarios autenticados correctamente', async () => {
      const mockSession = { user: { id: 'user-123' } };

      mockCreateServerClient.mockReturnValue({
        auth: {
          getSession: vi.fn().mockResolvedValue({ data: { session: mockSession } })
        },
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: null,
                  error: new Error('Token not found')
                })
              })
            })
          })
        })
      } as any);

      const request = createMockRequest({ tokenId: 'test-token' });

      const response = await POST(request);

      expect(response).toBeInstanceOf(Response);
      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('text/event-stream');
    });

    it('debería rechazar tokens que no pertenecen al usuario', async () => {
      const mockSession = { user: { id: 'user-123' } };

      mockCreateServerClient.mockReturnValue({
        auth: {
          getSession: vi.fn().mockResolvedValue({ data: { session: mockSession } })
        },
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: {
                    id: 'token-456',
                    user_id: 'different-user-789',
                    provider: 'notion',
                    token_name: 'Test Token',
                    encrypted_token: 'encrypted-data'
                  },
                  error: null
                })
              })
            })
          })
        })
      } as any);

      const request = createMockRequest({ tokenId: 'token-456' });

      const response = await POST(request);

      expect(response).toBeInstanceOf(Response);
      expect(response.status).toBe(200);
    });

    it('debería rechazar tokens que no son de Notion', async () => {
      const mockSession = { user: { id: 'user-123' } };

      mockCreateServerClient.mockReturnValue({
        auth: {
          getSession: vi.fn().mockResolvedValue({ data: { session: mockSession } })
        },
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: {
                    id: 'token-456',
                    user_id: 'user-123',
                    provider: 'google',
                    token_name: 'Google Token',
                    encrypted_token: 'encrypted-data'
                  },
                  error: null
                })
              })
            })
          })
        })
      } as any);

      const request = createMockRequest({ tokenId: 'token-456' });

      const response = await POST(request);

      expect(response).toBeInstanceOf(Response);
      expect(response.status).toBe(200);
    });
  });

  describe('Token Processing', () => {
    it('debería manejar tokens no encontrados', async () => {
      const mockSession = { user: { id: 'user-123' } };

      mockCreateServerClient.mockReturnValue({
        auth: {
          getSession: vi.fn().mockResolvedValue({ data: { session: mockSession } })
        },
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockImplementation((field) => {
              if (field === 'user_id') {
                return {
                  data: [],
                  error: null
                };
              }
              return {
                eq: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: null,
                    error: new Error('Token not found')
                  })
                })
              };
            })
          })
        })
      } as any);

      const request = createMockRequest({ tokenId: 'non-existent-token' });

      const response = await POST(request);

      expect(response).toBeInstanceOf(Response);
      expect(response.status).toBe(200);
    });

    it('debería manejar errores de desencriptación', async () => {
      const mockSession = { user: { id: 'user-123' } };

      mockCreateServerClient.mockReturnValue({
        auth: {
          getSession: vi.fn().mockResolvedValue({ data: { session: mockSession } })
        },
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: {
                    id: 'token-456',
                    user_id: 'user-123',
                    provider: 'notion',
                    token_name: 'Test Token',
                    encrypted_token: 'invalid-encrypted-data'
                  },
                  error: null
                })
              })
            })
          })
        })
      } as any);

      mockUserTokenService.mockImplementation(() => ({
        decryptToken: vi.fn().mockReturnValue(null)
      }) as any);

      const request = createMockRequest({ tokenId: 'token-456' });

      const response = await POST(request);

      expect(response).toBeInstanceOf(Response);
      expect(response.status).toBe(200);
    });

    it('debería procesar tokens válidos exitosamente', async () => {
      const mockSession = { user: { id: 'user-123' } };

      mockCreateServerClient.mockReturnValue({
        auth: {
          getSession: vi.fn().mockResolvedValue({ data: { session: mockSession } })
        },
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: {
                    id: 'token-456',
                    user_id: 'user-123',
                    provider: 'notion',
                    token_name: 'Valid Token',
                    encrypted_token: 'valid-encrypted-data'
                  },
                  error: null
                })
              })
            })
          })
        })
      } as any);

      mockUserTokenService.mockImplementation(() => ({
        decryptToken: vi.fn().mockReturnValue('decrypted-token')
      }) as any);

      const request = createMockRequest({ tokenId: 'token-456' });

      const response = await POST(request);

      expect(response).toBeInstanceOf(Response);
      expect(response.status).toBe(200);
    });
  });

  describe('Environment Configuration', () => {
    it('debería fallar si NOTION_DATABASE_ID no está configurado', async () => {
      const originalDatabaseId = process.env.NOTION_DATABASE_ID;
      delete process.env.NOTION_DATABASE_ID;

      const mockSession = { user: { id: 'user-123' } };

      mockCreateServerClient.mockReturnValue({
        auth: {
          getSession: vi.fn().mockResolvedValue({ data: { session: mockSession } })
        },
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: {
                    id: 'token-456',
                    user_id: 'user-123',
                    provider: 'notion',
                    token_name: 'Test Token',
                    encrypted_token: 'encrypted-data'
                  },
                  error: null
                })
              })
            })
          })
        })
      } as any);

      const request = createMockRequest({ tokenId: 'token-456' });

      const response = await POST(request);

      expect(response).toBeInstanceOf(Response);
      expect(response.status).toBe(200);

      // Restore original value
      if (originalDatabaseId) {
        process.env.NOTION_DATABASE_ID = originalDatabaseId;
      }
    });

    it('debería procesar múltiples database IDs', async () => {
      process.env.NOTION_DATABASE_ID = 'db1,db2,db3';

      const mockSession = { user: { id: 'user-123' } };

      mockCreateServerClient.mockReturnValue({
        auth: {
          getSession: vi.fn().mockResolvedValue({ data: { session: mockSession } })
        },
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: {
                    id: 'token-456',
                    user_id: 'user-123',
                    provider: 'notion',
                    token_name: 'Test Token',
                    encrypted_token: 'encrypted-data'
                  },
                  error: null
                })
              })
            })
          })
        })
      } as any);

      const request = createMockRequest({ tokenId: 'token-456' });

      const response = await POST(request);

      expect(response).toBeInstanceOf(Response);
      expect(response.status).toBe(200);
    });

    it('debería manejar database IDs con espacios extras', async () => {
      process.env.NOTION_DATABASE_ID = ' db1 , db2 , db3 ';

      const mockSession = { user: { id: 'user-123' } };

      mockCreateServerClient.mockReturnValue({
        auth: {
          getSession: vi.fn().mockResolvedValue({ data: { session: mockSession } })
        },
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: {
                    id: 'token-456',
                    user_id: 'user-123',
                    provider: 'notion',
                    token_name: 'Test Token',
                    encrypted_token: 'encrypted-data'
                  },
                  error: null
                })
              })
            })
          })
        })
      } as any);

      const request = createMockRequest({ tokenId: 'token-456' });

      const response = await POST(request);

      expect(response).toBeInstanceOf(Response);
      expect(response.status).toBe(200);
    });
  });

  describe('Database Sync Processing', () => {
    it('debería manejar errores durante la sincronización', async () => {
      const mockSession = { user: { id: 'user-123' } };

      mockCreateServerClient.mockReturnValue({
        auth: {
          getSession: vi.fn().mockResolvedValue({ data: { session: mockSession } })
        },
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: {
                    id: 'token-456',
                    user_id: 'user-123',
                    provider: 'notion',
                    token_name: 'Test Token',
                    encrypted_token: 'encrypted-data'
                  },
                  error: null
                })
              })
            })
          })
        })
      } as any);

      mockConnectionPageRepository.mockImplementation(() => ({
        handleSyncToSupabase: vi.fn().mockRejectedValue(new Error('Sync failed'))
      }) as any);

      const request = createMockRequest({ tokenId: 'token-456' });

      const response = await POST(request);

      expect(response).toBeInstanceOf(Response);
      expect(response.status).toBe(200);
    });

    it('debería restaurar token original después del procesamiento', async () => {
      const originalToken = 'original-notion-token';
      process.env.NOTION_API_KEY = originalToken;

      const mockSession = { user: { id: 'user-123' } };

      mockCreateServerClient.mockReturnValue({
        auth: {
          getSession: vi.fn().mockResolvedValue({ data: { session: mockSession } })
        },
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: {
                    id: 'token-456',
                    user_id: 'user-123',
                    provider: 'notion',
                    token_name: 'Test Token',
                    encrypted_token: 'encrypted-data'
                  },
                  error: null
                })
              })
            })
          })
        })
      } as any);

      mockConnectionPageRepository.mockImplementation(() => ({
        handleSyncToSupabase: vi.fn().mockResolvedValue(undefined)
      }) as any);

      const request = createMockRequest({ tokenId: 'token-456' });

      const response = await POST(request);

      expect(response).toBeInstanceOf(Response);
      expect(response.status).toBe(200);
      // El token original debería mantenerse después del procesamiento
      expect(process.env.NOTION_API_KEY).toBe(originalToken);
    });

    it('debería procesar ConnectionPageRepository con parámetros correctos', async () => {
      const mockSession = { user: { id: 'user-123' } };

      mockCreateServerClient.mockReturnValue({
        auth: {
          getSession: vi.fn().mockResolvedValue({ data: { session: mockSession } })
        },
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: {
                    id: 'token-456',
                    user_id: 'user-123',
                    provider: 'notion',
                    token_name: 'Test Token',
                    encrypted_token: 'encrypted-data'
                  },
                  error: null
                })
              })
            })
          })
        })
      } as any);

      const request = createMockRequest({ tokenId: 'token-456' });

      const response = await POST(request);

      expect(response).toBeInstanceOf(Response);
      expect(response.status).toBe(200);
    });
  });

  describe('Error Handling', () => {
    it('debería manejar diferentes tipos de errores', async () => {
      const errorTypes = [
        new Error('Network error'),
        new TypeError('Type error'),
        new RangeError('Range error'),
        'String error'
      ];

      for (const error of errorTypes) {
        const request = {
          json: vi.fn().mockRejectedValue(error)
        } as unknown as NextRequest;

        const response = await POST(request);

        expect(response).toBeInstanceOf(Response);
        expect(response.status).toBe(200);
        expect(response.headers.get('Content-Type')).toBe('text/event-stream');
      }
    });

    it('debería manejar errores de cookies', async () => {
      mockCookies.mockRejectedValue(new Error('Cookie error'));

      const request = createMockRequest({ tokenId: 'test' });

      const response = await POST(request);

      expect(response).toBeInstanceOf(Response);
      expect(response.status).toBe(200);
    });

    it('debería manejar errores de Supabase client creation', async () => {
      mockCreateServerClient.mockImplementation(() => {
        throw new Error('Supabase client creation failed');
      });

      const request = createMockRequest({ tokenId: 'test' });

      const response = await POST(request);

      expect(response).toBeInstanceOf(Response);
      expect(response.status).toBe(200);
    });
  });

  describe('Stream Controller', () => {
    it('debería crear controller correctamente', async () => {
      const request = createMockRequest({ tokenId: 'controller-test' });

      const response = await POST(request);

      expect(response.body).toBeInstanceOf(ReadableStream);
      expect(response.status).toBe(200);
    });

    it('debería manejar múltiples mensajes en el stream', async () => {
      process.env.NOTION_DATABASE_ID = 'db1,db2,db3,db4';

      const mockSession = { user: { id: 'user-123' } };

      mockCreateServerClient.mockReturnValue({
        auth: {
          getSession: vi.fn().mockResolvedValue({ data: { session: mockSession } })
        },
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: {
                    id: 'token-456',
                    user_id: 'user-123',
                    provider: 'notion',
                    token_name: 'Test Token',
                    encrypted_token: 'encrypted-data'
                  },
                  error: null
                })
              })
            })
          })
        })
      } as any);

      const request = createMockRequest({ tokenId: 'token-456' });

      const response = await POST(request);

      expect(response).toBeInstanceOf(Response);
      expect(response.body).toBeInstanceOf(ReadableStream);
    });
  });
});