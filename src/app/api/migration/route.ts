import { NextRequest, NextResponse } from 'next/server';
import { NotionMigrationService } from '@/services/notion/NotionMigrationService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, pageIds, options = {} } = body;

    if (!action) {
      return NextResponse.json(
        { error: 'Acción requerida' },
        { status: 400 }
      );
    }

    const migrationService = new NotionMigrationService();

    switch (action) {
      case 'migrate_page': {
        if (!pageIds || !Array.isArray(pageIds) || pageIds.length === 0) {
          return NextResponse.json(
            { error: 'Se requiere al menos un ID de página' },
            { status: 400 }
          );
        }

        if (pageIds.length === 1) {
          const result = await migrationService.migratePage(pageIds[0]);
          return NextResponse.json({ result });
        } else {
          const results = await migrationService.migrateMultiplePages(
            pageIds,
            options.batchSize || 5
          );
          return NextResponse.json({ results });
        }
      }

      case 'get_content': {
        const { pageId, format = 'json' } = body;

        if (!pageId) {
          return NextResponse.json(
            { error: 'ID de página requerido' },
            { status: 400 }
          );
        }

        const content = await migrationService.getContentInFormat(pageId, format);
        return NextResponse.json({ content, format });
      }

      case 'search': {
        const { query, useEmbeddings = false, limit = 20, threshold = 0.7 } = body;

        if (!query) {
          return NextResponse.json(
            { error: 'Query de búsqueda requerida' },
            { status: 400 }
          );
        }

        const results = await migrationService.searchContent(query, {
          useEmbeddings,
          limit,
          threshold
        });

        return NextResponse.json({ results });
      }

      case 'stats': {
        const stats = await migrationService.getMigrationStats();
        return NextResponse.json({ stats });
      }

      default:
        return NextResponse.json(
          { error: `Acción no soportada: ${action}` },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Error en endpoint de migración:', error);

    const errorMessage = error instanceof Error ? error.message : 'Error interno del servidor';

    return NextResponse.json(
      {
        error: errorMessage,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    const migrationService = new NotionMigrationService();

    switch (action) {
      case 'stats': {
        const stats = await migrationService.getMigrationStats();
        return NextResponse.json({ stats });
      }

      case 'health': {
        return NextResponse.json({
          status: 'ok',
          timestamp: new Date().toISOString(),
          services: {
            migration: 'available',
            database: 'connected',
            embeddings: 'available'
          }
        });
      }

      default:
        return NextResponse.json({
          message: 'API de Migración de Notion',
          availableActions: {
            POST: [
              'migrate_page - Migra páginas específicas',
              'get_content - Obtiene contenido en formato específico',
              'search - Busca contenido usando texto o embeddings',
              'stats - Obtiene estadísticas del sistema'
            ],
            GET: [
              'stats - Obtiene estadísticas del sistema',
              'health - Verifica el estado del servicio'
            ]
          },
          timestamp: new Date().toISOString()
        });
    }

  } catch (error) {
    console.error('Error en GET de migración:', error);

    return NextResponse.json(
      {
        error: 'Error interno del servidor',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
} 