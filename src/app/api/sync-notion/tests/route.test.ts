import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST, GET } from '../route';

// Usar el sistema centralizado de mocks
import {
  createTestSetup,
  createMockNextRequest
} from '@/mocks';

// Mock del controller y logger
const mockSyncController = {
  syncPages: vi.fn(),
  getSyncStatus: vi.fn(),
  getMigrationStats: vi.fn()
};

const mockLogger = {
  info: vi.fn(),
  error: vi.fn(),
  warn: vi.fn(),
  debug: vi.fn()
};

const mockContainer = {
  logger: mockLogger,
  syncController: mockSyncController
};

vi.mock('@/infrastructure/di/container', () => ({
  container: {
    logger: {
      info: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
      debug: vi.fn()
    },
    syncController: {
      syncPages: vi.fn(),
      getSyncStatus: vi.fn(),
      getMigrationStats: vi.fn()
    }
  }
}));

// Importar el container mockeado
import { container } from '@/infrastructure/di/container';

// Helper to create NextRequest
const createRequest = (body: Record<string, unknown> = {}, method = 'POST') => {
  if (method === 'POST') {
    return createMockNextRequest(body, method);
  }
  return new NextRequest('http://localhost/api/sync-notion', {
    method,
    headers: { 'Content-Type': 'application/json' }
  });
};

const createGetRequest = (params: Record<string, string> = {}) => {
  const url = new URL('http://localhost/api/sync-notion');
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });

  return new NextRequest(url.toString(), {
    method: 'GET'
  });
};

// Sample data para stats
const mockSystemStats = {
  storage: {
    totalPages: 100,
    totalBlocks: 500,
    totalEmbeddings: 300,
    lastSync: '2024-01-01T00:00:00Z'
  },
  content: {
    totalWords: 1000,
    averageWordsPerPage: 10,
    topContentTypes: [{ type: 'page', count: 100 }]
  }
};

