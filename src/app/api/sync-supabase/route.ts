import 'dotenv/config';

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
          sendLog('🚀 Iniciando proceso completo de sincronización Notion → Supabase');
          sendLog('');

          sendLog('📋 Paso 1/4: Leyendo configuración desde variables de entorno...');

          // Obtener database IDs de las variables de entorno
          const databaseIdsStr = process.env.NOTION_DATABASE_ID;
          const notionApiKey = process.env.NOTION_API_KEY;
          const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

          sendLog(`🔑 Variables de entorno detectadas:`);
          sendLog(`   • NOTION_API_KEY: ${notionApiKey ? '✅ Configurada' : '❌ No encontrada'}`);
          sendLog(`   • SUPABASE_URL: ${supabaseUrl ? '✅ Configurada' : '❌ No encontrada'}`);
          sendLog(`   • NOTION_DATABASE_ID: ${databaseIdsStr ? '✅ Configurada' : '❌ No encontrada'}`);

          if (!databaseIdsStr) {
            sendLog('❌ Error crítico: NOTION_DATABASE_ID no configurado en variables de entorno');
            sendLog('   Por favor, configura la variable NOTION_DATABASE_ID en tu archivo .env.local');
            controller.close();
            return;
          }

          if (!notionApiKey) {
            sendLog('⚠️ Advertencia: NOTION_API_KEY no configurada, puede causar errores');
          }

          const databaseIds = databaseIdsStr.split(',').map(id => id.trim()).filter(id => id.length > 0);

          sendLog('');
          sendLog(`📊 Databases configuradas para sincronización:`);
          databaseIds.forEach((id, index) => {
            sendLog(`   ${index + 1}. ${id}`);
          });
          sendLog(`   Total: ${databaseIds.length} database(s)`);
          sendLog('');

          const results = [];

          // Procesar cada database ID
          for (let i = 0; i < databaseIds.length; i++) {
            const databaseId = databaseIds[i];
            sendLog(`📊 Procesando database ${i + 1}/${databaseIds.length}: ${databaseId}`);

            try {
              sendLog(`🔄 Paso 1/4: Iniciando sincronización de database ${databaseId}...`);

              // Importar servicios necesarios
              const { container } = await import('@/infrastructure/di/container');
              const queryDatabaseUseCase = container.queryDatabaseUseCase;
              const notionMigrationService = container.notionMigrationService;

              sendLog(`📊 Paso 2/4: Obteniendo páginas de la database de manera recursiva...`);
              sendLog(`   🔍 Consultando Notion API para database: ${databaseId}`);

              // Obtener todas las páginas de la database
              const pages = await queryDatabaseUseCase.execute(databaseId, {});

              sendLog(`📄 Resultado de la consulta:`);
              sendLog(`   • Total de páginas encontradas: ${pages.length}`);

              if (pages.length > 0) {
                sendLog(`   • Primeras páginas encontradas:`);
                pages.slice(0, 3).forEach((page, index) => {
                  const title = page.properties?.title || page.properties?.Name || 'Sin título';
                  sendLog(`     ${index + 1}. ${typeof title === 'string' ? title : JSON.stringify(title).substring(0, 50)}`);
                });
                if (pages.length > 3) {
                  sendLog(`     ... y ${pages.length - 3} páginas más`);
                }
              }

              if (pages.length === 0) {
                sendLog(`⚠️ No se encontraron páginas en la database ${databaseId}`);
                results.push({
                  databaseId,
                  status: 'warning',
                  message: `No se encontraron páginas en database ${databaseId}`
                });
                continue;
              }

              sendLog(`💾 Paso 3/4: Volcando páginas a Supabase y generando embeddings...`);
              sendLog(`   🔄 Iniciando procesamiento de ${pages.length} páginas`);
              sendLog(`   📊 Cada página incluye: extracción de contenido → guardado en Supabase → vectorización`);
              sendLog('');

              let pagesProcessed = 0;
              let totalBlocks = 0;
              let totalEmbeddings = 0;
              let errors = 0;

              // Procesar cada página individualmente con progreso detallado
              for (let pageIndex = 0; pageIndex < pages.length; pageIndex++) {
                const page = pages[pageIndex];
                const pageProgress = `[${pageIndex + 1}/${pages.length}]`;
                const pageTitle = page.properties?.title || page.properties?.Name || page.id;
                const displayTitle = typeof pageTitle === 'string' ? pageTitle : JSON.stringify(pageTitle).substring(0, 30);

                try {
                  sendLog(`📝 ${pageProgress} Procesando: "${displayTitle}"`);
                  sendLog(`   🔗 Obteniendo contenido desde Notion API...`);

                  // Migrar la página usando el servicio
                  const migrationResult = await notionMigrationService.migratePage(page.id);

                  if (migrationResult.success) {
                    pagesProcessed++;
                    totalBlocks += migrationResult.blocksProcessed || 0;
                    totalEmbeddings += migrationResult.embeddingsGenerated || 0;

                    sendLog(`   💾 Guardado en Supabase: ${migrationResult.blocksProcessed || 0} bloques`);
                    sendLog(`   🧠 Vectorización: ${migrationResult.embeddingsGenerated || 0} embeddings generados`);
                    sendLog(`✅ ${pageProgress} Completado exitosamente`);
                  } else {
                    errors++;
                    const errorMsg = migrationResult.errors?.join(', ') || 'Error desconocido';
                    sendLog(`❌ ${pageProgress} Error: ${errorMsg}`);
                  }

                  // Progreso cada 5 páginas o al final
                  if ((pageIndex + 1) % 5 === 0 || pageIndex === pages.length - 1) {
                    const progress = Math.round(((pageIndex + 1) / pages.length) * 100);
                    sendLog(`📊 Progreso: ${progress}% (${pageIndex + 1}/${pages.length} páginas)`);
                  }

                  sendLog('');

                  // Pequeña pausa para no sobrecargar la API
                  if (pageIndex < pages.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, 100));
                  }

                } catch (pageError) {
                  errors++;
                  const errorMsg = pageError instanceof Error ? pageError.message : 'Error desconocido';
                  sendLog(`❌ ${pageProgress} Error crítico: ${errorMsg}`);
                  sendLog('');
                }
              }

              sendLog(`🧠 Paso 4/4: Proceso de vectorización y almacenamiento completado`);
              sendLog(`📊 Estadísticas finales para database ${databaseId}:`);
              sendLog(`   • Páginas procesadas: ${pagesProcessed}/${pages.length}`);
              sendLog(`   • Bloques totales: ${totalBlocks}`);
              sendLog(`   • Embeddings generados: ${totalEmbeddings}`);
              sendLog(`   • Errores: ${errors}`);

              if (errors === 0) {
                sendLog(`✅ Database ${databaseId} sincronizada exitosamente`);
              } else {
                sendLog(`⚠️ Database ${databaseId} sincronizada con ${errors} errores`);
              }

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

          // Calcular estadísticas globales
          const successCount = results.filter(r => r.status === 'success').length;
          const errorCount = results.filter(r => r.status === 'error').length;
          const warningCount = results.filter(r => r.status === 'warning').length;

          sendLog('');
          sendLog('🎯 RESUMEN FINAL DE SINCRONIZACIÓN');
          sendLog('═'.repeat(50));
          sendLog(`📊 Databases procesadas:`);
          sendLog(`   • Exitosas: ${successCount}`);
          sendLog(`   • Con errores: ${errorCount}`);
          sendLog(`   • Con advertencias: ${warningCount}`);
          sendLog(`   • Total: ${databaseIds.length}`);
          sendLog('');

          if (results.length > 0) {
            sendLog(`📋 Detalle por database:`);
            results.forEach((result, index) => {
              const status = result.status === 'success' ? '✅' :
                result.status === 'warning' ? '⚠️' : '❌';
              sendLog(`   ${index + 1}. ${status} ${result.databaseId} - ${result.message}`);
            });
          }

          sendLog('');
          if (errorCount === 0) {
            sendLog(`🎉 ¡Sincronización completada exitosamente!`);
          } else {
            sendLog(`⚠️ Sincronización completada con ${errorCount} errores`);
          }

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

          // Enviar mensaje especial SYNC_COMPLETE con el resultado JSON
          const syncCompleteData = `data: SYNC_COMPLETE:${JSON.stringify(finalResult)}\n\n`;
          controller.enqueue(new TextEncoder().encode(syncCompleteData));

        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
          sendLog(`💥 Error crítico en sincronización: ${errorMessage}`);

          const errorResult = {
            success: false,
            message: `Error crítico: ${errorMessage}`,
            error: error instanceof Error ? error.stack : 'Error desconocido'
          };

          sendLog(`❌ Error crítico: ${JSON.stringify(errorResult)}`);

          // Enviar mensaje especial SYNC_COMPLETE con el resultado de error
          const syncCompleteData = `data: SYNC_COMPLETE:${JSON.stringify(errorResult)}\n\n`;
          controller.enqueue(new TextEncoder().encode(syncCompleteData));
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