import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Mock de las dependencias
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn()
}));

// Mock de console para evitar logs en tests
const mockConsoleLog = vi.fn();
const mockConsoleError = vi.fn();
const originalConsole = { ...console };

describe('Supabase client', () => {
  const mockCreateClient = vi.mocked(createClient);
  const originalEnv = process.env;
  const originalWindow = global.window;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();

    // Mock console
    console.log = mockConsoleLog;
    console.error = mockConsoleError;

    // Reset environment
    process.env = { ...originalEnv };

    // Mock window para simular entorno servidor por defecto
    delete (global as unknown as { window?: unknown }).window;
  });

  afterEach(() => {
    vi.clearAllMocks();
    process.env = originalEnv;
    global.window = originalWindow;
    console.log = originalConsole.log;
    console.error = originalConsole.error;
  });

  describe('Client creation', () => {
    it('should create Supabase client successfully with valid environment variables', async () => {
      // Arrange
      const mockUrl = 'https://test.supabase.co';
      const mockKey = 'test-anon-key';
      const mockClient = { from: vi.fn() } as unknown as SupabaseClient<unknown>;

      process.env.SUPABASE_URL = mockUrl;
      process.env.SUPABASE_ANON_KEY = mockKey;
      mockCreateClient.mockReturnValue(mockClient);

      // Act
      const { supabase } = await import('../SupabaseClient');

      // Trigger the client creation by accessing a property
      const fromMethod = supabase.from;

      // Assert
      expect(mockCreateClient).toHaveBeenCalledWith(mockUrl, mockKey);
      expect(mockConsoleLog).toHaveBeenCalledWith('🔍 [SupabaseClient] Servidor - Variables disponibles:', {
        'SUPABASE_URL': 'CONFIGURADA',
        'SUPABASE_ANON_KEY': 'CONFIGURADA'
      });
      expect(mockConsoleLog).toHaveBeenCalledWith('✅ [SupabaseClient] Creando cliente Supabase...');
      expect(fromMethod).toBeDefined();
    });

    it('should throw error when SUPABASE_URL is missing', async () => {
      // Arrange
      delete process.env.SUPABASE_URL;
      process.env.SUPABASE_ANON_KEY = 'test-anon-key';

      // Act & Assert
      const { supabase } = await import('../SupabaseClient');

      expect(() => {
        const fromMethod = supabase.from;
        return fromMethod;
      }).toThrow('❌ La variable de entorno SUPABASE_URL es requerida');

      expect(mockCreateClient).not.toHaveBeenCalled();
    });

    it('should throw error when SUPABASE_ANON_KEY is missing', async () => {
      // Arrange
      process.env.SUPABASE_URL = 'https://test.supabase.co';
      delete process.env.SUPABASE_ANON_KEY;

      // Act & Assert
      const { supabase } = await import('../SupabaseClient');

      expect(() => {
        const fromMethod = supabase.from;
        return fromMethod;
      }).toThrow('❌ La variable de entorno SUPABASE_ANON_KEY es requerida');

      expect(mockCreateClient).not.toHaveBeenCalled();
    });

    it('should throw error when both environment variables are missing', async () => {
      // Arrange
      delete process.env.SUPABASE_URL;
      delete process.env.SUPABASE_ANON_KEY;

      // Act & Assert
      const { supabase } = await import('../SupabaseClient');

      expect(() => {
        const fromMethod = supabase.from;
        return fromMethod;
      }).toThrow('❌ La variable de entorno SUPABASE_URL es requerida');

      expect(mockCreateClient).not.toHaveBeenCalled();
    });

    it('should throw error when SUPABASE_URL is empty string', async () => {
      // Arrange
      process.env.SUPABASE_URL = '';
      process.env.SUPABASE_ANON_KEY = 'test-anon-key';

      // Act & Assert
      const { supabase } = await import('../SupabaseClient');

      expect(() => {
        const fromMethod = supabase.from;
        return fromMethod;
      }).toThrow('❌ La variable de entorno SUPABASE_URL es requerida');

      expect(mockCreateClient).not.toHaveBeenCalled();
    });

    it('should throw error when SUPABASE_ANON_KEY is empty string', async () => {
      // Arrange
      process.env.SUPABASE_URL = 'https://test.supabase.co';
      process.env.SUPABASE_ANON_KEY = '';

      // Act & Assert
      const { supabase } = await import('../SupabaseClient');

      expect(() => {
        const fromMethod = supabase.from;
        return fromMethod;
      }).toThrow('❌ La variable de entorno SUPABASE_ANON_KEY es requerida');

      expect(mockCreateClient).not.toHaveBeenCalled();
    });
  });

  describe('Client-side environment', () => {
    beforeEach(() => {
      // Mock window para simular entorno cliente
      (global as unknown as { window?: unknown }).window = {};
    });

    it('should use NEXT_PUBLIC_ variables in client environment', async () => {
      // Arrange
      const mockUrl = 'https://test.supabase.co';
      const mockKey = 'test-anon-key';
      const mockClient = { from: vi.fn() } as unknown as SupabaseClient<unknown>;

      process.env.NEXT_PUBLIC_SUPABASE_URL = mockUrl;
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = mockKey;
      mockCreateClient.mockReturnValue(mockClient);

      // Act
      const { supabase } = await import('../SupabaseClient');

      // Trigger the client creation by accessing a property
      const fromMethod = supabase.from;

      // Assert
      expect(mockCreateClient).toHaveBeenCalledWith(mockUrl, mockKey);
      expect(mockConsoleLog).toHaveBeenCalledWith('🔍 [SupabaseClient] Cliente - Variables disponibles:', {
        'NEXT_PUBLIC_SUPABASE_URL': 'CONFIGURADA',
        'NEXT_PUBLIC_SUPABASE_ANON_KEY': 'CONFIGURADA'
      });
      expect(fromMethod).toBeDefined();
    });

    it('should throw error when NEXT_PUBLIC_SUPABASE_URL is missing in client', async () => {
      // Arrange
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';

      // Act & Assert
      const { supabase } = await import('../SupabaseClient');

      expect(() => {
        const fromMethod = supabase.from;
        return fromMethod;
      }).toThrow('❌ La variable de entorno NEXT_PUBLIC_SUPABASE_URL es requerida');

      expect(mockCreateClient).not.toHaveBeenCalled();
    });
  });

  describe('Client exports', () => {
    it('should export supabase client as default export', async () => {
      // Arrange
      const mockUrl = 'https://test.supabase.co';
      const mockKey = 'test-anon-key';
      const mockClient = { from: vi.fn() } as unknown as SupabaseClient<unknown>;

      process.env.SUPABASE_URL = mockUrl;
      process.env.SUPABASE_ANON_KEY = mockKey;
      mockCreateClient.mockReturnValue(mockClient);

      // Act
      const supabaseModule = await import('../SupabaseClient');

      // Assert
      expect(supabaseModule.default).toBe(supabaseModule.supabase);
    });

    it('should create client only once (singleton pattern)', async () => {
      // Arrange
      const mockUrl = 'https://test.supabase.co';
      const mockKey = 'test-anon-key';
      const mockClient = { from: vi.fn(), auth: { signIn: vi.fn() } } as unknown as SupabaseClient<unknown>;

      process.env.SUPABASE_URL = mockUrl;
      process.env.SUPABASE_ANON_KEY = mockKey;
      mockCreateClient.mockReturnValue(mockClient);

      // Act
      const { supabase } = await import('../SupabaseClient');

      // Access multiple properties to trigger creation multiple times
      const fromMethod1 = supabase.from;
      const authMethod = supabase.auth;
      const fromMethod2 = supabase.from;

      // Assert
      expect(mockCreateClient).toHaveBeenCalledTimes(1);
      expect(fromMethod1).toBeDefined();
      expect(authMethod).toBeDefined();
      expect(fromMethod2).toBeDefined();
    });
  });
});