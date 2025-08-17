import { vi } from 'vitest';

export const createSupabaseChainMock = () => {
  const mockChain = {
    from: vi.fn(),
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    eq: vi.fn(),
    neq: vi.fn(),
    order: vi.fn(),
    limit: vi.fn(),
    single: vi.fn(),
    nullsFirst: vi.fn(),
    range: vi.fn(),
    textSearch: vi.fn(),
    rpc: vi.fn()
  };

  Object.values(mockChain).forEach(fn => {
    fn.mockReturnValue(mockChain);
  });

  mockChain.single.mockResolvedValue({ data: null, error: null });
  mockChain.select.mockResolvedValue({ data: [], error: null });

  return mockChain;
};

export const createSupabaseMock = () => {
  const chain = createSupabaseChainMock();
  return {
    ...chain,
    auth: {
      signInWithOAuth: vi.fn(),
      signInAnonymously: vi.fn(),
      getUser: vi.fn(),
      getSession: vi.fn(),
      signOut: vi.fn()
    }
  };
};

export const createMockSupabaseResponse = <T>(data: T, error: unknown = null) => ({
  data,
  error
});

export const createMockSupabaseErrorResponse = (message: string, code?: string) => ({
  data: null,
  error: {
    message,
    code: code || 'UNKNOWN_ERROR',
    details: null,
    hint: null
  }
});
