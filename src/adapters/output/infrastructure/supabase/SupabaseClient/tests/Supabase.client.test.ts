import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createBrowserClient } from '@supabase/ssr';
import { SupabaseClient } from '@supabase/supabase-js';

// Usar el sistema centralizado de mocks
import {
  createTestSetup
} from '@/mocks';

vi.mock('@supabase/ssr', () => ({
  createBrowserClient: vi.fn()
}));

const originalConsole = { ...console };

describe('Supabase client', () => {
  const mockCreateBrowserClient = vi.mocked(createBrowserClient);
  const originalEnv = process.env;
  const originalWindow = global.window;
  const { teardown } = createTestSetup(); // ✅ Console mocks centralizados

  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();

    process.env = { ...originalEnv };

    delete (global as unknown as { window?: unknown }).window;
  });

  afterEach(() => {
    teardown(); // ✅ Limpieza automática
    vi.clearAllMocks();
    process.env = originalEnv;
    global.window = originalWindow;
    console.log = originalConsole.log;
    console.error = originalConsole.error;
  });

  describe('Client creation', () => {
    it('should throw error when trying to create client on server side', async () => {
      const mockUrl = 'https://test.supabase.co';
      const mockKey = 'test-anon-key';

      process.env.NEXT_PUBLIC_SUPABASE_URL = mockUrl;
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = mockKey;

      const { supabase } = await import('../SupabaseClient');

      expect(() => {
        const fromMethod = supabase.from;
        return fromMethod;
      }).toThrow('SupabaseClient should only be used on client side. Use server client for server-side operations.');

      expect(mockCreateBrowserClient).not.toHaveBeenCalled();
    });

  });

  describe('Client-side environment', () => {
    beforeEach(() => {
      (global as unknown as { window?: unknown }).window = {};
    });

    it('should use NEXT_PUBLIC_ variables in client environment', async () => {
      const mockUrl = 'https://test.supabase.co';
      const mockKey = 'test-anon-key';
      const mockClient = { from: vi.fn() } as unknown as SupabaseClient<unknown>;

      process.env.NEXT_PUBLIC_SUPABASE_URL = mockUrl;
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = mockKey;
      mockCreateBrowserClient.mockReturnValue(mockClient);

      const { supabase } = await import('../SupabaseClient');

      const fromMethod = supabase.from;

      expect(mockCreateBrowserClient).toHaveBeenCalledWith(mockUrl, mockKey, expect.objectContaining({
        cookies: expect.objectContaining({
          getAll: expect.any(Function),
          setAll: expect.any(Function)
        })
      }));
      expect(fromMethod).toBeDefined();
    });

    it('should throw error when NEXT_PUBLIC_SUPABASE_URL is missing in client', async () => {
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';

      const { supabase } = await import('../SupabaseClient');

      expect(() => {
        const fromMethod = supabase.from;
        return fromMethod;
      }).toThrow('❌ La variable de entorno NEXT_PUBLIC_SUPABASE_URL es requerida');

      expect(mockCreateBrowserClient).not.toHaveBeenCalled();
    });
  });

});