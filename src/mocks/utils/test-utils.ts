import { vi, expect } from 'vitest';
import { setupConsoleMocks, restoreConsoleMocks } from './global-mocks';

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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.doMock(module, () => mock as any)
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
// DEBUGGING UTILITIES
// ===============================
export const logMockCalls = (mockFn: ReturnType<typeof vi.fn>, label?: string) => {
  const calls = mockFn.mock.calls;
  console.log(`🐛 ${label || 'Mock'} was called ${calls.length} times:`);
  calls.forEach((call, index) => {
    console.log(`  Call ${index + 1}:`, call);
  });
};

export const inspectMockResults = (mockFn: ReturnType<typeof vi.fn>, label?: string) => {
  const results = mockFn.mock.results;
  console.log(`🐛 ${label || 'Mock'} results:`);
  results.forEach((result, index) => {
    console.log(`  Result ${index + 1}:`, result);
  });
};

// ===============================
// COMPONENT TESTING UTILITIES (React)
// ===============================
export const createMockReactNode = (content: string = 'Mock Content') => ({
  type: 'div',
  props: { children: content },
  key: null,
  ref: null
});

export const mockReactHook = <T>(hookResult: T) => {
  return () => hookResult;
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
