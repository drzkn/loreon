import 'dotenv/config';
import { getDelay, getFullParallelStrategy, largeBatchesStrategy, mediumBatchesStrategy, safeBatchesStrategy } from './constants';

export async function POST() {
  const headers = new Headers({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  });

  const stream = new ReadableStream({
    start(controller) {
      const sendLog = (message: string) => {
        const encoder = new TextEncoder();
        const data = `data: ${message}\n\n`;
        controller.enqueue(encoder.encode(data));
      };

      const syncProcess = async () => {
        try {
          sendLog('🚀 Iniciando sincronización ADAPTIVA optimizada');
          sendLog('🧠 IA de Paralelización: Se adapta automáticamente al tamaño');
          sendLog('📋 Paso 1/4: Leyendo configuración...');

          const databaseIdsStr = process.env.NOTION_DATABASE_ID;
          const notionApiKey = process.env.NOTION_API_KEY;

          if (!databaseIdsStr || !notionApiKey) {
            sendLog('❌ Error: Variables de entorno faltantes');
            controller.close();
            return;
          }

          const databaseIds = databaseIdsStr.split(',').map(id => id.trim()).filter(id => id.length > 0);
          sendLog(`📊 ${databaseIds.length} database(s) configuradas`);

          const { container } = await import('@/infrastructure/di/container');
          const queryDatabaseUseCase = container.queryDatabaseUseCase;
          const notionMigrationService = container.notionMigrationService;

          const startTime = Date.now();

          const getOptimalStrategy = (pageCount: number) => {
            if (pageCount <= 10) {
              return getFullParallelStrategy(pageCount);
            }

            if (pageCount <= 30) {
              return largeBatchesStrategy;
            }

            if (pageCount <= 100) {
              return mediumBatchesStrategy;
            }

            return safeBatchesStrategy;
          };

          const processDatabase = async (databaseId: string, index: number) => {
            const dbProgress = `[DB ${index + 1}/${databaseIds.length}]`;

            try {
              sendLog(`📊 ${dbProgress} Analizando database: ${databaseId}`);

              const pages = await queryDatabaseUseCase.execute(databaseId);
              sendLog(`📄 ${dbProgress} Encontradas ${pages.length} páginas`);

              if (pages.length === 0) {
                sendLog(`⚠️ ${dbProgress} Database vacía`);
                return { databaseId, pagesProcessed: 0, errors: 0 };
              }

              const strategy = getOptimalStrategy(pages.length);
              sendLog(`🧠 ${dbProgress} Estrategia IA: ${strategy.strategy}`);
              sendLog(`📋 ${dbProgress} ${strategy.description}`);
              sendLog(`⚠️ ${dbProgress} Nivel de riesgo: ${strategy.riskLevel}`);

              const dbStartTime = Date.now();
              let pagesProcessed = 0;
              let errors = 0;

              if (strategy.strategy === 'FULL_PARALLEL') {
                sendLog(`🚀 ${dbProgress} MODO TURBO: Procesando ${pages.length} páginas TODAS EN PARALELO`);
                sendLog(`⚡ ${dbProgress} Sin límites de lotes, máxima velocidad`);

                const startParallelTime = Date.now();

                const pagePromises = pages.map(async (page, pageIndex) => {
                  const pageProgress = `${dbProgress}[${pageIndex + 1}/${pages.length}]`;
                  try {
                    const migrationResult = await notionMigrationService.migratePage(page.id);
                    if (migrationResult.success) {
                      const pageTitle = page.properties?.title || page.properties?.Name || page.id;
                      const displayTitle = typeof pageTitle === 'string' ? pageTitle.substring(0, 20) : 'Page';
                      sendLog(`✅ ${pageProgress} "${displayTitle}": ${migrationResult.blocksProcessed || 0}b, ${migrationResult.embeddingsGenerated || 0}e`);
                      return { success: true };
                    } else {
                      sendLog(`❌ ${pageProgress} Error en migración`);
                      return { success: false };
                    }
                  } catch {
                    return { success: false };
                  }
                });

                const results = await Promise.all(pagePromises);
                const parallelDuration = Date.now() - startParallelTime;

                pagesProcessed = results.filter(r => r.success).length;
                errors = results.filter(r => !r.success).length;

                sendLog(`🏆 ${dbProgress} MODO TURBO completado en ${Math.round(parallelDuration / 1000)}s`);
                sendLog(`📊 ${dbProgress} Velocidad: ${(pagesProcessed / (parallelDuration / 1000)).toFixed(2)} páginas/segundo`);

                return;
              }

              sendLog(`📦 ${dbProgress} MODO LOTES: ${strategy.batchSize} páginas por lote`);

              const batches = [];
              for (let i = 0; i < pages.length; i += strategy.batchSize) {
                batches.push(pages.slice(i, i + strategy.batchSize));
              }

              sendLog(`📊 ${dbProgress} ${batches.length} lotes planificados`);

              for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
                const batch = batches[batchIndex];
                const batchProgress = `Lote ${batchIndex + 1}/${batches.length}`;

                sendLog(`🚀 ${dbProgress} ${batchProgress}: ${batch.length} páginas en paralelo...`);

                const batchPromises = batch.map(async (page) => {

                  try {
                    const migrationResult = await notionMigrationService.migratePage(page.id);
                    if (migrationResult.success) {
                      return { success: true };
                    }

                    return { success: false };
                  } catch {
                    return { success: false };
                  }
                });

                const batchResults = await Promise.all(batchPromises);
                const batchSuccesses = batchResults.filter(r => r.success).length;
                const batchErrors = batchResults.filter(r => !r.success).length;

                pagesProcessed += batchSuccesses;
                errors += batchErrors;

                sendLog(`✅ ${dbProgress} ${batchProgress}: ${batchSuccesses} éxito, ${batchErrors} errores`);

                if (batchIndex < batches.length - 1) {
                  await new Promise(resolve => setTimeout(resolve, getDelay(strategy.riskLevel)));
                }
              }

              const dbDuration = Date.now() - dbStartTime;
              const dbSpeed = pagesProcessed / (dbDuration / 1000);

              sendLog(`🎯 ${dbProgress} Completado: ${pagesProcessed} páginas (${Math.round(dbDuration / 1000)}s, ${dbSpeed.toFixed(2)} p/s)`);

              return {
                databaseId,
                pagesProcessed,
                errors,
                duration: dbDuration,
                strategy: strategy.strategy
              };

            } catch (error) {
              const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
              sendLog(`❌ ${dbProgress} Error crítico: ${errorMessage}`);
              return { databaseId, pagesProcessed: 0, errors: 1, duration: 0, strategy: 'ERROR' };
            }
          };

          sendLog(`⚡ Paso 2/4: Procesamiento paralelo de databases con IA adaptiva...`);
          const results = await Promise.all(
            databaseIds.map((databaseId, index) => processDatabase(databaseId, index))
          );

          const totalDuration = Date.now() - startTime;
          const totalPagesProcessed = results.reduce((sum, r) => sum + (r?.pagesProcessed || 0), 0);
          const totalErrors = results.reduce((sum, r) => sum + (r?.errors || 0), 0);

          sendLog(`🎉 Paso 3/4: Sincronización adaptiva completada!`);
          sendLog(`📊 ESTADÍSTICAS FINALES:`);
          sendLog(`⏱️ Duración total: ${Math.round(totalDuration / 1000)} segundos`);
          sendLog(`📄 Páginas procesadas: ${totalPagesProcessed}`);
          sendLog(`❌ Errores: ${totalErrors}`);

          if (totalPagesProcessed > 0) {
            const overallSpeed = totalPagesProcessed / (totalDuration / 1000);
            sendLog(`⚡ Velocidad promedio: ${overallSpeed.toFixed(2)} páginas/segundo`);
          }

          sendLog(`🧠 ESTRATEGIAS UTILIZADAS:`);
          results.forEach((result, index) => {
            const dbId = databaseIds[index].substring(0, 8);
            sendLog(`• DB ${index + 1} (${dbId}...): ${result?.strategy} - ${result?.pagesProcessed} páginas`);
          });

          sendLog(`🏆 Paso 4/4: ¡Sincronización IA completada con máxima eficiencia!`);

        } catch (error) {
          sendLog(`❌ Error crítico: ${error instanceof Error ? error.message : 'Error desconocido'}`);
        } finally {
          try {
            controller.close();
          } catch (closeError) {
            // Ignorar errores al cerrar el controlador (puede ya estar cerrado)
          }
        }
      };

      syncProcess();
    },
  });

  return new Response(stream, { headers });
}
