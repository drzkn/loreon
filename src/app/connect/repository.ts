import { container } from '../../infrastructure/di/container';
import { Page } from '../../domain/entities/Page';
import { MarkdownPageInsert } from '../../adapters/output/infrastructure/supabase/types';
import { SupabaseAuthService } from '../../services/auth/SupabaseAuthService';

export interface MarkdownFileResult {
  pageId: string;
  title: string;
  markdown: string;
  blocksCount: number;
  stats: { totalBlocks: number; maxDepth: number; apiCalls: number };
}

export class ConnectionPageRepository {
  private authService: SupabaseAuthService;

  constructor(
    private databaseId: string,
    private setIsProcessing: (processing: boolean) => void,
    private setProgress: (progress: { current: number; total: number; currentPageTitle: string } | null) => void
  ) {
    this.authService = new SupabaseAuthService();
  }

  private log(level: 'info' | 'success' | 'warn' | 'error', message: string, data?: unknown) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [MARKDOWN-${level.toUpperCase()}] ${message}`;

    switch (level) {
      case 'info':
        console.log(`ℹ️ ${logMessage}`, data || '');
        break;
      case 'success':
        console.log(`✅ ${logMessage}`, data || '');
        break;
      case 'warn':
        console.warn(`⚠️ ${logMessage}`, data || '');
        break;
      case 'error':
        console.error(`❌ ${logMessage}`, data || '');
        break;
    }
  }

  // Función auxiliar para extraer título de página
  private extractPageTitle(page: unknown): string {
    try {
      const pageObj = page as { properties?: Record<string, unknown>; id?: string };
      const properties = pageObj.properties;

      if (properties?.title && typeof properties.title === 'object' && properties.title !== null) {
        const titleProp = properties.title as { title?: Array<{ plain_text?: string }> };
        if (titleProp.title) {
          return titleProp.title
            .map((item) => item.plain_text || '')
            .join('')
            .trim() || 'Sin título';
        }
      }

      // Buscar en otras propiedades que podrían ser el título
      if (properties) {
        for (const [, value] of Object.entries(properties)) {
          if (typeof value === 'object' && value !== null) {
            const prop = value as { title?: Array<{ plain_text?: string }> };
            if (prop.title && Array.isArray(prop.title)) {
              return prop.title
                .map((item) => item.plain_text || '')
                .join('')
                .trim() || 'Sin título';
            }
          }
        }
      }

      return `Página ${pageObj.id?.slice(0, 8) || 'unknown'}...`;
    } catch {
      const pageObj = page as { id?: string };
      return `Página ${pageObj.id?.slice(0, 8) || 'unknown'}...`;
    }
  }

  // Función para convertir bloques a markdown y mostrar en consola
  async handleSyncToMarkdown(): Promise<void> {
    this.setIsProcessing(true);
    this.setProgress(null);
    this.log('info', `🚀 Iniciando conversión a markdown para base de datos: ${this.databaseId}`);

    try {
      // Paso 1: Obtener todas las páginas de la base de datos
      this.log('info', '📊 Obteniendo páginas de la base de datos...');
      const pages = await container.queryDatabaseUseCase.execute(this.databaseId);
      this.log('success', `📄 Encontradas ${pages.length} páginas en la base de datos`);

      if (pages.length === 0) {
        this.log('warn', 'No se encontraron páginas en la base de datos');
        return;
      }

      // Paso 2: Procesar cada página en paralelo
      const markdownFiles: MarkdownFileResult[] = [];
      this.log('info', `🚀 Procesando ${pages.length} páginas en paralelo...`);

      let completedPages = 0;
      const processPage = async (page: unknown, index: number): Promise<MarkdownFileResult | null> => {
        const pageTitle = this.extractPageTitle(page);
        this.log('info', `📃 [${index + 1}/${pages.length}] Iniciando procesamiento de: ${pageTitle}`);

        try {
          // Obtener bloques recursivos
          this.log('info', `🌳 Obteniendo bloques recursivos para: ${(page as { id: string }).id}`);
          const blocksResult = await container.getBlockChildrenRecursiveUseCase.execute((page as { id: string }).id, {
            maxDepth: 5,
            includeEmptyBlocks: false,
            delayBetweenRequests: 150
          });

          this.log('success', `🧱 [${pageTitle}] Obtenidos ${blocksResult.totalBlocks} bloques (profundidad máxima: ${blocksResult.maxDepthReached}, ${blocksResult.apiCallsCount} llamadas API)`);

          // Convertir página y bloques a markdown
          this.log('info', `📝 [${pageTitle}] Convirtiendo a markdown...`);
          const markdownContent = container.markdownConverterService.convertPageWithBlocksToMarkdown(page as Page, blocksResult.blocks);

          const markdownFile: MarkdownFileResult = {
            pageId: (page as { id: string }).id,
            title: pageTitle,
            markdown: typeof markdownContent === 'string' ? markdownContent : markdownContent.content,
            blocksCount: blocksResult.totalBlocks,
            stats: {
              totalBlocks: blocksResult.totalBlocks,
              maxDepth: blocksResult.maxDepthReached,
              apiCalls: blocksResult.apiCallsCount
            }
          };

          // Actualizar progreso de manera thread-safe
          completedPages++;
          this.setProgress({
            current: completedPages,
            total: pages.length,
            currentPageTitle: `Completadas: ${completedPages}/${pages.length}`
          });

          this.log('success', `✅ [${completedPages}/${pages.length}] Página "${pageTitle}" convertida a markdown (${blocksResult.totalBlocks} bloques)`);
          return markdownFile;

        } catch (error) {
          completedPages++;
          this.setProgress({
            current: completedPages,
            total: pages.length,
            currentPageTitle: `Completadas: ${completedPages}/${pages.length} (con errores)`
          });

          this.log('error', `❌ Error procesando página ${pageTitle}: ${error instanceof Error ? error.message : 'Error desconocido'}`, error);
          return null;
        }
      };

      // Ejecutar todas las páginas en paralelo
      const results = await Promise.all(
        pages.map((page, index) => processPage(page, index))
      );

      // Filtrar resultados exitosos
      const successfulResults = results.filter((result): result is NonNullable<typeof result> => result !== null);
      markdownFiles.push(...successfulResults);

      // Paso 3: Mostrar todos los archivos markdown en consola
      this.log('info', '📋 Mostrando archivos markdown generados:');
      console.log('\n🎉 ===== ARCHIVOS MARKDOWN GENERADOS ===== 🎉\n');

      markdownFiles.forEach((file, index) => {
        console.log(`\n📄 =============== ARCHIVO ${index + 1}/${markdownFiles.length} ===============`);
        console.log(`📝 Título: ${file.title}`);
        console.log(`🆔 Page ID: ${file.pageId}`);
        console.log(`🧱 Bloques: ${file.blocksCount}`);
        console.log(`📊 Estadísticas:`, file.stats);
        console.log(`\n📋 CONTENIDO MARKDOWN:\n`);
        console.log(file.markdown);
        console.log(`\n📄 =============== FIN ARCHIVO ${index + 1} ===============\n`);
      });

      // Resumen final
      const totalBlocks = markdownFiles.reduce((sum, file) => sum + file.blocksCount, 0);
      const totalApiCalls = markdownFiles.reduce((sum, file) => sum + file.stats.apiCalls, 0);

      this.log('success', `🎉 Conversión completada: ${markdownFiles.length} archivos, ${totalBlocks} bloques totales, ${totalApiCalls} llamadas API`);

      alert(`🎉 ¡Conversión completada!\n\n` +
        `📄 ${markdownFiles.length} páginas procesadas\n` +
        `🧱 ${totalBlocks} bloques convertidos\n` +
        `⚡ ${totalApiCalls} llamadas a la API\n\n` +
        `📋 Revisa la consola (F12) para ver todos los archivos markdown generados.`);

    } catch (error) {
      this.log('error', `💥 Error crítico: ${error instanceof Error ? error.message : 'Error desconocido'}`, error);
      alert(`❌ Error en la conversión: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      this.setIsProcessing(false);
      this.setProgress(null);
    }
  }

  // Nueva función para guardar en Supabase
  async handleSyncToSupabase(): Promise<void> {
    this.setIsProcessing(true);
    this.setProgress(null);
    this.log('info', `🚀 Iniciando sincronización con Supabase para base de datos: ${this.databaseId}`);

    try {
      // Paso 0: Verificar/Inicializar autenticación
      this.log('info', '🔐 Verificando autenticación...');
      const isAuthenticated = await this.authService.isAuthenticated();

      if (!isAuthenticated) {
        this.log('info', '🔑 No autenticado, iniciando sesión anónima...');
        await this.authService.signInAnonymously();
        this.log('success', '✅ Autenticación anónima completada');
      } else {
        this.log('success', '✅ Usuario ya autenticado');
      }

      // Paso 1: Obtener todas las páginas de la base de datos
      this.log('info', '📊 Obteniendo páginas de la base de datos...');
      const pages = await container.queryDatabaseUseCase.execute(this.databaseId);
      this.log('success', `📄 Encontradas ${pages.length} páginas en la base de datos`);

      if (pages.length === 0) {
        this.log('warn', 'No se encontraron páginas en la base de datos');
        return;
      }

      // Paso 2: Procesar y guardar cada página en paralelo
      this.log('info', `🚀 Procesando y guardando ${pages.length} páginas en Supabase...`);

      let completedPages = 0;
      let savedPages = 0;
      let errorPages = 0;
      const operationStats = { created: 0, updated: 0 };

      const processAndSavePage = async (page: unknown, index: number): Promise<boolean> => {
        const pageTitle = this.extractPageTitle(page);
        this.log('info', `📃 [${index + 1}/${pages.length}] Procesando: ${pageTitle}`);

        try {
          // Verificar si ya existe para estadísticas
          const existingPage = await container.supabaseMarkdownRepository.findByNotionPageId((page as { id: string }).id);
          const isUpdate = existingPage !== null;

          // Obtener bloques recursivos
          const blocksResult = await container.getBlockChildrenRecursiveUseCase.execute((page as { id: string }).id, {
            maxDepth: 20,
            includeEmptyBlocks: false,
            delayBetweenRequests: 150
          });

          // Convertir página y bloques a markdown
          const markdownContent = container.markdownConverterService.convertPageWithBlocksToMarkdown(page as Page, blocksResult.blocks);
          const markdownText = typeof markdownContent === 'string' ? markdownContent : markdownContent.content;

          // Preparar datos para Supabase
          const pageData = page as {
            id: string;
            url?: string;
            created_time?: string;
            last_edited_time?: string;
          };

          const supabaseData: MarkdownPageInsert = {
            notion_page_id: pageData.id,
            title: pageTitle,
            content: markdownText,
            notion_url: pageData.url || null,
            notion_created_time: pageData.created_time || null,
            notion_last_edited_time: pageData.last_edited_time || null,
            metadata: {
              blocks_count: blocksResult.totalBlocks,
              max_depth: blocksResult.maxDepthReached,
              api_calls: blocksResult.apiCallsCount,
              processed_at: new Date().toISOString()
            }
          };

          // Guardar o actualizar en Supabase usando upsert
          const result = await container.supabaseMarkdownRepository.upsert(supabaseData);

          // Actualizar estadísticas
          if (isUpdate) {
            operationStats.updated++;
          } else {
            operationStats.created++;
          }

          // Actualizar progreso
          completedPages++;
          savedPages++;
          this.setProgress({
            current: completedPages,
            total: pages.length,
            currentPageTitle: `💾 ${isUpdate ? 'Actualizada' : 'Creada'}: ${pageTitle}`
          });

          this.log('success', `✅ [${completedPages}/${pages.length}] "${pageTitle}" ${isUpdate ? 'actualizada' : 'creada'} en Supabase (${blocksResult.totalBlocks} bloques) - ID: ${result.id}`);
          return true;

        } catch (error) {
          completedPages++;
          errorPages++;
          this.setProgress({
            current: completedPages,
            total: pages.length,
            currentPageTitle: `❌ Error: ${pageTitle}`
          });

          this.log('error', `❌ Error procesando/guardando "${pageTitle}": ${error instanceof Error ? error.message : 'Error desconocido'}`, error);
          return false;
        }
      };

      // Ejecutar todas las páginas en paralelo
      await Promise.all(
        pages.map((page, index) => processAndSavePage(page, index))
      );

      // Resumen final con estadísticas detalladas
      this.log('success', `🎉 Sincronización completada: ${savedPages} páginas procesadas (${operationStats.created} creadas, ${operationStats.updated} actualizadas), ${errorPages} errores`);

      this.log('success', `🎉 ¡Sincronización con Supabase completada!\n\n` +
        `✨ ${operationStats.created} páginas nuevas creadas\n` +
        `🔄 ${operationStats.updated} páginas existentes actualizadas\n` +
        `❌ ${errorPages} páginas con errores\n` +
        `📊 Total procesado: ${completedPages}/${pages.length}\n\n` +
        `🗄️ Los archivos markdown están ahora disponibles en tu base de datos de Supabase.\n` +
        `🚫 No hay duplicados: el sistema actualiza automáticamente las páginas existentes.`);

    } catch (error) {
      this.log('error', `💥 Error crítico: ${error instanceof Error ? error.message : 'Error desconocido'}`, error);
      alert(`❌ Error en la sincronización: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      this.setIsProcessing(false);
      this.setProgress(null);
    }
  }
}