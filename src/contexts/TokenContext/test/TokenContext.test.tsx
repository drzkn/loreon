import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ReactNode } from 'react';
import { TokenProvider, useTokens } from '../TokenContext';
import { CreateUserTokenInput, UserToken } from '@/types/UserToken';

// Usar el sistema centralizado de mocks
import {
  createTestSetup,
  createUserTokenServiceMock,
  mockUserId,
  mockTokens,
  createMockUserToken
} from '@/mocks';

// Mock del servicio usando la función centralizada
const mockUserTokenService = createUserTokenServiceMock();

vi.mock('@/services/UserTokenService', () => ({
  UserTokenService: vi.fn(() => mockUserTokenService)
}));

// Wrapper component for testing
const TestWrapper = ({ children }: { children: ReactNode }) => (
  <TokenProvider>{children}</TokenProvider>
);

describe('TokenContext', () => {
  const { teardown } = createTestSetup(); // Configura console mocks automáticamente

  beforeEach(() => {
    vi.clearAllMocks();
    // Setup default successful responses
    mockUserTokenService.getUserTokens.mockResolvedValue(mockTokens);
    mockUserTokenService.createToken.mockResolvedValue(null); // Default a null, se sobrescribe en tests específicos
    mockUserTokenService.deleteToken.mockResolvedValue(undefined);
  });

  afterEach(() => {
    teardown(); // Limpia mocks automáticamente
  });

  describe('useTokens hook', () => {
    it('debería lanzar error cuando se usa fuera del provider', () => {
      expect(() => {
        renderHook(() => useTokens());
      }).toThrow('useTokens debe usarse dentro de un TokenProvider');
    });

    it('debería retornar el contexto cuando se usa dentro del provider', () => {
      const { result } = renderHook(() => useTokens(), { wrapper: TestWrapper });

      expect(result.current).toBeDefined();
      expect(result.current.tokens).toEqual([]);
      expect(result.current.isLoadingTokens).toBe(false);
      expect(result.current.hasLoadedTokens).toBe(false);
      expect(typeof result.current.loadTokens).toBe('function');
      expect(typeof result.current.addToken).toBe('function');
      expect(typeof result.current.deleteToken).toBe('function');
      expect(typeof result.current.clearTokens).toBe('function');
    });
  });

  describe('Estado inicial', () => {
    it('debería inicializar con valores por defecto', () => {
      const { result } = renderHook(() => useTokens(), { wrapper: TestWrapper });

      expect(result.current.tokens).toEqual([]);
      expect(result.current.isLoadingTokens).toBe(false);
      expect(result.current.hasLoadedTokens).toBe(false);
    });
  });

  describe('loadTokens', () => {
    it('debería cargar tokens exitosamente', async () => {
      const { result } = renderHook(() => useTokens(), { wrapper: TestWrapper });

      await act(async () => {
        await result.current.loadTokens(mockUserId);
      });

      expect(mockUserTokenService.getUserTokens).toHaveBeenCalledWith(mockUserId);
      expect(result.current.tokens).toEqual(mockTokens);
      expect(result.current.hasLoadedTokens).toBe(true);
      expect(result.current.isLoadingTokens).toBe(false);
    });

    it('debería usar cache y no recargar para el mismo usuario', async () => {
      const { result } = renderHook(() => useTokens(), { wrapper: TestWrapper });

      // Primera carga
      await act(async () => {
        await result.current.loadTokens(mockUserId);
      });

      // Segunda carga - debería usar cache
      await act(async () => {
        await result.current.loadTokens(mockUserId);
      });

      expect(mockUserTokenService.getUserTokens).toHaveBeenCalledTimes(1);
    });

    it('debería manejar errores de carga', async () => {
      const { result } = renderHook(() => useTokens(), { wrapper: TestWrapper });

      const error = new Error('Network error');
      mockUserTokenService.getUserTokens.mockRejectedValue(error);

      await act(async () => {
        await result.current.loadTokens(mockUserId);
      });

      expect(result.current.tokens).toEqual([]);
      expect(result.current.isLoadingTokens).toBe(false);
      // El console.error ya está mockeado globalmente
    });
  });

  describe('addToken', () => {
    it('debería añadir token exitosamente', async () => {
      const { result } = renderHook(() => useTokens(), { wrapper: TestWrapper });

      const mockNewTokenInput: CreateUserTokenInput = {
        provider: 'github',
        token_name: 'GitHub Token',
        token: 'raw-token'
      };

      const expectedToken = createMockUserToken({
        id: 'token-3',
        provider: 'github',
        token_name: 'GitHub Token'
      });

      // Configurar el mock para este test específico
      mockUserTokenService.createToken.mockResolvedValue(expectedToken);

      let addedToken: UserToken | null = null;
      await act(async () => {
        addedToken = await result.current.addToken(mockUserId, mockNewTokenInput);
      });

      expect(mockUserTokenService.createToken).toHaveBeenCalledWith(mockUserId, mockNewTokenInput);
      expect(addedToken).toEqual(expectedToken);
      expect(result.current.tokens).toContainEqual(expectedToken);
    });

    it('debería retornar null si el servicio falla', async () => {
      const { result } = renderHook(() => useTokens(), { wrapper: TestWrapper });

      mockUserTokenService.createToken.mockResolvedValue(null);

      const mockNewTokenInput: CreateUserTokenInput = {
        provider: 'github',
        token_name: 'GitHub Token',
        token: 'raw-token'
      };

      let addedToken: UserToken | null = null;
      await act(async () => {
        addedToken = await result.current.addToken(mockUserId, mockNewTokenInput);
      });

      expect(addedToken).toBeNull();
    });
  });

  describe('deleteToken', () => {
    it('debería eliminar token exitosamente', async () => {
      const { result } = renderHook(() => useTokens(), { wrapper: TestWrapper });

      // Cargar tokens primero
      await act(async () => {
        await result.current.loadTokens(mockUserId);
      });

      expect(result.current.tokens).toHaveLength(2);

      // Eliminar token
      await act(async () => {
        await result.current.deleteToken('token-1');
      });

      expect(mockUserTokenService.deleteToken).toHaveBeenCalledWith('', 'token-1');
      expect(result.current.tokens).toHaveLength(1);
      expect(result.current.tokens.find(t => t.id === 'token-1')).toBeUndefined();
    });
  });

  describe('clearTokens', () => {
    it('debería limpiar todos los tokens y resetear estado', async () => {
      const { result } = renderHook(() => useTokens(), { wrapper: TestWrapper });

      // Cargar tokens primero
      await act(async () => {
        await result.current.loadTokens(mockUserId);
      });

      expect(result.current.tokens).toHaveLength(2);
      expect(result.current.hasLoadedTokens).toBe(true);

      // Limpiar tokens
      act(() => {
        result.current.clearTokens();
      });

      expect(result.current.tokens).toEqual([]);
      expect(result.current.hasLoadedTokens).toBe(false);
      expect(result.current.isLoadingTokens).toBe(false);
      // El console.log ya está mockeado globalmente
    });
  });

  describe('Optimización y cache', () => {
    it('debería permitir recargar después de limpiar', async () => {
      const { result } = renderHook(() => useTokens(), { wrapper: TestWrapper });

      // Cargar, limpiar y recargar
      await act(async () => {
        await result.current.loadTokens(mockUserId);
      });

      act(() => {
        result.current.clearTokens();
      });

      await act(async () => {
        await result.current.loadTokens(mockUserId);
      });

      expect(mockUserTokenService.getUserTokens).toHaveBeenCalledTimes(2);
      expect(result.current.tokens).toEqual(mockTokens);
    });

    it('debería limpiar cache al cambiar de usuario', async () => {
      const { result } = renderHook(() => useTokens(), { wrapper: TestWrapper });

      // Cargar tokens para primer usuario
      await act(async () => {
        await result.current.loadTokens(mockUserId);
      });

      expect(result.current.tokens).toEqual(mockTokens);

      // Cambiar a otro usuario
      const newUserId = 'user-456';
      const newTokens = [mockTokens[0]];
      mockUserTokenService.getUserTokens.mockResolvedValue(newTokens);

      await act(async () => {
        await result.current.loadTokens(newUserId);
      });

      expect(result.current.tokens).toEqual(newTokens);
      expect(mockUserTokenService.getUserTokens).toHaveBeenCalledTimes(2);
    });

    it('debería optimizar re-renders', () => {
      const { result, rerender } = renderHook(() => useTokens(), { wrapper: TestWrapper });

      const initialLoadTokens = result.current.loadTokens;
      const initialAddToken = result.current.addToken;
      const initialDeleteToken = result.current.deleteToken;
      const initialClearTokens = result.current.clearTokens;

      // Re-render sin cambios
      rerender();

      // Las funciones deberían ser estables
      expect(result.current.loadTokens).toBe(initialLoadTokens);
      expect(result.current.addToken).toBe(initialAddToken);
      expect(result.current.deleteToken).toBe(initialDeleteToken);
      expect(result.current.clearTokens).toBe(initialClearTokens);
    });
  });

  describe('Casos edge', () => {
    it('debería manejar tokens con metadatos complejos', async () => {
      const { result } = renderHook(() => useTokens(), { wrapper: TestWrapper });

      const complexToken = createMockUserToken({
        id: 'token-3',
        provider: 'github',
        token_name: 'GitHub Token',
        token_metadata: {
          nested: { data: 'test' },
          array: [1, 2, 3],
          boolean: true
        }
      });

      mockUserTokenService.createToken.mockResolvedValue(complexToken);

      const mockNewTokenInput: CreateUserTokenInput = {
        provider: 'github',
        token_name: 'GitHub Token',
        token: 'raw-token'
      };

      await act(async () => {
        await result.current.addToken(mockUserId, mockNewTokenInput);
      });

      const addedToken = result.current.tokens.find(t => t.id === complexToken.id);
      expect(addedToken?.token_metadata).toEqual(complexToken.token_metadata);
    });

    it('debería manejar múltiples operaciones secuenciales', async () => {
      const { result } = renderHook(() => useTokens(), { wrapper: TestWrapper });

      // Cargar tokens
      await act(async () => {
        await result.current.loadTokens(mockUserId);
      });

      expect(result.current.tokens).toHaveLength(2);

      // Añadir token
      const mockNewTokenInput: CreateUserTokenInput = {
        provider: 'github',
        token_name: 'GitHub Token',
        token: 'raw-token'
      };

      const newToken = createMockUserToken({
        id: 'token-3',
        provider: 'github',
        token_name: 'GitHub Token'
      });

      // Configurar el mock para el token añadido
      mockUserTokenService.createToken.mockResolvedValue(newToken);

      await act(async () => {
        await result.current.addToken(mockUserId, mockNewTokenInput);
      });

      expect(result.current.tokens).toHaveLength(3);

      // Eliminar token
      await act(async () => {
        await result.current.deleteToken('token-1');
      });

      expect(result.current.tokens).toHaveLength(2);
      expect(result.current.tokens.find(t => t.id === 'token-1')).toBeUndefined();

      // Verificar que los otros tokens siguen ahí
      expect(result.current.tokens.find(t => t.id === 'token-2')).toBeDefined();
      expect(result.current.tokens.find(t => t.id === 'token-3')).toBeDefined();
    });
  });
});