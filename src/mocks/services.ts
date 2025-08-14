import { vi } from 'vitest';

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
