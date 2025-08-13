import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NotionAuthService, type NotionUser } from '../NotionAuthService';

// Mock UserTokenService
vi.mock('@/services/UserTokenService', () => ({
  UserTokenService: vi.fn(() => ({}))
}));

// Mock global fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
  writable: true
});

describe('NotionAuthService', () => {
  let service: NotionAuthService;
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new NotionAuthService();
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => { });
    vi.spyOn(console, 'error').mockImplementation(() => { });
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it('debería verificar tokens: existencia, validación de formato y limpieza', () => {
    // Sin token
    mockLocalStorage.getItem.mockReturnValue(null);
    expect(service.hasUserToken()).toBe(false);

    // Con token
    mockLocalStorage.getItem.mockReturnValue('secret_token123');
    expect(service.hasUserToken()).toBe(true);

    // Validación de formato
    expect(service['validateTokenFormat']('secret_valid')).toBe(true);
    expect(service['validateTokenFormat']('ntn_valid')).toBe(true);
    expect(service['validateTokenFormat']('invalid_token')).toBe(false);

    // Limpieza de token
    expect(service['cleanToken']('  "secret_token"  ')).toBe('secret_token');
    expect(service['cleanToken']("'ntn_token'")).toBe('ntn_token');
  });

  it('debería manejar validación y guardado de tokens: éxito, formato inválido, token inválido', async () => {
    const mockUser: NotionUser = {
      id: 'user-123',
      name: 'Test User',
      avatar_url: 'https://avatar.url'
    };

    // Mock de respuesta exitosa
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ user: mockUser })
    });

    // Token válido
    const result = await service.validateAndSaveUserToken('secret_valid_token');
    expect(result).toBe(true);
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith('notion_user_token', 'secret_valid_token');

    // Formato inválido
    await expect(service.validateAndSaveUserToken('invalid_format')).rejects.toThrow('Formato de token inválido');

    // Token inválido (sin usuario)
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ user: null })
    });
    await expect(service.validateAndSaveUserToken('secret_invalid')).rejects.toThrow('Token inválido o sin permisos');
  });

  it('debería obtener usuario actual: con token, sin token, con errores', async () => {
    const mockUser: NotionUser = {
      id: 'user-123',
      name: 'Test User',
      avatar_url: 'https://avatar.url',
      person: { email: 'test@example.com' }
    };

    // Con token válido
    mockLocalStorage.getItem.mockReturnValue('secret_token');
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ user: mockUser })
    });

    const user = await service.getCurrentNotionUser();
    expect(user).toEqual(mockUser);
    expect(mockFetch).toHaveBeenCalledWith('/api/auth/notion/verify-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: 'secret_token' })
    });

    // Sin token
    mockLocalStorage.getItem.mockReturnValue(null);
    const noUser = await service.getCurrentNotionUser();
    expect(noUser).toBeNull();

    // Error 401 (debería limpiar token)
    mockLocalStorage.getItem.mockReturnValue('invalid_token');
    mockFetch.mockRejectedValue(new Error('401'));
    const errorUser = await service.getCurrentNotionUser();
    expect(errorUser).toBeNull();
    expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('notion_user_token');
  });

  it('debería manejar perfil de usuario: creación, fallbacks, datos en caché', async () => {
    const mockUser: NotionUser = {
      id: 'user-123',
      name: 'Test User',
      avatar_url: 'https://avatar.url',
      person: { email: 'test@example.com' },
      bot: {
        owner: {
          type: 'user',
          user: {
            id: 'owner-123',
            name: 'Owner User',
            person: { email: 'owner@example.com' }
          }
        }
      }
    };

    // Perfil completo con bot
    mockLocalStorage.getItem.mockReturnValue('secret_token');
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ user: mockUser })
    });

    const profile = await service.getNotionUserProfile();
    expect(profile).toEqual({
      id: 'user-123',
      name: 'Test User',
      email: 'test@example.com',
      avatar: 'https://avatar.url',
      provider: 'notion_personal',
      isBot: true,
      ownerInfo: {
        id: 'owner-123',
        name: 'Owner User',
        email: 'owner@example.com'
      }
    });
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith('notion_user_data', JSON.stringify(profile));

    // Sin usuario (fallback a caché)
    mockLocalStorage.getItem.mockReturnValue(null);
    const noProfile = await service.getNotionUserProfile();
    expect(noProfile).toBeNull();
  });

  it('debería manejar métodos de datos de usuario', () => {
    const testData = { id: 'test-123', name: 'Test User' };

    // Guardar datos
    service['saveUserData'](testData);
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith('notion_user_data', JSON.stringify(testData));

    // Obtener datos
    mockLocalStorage.getItem.mockReturnValue(JSON.stringify(testData));
    const retrievedData = service['getUserData']();
    expect(retrievedData).toEqual(testData);

    // Sin datos
    mockLocalStorage.getItem.mockReturnValue(null);
    const noData = service['getUserData']();
    expect(noData).toBeNull();
  });

  it('debería manejar verificación de conexión y autenticación', async () => {
    // Conexión válida
    mockLocalStorage.getItem.mockReturnValue('secret_token');
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ user: { id: 'user-123', name: 'Test' } })
    });

    expect(await service.verifyNotionConnection()).toBe(true);

    // Sin conexión
    mockFetch.mockRejectedValue(new Error('Network error'));
    expect(await service.verifyNotionConnection()).toBe(false);

    // Autenticación con token
    mockLocalStorage.getItem.mockReturnValue('secret_token');
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ user: { id: 'user-123', name: 'Test' } })
    });

    const authProfile = await service.authenticateWithUserToken();
    expect(authProfile).toBeDefined();

    // Sin token para autenticación
    mockLocalStorage.getItem.mockReturnValue(null);
    await expect(service.authenticateWithUserToken()).rejects.toThrow('No hay token personal configurado');
  });

  it('debería manejar cleanup y errores de API', async () => {
    // Cleanup de datos
    service.clearUserData();
    expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('notion_user_token');
    expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('notion_user_data');

    // Error de API (response no ok)
    mockLocalStorage.getItem.mockReturnValue('secret_token');
    mockFetch.mockResolvedValue({
      ok: false,
      status: 400,
      statusText: 'Bad Request',
      json: () => Promise.resolve({ error: 'Invalid token format' })
    });

    const user = await service.getCurrentNotionUser();
    expect(user).toBeNull();

    // Error de API sin mensaje específico
    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      json: () => Promise.resolve({})
    });

    const errorUser = await service.getCurrentNotionUser();
    expect(errorUser).toBeNull();
  });

  it('debería manejar entorno servidor (SSR)', () => {
    // Mock de entorno servidor
    const originalWindow = global.window;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (global as any).window;

    const ssrService = new NotionAuthService();

    // Métodos deberían manejar SSR sin errores
    expect(ssrService.hasUserToken()).toBe(false);
    ssrService['saveUserToken']('test_token'); // No debería arrojar error
    expect(ssrService['getUserToken']()).toBeNull();
    ssrService['clearUserToken'](); // No debería arrojar error
    expect(ssrService['getUserData']()).toBeNull();
    ssrService['saveUserData']({ test: 'data' }); // No debería arrojar error

    // Restaurar window
    global.window = originalWindow;
  });
});
