import { container } from '../../../infrastructure/di/container';
import { convertBlocksToMarkdown } from '../../../utils/blockToMarkdownConverter/blockToMarkdownConverter';
import { AuthService } from '../../../services/supabase/AuthService';
import { NotionNativeRepository } from '@/adapters/output/infrastructure/supabase/NotionNativeRepository';
import { EmbeddingsService } from '../../../services/embeddings/EmbeddingsService';
import { LoggerService } from '../../../services/logger';
import { supabaseServer } from '@/adapters/output/infrastructure/supabase/SupabaseServerClient';

interface NotionRichText {
  plain_text?: string;
  type?: string;
  text?: {
    content: string;
  };
}

interface NotionTitleProperty {
  type: 'title';
  title: NotionRichText[];
}

interface NotionBlockData {
  rich_text?: NotionRichText[];
  title?: NotionRichText[];
  plainText?: string;
  data?: {
    rich_text?: NotionRichText[];
    title?: NotionRichText[];
  };
}

export class ConnectionPageRepository {
  private authService: AuthService;
  private notionRepository: NotionNativeRepository;
  private embeddingsService: EmbeddingsService;
  private logger: LoggerService;

  constructor(
    public databaseId: string,
    private setIsProcessing: (processing: boolean) => void,
    private setProgress: (progress: { current: number; total: number; currentPageTitle: string } | null) => void,
    private sendLogToStream?: (message: string) => void,
    private useServerClient: boolean = false
  ) {
    this.authService = new AuthService();
    this.notionRepository = new NotionNativeRepository(supabaseServer);
    this.embeddingsService = new EmbeddingsService();
    this.logger = new LoggerService({
      enableStream: !!this.sendLogToStream,
      streamFunction: this.sendLogToStream
    });
  }


