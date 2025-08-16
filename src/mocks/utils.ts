import { vi, expect } from 'vitest';

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
// TEST SETUP UTILITIES
// ===============================
export const createTestSetup = () => {
  const consoleMocks = setupConsoleMocks();

  const teardown = () => {
    vi.clearAllMocks();
    restoreConsoleMocks(consoleMocks);
  };

  return { consoleMocks, teardown };
};

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

// ===============================
// ASYNC TEST UTILITIES
// ===============================
export const waitFor = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const expectToResolve = async <T>(promise: Promise<T>): Promise<T> => {
  try {
    return await promise;
  } catch (error) {
    throw new Error(`Expected promise to resolve, but it rejected with: ${error}`);
  }
};

export const expectToReject = async <T>(promise: Promise<T>): Promise<unknown> => {
  try {
    await promise;
    throw new Error('Expected promise to reject, but it resolved');
  } catch (error) {
    return error;
  }
};

// ===============================
// MOCK HELPER UTILITIES
// ===============================
export const resetAllMocks = () => {
  vi.clearAllMocks();
  vi.resetAllMocks();
};

export const mockImplementationOnce = <T extends (...args: unknown[]) => unknown>(
  fn: ReturnType<typeof vi.fn>,
  implementation: T
) => {
  fn.mockImplementationOnce(implementation);
  return fn;
};

// ===============================
// ENVIRONMENT UTILITIES
// ===============================
export const withMockedEnv = <T>(
  envVars: Record<string, string | undefined>,
  callback: () => T
): T => {
  const originalEnv = { ...process.env };

  try {
    Object.assign(process.env, envVars);
    return callback();
  } finally {
    process.env = originalEnv;
  }
};

export const withMockedModules = async <T>(
  mocks: Record<string, unknown>,
  callback: () => Promise<T>
): Promise<T> => {
  const mockPromises = Object.entries(mocks).map(([module, mock]) =>
    vi.doMock(module, () => mock as Record<string, unknown>)
  );

  await Promise.all(mockPromises);

  try {
    return await callback();
  } finally {
    Object.keys(mocks).forEach(module => vi.doUnmock(module));
  }
};

// ===============================
// ASSERTION UTILITIES
// ===============================
export const expectCalledWith = (
  mockFn: ReturnType<typeof vi.fn>,
  ...args: unknown[]
) => {
  expect(mockFn).toHaveBeenCalledWith(...args);
};

export const expectCalledTimes = (
  mockFn: ReturnType<typeof vi.fn>,
  times: number
) => {
  expect(mockFn).toHaveBeenCalledTimes(times);
};

export const expectNthCalledWith = (
  mockFn: ReturnType<typeof vi.fn>,
  nthCall: number,
  ...args: unknown[]
) => {
  expect(mockFn).toHaveBeenNthCalledWith(nthCall, ...args);
};

// ===============================
// ERROR TESTING UTILITIES
// ===============================
export const expectThrowsError = (
  fn: () => unknown,
  expectedError?: string | RegExp
) => {
  if (expectedError) {
    expect(fn).toThrow(expectedError);
  } else {
    expect(fn).toThrow();
  }
};

export const expectAsyncThrowsError = async (
  promise: Promise<unknown>,
  expectedError?: string | RegExp
) => {
  if (expectedError) {
    await expect(promise).rejects.toThrow(expectedError);
  } else {
    await expect(promise).rejects.toThrow();
  }
};

// ===============================
// API TESTING UTILITIES
// ===============================
export const createMockResponse = (
  data: unknown,
  status: number = 200,
  headers: Record<string, string> = {}
) => {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...headers
    }
  });
};

export const createMockErrorResponse = (
  message: string,
  status: number = 500
) => {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
};
