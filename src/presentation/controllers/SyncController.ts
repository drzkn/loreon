import { INotionMigrationService } from '@/application/interfaces/INotionMigrationService';
import { ILogger } from '@/application/interfaces/ILogger';
import { SyncRequestDto, SyncResponseDto, PageSyncResultDto } from '@/presentation/dto/SyncRequestDto';

interface SyncStatusStats {
  pagesProcessed?: number;
  blocksProcessed?: number;
  embeddingsGenerated?: number;
  errors?: number;
}

interface MigrationStats {
  storage: {
    totalPages: number;
    totalBlocks: number;
    totalEmbeddings: number;
    lastSync?: string;
  };
  content: {
    totalWords: number;
    averageWordsPerPage: number;
    topContentTypes: Array<{ type: string; count: number }>;
  };
}

export class SyncController {
  constructor(
    private readonly notionMigrationService: INotionMigrationService,
    private readonly logger: ILogger
  ) { }

  async syncPages(request: SyncRequestDto): Promise<SyncResponseDto> {
    const syncId = `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    this.logger.info('Starting page synchronization', {
      syncId,
      databaseId: request.databaseId,
      pageIds: request.pageIds,
      fullSync: request.fullSync
    });

    try {
      // Validar request
      if (!request.databaseId && (!request.pageIds || request.pageIds.length === 0)) {
        const error = 'Se requiere databaseId o pageIds para sincronizar';
        this.logger.error('Invalid sync request', new Error(error), { syncId });

        return {
          success: false,
          syncId,
          message: error,
          errors: [error]
        };
      }

      const stats = {
        pagesProcessed: 0,
        blocksProcessed: 0,
        embeddingsGenerated: 0,
        errors: 0
      };
      const errors: string[] = [];

      if (request.pageIds && request.pageIds.length > 0) {
        // Sincronizar páginas específicas
        this.logger.info(`Synchronizing specific pages`, {
          syncId,
          pageCount: request.pageIds.length
        });

        const results: PageSyncResultDto[] = [];

        for (const pageId of request.pageIds) {
          try {
            const result = await this.notionMigrationService.migratePage(pageId);

            const pageResult: PageSyncResultDto = {
              pageId,
              success: result.success,
              blocksProcessed: result.blocksProcessed,
              embeddingsGenerated: result.embeddingsGenerated
            };

            if (result.success) {
              stats.pagesProcessed++;
              stats.blocksProcessed += result.blocksProcessed || 0;
              stats.embeddingsGenerated += result.embeddingsGenerated || 0;
            } else {
              stats.errors++;
              pageResult.error = result.errors?.join(', ') || 'Error desconocido';
              if (result.errors) {
                errors.push(...result.errors);
              }
            }

            results.push(pageResult);

          } catch (error) {
            stats.errors++;
            const errorMessage = `Error en página ${pageId}: ${error instanceof Error ? error.message : 'Error desconocido'}`;
            this.logger.error('Page sync failed', error as Error, { syncId, pageId });
            errors.push(errorMessage);

            results.push({
              pageId,
              success: false,
              error: errorMessage
            });
          }
        }

        this.logger.info('Page synchronization completed', {
          syncId,
          stats,
          resultsCount: results.length
        });

      } else if (request.databaseId) {
        // TODO: Implementar sincronización de base de datos completa
        const errorMessage = request.fullSync
          ? 'La sincronización completa de base de datos aún no está implementada'
          : 'La detección automática de cambios aún no está implementada. Use pageIds específicos.';

        this.logger.warn('Database sync not implemented', { syncId, databaseId: request.databaseId });
        errors.push(errorMessage);
        stats.errors++;
      }

      const success = stats.errors === 0;
      const message = success
        ? `Sincronización completada exitosamente. ${stats.pagesProcessed} páginas procesadas.`
        : `Sincronización completada con ${stats.errors} errores de ${stats.pagesProcessed + stats.errors} páginas.`;

      const response: SyncResponseDto = {
        success,
        syncId,
        message,
        stats,
        errors: errors.length > 0 ? errors : undefined
      };

      this.logger.info('Sync operation completed', {
        syncId,
        success,
        stats
      });

      return response;

    } catch (error) {
      const errorMessage = `Error durante la sincronización: ${error instanceof Error ? error.message : 'Error desconocido'}`;
      this.logger.error('Sync operation failed', error as Error, { syncId });

      return {
        success: false,
        syncId,
        message: errorMessage,
        errors: [errorMessage]
      };
    }
  }

  async getSyncStatus(syncId: string): Promise<{
    success: boolean;
    syncId: string;
    status: 'pending' | 'running' | 'completed' | 'failed';
    message?: string;
    stats?: SyncStatusStats;
  }> {
    this.logger.debug('Getting sync status', { syncId });

    // TODO: Implement actual sync status tracking
    // For now, return a basic response
    return {
      success: true,
      syncId,
      status: 'completed',
      message: 'Consulta de estado de sincronización no implementada completamente aún'
    };
  }

  async getMigrationStats(): Promise<{
    success: boolean;
    stats?: MigrationStats;
    error?: string;
  }> {
    try {
      this.logger.debug('Getting migration statistics');

      const stats = await this.notionMigrationService.getMigrationStats();

      this.logger.info('Migration statistics retrieved successfully', {
        totalPages: stats.storage.totalPages,
        totalBlocks: stats.storage.totalBlocks
      });

      return {
        success: true,
        stats
      };

    } catch (error) {
      const errorMessage = `Error obteniendo estadísticas: ${error instanceof Error ? error.message : 'Error desconocido'}`;
      this.logger.error('Failed to get migration stats', error as Error);

      return {
        success: false,
        error: errorMessage
      };
    }
  }
}
