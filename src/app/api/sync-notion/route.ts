import { NextRequest, NextResponse } from 'next/server';
import { container } from '@/infrastructure/di/container';
import { SyncRequestDto, SyncResponseDto } from '@/presentation/dto/SyncRequestDto';

export const runtime = 'nodejs';

// Types moved to DTO files

export async function POST(request: NextRequest): Promise<NextResponse<SyncResponseDto>> {
  try {
    container.logger.info('Sync API endpoint called');

    const body: SyncRequestDto = await request.json();

    // Delegate to controller
    const syncController = container.syncController;
    const response = await syncController.syncPages(body);

    const statusCode = response.success ? 200 : 400;
    return NextResponse.json(response, { status: statusCode });

  } catch (error) {
    container.logger.error('Error in sync API endpoint', error as Error);

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
    container.logger.info('Sync API GET endpoint called');

    const { searchParams } = new URL(request.url);
    const syncId = searchParams.get('syncId');
    const stats = searchParams.get('stats') === 'true';

    const syncController = container.syncController;

    if (syncId) {
      const response = await syncController.getSyncStatus(syncId);
      return NextResponse.json(response);
    }

    if (stats) {
      const response = await syncController.getMigrationStats();
      return NextResponse.json(response.stats);
    }

    return NextResponse.json({
      message: 'Sync API endpoint with new architecture. Funcionalidad básica disponible.',
      availableOperations: [
        'POST con pageIds[] - Sincronizar páginas específicas',
        'GET con ?stats=true - Obtener estadísticas del sistema',
        'GET con ?syncId=<id> - Obtener estado de sincronización'
      ]
    });

  } catch (error) {
    container.logger.error('Error in sync API GET endpoint', error as Error);

    return NextResponse.json({
      error: `Error obteniendo información: ${error instanceof Error ? error.message : 'Error desconocido'}`
    }, { status: 500 });
  }
} 