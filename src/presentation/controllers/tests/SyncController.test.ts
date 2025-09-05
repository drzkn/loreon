import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SyncController } from '../SyncController';
import { INotionMigrationService } from '@/application/interfaces/INotionMigrationService';
import { ILogger } from '@/application/interfaces/ILogger';
import { SyncRequestDto } from '@/presentation/dto/SyncRequestDto';
import { createTestSetup } from '@/mocks';

describe('SyncController', () => {
  let controller: SyncController;
  let mockNotionMigrationService: INotionMigrationService;
  let mockLogger: ILogger;
  const { teardown } = createTestSetup();

  beforeEach(() => {
    vi.clearAllMocks();

    mockNotionMigrationService = {
      migratePage: vi.fn(),
      migrateMultiplePages: vi.fn(),
      getMigrationStats: vi.fn(),
      getContentInFormat: vi.fn(),
      searchContent: vi.fn()
    };

    mockLogger = {
      info: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
      warn: vi.fn()
    };

    controller = new SyncController(mockNotionMigrationService, mockLogger);
  });

  afterEach(() => {
    teardown();
  });

  describe('syncPages', () => {
    it('should successfully sync specific pages', async () => {
      const request: SyncRequestDto = {
        pageIds: ['page-1', 'page-2'],
        fullSync: false
      };

      const mockMigrationResults = [
        {
          success: true,
          pageId: 'page-1',
          blocksProcessed: 5,
          embeddingsGenerated: 10
        },
        {
          success: true,
          pageId: 'page-2',
          blocksProcessed: 3,
          embeddingsGenerated: 8
        }
      ];

      mockNotionMigrationService.migratePage = vi.fn()
        .mockResolvedValueOnce(mockMigrationResults[0])
        .mockResolvedValueOnce(mockMigrationResults[1]);

      const result = await controller.syncPages(request);

      expect(result.success).toBe(true);
      expect(result.syncId).toMatch(/^sync_\d+_[a-z0-9]+$/);
      expect(result.message).toContain('Sincronización completada exitosamente. 2 páginas procesadas.');
      expect(result.stats).toEqual({
        pagesProcessed: 2,
        blocksProcessed: 8,
        embeddingsGenerated: 18,
        errors: 0
      });
      expect(result.errors).toBeUndefined();

      expect(mockNotionMigrationService.migratePage).toHaveBeenCalledWith('page-1');
      expect(mockNotionMigrationService.migratePage).toHaveBeenCalledWith('page-2');
      expect(mockLogger.info).toHaveBeenCalledWith('Starting page synchronization', expect.objectContaining({
        pageIds: ['page-1', 'page-2'],
        fullSync: false
      }));
    });

    it('should handle mixed success and failure results', async () => {
      const request: SyncRequestDto = {
        pageIds: ['page-success', 'page-fail'],
        fullSync: false
      };

      mockNotionMigrationService.migratePage = vi.fn()
        .mockResolvedValueOnce({
          success: true,
          pageId: 'page-success',
          blocksProcessed: 5,
          embeddingsGenerated: 10
        })
        .mockResolvedValueOnce({
          success: false,
          errors: ['Migration failed for this page']
        });

      const result = await controller.syncPages(request);

      expect(result.success).toBe(false);
      expect(result.stats).toEqual({
        pagesProcessed: 1,
        blocksProcessed: 5,
        embeddingsGenerated: 10,
        errors: 1
      });
      expect(result.message).toContain('Sincronización completada con 1 errores de 2 páginas');
      expect(result.errors).toEqual(['Migration failed for this page']);
    });

    it('should handle page migration exceptions', async () => {
      const request: SyncRequestDto = {
        pageIds: ['page-exception'],
        fullSync: false
      };

      const migrationError = new Error('Network timeout');
      mockNotionMigrationService.migratePage = vi.fn().mockRejectedValue(migrationError);

      const result = await controller.syncPages(request);

      expect(result.success).toBe(false);
      expect(result.stats).toEqual({
        pagesProcessed: 0,
        blocksProcessed: 0,
        embeddingsGenerated: 0,
        errors: 1
      });
      expect(result.errors).toEqual(['Error en página page-exception: Network timeout']);
      expect(mockLogger.error).toHaveBeenCalledWith('Page sync failed', migrationError, expect.objectContaining({
        pageId: 'page-exception'
      }));
    });

    it('should handle validation errors for empty request', async () => {
      const request: SyncRequestDto = {
        fullSync: false
      };

      const result = await controller.syncPages(request);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Se requiere databaseId o pageIds para sincronizar');
      expect(result.errors).toEqual(['Se requiere databaseId o pageIds para sincronizar']);
      expect(mockLogger.error).toHaveBeenCalledWith('Invalid sync request', expect.any(Error), expect.objectContaining({
        syncId: expect.stringMatching(/^sync_\d+_[a-z0-9]+$/)
      }));
    });

    it('should handle validation errors for empty pageIds array', async () => {
      const request: SyncRequestDto = {
        pageIds: [],
        fullSync: false
      };

      const result = await controller.syncPages(request);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Se requiere databaseId o pageIds para sincronizar');
    });

    it('should handle database sync not implemented (fullSync=true)', async () => {
      const request: SyncRequestDto = {
        databaseId: 'database-123',
        fullSync: true
      };

      const result = await controller.syncPages(request);

      expect(result.success).toBe(false);
      expect(result.stats?.errors).toBe(1);
      expect(result.errors).toEqual(['La sincronización completa de base de datos aún no está implementada']);
      expect(mockLogger.warn).toHaveBeenCalledWith('Database sync not implemented', expect.objectContaining({
        databaseId: 'database-123'
      }));
    });

    it('should handle database sync not implemented (fullSync=false)', async () => {
      const request: SyncRequestDto = {
        databaseId: 'database-123',
        fullSync: false
      };

      const result = await controller.syncPages(request);

      expect(result.success).toBe(false);
      expect(result.errors).toEqual(['La detección automática de cambios aún no está implementada. Use pageIds específicos.']);
    });

    it('should handle controller-level exceptions', async () => {
      const request: SyncRequestDto = {
        pageIds: ['page-1'],
        fullSync: false
      };

      // Mock migratePage to throw an error (this will be caught by page-level try-catch)
      mockNotionMigrationService.migratePage = vi.fn().mockRejectedValue(new Error('Unexpected controller error'));

      const result = await controller.syncPages(request);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Sincronización completada con 1 errores de 1 páginas.');
      expect(result.errors).toEqual(['Error en página page-1: Unexpected controller error']);
      expect(mockLogger.error).toHaveBeenCalledWith('Page sync failed', expect.any(Error), expect.objectContaining({
        pageId: 'page-1'
      }));
    });

    it('should handle pages with partial data', async () => {
      const request: SyncRequestDto = {
        pageIds: ['page-partial'],
        fullSync: false
      };

      mockNotionMigrationService.migratePage = vi.fn().mockResolvedValue({
        success: true,
        pageId: 'page-partial'
        // Missing blocksProcessed and embeddingsGenerated
      });

      const result = await controller.syncPages(request);

      expect(result.success).toBe(true);
      expect(result.stats).toEqual({
        pagesProcessed: 1,
        blocksProcessed: 0, // Should default to 0
        embeddingsGenerated: 0, // Should default to 0
        errors: 0
      });
    });

    it('should handle unknown error types', async () => {
      const request: SyncRequestDto = {
        pageIds: ['page-1'],
        fullSync: false
      };

      mockNotionMigrationService.migratePage = vi.fn().mockRejectedValue('String error');

      const result = await controller.syncPages(request);

      expect(result.success).toBe(false);
      expect(result.errors).toEqual(['Error en página page-1: Error desconocido']);
    });

    it('should generate unique sync IDs', async () => {
      const request: SyncRequestDto = {
        pageIds: ['page-1'],
        fullSync: false
      };

      mockNotionMigrationService.migratePage = vi.fn().mockResolvedValue({ success: true });

      const results = await Promise.all([
        controller.syncPages(request),
        controller.syncPages(request),
        controller.syncPages(request)
      ]);

      const syncIds = results.map(r => r.syncId);
      const uniqueSyncIds = new Set(syncIds);

      expect(uniqueSyncIds.size).toBe(3);
      syncIds.forEach(id => {
        expect(id).toMatch(/^sync_\d+_[a-z0-9]+$/);
      });
    });

    it('should handle large number of pages', async () => {
      const pageIds = Array.from({ length: 10 }, (_, i) => `page-${i + 1}`);
      const request: SyncRequestDto = {
        pageIds,
        fullSync: false
      };

      mockNotionMigrationService.migratePage = vi.fn().mockResolvedValue({
        success: true,
        blocksProcessed: 1,
        embeddingsGenerated: 2
      });

      const result = await controller.syncPages(request);

      expect(result.success).toBe(true);
      expect(result.stats?.pagesProcessed).toBe(10);
      expect(result.stats?.blocksProcessed).toBe(10);
      expect(result.stats?.embeddingsGenerated).toBe(20);
      expect(mockNotionMigrationService.migratePage).toHaveBeenCalledTimes(10);
    });
  });

  describe('getSyncStatus', () => {
    it('should return sync status for valid syncId', async () => {
      const syncId = 'sync_123_abc';

      const result = await controller.getSyncStatus(syncId);

      expect(result.success).toBe(true);
      expect(result.syncId).toBe(syncId);
      expect(result.status).toBe('completed');
      expect(result.message).toBe('Consulta de estado de sincronización no implementada completamente aún');
      expect(mockLogger.debug).toHaveBeenCalledWith('Getting sync status', { syncId });
    });

    it('should handle different sync IDs', async () => {
      const syncIds = ['sync_1_a', 'sync_2_b', 'sync_3_c'];

      for (const syncId of syncIds) {
        const result = await controller.getSyncStatus(syncId);

        expect(result.success).toBe(true);
        expect(result.syncId).toBe(syncId);
        expect(result.status).toBe('completed');
      }
    });

    it('should handle empty sync ID', async () => {
      const result = await controller.getSyncStatus('');

      expect(result.success).toBe(true);
      expect(result.syncId).toBe('');
      expect(result.status).toBe('completed');
    });

    it('should log debug information', async () => {
      const syncId = 'test-sync-id';

      await controller.getSyncStatus(syncId);

      expect(mockLogger.debug).toHaveBeenCalledWith('Getting sync status', { syncId: 'test-sync-id' });
    });
  });

  describe('getMigrationStats', () => {
    it('should successfully get migration statistics', async () => {
      const mockStats = {
        storage: {
          totalPages: 100,
          totalBlocks: 500,
          totalEmbeddings: 1000,
          lastSync: '2024-01-01T00:00:00Z'
        },
        content: {
          totalWords: 50000,
          averageWordsPerPage: 500,
          topContentTypes: [
            { type: 'paragraph', count: 300 },
            { type: 'heading_1', count: 50 }
          ]
        }
      };

      mockNotionMigrationService.getMigrationStats = vi.fn().mockResolvedValue(mockStats);

      const result = await controller.getMigrationStats();

      expect(result.success).toBe(true);
      expect(result.stats).toEqual(mockStats);
      expect(result.error).toBeUndefined();
      expect(mockLogger.info).toHaveBeenCalledWith('Migration statistics retrieved successfully', {
        totalPages: 100,
        totalBlocks: 500
      });
    });

    it('should handle migration stats errors', async () => {
      const error = new Error('Stats fetch failed');
      mockNotionMigrationService.getMigrationStats = vi.fn().mockRejectedValue(error);

      const result = await controller.getMigrationStats();

      expect(result.success).toBe(false);
      expect(result.stats).toBeUndefined();
      expect(result.error).toBe('Error obteniendo estadísticas: Stats fetch failed');
      expect(mockLogger.error).toHaveBeenCalledWith('Failed to get migration stats', error);
    });

    it('should handle unknown error types in stats', async () => {
      mockNotionMigrationService.getMigrationStats = vi.fn().mockRejectedValue('String error');

      const result = await controller.getMigrationStats();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Error obteniendo estadísticas: Error desconocido');
    });

    it('should handle empty stats', async () => {
      const emptyStats = {
        storage: {
          totalPages: 0,
          totalBlocks: 0,
          totalEmbeddings: 0
        },
        content: {
          totalWords: 0,
          averageWordsPerPage: 0,
          topContentTypes: []
        }
      };

      mockNotionMigrationService.getMigrationStats = vi.fn().mockResolvedValue(emptyStats);

      const result = await controller.getMigrationStats();

      expect(result.success).toBe(true);
      expect(result.stats).toEqual(emptyStats);
      expect(mockLogger.info).toHaveBeenCalledWith('Migration statistics retrieved successfully', {
        totalPages: 0,
        totalBlocks: 0
      });
    });

    it('should log debug information before fetching stats', async () => {
      mockNotionMigrationService.getMigrationStats = vi.fn().mockResolvedValue({
        storage: { totalPages: 0, totalBlocks: 0, totalEmbeddings: 0 },
        content: { totalWords: 0, averageWordsPerPage: 0, topContentTypes: [] }
      });

      await controller.getMigrationStats();

      expect(mockLogger.debug).toHaveBeenCalledWith('Getting migration statistics');
    });
  });

  describe('Error handling and edge cases', () => {
    it('should handle network timeouts', async () => {
      const request: SyncRequestDto = {
        pageIds: ['page-1'],
        fullSync: false
      };

      const timeoutError = new Error('Network timeout');
      timeoutError.name = 'TimeoutError';

      mockNotionMigrationService.migratePage = vi.fn().mockRejectedValue(timeoutError);

      const result = await controller.syncPages(request);

      expect(result.success).toBe(false);
      expect(result.errors).toEqual(['Error en página page-1: Network timeout']);
    });

    it('should handle concurrent sync operations', async () => {
      const request1: SyncRequestDto = { pageIds: ['page-1'], fullSync: false };
      const request2: SyncRequestDto = { pageIds: ['page-2'], fullSync: false };

      mockNotionMigrationService.migratePage = vi.fn().mockResolvedValue({
        success: true,
        blocksProcessed: 1,
        embeddingsGenerated: 1
      });

      const results = await Promise.all([
        controller.syncPages(request1),
        controller.syncPages(request2)
      ]);

      results.forEach(result => {
        expect(result.success).toBe(true);
        expect(result.syncId).toMatch(/^sync_\d+_[a-z0-9]+$/);
      });

      // Should have different sync IDs
      expect(results[0].syncId).not.toBe(results[1].syncId);
    });

    it('should handle very long page IDs', async () => {
      const longPageId = 'a'.repeat(1000);
      const request: SyncRequestDto = {
        pageIds: [longPageId],
        fullSync: false
      };

      mockNotionMigrationService.migratePage = vi.fn().mockResolvedValue({ success: true });

      const result = await controller.syncPages(request);

      expect(result.success).toBe(true);
      expect(mockNotionMigrationService.migratePage).toHaveBeenCalledWith(longPageId);
    });

    it('should handle null/undefined in migration results', async () => {
      const request: SyncRequestDto = {
        pageIds: ['page-1'],
        fullSync: false
      };

      mockNotionMigrationService.migratePage = vi.fn().mockResolvedValue({
        success: false,
        errors: null // null instead of string array
      });

      const result = await controller.syncPages(request);

      expect(result.success).toBe(false);
      expect(result.stats?.errors).toBe(1);
      // Should handle null errors gracefully
    });

    it('should preserve error details in logs', async () => {
      const request: SyncRequestDto = {
        pageIds: ['page-1'],
        fullSync: false
      };

      const detailedError = new Error('Detailed error message');
      detailedError.stack = 'Error stack trace...';

      mockNotionMigrationService.migratePage = vi.fn().mockRejectedValue(detailedError);

      await controller.syncPages(request);

      expect(mockLogger.error).toHaveBeenCalledWith('Page sync failed', detailedError, expect.any(Object));
    });
  });

  describe('Integration scenarios', () => {
    it('should handle mixed page types in single request', async () => {
      const request: SyncRequestDto = {
        pageIds: ['text-page', 'image-page', 'table-page'],
        fullSync: false
      };

      mockNotionMigrationService.migratePage = vi.fn()
        .mockResolvedValueOnce({ success: true, blocksProcessed: 10, embeddingsGenerated: 20 })
        .mockResolvedValueOnce({ success: true, blocksProcessed: 5, embeddingsGenerated: 0 })
        .mockResolvedValueOnce({ success: false, errors: ['Table parsing failed'] });

      const result = await controller.syncPages(request);

      expect(result.success).toBe(false);
      expect(result.stats).toEqual({
        pagesProcessed: 2,
        blocksProcessed: 15,
        embeddingsGenerated: 20,
        errors: 1
      });
      expect(result.errors).toEqual(['Table parsing failed']);
    });

    it('should handle zero-content pages correctly', async () => {
      const request: SyncRequestDto = {
        pageIds: ['empty-page'],
        fullSync: false
      };

      mockNotionMigrationService.migratePage = vi.fn().mockResolvedValue({
        success: true,
        blocksProcessed: 0,
        embeddingsGenerated: 0
      });

      const result = await controller.syncPages(request);

      expect(result.success).toBe(true);
      expect(result.stats).toEqual({
        pagesProcessed: 1,
        blocksProcessed: 0,
        embeddingsGenerated: 0,
        errors: 0
      });
    });
  });
});
