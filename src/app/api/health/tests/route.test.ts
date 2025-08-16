/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GET } from '../route';

// Usar el sistema centralizado de mocks
import {
  createTestSetup
} from '@/mocks';

// Mocks inline para evitar problemas de hoisting
vi.mock('@ai-sdk/google', () => ({
  google: vi.fn()
}));

vi.mock('@/adapters/output/infrastructure/supabase', () => ({
  SupabaseMarkdownRepository: vi.fn()
}));

vi.mock('@/services/embeddings/EmbeddingsService', () => ({
  EmbeddingsService: vi.fn()
}));

describe('Health Check API Route', () => {
  const originalEnv = process.env;
  const mockDate = '2024-01-01T00:00:00.000Z';
  const { teardown } = createTestSetup(); // ✅ Console mocks centralizados

  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();

    // Mock Date para resultados consistentes
    vi.useFakeTimers();
    vi.setSystemTime(new Date(mockDate));

    // Reset environment
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    vi.useRealTimers();
    process.env = originalEnv;
    teardown(); // ✅ Limpieza automática
  });

  describe('Environment Variables Check', () => {
    it('should return ok status when all environment variables are present', async () => {
      // Arrange
      process.env.SUPABASE_URL = 'https://test.supabase.co';
      process.env.SUPABASE_ANON_KEY = 'test-anon-key';
      process.env.GOOGLE_GENERATIVE_AI_API_KEY = 'test-google-key';

      // Mock successful imports
      const { google } = await import('@ai-sdk/google');
      const { SupabaseMarkdownRepository } = await import('@/adapters/output/infrastructure/supabase');
      const { EmbeddingsService } = await import('@/services/embeddings/EmbeddingsService');

      vi.mocked(google).mockReturnValue({} as any);
      vi.mocked(SupabaseMarkdownRepository).mockImplementation(() => ({}) as any);
      vi.mocked(EmbeddingsService).mockImplementation(() => ({}) as any);

      // Act
      const response = await GET();
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.status).toBe('ok');
      expect(data.timestamp).toBe(mockDate);
      expect(data.environment).toBe('vercel');

      expect(data.checks.env_SUPABASE_URL).toEqual({
        status: 'ok',
        message: 'Configurada'
      });
      expect(data.checks.env_SUPABASE_ANON_KEY).toEqual({
        status: 'ok',
        message: 'Configurada'
      });
      expect(data.checks.env_GOOGLE_GENERATIVE_AI_API_KEY).toEqual({
        status: 'ok',
        message: 'Configurada'
      });
    });

    it('should return error status when environment variables are missing', async () => {
      // Arrange
      delete process.env.SUPABASE_URL;
      delete process.env.SUPABASE_ANON_KEY;
      delete process.env.GOOGLE_GENERATIVE_AI_API_KEY;

      // Act
      const response = await GET();
      const data = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(data.status).toBe('error');

      expect(data.checks.env_SUPABASE_URL).toEqual({
        status: 'error',
        message: 'No configurada'
      });
      expect(data.checks.env_SUPABASE_ANON_KEY).toEqual({
        status: 'error',
        message: 'No configurada'
      });
      expect(data.checks.env_GOOGLE_GENERATIVE_AI_API_KEY).toEqual({
        status: 'error',
        message: 'No configurada'
      });
    });

    it('should handle mixed environment variable states', async () => {
      // Arrange
      process.env.SUPABASE_URL = 'https://test.supabase.co';
      delete process.env.SUPABASE_ANON_KEY;
      process.env.GOOGLE_GENERATIVE_AI_API_KEY = 'test-google-key';

      // Act
      const response = await GET();
      const data = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(data.status).toBe('error');

      expect(data.checks.env_SUPABASE_URL.status).toBe('ok');
      expect(data.checks.env_SUPABASE_ANON_KEY.status).toBe('error');
      expect(data.checks.env_GOOGLE_GENERATIVE_AI_API_KEY.status).toBe('ok');
    });
  });

  describe('Google AI SDK Check', () => {
    beforeEach(() => {
      // Set required env vars for other checks
      process.env.SUPABASE_URL = 'https://test.supabase.co';
      process.env.SUPABASE_ANON_KEY = 'test-anon-key';
      process.env.GOOGLE_GENERATIVE_AI_API_KEY = 'test-google-key';
    });

    it('should return ok status when Google AI SDK imports successfully', async () => {
      // Arrange
      const { google } = await import('@ai-sdk/google');
      const { SupabaseMarkdownRepository } = await import('@/adapters/output/infrastructure/supabase');
      const { EmbeddingsService } = await import('@/services/embeddings/EmbeddingsService');

      vi.mocked(google).mockReturnValue({} as unknown);
      vi.mocked(SupabaseMarkdownRepository).mockImplementation(() => ({}) as unknown);
      vi.mocked(EmbeddingsService).mockImplementation(() => ({}) as unknown);

      // Act
      const response = await GET();
      const data = await response.json();

      // Assert
      expect(data.checks.google_ai_import).toEqual({
        status: 'ok',
        message: 'Google AI SDK importado correctamente'
      });
      expect(google).toHaveBeenCalledWith('gemini-1.5-flash');
    });

    it('should return error status when Google AI SDK import fails', async () => {
      // Arrange
      const { google } = await import('@ai-sdk/google');
      const { SupabaseMarkdownRepository } = await import('@/adapters/output/infrastructure/supabase');
      const { EmbeddingsService } = await import('@/services/embeddings/EmbeddingsService');

      vi.mocked(google).mockImplementation(() => {
        throw new Error('Google AI import failed');
      });
      vi.mocked(SupabaseMarkdownRepository).mockImplementation(() => ({}) as unknown);
      vi.mocked(EmbeddingsService).mockImplementation(() => ({}) as unknown);

      // Act
      const response = await GET();
      const data = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(data.checks.google_ai_import).toEqual({
        status: 'error',
        message: 'Error importando Google AI: Google AI import failed'
      });
    });
  });

  describe('Supabase Connection Check', () => {
    beforeEach(() => {
      // Set required env vars
      process.env.SUPABASE_URL = 'https://test.supabase.co';
      process.env.SUPABASE_ANON_KEY = 'test-anon-key';
      process.env.GOOGLE_GENERATIVE_AI_API_KEY = 'test-google-key';
    });

    it('should return ok status when Supabase repository initializes successfully', async () => {
      // Arrange
      const { google } = await import('@ai-sdk/google');
      const { SupabaseMarkdownRepository } = await import('@/adapters/output/infrastructure/supabase');
      const { EmbeddingsService } = await import('@/services/embeddings/EmbeddingsService');

      vi.mocked(google).mockReturnValue({} as unknown);
      vi.mocked(SupabaseMarkdownRepository).mockImplementation(() => ({}) as unknown);
      vi.mocked(EmbeddingsService).mockImplementation(() => ({}) as unknown);

      // Act
      const response = await GET();
      const data = await response.json();

      // Assert
      expect(data.checks.supabase_connection).toEqual({
        status: 'ok',
        message: 'Supabase repository inicializado'
      });
      expect(SupabaseMarkdownRepository).toHaveBeenCalled();
    });

    it('should return error status when Supabase repository initialization fails', async () => {
      // Arrange
      const { google } = await import('@ai-sdk/google');
      const { SupabaseMarkdownRepository } = await import('@/adapters/output/infrastructure/supabase');
      const { EmbeddingsService } = await import('@/services/embeddings/EmbeddingsService');

      vi.mocked(google).mockReturnValue({} as unknown);
      vi.mocked(SupabaseMarkdownRepository).mockImplementation(() => {
        throw new Error('Supabase connection failed');
      });
      vi.mocked(EmbeddingsService).mockImplementation(() => ({}) as unknown);

      // Act
      const response = await GET();
      const data = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(data.checks.supabase_connection).toEqual({
        status: 'error',
        message: 'Error conectando a Supabase: Supabase connection failed'
      });
    });
  });

  describe('EmbeddingsService Check', () => {
    beforeEach(() => {
      // Set required env vars
      process.env.SUPABASE_URL = 'https://test.supabase.co';
      process.env.SUPABASE_ANON_KEY = 'test-anon-key';
      process.env.GOOGLE_GENERATIVE_AI_API_KEY = 'test-google-key';
    });

    it('should return ok status when EmbeddingsService initializes successfully', async () => {
      // Arrange
      const { google } = await import('@ai-sdk/google');
      const { SupabaseMarkdownRepository } = await import('@/adapters/output/infrastructure/supabase');
      const { EmbeddingsService } = await import('@/services/embeddings/EmbeddingsService');

      vi.mocked(google).mockReturnValue({} as unknown);
      vi.mocked(SupabaseMarkdownRepository).mockImplementation(() => ({}) as unknown);
      vi.mocked(EmbeddingsService).mockImplementation(() => ({}) as unknown);

      // Act
      const response = await GET();
      const data = await response.json();

      // Assert
      expect(data.checks.embeddings_service).toEqual({
        status: 'ok',
        message: 'EmbeddingsService inicializado'
      });
      expect(EmbeddingsService).toHaveBeenCalled();
    });

    it('should return error status when EmbeddingsService initialization fails', async () => {
      // Arrange
      const { google } = await import('@ai-sdk/google');
      const { SupabaseMarkdownRepository } = await import('@/adapters/output/infrastructure/supabase');
      const { EmbeddingsService } = await import('@/services/embeddings/EmbeddingsService');

      vi.mocked(google).mockReturnValue({} as unknown);
      vi.mocked(SupabaseMarkdownRepository).mockImplementation(() => ({}) as unknown);
      vi.mocked(EmbeddingsService).mockImplementation(() => {
        throw new Error('EmbeddingsService initialization failed');
      });

      // Act
      const response = await GET();
      const data = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(data.checks.embeddings_service).toEqual({
        status: 'error',
        message: 'Error inicializando EmbeddingsService: EmbeddingsService initialization failed'
      });
    });
  });

  describe('Google AI Test Check', () => {
    beforeEach(() => {
      // Set required env vars for other checks
      process.env.SUPABASE_URL = 'https://test.supabase.co';
      process.env.SUPABASE_ANON_KEY = 'test-anon-key';
    });

    it('should return ok status when Google AI API key is present', async () => {
      // Arrange
      process.env.GOOGLE_GENERATIVE_AI_API_KEY = 'test-google-key';

      const { google } = await import('@ai-sdk/google');
      const { SupabaseMarkdownRepository } = await import('@/adapters/output/infrastructure/supabase');
      const { EmbeddingsService } = await import('@/services/embeddings/EmbeddingsService');

      vi.mocked(google).mockReturnValue({} as unknown);
      vi.mocked(SupabaseMarkdownRepository).mockImplementation(() => ({}) as unknown);
      vi.mocked(EmbeddingsService).mockImplementation(() => ({}) as unknown);

      // Act
      const response = await GET();
      const data = await response.json();

      // Assert
      expect(data.checks.google_ai_test).toEqual({
        status: 'ok',
        message: 'API Key presente (test completo requiere llamada real)'
      });
    });

    it('should return error status when Google AI API key is missing', async () => {
      // Arrange
      delete process.env.GOOGLE_GENERATIVE_AI_API_KEY;

      const { google } = await import('@ai-sdk/google');
      const { SupabaseMarkdownRepository } = await import('@/adapters/output/infrastructure/supabase');
      const { EmbeddingsService } = await import('@/services/embeddings/EmbeddingsService');

      vi.mocked(google).mockReturnValue({} as unknown);
      vi.mocked(SupabaseMarkdownRepository).mockImplementation(() => ({}) as unknown);
      vi.mocked(EmbeddingsService).mockImplementation(() => ({}) as unknown);

      // Act
      const response = await GET();
      const data = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(data.checks.google_ai_test).toEqual({
        status: 'error',
        message: 'GOOGLE_GENERATIVE_AI_API_KEY no configurada'
      });
    });
  });

  describe('Response Format', () => {
    it('should return correct response headers', async () => {
      // Arrange
      process.env.SUPABASE_URL = 'https://test.supabase.co';
      process.env.SUPABASE_ANON_KEY = 'test-anon-key';
      process.env.GOOGLE_GENERATIVE_AI_API_KEY = 'test-google-key';

      const { google } = await import('@ai-sdk/google');
      const { SupabaseMarkdownRepository } = await import('@/adapters/output/infrastructure/supabase');
      const { EmbeddingsService } = await import('@/services/embeddings/EmbeddingsService');

      vi.mocked(google).mockReturnValue({} as unknown);
      vi.mocked(SupabaseMarkdownRepository).mockImplementation(() => ({}) as unknown);
      vi.mocked(EmbeddingsService).mockImplementation(() => ({}) as unknown);

      // Act
      const response = await GET();

      // Assert
      expect(response.headers.get('Content-Type')).toBe('application/json');
      expect(response.headers.get('Cache-Control')).toBe('no-cache');
    });

    it('should return 200 status when all checks pass', async () => {
      // Arrange
      process.env.SUPABASE_URL = 'https://test.supabase.co';
      process.env.SUPABASE_ANON_KEY = 'test-anon-key';
      process.env.GOOGLE_GENERATIVE_AI_API_KEY = 'test-google-key';

      const { google } = await import('@ai-sdk/google');
      const { SupabaseMarkdownRepository } = await import('@/adapters/output/infrastructure/supabase');
      const { EmbeddingsService } = await import('@/services/embeddings/EmbeddingsService');

      vi.mocked(google).mockReturnValue({} as unknown);
      vi.mocked(SupabaseMarkdownRepository).mockImplementation(() => ({}) as unknown);
      vi.mocked(EmbeddingsService).mockImplementation(() => ({}) as unknown);

      // Act
      const response = await GET();

      // Assert
      expect(response.status).toBe(200);
    });

    it('should return 500 status when any check fails', async () => {
      // Arrange - missing one env var will cause failure
      delete process.env.SUPABASE_URL;
      process.env.SUPABASE_ANON_KEY = 'test-anon-key';
      process.env.GOOGLE_GENERATIVE_AI_API_KEY = 'test-google-key';

      // Act
      const response = await GET();

      // Assert
      expect(response.status).toBe(500);
    });

    it('should have correct response structure', async () => {
      // Arrange
      process.env.SUPABASE_URL = 'https://test.supabase.co';
      process.env.SUPABASE_ANON_KEY = 'test-anon-key';
      process.env.GOOGLE_GENERATIVE_AI_API_KEY = 'test-google-key';

      const { google } = await import('@ai-sdk/google');
      const { SupabaseMarkdownRepository } = await import('@/adapters/output/infrastructure/supabase');
      const { EmbeddingsService } = await import('@/services/embeddings/EmbeddingsService');

      vi.mocked(google).mockReturnValue({} as unknown);
      vi.mocked(SupabaseMarkdownRepository).mockImplementation(() => ({}) as unknown);
      vi.mocked(EmbeddingsService).mockImplementation(() => ({}) as unknown);

      // Act
      const response = await GET();
      const data = await response.json();

      // Assert
      expect(data).toHaveProperty('status');
      expect(data).toHaveProperty('timestamp');
      expect(data).toHaveProperty('environment');
      expect(data).toHaveProperty('checks');

      expect(typeof data.status).toBe('string');
      expect(typeof data.timestamp).toBe('string');
      expect(typeof data.environment).toBe('string');
      expect(typeof data.checks).toBe('object');

      // Verify all expected checks are present
      const expectedChecks = [
        'env_SUPABASE_URL',
        'env_SUPABASE_ANON_KEY',
        'env_GOOGLE_GENERATIVE_AI_API_KEY',
        'google_ai_import',
        'supabase_connection',
        'embeddings_service',
        'google_ai_test'
      ];

      expectedChecks.forEach(checkName => {
        expect(data.checks).toHaveProperty(checkName);
        expect(data.checks[checkName]).toHaveProperty('status');
        expect(data.checks[checkName]).toHaveProperty('message');
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle unknown errors gracefully', async () => {
      // Arrange
      process.env.SUPABASE_URL = 'https://test.supabase.co';
      process.env.SUPABASE_ANON_KEY = 'test-anon-key';
      process.env.GOOGLE_GENERATIVE_AI_API_KEY = 'test-google-key';

      const { google } = await import('@ai-sdk/google');
      const { SupabaseMarkdownRepository } = await import('@/adapters/output/infrastructure/supabase');
      const { EmbeddingsService } = await import('@/services/embeddings/EmbeddingsService');

      // Mock an unknown error (not an Error instance)
      vi.mocked(google).mockImplementation(() => {
        throw 'Unknown error type';
      });
      vi.mocked(SupabaseMarkdownRepository).mockImplementation(() => ({}) as unknown);
      vi.mocked(EmbeddingsService).mockImplementation(() => ({}) as unknown);

      // Act
      const response = await GET();
      const data = await response.json();

      // Assert
      expect(data.checks.google_ai_import.message).toBe('Error importando Google AI: Error desconocido');
    });
  });
});
