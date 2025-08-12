import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn()
}));

vi.mock('@/contexts/TokenContext', () => ({
  useTokens: vi.fn()
}));

vi.spyOn(console, 'log').mockImplementation(() => { });

import { useSettingsTokens } from '../useSettingsTokens';
import { useAuth } from '@/hooks/useAuth';
import { useTokens } from '@/contexts/TokenContext';

const mockUseAuth = vi.mocked(useAuth);
const mockUseTokens = vi.mocked(useTokens);

describe('useSettingsTokens', () => {
  const defaultAuthMock = {
    user: null,
    userProfile: null,
    isLoading: false,
    isAuthenticated: false,
    signInWithGoogle: vi.fn(),
    hasTokensForProvider: vi.fn(),
    getIntegrationToken: vi.fn(),
    signOut: vi.fn(),
    isAuthenticatedWithProvider: vi.fn()
  };

  const defaultTokensMock = {
    tokens: [],
    isLoadingTokens: false,
    hasLoadedTokens: false,
    loadTokens: vi.fn(),
    addToken: vi.fn(),
    deleteToken: vi.fn(),
    clearTokens: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue(defaultAuthMock);
    mockUseTokens.mockReturnValue(defaultTokensMock);
  });

  it('debería inicializar correctamente y pasar propiedades del contexto', async () => {
    const mockTokens = [{
      id: '1',
      user_id: 'user-1',
      provider: 'notion' as const,
      token_name: 'Token 1',
      encrypted_token: 'encrypted',
      token_metadata: {},
      created_at: '2023-01-01',
      updated_at: '2023-01-01',
      is_active: true
    }];

    mockUseTokens.mockReturnValue({
      ...defaultTokensMock,
      tokens: mockTokens,
      isLoadingTokens: true,
      hasLoadedTokens: true
    });

    const { result } = renderHook(() => useSettingsTokens());

    expect(result.current.tokens).toEqual(mockTokens);
    expect(result.current.isLoadingTokens).toBe(true);
    expect(result.current.hasLoadedTokens).toBe(true);

    // El hook selecciona automáticamente el primer token cuando hay tokens
    await waitFor(() => {
      expect(result.current.selectedTokenId).toBe('1');
    });

    expect(typeof result.current.setSelectedTokenId).toBe('function');
    expect(typeof result.current.addToken).toBe('function');
    expect(typeof result.current.deleteToken).toBe('function');
    expect(typeof result.current.clearTokens).toBe('function');
  });

  it('debería manejar autenticación: cargar tokens cuando autenticado, no cargar sin autenticación, evitar cargas múltiples', async () => {
    const loadTokensMock = vi.fn();
    mockUseTokens.mockReturnValue({
      ...defaultTokensMock,
      loadTokens: loadTokensMock
    });

    // Sin autenticación
    const { rerender } = renderHook(() => useSettingsTokens());
    expect(loadTokensMock).not.toHaveBeenCalled();

    // Con autenticación
    mockUseAuth.mockReturnValue({
      ...defaultAuthMock,
      userProfile: { id: 'user-123', email: 'test@test.com' },
      isAuthenticated: true
    });
    rerender();

    await waitFor(() => {
      expect(loadTokensMock).toHaveBeenCalledWith('user-123');
      expect(loadTokensMock).toHaveBeenCalledTimes(1);
    });

    // Re-render no debería cargar de nuevo
    rerender();
    expect(loadTokensMock).toHaveBeenCalledTimes(1);
  });

  it('debería manejar cambios de usuario: resetear estado y limpiar al desloguearse', async () => {
    const clearTokensMock = vi.fn();

    mockUseTokens.mockReturnValue({
      ...defaultTokensMock,
      clearTokens: clearTokensMock,
      tokens: [{
        id: '1',
        user_id: 'user-1',
        provider: 'notion' as const,
        token_name: 'Token 1',
        encrypted_token: 'encrypted',
        token_metadata: {},
        created_at: '2023-01-01',
        updated_at: '2023-01-01',
        is_active: true
      }]
    });

    const { result, rerender } = renderHook(() => useSettingsTokens());

    // Usuario 1
    mockUseAuth.mockReturnValue({
      ...defaultAuthMock,
      userProfile: { id: 'user-1', email: 'user1@test.com' },
      isAuthenticated: true
    });
    rerender();

    await waitFor(() => {
      expect(result.current.selectedTokenId).toBe('1');
    });

    // Cambio a usuario 2
    mockUseAuth.mockReturnValue({
      ...defaultAuthMock,
      userProfile: { id: 'user-2', email: 'user2@test.com' },
      isAuthenticated: true
    });
    mockUseTokens.mockReturnValue({
      ...defaultTokensMock,
      clearTokens: clearTokensMock,
      tokens: []
    });
    rerender();

    expect(result.current.selectedTokenId).toBeNull();

    // Desloguearse
    mockUseAuth.mockReturnValue({
      ...defaultAuthMock,
      userProfile: null,
      isAuthenticated: false
    });
    rerender();

    await waitFor(() => {
      expect(clearTokensMock).toHaveBeenCalled();
    });
  });

  it('debería manejar selección automática: seleccionar primer token, preservar selección manual, limpiar cuando no hay tokens', async () => {
    const mockTokens = [
      { id: 'token-1', user_id: 'user-1', provider: 'notion' as const, token_name: 'First Token', encrypted_token: 'enc1', token_metadata: {}, created_at: '2023-01-01', updated_at: '2023-01-01', is_active: true },
      { id: 'token-2', user_id: 'user-1', provider: 'notion' as const, token_name: 'Second Token', encrypted_token: 'enc2', token_metadata: {}, created_at: '2023-01-01', updated_at: '2023-01-01', is_active: true }
    ];

    // Selección automática del primer token
    mockUseTokens.mockReturnValue({
      ...defaultTokensMock,
      tokens: mockTokens
    });

    const { result, rerender } = renderHook(() => useSettingsTokens());

    await waitFor(() => {
      expect(result.current.selectedTokenId).toBe('token-1');
    });

    // Selección manual preservada
    act(() => {
      result.current.setSelectedTokenId('token-2');
    });
    expect(result.current.selectedTokenId).toBe('token-2');

    // Limpiar cuando no hay tokens
    mockUseTokens.mockReturnValue({
      ...defaultTokensMock,
      tokens: []
    });
    rerender();

    expect(result.current.selectedTokenId).toBeNull();
  });

  it('debería memoizar funciones y resultado: mantener referencias estables, crear nuevo resultado cuando cambian dependencias', () => {
    const addTokenMock = vi.fn();
    const deleteTokenMock = vi.fn();
    const clearTokensMock = vi.fn();

    mockUseTokens.mockReturnValue({
      ...defaultTokensMock,
      addToken: addTokenMock,
      deleteToken: deleteTokenMock,
      clearTokens: clearTokensMock
    });

    const { result, rerender } = renderHook(() => useSettingsTokens());

    const firstResult = result.current;
    const firstAddToken = result.current.addToken;
    const firstSetFunction = result.current.setSelectedTokenId;

    // Sin cambios - mismo resultado
    rerender();
    expect(result.current).toBe(firstResult);
    expect(result.current.addToken).toBe(firstAddToken);
    expect(result.current.setSelectedTokenId).toBe(firstSetFunction);

    // Con cambios - nuevo resultado
    mockUseTokens.mockReturnValue({
      ...defaultTokensMock,
      tokens: [{ id: 'new-token', user_id: 'user-1', provider: 'notion' as const, token_name: 'New Token', encrypted_token: 'enc', token_metadata: {}, created_at: '2023-01-01', updated_at: '2023-01-01', is_active: true }]
    });
    rerender();

    expect(result.current).not.toBe(firstResult);
    expect(result.current.tokens).toHaveLength(1);
  });

  it('debería manejar casos edge: userProfile sin id, cambios rápidos de estado', async () => {
    const loadTokensMock = vi.fn();
    const clearTokensMock = vi.fn();

    mockUseTokens.mockReturnValue({
      ...defaultTokensMock,
      loadTokens: loadTokensMock,
      clearTokens: clearTokensMock
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (mockUseAuth as any).mockReturnValue({
      ...defaultAuthMock,
      userProfile: { email: 'test@test.com' },
      isAuthenticated: true
    });

    const { rerender } = renderHook(() => useSettingsTokens());
    expect(loadTokensMock).not.toHaveBeenCalled();

    mockUseAuth.mockReturnValue({
      ...defaultAuthMock,
      userProfile: { id: 'user-123', email: 'test@test.com' },
      isAuthenticated: true
    });
    rerender();

    mockUseAuth.mockReturnValue({
      ...defaultAuthMock,
      userProfile: null,
      isAuthenticated: false
    });
    rerender();

    await waitFor(() => {
      expect(clearTokensMock).toHaveBeenCalled();
    });
  });
});
