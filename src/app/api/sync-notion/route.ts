import { NextRequest, NextResponse } from 'next/server';
import { NotionMigrationService } from '@/services/notion/NotionMigrationService';

export const runtime = 'nodejs';

interface SyncRequest {
  databaseId?: string;
  pageIds?: string[];
  fullSync?: boolean;
}

interface SyncResponse {
  success: boolean;
  syncId: string;
  message: string;
  stats?: {
    pagesProcessed: number;
    blocksProcessed: number;
    embeddingsGenerated: number;
    errors: number;
  };
  errors?: string[];
}

export async function POST(request: NextRequest): Promise<NextResponse<SyncResponse>> {
  try {
    const body: SyncRequest = await request.json();
    const { databaseId, pageIds, fullSync = false } = body;

    // Validar que se proporcione al menos un identificador
    if (!databaseId && (!pageIds || pageIds.length === 0)) {
      return NextResponse.json({
        success: false,
        syncId: '',
        message: 'Se requiere databaseId o pageIds para sincronizar'
      }, { status: 400 });
    }

    const migrationService = new NotionMigrationService();
    const stats = {
      pagesProcessed: 0,
      blocksProcessed: 0,
      embeddingsGenerated: 0,
      errors: 0
    };
    const errors: string[] = [];

    // Crear log de sincronización
    const syncType = fullSync ? 'full' : pageIds ? 'page' : 'incremental';
    const syncLog = await migrationService['repository'].createSyncLog(syncType, {
      databaseId,
      pageIds,
      fullSync
    });

    try {
      if (pageIds && pageIds.length > 0) {
        // Sincronizar páginas específicas
        console.log(`🔄 Iniciando sincronización de ${pageIds.length} páginas específicas`);

        for (const pageId of pageIds) {
          try {
            const result = await migrationService.migratePage(pageId);
            if (result.success) {
              stats.pagesProcessed++;
              stats.blocksProcessed += result.blocksProcessed || 0;
              stats.embeddingsGenerated += result.embeddingsGenerated || 0;
            } else {
              stats.errors++;
              if (result.errors) {
                errors.push(...result.errors);
              }
            }
          } catch (error) {
            stats.errors++;
            errors.push(`Error en página ${pageId}: ${error instanceof Error ? error.message : 'Error desconocido'}`);
          }
        }

      } else if (databaseId) {
        if (fullSync) {
          // Sincronización completa de base de datos - usar método disponible
          console.log(`🔄 Iniciando sincronización completa de base de datos: ${databaseId}`);

          // TODO: Implementar migrateDatabase en NotionMigrationService
          // Por ahora, retornamos un error informativo
          errors.push('La sincronización completa de base de datos aún no está implementada');
          stats.errors++;

        } else {
          // Sincronización incremental (solo cambios)
          console.log(`🔄 Iniciando sincronización incremental de base de datos: ${databaseId}`);

          // TODO: Implementar detectChangedPages en NotionMigrationService
          // Por ahora, retornamos un error informativo
          errors.push('La detección automática de cambios aún no está implementada. Use pageIds específicos.');
          stats.errors++;
        }
      }

      // Actualizar log de sincronización
      await migrationService['repository'].updateSyncLog(syncLog.id, {
        status: stats.errors > 0 ? 'failed' : 'completed',
        pages_processed: stats.pagesProcessed,
        blocks_processed: stats.blocksProcessed,
        embeddings_generated: stats.embeddingsGenerated,
        errors: errors.length > 0 ? { errors } : undefined
      });

      const successMessage = stats.errors === 0
        ? `✅ Sincronización completada exitosamente`
        : `⚠️ Sincronización completada con ${stats.errors} errores`;

      return NextResponse.json({
        success: stats.errors === 0,
        syncId: syncLog.id,
        message: successMessage,
        stats,
        errors: errors.length > 0 ? errors : undefined
      });

    } catch (error) {
      // Actualizar log como fallido
      await migrationService['repository'].updateSyncLog(syncLog.id, {
        status: 'failed',
        errors: {
          message: error instanceof Error ? error.message : 'Error desconocido',
          stack: error instanceof Error ? error.stack : undefined
        }
      });

      throw error;
    }

  } catch (error) {
    console.error('❌ Error en sincronización:', error);

    return NextResponse.json({
      success: false,
      syncId: '',
      message: `Error durante la sincronización: ${error instanceof Error ? error.message : 'Error desconocido'}`,
      errors: [error instanceof Error ? error.message : 'Error desconocido']
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const syncId = searchParams.get('syncId');
    const stats = searchParams.get('stats') === 'true';

    const migrationService = new NotionMigrationService();

    if (syncId) {
      // TODO: Implementar getSyncLog en NotionNativeRepository
      return NextResponse.json({
        error: 'Consulta de logs de sincronización no implementada aún'
      }, { status: 501 });
    }

    if (stats) {
      // Obtener estadísticas generales del sistema
      const systemStats = await migrationService.getMigrationStats();
      return NextResponse.json(systemStats);
    }

    // TODO: Implementar getRecentSyncLogs en NotionNativeRepository
    return NextResponse.json({
      message: 'Endpoint de sincronización creado. Funcionalidad básica disponible.',
      availableOperations: [
        'POST con pageIds[] - Sincronizar páginas específicas',
        'GET con ?stats=true - Obtener estadísticas del sistema'
      ]
    });

  } catch (error) {
    console.error('❌ Error obteniendo información de sincronización:', error);

    return NextResponse.json({
      error: `Error obteniendo información: ${error instanceof Error ? error.message : 'Error desconocido'}`
    }, { status: 500 });
  }
} 