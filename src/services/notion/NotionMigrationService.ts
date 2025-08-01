import { NotionContentExtractor, NotionBlock, PageContent } from './NotionContentExtractor';
import { NotionNativeRepository, NotionPageRow, NotionBlockRow } from '@/adapters/output/infrastructure/supabase/NotionNativeRepository';
import { EmbeddingsService } from '@/services/embeddings';
import { supabase } from '@/adapters/output/infrastructure/supabase/SupabaseClient';

// Tipos para la migración
export interface MigrationResult {
  success: boolean;
  pageId?: string;
  blocksProcessed?: number;
  embeddingsGenerated?: number;
  errors?: string[];
  validationResult?: ValidationResult;
}

export interface ValidationResult {
  similarity: number;
  isValid: boolean;
  differences: string[];
  textLengthDiff: number;
}

export interface NotionPageData extends Record<string, unknown> {
  id: string;
  title: string;
  url?: string;
  parent?: {
    type: string;
    page_id?: string;
    database_id?: string;
  };
  icon?: {
    type: string;
    emoji?: string;
    file?: { url: string };
  };
  cover?: {
    type: string;
    file?: { url: string };
  };
  properties: Record<string, unknown>;
  created_time: string;
  last_edited_time: string;
  archived: boolean;
}

export interface NotionApiResponse {
  page: NotionPageData;
  blocks: NotionBlock[];
}

export class NotionMigrationService {
  private repository: NotionNativeRepository;
  private embeddingsService: EmbeddingsService;

  constructor() {
    this.repository = new NotionNativeRepository(supabase);
    this.embeddingsService = new EmbeddingsService();
  }

