import { NotionContentExtractor, NotionBlock, PageContent } from './NotionContentExtractor';
import { NotionNativeRepository, NotionPageRow, NotionBlockRow } from '@/adapters/output/infrastructure/supabase/NotionNativeRepository';
import { EmbeddingsService } from '@/services/embeddings';
import { Page, Block } from '@/domain/entities';
import { supabase } from '@/adapters/output/infrastructure/supabase/SupabaseClient';

export interface NotionNativeServiceInterface {
  processAndSavePage(page: Page, blocks: Block[]): Promise<NotionPageRow>;
  processAndSavePages(pages: Array<{ page: Page; blocks: Block[] }>): Promise<NotionPageRow[]>;
  getStoredPage(notionPageId: string): Promise<NotionPageRow | null>;
  getAllStoredPages(options?: {
    limit?: number;
    offset?: number;
    orderBy?: string;
    orderDirection?: 'asc' | 'desc';
  }): Promise<NotionPageRow[]>;
  searchStoredPages(query: string, options?: {
    limit?: number;
    useEmbeddings?: boolean;
    threshold?: number;
  }): Promise<Array<NotionPageRow & { similarity?: number }>>;
  deleteStoredPage(notionId: string): Promise<void>;
  getPageWithBlocks(notionPageId: string): Promise<{
    page: NotionPageRow;
    blocks: NotionBlockRow[];
    htmlContent: string;
  } | null>;
}

export class NotionNativeService implements NotionNativeServiceInterface {
  private repository: NotionNativeRepository;
  private embeddingsService: EmbeddingsService;

  constructor() {
    this.repository = new NotionNativeRepository(supabase);
    this.embeddingsService = new EmbeddingsService();
  }

