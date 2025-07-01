import 'dotenv/config';
import { NextResponse } from 'next/server';
import { ConnectionPageRepository } from '../../connect/repository';

export async function POST() {
  try {
    console.log('🚀 API Route: Iniciando sincronización con Supabase...');

    // Obtener database IDs de las variables de entorno
    const databaseIdsStr = process.env.NOTION_DATABASE_ID;

    if (!databaseIdsStr) {
      return NextResponse.json(
        { error: 'NOTION_DATABASE_ID no configurado en variables de entorno' },
        { status: 400 }
      );
    }

    const databaseIds = databaseIdsStr.split(',').map(id => id.trim()).filter(id => id.length > 0);
    console.log(`📊 Procesando ${databaseIds.length} database(s): ${databaseIds.join(', ')}`);

    const results = [];

    // Procesar cada database ID
    for (let i = 0; i < databaseIds.length; i++) {
      const databaseId = databaseIds[i];
      console.log(`📊 Procesando database ${i + 1}/${databaseIds.length}: ${databaseId}`);

      try {
        // Crear repository con callbacks que loguean al servidor
        const repository = new ConnectionPageRepository(
          databaseId,
          (processing: boolean) => {
            console.log(`🔄 Estado de procesamiento: ${processing ? 'INICIADO' : 'FINALIZADO'}`);
          },
          (progress) => {
            if (progress) {
              console.log(`📊 Progreso: ${progress.current}/${progress.total} - ${progress.currentPageTitle}`);
            }
          }
        );

        await repository.handleSyncToSupabase();

        results.push({
          databaseId,
          status: 'success',
          message: `Database ${databaseId} sincronizado correctamente`
        });

      } catch (dbError) {
        console.error(`❌ Error procesando database ${databaseId}:`, dbError);
        results.push({
          databaseId,
          status: 'error',
          message: dbError instanceof Error ? dbError.message : 'Error desconocido'
        });
      }
    }

    const successCount = results.filter(r => r.status === 'success').length;
    const errorCount = results.filter(r => r.status === 'error').length;

    console.log(`✅ Sincronización completada: ${successCount} exitosas, ${errorCount} errores`);

    return NextResponse.json({
      success: true,
      message: `Sincronización completada: ${successCount} exitosas, ${errorCount} errores`,
      results,
      summary: {
        total: databaseIds.length,
        successful: successCount,
        errors: errorCount
      }
    });

  } catch (error) {
    console.error('💥 Error crítico en API Route:', error);
    return NextResponse.json(
      {
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
} 