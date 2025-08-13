import { supabase, supabaseServer } from '../index';
import { MarkdownPage, MarkdownPageInsert, MarkdownPageUpdate, MarkdownPageWithSimilarity } from '../types';
import { SupabaseClient } from '@supabase/supabase-js';

function formatSupabaseError(error: unknown): string {
  if (typeof error === 'object' && error !== null && 'message' in error) {
    return (error as { message: string }).message;
  }
  return String(error);
}

export interface SupabaseMarkdownRepositoryInterface {
  save(markdownData: MarkdownPageInsert): Promise<MarkdownPage>;
  findByNotionPageId(notionPageId: string): Promise<MarkdownPage | null>;
  findById(id: string): Promise<MarkdownPage | null>;
  findAll(options?: {
    limit?: number;
    offset?: number;
    orderBy?: string;
    orderDirection?: 'asc' | 'desc';
  }): Promise<MarkdownPage[]>;
  update(id: string, updateData: MarkdownPageUpdate): Promise<MarkdownPage>;
  delete(id: string): Promise<void>;
  upsert(markdownData: MarkdownPageInsert): Promise<MarkdownPage>;
  search(query: string, options?: {
    limit?: number;
    offset?: number;
  }): Promise<MarkdownPage[]>;
  searchByVector(queryEmbedding: number[], options?: {
    matchThreshold?: number;
    matchCount?: number;
  }): Promise<MarkdownPageWithSimilarity[]>;
}

export class SupabaseRepository implements SupabaseMarkdownRepositoryInterface {
  private client: SupabaseClient;

  constructor(useServerClient: boolean = false) {
    this.client = useServerClient ? supabaseServer : supabase;
  }

  async save(markdownData: MarkdownPageInsert): Promise<MarkdownPage> {
    const { data, error } = await this.client
      .from('markdown_pages')
      .insert(markdownData)
      .select()
      .single();

    if (error) {
      throw new Error(`Error al guardar página de markdown: ${formatSupabaseError(error)}`);
    }

    return data;
  }

  async findByNotionPageId(notionPageId: string): Promise<MarkdownPage | null> {
    const { data, error } = await this.client
      .from('markdown_pages')
      .select('*')
      .eq('notion_page_id', notionPageId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(`Error al buscar página por Notion ID: ${formatSupabaseError(error)}`);
    }

    return data;
  }

  async findById(id: string): Promise<MarkdownPage | null> {
    const { data, error } = await this.client
      .from('markdown_pages')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(`Error al buscar página por ID: ${formatSupabaseError(error)}`);
    }

    return data;
  }

  async findAll(options?: {
    limit?: number;
    offset?: number;
    orderBy?: string;
    orderDirection?: 'asc' | 'desc';
  }): Promise<MarkdownPage[]> {
    let query = this.client.from('markdown_pages').select('*');

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
    }

    if (options?.orderBy) {
      query = query.order(options.orderBy, {
        ascending: options.orderDirection === 'asc'
      });
    } else {
      query = query.order('created_at', { ascending: false });
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Error al obtener páginas: ${formatSupabaseError(error)}`);
    }

    return data || [];
  }

  async update(id: string, updateData: MarkdownPageUpdate): Promise<MarkdownPage> {
    const { data, error } = await this.client
      .from('markdown_pages')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Error al actualizar página: ${formatSupabaseError(error)}`);
    }

    return data;
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.client
      .from('markdown_pages')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Error al eliminar página: ${formatSupabaseError(error)}`);
    }
  }

  async upsert(markdownData: MarkdownPageInsert): Promise<MarkdownPage> {
    const existingPage = await this.findByNotionPageId(markdownData.notion_page_id);
    const isUpdate = existingPage !== null;

    const { data, error } = await this.client
      .from('markdown_pages')
      .upsert(markdownData, {
        onConflict: 'notion_page_id',
        ignoreDuplicates: false
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Error al hacer upsert de página: ${error.message}`);
    }

    if (isUpdate) {
      console.log(`🔄 Página actualizada: ${markdownData.title} (${markdownData.notion_page_id})`);
    } else {
      console.log(`✨ Página creada: ${markdownData.title} (${markdownData.notion_page_id})`);
    }

    return data;
  }

  async search(query: string, options?: {
    limit?: number;
    offset?: number;
  }): Promise<MarkdownPage[]> {
    let supabaseQuery = this.client
      .from('markdown_pages')
      .select('*')
      .or(`title.ilike.%${query}%,content.ilike.%${query}%`);

    if (options?.limit) {
      supabaseQuery = supabaseQuery.limit(options.limit);
    }

    if (options?.offset) {
      supabaseQuery = supabaseQuery.range(
        options.offset,
        options.offset + (options.limit || 10) - 1
      );
    }

    supabaseQuery = supabaseQuery.order('created_at', { ascending: false });

    const { data, error } = await supabaseQuery;

    if (error) {
      throw new Error(`Error al buscar páginas: ${formatSupabaseError(error)}`);
    }

    return data || [];
  }

  async searchByVector(queryEmbedding: number[], options?: {
    matchThreshold?: number;
    matchCount?: number;
  }): Promise<MarkdownPageWithSimilarity[]> {
    const matchThreshold = options?.matchThreshold || 0.6; // Threshold optimizado por defecto
    const matchCount = options?.matchCount || 5;

    const { data, error } = await this.client.rpc('match_documents', {
      query_embedding: queryEmbedding,
      match_threshold: matchThreshold,
      match_count: matchCount
    });

    if (error) {
      throw new Error(`Error en búsqueda vectorial: ${formatSupabaseError(error)}`);
    }

    return data || [];
  }
} 