  /**
   * Procesa una página de Notion y sus bloques y los guarda en formato JSON nativo
   */
  async processAndSavePage(page: Page, blocks: Block[]): Promise<NotionPageRow> {
    try {
      console.log(`🔄 Procesando página: ${page.id}`);

      // Convertir bloques al formato esperado por NotionContentExtractor
      const notionBlocks: NotionBlock[] = blocks.map(block => this.convertToNotionBlock(block));

      // Extraer contenido con jerarquía
      const pageContent = NotionContentExtractor.extractPageContent(notionBlocks);
      console.log(`📝 Extraído contenido: ${pageContent.wordCount} palabras, ${pageContent.sections.length} secciones`);

      // Guardar página
      const savedPage = await this.savePageStructure(page);
      console.log(`💾 Página guardada con ID: ${savedPage.id}`);

      // Guardar bloques con jerarquía
      const savedBlocks = await this.savePageBlocks(savedPage.id, notionBlocks);
      console.log(`🧱 Guardados ${savedBlocks.length} bloques`);

      // Generar y guardar embeddings
      await this.generateAndSaveEmbeddings(savedPage.id, pageContent, savedBlocks);
      console.log(`🔢 Embeddings generados`);

      return savedPage;

    } catch (error) {
      throw new Error(`Error al procesar página ${page.id}: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  }

  /**
   * Procesa múltiples páginas con sus bloques
   */
  async processAndSavePages(pages: Array<{ page: Page; blocks: Block[] }>): Promise<NotionPageRow[]> {
    const results: NotionPageRow[] = [];
    const errors: string[] = [];

    console.log(`🚀 Procesando ${pages.length} páginas...`);

    for (const { page, blocks } of pages) {
      try {
        const result = await this.processAndSavePage(page, blocks);
        results.push(result);
        console.log(`✅ Completada: ${page.id}`);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
        console.error(`❌ Error en página ${page.id}:`, errorMessage);
        errors.push(`${page.id}: ${errorMessage}`);
      }

      // Pausa breve entre páginas para no sobrecargar
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log(`🏁 Proceso completado: ${results.length}/${pages.length} exitosas`);

    if (errors.length > 0) {
      console.error(`⚠️ Errores encontrados:`, errors);
    }

    return results;
  }

  /**
   * Obtiene una página almacenada por su ID de Notion
   */
  async getStoredPage(notionPageId: string): Promise<NotionPageRow | null> {
    return await this.repository.getPageByNotionId(notionPageId);
  }

  /**
   * Obtiene todas las páginas almacenadas con opciones de paginación
   */
  async getAllStoredPages(options: {
    limit?: number;
    offset?: number;
    orderBy?: string;
    orderDirection?: 'asc' | 'desc';
  } = {}): Promise<NotionPageRow[]> {
    const { limit = 100, offset = 0 } = options;

    const { data, error } = await supabase
      .from('notion_pages')
      .select('*')
      .eq('archived', false)
      .order('notion_last_edited_time', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new Error(`Error al obtener páginas: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Busca páginas usando texto o embeddings
   */
  async searchStoredPages(
    query: string,
    options: {
      limit?: number;
      useEmbeddings?: boolean;
      threshold?: number;
    } = {}
  ): Promise<Array<NotionPageRow & { similarity?: number }>> {

    const { limit = 20, useEmbeddings = false, threshold = 0.7 } = options;

    if (useEmbeddings) {
      // Búsqueda por embeddings
      const queryEmbedding = await this.embeddingsService.generateEmbedding(query);
      const embeddingResults = await this.repository.searchSimilarEmbeddings(
        queryEmbedding,
        limit,
        threshold
      );

      // Obtener páginas únicas con su mejor similarity
      const pageResults = new Map<string, { page: NotionPageRow; similarity: number }>();

      for (const embeddingRow of embeddingResults) {
        const page = await this.repository.getPageByNotionId(embeddingRow.page_id);
        if (page && (!pageResults.has(page.id) || pageResults.get(page.id)!.similarity < embeddingRow.similarity)) {
          pageResults.set(page.id, { page, similarity: embeddingRow.similarity });
        }
      }

      return Array.from(pageResults.values()).map(({ page, similarity }) => ({
        ...page,
        similarity
      }));

    } else {
      // Búsqueda por texto en bloques
      const blockResults = await this.repository.searchBlocks(query, limit);

      // Obtener páginas únicas
      const pageIds = new Set(blockResults.map(block => block.page_id));
      const pages: NotionPageRow[] = [];

      for (const pageId of pageIds) {
        const page = await supabase
          .from('notion_pages')
          .select('*')
          .eq('id', pageId)
          .single();

        if (page.data) {
          pages.push(page.data);
        }
      }

      return pages;
    }
  }

  /**
   * Elimina una página almacenada
   */
  async deleteStoredPage(notionId: string): Promise<void> {
    await this.repository.archivePages([notionId]);
  }

  /**
   * Obtiene una página con todos sus bloques y contenido HTML generado
   */
  async getPageWithBlocks(notionPageId: string): Promise<{
    page: NotionPageRow;
    blocks: NotionBlockRow[];
    htmlContent: string;
  } | null> {

    const page = await this.repository.getPageByNotionId(notionPageId);
    if (!page) {
      return null;
    }

    const blocks = await this.repository.getPageBlocksHierarchical(page.id);

    // Generar HTML desde los bloques almacenados
    const htmlContent = blocks
      .map(block => block.html_content)
      .join('\n');

    return {
      page,
      blocks,
      htmlContent
    };
  }

  // Métodos privados

  private async savePageStructure(page: Page): Promise<NotionPageRow> {
    const pageData = {
      notion_id: page.id,
      title: this.extractPageTitle(page),
      parent_id: undefined, // Se puede extraer de page.parent si está disponible
      database_id: undefined, // Se puede extraer de page.parent si es database
      url: page.url,
      notion_created_time: page.createdTime,
      notion_last_edited_time: page.lastEditedTime,
      archived: false,
      properties: page.properties || {},
      raw_data: page.toJSON()
    };

    return await this.repository.savePage(pageData);
  }

  private async savePageBlocks(pageId: string, blocks: NotionBlock[]): Promise<NotionBlockRow[]> {
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
  ): Promise<void> {

    // Generar chunks de texto para embeddings
    const chunks = NotionContentExtractor.generateTextChunks(pageContent, 1000, 100);

    if (chunks.length === 0) {
      return;
    }

    try {
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
          block_id: relatedBlock?.id || blocks[0]?.id || '',
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

    } catch (error) {
      console.error('Error generando embeddings:', error);
      // No lanzar error para no fallar todo el proceso
    }
  }

  private extractPageTitle(page: Page): string {
    // Intentar extraer título de las propiedades
    if (page.properties?.title && Array.isArray(page.properties.title)) {
      return page.properties.title
        .map((t: Record<string, unknown>) => t.plain_text || (t.text as Record<string, unknown>)?.content || '')
        .join('')
        .trim() || 'Sin título';
    }

    // Fallback genérico
    return 'Sin título';
  }

  private convertToNotionBlock(block: Block): NotionBlock {
    // Convertir Block del dominio a NotionBlock para el extractor
    return {
      object: 'block',
      id: block.id,
      parent: {
        type: 'page_id',
        page_id: '',
      },
      created_time: block.createdTime || new Date().toISOString(),
      last_edited_time: block.lastEditedTime || new Date().toISOString(),
      created_by: { object: 'user', id: '' },
      last_edited_by: { object: 'user', id: '' },
      has_children: block.hasChildren || false,
      archived: false,
      type: block.type,
      [block.type]: block.data
    } as NotionBlock;
  }
} 