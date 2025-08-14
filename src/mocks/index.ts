// Exportar todos los mocks de servicios
export * from './services';

// Exportar todos los mocks de Supabase
export * from './supabase';

// Exportar todos los datos de prueba
export * from './data';

// Exportar todas las utilidades de test
export * from './utils';

// Re-exportaciones convenientes agrupadas
export {
  createUserTokenServiceMock,
  createAuthServiceMock,
  createNotionMigrationServiceMock,
  createNotionNativeRepositoryMock,
  createEmbeddingsServiceMock,
  createNotionContentExtractorMock,
  createContainerMock
} from './services';

export {
  createSupabaseChainMock,
  createSupabaseMock,
  createMockSupabaseResponse,
  createMockSupabaseErrorResponse
} from './supabase';

export {
  mockUserId,
  mockUserId2,
  createMockUserToken,
  mockTokens,
  createMockTokenInput,
  createMockNotionPage,
  createMockNotionBlock,
  mockNotionBlocks,
  createMockNextRequest,
  createMockRequestWithAuth,
  createMockChatMessage,
  mockChatMessages,
  createMockEmbedding,
  mockEmbeddings,
  mockErrors
} from './data';

export {
  setupConsoleMocks,
  restoreConsoleMocks,
  createTestSetup,
  setupWindowMocks,
  restoreWindowMocks,
  createAiSdkMocks,
  waitFor,
  expectToResolve,
  expectToReject,
  resetAllMocks,
  mockImplementationOnce,
  withMockedEnv,
  withMockedModules,
  expectCalledWith,
  expectCalledTimes,
  expectNthCalledWith,
  expectThrowsError,
  expectAsyncThrowsError,
  createMockResponse,
  createMockErrorResponse
} from './utils';