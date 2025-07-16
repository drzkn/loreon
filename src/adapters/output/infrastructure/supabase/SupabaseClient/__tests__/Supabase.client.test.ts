import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Mock de las dependencias
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn()
}));

vi.mock('@/utils/getEnvVar', () => ({
  getEnvVar: vi.fn()
}));

describe('Supabase client', () => {
  const mockCreateClient = vi.mocked(createClient);
  let mockGetEnvVar: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    vi.clearAllMocks();
    // Reset modules to allow re-importing
    vi.resetModules();

    // Import the mock function properly
    const getEnvVarModule = await import('@/utils/getEnvVar');
    mockGetEnvVar = vi.mocked(getEnvVarModule.getEnvVar);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Client creation', () => {
    it('should create Supabase client successfully with valid environment variables', async () => {
      // Arrange
      const mockUrl = 'https://test.supabase.co';
      const mockKey = 'test-anon-key';
      const mockClient = { from: vi.fn() } as unknown as SupabaseClient<unknown>;

      mockGetEnvVar.mockImplementation((key: string) => {
        if (key === 'SUPABASE_URL') return mockUrl;
        if (key === 'SUPABASE_ANON_KEY') return mockKey;
        return undefined;
      });
      mockCreateClient.mockReturnValue(mockClient);

      // Act
      const { supabase } = await import('../SupabaseClient');

      // Assert
      expect(mockGetEnvVar).toHaveBeenCalledWith('SUPABASE_URL');
      expect(mockGetEnvVar).toHaveBeenCalledWith('SUPABASE_ANON_KEY');
      expect(mockCreateClient).toHaveBeenCalledWith(mockUrl, mockKey);
      expect(supabase).toBe(mockClient);
    });

    it('should throw error when SUPABASE_URL is missing', async () => {
      // Arrange
      mockGetEnvVar.mockImplementation((key: string) => {
        if (key === 'SUPABASE_URL') return undefined;
        if (key === 'SUPABASE_ANON_KEY') return 'test-anon-key';
        return undefined;
      });

      // Act & Assert
      await expect(async () => {
        await import('../SupabaseClient');
      }).rejects.toThrow('❌Las variables de entorno SUPABASE_URL son requeridas');

      expect(mockGetEnvVar).toHaveBeenCalledWith('SUPABASE_URL');
      expect(mockCreateClient).not.toHaveBeenCalled();
    });

    it('should throw error when SUPABASE_ANON_KEY is missing', async () => {
      // Arrange
      mockGetEnvVar.mockImplementation((key: string) => {
        if (key === 'SUPABASE_URL') return 'https://test.supabase.co';
        if (key === 'SUPABASE_ANON_KEY') return undefined;
        return undefined;
      });

      // Act & Assert
      await expect(async () => {
        await import('../SupabaseClient');
      }).rejects.toThrow('❌Las variables de entorno SUPABASE_ANON_KEY son requeridas');

      expect(mockGetEnvVar).toHaveBeenCalledWith('SUPABASE_URL');
      expect(mockGetEnvVar).toHaveBeenCalledWith('SUPABASE_ANON_KEY');
      expect(mockCreateClient).not.toHaveBeenCalled();
    });

    it('should throw error when both environment variables are missing', async () => {
      // Arrange
      mockGetEnvVar.mockReturnValue(undefined);

      // Act & Assert
      await expect(async () => {
        await import('../SupabaseClient');
      }).rejects.toThrow('❌Las variables de entorno SUPABASE_URL son requeridas');

      expect(mockGetEnvVar).toHaveBeenCalledWith('SUPABASE_URL');
      expect(mockCreateClient).not.toHaveBeenCalled();
    });

    it('should throw error when SUPABASE_URL is empty string', async () => {
      // Arrange
      mockGetEnvVar.mockImplementation((key: string) => {
        if (key === 'SUPABASE_URL') return '';
        if (key === 'SUPABASE_ANON_KEY') return 'test-anon-key';
        return undefined;
      });

      // Act & Assert
      await expect(async () => {
        await import('../SupabaseClient');
      }).rejects.toThrow('❌Las variables de entorno SUPABASE_URL son requeridas');

      expect(mockGetEnvVar).toHaveBeenCalledWith('SUPABASE_URL');
      expect(mockCreateClient).not.toHaveBeenCalled();
    });

    it('should throw error when SUPABASE_ANON_KEY is empty string', async () => {
      // Arrange
      mockGetEnvVar.mockImplementation((key: string) => {
        if (key === 'SUPABASE_URL') return 'https://test.supabase.co';
        if (key === 'SUPABASE_ANON_KEY') return '';
        return undefined;
      });

      // Act & Assert
      await expect(async () => {
        await import('../SupabaseClient');
      }).rejects.toThrow('❌Las variables de entorno SUPABASE_ANON_KEY son requeridas');

      expect(mockGetEnvVar).toHaveBeenCalledWith('SUPABASE_URL');
      expect(mockGetEnvVar).toHaveBeenCalledWith('SUPABASE_ANON_KEY');
      expect(mockCreateClient).not.toHaveBeenCalled();
    });
  });

  describe('Client exports', () => {
    it('should export supabase client as default export', async () => {
      // Arrange
      const mockUrl = 'https://test.supabase.co';
      const mockKey = 'test-anon-key';
      const mockClient = { from: vi.fn() } as unknown as SupabaseClient<unknown>;

      mockGetEnvVar.mockImplementation((key: string) => {
        if (key === 'SUPABASE_URL') return mockUrl;
        if (key === 'SUPABASE_ANON_KEY') return mockKey;
        return undefined;
      });
      mockCreateClient.mockReturnValue(mockClient);

      // Act
      const supabaseModule = await import('../SupabaseClient');

      // Assert
      expect(supabaseModule.default).toBe(mockClient);
      expect(supabaseModule.supabase).toBe(mockClient);
    });

    it('should create client with correct TypeScript types', async () => {
      // Arrange
      const mockUrl = 'https://test.supabase.co';
      const mockKey = 'test-anon-key';
      const mockClient = { from: vi.fn() } as unknown as SupabaseClient<unknown>;

      mockGetEnvVar.mockImplementation((key: string) => {
        if (key === 'SUPABASE_URL') return mockUrl;
        if (key === 'SUPABASE_ANON_KEY') return mockKey;
        return undefined;
      });
      mockCreateClient.mockReturnValue(mockClient);

      // Act
      await import('../SupabaseClient');

      // Assert
      expect(mockCreateClient).toHaveBeenCalledWith(mockUrl, mockKey);
      expect(mockCreateClient).toHaveBeenCalledTimes(1);
    });
  });
});