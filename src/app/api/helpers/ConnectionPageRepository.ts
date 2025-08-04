import { container } from '../../../infrastructure/di/container';
import { convertBlocksToMarkdown } from '../../../utils/blockToMarkdownConverter/blockToMarkdownConverter';
import { AuthService } from '../../../services/supabase/AuthService';
import { SupabaseMarkdownRepository } from '../../../adapters/output/infrastructure/supabase';
import { EmbeddingsService } from '../../../services/embeddings/EmbeddingsService';

interface NotionRichText {
  plain_text?: string;
}

interface NotionTitleProperty {
  type: 'title';
  title: NotionRichText[];
}

export class ConnectionPageRepository {
  private authService: AuthService;
  private markdownRepository: SupabaseMarkdownRepository;
  private embeddingsService: EmbeddingsService;

  constructor(
    public databaseId: string,
    private setIsProcessing: (processing: boolean) => void,
    private setProgress: (progress: { current: number; total: number; currentPageTitle: string } | null) => void,
    private sendLogToStream?: (message: string) => void
  ) {
    this.authService = new AuthService();
    this.markdownRepository = new SupabaseMarkdownRepository();
    this.embeddingsService = new EmbeddingsService();
  }

  log(type: 'info' | 'success' | 'error' | 'warn', message: string, error?: unknown) {
    if (this.sendLogToStream) {
      this.sendLogToStream(message);
    }

    if (type === 'error') {
      console.error(message, error);
    } else {
      console.log(message);
    }
  }

  extractPageTitle(pageData: { properties?: Record<string, unknown> }): string {
    if (!pageData.properties) return 'Sin título';

    // Buscar propiedades tipo title
    const titleProp = Object.values(pageData.properties).find((prop): prop is NotionTitleProperty =>
      typeof prop === 'object' && prop !== null && 'type' in prop && prop.type === 'title'
    );

    if (titleProp?.title && titleProp.title.length > 0) {
      return titleProp.title.map((t) => t.plain_text || '').join('');
    }

    return 'Sin título';
  }

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
      this.log('info', `🎯 Database ID: ${this.databaseId}`);

      const pages = await container.queryDatabaseUseCase.execute(this.databaseId);
      this.log('success', `📄 Encontradas ${pages.length} páginas en la base de datos`);

      // Log de las primeras páginas encontradas para debug
      if (pages.length > 0) {
        const firstPage = pages[0];
        this.log('info', `📋 Ejemplo de página encontrada: ID=${firstPage.id}`);
        this.log('info', `📋 Propiedades disponibles: ${Object.keys(firstPage.properties || {}).join(', ')}`);
      }

      if (pages.length === 0) {
        this.log('warn', 'No se encontraron páginas en la base de datos');
        return;
      }

      // Paso 2: Procesar y guardar cada página en paralelo
      this.log('info', `🚀 Procesando y guardando ${pages.length} páginas en Supabase...`);

      let completedPages = 0;
      let errorPages = 0;
      const operationStats = { created: 0, updated: 0, embeddingsGenerated: 0, embeddingErrors: 0 };

      const processPage = async (page: { id: string; properties?: Record<string, unknown> }, index: number) => {
        try {
          const pageTitle = this.extractPageTitle(page);

          this.log('info', `📝 Procesando página ${index + 1}/${pages.length}: "${pageTitle}" (ID: ${page.id})`);

          this.setProgress({
            current: index + 1,
            total: pages.length,
            currentPageTitle: pageTitle
          });

          // Obtener bloques recursivos de la página
          this.log('info', `🧱 Obteniendo bloques para: "${pageTitle}"`);
          const blockResponse = await container.getBlockChildrenRecursiveUseCase.execute(page.id, {
            maxDepth: 5,
            includeEmptyBlocks: false,
            delayBetweenRequests: 100
          });

          this.log('info', `🧱 Bloques obtenidos: ${blockResponse.blocks.length} bloques, profundidad máxima: ${blockResponse.maxDepthReached}, ${blockResponse.apiCallsCount} llamadas API`);

          // Convertir bloques a markdown
          this.log('info', `📝 Convirtiendo bloques a markdown para: "${pageTitle}"`);
          const markdownContent = convertBlocksToMarkdown(blockResponse.blocks);
          const markdownLength = markdownContent.length;
          this.log('info', `📝 Markdown generado: ${markdownLength} caracteres`);

          // Verificar si la página ya existe
          this.log('info', `🔍 Verificando si la página ya existe en Supabase: "${pageTitle}"`);
          const existingPage = await this.markdownRepository.findByNotionPageId(page.id);

          let savedPage;
          if (existingPage) {
            // Actualizar página existente
            this.log('info', `🔄 Página existente encontrada, actualizando: "${pageTitle}" (Supabase ID: ${existingPage.id})`);
            const updateData = {
              title: pageTitle,
              content: markdownContent,
              notion_page_id: page.id,
              updated_at: new Date().toISOString()
            };
            this.log('info', `💾 Datos de actualización preparados: ${Object.keys(updateData).join(', ')}`);

            savedPage = await this.markdownRepository.update(existingPage.id, updateData);
            operationStats.updated++;
            this.log('success', `✅ Página "${pageTitle}" actualizada exitosamente`);
          } else {
            // Crear nueva página
            this.log('info', `🆕 Página nueva, creando entrada en Supabase: "${pageTitle}"`);
            const saveData = {
              title: pageTitle,
              content: markdownContent,
              notion_page_id: page.id,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            };
            this.log('info', `💾 Datos de creación preparados: ${Object.keys(saveData).join(', ')}`);

            savedPage = await this.markdownRepository.save(saveData);
            operationStats.created++;
            this.log('success', `✅ Página "${pageTitle}" creada exitosamente (Supabase ID: ${savedPage.id})`);
          }

          // Generar embedding automáticamente
          await this.generateEmbeddingForPage(savedPage, pageTitle, markdownContent, operationStats);

          completedPages++;

        } catch (error) {
          errorPages++;
          completedPages++;
          const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
          const pageTitle = this.extractPageTitle(page);
          this.log('error', `❌ Error procesando página "${pageTitle}" (${page.id}): ${errorMessage}`, error);

          // Log detalles adicionales del error si está disponible
          if (error instanceof Error && error.stack) {
            this.log('error', `🐛 Stack trace: ${error.stack.split('\n')[0]}`);
          }
        }
      };

