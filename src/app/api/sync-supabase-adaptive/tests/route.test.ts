import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { POST } from '../route';

const mockQueryDatabaseUseCase = {
  execute: vi.fn()
};

const mockNotionMigrationService = {
  migratePage: vi.fn()
};

vi.mock('@/infrastructure/di/container', () => ({
  container: {
    queryDatabaseUseCase: mockQueryDatabaseUseCase,
    notionMigrationService: mockNotionMigrationService
  }
}));

const readStreamToString = async (stream: ReadableStream): Promise<string> => {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let result = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    result += decoder.decode(value, { stream: true });
  }

  return result;
};

describe('/api/sync-supabase-adaptive', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    process.env.NOTION_API_KEY = 'secret_test123456789';
    process.env.NOTION_DATABASE_ID = 'db1234567890abcdef';
  });

  afterEach(() => {
    vi.clearAllMocks();
    delete process.env.NOTION_API_KEY;
    delete process.env.NOTION_DATABASE_ID;
  });

  describe('Happy path', () => {
    it('should use FULL_PARALLEL strategy for small databases (≤10 pages)', async () => {
      const mockPages = Array.from({ length: 5 }, (_, i) => ({
        id: `page-${i + 1}`,
        properties: { title: `Test Page ${i + 1}` }
      }));

      mockQueryDatabaseUseCase.execute.mockResolvedValue(mockPages);
      mockNotionMigrationService.migratePage.mockResolvedValue({
        success: true,
        blocksProcessed: 10,
        embeddingsGenerated: 5
      });

      const response = await POST();
      const output = await readStreamToString(response.body!);

      expect(response.status).toBe(200);
      expect(output).toContain('🧠 [DB 1/1] Estrategia IA: FULL_PARALLEL');
      expect(output).toContain('MODO TURBO: Procesando 5 páginas TODAS EN PARALELO');
      expect(output).toContain('📄 Páginas procesadas:');
      expect(mockNotionMigrationService.migratePage).toHaveBeenCalledTimes(5);
    });

    it('should use LARGE_BATCHES strategy for medium databases (11-30 pages)', async () => {
      const mockPages = Array.from({ length: 25 }, (_, i) => ({
        id: `page-${i + 1}`,
        properties: { title: `Test Page ${i + 1}` }
      }));

      mockQueryDatabaseUseCase.execute.mockResolvedValue(mockPages);
      mockNotionMigrationService.migratePage.mockResolvedValue({
        success: true,
        blocksProcessed: 10,
        embeddingsGenerated: 5
      });

      const response = await POST();
      const output = await readStreamToString(response.body!);

      expect(output).toContain('🧠 [DB 1/1] Estrategia IA: LARGE_BATCHES');
      expect(output).toContain('MODO LOTES: 15 páginas por lote');
      expect(output).toContain('📄 Páginas procesadas: 25');
    });

    it('should use MEDIUM_BATCHES strategy for larger databases (31-100 pages)', async () => {
      const mockPages = Array.from({ length: 50 }, (_, i) => ({
        id: `page-${i + 1}`,
        properties: { title: `Test Page ${i + 1}` }
      }));

      mockQueryDatabaseUseCase.execute.mockResolvedValue(mockPages);
      mockNotionMigrationService.migratePage.mockResolvedValue({
        success: true,
        blocksProcessed: 10,
        embeddingsGenerated: 5
      });

      const response = await POST();
      const output = await readStreamToString(response.body!);

      expect(output).toContain('🧠 [DB 1/1] Estrategia IA: MEDIUM_BATCHES');
      expect(output).toContain('MODO LOTES: 10 páginas por lote');
      expect(output).toContain('📄 Páginas procesadas: 50');
    });

    it('should use SAFE_BATCHES strategy for very large databases (>100 pages)', async () => {
      const mockPages = Array.from({ length: 120 }, (_, i) => ({
        id: `page-${i + 1}`,
        properties: { title: `Test Page ${i + 1}` }
      }));

      mockQueryDatabaseUseCase.execute.mockResolvedValue(mockPages);
      mockNotionMigrationService.migratePage.mockResolvedValue({
        success: true,
        blocksProcessed: 10,
        embeddingsGenerated: 5
      });

      const response = await POST();
      const output = await readStreamToString(response.body!);

      expect(output).toContain('🧠 [DB 1/1] Estrategia IA: SAFE_BATCHES');
      expect(output).toContain('MODO LOTES: 5 páginas por lote');
      expect(output).toContain('📄 Páginas procesadas: 120');
    }, 10000);

    it('should handle multiple databases successfully', async () => {
      process.env.NOTION_DATABASE_ID = 'db1,db2';

      const mockPages = [
        { id: 'page-1', properties: { title: 'Page 1' } },
        { id: 'page-2', properties: { title: 'Page 2' } }
      ];

      mockQueryDatabaseUseCase.execute.mockResolvedValue(mockPages);
      mockNotionMigrationService.migratePage.mockResolvedValue({
        success: true,
        blocksProcessed: 10,
        embeddingsGenerated: 5
      });

      const response = await POST();
      const output = await readStreamToString(response.body!);

      expect(output).toContain('📊 2 database(s) configuradas');
      expect(output).toContain('[DB 1/2]');
      expect(output).toContain('[DB 2/2]');
      expect(mockQueryDatabaseUseCase.execute).toHaveBeenCalledTimes(2);
    });

    it('should handle empty databases', async () => {
      mockQueryDatabaseUseCase.execute.mockResolvedValue([]);

      const response = await POST();
      const output = await readStreamToString(response.body!);

      expect(output).toContain('⚠️ [DB 1/1] Database vacía');
      expect(output).toContain('📄 Páginas procesadas: 0');
    });
  });

  describe('Error handling', () => {
    it('should handle missing NOTION_API_KEY', async () => {
      delete process.env.NOTION_API_KEY;

      const response = await POST();
      const output = await readStreamToString(response.body!);

      expect(output).toContain('❌ Error: Variables de entorno faltantes');
    });

    it('should handle missing NOTION_DATABASE_ID', async () => {
      delete process.env.NOTION_DATABASE_ID;

      const response = await POST();
      const output = await readStreamToString(response.body!);

      expect(output).toContain('❌ Error: Variables de entorno faltantes');
    });

    it('should handle database query errors', async () => {
      mockQueryDatabaseUseCase.execute.mockRejectedValue(new Error('Database connection failed'));

      const response = await POST();
      const output = await readStreamToString(response.body!);

      expect(output).toContain('❌ [DB 1/1] Error crítico: Database connection failed');
    });

    it('should handle migration errors and continue processing', async () => {
      const mockPages = [
        { id: 'page-1', properties: { title: 'Page 1' } },
        { id: 'page-2', properties: { title: 'Page 2' } }
      ];

      mockQueryDatabaseUseCase.execute.mockResolvedValue(mockPages);
      mockNotionMigrationService.migratePage
        .mockResolvedValueOnce({ success: false })
        .mockResolvedValueOnce({ success: true, blocksProcessed: 5, embeddingsGenerated: 3 });

      const response = await POST();
      const output = await readStreamToString(response.body!);

      expect(output).toContain('❌ Errores:');
    });

    it('should handle migration service throwing errors', async () => {
      const mockPages = [
        { id: 'page-1', properties: { title: 'Page 1' } }
      ];

      mockQueryDatabaseUseCase.execute.mockResolvedValue(mockPages);
      mockNotionMigrationService.migratePage.mockRejectedValue(new Error('Migration failed'));

      const response = await POST();
      const output = await readStreamToString(response.body!);

      expect(output).toContain('📄 Páginas procesadas:');
      expect(output).toContain('❌ Errores:');
    });

    it('should handle critical errors gracefully', async () => {
      mockQueryDatabaseUseCase.execute.mockRejectedValue(new Error('Critical failure'));

      const response = await POST();
      const output = await readStreamToString(response.body!);

      expect(output).toContain('[DB 1/1] Error crítico: Critical failure');
    });
  });

  describe('Response format', () => {
    it('should return correct headers', async () => {
      mockQueryDatabaseUseCase.execute.mockResolvedValue([]);

      const response = await POST();

      expect(response.headers.get('Content-Type')).toBe('text/event-stream');
      expect(response.headers.get('Cache-Control')).toBe('no-cache');
      expect(response.headers.get('Connection')).toBe('keep-alive');
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
    });

    it('should provide comprehensive statistics', async () => {
      const mockPages = Array.from({ length: 3 }, (_, i) => ({
        id: `page-${i + 1}`,
        properties: { title: `Test Page ${i + 1}` }
      }));

      mockQueryDatabaseUseCase.execute.mockResolvedValue(mockPages);
      mockNotionMigrationService.migratePage.mockResolvedValue({
        success: true,
        blocksProcessed: 10,
        embeddingsGenerated: 5
      });

      const response = await POST();
      const output = await readStreamToString(response.body!);

      expect(output).toContain('📊 ESTADÍSTICAS FINALES:');
      expect(output).toContain('⏱️ Duración total:');
      expect(output).toContain('📄 Páginas procesadas:');
      expect(output).toContain('❌ Errores: 0');
      expect(output).toContain('🧠 ESTRATEGIAS UTILIZADAS:');
    });
  });
});
