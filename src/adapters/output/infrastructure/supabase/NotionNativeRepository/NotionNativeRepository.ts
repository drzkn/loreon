import { SupabaseClient } from '@supabase/supabase-js';

// Tipos para la base de datos
export interface NotionPageRow {
  id: string;
  notion_id: string;
  title: string;
  parent_id?: string;
  database_id?: string;
  url?: string;
  icon_emoji?: string;
  icon_url?: string;
  cover_url?: string;
  created_at: string;
  updated_at: string;
  notion_created_time?: string;
  notion_last_edited_time?: string;
  archived: boolean;
  properties: Record<string, unknown>;
  raw_data: Record<string, unknown>;
}

export interface NotionBlockRow {
  id: string;
  notion_id: string;
  page_id: string;
  parent_block_id?: string;
  type: string;
  content: Record<string, unknown>;
  plain_text: string;
  html_content: string;
  hierarchy_path?: string;
  position: number;
  has_children: boolean;
  created_at: string;
  updated_at: string;
  notion_created_time?: string;
  notion_last_edited_time?: string;
  archived: boolean;
  raw_data: Record<string, unknown>;
}

export interface NotionEmbeddingRow {
  id: string;
  block_id: string;
  page_id: string;
  embedding: number[];
  content_hash: string;
  chunk_index: number;
  chunk_text: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface HierarchicalBlock extends NotionBlockRow {
  depth: number;
  path_array: number[];
}

export interface SyncLogRow {
  id: string;
  sync_type: 'full' | 'incremental' | 'page' | 'block';
  status: 'pending' | 'running' | 'completed' | 'failed';
  started_at: string;
  completed_at?: string;
  pages_processed: number;
  blocks_processed: number;
  embeddings_generated: number;
  errors?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export class NotionNativeRepository {
  constructor(private supabase: SupabaseClient) { }

  // ===== PÁGINAS =====

  /**
   * Guarda o actualiza una página de Notion
   */
  async savePage(pageData: {
    notion_id: string;
    title: string;
    parent_id?: string;
    database_id?: string;
    url?: string;
    icon_emoji?: string;
    icon_url?: string;
    cover_url?: string;
    notion_created_time?: string;
    notion_last_edited_time?: string;
    archived?: boolean;
    properties: Record<string, unknown>;
    raw_data: Record<string, unknown>;
  }): Promise<NotionPageRow> {
    const { data, error } = await this.supabase
      .from('notion_pages')
      .upsert({
        notion_id: pageData.notion_id,
        title: pageData.title,
        parent_id: pageData.parent_id,
        database_id: pageData.database_id,
        url: pageData.url,
        icon_emoji: pageData.icon_emoji,
        icon_url: pageData.icon_url,
        cover_url: pageData.cover_url,
        notion_created_time: pageData.notion_created_time,
        notion_last_edited_time: pageData.notion_last_edited_time,
        archived: pageData.archived || false,
        properties: pageData.properties,
        raw_data: pageData.raw_data
      }, {
        onConflict: 'notion_id'
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving page:', error);
      throw new Error(`Failed to save page: ${error.message}`);
    }

    return data;
  }

  /**
   * Obtiene una página por su ID de Notion
   */
  async getPageByNotionId(notionId: string): Promise<NotionPageRow | null> {
    const { data, error } = await this.supabase
      .from('notion_pages')
      .select('*')
      .eq('notion_id', notionId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // No encontrado
      }
      console.error('Error getting page:', error);
      throw new Error(`Failed to get page: ${error.message}`);
    }

    return data;
  }

  /**
   * Obtiene páginas por database ID
   */
  async getPagesByDatabaseId(databaseId: string): Promise<NotionPageRow[]> {
    const { data, error } = await this.supabase
      .from('notion_pages')
      .select('*')
      .eq('database_id', databaseId)
      .eq('archived', false)
      .order('notion_last_edited_time', { ascending: false });

    if (error) {
      console.error('Error getting pages by database:', error);
      throw new Error(`Failed to get pages: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Busca páginas modificadas después de una fecha
   */
  async getModifiedPagesSince(timestamp: string): Promise<NotionPageRow[]> {
    const { data, error } = await this.supabase
      .from('notion_pages')
      .select('*')
      .gt('notion_last_edited_time', timestamp)
      .eq('archived', false)
      .order('notion_last_edited_time', { ascending: false });

    if (error) {
      console.error('Error getting modified pages:', error);
      throw new Error(`Failed to get modified pages: ${error.message}`);
    }

    return data || [];
  }

  // ===== BLOQUES =====

  /**
   * Guarda múltiples bloques de una página
   */
  async saveBlocks(pageId: string, blocks: Array<{
    notion_id: string;
    parent_block_id?: string;
    type: string;
    content: Record<string, unknown>;
    position: number;
    has_children: boolean;
    notion_created_time?: string;
    notion_last_edited_time?: string;
    archived?: boolean;
    raw_data: Record<string, unknown>;
  }>): Promise<NotionBlockRow[]> {
    // Primero eliminar bloques existentes de la página
    await this.deletePageBlocks(pageId);

    // Insertar nuevos bloques
    const blocksToInsert = blocks.map(block => ({
      notion_id: block.notion_id,
      page_id: pageId,
      parent_block_id: block.parent_block_id,
      type: block.type,
      content: block.content,
      position: block.position,
      has_children: block.has_children,
      notion_created_time: block.notion_created_time,
      notion_last_edited_time: block.notion_last_edited_time,
      archived: block.archived || false,
      raw_data: block.raw_data
    }));

    const { data, error } = await this.supabase
      .from('notion_blocks')
      .insert(blocksToInsert)
      .select();

    if (error) {
      console.error('Error saving blocks:', error);
      throw new Error(`Failed to save blocks: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Obtiene bloques de una página con jerarquía
   */
  async getPageBlocksHierarchical(pageId: string): Promise<HierarchicalBlock[]> {
    const { data, error } = await this.supabase
      .rpc('get_hierarchical_blocks', { page_uuid: pageId });

    if (error) {
      console.error('Error getting hierarchical blocks:', error);
      throw new Error(`Failed to get blocks: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Obtiene bloques de una página ordenados por posición
   */
  async getPageBlocks(pageId: string): Promise<NotionBlockRow[]> {
    const { data, error } = await this.supabase
      .from('notion_blocks')
      .select('*')
      .eq('page_id', pageId)
      .eq('archived', false)
      .order('position', { ascending: true });

    if (error) {
      console.error('Error getting page blocks:', error);
      throw new Error(`Failed to get blocks: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Elimina todos los bloques de una página
   */
  async deletePageBlocks(pageId: string): Promise<void> {
    const { error } = await this.supabase
      .from('notion_blocks')
      .delete()
      .eq('page_id', pageId);

    if (error) {
      console.error('Error deleting page blocks:', error);
      throw new Error(`Failed to delete blocks: ${error.message}`);
    }
  }

  /**
   * Busca en el contenido de texto de los bloques
   */
  async searchBlocks(query: string, limit: number = 50): Promise<NotionBlockRow[]> {
    const { data, error } = await this.supabase
      .from('notion_blocks')
      .select(`
        *,
        notion_pages (
          title,
          url
        )
      `)
      .textSearch('plain_text', query, {
        type: 'websearch',
        config: 'spanish'
      })
      .eq('archived', false)
      .limit(limit);

    if (error) {
      console.error('Error searching blocks:', error);
      throw new Error(`Failed to search blocks: ${error.message}`);
    }

    return data || [];
  }

  // ===== EMBEDDINGS =====

  /**
   * Guarda embeddings para un bloque
   */
  async saveEmbeddings(embeddings: Array<{
    block_id: string;
    page_id: string;
    embedding: number[];
    content_hash: string;
    chunk_index: number;
    chunk_text: string;
    metadata: Record<string, unknown>;
  }>): Promise<NotionEmbeddingRow[]> {
    const { data, error } = await this.supabase
      .from('notion_embeddings')
      .insert(embeddings)
      .select();

    if (error) {
      console.error('Error saving embeddings:', error);
      throw new Error(`Failed to save embeddings: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Elimina embeddings por hash de contenido (para actualizaciones)
   */
  async deleteEmbeddingsByContentHash(contentHash: string): Promise<void> {
    const { error } = await this.supabase
      .from('notion_embeddings')
      .delete()
      .eq('content_hash', contentHash);

    if (error) {
      console.error('Error deleting embeddings:', error);
      throw new Error(`Failed to delete embeddings: ${error.message}`);
    }
  }

  /**
   * Elimina embeddings de una página
   */
  async deletePageEmbeddings(pageId: string): Promise<void> {
    const { error } = await this.supabase
      .from('notion_embeddings')
      .delete()
      .eq('page_id', pageId);

    if (error) {
      console.error('Error deleting page embeddings:', error);
      throw new Error(`Failed to delete embeddings: ${error.message}`);
    }
  }

  /**
   * Busca embeddings similares usando cosine similarity
   */
  async searchSimilarEmbeddings(
    queryEmbedding: number[],
    limit: number = 20,
    threshold: number = 0.7
  ): Promise<Array<NotionEmbeddingRow & { similarity: number }>> {
    const { data, error } = await this.supabase.rpc('match_embeddings', {
      query_embedding: queryEmbedding,
      match_threshold: threshold,
      match_count: limit
    });

    if (error) {
      console.error('Error searching embeddings:', error);
      throw new Error(`Failed to search embeddings: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Busca por vector y retorna resultados en formato compatible con Chat API
   */
  async searchByVector(queryEmbedding: number[], options?: {
    matchThreshold?: number;
    matchCount?: number;
  }): Promise<Array<{
    id: string;
    title: string;
    content: string;
    similarity: number;
    notion_url?: string | null;
    chunk_text?: string;
    section?: string;
  }>> {
    const matchThreshold = options?.matchThreshold || 0.78;
    const matchCount = options?.matchCount || 5;

    // Obtener embeddings similares
    const embeddings = await this.searchSimilarEmbeddings(
      queryEmbedding,
      matchCount,
      matchThreshold
    );

    if (embeddings.length === 0) {
      return [];
    }

    // Obtener páginas únicas agrupadas por similitud máxima
    const pageResults = new Map<string, {
      page: NotionPageRow;
      maxSimilarity: number;
      chunks: Array<{ text: string; similarity: number; section?: string }>;
    }>();

    for (const embedding of embeddings) {
      // Obtener información de la página (page_id es el UUID interno, no el notion_id)
      const { data: page, error } = await this.supabase
        .from('notion_pages')
        .select('*')
        .eq('id', embedding.page_id)
        .single();

      if (error || !page || page.archived) continue;

      const section = embedding.metadata?.section as string | undefined;
      const chunkInfo = {
        text: embedding.chunk_text,
        similarity: embedding.similarity,
        section
      };

      if (!pageResults.has(embedding.page_id)) {
        pageResults.set(embedding.page_id, {
          page,
          maxSimilarity: embedding.similarity,
          chunks: [chunkInfo]
        });
      } else {
        const existing = pageResults.get(embedding.page_id)!;
        existing.chunks.push(chunkInfo);
        if (embedding.similarity > existing.maxSimilarity) {
          existing.maxSimilarity = embedding.similarity;
        }
      }
    }

    // Transformar a formato compatible con Chat API
    const results = Array.from(pageResults.values())
      .sort((a, b) => b.maxSimilarity - a.maxSimilarity)
      .map(({ page, maxSimilarity, chunks }) => {
        // Combinar chunks relevantes de la misma página
        const content = chunks
          .filter(chunk => chunk.similarity >= matchThreshold * 0.8) // Solo chunks relevantes
          .sort((a, b) => b.similarity - a.similarity)
          .map(chunk => chunk.section ? `**${chunk.section}**\n${chunk.text}` : chunk.text)
          .join('\n\n');

        const bestChunk = chunks[0];

        return {
          id: page.id,
          title: page.title,
          content: content || bestChunk.text,
          similarity: maxSimilarity,
          notion_url: page.url,
          chunk_text: bestChunk.text,
          section: bestChunk.section
        };
      });

    return results;
  }

  // ===== SINCRONIZACIÓN =====

  /**
   * Crea un nuevo log de sincronización
   */
  async createSyncLog(syncType: SyncLogRow['sync_type'], metadata?: Record<string, unknown>): Promise<SyncLogRow> {
    const { data, error } = await this.supabase
      .from('notion_sync_log')
      .insert({
        sync_type: syncType,
        status: 'pending',
        pages_processed: 0,
        blocks_processed: 0,
        embeddings_generated: 0,
        metadata
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating sync log:', error);
      throw new Error(`Failed to create sync log: ${error.message}`);
    }

    return data;
  }

  /**
   * Actualiza el progreso de sincronización
   */
  async updateSyncLog(
    syncId: string,
    updates: {
      status?: SyncLogRow['status'];
      pages_processed?: number;
      blocks_processed?: number;
      embeddings_generated?: number;
      errors?: Record<string, unknown>;
      completed_at?: string;
    }
  ): Promise<void> {
    const { error } = await this.supabase
      .from('notion_sync_log')
      .update({
        ...updates,
        ...(updates.status === 'completed' ? { completed_at: new Date().toISOString() } : {})
      })
      .eq('id', syncId);

    if (error) {
      console.error('Error updating sync log:', error);
      throw new Error(`Failed to update sync log: ${error.message}`);
    }
  }

  /**
   * Obtiene estadísticas de almacenamiento
   */
  async getStorageStats(): Promise<{
    totalPages: number;
    totalBlocks: number;
    totalEmbeddings: number;
    lastSync?: string;
  }> {
    const [pagesCount, blocksCount, embeddingsCount, lastSyncData] = await Promise.all([
      this.supabase.from('notion_pages').select('id', { count: 'exact', head: true }),
      this.supabase.from('notion_blocks').select('id', { count: 'exact', head: true }),
      this.supabase.from('notion_embeddings').select('id', { count: 'exact', head: true }),
      this.supabase
        .from('notion_sync_log')
        .select('completed_at')
        .eq('status', 'completed')
        .order('completed_at', { ascending: false })
        .limit(1)
        .maybeSingle()
    ]);

    return {
      totalPages: pagesCount.count || 0,
      totalBlocks: blocksCount.count || 0,
      totalEmbeddings: embeddingsCount.count || 0,
      lastSync: lastSyncData.data?.completed_at
    };
  }

  /**
   * Marca páginas como archivadas (soft delete)
   */
  async archivePages(notionIds: string[]): Promise<void> {
    const { error } = await this.supabase
      .from('notion_pages')
      .update({ archived: true })
      .in('notion_id', notionIds);

    if (error) {
      console.error('Error archiving pages:', error);
      throw new Error(`Failed to archive pages: ${error.message}`);
    }
  }

  /**
   * Obtiene páginas no actualizadas recientemente (posibles eliminadas)
   */
  async getStalePages(olderThan: string): Promise<NotionPageRow[]> {
    const { data, error } = await this.supabase
      .from('notion_pages')
      .select('*')
      .lt('notion_last_edited_time', olderThan)
      .eq('archived', false);

    if (error) {
      console.error('Error getting stale pages:', error);
      throw new Error(`Failed to get stale pages: ${error.message}`);
    }

    return data || [];
  }
} 