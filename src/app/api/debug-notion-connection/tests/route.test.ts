import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GET } from '../route';

const mockGetUserUseCase = {
  execute: vi.fn()
};

const mockQueryDatabaseUseCase = {
  execute: vi.fn()
};

const mockGetDatabaseUseCase = {
  execute: vi.fn()
};

vi.mock('@/infrastructure/di/container', () => ({
  container: {
    getUserUseCase: mockGetUserUseCase,
    queryDatabaseUseCase: mockQueryDatabaseUseCase,
    getDatabaseUseCase: mockGetDatabaseUseCase
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

describe('/api/debug-notion-connection', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    process.env.NOTION_API_KEY = 'secret_test123456789';
    process.env.NOTION_DATABASE_ID = 'db1234567890abcdef,db2345678901bcdefg';

    mockGetUserUseCase.execute.mockResolvedValue({
      id: 'user-123',
      name: 'Test User',
      avatarUrl: 'test@example.com'
    });

    mockGetDatabaseUseCase.execute.mockResolvedValue({
      title: 'Test Database',
      createdTime: '2024-01-01T00:00:00Z',
      lastEditedTime: '2024-01-02T00:00:00Z'
    });

    mockQueryDatabaseUseCase.execute.mockResolvedValue([
      {
        id: 'page-1',
        properties: { title: 'Test Page 1' }
      },
      {
        id: 'page-2',
        properties: { Name: 'Test Page 2' }
      }
    ]);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Happy path', () => {
    it('should successfully diagnose connection with valid configuration', async () => {
      const response = await GET();

      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('text/plain; charset=utf-8');
      expect(response.headers.get('Cache-Control')).toBe('no-cache');

      const streamOutput = await readStreamToString(response.body!);

      expect(streamOutput).toContain('DIAGNÓSTICO DE CONEXIÓN CON NOTION API');
      expect(streamOutput).toContain('✅ Configurada (secret_tes...)');
      expect(streamOutput).toContain('✅ Usuario conectado: Test User');
      expect(streamOutput).toContain('✅ Database encontrada: "Test Database"');
      expect(streamOutput).toContain('✅ Consulta exitosa: 2 páginas encontradas');
    });

    it('should handle database with no pages', async () => {
      mockQueryDatabaseUseCase.execute.mockResolvedValue([]);

      const response = await GET();
      const streamOutput = await readStreamToString(response.body!);

      expect(streamOutput).toContain('✅ Consulta exitosa: 0 páginas encontradas');
      expect(streamOutput).toContain('⚠️ Database vacía o sin páginas accesibles');
    });

    it('should handle multiple databases', async () => {
      const response = await GET();
      const streamOutput = await readStreamToString(response.body!);

      expect(streamOutput).toContain('Total databases configuradas: 2');
      expect(streamOutput).toContain('Database 1/2:');
      expect(streamOutput).toContain('Database 2/2:');
    });
  });

  describe('Variables de entorno faltantes', () => {
    it('should handle missing NOTION_API_KEY', async () => {
      delete process.env.NOTION_API_KEY;

      const response = await GET();
      const streamOutput = await readStreamToString(response.body!);

      expect(streamOutput).toContain('❌ No encontrada');
      expect(streamOutput).toContain('❌ ERROR CRÍTICO: NOTION_API_KEY no está configurada');
    });

    it('should handle missing NOTION_DATABASE_ID', async () => {
      delete process.env.NOTION_DATABASE_ID;

      const response = await GET();
      const streamOutput = await readStreamToString(response.body!);

      expect(streamOutput).toContain('❌ ERROR CRÍTICO: NOTION_DATABASE_ID no está configurada');
    });
  });

  describe('Errores de conexión', () => {
    it('should handle user fetch error', async () => {
      mockGetUserUseCase.execute.mockRejectedValue(new Error('Unauthorized'));

      const response = await GET();
      const streamOutput = await readStreamToString(response.body!);

      expect(streamOutput).toContain('❌ Error al conectar con Notion API: Unauthorized');
    });

    it('should handle database access error with 400 status', async () => {
      const error = new Error('Bad Request');
      Object.assign(error, {
        response: {
          status: 400,
          data: { message: 'Invalid database ID' }
        }
      });

      mockGetDatabaseUseCase.execute.mockRejectedValue(error);

      const response = await GET();
      const streamOutput = await readStreamToString(response.body!);

      expect(streamOutput).toContain('❌ Error al acceder a la database: Bad Request');
      expect(streamOutput).toContain('• Status HTTP: 400');
      expect(streamOutput).toContain('🔍 ANÁLISIS ERROR 400 (Bad Request)');
    });

    it('should handle database ID format errors', async () => {
      process.env.NOTION_DATABASE_ID = 'db12-34-56,invalid-id';

      const response = await GET();
      const streamOutput = await readStreamToString(response.body!);

      expect(streamOutput).toContain('🔧 4. CORRECCIÓN AUTOMÁTICA DE DATABASE IDs');
      expect(streamOutput).toContain('• Original: db12-34-56');
      expect(streamOutput).toContain('• Corregido: db123456');
    });

    it('should handle 401 error', async () => {
      const error = new Error('Unauthorized');
      Object.assign(error, {
        response: { status: 401 }
      });

      mockGetDatabaseUseCase.execute.mockRejectedValue(error);

      const response = await GET();
      const streamOutput = await readStreamToString(response.body!);

      expect(streamOutput).toContain('🔍 ANÁLISIS ERROR 401: API Key inválida');
    });

    it('should handle 403 error', async () => {
      const error = new Error('Forbidden');
      Object.assign(error, {
        response: { status: 403 }
      });

      mockGetDatabaseUseCase.execute.mockRejectedValue(error);

      const response = await GET();
      const streamOutput = await readStreamToString(response.body!);

      expect(streamOutput).toContain('🔍 ANÁLISIS ERROR 403: Sin permisos');
    });

    it('should handle 404 error', async () => {
      const error = new Error('Not Found');
      Object.assign(error, {
        response: { status: 404 }
      });

      mockGetDatabaseUseCase.execute.mockRejectedValue(error);

      const response = await GET();
      const streamOutput = await readStreamToString(response.body!);

      expect(streamOutput).toContain('🔍 ANÁLISIS ERROR 404: Database no encontrada');
    });
  });

  describe('Casos edge', () => {
    it('should handle complex page properties', async () => {
      mockQueryDatabaseUseCase.execute.mockResolvedValue([
        {
          id: 'page-complex',
          properties: {
            title: { rich_text: [{ plain_text: 'Complex Title' }] }
          }
        }
      ]);

      const response = await GET();
      const streamOutput = await readStreamToString(response.body!);

      expect(streamOutput).toContain('✅ Consulta exitosa: 1 páginas encontradas');
    });

    it('should handle query database errors', async () => {
      mockQueryDatabaseUseCase.execute.mockRejectedValue(new Error('Query failed'));

      const response = await GET();
      const streamOutput = await readStreamToString(response.body!);

      expect(streamOutput).toContain('❌ Error al acceder a la database: Query failed');
    });

    it('should include summary and recommendations', async () => {
      const response = await GET();
      const streamOutput = await readStreamToString(response.body!);

      expect(streamOutput).toContain('📋 5. RESUMEN Y RECOMENDACIONES');
      expect(streamOutput).toContain('✅ Diagnóstico completado');
      expect(streamOutput).toContain('🔧 SOLUCIONES COMUNES PARA ERROR 400');
    });
  });
});