  /**
   * Migra una página completa de Notion al nuevo sistema JSON nativo
   */
  async migratePage(notionPageId: string): Promise<MigrationResult> {
    const errors: string[] = [];

    try {
      console.log(`🔄 Iniciando migración de página: ${notionPageId}`);

      // 1. Obtener datos desde Notion API
      const notionData = await this.fetchNotionPageWithBlocks(notionPageId);
      console.log(`📥 Obtenidos ${notionData.blocks.length} bloques de Notion`);

      // 2. Procesar y extraer contenido
      const pageContent = NotionContentExtractor.extractPageContent(notionData.blocks);
      console.log(`📝 Extraído contenido: ${pageContent.wordCount} palabras, ${pageContent.sections.length} secciones`);

      // 3. Guardar página en el nuevo formato
      const savedPage = await this.saveNotionPageStructure(notionData);
      console.log(`💾 Página guardada con ID: ${savedPage.id}`);

      // 4. Guardar bloques con jerarquía
      const savedBlocks = await this.saveNotionBlocks(savedPage.id, notionData.blocks);
      console.log(`🧱 Guardados ${savedBlocks.length} bloques`);

      // 5. Generar y guardar embeddings
      const embeddingsCount = await this.generateAndSaveEmbeddings(
        savedPage.id,
        pageContent,
        savedBlocks
      );
      console.log(`🔢 Generados ${embeddingsCount} embeddings`);

      // 6. Validación opcional (comparar con sistema legacy si existe)
      const validationResult = await this.validateMigration();

      console.log(`✅ Migración completada exitosamente para página: ${notionPageId}`);

      return {
        success: true,
        pageId: savedPage.id,
        blocksProcessed: savedBlocks.length,
        embeddingsGenerated: embeddingsCount,
        errors: errors.length > 0 ? errors : undefined,
        validationResult
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      console.error(`❌ Error en migración de página ${notionPageId}:`, error);

      errors.push(errorMessage);

      return {
        success: false,
        errors
      };
    }
  }

  /**
   * Migra múltiples páginas en lotes
   */
  async migrateMultiplePages(
    notionPageIds: string[],
    batchSize: number = 5
  ): Promise<{
    results: MigrationResult[];
    summary: {
      total: number;
      successful: number;
      failed: number;
      totalBlocks: number;
      totalEmbeddings: number;
    };
  }> {
    const results: MigrationResult[] = [];
    const total = notionPageIds.length;
    let successful = 0;
    let failed = 0;
    let totalBlocks = 0;
    let totalEmbeddings = 0;

    console.log(`🚀 Iniciando migración de ${total} páginas en lotes de ${batchSize}`);

    // Procesar en lotes para evitar sobrecargar las APIs
    for (let i = 0; i < notionPageIds.length; i += batchSize) {
      const batch = notionPageIds.slice(i, i + batchSize);
      console.log(`🔄 Procesando lote ${Math.floor(i / batchSize) + 1}/${Math.ceil(total / batchSize)}`);

      const batchResults = await Promise.allSettled(
        batch.map(pageId => this.migratePage(pageId))
      );

      for (const result of batchResults) {
        if (result.status === 'fulfilled') {
          results.push(result.value);
          if (result.value.success) {
            successful++;
            totalBlocks += result.value.blocksProcessed || 0;
            totalEmbeddings += result.value.embeddingsGenerated || 0;
          } else {
            failed++;
          }
        } else {
          failed++;
          results.push({
            success: false,
            errors: [result.reason?.message || 'Error en procesamiento de lote']
          });
        }
      }

      // Pausa entre lotes para ser amigable con las APIs
      if (i + batchSize < notionPageIds.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    console.log(`🏁 Migración completada: ${successful}/${total} exitosas`);

    return {
      results,
      summary: {
        total,
        successful,
        failed,
        totalBlocks,
        totalEmbeddings
      }
    };
  }

  /**
   * Obtiene contenido en formato específico (para compatibilidad temporal)
   */
  async getContentInFormat(
    pageId: string,
    format: 'json' | 'markdown' | 'html' | 'plain'
  ): Promise<string> {

    const pageRow = await this.repository.getPageByNotionId(pageId);
    if (!pageRow) {
      throw new Error(`Página no encontrada: ${pageId}`);
    }

    const blocks = await this.repository.getPageBlocks(pageRow.id);

    switch (format) {
      case 'json':
        return JSON.stringify({
          page: pageRow,
          blocks: blocks
        }, null, 2);

      case 'html':
        return this.generateHtmlFromBlocks(blocks);

      case 'plain':
        return this.generatePlainTextFromBlocks(blocks);

      case 'markdown':
        // Fallback temporal al sistema existente si es necesario
        return this.generateMarkdownFromBlocks(blocks);

      default:
        throw new Error(`Formato no soportado: ${format}`);
    }
  }

  /**
   * Busca contenido usando el nuevo sistema
   */
  async searchContent(
    query: string,
    options: {
      useEmbeddings?: boolean;
      limit?: number;
      threshold?: number;
    } = {}
  ): Promise<{
    textResults: NotionBlockRow[];
    embeddingResults?: Array<{ block: NotionBlockRow; similarity: number }>;
  }> {

    const { useEmbeddings = false, limit = 20, threshold = 0.7 } = options;

    // Búsqueda por texto
    const textResults = await this.repository.searchBlocks(query, limit);

    let embeddingResults;
    if (useEmbeddings) {
      // Generar embedding de la query
      const queryEmbedding = await this.embeddingsService.generateEmbedding(query);

      // Buscar embeddings similares
      const similarEmbeddings = await this.repository.searchSimilarEmbeddings(
        queryEmbedding,
        limit,
        threshold
      );

      // Enriquecer con información de bloques
      embeddingResults = await Promise.all(
        similarEmbeddings.map(async (embeddingRow) => {
          const block = await this.repository.getPageBlocks(embeddingRow.page_id);
          const matchingBlock = block.find(b => b.id === embeddingRow.block_id);
          return {
            block: matchingBlock!,
            similarity: embeddingRow.similarity
          };
        })
      );
    }

    return {
      textResults,
      embeddingResults
    };
  }

  /**
   * Obtiene estadísticas del sistema migrado
   */
  async getMigrationStats(): Promise<{
    storage: {
      totalPages: number;
      totalBlocks: number;
      totalEmbeddings: number;
      lastSync?: string;
    };
    content: {
      totalWords: number;
      averageWordsPerPage: number;
      topContentTypes: Array<{ type: string; count: number }>;
    };
  }> {

    const storage = await this.repository.getStorageStats();

    // Obtener estadísticas de contenido
    const { data: contentStats } = await supabase
      .from('notion_blocks')
      .select('type, plain_text')
      .eq('archived', false);

    const totalWords = contentStats?.reduce((sum, block) => {
      return sum + (block.plain_text?.split(/\s+/).length || 0);
    }, 0) || 0;

    const typeCount = contentStats?.reduce((acc, block) => {
      acc[block.type] = (acc[block.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};

    const topContentTypes = Object.entries(typeCount)
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      storage,
      content: {
        totalWords,
        averageWordsPerPage: storage.totalPages > 0 ? Math.round(totalWords / storage.totalPages) : 0,
        topContentTypes
      }
    };
  }

  // Métodos privados

  private async fetchNotionPageWithBlocks(pageId: string): Promise<NotionApiResponse> {
    // TODO: Implementar la llamada real a la API de Notion
    // Este método debería usar el NotionRepository existente para obtener la página y sus bloques
    // TODO: Implementar con NotionRepository existente
    throw new Error(`fetchNotionPageWithBlocks debe implementarse con tu API de Notion existente. PageId: ${pageId}`);
  }

  private async saveNotionPageStructure(notionData: NotionApiResponse): Promise<NotionPageRow> {
    const { page } = notionData;

    const pageData = {
      notion_id: page.id,
      title: this.extractPageTitle(page),
      parent_id: page.parent?.page_id || page.parent?.database_id,
      database_id: page.parent?.type === 'database_id' ? page.parent.database_id : undefined,
      url: page.url,
      icon_emoji: page.icon?.type === 'emoji' ? page.icon.emoji : undefined,
      icon_url: page.icon?.type === 'file' ? page.icon.file?.url : undefined,
      cover_url: page.cover?.type === 'file' ? page.cover.file?.url : undefined,
      notion_created_time: page.created_time,
      notion_last_edited_time: page.last_edited_time,
      archived: page.archived,
      properties: page.properties,
      raw_data: page
    };

    return await this.repository.savePage(pageData);
  }

  private async saveNotionBlocks(pageId: string, blocks: NotionBlock[]): Promise<NotionBlockRow[]> {
    const blocksData = blocks.map((block, index) => ({
      notion_id: block.id,
      parent_block_id: block.parent.type === 'block_id' ? block.parent.block_id : undefined,
      type: block.type,
      content: (block[block.type] as Record<string, unknown>) || {},
      position: index,
      has_children: block.has_children,
      notion_created_time: block.created_time,
      notion_last_edited_time: block.last_edited_time,
      archived: block.archived,
      raw_data: block as Record<string, unknown>
    }));

    return await this.repository.saveBlocks(pageId, blocksData);
  }

  private async generateAndSaveEmbeddings(
    pageId: string,
    pageContent: PageContent,
    blocks: NotionBlockRow[]
  ): Promise<number> {

    // Generar chunks de texto para embeddings
    const chunks = NotionContentExtractor.generateTextChunks(pageContent, 1000, 100);

    if (chunks.length === 0) {
      return 0;
    }

    // Generar embeddings en lotes
    const embeddings = await this.embeddingsService.generateEmbeddings(
      chunks.map(chunk => chunk.text)
    );

    // Preparar datos para guardar
    const embeddingsData = chunks.map((chunk, index) => {
      const relatedBlock = blocks.find(block =>
        chunk.metadata.blockIds.includes(block.notion_id)
      );

      return {
        block_id: relatedBlock?.id || blocks[0].id, // Fallback al primer bloque
        page_id: pageId,
        embedding: embeddings[index],
        content_hash: pageContent.contentHash,
        chunk_index: chunk.metadata.chunkIndex,
        chunk_text: chunk.text,
        metadata: {
          section: chunk.metadata.section,
          blockIds: chunk.metadata.blockIds,
          startOffset: chunk.metadata.startOffset,
          endOffset: chunk.metadata.endOffset,
          pageTitle: pageContent.sections[0]?.heading || 'Sin título'
        }
      };
    });

    await this.repository.saveEmbeddings(embeddingsData);

    return embeddings.length;
  }

  private async validateMigration(
  ): Promise<ValidationResult> {
    // Validación básica comparando con contenido esperado
    // En una implementación real, podrías comparar con el sistema legacy

    return {
      similarity: 1.0, // Placeholder
      isValid: true,
      differences: [],
      textLengthDiff: 0
    };
  }

  private extractPageTitle(page: NotionPageData): string {
    // Extraer título de las propiedades de la página
    const properties = page.properties as Record<string, Record<string, unknown>>;

    for (const prop of Object.values(properties)) {
      if (prop.type === 'title' && prop.title && Array.isArray(prop.title)) {
        return prop.title.map((t: Record<string, unknown>) => t.plain_text || '').join('');
      }
    }

    return 'Sin título';
  }

  private generateHtmlFromBlocks(blocks: NotionBlockRow[]): string {
    return blocks.map(block => block.html_content).join('\n');
  }

  private generatePlainTextFromBlocks(blocks: NotionBlockRow[]): string {
    return blocks.map(block => block.plain_text).join('\n');
  }

  private generateMarkdownFromBlocks(blocks: NotionBlockRow[]): string {
    // Conversión básica a Markdown desde los bloques
    return blocks.map(block => {
      switch (block.type) {
        case 'heading_1':
          return `# ${block.plain_text}`;
        case 'heading_2':
          return `## ${block.plain_text}`;
        case 'heading_3':
          return `### ${block.plain_text}`;
        case 'paragraph':
          return block.plain_text;
        case 'bulleted_list_item':
          return `- ${block.plain_text}`;
        case 'numbered_list_item':
          return `1. ${block.plain_text}`;
        case 'code':
          return `\`\`\`\n${block.plain_text}\n\`\`\``;
        case 'quote':
          return `> ${block.plain_text}`;
        default:
          return block.plain_text;
      }
    }).join('\n\n');
  }
} 