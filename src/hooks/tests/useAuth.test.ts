import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAuth } from '../useAuth';

// Usar el sistema centralizado de mocks
import {
  createTestSetup,
  createAuthServiceMock
} from '@/mocks';

// Mock de AuthService usando la función centralizada
const mockAuthService = createAuthServiceMock();

vi.mock('@/services/supabase/AuthService', () => ({
  AuthService: vi.fn(() => mockAuthService)
}));

vi.mock('@/adapters/output/infrastructure/supabase', () => ({
  supabase: {
    auth: {
      onAuthStateChange: vi.fn(() => ({
        data: {
          subscription: {
            id: 'test-subscription-id',
            callback: vi.fn(),
            unsubscribe: vi.fn()
          }
        }
      })),
      signInWithOAuth: vi.fn(() => Promise.resolve({
        data: {
          provider: 'google',
          url: 'https://accounts.google.com/oauth/authorize'
        },
        error: null
      })),
      signOut: vi.fn(() => Promise.resolve({
        error: null
      })),
      getUser: vi.fn(() => Promise.resolve({
        data: { user: null },
        error: null
      })),
      getSession: vi.fn(() => Promise.resolve({
        data: { session: null },
        error: null
      }))
    }
  }
}));

import { supabase } from '@/adapters/output/infrastructure/supabase';

describe('useAuth', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let authStateCallback: (event: string, session: any) => Promise<void>;
  const { teardown } = createTestSetup(); // ✅ Console mocks centralizados

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();

    // Mock window.location.origin
    Object.defineProperty(window, 'location', {
      value: { origin: 'http://localhost:3000' },
      writable: true
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(supabase.auth.onAuthStateChange).mockImplementation((callback: any) => {
      authStateCallback = callback;
      return { data: { subscription: { id: 'test-id', callback: vi.fn(), unsubscribe: vi.fn() } } };
    });
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
    teardown(); // ✅ Limpieza automática
  });

  it('debería inicializar estados correctamente y manejar timeout de loading', async () => {
    const { result } = renderHook(() => useAuth());

    expect(result.current.user).toBeNull();
    expect(result.current.userProfile).toBeNull();
    expect(result.current.isLoading).toBe(true);
    expect(result.current.isAuthenticated).toBe(false);

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(result.current.isLoading).toBe(false);
  });

  it('debería manejar autenticación exitosa y crear profile correctamente', async () => {
    const { result } = renderHook(() => useAuth());

    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      user_metadata: {
        name: 'Test User',
        avatar_url: 'https://avatar.url',
        full_name: 'Test Full User',
        picture: 'https://picture.url'
      },
      app_metadata: {
        provider: 'google'
      },
      last_sign_in_at: '2023-01-01T00:00:00Z',
      created_at: '2023-01-01T00:00:00Z'
    };

    const mockSession = { user: mockUser };

    await act(async () => {
      await authStateCallback('SIGNED_IN', mockSession);
    });

    expect(result.current.user).toEqual(mockUser);
    expect(result.current.userProfile).toEqual({
      id: 'user-123',
      email: 'test@example.com',
      name: 'Test User',
      avatar: 'https://avatar.url',
      provider: 'google',
      lastSignIn: '2023-01-01T00:00:00Z',
      createdAt: '2023-01-01T00:00:00Z'
    });
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.isLoading).toBe(false);
  });

  it('debería manejar logout y fallbacks de profile', async () => {
    const { result } = renderHook(() => useAuth());

    const mockUser = {
      id: 'user-123',
      email: 'fallback@test.com',
      user_metadata: {},
      app_metadata: {},
      last_sign_in_at: null,
      created_at: null
    };

    await act(async () => {
      await authStateCallback('SIGNED_IN', { user: mockUser });
    });

    expect(result.current.userProfile).toEqual({
      id: 'user-123',
      email: 'fallback@test.com',
      name: 'fallback',
      avatar: undefined,
      provider: 'google',
      lastSignIn: null,
      createdAt: null
    });

    await act(async () => {
      await authStateCallback('SIGNED_OUT', null);
    });

    expect(result.current.user).toBeNull();
    expect(result.current.userProfile).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.isLoading).toBe(false);
  });

  it('debería manejar métodos async: signInWithGoogle, signOut, hasTokensForProvider, getIntegrationToken', async () => {
    const { result } = renderHook(() => useAuth());

    const mockUser = { id: 'user-123', email: 'test@test.com' };
    await act(async () => {
      await authStateCallback('SIGNED_IN', { user: mockUser });
    });

    // Mock successful OAuth response
    vi.mocked(supabase.auth.signInWithOAuth).mockResolvedValue({
      data: {
        provider: 'google',
        url: 'https://accounts.google.com/oauth/authorize?redirect=test'
      },
      error: null
    });

    await act(async () => {
      await result.current.signInWithGoogle();
    });

    expect(supabase.auth.signInWithOAuth).toHaveBeenCalledWith({
      provider: 'google',
      options: {
        redirectTo: 'http://localhost:3000/auth/callback'
      }
    });

    // hasTokensForProvider siempre devuelve false en la implementación temporal
    const hasTokens = await result.current.hasTokensForProvider('notion');
    expect(hasTokens).toBe(false);

    // getIntegrationToken siempre devuelve null en la implementación temporal
    const token = await result.current.getIntegrationToken('notion', 'my-token');
    expect(token).toBe(null);

    // signOut ahora usa supabase directamente
    vi.mocked(supabase.auth.signOut).mockResolvedValue({ error: null });
    await result.current.signOut();
    expect(supabase.auth.signOut).toHaveBeenCalledTimes(1);

    // isAuthenticatedWithProvider devuelve isAuthenticated (true)
    const isAuthProvider = await result.current.isAuthenticatedWithProvider('google');
    expect(isAuthProvider).toBe(true);
  });

  it('debería manejar errores en métodos async y estados sin usuario', async () => {
    const { result } = renderHook(() => useAuth());

    expect(await result.current.hasTokensForProvider('notion')).toBe(false);
    expect(await result.current.getIntegrationToken('notion')).toBeNull();

    const mockError = new Error('Google auth failed');
    vi.mocked(supabase.auth.signInWithOAuth).mockRejectedValue(mockError);

    await act(async () => {
      try {
        await result.current.signInWithGoogle();
        expect.fail('Should have thrown error');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (error: any) {
        expect(error.message).toBe('Google auth failed');
      }
    });
    expect(result.current.isLoading).toBe(false);

    vi.mocked(supabase.auth.signOut).mockResolvedValue({
      error: new Error('Signout failed')
    });

    await act(async () => {
      try {
        await result.current.signOut();
        expect.fail('Should have thrown error');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (error: any) {
        expect(error.message).toBe('Signout failed');
      }
    });
    expect(result.current.isLoading).toBe(false);
  });

  it('debería cleanup correctamente (auth listener y timeout)', () => {
    const mockUnsubscribe = vi.fn();
    vi.mocked(supabase.auth.onAuthStateChange).mockReturnValue({
      data: { subscription: { id: 'cleanup-test-id', callback: vi.fn(), unsubscribe: mockUnsubscribe } }
    });

    const { unmount } = renderHook(() => useAuth());

    expect(vi.getTimerCount()).toBeGreaterThan(0);

    unmount();

    expect(mockUnsubscribe).toHaveBeenCalledTimes(1);
    expect(vi.getTimerCount()).toBe(0);
  });
});
