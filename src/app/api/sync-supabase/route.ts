import 'dotenv/config';
import { ConnectionPageRepository } from '../helpers/ConnectionPageRepository';

export async function POST() {
  // Configurar headers para Server-Sent Events
  const headers = new Headers({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST',
    'Access-Control-Allow-Headers': 'Content-Type',
  });

  // Crear un ReadableStream para enviar eventos
  const stream = new ReadableStream({
    start(controller) {
      // Función para enviar logs al cliente
      const sendLog = (message: string) => {
        const data = `data: ${JSON.stringify({ message })}\n\n`;
        controller.enqueue(new TextEncoder().encode(data));
      };

      // Función principal de sincronización
      const syncProcess = async () => {
        try {
          sendLog('🚀 Iniciando sincronización con Supabase...');

          // Obtener database IDs de las variables de entorno (intentar ambas versiones)
          const databaseIdsStr = process.env.VITE_NOTION_DATABASE_ID || process.env.NOTION_DATABASE_ID;

          if (!databaseIdsStr) {
            sendLog('❌ Error: VITE_NOTION_DATABASE_ID o NOTION_DATABASE_ID no configurado en variables de entorno');
            controller.close();
            return;
          }

          const databaseIds = databaseIdsStr.split(',').map(id => id.trim()).filter(id => id.length > 0);
          sendLog(`📊 Procesando ${databaseIds.length} database(s): ${databaseIds.join(', ')}`);

          const results = [];

          // Procesar cada database ID
          for (let i = 0; i < databaseIds.length; i++) {
            const databaseId = databaseIds[i];
            sendLog(`📊 Procesando database ${i + 1}/${databaseIds.length}: ${databaseId}`);

            try {
              // Crear repository con callback para logs en tiempo real
              const repository = new ConnectionPageRepository(
                databaseId,
                (processing: boolean) => {
                  sendLog(`🔄 Estado de procesamiento: ${processing ? 'INICIADO' : 'FINALIZADO'}`);
                },
                (progress) => {
                  if (progress) {
                    sendLog(`📄 Progreso: ${progress.current}/${progress.total} - ${progress.currentPageTitle}`);
                  }
                },
                sendLog // Callback para enviar logs al stream
              );

              await repository.handleSyncToSupabase();

              results.push({
                databaseId,
                status: 'success',
                message: `Database ${databaseId} sincronizado correctamente`
              });

              sendLog(`✅ Database ${databaseId} sincronizado correctamente`);

            } catch (dbError) {
              const errorMessage = dbError instanceof Error ? dbError.message : 'Error desconocido';
              sendLog(`❌ Error procesando database ${databaseId}: ${errorMessage}`);
              results.push({
                databaseId,
                status: 'error',
                message: errorMessage
              });
            }
          }

          const successCount = results.filter(r => r.status === 'success').length;
          const errorCount = results.filter(r => r.status === 'error').length;

          sendLog(`✅ Sincronización completada: ${successCount} exitosas, ${errorCount} errores`);

          // Enviar resultado final
          const finalResult = {
            success: true,
            message: `Sincronización completada: ${successCount} exitosas, ${errorCount} errores`,
            results,
            summary: {
              total: databaseIds.length,
              successful: successCount,
              errors: errorCount
            }
          };

          sendLog(`📊 Resultado final: ${JSON.stringify(finalResult.summary)}`);

        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
          sendLog(`💥 Error crítico en sincronización: ${errorMessage}`);

          const errorResult = {
            success: false,
            message: `Error crítico: ${errorMessage}`,
            error: error instanceof Error ? error.stack : 'Error desconocido'
          };

          sendLog(`❌ Error crítico: ${JSON.stringify(errorResult)}`);
        } finally {
          // Cerrar el stream
          controller.close();
        }
      };

      // Ejecutar la sincronización
      syncProcess().catch((error) => {
        const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
        sendLog(`💥 Error fatal en el proceso: ${errorMessage}`);
        controller.close();
      });
    }
  });

  return new Response(stream, { headers });
} 