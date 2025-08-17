import { vi } from 'vitest';

// ===============================
// CONSOLE MOCKS
// ===============================
export const setupConsoleMocks = () => {
  const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => { });
  const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
  const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => { });

  return { consoleSpy, consoleErrorSpy, consoleWarnSpy };
};

export const restoreConsoleMocks = (spies: ReturnType<typeof setupConsoleMocks>) => {
  spies.consoleSpy.mockRestore();
  spies.consoleErrorSpy.mockRestore();
  spies.consoleWarnSpy.mockRestore();
};

// ===============================
// SUPABASE CLIENT MOCKS
// ===============================
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

  // Chain all methods to return the mock for fluent interface
  Object.values(mockChain).forEach(fn => {
    fn.mockReturnValue(mockChain);
  });

  // Default successful responses
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

// ===============================
// SERVICE MOCKS
// ===============================
export const createUserTokenServiceMock = () => ({
  getUserTokens: vi.fn(),
  createToken: vi.fn(),
  deleteToken: vi.fn(),
  updateToken: vi.fn(),
  hasTokensForProvider: vi.fn(),
  getDecryptedToken: vi.fn(),
  encryptToken: vi.fn(),
  decryptToken: vi.fn()
});

export const createAuthServiceMock = () => ({
  signInWithGoogle: vi.fn(),
  hasTokensForProvider: vi.fn(),
  getIntegrationToken: vi.fn(),
  signInWithProvider: vi.fn(),
  signInAnonymously: vi.fn(),
  getCurrentUser: vi.fn(),
  isAuthenticated: vi.fn(),
  getUserProfile: vi.fn(),
  signOut: vi.fn(),
  getSession: vi.fn(),
  isAuthenticatedWithProvider: vi.fn()
});

export const createNotionMigrationServiceMock = () => ({
  migratePage: vi.fn(),
  getMigrationStats: vi.fn(),
  migratePages: vi.fn(),
  repository: {
    createSyncLog: vi.fn(),
    updateSyncLog: vi.fn(),
    savePage: vi.fn(),
    saveBlocks: vi.fn(),
    saveEmbeddings: vi.fn(),
    getStorageStats: vi.fn(),
    getPageByNotionId: vi.fn(),
    getPageBlocks: vi.fn(),
    searchBlocks: vi.fn(),
    searchSimilarEmbeddings: vi.fn()
  }
});

export const createNotionNativeRepositoryMock = () => ({
  savePage: vi.fn(),
  saveBlocks: vi.fn(),
  saveEmbeddings: vi.fn(),
  getStorageStats: vi.fn(),
  getPageByNotionId: vi.fn(),
  getPageBlocks: vi.fn(),
  searchBlocks: vi.fn(),
  searchSimilarEmbeddings: vi.fn()
});

export const createEmbeddingsServiceMock = () => ({
  generateEmbeddings: vi.fn(),
  generateEmbedding: vi.fn()
});

export const createNotionContentExtractorMock = () => ({
  extractPageContent: vi.fn(),
  generateTextChunks: vi.fn()
});

// ===============================
// DI CONTAINER MOCK
// ===============================
export const createContainerMock = () => ({
  getPageUseCase: {
    execute: vi.fn()
  },
  getBlockChildrenRecursiveUseCase: {
    execute: vi.fn()
  }
});

// ===============================
// WINDOW & ENVIRONMENT MOCKS
// ===============================
export const setupWindowMocks = () => {
  const originalLocation = window.location;

  Object.defineProperty(window, 'location', {
    value: {
      origin: 'https://test.com',
      href: 'https://test.com'
    },
    writable: true
  });

  Object.defineProperty(window, 'alert', {
    value: vi.fn(),
    writable: true
  });

  return { originalLocation };
};

export const restoreWindowMocks = (original: { originalLocation: Location }) => {
  Object.defineProperty(window, 'location', {
    value: original.originalLocation,
    writable: true
  });
};

// ===============================
// AI SDK MOCKS
// ===============================
export const createAiSdkMocks = () => {
  const streamTextMock = vi.fn(() => ({
    toDataStreamResponse: vi.fn(() => new Response('AI response'))
  }));

  const googleModelMock = vi.fn(() => 'mocked-model');

  return { streamTextMock, googleModelMock };
};
