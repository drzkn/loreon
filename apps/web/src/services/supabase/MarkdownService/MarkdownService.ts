import { MarkdownConverterService } from '@/services/markdownConverter';
import { SupabaseMarkdownRepository, MarkdownPageInsert, MarkdownPage } from '../../../adapters/output/infrastructure/supabase';
import { Page } from '@/domain/entities';

export interface SupabaseMarkdownServiceInterface {
  convertAndSavePage(page: Page, includeBlocks?: boolean): Promise<MarkdownPage>;
  convertAndSavePages(pages: Page[], includeBlocks?: boolean): Promise<MarkdownPage[]>;
  getStoredPage(notionPageId: string): Promise<MarkdownPage | null>;
  getAllStoredPages(options?: {
    limit?: number;
    offset?: number;
    orderBy?: string;
    orderDirection?: 'asc' | 'desc';
  }): Promise<MarkdownPage[]>;
  searchStoredPages(query: string, options?: {
    limit?: number;
    offset?: number;
  }): Promise<MarkdownPage[]>;
  syncPage(pageId: string): Promise<MarkdownPage>;
  deleteStoredPage(id: string): Promise<void>;
}

export class SupabaseMarkdownService implements SupabaseMarkdownServiceInterface {
  private supabaseRepository: SupabaseMarkdownRepository;
  private markdownConverter: MarkdownConverterService;

  constructor(
    supabaseRepository: SupabaseMarkdownRepository,
    markdownConverter: MarkdownConverterService
  ) {
    this.supabaseRepository = supabaseRepository;
    this.markdownConverter = markdownConverter;
  }

  async convertAndSavePage(page: Page, includeBlocks = true): Promise<MarkdownPage> {
    try {
      // Convertir la página a markdown
      const markdownResult = includeBlocks
        ? this.markdownConverter.convertPageWithBlocksToMarkdown(page, []) // Pasar array vacío de bloques por ahora
        : this.markdownConverter.convertPageToMarkdown(page);

      const markdownContent = typeof markdownResult === 'string' ? markdownResult : markdownResult.content;

      // Extraer tags de las propiedades si existen
      const tags = this.extractTagsFromPage(page);

      // Preparar datos para Supabase
      const markdownData: MarkdownPageInsert = {
        notion_page_id: page.id,
        title: this.extractPlainText(page.properties?.title) || 'Sin título',
        content: markdownContent,
        notion_url: page.url || null,
        notion_created_time: page.createdTime || null,
        notion_last_edited_time: page.lastEditedTime || null,
        tags,
        metadata: {
          page_properties: page.properties,
          include_blocks: includeBlocks,
          conversion_timestamp: new Date().toISOString()
        }
      };

      // Guardar en Supabase (upsert para actualizar si ya existe)
      return await this.supabaseRepository.upsert(markdownData);

    } catch (error) {
      throw new Error(`Error al convertir y guardar página ${page.id}: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  }

  async convertAndSavePages(pages: Page[], includeBlocks = true): Promise<MarkdownPage[]> {
    const results: MarkdownPage[] = [];
    const errors: string[] = [];

    for (const page of pages) {
      try {
        const result = await this.convertAndSavePage(page, includeBlocks);
        results.push(result);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
        errors.push(`Página ${page.id}: ${errorMessage}`);
        console.error(`Error procesando página ${page.id}:`, error);
      }
    }

    if (errors.length > 0) {
      console.warn(`Se encontraron ${errors.length} errores durante el procesamiento:`, errors);
    }

    return results;
  }

  async getStoredPage(notionPageId: string): Promise<MarkdownPage | null> {
    return await this.supabaseRepository.findByNotionPageId(notionPageId);
  }

  async getAllStoredPages(options?: {
    limit?: number;
    offset?: number;
    orderBy?: string;
    orderDirection?: 'asc' | 'desc';
  }): Promise<MarkdownPage[]> {
    return await this.supabaseRepository.findAll(options);
  }

  async searchStoredPages(query: string, options?: {
    limit?: number;
    offset?: number;
  }): Promise<MarkdownPage[]> {
    return await this.supabaseRepository.search(query, options);
  }

  async syncPage(): Promise<MarkdownPage> {
    // Esta función requeriría acceso al repositorio de Notion para obtener la página actualizada
    throw new Error('syncPage requiere implementación con repositorio de Notion');
  }

  async deleteStoredPage(id: string): Promise<void> {
    await this.supabaseRepository.delete(id);
  }

  // Métodos auxiliares privados
  private extractTagsFromPage(page: Page): string[] {
    const tags: string[] = [];

    if (page.properties) {
      Object.entries(page.properties).forEach(([, value]) => {
        // Buscar propiedades que podrían ser tags
        if (typeof value === 'object' && value !== null) {
          if ('multi_select' in value && Array.isArray(value.multi_select)) {
            value.multi_select.forEach((tag: { name?: string }) => {
              if (tag.name) tags.push(tag.name);
            });
          } else if ('select' in value && value.select && typeof value.select === 'object' && value.select !== null && 'name' in value.select) {
            tags.push(value.select.name as string);
          }
        }
      });
    }

    return tags;
  }

  private extractPlainText(property: unknown): string {
    if (!property || typeof property !== 'object') {
      return '';
    }

    const prop = property as Record<string, unknown>;

    if ('title' in prop && Array.isArray(prop.title)) {
      return prop.title
        .map((item: unknown) => {
          if (typeof item === 'object' && item !== null && 'plain_text' in item) {
            return (item as { plain_text: string }).plain_text;
          }
          return '';
        })
        .join('')
        .trim();
    }

    return '';
  }
} 