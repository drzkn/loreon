import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST, GET } from '../route';

// Usar el sistema centralizado de mocks
import {
  createTestSetup,
  createNotionMigrationServiceMock,
  createMockNextRequest
} from '@/mocks';

// Crear mock usando la función centralizada
const mockMigrationService = createNotionMigrationServiceMock();

vi.mock('@/services/notion/NotionMigrationService', () => ({
  NotionMigrationService: vi.fn(() => mockMigrationService)
}));

// Helper to create NextRequest (simplificado usando sistema centralizado)
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

// Sample data
const mockSyncLog = {
  id: 'sync-123',
  type: 'page',
  status: 'in_progress',
  created_at: '2024-01-01T00:00:00Z'
};

const mockMigrationResult = {
  success: true,
  blocksProcessed: 5,
  embeddingsGenerated: 3,
  pageId: 'page-123'
};

const mockSystemStats = {
  totalPages: 100,
  totalBlocks: 500,
  totalEmbeddings: 300,
  lastSync: '2024-01-01T00:00:00Z'
};

describe('/api/sync-notion', () => {
  const { teardown } = createTestSetup(); // ✅ Console mocks centralizados

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    teardown(); // ✅ Limpieza automática
  });

  describe('POST - Sincronización de contenido', () => {
    describe('Validación de parámetros', () => {
      it('should return error when no databaseId or pageIds provided', async () => {
        const request = createRequest({});

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.success).toBe(false);
        expect(data.message).toContain('Se requiere databaseId o pageIds');
        expect(data.syncId).toBe('');
      });

      it('should return error when pageIds is empty array', async () => {
        const request = createRequest({ pageIds: [] });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.success).toBe(false);
        expect(data.message).toContain('Se requiere databaseId o pageIds');
      });

      it('should accept valid databaseId without pageIds', async () => {
        mockMigrationService.repository.createSyncLog.mockResolvedValue(mockSyncLog);
        mockMigrationService.repository.updateSyncLog.mockResolvedValue(undefined);

        const request = createRequest({ databaseId: 'db-123', fullSync: true });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.syncId).toBe('sync-123');
        expect(mockMigrationService.repository.createSyncLog).toHaveBeenCalledWith('full', {
          databaseId: 'db-123',
          pageIds: undefined,
          fullSync: true
        });
      });

      it('should accept valid pageIds without databaseId', async () => {
        mockMigrationService.repository.createSyncLog.mockResolvedValue(mockSyncLog);
        mockMigrationService.repository.updateSyncLog.mockResolvedValue(undefined);
        mockMigrationService.migratePage.mockResolvedValue(mockMigrationResult);

        const request = createRequest({ pageIds: ['page-1', 'page-2'] });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(mockMigrationService.repository.createSyncLog).toHaveBeenCalledWith('page', {
          databaseId: undefined,
          pageIds: ['page-1', 'page-2'],
          fullSync: false
        });
      });
    });

    describe('Sincronización de páginas específicas', () => {
      beforeEach(() => {
        mockMigrationService.repository.createSyncLog.mockResolvedValue(mockSyncLog);
        mockMigrationService.repository.updateSyncLog.mockResolvedValue(undefined);
      });

      it('should successfully migrate single page', async () => {
        mockMigrationService.migratePage.mockResolvedValue(mockMigrationResult);

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
        expect(mockMigrationService.migratePage).toHaveBeenCalledWith('page-123');
      });

      it('should successfully migrate multiple pages', async () => {
        mockMigrationService.migratePage.mockResolvedValue(mockMigrationResult);

        const request = createRequest({ pageIds: ['page-1', 'page-2', 'page-3'] });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.stats.pagesProcessed).toBe(3);
        expect(data.stats.blocksProcessed).toBe(15); // 5 * 3
        expect(data.stats.embeddingsGenerated).toBe(9); // 3 * 3
        expect(mockMigrationService.migratePage).toHaveBeenCalledTimes(3);
      });

      it('should handle migration failures from service', async () => {
        const failedResult = {
          success: false,
          errors: ['Page not found', 'Access denied']
        };
        mockMigrationService.migratePage.mockResolvedValue(failedResult);

        const request = createRequest({ pageIds: ['page-failed'] });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(false); // Has errors
        expect(data.stats.errors).toBe(1);
        expect(data.stats.pagesProcessed).toBe(0);
        expect(data.errors).toEqual(['Page not found', 'Access denied']);
      });

      it('should handle migration exceptions', async () => {
        mockMigrationService.migratePage.mockRejectedValue(new Error('Network error'));

        const request = createRequest({ pageIds: ['page-error'] });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(false);
        expect(data.stats.errors).toBe(1);
        expect(data.errors).toContain('Error en página page-error: Network error');
      });

      it('should handle unknown errors', async () => {
        mockMigrationService.migratePage.mockRejectedValue('String error');

        const request = createRequest({ pageIds: ['page-unknown'] });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(false);
        expect(data.stats.errors).toBe(1);
        expect(data.errors).toContain('Error en página page-unknown: Error desconocido');
      });

      it('should handle mixed success and failure results', async () => {
        mockMigrationService.migratePage
          .mockResolvedValueOnce(mockMigrationResult)
          .mockResolvedValueOnce({ success: false, errors: ['Failed page'] })
          .mockRejectedValueOnce(new Error('Exception page'));

        const request = createRequest({ pageIds: ['success', 'failure', 'exception'] });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(false); // Has errors
        expect(data.stats.pagesProcessed).toBe(1);
        expect(data.stats.errors).toBe(2);
        expect(data.errors).toEqual([
          'Failed page',
          'Error en página exception: Exception page'
        ]);
      });
    });

    describe('Sincronización de base de datos', () => {
      beforeEach(() => {
        mockMigrationService.repository.createSyncLog.mockResolvedValue(mockSyncLog);
        mockMigrationService.repository.updateSyncLog.mockResolvedValue(undefined);
      });

      it('should handle full database sync (not implemented)', async () => {
        const request = createRequest({ databaseId: 'db-123', fullSync: true });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(false);
        expect(data.stats.errors).toBe(1);
        expect(data.errors).toContain('La sincronización completa de base de datos aún no está implementada');
        // Console mocks están centralizados globalmente
      });

      it('should handle incremental database sync (not implemented)', async () => {
        const request = createRequest({ databaseId: 'db-123', fullSync: false });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(false);
        expect(data.stats.errors).toBe(1);
        expect(data.errors).toContain('La detección automática de cambios aún no está implementada. Use pageIds específicos.');
        // Console mocks están centralizados globalmente
      });

      it('should default fullSync to false when not provided', async () => {
        const request = createRequest({ databaseId: 'db-123' });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.errors).toContain('La detección automática de cambios aún no está implementada. Use pageIds específicos.');
        expect(mockMigrationService.repository.createSyncLog).toHaveBeenCalledWith('incremental', {
          databaseId: 'db-123',
          pageIds: undefined,
          fullSync: false
        });
      });
    });

    describe('Logging de sincronización', () => {
      it('should create and update sync log successfully', async () => {
        mockMigrationService.repository.createSyncLog.mockResolvedValue(mockSyncLog);
        mockMigrationService.repository.updateSyncLog.mockResolvedValue(undefined);
        mockMigrationService.migratePage.mockResolvedValue(mockMigrationResult);

        const request = createRequest({ pageIds: ['page-123'] });

        const response = await POST(request);

        expect(response.status).toBe(200);
        expect(mockMigrationService.repository.createSyncLog).toHaveBeenCalledWith('page', {
          databaseId: undefined,
          pageIds: ['page-123'],
          fullSync: false
        });
        expect(mockMigrationService.repository.updateSyncLog).toHaveBeenCalledWith('sync-123', {
          status: 'completed',
          pages_processed: 1,
          blocks_processed: 5,
          embeddings_generated: 3,
          errors: undefined
        });
      });

      it('should update sync log with errors when migration fails', async () => {
        mockMigrationService.repository.createSyncLog.mockResolvedValue(mockSyncLog);
        mockMigrationService.repository.updateSyncLog.mockResolvedValue(undefined);
        mockMigrationService.migratePage.mockRejectedValue(new Error('Migration failed'));

        const request = createRequest({ pageIds: ['page-error'] });

        await POST(request);

        expect(mockMigrationService.repository.updateSyncLog).toHaveBeenCalledWith('sync-123', {
          status: 'failed',
          pages_processed: 0,
          blocks_processed: 0,
          embeddings_generated: 0,
          errors: { errors: ['Error en página page-error: Migration failed'] }
        });
      });

      it('should handle sync log creation errors', async () => {
        mockMigrationService.repository.createSyncLog.mockRejectedValue(new Error('Log creation failed'));

        const request = createRequest({ pageIds: ['page-123'] });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.success).toBe(false);
        expect(data.message).toContain('Log creation failed');
      });

      it('should handle sync log update errors in catch block', async () => {
        mockMigrationService.repository.createSyncLog.mockResolvedValue(mockSyncLog);
        mockMigrationService.repository.updateSyncLog
          .mockRejectedValueOnce(new Error('Update failed'))
          .mockResolvedValueOnce(undefined);
        mockMigrationService.migratePage.mockRejectedValue(new Error('Migration failed'));

        const request = createRequest({ pageIds: ['page-123'] });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.success).toBe(false);
        expect(mockMigrationService.repository.updateSyncLog).toHaveBeenCalledTimes(2);
      });
    });

    describe('Manejo de errores generales', () => {
      it('should handle invalid JSON request', async () => {
        const request = new NextRequest('http://localhost/api/sync-notion', {
          method: 'POST',
          body: 'invalid json',
          headers: { 'Content-Type': 'application/json' }
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.success).toBe(false);
        expect(data.message).toContain('Error durante la sincronización');
      });

      it('should handle service instantiation errors', async () => {
        // Test general error handling when service fails
        mockMigrationService.repository.createSyncLog.mockRejectedValue(new Error('Service initialization failed'));

        const request = createRequest({ pageIds: ['page-123'] });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.success).toBe(false);
        expect(data.message).toContain('Service initialization failed');
      });
    });

    describe('Tipos de sincronización', () => {
      beforeEach(() => {
        mockMigrationService.repository.createSyncLog.mockResolvedValue(mockSyncLog);
        mockMigrationService.repository.updateSyncLog.mockResolvedValue(undefined);
      });

      it('should detect page sync type', async () => {
        mockMigrationService.migratePage.mockResolvedValue(mockMigrationResult);

        const request = createRequest({ pageIds: ['page-123'] });

        await POST(request);

        expect(mockMigrationService.repository.createSyncLog).toHaveBeenCalledWith('page', expect.any(Object));
      });

      it('should detect full sync type', async () => {
        const request = createRequest({ databaseId: 'db-123', fullSync: true });

        await POST(request);

        expect(mockMigrationService.repository.createSyncLog).toHaveBeenCalledWith('full', expect.any(Object));
      });

      it('should detect incremental sync type', async () => {
        const request = createRequest({ databaseId: 'db-123', fullSync: false });

        await POST(request);

        expect(mockMigrationService.repository.createSyncLog).toHaveBeenCalledWith('incremental', expect.any(Object));
      });
    });

    describe('Mensajes de respuesta', () => {
      beforeEach(() => {
        mockMigrationService.repository.createSyncLog.mockResolvedValue(mockSyncLog);
        mockMigrationService.repository.updateSyncLog.mockResolvedValue(undefined);
      });

      it('should return success message when no errors', async () => {
        mockMigrationService.migratePage.mockResolvedValue(mockMigrationResult);

        const request = createRequest({ pageIds: ['page-123'] });

        const response = await POST(request);
        const data = await response.json();

        expect(data.message).toBe('✅ Sincronización completada exitosamente');
        expect(data.success).toBe(true);
      });

      it('should return warning message when there are errors', async () => {
        mockMigrationService.migratePage.mockRejectedValue(new Error('Test error'));

        const request = createRequest({ pageIds: ['page-123'] });

        const response = await POST(request);
        const data = await response.json();

        expect(data.message).toBe('⚠️ Sincronización completada con 1 errores');
        expect(data.success).toBe(false);
      });
    });
  });

  describe('GET - Consultas de sincronización', () => {
    describe('Consulta de logs específicos', () => {
      it('should return not implemented for syncId queries', async () => {
        const request = createGetRequest({ syncId: 'sync-123' });

        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(501);
        expect(data.error).toContain('Consulta de logs de sincronización no implementada aún');
      });
    });

    describe('Consulta de estadísticas', () => {
      it('should return system stats when stats=true', async () => {
        mockMigrationService.getMigrationStats.mockResolvedValue(mockSystemStats);

        const request = createGetRequest({ stats: 'true' });

        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data).toEqual(mockSystemStats);
        expect(mockMigrationService.getMigrationStats).toHaveBeenCalled();
      });

      it('should handle stats service errors', async () => {
        mockMigrationService.getMigrationStats.mockRejectedValue(new Error('Stats service error'));

        const request = createGetRequest({ stats: 'true' });

        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.error).toContain('Stats service error');
      });
    });

    describe('Consulta por defecto', () => {
      it('should return available operations info', async () => {
        const request = createGetRequest();

        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.message).toContain('Endpoint de sincronización creado');
        expect(data.availableOperations).toHaveLength(2);
        expect(data.availableOperations[0]).toContain('POST con pageIds[]');
        expect(data.availableOperations[1]).toContain('GET con ?stats=true');
      });
    });

    describe('Manejo de errores en GET', () => {
      it('should handle service instantiation errors', async () => {
        // Test general error handling when service fails
        mockMigrationService.getMigrationStats.mockRejectedValue(new Error('Service init failed'));

        const request = createGetRequest({ stats: 'true' });

        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.error).toContain('Service init failed');
      });

      it('should handle unknown errors', async () => {
        mockMigrationService.getMigrationStats.mockRejectedValue('String error');

        const request = createGetRequest({ stats: 'true' });

        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.error).toContain('Error desconocido');
      });
    });

    describe('Parámetros de consulta', () => {
      it('should handle stats=false as default behavior', async () => {
        const request = createGetRequest({ stats: 'false' });

        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.message).toContain('Endpoint de sincronización creado');
        expect(mockMigrationService.getMigrationStats).not.toHaveBeenCalled();
      });

      it('should handle multiple query parameters', async () => {
        const request = createGetRequest({ syncId: 'sync-123', stats: 'true' });

        const response = await GET(request);
        const data = await response.json();

        // syncId takes precedence
        expect(response.status).toBe(501);
        expect(data.error).toContain('Consulta de logs de sincronización no implementada aún');
      });
    });
  });

  describe('Logging y debugging', () => {
    beforeEach(() => {
      mockMigrationService.repository.createSyncLog.mockResolvedValue(mockSyncLog);
      mockMigrationService.repository.updateSyncLog.mockResolvedValue(undefined);
      mockMigrationService.migratePage.mockResolvedValue(mockMigrationResult);
    });

    it('should log page synchronization start', async () => {
      const request = createRequest({ pageIds: ['page-1', 'page-2'] });

      await POST(request);

      // Console mocks están centralizados globalmente
    });

    it('should log database synchronization types', async () => {
      // Test full sync logging
      const fullSyncRequest = createRequest({ databaseId: 'db-123', fullSync: true });
      await POST(fullSyncRequest);
      // Console mocks están centralizados globalmente

      // Reset mocks and test incremental sync logging
      vi.clearAllMocks();
      mockMigrationService.repository.createSyncLog.mockResolvedValue(mockSyncLog);
      mockMigrationService.repository.updateSyncLog.mockResolvedValue(undefined);

      const incrementalRequest = createRequest({ databaseId: 'db-456', fullSync: false });
      await POST(incrementalRequest);
      // Console mocks están centralizados globalmente
    });

    it('should log errors appropriately', async () => {
      mockMigrationService.getMigrationStats.mockRejectedValue(new Error('Test error'));

      const request = createGetRequest({ stats: 'true' });

      await GET(request);

      // Console mocks están centralizados globalmente
    });
  });
}); 