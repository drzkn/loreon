import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AuthService } from '../AuthService';

// Usar el sistema centralizado de mocks
import {
  createTestSetup
} from '@/mocks';

// Mocks inline para evitar problemas de hoisting
vi.mock('@/services/UserTokenService', () => ({
  UserTokenService: vi.fn(() => ({
    hasTokensForProvider: vi.fn(),
    getDecryptedToken: vi.fn()
  }))
}));

vi.mock('@/adapters/output/infrastructure/supabase', () => ({
  supabase: {
    auth: {
      signInWithOAuth: vi.fn(),
      signInAnonymously: vi.fn(),
      getUser: vi.fn(),
      getSession: vi.fn(),
      signOut: vi.fn()
    }
  }
}));

// Importar después de los mocks
import { supabase } from '@/adapters/output/infrastructure/supabase';

describe('AuthService', () => {
  let service: AuthService;
  let mockUserTokenService: any;
  const { teardown } = createTestSetup(); // ✅ Console mocks centralizados

  beforeEach(() => {
    vi.clearAllMocks();
    service = new AuthService();

    // Obtener referencia al mock después de la instanciación
    mockUserTokenService = (service as any).userTokenService;

    // Mock de window.location para tests que lo necesiten
    Object.defineProperty(window, 'location', {
      value: { origin: 'https://test.com' },
      writable: true
    });
  });

  afterEach(() => {
    teardown(); // ✅ Limpieza automática
  });

  it('debería crear instancia del servicio correctamente', () => {
    expect(service).toBeInstanceOf(AuthService);
    expect(typeof service.signInWithGoogle).toBe('function');
    expect(typeof service.hasTokensForProvider).toBe('function');
    expect(typeof service.getIntegrationToken).toBe('function');
    expect(typeof service.signInWithProvider).toBe('function');
    expect(typeof service.signInAnonymously).toBe('function');
    expect(typeof service.getCurrentUser).toBe('function');
    expect(typeof service.isAuthenticated).toBe('function');
    expect(typeof service.getUserProfile).toBe('function');
    expect(typeof service.signOut).toBe('function');
    expect(typeof service.getSession).toBe('function');
  });

  it('debería autenticar con Google exitosamente', async () => {
    const mockData = { url: 'https://oauth.url', provider: 'google' as const };
    vi.mocked(supabase.auth.signInWithOAuth).mockResolvedValue({ data: mockData, error: null });

    const result = await service.signInWithGoogle();

    expect(result).toEqual(mockData);
    expect(supabase.auth.signInWithOAuth).toHaveBeenCalledWith({
      provider: 'google',
      options: {
        redirectTo: 'https://test.com/auth/callback'
      }
    });
    // Console mocks están centralizados globalmente
  });

  it('debería manejar errores en autenticación con Google', async () => {
    const mockError = {
      message: 'OAuth error',
      code: 'oauth_error',
      status: 400,
      name: 'AuthError'
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any;
    vi.mocked(supabase.auth).signInWithOAuth.mockResolvedValue({ data: { provider: 'google' as const, url: null }, error: mockError });

    await expect(service.signInWithGoogle()).rejects.toEqual(mockError);
    // Console mocks están centralizados globalmente
  });

  it('debería verificar tokens de proveedor con y sin usuario', async () => {
    const mockUser = {
      id: 'user-123',
      aud: 'authenticated',
      app_metadata: {},
      user_metadata: {},
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-01T00:00:00Z'
    };

    // Con usuario proporcionado
    mockUserTokenService.hasTokensForProvider.mockResolvedValue(true);
    let hasTokens = await service.hasTokensForProvider('notion', 'user-123');
    expect(hasTokens).toBe(true);
    expect(mockUserTokenService.hasTokensForProvider).toHaveBeenCalledWith('user-123', 'notion');

    // Sin usuario (obtener de getCurrentUser)
    vi.mocked(supabase.auth).getUser.mockResolvedValue({ data: { user: mockUser }, error: null });
    mockUserTokenService.hasTokensForProvider.mockResolvedValue(false);
    hasTokens = await service.hasTokensForProvider('slack');
    expect(hasTokens).toBe(false);

    // Error en verificación
    mockUserTokenService.hasTokensForProvider.mockRejectedValue(new Error('Token error'));
    hasTokens = await service.hasTokensForProvider('drive', 'user-error');
    expect(hasTokens).toBe(false);
    // Console mocks están centralizados globalmente
  });

  it('debería obtener token de integración correctamente', async () => {
    const mockToken = 'decrypted-token-123';

    // Con usuario y token exitoso
    mockUserTokenService.getDecryptedToken.mockResolvedValue(mockToken);
    let token = await service.getIntegrationToken('notion', 'my-token', 'user-456');
    expect(token).toBe(mockToken);

    // Sin usuario autenticado
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(supabase.auth).getUser.mockResolvedValue({ data: { user: null }, error: null } as any);
    token = await service.getIntegrationToken('github');
    expect(token).toBeNull();

    // Error en obtención
    mockUserTokenService.getDecryptedToken.mockRejectedValue(new Error('Decrypt error'));
    token = await service.getIntegrationToken('calendar', undefined, 'user-error');
    expect(token).toBeNull();
  });

  it('debería autenticar con proveedor genérico', async () => {
    const mockData = { url: 'https://provider.oauth', provider: 'github' as const };
    vi.mocked(supabase.auth).signInWithOAuth.mockResolvedValue({ data: mockData, error: null });

    const result = await service.signInWithProvider('github', 'https://custom.redirect');
    expect(result).toEqual(mockData);
    expect(vi.mocked(supabase.auth).signInWithOAuth).toHaveBeenCalledWith({
      provider: 'github',
      options: {
        redirectTo: 'https://custom.redirect'
      }
    });
  });

  it('debería obtener usuario actual y verificar autenticación', async () => {
    const mockUser = {
      id: 'current-user',
      email: 'test@test.com',
      aud: 'authenticated',
      app_metadata: {},
      user_metadata: {},
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-01T00:00:00Z'
    };

    vi.mocked(supabase.auth).getUser.mockResolvedValue({ data: { user: mockUser }, error: null });
    const user = await service.getCurrentUser();
    expect(user).toEqual(mockUser);

    let isAuth = await service.isAuthenticated();
    expect(isAuth).toBe(true);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(supabase.auth).getUser.mockResolvedValue({ data: { user: null }, error: null } as any);
    isAuth = await service.isAuthenticated();
    expect(isAuth).toBe(false);
  });

  it('debería obtener perfil de usuario completo', async () => {
    const mockUser = {
      id: 'profile-user',
      email: 'profile@test.com',
      aud: 'authenticated',
      user_metadata: {
        name: 'John Doe',
        avatar_url: 'https://avatar.url'
      },
      app_metadata: { provider: 'github' },
      last_sign_in_at: '2023-01-01T00:00:00Z',
      created_at: '2022-01-01T00:00:00Z',
      updated_at: '2022-01-01T00:00:00Z'
    };

    vi.mocked(supabase.auth).getUser.mockResolvedValue({ data: { user: mockUser }, error: null });
    const profile = await service.getUserProfile();

    expect(profile).toEqual({
      id: 'profile-user',
      email: 'profile@test.com',
      name: 'John Doe',
      avatar: 'https://avatar.url',
      provider: 'github',
      lastSignIn: '2023-01-01T00:00:00Z',
      createdAt: '2022-01-01T00:00:00Z'
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(supabase.auth).getUser.mockResolvedValue({ data: { user: null }, error: null } as any);
    const noProfile = await service.getUserProfile();
    expect(noProfile).toBeNull();
  });

  it('debería cerrar sesión y obtener sesión', async () => {
    vi.mocked(supabase.auth).signOut.mockResolvedValue({ error: null });
    await service.signOut();
    expect(vi.mocked(supabase.auth).signOut).toHaveBeenCalled();
    // Console mocks están centralizados globalmente

    const mockSession = {
      access_token: 'token-123',
      refresh_token: 'refresh-123',
      expires_in: 3600,
      token_type: 'bearer',
      user: {
        id: 'session-user',
        aud: 'authenticated',
        app_metadata: {},
        user_metadata: {},
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z'
      }
    };
    vi.mocked(supabase.auth).getSession.mockResolvedValue({ data: { session: mockSession }, error: null });
    const session = await service.getSession();
    expect(session).toEqual(mockSession);

    const sessionError = {
      message: 'Session fetch failed',
      code: 'session_error',
      status: 400,
      name: 'AuthError'
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any;
    vi.mocked(supabase.auth).getSession.mockResolvedValue({ data: { session: null }, error: sessionError });
    const errorSession = await service.getSession();
    expect(errorSession).toBeNull();
  });

  it('debería manejar autenticación anónima y errores críticos', async () => {
    const mockUser = {
      id: 'anon-user-789',
      aud: 'authenticated',
      app_metadata: {},
      user_metadata: {},
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-01T00:00:00Z'
    };
    const mockData = { user: mockUser, session: null };

    vi.mocked(supabase.auth).signInAnonymously.mockResolvedValue({ data: mockData, error: null });
    const result = await service.signInAnonymously();
    expect(result).toEqual(mockData);

    vi.mocked(supabase.auth).signInWithOAuth.mockRejectedValue(new Error('Critical error'));
    await expect(service.signInWithGoogle()).rejects.toThrow('Critical error');
    // Console mocks están centralizados globalmente
  });
});