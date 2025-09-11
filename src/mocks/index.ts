import { vi } from 'vitest';

export function createTestSetup() {
  const originalConsole = {
    log: console.log,
    warn: console.warn,
    error: console.error,
    info: console.info,
    debug: console.debug,
  };

  const setupMocks = () => {
    console.log = vi.fn();
    console.warn = vi.fn();
    console.error = vi.fn();
    console.info = vi.fn();
    console.debug = vi.fn();
  };

  const teardown = () => {
    vi.clearAllMocks();
    vi.clearAllTimers();
    vi.restoreAllMocks();

    console.log = originalConsole.log;
    console.warn = originalConsole.warn;
    console.error = originalConsole.error;
    console.info = originalConsole.info;
    console.debug = originalConsole.debug;

    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  };

  setupMocks();

  return {
    teardown,
    originalConsole,
  };
}

export const createMockEnvironment = (envVars: Record<string, string>) => {
  Object.entries(envVars).forEach(([key, value]) => {
    vi.stubEnv(key, value);
  });
};

export const createMockFetch = (mockResponse: any, options: { ok?: boolean; status?: number } = {}) => {
  const { ok = true, status = 200 } = options;

  return vi.fn().mockResolvedValue({
    ok,
    status,
    json: vi.fn().mockResolvedValue(mockResponse),
    text: vi.fn().mockResolvedValue(JSON.stringify(mockResponse)),
    headers: new Headers(),
    clone: vi.fn(),
    body: null,
    bodyUsed: false,
    redirected: false,
    type: 'default' as ResponseType,
    url: '',
  });
};

export const mockSupabaseClient = {
  auth: {
    getUser: vi.fn(),
    signInWithOAuth: vi.fn(),
    signOut: vi.fn(),
    onAuthStateChange: vi.fn().mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    }),
  },
  from: vi.fn().mockReturnThis(),
  select: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  delete: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  neq: vi.fn().mockReturnThis(),
  in: vi.fn().mockReturnThis(),
  contains: vi.fn().mockReturnThis(),
  single: vi.fn().mockReturnThis(),
  maybeSingle: vi.fn().mockReturnThis(),
  textSearch: vi.fn().mockReturnThis(),
  order: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
  range: vi.fn().mockReturnThis(),
};

export const mockNotionClient = {
  databases: {
    query: vi.fn(),
    retrieve: vi.fn(),
  },
  pages: {
    retrieve: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  blocks: {
    children: {
      list: vi.fn(),
      append: vi.fn(),
    },
  },
  users: {
    retrieve: vi.fn(),
    list: vi.fn(),
    me: vi.fn(),
  },
};

export const createMockHttpClient = (mockResponse?: any) => ({
  get: vi.fn().mockResolvedValue(mockResponse),
  post: vi.fn().mockResolvedValue(mockResponse),
  put: vi.fn().mockResolvedValue(mockResponse),
  patch: vi.fn().mockResolvedValue(mockResponse),
  delete: vi.fn().mockResolvedValue(mockResponse),
});

export const createMockLogger = () => ({
  log: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
  debug: vi.fn(),
});

export const createMockNextRequest = (
  bodyOrUrl: any = {},
  method = 'POST',
  headers: Record<string, string> = { 'Content-Type': 'application/json' },
  url = 'http://localhost:3000/api/chat'
) => {
  const body = typeof bodyOrUrl === 'string' ? undefined : bodyOrUrl;
  const requestUrl = typeof bodyOrUrl === 'string' ? bodyOrUrl : url;

  const request = {
    url: requestUrl,
    method,
    headers: new Headers(headers),
    json: vi.fn().mockResolvedValue(body),
    text: vi.fn().mockResolvedValue(JSON.stringify(body)),
    formData: vi.fn(),
    arrayBuffer: vi.fn(),
    blob: vi.fn(),
    clone: vi.fn(),
    body: body ? JSON.stringify(body) : null,
    bodyUsed: false,
    cache: 'default' as RequestCache,
    credentials: 'same-origin' as RequestCredentials,
    destination: '' as RequestDestination,
    integrity: '',
    keepalive: false,
    mode: 'cors' as RequestMode,
    redirect: 'follow' as RequestRedirect,
    referrer: '',
    referrerPolicy: '' as ReferrerPolicy,
    signal: new AbortController().signal,
  };

  return request as any;
};

export const createMockReadableStream = () => {
  const chunks: any[] = [];
  let isClosed = false;

  const controller = {
    enqueue: vi.fn((chunk: any) => {
      if (!isClosed) {
        chunks.push(chunk);
      }
    }),
    close: vi.fn(() => {
      isClosed = true;
    }),
    error: vi.fn(),
  };

  const stream = new ReadableStream({
    start(ctrl) {
      Object.assign(ctrl, controller);
    },
  });

  return { stream, controller, chunks, isClosed: () => isClosed };
};