describe('/api/sync-notion', () => {
  const { teardown } = createTestSetup();

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup default mock responses
    vi.mocked(container.syncController.syncPages).mockResolvedValue({
      success: true,
      syncId: 'sync-123',
      message: 'Sincronización completada exitosamente. 1 páginas procesadas.',
      stats: {
        pagesProcessed: 1,
        blocksProcessed: 5,
        embeddingsGenerated: 3,
        errors: 0
      }
    });

    vi.mocked(container.syncController.getSyncStatus).mockResolvedValue({
      success: true,
      syncId: 'sync-123',
      status: 'completed',
      message: 'Consulta de logs de sincronización no implementada aún'
    });

    vi.mocked(container.syncController.getMigrationStats).mockResolvedValue({
      success: true,
      stats: mockSystemStats
    });
  });

  afterEach(() => {
    teardown();
  });

  describe('POST - Sincronización de contenido', () => {
    describe('Validación de parámetros', () => {
      it('should return error when no databaseId or pageIds provided', async () => {
        vi.mocked(container.syncController.syncPages).mockResolvedValue({
          success: false,
          syncId: 'sync-123',
          message: 'Se requiere databaseId o pageIds para sincronizar',
          errors: ['Se requiere databaseId o pageIds para sincronizar']
        });

        const request = createRequest({});
        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.success).toBe(false);
        expect(data.message).toContain('Se requiere databaseId o pageIds');
        expect(data.syncId).toBe('sync-123');
      });

      it('should return error when pageIds is empty array', async () => {
        vi.mocked(container.syncController.syncPages).mockResolvedValue({
          success: false,
          syncId: 'sync-123',
          message: 'Se requiere databaseId o pageIds para sincronizar',
          errors: ['Se requiere databaseId o pageIds para sincronizar']
        });

        const request = createRequest({ pageIds: [] });
        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.success).toBe(false);
        expect(data.message).toContain('Se requiere databaseId o pageIds');
      });

      it('should accept valid pageIds without databaseId', async () => {
        const request = createRequest({ pageIds: ['page-1', 'page-2'] });
        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(vi.mocked(container.syncController.syncPages)).toHaveBeenCalledWith({
          pageIds: ['page-1', 'page-2']
        });
      });
    });

    describe('Sincronización de páginas específicas', () => {
      it('should successfully migrate single page', async () => {
        const request = createRequest({ pageIds: ['page-123'] });
        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.syncId).toBe('sync-123');
        expect(data.stats.pagesProcessed).toBe(1);
        expect(data.stats.blocksProcessed).toBe(5);
        expect(data.stats.embeddingsGenerated).toBe(3);
        expect(data.stats.errors).toBe(0);
      });

      it('should successfully migrate multiple pages', async () => {
        vi.mocked(container.syncController.syncPages).mockResolvedValue({
          success: true,
          syncId: 'sync-123',
          message: 'Sincronización completada exitosamente. 3 páginas procesadas.',
          stats: { pagesProcessed: 3, blocksProcessed: 15, embeddingsGenerated: 9, errors: 0 }
        });

        const request = createRequest({ pageIds: ['page-1', 'page-2', 'page-3'] });
        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.stats.pagesProcessed).toBe(3);
        expect(data.stats.blocksProcessed).toBe(15);
        expect(data.stats.embeddingsGenerated).toBe(9);
      });

      it('should handle migration failures from service', async () => {
        vi.mocked(container.syncController.syncPages).mockResolvedValue({
          success: false,
          syncId: 'sync-123',
          message: 'Sincronización completada con 1 errores de 1 páginas.',
          stats: { pagesProcessed: 0, blocksProcessed: 0, embeddingsGenerated: 0, errors: 1 },
          errors: ['Page not found', 'Access denied']
        });

        const request = createRequest({ pageIds: ['page-failed'] });
        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.success).toBe(false);
        expect(data.stats.errors).toBe(1);
        expect(data.errors).toEqual(['Page not found', 'Access denied']);
      });

      it('should handle migration exceptions', async () => {
        vi.mocked(container.syncController.syncPages).mockResolvedValue({
          success: false,
          syncId: 'sync-123',
          message: 'Sincronización completada con 1 errores de 1 páginas.',
          stats: { pagesProcessed: 0, blocksProcessed: 0, embeddingsGenerated: 0, errors: 1 },
          errors: ['Error en página page-error: Network error']
        });

        const request = createRequest({ pageIds: ['page-error'] });
        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.success).toBe(false);
        expect(data.stats.errors).toBe(1);
        expect(data.errors).toContain('Error en página page-error: Network error');
      });

      it('should handle unknown errors', async () => {
        vi.mocked(container.syncController.syncPages).mockResolvedValue({
          success: false,
          syncId: 'sync-123',
          message: 'Sincronización completada con 1 errores de 1 páginas.',
          stats: { pagesProcessed: 0, blocksProcessed: 0, embeddingsGenerated: 0, errors: 1 },
          errors: ['Error en página page-unknown: Error desconocido']
        });

        const request = createRequest({ pageIds: ['page-unknown'] });
        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.success).toBe(false);
        expect(data.stats.errors).toBe(1);
        expect(data.errors).toContain('Error en página page-unknown: Error desconocido');
      });

      it('should handle mixed success and failure results', async () => {
        vi.mocked(container.syncController.syncPages).mockResolvedValue({
          success: false,
          syncId: 'sync-123',
          message: 'Sincronización completada con 2 errores de 3 páginas.',
          stats: { pagesProcessed: 1, blocksProcessed: 5, embeddingsGenerated: 3, errors: 2 },
          errors: ['Failed page', 'Error en página exception: Exception page']
        });

        const request = createRequest({ pageIds: ['success', 'failure', 'exception'] });
        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.success).toBe(false);
        expect(data.stats.pagesProcessed).toBe(1);
        expect(data.stats.errors).toBe(2);
        expect(data.errors).toEqual([
          'Failed page',
          'Error en página exception: Exception page'
        ]);
      });
    });

    describe('Sincronización de base de datos', () => {
      it('should handle full database sync (not implemented)', async () => {
        vi.mocked(container.syncController.syncPages).mockResolvedValue({
          success: false,
          syncId: 'sync-123',
          message: 'Sincronización completada con 1 errores de 1 páginas.',
          stats: { pagesProcessed: 0, blocksProcessed: 0, embeddingsGenerated: 0, errors: 1 },
          errors: ['La sincronización completa de base de datos aún no está implementada']
        });

        const request = createRequest({ databaseId: 'db-123', fullSync: true });
        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.success).toBe(false);
        expect(data.stats.errors).toBe(1);
        expect(data.errors).toContain('La sincronización completa de base de datos aún no está implementada');
      });

      it('should handle incremental database sync (not implemented)', async () => {
        vi.mocked(container.syncController.syncPages).mockResolvedValue({
          success: false,
          syncId: 'sync-123',
          message: 'Sincronización completada con 1 errores de 1 páginas.',
          stats: { pagesProcessed: 0, blocksProcessed: 0, embeddingsGenerated: 0, errors: 1 },
          errors: ['La detección automática de cambios aún no está implementada. Use pageIds específicos.']
        });

        const request = createRequest({ databaseId: 'db-123', fullSync: false });
        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.success).toBe(false);
        expect(data.stats.errors).toBe(1);
        expect(data.errors).toContain('La detección automática de cambios aún no está implementada. Use pageIds específicos.');
      });

      it('should default fullSync to false when not provided', async () => {
        vi.mocked(container.syncController.syncPages).mockResolvedValue({
          success: false,
          syncId: 'sync-123',
          message: 'Sincronización completada con 1 errores de 1 páginas.',
          stats: { pagesProcessed: 0, blocksProcessed: 0, embeddingsGenerated: 0, errors: 1 },
          errors: ['La detección automática de cambios aún no está implementada. Use pageIds específicos.']
        });

        const request = createRequest({ databaseId: 'db-123' });
        const response = await POST(request);

        expect(response.status).toBe(400);
        expect(vi.mocked(container.syncController.syncPages)).toHaveBeenCalledWith({
          databaseId: 'db-123'
        });
      });
    });

    describe('Logging de sincronización', () => {
      it('should handle sync log creation errors', async () => {
        vi.mocked(container.syncController.syncPages).mockRejectedValue(new Error('Log creation failed'));

        const request = createRequest({ pageIds: ['page-123'] });
        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.success).toBe(false);
        expect(data.message).toContain('Log creation failed');
      });

      it('should handle sync log update errors in catch block', async () => {
        vi.mocked(container.syncController.syncPages).mockRejectedValue(new Error('Update failed'));

        const request = createRequest({ pageIds: ['page-123'] });
        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.success).toBe(false);
      });
    });

    describe('Manejo de errores generales', () => {
      it('should handle service instantiation errors', async () => {
        vi.mocked(container.syncController.syncPages).mockRejectedValue(new Error('Service initialization failed'));

        const request = createRequest({ pageIds: ['page-123'] });
        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.success).toBe(false);
        expect(data.message).toContain('Service initialization failed');
      });
    });

    describe('Tipos de sincronización', () => {
      it('should detect page sync type', async () => {
        const request = createRequest({ pageIds: ['page-123'] });
        await POST(request);

        expect(vi.mocked(container.syncController.syncPages)).toHaveBeenCalledWith({
          pageIds: ['page-123']
        });
      });

      it('should detect full sync type', async () => {
        const request = createRequest({ databaseId: 'db-123', fullSync: true });
        await POST(request);

        expect(vi.mocked(container.syncController.syncPages)).toHaveBeenCalledWith({
          databaseId: 'db-123',
          fullSync: true
        });
      });

      it('should detect incremental sync type', async () => {
        const request = createRequest({ databaseId: 'db-123', fullSync: false });
        await POST(request);

        expect(vi.mocked(container.syncController.syncPages)).toHaveBeenCalledWith({
          databaseId: 'db-123',
          fullSync: false
        });
      });
    });

    describe('Mensajes de respuesta', () => {
      it('should return success message when no errors', async () => {
        vi.mocked(container.syncController.syncPages).mockResolvedValue({
          success: true,
          syncId: 'sync-123',
          message: 'Sincronización completada exitosamente. 1 páginas procesadas.',
          stats: { pagesProcessed: 1, blocksProcessed: 5, embeddingsGenerated: 3, errors: 0 }
        });

        const request = createRequest({ pageIds: ['page-123'] });
        const response = await POST(request);
        const data = await response.json();

        expect(data.message).toBe('Sincronización completada exitosamente. 1 páginas procesadas.');
        expect(data.success).toBe(true);
      });

      it('should return warning message when there are errors', async () => {
        vi.mocked(container.syncController.syncPages).mockResolvedValue({
          success: false,
          syncId: 'sync-123',
          message: 'Sincronización completada con 1 errores de 1 páginas.',
          stats: { pagesProcessed: 0, blocksProcessed: 0, embeddingsGenerated: 0, errors: 1 },
          errors: ['Test error']
        });

        const request = createRequest({ pageIds: ['page-123'] });
        const response = await POST(request);
        const data = await response.json();

        expect(data.message).toBe('Sincronización completada con 1 errores de 1 páginas.');
        expect(data.success).toBe(false);
      });
    });
  });

  describe('GET - Consultas de sincronización', () => {
    describe('Consulta de logs específicos', () => {
      it('should return not implemented for syncId queries', async () => {
        mockSyncController.getSyncStatus.mockResolvedValue({
          success: true,
          syncId: 'sync-123',
          status: 'completed',
          message: 'Consulta de logs de sincronización no implementada aún'
        });

        const request = createGetRequest({ syncId: 'sync-123' });
        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.message).toContain('Consulta de logs de sincronización no implementada aún');
      });
    });

    describe('Consulta de estadísticas', () => {
      it('should return system stats when stats=true', async () => {
        const request = createGetRequest({ stats: 'true' });
        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data).toEqual(mockSystemStats);
        expect(vi.mocked(container.syncController.getMigrationStats)).toHaveBeenCalled();
      });

      it('should handle stats service errors', async () => {
        vi.mocked(container.syncController.getMigrationStats).mockResolvedValue({
          success: false,
          error: 'Stats service error'
        });

        const request = createGetRequest({ stats: 'true' });
        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.error).toContain('Error obteniendo información: Value is not JSON serializable');
      });
    });

    describe('Consulta por defecto', () => {
      it('should return available operations info', async () => {
        const request = createGetRequest();
        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.message).toContain('Sync API endpoint with new architecture. Funcionalidad básica disponible.');
        expect(data.availableOperations).toHaveLength(3);
        expect(data.availableOperations[0]).toContain('POST con pageIds[]');
        expect(data.availableOperations[1]).toContain('GET con ?stats=true');
      });
    });

    describe('Manejo de errores en GET', () => {
      it('should handle service instantiation errors', async () => {
        vi.mocked(container.syncController.getMigrationStats).mockRejectedValue(new Error('Service init failed'));

        const request = createGetRequest({ stats: 'true' });
        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.error).toContain('Error obteniendo información: Service init failed');
      });

      it('should handle unknown errors', async () => {
        vi.mocked(container.syncController.getMigrationStats).mockRejectedValue('String error');

        const request = createGetRequest({ stats: 'true' });
        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.error).toContain('Error obteniendo información: Error desconocido');
      });
    });

    describe('Parámetros de consulta', () => {
      it('should handle stats=false as default behavior', async () => {
        const request = createGetRequest({ stats: 'false' });
        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.message).toContain('Sync API endpoint with new architecture. Funcionalidad básica disponible.');
        expect(vi.mocked(container.syncController.getMigrationStats)).not.toHaveBeenCalled();
      });

      it('should handle multiple query parameters', async () => {
        // syncId takes precedence over stats
        const request = createGetRequest({ syncId: 'sync-123', stats: 'true' });
        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.message).toContain('Consulta de logs de sincronización no implementada aún');
        expect(vi.mocked(container.syncController.getSyncStatus)).toHaveBeenCalledWith('sync-123');
        expect(vi.mocked(container.syncController.getMigrationStats)).not.toHaveBeenCalled();
      });
    });
  });
});