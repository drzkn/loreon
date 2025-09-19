import 'dotenv/config';

export async function GET() {
  const headers = new Headers({
    'Content-Type': 'text/plain; charset=utf-8',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  });

  const stream = new ReadableStream({
    start(controller) {
      const sendLog = (message: string) => {
        const encoder = new TextEncoder();
        controller.enqueue(encoder.encode(`${message}\n`));
      };

      const debugProcess = async () => {
        try {
          sendLog('🔍 DIAGNÓSTICO DE CONEXIÓN CON NOTION API');
          sendLog('===============================================');

          sendLog('📋 1. VERIFICANDO VARIABLES DE ENTORNO:');
          const notionApiKey = process.env.NOTION_API_KEY;
          const databaseIdsStr = process.env.NOTION_DATABASE_ID;

          sendLog(`• NOTION_API_KEY: ${notionApiKey ? `✅ Configurada (${notionApiKey.substring(0, 10)}...)` : '❌ No encontrada'}`);
          sendLog(`• NOTION_DATABASE_ID: ${databaseIdsStr ? `✅ Configurada (${databaseIdsStr})` : '❌ No encontrada'}`);

          if (!notionApiKey) {
            sendLog('❌ ERROR CRÍTICO: NOTION_API_KEY no está configurada');
            sendLog('Configura tu NOTION_API_KEY en las variables de entorno');
            controller.close();
            return;
          }

          if (!databaseIdsStr) {
            sendLog('❌ ERROR CRÍTICO: NOTION_DATABASE_ID no está configurada');
            sendLog('Configura tu NOTION_DATABASE_ID en las variables de entorno');
            controller.close();
            return;
          }

          const databaseIds = databaseIdsStr.split(',').map(id => id.trim()).filter(id => id.length > 0);
          sendLog(`• Total databases configuradas: ${databaseIds.length}`);

          sendLog('🌐 2. PROBANDO CONEXIÓN BÁSICA CON NOTION:');
          sendLog('• Saltando prueba de usuario (funcionalidad removida)');

          sendLog('📊 3. PROBANDO ACCESO A DATABASES CONFIGURADAS:');
          const { container } = await import('@/infrastructure/di/container');
          const queryDatabaseUseCase = container.queryDatabaseUseCase;
          const getDatabaseUseCase = container.getDatabaseUseCase;

          for (let i = 0; i < databaseIds.length; i++) {
            const databaseId = databaseIds[i];
            sendLog(`Database ${i + 1}/${databaseIds.length}: ${databaseId}`);

            try {
              sendLog(`🔍 Obteniendo información de la database...`);
              const databaseInfo = await getDatabaseUseCase.execute(databaseId);
              sendLog(`✅ Database encontrada: "${databaseInfo.title}"`);
              sendLog(`• Creada: ${databaseInfo.createdTime}`);
              sendLog(`• Última edición: ${databaseInfo.lastEditedTime}`);
              sendLog(`📄 Consultando páginas de la database...`);
              const pages = await queryDatabaseUseCase.execute(databaseId);
              sendLog(`✅ Consulta exitosa: ${pages.length} páginas encontradas`);

              if (pages.length > 0) {
                sendLog(`     📋 Primeras páginas:`);
                pages.slice(0, 3).forEach((page, index) => {
                  const title = page.properties?.title || page.properties?.Name || 'Sin título';
                  const titleStr = typeof title === 'string' ? title : JSON.stringify(title).substring(0, 50);
                  sendLog(`${index + 1}. ${titleStr} (${page.id})`);
                });
                if (pages.length > 3) {
                  sendLog(`... y ${pages.length - 3} páginas más`);
                }
              } else {
                sendLog(`⚠️ Database vacía o sin páginas accesibles`);
              }

            } catch (error) {
              sendLog(`❌ Error al acceder a la database: ${error instanceof Error ? error.message : 'Error desconocido'}`);

              if (error && typeof error === 'object' && 'response' in error) {
                const axiosError = error as { response?: { status?: number; data?: { message?: string } } };
                const status = axiosError.response?.status;
                const responseData = axiosError.response?.data;

                sendLog(`• Status HTTP: ${status}`);
                sendLog(`• Respuesta: ${JSON.stringify(responseData, null, 2)}`);

                // Análisis específico del error 400
                if (status === 400) {
                  sendLog(`🔍 ANÁLISIS ERROR 400 (Bad Request):`);
                  sendLog(`⚠️ La request está mal formateada`);

                  // Validar formato del Database ID
                  if (databaseId.includes('-')) {
                    sendLog(`❌ Database ID contiene guiones: ${databaseId}`);
                    sendLog(`💡 SOLUCIÓN: Remover todos los guiones del Database ID`);
                    const cleanId = databaseId.replace(/-/g, '');
                    sendLog(`✅ ID corregido debería ser: ${cleanId}`);
                  }

                  if (databaseId.length !== 32) {
                    sendLog(`❌ Database ID tiene longitud incorrecta: ${databaseId.length} caracteres`);
                    sendLog(`💡 SOLUCIÓN: Database ID debe tener exactamente 32 caracteres`);
                  }

                  if (!/^[a-f0-9]{32}$/.test(databaseId.replace(/-/g, ''))) {
                    sendLog(`❌ Database ID contiene caracteres inválidos`);
                    sendLog(`💡 SOLUCIÓN: Database ID debe contener solo letras a-f y números 0-9`);
                  }

                  if (responseData?.message) {
                    sendLog(`📝 Mensaje de Notion: ${responseData.message}`);
                  }

                } else if (status === 401) {
                  sendLog(`🔍 ANÁLISIS ERROR 401: API Key inválida`);
                  sendLog(`💡 SOLUCIÓN: Verifica tu NOTION_API_KEY`);

                } else if (status === 403) {
                  sendLog(`🔍 ANÁLISIS ERROR 403: Sin permisos`);
                  sendLog(`💡 SOLUCIÓN: Añade la database a tu integración de Notion`);

                } else if (status === 404) {
                  sendLog(`🔍 ANÁLISIS ERROR 404: Database no encontrada`);
                  sendLog(`💡 SOLUCIÓN: Verifica que el Database ID sea correcto`);
                }
              }
            }
            sendLog('');
          }

          const hasFormatErrors = databaseIds.some(id =>
            id.includes('-') || id.length !== 32 || !/^[a-f0-9]{32}$/.test(id.replace(/-/g, ''))
          );

          if (hasFormatErrors) {
            sendLog('🔧 4. CORRECCIÓN AUTOMÁTICA DE DATABASE IDs:');
            sendLog('Se detectaron errores de formato. IDs corregidos:');

            const correctedIds = databaseIds.map(id => {
              const cleanId = id.replace(/-/g, '');
              sendLog(`• Original: ${id}`);
              sendLog(`• Corregido: ${cleanId}`);
              return cleanId;
            });

            sendLog('💡 VARIABLE DE ENTORNO CORREGIDA:');
            sendLog(`NOTION_DATABASE_ID="${correctedIds.join(',')}"`);
          }

          // 5. Resumen y recomendaciones
          sendLog('📋 5. RESUMEN Y RECOMENDACIONES:');
          sendLog('✅ Diagnóstico completado');
          sendLog('🔧 SOLUCIONES COMUNES PARA ERROR 400:');
          sendLog('• Database ID con guiones: remueve todos los guiones (-)');
          sendLog('• Database ID muy largo/corto: debe tener exactamente 32 caracteres');
          sendLog('• Caracteres inválidos: solo usa letras a-f y números 0-9');
          sendLog('🔧 OTRAS SOLUCIONES:');
          sendLog('• Error 401: verifica que la API key sea correcta');
          sendLog('• Error 403: verifica que la integración tenga permisos');
          sendLog('• Error 404: verifica que los database IDs sean correctos');
          sendLog('• Sin páginas: verifica que la database tenga contenido');
          sendLog('📝 CONFIGURACIÓN ACTUAL:');
          sendLog(`• Environment: ${process.env.NODE_ENV || 'development'}`);
          sendLog(`• Total databases: ${databaseIds.length}`);
          sendLog(`• API Key presente: ${!!notionApiKey}`);

        } catch (error) {
          sendLog(`❌ Error crítico en diagnóstico: ${error instanceof Error ? error.message : 'Error desconocido'}`);
        } finally {
          try {
            controller.close();
          } catch {
            // Ignorar errores al cerrar el controlador (puede ya estar cerrado)
          }
        }
      };

      debugProcess();
    },
  });

  return new Response(stream, { headers });
}
