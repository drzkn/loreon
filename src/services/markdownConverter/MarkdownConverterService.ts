import { Page } from '../../domain/entities/Page';
import { Block } from '../../domain/entities/Block';
import { convertBlocksToMarkdown } from '../../utils/blockToMarkdownConverter';
// import { BlocksToMarkdownConverter } from '../../utils/notionService/converters/blocksToMarkdown';

export interface MarkdownFile {
  filename: string;
  content: string;
  metadata: {
    id: string;
    title: string;
    createdTime?: string;
    lastEditedTime?: string;
    url?: string;
  };
}

export class MarkdownConverterService {
  // private blocksConverter: BlocksToMarkdownConverter;

  constructor() {
    // this.blocksConverter = new BlocksToMarkdownConverter();
  }

  /**
   * Convierte una página de Notion a Markdown
   */
  convertPageToMarkdown(page: Page): MarkdownFile {
    const title = this.extractPageTitle(page);
    const filename = this.generateFilename(title, page.id);

    // Crear contenido Markdown
    let content = '';

    // Agregar título principal
    content += `# ${title}\n\n`;

    // Agregar sección de metadatos
    content += this.generateMetadataSection(page);

    // Agregar contenido de la página (si tiene bloques)
    content += this.generatePageContent(page);

    return {
      filename,
      content,
      metadata: {
        id: page.id,
        title,
        createdTime: page.createdTime,
        lastEditedTime: page.lastEditedTime,
        url: page.url
      }
    };
  }

  /**
   * Convierte una página de Notion con sus bloques de contenido a Markdown
   */
  convertPageWithBlocksToMarkdown(page: Page, blocks: Block[]): MarkdownFile {
    const title = this.extractPageTitle(page);
    const filename = this.generateFilename(title, page.id);

    // Crear contenido Markdown
    let content = '';

    // Agregar título principal
    content += `# ${title}\n\n`;

    // Agregar sección de metadatos
    content += this.generateMetadataSection(page);

    // Agregar contenido de la página (propiedades)
    content += this.generatePagePropertiesContent(page);

    // Agregar contenido de bloques usando la función de utilidades
    if (blocks && blocks.length > 0) {
      content += '## Contenido\n\n';
      content += convertBlocksToMarkdown(blocks);
    } else {
      content += '\n*Esta página no tiene contenido de bloques.*\n\n';
    }

    return {
      filename,
      content,
      metadata: {
        id: page.id,
        title,
        createdTime: page.createdTime,
        lastEditedTime: page.lastEditedTime,
        url: page.url
      }
    };
  }

  /**
   * Convierte múltiples páginas a archivos Markdown
   */
  convertPagesToMarkdown(pages: Page[]): MarkdownFile[] {
    return pages.map(page => this.convertPageToMarkdown(page));
  }

  /**
   * Convierte múltiples páginas con sus bloques a archivos Markdown
   */
  convertPagesWithBlocksToMarkdown(pagesWithBlocks: { page: Page; blocks: Block[] }[]): MarkdownFile[] {
    return pagesWithBlocks.map(({ page, blocks }) => this.convertPageWithBlocksToMarkdown(page, blocks));
  }

  /**
   * Genera un archivo índice con todas las páginas
   */
  generateIndexFile(pages: Page[]): MarkdownFile {
    let content = '';

    content += `# Índice de Páginas Exportadas\n\n`;
    content += `> Generado el ${new Date().toLocaleString('es-ES')}\n\n`;
    content += `**Total de páginas:** ${pages.length}\n\n`;

    content += `## Lista de Páginas\n\n`;

    pages.forEach((page, index) => {
      const title = this.extractPageTitle(page);
      const filename = this.generateFilename(title, page.id);

      content += `${index + 1}. **[${title}](./${filename})**\n`;
      if (page.createdTime) {
        content += `   - Creado: ${new Date(page.createdTime).toLocaleString('es-ES')}\n`;
      }
      if (page.lastEditedTime) {
        content += `   - Modificado: ${new Date(page.lastEditedTime).toLocaleString('es-ES')}\n`;
      }
      content += `   - ID: \`${page.id}\`\n\n`;
    });

    return {
      filename: 'index.md',
      content,
      metadata: {
        id: 'index',
        title: 'Índice de Páginas Exportadas'
      }
    };
  }