  extractPlainTextFromBlock(block: NotionBlockData): string {
    if (block.plainText) {
      return block.plainText;
    }

    if (block.rich_text && Array.isArray(block.rich_text)) {
      return block.rich_text.map((rt: NotionRichText) => rt.plain_text || '').join('');
    }

    if (block.data?.rich_text) {
      return block.data.rich_text.map((rt: NotionRichText) => rt.plain_text || '').join('');
    }
    if (block.data?.title) {
      return block.data.title.map((rt: NotionRichText) => rt.plain_text || '').join('');
    }

    return '';
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
    this.logger.info(`🚀 Iniciando sincronización con Supabase para base de datos: ${this.databaseId}`);

    try {
      // Cuando usamos el servidor client, no necesitamos autenticación
      if (this.useServerClient) {
        this.logger.success('✅ Usando cliente del servidor (sin autenticación requerida)');
      } else {
        this.logger.info('🔐 Verificando autenticación...');
        try {
          const isAuthenticated = await this.authService.isAuthenticated();

          if (!isAuthenticated) {
            this.logger.info('🔑 No autenticado, iniciando sesión anónima...');
            await this.authService.signInAnonymously();
            this.logger.success('✅ Autenticación anónima completada');
          } else {
            this.logger.success('✅ Usuario ya autenticado');
          }
        } catch {
          this.logger.warn('⚠️ Error de autenticación, continuando sin autenticar (modo servidor)');
        }
      }

      this.logger.info('📊 Obteniendo páginas de la base de datos...');
      this.logger.info(`🎯 Database ID: ${this.databaseId}`);

      const pages = await container.queryDatabaseUseCase.execute(this.databaseId);
      this.logger.success(`📄 Encontradas ${pages.length} páginas en la base de datos`);

      // Log de las primeras páginas encontradas para debug
      if (pages.length > 0) {
        const firstPage = pages[0];
        this.logger.info(`📋 Ejemplo de página encontrada: ID=${firstPage.id}`);
        this.logger.info(`📋 Propiedades disponibles: ${Object.keys(firstPage.properties || {}).join(', ')}`);
      }

      if (pages.length === 0) {
        this.logger.warn('No se encontraron páginas en la base de datos');
        return;
      }

      this.logger.info(`🚀 Procesando y guardando ${pages.length} páginas en Supabase...`);

      let completedPages = 0;
      let errorPages = 0;
      const operationStats = { created: 0, updated: 0, embeddingsGenerated: 0, embeddingErrors: 0 };

      const processPage = async (page: { id: string; properties?: Record<string, unknown> }, index: number) => {
        try {
          const pageTitle = this.extractPageTitle(page);

          this.logger.info(`📝 Procesando página ${index + 1}/${pages.length}: "${pageTitle}"`);

          this.setProgress({
            current: index + 1,
            total: pages.length,
            currentPageTitle: pageTitle
          });

          const blockResponse = await container.getBlockChildrenRecursiveUseCase.execute(page.id, {
            maxDepth: 5,
            includeEmptyBlocks: false,
            delayBetweenRequests: 100
          });

          // Usar el sistema nuevo de Notion
          const savedPage = await this.notionRepository.savePage({
            notion_id: page.id,
            title: pageTitle,
            database_id: this.databaseId,
            properties: page.properties || {},
            raw_data: page,
            archived: false
          });

          // Guardar bloques (usando método plural)
          if (blockResponse.blocks.length > 0) {
            const blocksToSave = blockResponse.blocks.map((block, index) => ({
              notion_id: block.id,
              parent_block_id: undefined,
              type: block.type,
              content: block.data || {},
              plain_text: this.extractPlainTextFromBlock(block as NotionBlockData),
              position: index,
              has_children: block.hasChildren || false,
              notion_created_time: block.createdTime,
              notion_last_edited_time: block.lastEditedTime,
              archived: false,
              raw_data: block.toJSON()
            }));

            await this.notionRepository.saveBlocks(savedPage.notion_id, blocksToSave);
          }

          operationStats.updated++;
          const totalChars = blockResponse.blocks.reduce((sum, block) =>
            sum + (this.extractPlainTextFromBlock(block)?.length || 0), 0);
          this.logger.success(`✅ "${pageTitle}" sincronizada (${totalChars} caracteres, ${blockResponse.blocks.length} bloques)`);

          const markdownContent = convertBlocksToMarkdown(blockResponse.blocks);

          await this.generateEmbeddingForPage(savedPage, pageTitle, markdownContent, operationStats);

          completedPages++;

        } catch (error) {
          errorPages++;
          completedPages++;
          const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
          const pageTitle = this.extractPageTitle(page);
          this.logger.error(`❌ Error procesando página "${pageTitle}" (${page.id}): ${errorMessage}`, error instanceof Error ? error : undefined);

          if (error instanceof Error && error.stack) {
            this.logger.error(`🐛 Stack trace: ${error.stack.split('\n')[0]}`);
          }
        }
      };

      const batchSize = 5;
      this.logger.info(`⚙️ Procesando páginas en lotes de ${batchSize}`);

      for (let i = 0; i < pages.length; i += batchSize) {
        const batch = pages.slice(i, i + batchSize);
        const batchNumber = Math.floor(i / batchSize) + 1;
        const totalBatches = Math.ceil(pages.length / batchSize);

        this.logger.info(`📦 Procesando lote ${batchNumber}/${totalBatches} (páginas ${i + 1}-${Math.min(i + batchSize, pages.length)})`);

        await Promise.all(batch.map((page, batchIndex) => processPage(page, i + batchIndex)));

        this.logger.info(`✅ Lote ${batchNumber}/${totalBatches} completado`);
      }

      const successRate = ((completedPages - errorPages) / pages.length * 100).toFixed(1);
      const totalOperations = operationStats.created + operationStats.updated;
      const embeddingSuccessRate = operationStats.embeddingsGenerated > 0
        ? ((operationStats.embeddingsGenerated / (operationStats.embeddingsGenerated + operationStats.embeddingErrors)) * 100).toFixed(1)
        : '0';

      this.logger.info(`📊 Estadísticas de sincronización:`);
      this.logger.info(`📊 • Total de páginas procesadas: ${completedPages}/${pages.length}`);
      this.logger.info(`📊 • Tasa de éxito: ${successRate}%`);
      this.logger.info(`📊 • Operaciones exitosas: ${totalOperations}`);
      this.logger.info(`📊 • Embeddings generados: ${operationStats.embeddingsGenerated}`);
      this.logger.info(`📊 • Errores de embeddings: ${operationStats.embeddingErrors}`);
      this.logger.info(`📊 • Tasa de éxito embeddings: ${embeddingSuccessRate}%`);
      this.logger.info(`📊 • Database ID: ${this.databaseId}`);

      this.logger.success(`🎉 ¡Sincronización con Supabase completada!\n\n` +
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
      this.logger.error(`💥 Error crítico: ${error instanceof Error ? error.message : 'Error desconocido'}`, error instanceof Error ? error : undefined);
      throw error;
    } finally {
      this.setIsProcessing(false);
      this.setProgress(null);
    }
  }

  private async generateEmbeddingForPage(
    savedPage: { notion_id: string; id: string },
    pageTitle: string,
    markdownContent: string,
    operationStats: { embeddingsGenerated: number; embeddingErrors: number }
  ): Promise<void> {
    try {
      const textForEmbedding = `${pageTitle}\n\n${markdownContent}`;

      const embedding = await this.embeddingsService.generateEmbedding(textForEmbedding);

      // Usar el sistema nuevo para guardar embeddings (método plural)
      const embeddingsToSave = [{
        page_id: savedPage.notion_id,
        block_id: savedPage.notion_id, // Para página completa
        embedding: embedding,
        content_hash: Buffer.from(textForEmbedding).toString('base64'),
        chunk_index: 0,
        chunk_text: textForEmbedding.substring(0, 8000), // Límite razonable
        metadata: { type: 'page_summary', title: pageTitle }
      }];

      await this.notionRepository.saveEmbeddings(embeddingsToSave);

      operationStats.embeddingsGenerated++;

    } catch (embeddingError) {
      operationStats.embeddingErrors++;
      const errorMessage = embeddingError instanceof Error ? embeddingError.message : 'Error desconocido';
      this.logger.error(`❌ Error generando embedding para "${pageTitle}": ${errorMessage}`, embeddingError instanceof Error ? embeddingError : undefined);
    }
  }

  /**
   * Método de logging que puede enviar mensajes al stream si está disponible
   */
  log(level: 'info' | 'error' | 'warn' | 'success', message: string, error?: Error): void {
    // Si hay callback de stream, enviar el mensaje
    if (this.sendLogToStream) {
      this.sendLogToStream(message);
    }

    // Los errores siempre van también a console.error
    if (level === 'error' && error) {
      console.error(message, error);
    } else if (!this.sendLogToStream) {
      // Solo usar console.log cuando no hay stream y no es error
      console.log(message);
    }

    // Usar el logger interno para registro permanente (solo cuando no hay stream para evitar duplicados)
    if (!this.sendLogToStream) {
      switch (level) {
        case 'info':
          this.logger.info(message);
          break;
        case 'error':
          this.logger.error(message, error);
          break;
        case 'warn':
          this.logger.warn(message);
          break;
        case 'success':
          this.logger.success(message);
          break;
        default:
          this.logger.info(message);
      }
    }
  }
} 