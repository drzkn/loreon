// Exportar todos los mocks globales
export * from './mocks/global-mocks';

// Exportar todos los datos de prueba
export * from './fixtures/test-data';

// Exportar todas las utilidades de test
export * from './utils/test-utils';

// Exportaciones convenientes agrupadas
export {
  setupConsoleMocks,
  restoreConsoleMocks,
  createSupabaseChainMock,
  createSupabaseMock,
  createUserTokenServiceMock,
  createAuthServiceMock,
  createNotionMigrationServiceMock,
  createNotionNativeRepositoryMock,
  createEmbeddingsServiceMock,
  createNotionContentExtractorMock,
  createContainerMock,
  setupWindowMocks,
  restoreWindowMocks,
  createAiSdkMocks
} from './mocks/global-mocks';

export {
  mockUserId,
  mockUserId2,
  createMockUserToken,
  mockTokens,
  createMockTokenInput,
  createMockNotionPage,
  createMockNotionBlock,
  mockNotionBlocks,
  createMockSupabaseResponse,
  createMockSupabaseErrorResponse,
  createMockNextRequest,
  createMockRequestWithAuth,
  createMockChatMessage,
  mockChatMessages,
  createMockEmbedding,
  mockEmbeddings,
  mockErrors,
  mockEnvVars
} from './fixtures/test-data';

export {
  createTestSetup,
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
  logMockCalls,
  inspectMockResults,
  createMockReactNode,
  mockReactHook,
  createMockResponse,
  createMockErrorResponse
} from './utils/test-utils';
