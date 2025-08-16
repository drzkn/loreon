import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createClient } from '@supabase/supabase-js';

// Usar el sistema centralizado de mocks
import {
  createTestSetup
} from '@/mocks';

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn()
}));

const mockCreateClient = vi.mocked(createClient);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySupabaseClient = any;

describe('SupabaseServerClient', () => {
  const originalEnv = process.env;
  const originalWindow = global.window;
  const { teardown } = createTestSetup(); // ✅ Console mocks centralizados

  beforeEach(() => {
    vi.resetAllMocks();
    process.env = { ...originalEnv };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (global as any).window;

    vi.resetModules();
  });

  afterEach(() => {
    teardown(); // ✅ Limpieza automática
    process.env = originalEnv;
    global.window = originalWindow;
  });

  describe('createSupabaseServerClient', () => {
    it('debe crear un cliente singleton correctamente', async () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-key';

      const mockClient = { test: 'client' };
      mockCreateClient.mockReturnValue(mockClient as AnySupabaseClient);

      const { default: supabaseServer } = await import('../SupabaseServerClient');

      void (supabaseServer as AnySupabaseClient).test;

      expect(mockCreateClient).toHaveBeenCalledWith(
        'https://test.supabase.co',
        'test-key',
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false
          }
        }
      );
    });

    it('debe reutilizar la misma instancia en llamadas subsequentes', async () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-key';

      const mockClient = { test: 'client' };
      mockCreateClient.mockReturnValue(mockClient as AnySupabaseClient);

      const { default: supabaseServer1 } = await import('../SupabaseServerClient');
      const { default: supabaseServer2 } = await import('../SupabaseServerClient');

      void (supabaseServer1 as AnySupabaseClient).test;
      void (supabaseServer2 as AnySupabaseClient).test;

      expect(mockCreateClient).toHaveBeenCalledTimes(1);
    });

    it('debe lanzar error cuando se usa en el lado cliente', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (global as any).window = {};
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-key';

      const { default: supabaseServer } = await import('../SupabaseServerClient');

      expect(() => {
        void (supabaseServer as AnySupabaseClient).test;
      }).toThrow('SupabaseServerClient should only be used on server side. Use client for client-side operations.');
    });
  });

  describe('getServerKeys', () => {
    it('debe lanzar error cuando NEXT_PUBLIC_SUPABASE_URL no está definida', async () => {
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-key';

      const { default: supabaseServer } = await import('../SupabaseServerClient');

      expect(() => {
        void (supabaseServer as AnySupabaseClient).test;
      }).toThrow('❌ La variable de entorno NEXT_PUBLIC_SUPABASE_URL es requerida');
    });

    it('debe lanzar error cuando NEXT_PUBLIC_SUPABASE_ANON_KEY no está definida', async () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
      delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      const { default: supabaseServer } = await import('../SupabaseServerClient');

      expect(() => {
        void (supabaseServer as AnySupabaseClient).test;
      }).toThrow('❌ La variable de entorno NEXT_PUBLIC_SUPABASE_ANON_KEY es requerida');
    });

    it('debe retornar las llaves correctamente cuando ambas variables están definidas', async () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-key';

      const mockClient = { test: 'client' };
      mockCreateClient.mockReturnValue(mockClient as AnySupabaseClient);

      const { default: supabaseServer } = await import('../SupabaseServerClient');

      void (supabaseServer as AnySupabaseClient).test;

      expect(mockCreateClient).toHaveBeenCalledWith(
        'https://test.supabase.co',
        'test-key',
        expect.any(Object)
      );
    });
  });

});