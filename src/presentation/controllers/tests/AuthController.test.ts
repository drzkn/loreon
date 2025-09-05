import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AuthController } from '../AuthController';
import { IAuthService } from '@/application/interfaces/IAuthService';
import { ILogger } from '@/application/interfaces/ILogger';
import { SignInRequestDto, AuthResponseDto, UserProfileResponseDto } from '@/presentation/dto/AuthRequestDto';
import { createTestSetup } from '@/mocks';

describe('AuthController', () => {
  let controller: AuthController;
  let mockAuthService: IAuthService;
  let mockLogger: ILogger;
  const { teardown } = createTestSetup();

  beforeEach(() => {
    vi.clearAllMocks();

    mockAuthService = {
      signInWithProvider: vi.fn(),
      signInWithGoogle: vi.fn(),
      signInAnonymously: vi.fn(),
      getUserProfile: vi.fn(),
      signOut: vi.fn(),
      isAuthenticated: vi.fn(),
      hasTokensForProvider: vi.fn()
    };

    mockLogger = {
      info: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
      warn: vi.fn()
    };

    controller = new AuthController(mockAuthService, mockLogger);
  });

  afterEach(() => {
    teardown();
  });

  describe('signInWithProvider', () => {
    const mockRequest: SignInRequestDto = {
      provider: 'google',
      redirectTo: '/dashboard'
    };

    it('should successfully initiate provider sign-in', async () => {
      mockAuthService.signInWithProvider = vi.fn().mockResolvedValue(undefined);

      const result = await controller.signInWithProvider(mockRequest);

      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
      expect(mockAuthService.signInWithProvider).toHaveBeenCalledWith('google', '/dashboard');
      expect(mockLogger.info).toHaveBeenCalledWith('Starting provider sign-in', { provider: 'google' });
      expect(mockLogger.info).toHaveBeenCalledWith('Provider sign-in initiated successfully', { provider: 'google' });
    });

    it('should handle provider sign-in errors', async () => {
      const error = new Error('OAuth provider error');
      mockAuthService.signInWithProvider = vi.fn().mockRejectedValue(error);

      const result = await controller.signInWithProvider(mockRequest);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Error en autenticación con google: OAuth provider error');
      expect(mockLogger.error).toHaveBeenCalledWith('Provider sign-in failed', error, { provider: 'google' });
    });

    it('should handle unknown errors', async () => {
      mockAuthService.signInWithProvider = vi.fn().mockRejectedValue('String error');

      const result = await controller.signInWithProvider(mockRequest);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Error en autenticación con google: Error desconocido');
    });

    it('should work with different providers', async () => {
      const providers = ['github', 'slack', 'microsoft'];
      mockAuthService.signInWithProvider = vi.fn().mockResolvedValue(undefined);

      for (const provider of providers) {
        const request = { ...mockRequest, provider };
        const result = await controller.signInWithProvider(request);

        expect(result.success).toBe(true);
        expect(mockAuthService.signInWithProvider).toHaveBeenCalledWith(provider, '/dashboard');
      }
    });

    it('should handle requests without redirectTo', async () => {
      const requestWithoutRedirect = { provider: 'github' };
      mockAuthService.signInWithProvider = vi.fn().mockResolvedValue(undefined);

      const result = await controller.signInWithProvider(requestWithoutRedirect);

      expect(result.success).toBe(true);
      expect(mockAuthService.signInWithProvider).toHaveBeenCalledWith('github', undefined);
    });
  });

  describe('signInWithGoogle', () => {
    it('should successfully initiate Google sign-in', async () => {
      mockAuthService.signInWithGoogle = vi.fn().mockResolvedValue(undefined);

      const result = await controller.signInWithGoogle();

      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
      expect(mockAuthService.signInWithGoogle).toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalledWith('Starting Google sign-in');
      expect(mockLogger.info).toHaveBeenCalledWith('Google sign-in initiated successfully');
    });

    it('should handle Google sign-in errors', async () => {
      const error = new Error('Google OAuth error');
      mockAuthService.signInWithGoogle = vi.fn().mockRejectedValue(error);

      const result = await controller.signInWithGoogle();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Error en autenticación con Google: Google OAuth error');
      expect(mockLogger.error).toHaveBeenCalledWith('Google sign-in failed', error);
    });

    it('should handle unknown errors in Google sign-in', async () => {
      mockAuthService.signInWithGoogle = vi.fn().mockRejectedValue(null);

      const result = await controller.signInWithGoogle();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Error en autenticación con Google: Error desconocido');
    });
  });

  describe('signInAnonymously', () => {
    it('should successfully sign in anonymously with complete user data', async () => {
      const mockResult = {
        data: {
          user: {
            id: 'anon-123',
            email: 'anon@example.com'
          },
          session: {
            access_token: 'access-token-123',
            refresh_token: 'refresh-token-123',
            expires_at: 1234567890
          }
        }
      };
      mockAuthService.signInAnonymously = vi.fn().mockResolvedValue(mockResult);

      const result = await controller.signInAnonymously();

      expect(result.success).toBe(true);
      expect(result.user).toEqual({
        id: 'anon-123',
        email: 'anon@example.com',
        name: 'Usuario Anónimo',
        provider: 'anonymous'
      });
      expect(result.session).toEqual({
        access_token: 'access-token-123',
        refresh_token: 'refresh-token-123',
        expires_at: 1234567890
      });
      expect(mockLogger.info).toHaveBeenCalledWith('Anonymous sign-in completed successfully');
    });

    it('should handle anonymous sign-in with no user data', async () => {
      const mockResult = { data: null };
      mockAuthService.signInAnonymously = vi.fn().mockResolvedValue(mockResult);

      const result = await controller.signInAnonymously();

      expect(result.success).toBe(true);
      expect(result.user).toBeUndefined();
      expect(result.session).toBeUndefined();
    });

    it('should handle anonymous sign-in with partial data', async () => {
      const mockResult = {
        data: {
          user: { id: 'anon-456' },
          session: null
        }
      };
      mockAuthService.signInAnonymously = vi.fn().mockResolvedValue(mockResult);

      const result = await controller.signInAnonymously();

      expect(result.success).toBe(true);
      expect(result.user).toEqual({
        id: 'anon-456',
        email: undefined,
        name: 'Usuario Anónimo',
        provider: 'anonymous'
      });
      expect(result.session).toBeUndefined();
    });

    it('should handle anonymous sign-in errors', async () => {
      const error = new Error('Anonymous auth failed');
      mockAuthService.signInAnonymously = vi.fn().mockRejectedValue(error);

      const result = await controller.signInAnonymously();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Error en autenticación anónima: Anonymous auth failed');
      expect(mockLogger.error).toHaveBeenCalledWith('Anonymous sign-in failed', error);
    });
  });

  describe('getUserProfile', () => {
    it('should successfully get user profile', async () => {
      const mockProfile = {
        id: 'user-123',
        email: 'user@example.com',
        name: 'Test User',
        avatar: 'https://avatar.url',
        provider: 'google',
        lastSignIn: '2024-01-01T00:00:00Z',
        createdAt: '2023-01-01T00:00:00Z'
      };
      mockAuthService.getUserProfile = vi.fn().mockResolvedValue(mockProfile);

      const result = await controller.getUserProfile();

      expect(result.success).toBe(true);
      expect(result.profile).toEqual(mockProfile);
      expect(result.error).toBeUndefined();
      expect(mockLogger.debug).toHaveBeenCalledWith('User profile retrieved successfully', { userId: 'user-123' });
    });

    it('should handle no user profile found', async () => {
      mockAuthService.getUserProfile = vi.fn().mockResolvedValue(null);

      const result = await controller.getUserProfile();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Usuario no autenticado');
      expect(result.profile).toBeUndefined();
      expect(mockLogger.warn).toHaveBeenCalledWith('No user profile found - user not authenticated');
    });

    it('should handle get profile errors', async () => {
      const error = new Error('Profile fetch failed');
      mockAuthService.getUserProfile = vi.fn().mockRejectedValue(error);

      const result = await controller.getUserProfile();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Error obteniendo perfil de usuario: Profile fetch failed');
      expect(mockLogger.error).toHaveBeenCalledWith('Failed to get user profile', error);
    });

    it('should handle profile with minimal data', async () => {
      const mockProfile = {
        id: 'minimal-user',
        email: undefined,
        name: undefined,
        avatar: undefined,
        provider: undefined,
        lastSignIn: undefined,
        createdAt: undefined
      };
      mockAuthService.getUserProfile = vi.fn().mockResolvedValue(mockProfile);

      const result = await controller.getUserProfile();

      expect(result.success).toBe(true);
      expect(result.profile).toEqual(mockProfile);
    });
  });

  describe('signOut', () => {
    it('should successfully sign out', async () => {
      mockAuthService.signOut = vi.fn().mockResolvedValue(undefined);

      const result = await controller.signOut();

      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
      expect(mockAuthService.signOut).toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalledWith('Sign-out completed successfully');
    });

    it('should handle sign out errors', async () => {
      const error = new Error('Sign out failed');
      mockAuthService.signOut = vi.fn().mockRejectedValue(error);

      const result = await controller.signOut();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Error cerrando sesión: Sign out failed');
      expect(mockLogger.error).toHaveBeenCalledWith('Sign-out failed', error);
    });

    it('should handle unknown errors in sign out', async () => {
      mockAuthService.signOut = vi.fn().mockRejectedValue('String error');

      const result = await controller.signOut();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Error cerrando sesión: Error desconocido');
    });
  });

  describe('checkAuthentication', () => {
    it('should return authenticated user with profile', async () => {
      const mockProfile = {
        id: 'user-123',
        email: 'user@example.com',
        name: 'Test User',
        avatar: 'avatar.jpg',
        provider: 'google'
      };
      
      mockAuthService.isAuthenticated = vi.fn().mockResolvedValue(true);
      mockAuthService.getUserProfile = vi.fn().mockResolvedValue(mockProfile);

      const result = await controller.checkAuthentication();

      expect(result.success).toBe(true);
      expect(result.authenticated).toBe(true);
      expect(result.user).toEqual({
        id: 'user-123',
        email: 'user@example.com',
        name: 'Test User',
        avatar: 'avatar.jpg',
        provider: 'google'
      });
      expect(mockLogger.debug).toHaveBeenCalledWith('Authentication check completed', {
        authenticated: true,
        hasProfile: true
      });
    });

    it('should return authenticated user without profile', async () => {
      mockAuthService.isAuthenticated = vi.fn().mockResolvedValue(true);
      mockAuthService.getUserProfile = vi.fn().mockResolvedValue(null);

      const result = await controller.checkAuthentication();

      expect(result.success).toBe(true);
      expect(result.authenticated).toBe(true);
      expect(result.user).toBeUndefined();
      expect(mockLogger.debug).toHaveBeenCalledWith('Authentication check completed', {
        authenticated: true,
        hasProfile: false
      });
    });

    it('should return unauthenticated user', async () => {
      mockAuthService.isAuthenticated = vi.fn().mockResolvedValue(false);

      const result = await controller.checkAuthentication();

      expect(result.success).toBe(true);
      expect(result.authenticated).toBe(false);
      expect(result.user).toBeUndefined();
      expect(mockAuthService.getUserProfile).not.toHaveBeenCalled();
    });

    it('should handle authentication check errors', async () => {
      const error = new Error('Auth check failed');
      mockAuthService.isAuthenticated = vi.fn().mockRejectedValue(error);

      const result = await controller.checkAuthentication();

      expect(result.success).toBe(false);
      expect(result.authenticated).toBe(false);
      expect(result.error).toBe('Error verificando autenticación: Auth check failed');
      expect(mockLogger.error).toHaveBeenCalledWith('Authentication check failed', error);
    });

    it('should handle profile fetch errors during auth check', async () => {
      const profileError = new Error('Profile fetch failed');
      mockAuthService.isAuthenticated = vi.fn().mockResolvedValue(true);
      mockAuthService.getUserProfile = vi.fn().mockRejectedValue(profileError);

      const result = await controller.checkAuthentication();

      expect(result.success).toBe(false);
      expect(result.authenticated).toBe(false);
      expect(result.error).toBe('Error verificando autenticación: Profile fetch failed');
    });
  });

  describe('checkProviderTokens', () => {
    it('should return true when user has tokens for provider', async () => {
      mockAuthService.hasTokensForProvider = vi.fn().mockResolvedValue(true);

      const result = await controller.checkProviderTokens('notion');

      expect(result.success).toBe(true);
      expect(result.hasTokens).toBe(true);
      expect(result.error).toBeUndefined();
      expect(mockAuthService.hasTokensForProvider).toHaveBeenCalledWith('notion');
      expect(mockLogger.debug).toHaveBeenCalledWith('Provider tokens check completed', { provider: 'notion', hasTokens: true });
    });

    it('should return false when user has no tokens for provider', async () => {
      mockAuthService.hasTokensForProvider = vi.fn().mockResolvedValue(false);

      const result = await controller.checkProviderTokens('slack');

      expect(result.success).toBe(true);
      expect(result.hasTokens).toBe(false);
      expect(mockAuthService.hasTokensForProvider).toHaveBeenCalledWith('slack');
    });

    it('should work with all supported providers', async () => {
      const providers: Array<'notion' | 'slack' | 'github' | 'drive' | 'calendar'> = [
        'notion', 'slack', 'github', 'drive', 'calendar'
      ];
      
      mockAuthService.hasTokensForProvider = vi.fn().mockResolvedValue(true);

      for (const provider of providers) {
        const result = await controller.checkProviderTokens(provider);
        
        expect(result.success).toBe(true);
        expect(result.hasTokens).toBe(true);
        expect(mockAuthService.hasTokensForProvider).toHaveBeenCalledWith(provider);
      }
    });

    it('should handle provider tokens check errors', async () => {
      const error = new Error('Token check failed');
      mockAuthService.hasTokensForProvider = vi.fn().mockRejectedValue(error);

      const result = await controller.checkProviderTokens('github');

      expect(result.success).toBe(false);
      expect(result.hasTokens).toBe(false);
      expect(result.error).toBe('Error verificando tokens de github: Token check failed');
      expect(mockLogger.error).toHaveBeenCalledWith('Provider tokens check failed', error, { provider: 'github' });
    });

    it('should handle unknown errors in provider tokens check', async () => {
      mockAuthService.hasTokensForProvider = vi.fn().mockRejectedValue('Unknown error');

      const result = await controller.checkProviderTokens('drive');

      expect(result.success).toBe(false);
      expect(result.hasTokens).toBe(false);
      expect(result.error).toBe('Error verificando tokens de drive: Error desconocido');
    });
  });

  describe('Error handling and edge cases', () => {
    it('should handle network timeout errors', async () => {
      const timeoutError = new Error('Request timeout');
      timeoutError.name = 'TimeoutError';
      
      mockAuthService.signInWithGoogle = vi.fn().mockRejectedValue(timeoutError);

      const result = await controller.signInWithGoogle();

      expect(result.success).toBe(false);
      expect(result.error).toContain('Request timeout');
    });

    it('should handle null and undefined values correctly', async () => {
      mockAuthService.getUserProfile = vi.fn().mockResolvedValue(undefined);

      const result = await controller.getUserProfile();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Usuario no autenticado');
    });

    it('should log detailed error information', async () => {
      const detailedError = new Error('Detailed error message');
      detailedError.stack = 'Error stack trace';
      
      mockAuthService.signOut = vi.fn().mockRejectedValue(detailedError);

      await controller.signOut();

      expect(mockLogger.error).toHaveBeenCalledWith('Sign-out failed', detailedError);
    });

    it('should handle concurrent operations correctly', async () => {
      mockAuthService.isAuthenticated = vi.fn().mockResolvedValue(true);
      mockAuthService.getUserProfile = vi.fn().mockResolvedValue({ id: 'user-123' });

      const promises = [
        controller.checkAuthentication(),
        controller.checkAuthentication(),
        controller.checkAuthentication()
      ];

      const results = await Promise.all(promises);

      results.forEach(result => {
        expect(result.success).toBe(true);
        expect(result.authenticated).toBe(true);
      });
    });
  });
});