      // Procesar páginas en lotes para evitar sobrecargar la API
      const batchSize = 5;
      this.log('info', `⚙️ Procesando páginas en lotes de ${batchSize}`);

      for (let i = 0; i < pages.length; i += batchSize) {
        const batch = pages.slice(i, i + batchSize);
        const batchNumber = Math.floor(i / batchSize) + 1;
        const totalBatches = Math.ceil(pages.length / batchSize);

        this.log('info', `📦 Procesando lote ${batchNumber}/${totalBatches} (páginas ${i + 1}-${Math.min(i + batchSize, pages.length)})`);

        await Promise.all(batch.map((page, batchIndex) => processPage(page, i + batchIndex)));

        this.log('info', `✅ Lote ${batchNumber}/${totalBatches} completado`);
      }

      // Estadísticas finales detalladas
      const successRate = ((completedPages - errorPages) / pages.length * 100).toFixed(1);
      const totalOperations = operationStats.created + operationStats.updated;
      const embeddingSuccessRate = operationStats.embeddingsGenerated > 0
        ? ((operationStats.embeddingsGenerated / (operationStats.embeddingsGenerated + operationStats.embeddingErrors)) * 100).toFixed(1)
        : '0';

      this.log('info', `📊 Estadísticas de sincronización:`);
      this.log('info', `📊 • Total de páginas procesadas: ${completedPages}/${pages.length}`);
      this.log('info', `📊 • Tasa de éxito: ${successRate}%`);
      this.log('info', `📊 • Operaciones exitosas: ${totalOperations}`);
      this.log('info', `📊 • Embeddings generados: ${operationStats.embeddingsGenerated}`);
      this.log('info', `📊 • Errores de embeddings: ${operationStats.embeddingErrors}`);
      this.log('info', `📊 • Tasa de éxito embeddings: ${embeddingSuccessRate}%`);
      this.log('info', `📊 • Database ID: ${this.databaseId}`);

      this.log('success', `🎉 ¡Sincronización con Supabase completada!\n\n` +
        `✨ ${operationStats.created} páginas nuevas creadas\n` +
        `🔄 ${operationStats.updated} páginas existentes actualizadas\n` +
        `🧠 ${operationStats.embeddingsGenerated} embeddings generados\n` +
        `❌ ${errorPages} páginas con errores\n` +
        `⚠️ ${operationStats.embeddingErrors} errores de embeddings\n` +
        `📊 Total procesado: ${completedPages}/${pages.length} (${successRate}% éxito)\n\n` +
        `🗄️ Los archivos markdown están ahora disponibles en tu base de datos de Supabase.\n` +
        `🔍 Los embeddings permiten búsqueda vectorial inteligente.\n` +
        `🚫 No hay duplicados: el sistema actualiza automáticamente las páginas existentes.`);

    } catch (error) {
      this.log('error', `💥 Error crítico: ${error instanceof Error ? error.message : 'Error desconocido'}`, error);
      throw error;
    } finally {
      this.setIsProcessing(false);
      this.setProgress(null);
    }
  }

  private async generateEmbeddingForPage(
    savedPage: { id: string },
    pageTitle: string,
    markdownContent: string,
    operationStats: { embeddingsGenerated: number; embeddingErrors: number }
  ): Promise<void> {
    try {
      this.log('info', `🧠 Generando embedding para: "${pageTitle}"`);

      // Preparar texto para embedding: título + contenido
      const textForEmbedding = `${pageTitle}\n\n${markdownContent}`;

      // Generar embedding
      const embedding = await this.embeddingsService.generateEmbedding(textForEmbedding);

      // Actualizar la página con el embedding
      await this.markdownRepository.update(savedPage.id, {
        embedding: embedding,
        updated_at: new Date().toISOString()
      });

      operationStats.embeddingsGenerated++;
      this.log('success', `✅ Embedding generado para "${pageTitle}" (${embedding.length} dimensiones)`);

    } catch (embeddingError) {
      operationStats.embeddingErrors++;
      const errorMessage = embeddingError instanceof Error ? embeddingError.message : 'Error desconocido';
      this.log('error', `❌ Error generando embedding para "${pageTitle}": ${errorMessage}`, embeddingError);

      // No fallar toda la sincronización por un error de embedding
      this.log('warn', `⚠️ Continuando sin embedding para "${pageTitle}"`);
    }
  }
} 