  private extractPageTitle(page: Page): string {
    try {
      const properties = page.properties;
      const titleKeys = ['title', 'Title', 'Name', 'name', 'Título'];

      for (const key of titleKeys) {
        if (properties[key]) {
          const prop = properties[key] as {
            title?: { plain_text?: string; text?: { content?: string } }[];
            rich_text?: { plain_text?: string; text?: { content?: string } }[];
          };

          if (prop?.title && Array.isArray(prop.title) && prop.title.length > 0) {
            return prop.title[0]?.plain_text || prop.title[0]?.text?.content || '';
          }
          if (prop?.rich_text && Array.isArray(prop.rich_text) && prop.rich_text.length > 0) {
            return prop.rich_text[0]?.plain_text || prop.rich_text[0]?.text?.content || '';
          }
        }
      }

      return `Página ${page.id.substring(0, 8)}`;
    } catch {
      return `Página ${page.id.substring(0, 8)}`;
    }
  }

  private generateFilename(title: string, pageId: string): string {
    // Limpiar el título para usar como nombre de archivo
    const cleanTitle = title
      .replace(/[^a-zA-Z0-9\s\-_]/g, '') // Remover caracteres especiales
      .replace(/\s+/g, '-') // Reemplazar espacios con guiones
      .toLowerCase()
      .substring(0, 50); // Limitar longitud

    // Si el título queda vacío, usar el ID
    const finalTitle = cleanTitle || pageId.substring(0, 8);

    return `${finalTitle}.md`;
  }

  private generatePageContent(page: Page): string {
    return this.generatePagePropertiesContent(page) + '\n## Contenido\n\n*Para incluir el contenido de bloques, usa el método convertPageWithBlocksToMarkdown*\n\n';
  }

  /**
   * Genera la sección de metadatos de la página
   */
  private generateMetadataSection(page: Page): string {
    let content = '---\n';
    content += '## 📋 Metadatos\n\n';

    content += `**ID de la página:** \`${page.id}\`\n\n`;

    if (page.url) {
      content += `**URL:** [Ver en Notion](${page.url})\n\n`;
    }

    content += '---\n\n';

    return content;
  }

  /**
   * Genera contenido de las propiedades de la página
   */
  private generatePagePropertiesContent(page: Page): string {
    // Por ahora, agregar las propiedades como contenido
    // En el futuro, aquí se procesarían los bloques de contenido
    let content = '## Propiedades\n\n';

    try {
      const properties = page.properties;

      for (const [key, value] of Object.entries(properties)) {
        if (key !== 'title' && key !== 'Title') { // Evitar duplicar el título
          content += `### ${key}\n\n`;

          // Intentar extraer el valor de la propiedad
          const propertyValue = this.extractPropertyValue(value);
          content += `${propertyValue}\n\n`;
        }
      }
    } catch {
      content += '*Error al procesar las propiedades de la página*\n\n';
    }

    return content;
  }

  private extractPropertyValue(property: unknown): string {
    try {
      if (!property || typeof property !== 'object') {
        return '*Valor no disponible*';
      }

      const prop = property as Record<string, unknown>;

      // Rich text
      if (prop.rich_text && Array.isArray(prop.rich_text)) {
        return prop.rich_text
          .map((text: Record<string, unknown>) => (text?.plain_text as string) || (text?.text as Record<string, unknown>)?.content || '')
          .join('');
      }

      // Title
      if (prop.title && Array.isArray(prop.title)) {
        return prop.title
          .map((text: Record<string, unknown>) => (text?.plain_text as string) || (text?.text as Record<string, unknown>)?.content || '')
          .join('');
      }

      // Number
      if (prop.number !== undefined) {
        return String(prop.number);
      }

      // Select
      if (prop.select && typeof prop.select === 'object') {
        const select = prop.select as Record<string, unknown>;
        return String(select.name || '*Sin selección*');
      }

      // Multi-select
      if (prop.multi_select && Array.isArray(prop.multi_select)) {
        return prop.multi_select
          .map((item: Record<string, unknown>) => (item?.name as string) || '')
          .filter(Boolean)
          .join(', ') || '*Sin selecciones*';
      }

      // Date
      if (prop.date && typeof prop.date === 'object') {
        const date = prop.date as Record<string, unknown>;
        return String(date.start || '*Fecha no disponible*');
      }

      // Checkbox
      if (prop.checkbox !== undefined) {
        return prop.checkbox ? '✅ Sí' : '❌ No';
      }

      // URL
      if (prop.url) {
        return `[${prop.url}](${prop.url})`;
      }

      // Email
      if (prop.email) {
        return `[${prop.email}](mailto:${prop.email})`;
      }

      // Phone
      if (prop.phone_number) {
        return String(prop.phone_number);
      }

      return '*Tipo de propiedad no soportado*';
    } catch {
      return '*Error al procesar el valor*';
    }
  }
} 