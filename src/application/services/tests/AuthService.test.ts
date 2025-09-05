import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AuthService } from '../AuthService';
import type { ISupabaseClient } from '@/infrastructure/database/interfaces/ISupabaseClient';
import type { IUserTokenService } from '@/infrastructure/config/interfaces/IUserTokenService';
import type { ILogger } from '@/application/interfaces/ILogger';
import { createTestSetup } from '@/mocks';

// Mock de window
Object.defineProperty(window, 'location', {
  value: { origin: 'http://localhost:3000' },
  writable: true
});

describe('AuthService', () => {
  let authService: AuthService;
  let mockSupabaseClient: ISupabaseClient;
  let mockUserTokenService: IUserTokenService;
  let mockLogger: ILogger;
  const { teardown } = createTestSetup();

  beforeEach(() => {
    vi.clearAllMocks();

    mockSupabaseClient = {
      auth: {
        signInWithOAuth: vi.fn(),
        signInAnonymously: vi.fn(),
        getUser: vi.fn(),
        getSession: vi.fn(),
        signOut: vi.fn()
      }
    } as unknown as ISupabaseClient;

    mockUserTokenService = {
      hasTokensForProvider: vi.fn(),
      getDecryptedToken: vi.fn()
    } as unknown as IUserTokenService;

    mockLogger = {
      info: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
      warn: vi.fn()
    };

    authService = new AuthService(mockSupabaseClient, mockUserTokenService, mockLogger);
  });

  afterEach(() => {
    teardown();
  });

  describe('signInWithGoogle', () => {
    it('debería iniciar autenticación con Google exitosamente', async () => {
      const mockData = { url: 'https://auth.url', provider: 'google' };
      mockSupabaseClient.auth.signInWithOAuth = vi.fn().mockResolvedValue({
        data: mockData,
        error: null
      });

      const result = await authService.signInWithGoogle();

      expect(result).toEqual({ data: mockData, error: null });
      expect(mockSupabaseClient.auth.signInWithOAuth).toHaveBeenCalledWith({
        provider: 'google',
        options: {
          redirectTo: 'http://localhost:3000/auth/callback'
        }
      });
      expect(mockLogger.info).toHaveBeenCalledWith('Iniciando autenticación con Google...');
      expect(mockLogger.info).toHaveBeenCalledWith('Autenticación con Google iniciada exitosamente');
    });

    it('debería manejar errores en autenticación con Google', async () => {
      const mockError = new Error('OAuth error');
      mockSupabaseClient.auth.signInWithOAuth = vi.fn().mockResolvedValue({
        data: null,
        error: mockError
      });

      await expect(authService.signInWithGoogle()).rejects.toThrow('OAuth error');
      expect(mockLogger.error).toHaveBeenCalledWith('Error en autenticación con Google', mockError);
      expect(mockLogger.error).toHaveBeenCalledWith('Error crítico en autenticación con Google', mockError);
    });

    it('debería manejar excepciones críticas', async () => {
      const mockError = new Error('Critical error');
      mockSupabaseClient.auth.signInWithOAuth = vi.fn().mockRejectedValue(mockError);

      await expect(authService.signInWithGoogle()).rejects.toThrow('Critical error');
      expect(mockLogger.error).toHaveBeenCalledWith('Error crítico en autenticación con Google', mockError);
    });
  });

  describe('signInWithProvider', () => {
    it('debería autenticar con proveedor genérico', async () => {
      const mockData = { url: 'https://auth.url', provider: 'github' };
      mockSupabaseClient.auth.signInWithOAuth = vi.fn().mockResolvedValue({
        data: mockData,
        error: null
      });

      const result = await authService.signInWithProvider('github');

      expect(result).toEqual({ data: mockData, error: null });
      expect(mockSupabaseClient.auth.signInWithOAuth).toHaveBeenCalledWith({
        provider: 'github',
        options: {
          redirectTo: 'http://localhost:3000/auth/callback'
        }
      });
      expect(mockLogger.info).toHaveBeenCalledWith('Iniciando autenticación con github...');
    });

    it('debería usar redirectTo personalizado', async () => {
      const mockData = { url: 'https://auth.url', provider: 'github' };
      const customRedirect = 'https://custom.url/callback';
      mockSupabaseClient.auth.signInWithOAuth = vi.fn().mockResolvedValue({
        data: mockData,
        error: null
      });

      await authService.signInWithProvider('github', customRedirect);

      expect(mockSupabaseClient.auth.signInWithOAuth).toHaveBeenCalledWith({
        provider: 'github',
        options: {
          redirectTo: customRedirect
        }
      });
    });

    it('debería manejar errores en autenticación con proveedor', async () => {
      const mockError = new Error('Provider error');
      mockSupabaseClient.auth.signInWithOAuth = vi.fn().mockResolvedValue({
        data: null,
        error: mockError
      });

      await expect(authService.signInWithProvider('github')).rejects.toThrow('Provider error');
      expect(mockLogger.error).toHaveBeenCalledWith('Error crítico en autenticación OAuth', mockError);
    });
  });

  describe('signInAnonymously', () => {
    it('debería autenticar anónimamente', async () => {
      const mockUser = { id: 'anon-123', email: null };
      const mockData = { user: mockUser, session: null };
      mockSupabaseClient.auth.signInAnonymously = vi.fn().mockResolvedValue({
        data: mockData,
        error: null
      });

      const result = await authService.signInAnonymously();

      expect(result).toEqual({ data: mockData, error: null });
      expect(mockLogger.info).toHaveBeenCalledWith('Iniciando autenticación anónima...');
      expect(mockLogger.info).toHaveBeenCalledWith('Autenticación anónima exitosa', { userId: 'anon-123' });
    });

    it('debería manejar errores en autenticación anónima', async () => {
      const mockError = new Error('Anonymous auth failed');
      mockSupabaseClient.auth.signInAnonymously = vi.fn().mockResolvedValue({
        data: null,
        error: mockError
      });

      await expect(authService.signInAnonymously()).rejects.toThrow('Anonymous auth failed');
      expect(mockLogger.error).toHaveBeenCalledWith('Error en autenticación anónima', mockError);
    });
  });

  describe('getCurrentUser', () => {
    it('debería obtener usuario actual', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' };
      mockSupabaseClient.auth.getUser = vi.fn().mockResolvedValue({
        data: { user: mockUser },
        error: null
      });

      const result = await authService.getCurrentUser();

      expect(result).toEqual(mockUser);
    });

    it('debería retornar null cuando hay error', async () => {
      const mockError = new Error('User fetch failed');
      mockSupabaseClient.auth.getUser = vi.fn().mockResolvedValue({
        data: { user: null },
        error: mockError
      });

      const result = await authService.getCurrentUser();

      expect(result).toBeNull();
      expect(mockLogger.error).toHaveBeenCalledWith('Error obteniendo usuario actual', mockError);
    });

    it('debería manejar excepciones críticas', async () => {
      const mockError = new Error('Critical error');
      mockSupabaseClient.auth.getUser = vi.fn().mockRejectedValue(mockError);

      const result = await authService.getCurrentUser();

      expect(result).toBeNull();
      expect(mockLogger.error).toHaveBeenCalledWith('Error crítico obteniendo usuario actual', mockError);
    });
  });

  describe('getUserProfile', () => {
    it('debería crear perfil completo de usuario', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        user_metadata: {
          name: 'Test User',
          avatar_url: 'https://avatar.url'
        },
        app_metadata: {
          provider: 'google'
        },
        last_sign_in_at: '2023-01-01T00:00:00Z',
        created_at: '2022-01-01T00:00:00Z'
      };
      
      mockSupabaseClient.auth.getUser = vi.fn().mockResolvedValue({
        data: { user: mockUser },
        error: null
      });

      const result = await authService.getUserProfile();

      expect(result).toEqual({
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        avatar: 'https://avatar.url',
        provider: 'google',
        lastSignIn: '2023-01-01T00:00:00Z',
        createdAt: '2022-01-01T00:00:00Z'
      });
    });

    it('debería usar fallbacks para nombre', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        user_metadata: {
          full_name: 'Full Name User'
        }
      };
      
      mockSupabaseClient.auth.getUser = vi.fn().mockResolvedValue({
        data: { user: mockUser },
        error: null
      });

      const result = await authService.getUserProfile();

      expect(result?.name).toBe('Full Name User');
    });

    it('debería usar email como fallback de nombre', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        user_metadata: {}
      };
      
      mockSupabaseClient.auth.getUser = vi.fn().mockResolvedValue({
        data: { user: mockUser },
        error: null
      });

      const result = await authService.getUserProfile();

      expect(result?.name).toBe('test');
    });

    it('debería retornar null sin usuario', async () => {
      mockSupabaseClient.auth.getUser = vi.fn().mockResolvedValue({
        data: { user: null },
        error: null
      });

      const result = await authService.getUserProfile();

      expect(result).toBeNull();
    });

    it('debería manejar errores', async () => {
      const mockError = new Error('Profile error');
      mockSupabaseClient.auth.getUser = vi.fn().mockRejectedValue(mockError);

      const result = await authService.getUserProfile();

      expect(result).toBeNull();
      expect(mockLogger.error).toHaveBeenCalledWith('Error crítico obteniendo usuario actual', mockError);
    });
  });

  describe('getSession', () => {
    it('debería obtener sesión actual', async () => {
      const mockSession = { access_token: 'token-123', user: { id: 'user-123' } };
      mockSupabaseClient.auth.getSession = vi.fn().mockResolvedValue({
        data: { session: mockSession },
        error: null
      });

      const result = await authService.getSession();

      expect(result).toEqual(mockSession);
    });

    it('debería retornar null con error', async () => {
      const mockError = new Error('Session error');
      mockSupabaseClient.auth.getSession = vi.fn().mockResolvedValue({
        data: { session: null },
        error: mockError
      });

      const result = await authService.getSession();

      expect(result).toBeNull();
      expect(mockLogger.error).toHaveBeenCalledWith('Error obteniendo sesión', mockError);
    });
  });

  describe('signOut', () => {
    it('debería cerrar sesión exitosamente', async () => {
      mockSupabaseClient.auth.signOut = vi.fn().mockResolvedValue({ error: null });

      await authService.signOut();

      expect(mockLogger.info).toHaveBeenCalledWith('Cerrando sesión...');
      expect(mockLogger.info).toHaveBeenCalledWith('Sesión cerrada exitosamente');
    });

    it('debería manejar errores al cerrar sesión', async () => {
      const mockError = new Error('Signout failed');
      mockSupabaseClient.auth.signOut = vi.fn().mockResolvedValue({ error: mockError });

      await expect(authService.signOut()).rejects.toThrow('Signout failed');
      expect(mockLogger.error).toHaveBeenCalledWith('Error cerrando sesión', mockError);
    });
  });

  describe('isAuthenticated', () => {
    it('debería retornar true con usuario', async () => {
      mockSupabaseClient.auth.getUser = vi.fn().mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      });

      const result = await authService.isAuthenticated();

      expect(result).toBe(true);
    });

    it('debería retornar false sin usuario', async () => {
      mockSupabaseClient.auth.getUser = vi.fn().mockResolvedValue({
        data: { user: null },
        error: null
      });

      const result = await authService.isAuthenticated();

      expect(result).toBe(false);
    });
  });

  describe('isAuthenticatedWithProvider', () => {
    it('debería verificar proveedor específico', async () => {
      const mockUser = {
        id: 'user-123',
        app_metadata: { provider: 'google' }
      };
      mockSupabaseClient.auth.getUser = vi.fn().mockResolvedValue({
        data: { user: mockUser },
        error: null
      });

      const result = await authService.isAuthenticatedWithProvider('google');

      expect(result).toBe(true);
    });

    it('debería retornar false con proveedor diferente', async () => {
      const mockUser = {
        id: 'user-123',
        app_metadata: { provider: 'github' }
      };
      mockSupabaseClient.auth.getUser = vi.fn().mockResolvedValue({
        data: { user: mockUser },
        error: null
      });

      const result = await authService.isAuthenticatedWithProvider('google');

      expect(result).toBe(false);
    });

    it('debería retornar false sin usuario', async () => {
      mockSupabaseClient.auth.getUser = vi.fn().mockResolvedValue({
        data: { user: null },
        error: null
      });

      const result = await authService.isAuthenticatedWithProvider('google');

      expect(result).toBe(false);
    });
  });

  describe('hasTokensForProvider', () => {
    it('debería verificar tokens con userId proporcionado', async () => {
      mockUserTokenService.hasTokensForProvider = vi.fn().mockResolvedValue(true);

      const result = await authService.hasTokensForProvider('notion', 'user-123');

      expect(result).toBe(true);
      expect(mockUserTokenService.hasTokensForProvider).toHaveBeenCalledWith('user-123', 'notion');
    });

    it('debería obtener userId del usuario actual', async () => {
      mockSupabaseClient.auth.getUser = vi.fn().mockResolvedValue({
        data: { user: { id: 'current-user' } },
        error: null
      });
      mockUserTokenService.hasTokensForProvider = vi.fn().mockResolvedValue(true);

      const result = await authService.hasTokensForProvider('notion');

      expect(result).toBe(true);
      expect(mockUserTokenService.hasTokensForProvider).toHaveBeenCalledWith('current-user', 'notion');
    });

    it('debería retornar false sin usuario', async () => {
      mockSupabaseClient.auth.getUser = vi.fn().mockResolvedValue({
        data: { user: null },
        error: null
      });

      const result = await authService.hasTokensForProvider('notion');

      expect(result).toBe(false);
    });

    it('debería manejar errores', async () => {
      const mockError = new Error('Token error');
      mockUserTokenService.hasTokensForProvider = vi.fn().mockRejectedValue(mockError);

      const result = await authService.hasTokensForProvider('notion', 'user-123');

      expect(result).toBe(false);
      expect(mockLogger.error).toHaveBeenCalledWith('Error verificando tokens de proveedor', mockError);
    });
  });

  describe('getIntegrationToken', () => {
    it('debería obtener token con userId proporcionado', async () => {
      mockUserTokenService.getDecryptedToken = vi.fn().mockResolvedValue('decrypted-token');

      const result = await authService.getIntegrationToken('notion', 'token-name', 'user-123');

      expect(result).toBe('decrypted-token');
      expect(mockUserTokenService.getDecryptedToken).toHaveBeenCalledWith('user-123', 'notion', 'token-name');
    });

    it('debería obtener userId del usuario actual', async () => {
      mockSupabaseClient.auth.getUser = vi.fn().mockResolvedValue({
        data: { user: { id: 'current-user' } },
        error: null
      });
      mockUserTokenService.getDecryptedToken = vi.fn().mockResolvedValue('decrypted-token');

      const result = await authService.getIntegrationToken('notion');

      expect(result).toBe('decrypted-token');
      expect(mockUserTokenService.getDecryptedToken).toHaveBeenCalledWith('current-user', 'notion', undefined);
    });

    it('debería retornar null sin usuario', async () => {
      mockSupabaseClient.auth.getUser = vi.fn().mockResolvedValue({
        data: { user: null },
        error: null
      });

      const result = await authService.getIntegrationToken('notion');

      expect(result).toBeNull();
    });

    it('debería manejar errores', async () => {
      const mockError = new Error('Decrypt error');
      mockUserTokenService.getDecryptedToken = vi.fn().mockRejectedValue(mockError);

      const result = await authService.getIntegrationToken('notion', undefined, 'user-123');

      expect(result).toBeNull();
      expect(mockLogger.error).toHaveBeenCalledWith('Error obteniendo token de integración', mockError);
    });
  });
});
