// Use Web Crypto API for edge compatibility

// Tipos base para los datos de Notion
export interface NotionRichText {
  type: 'text' | 'mention' | 'equation';
  text?: {
    content: string;
    link?: { url: string } | null;
  };
  mention?: Record<string, unknown>;
  equation?: { expression: string };
  annotations: {
    bold: boolean;
    italic: boolean;
    strikethrough: boolean;
    underline: boolean;
    code: boolean;
    color: string;
  };
  plain_text: string;
  href?: string | null;
}

export interface NotionBlock {
  object: 'block';
  id: string;
  parent: {
    type: 'page_id' | 'block_id' | 'workspace';
    page_id?: string;
    block_id?: string;
  };
  created_time: string;
  last_edited_time: string;
  created_by: { object: 'user'; id: string };
  last_edited_by: { object: 'user'; id: string };
  has_children: boolean;
  archived: boolean;
  type: string;
  [key: string]: unknown; // Para contenido específico del tipo de bloque
}

interface NotionBlockContent {
  rich_text?: NotionRichText[];
  text?: NotionRichText[];
  title?: NotionRichText[];
  language?: string;
  checked?: boolean;
  icon?: { emoji?: string };
  cells?: NotionRichText[][];
  url?: string;
  caption?: NotionRichText[];
  external?: { url: string };
  file?: { url: string };
  expression?: string;
}

export interface ExtractedContent {
  plainText: string;
  htmlContent: string;
  contentHash: string;
  metadata: {
    type: string;
    level?: number;
    listType?: 'bulleted' | 'numbered';
    hasFormatting: boolean;
    wordCount: number;
    characterCount: number;
  };
}

export interface PageContent {
  fullText: string;
  htmlStructure: string;
  sections: PageSection[];
  contentHash: string;
  wordCount: number;
  characterCount: number;
}

export interface PageSection {
  id: string;
  heading: string;
  content: string;
  htmlContent: string;
  level: number;
  blockIds: string[];
  subsections: PageSection[];
}

interface TextChunk {
  text: string;
  metadata: {
    chunkIndex: number;
    section?: string;
    blockIds: string[];
    startOffset: number;
    endOffset: number;
  };
}

export class NotionContentExtractor {

  /**
   * Extrae contenido de un bloque individual de Notion
   */
  static extractContent(block: NotionBlock): ExtractedContent {
    const { type } = block;
    const blockContent = block[type] as NotionBlockContent;

    if (!blockContent) {
      return this.createEmptyContent(type);
    }

    switch (type) {
      case 'paragraph':
        return this.extractRichText(blockContent.rich_text || [], 'paragraph');

      case 'heading_1':
      case 'heading_2':
      case 'heading_3':
        const level = parseInt(type.split('_')[1]);
        return this.extractRichText(blockContent.rich_text || [], 'heading', level);

      case 'bulleted_list_item':
      case 'numbered_list_item':
        return this.extractListItem(blockContent.rich_text || [], type);

      case 'code':
        return this.extractCode(blockContent);

      case 'quote':
        return this.extractRichText(blockContent.rich_text || [], 'quote');

      case 'callout':
        return this.extractCallout(blockContent);

      case 'table_row':
        return this.extractTableRow(blockContent);

      case 'toggle':
        return this.extractRichText(blockContent.rich_text || [], 'toggle');

      case 'to_do':
        return this.extractToDo(blockContent);

      case 'divider':
        return this.extractDivider();

      case 'image':
      case 'video':
      case 'file':
        return this.extractMedia(blockContent, type);

      case 'bookmark':
      case 'link_preview':
        return this.extractBookmark(blockContent);

      case 'equation':
        return this.extractEquation(blockContent);

      default:
        console.warn(`Tipo de bloque no soportado: ${type}`);
        return this.extractFallback(block);
    }
  }

  /**
   * Extrae rich text y lo convierte a texto plano y HTML
   */
  private static extractRichText(
    richText: NotionRichText[],
    containerType: string,
    level?: number
  ): ExtractedContent {

    let plainText = '';
    let htmlContent = '';
    let hasFormatting = false;

    for (const textObj of richText || []) {
      const text = textObj.plain_text || '';
      plainText += text;

      // Construir HTML con formato
      let wrappedText = this.escapeHtml(text);

      if (textObj.annotations) {
        const { bold, italic, strikethrough, underline, code, color } = textObj.annotations;

        if (code) {
          wrappedText = `<code>${wrappedText}</code>`;
          hasFormatting = true;
        }
        if (bold) {
          wrappedText = `<strong>${wrappedText}</strong>`;
          hasFormatting = true;
        }
        if (italic) {
          wrappedText = `<em>${wrappedText}</em>`;
          hasFormatting = true;
        }
        if (strikethrough) {
          wrappedText = `<del>${wrappedText}</del>`;
          hasFormatting = true;
        }
        if (underline) {
          wrappedText = `<u>${wrappedText}</u>`;
          hasFormatting = true;
        }
        if (color && color !== 'default') {
          wrappedText = `<span class="notion-${color}">${wrappedText}</span>`;
          hasFormatting = true;
        }
      }

      if (textObj.href) {
        wrappedText = `<a href="${this.escapeHtml(textObj.href)}" target="_blank" rel="noopener noreferrer">${wrappedText}</a>`;
        hasFormatting = true;
      }

      htmlContent += wrappedText;
    }

    // Envolver en contenedor apropiado
    htmlContent = this.wrapInContainer(htmlContent, containerType, level);

    return this.createExtractedContent(plainText, htmlContent, containerType, hasFormatting, level);
  }

  /**
   * Extrae contenido de elementos de lista
   */
  private static extractListItem(richText: NotionRichText[], type: string): ExtractedContent {
    const content = this.extractRichText(richText, 'list_item');
    const listType = type.includes('bulleted') ? 'bulleted' : 'numbered';

    return {
      ...content,
      htmlContent: `<li>${content.plainText}</li>`,
      metadata: {
        ...content.metadata,
        listType
      }
    };
  }

  /**
   * Extrae contenido de bloques de código
   */
  private static extractCode(blockContent: NotionBlockContent): ExtractedContent {
    const code = blockContent.rich_text?.map((t: NotionRichText) => t.plain_text).join('') || '';
    const language = blockContent.language || 'text';

    const htmlContent = `<pre><code class="language-${language}">${this.escapeHtml(code)}</code></pre>`;

    return this.createExtractedContent(code, htmlContent, 'code', true);
  }

  /**
   * Extrae contenido de callouts
   */
  private static extractCallout(blockContent: NotionBlockContent): ExtractedContent {
    const icon = blockContent.icon?.emoji || '💡';
    const content = this.extractRichText(blockContent.rich_text || [], 'callout');

    const htmlContent = `<div class="notion-callout"><span class="callout-icon">${icon}</span><div class="callout-content">${content.htmlContent}</div></div>`;

    return {
      ...content,
      htmlContent,
      metadata: {
        ...content.metadata,
        type: 'callout'
      }
    };
  }

  /**
   * Extrae contenido de filas de tabla
   */
  private static extractTableRow(blockContent: NotionBlockContent): ExtractedContent {
    const cells = blockContent.cells || [];
    let plainText = '';
    let htmlContent = '<tr>';

    for (const cell of cells) {
      const cellContent = this.extractRichText(cell, 'table_cell');
      plainText += cellContent.plainText + '\t';
      htmlContent += `<td>${cellContent.htmlContent}</td>`;
    }

    htmlContent += '</tr>';

    return this.createExtractedContent(plainText.trim(), htmlContent, 'table_row', true);
  }

  /**
   * Extrae contenido de tareas (to-do)
   */
  private static extractToDo(blockContent: NotionBlockContent): ExtractedContent {
    const checked = blockContent.checked || false;
    const content = this.extractRichText(blockContent.rich_text || [], 'todo');

    const checkbox = checked ? '☑️' : '☐';
    const htmlContent = `<div class="notion-todo"><input type="checkbox" ${checked ? 'checked' : ''} disabled> ${content.htmlContent}</div>`;

    return {
      ...content,
      plainText: `${checkbox} ${content.plainText}`,
      htmlContent,
      metadata: {
        ...content.metadata,
        type: 'todo'
      }
    };
  }

  /**
   * Extrae divisores
   */
  private static extractDivider(): ExtractedContent {
    return this.createExtractedContent('---', '<hr class="notion-divider">', 'divider', false);
  }

  /**
   * Extrae contenido de media (imágenes, videos, archivos)
   */
  private static extractMedia(blockContent: NotionBlockContent, type: string): ExtractedContent {
    const url = blockContent.external?.url || blockContent.file?.url || '';
    const caption = blockContent.caption?.map((t: NotionRichText) => t.plain_text).join('') || '';

    let htmlContent = '';
    const plainText = caption || `[${type.toUpperCase()}]`;

    switch (type) {
      case 'image':
        htmlContent = `<figure class="notion-image"><img src="${url}" alt="${caption}" loading="lazy"><figcaption>${caption}</figcaption></figure>`;
        break;
      case 'video':
        htmlContent = `<figure class="notion-video"><video src="${url}" controls><track kind="captions"></video><figcaption>${caption}</figcaption></figure>`;
        break;
      case 'file':
        htmlContent = `<div class="notion-file"><a href="${url}" target="_blank" rel="noopener noreferrer">📎 ${caption || 'Descargar archivo'}</a></div>`;
        break;
    }

    return this.createExtractedContent(plainText, htmlContent, type, true);
  }

  /**
   * Extrae contenido de bookmarks
   */
  private static extractBookmark(blockContent: NotionBlockContent): ExtractedContent {
    const url = blockContent.url || '';
    const caption = blockContent.caption?.map((t: NotionRichText) => t.plain_text).join('') || '';

    const plainText = caption || url;
    const htmlContent = `<div class="notion-bookmark"><a href="${url}" target="_blank" rel="noopener noreferrer">${caption || url}</a></div>`;

    return this.createExtractedContent(plainText, htmlContent, 'bookmark', true);
  }

  /**
   * Extrae ecuaciones
   */
  private static extractEquation(blockContent: NotionBlockContent): ExtractedContent {
    const expression = blockContent.expression || '';
    const htmlContent = `<div class="notion-equation">$$${expression}$$</div>`;

    return this.createExtractedContent(expression, htmlContent, 'equation', true);
  }

  /**
   * Fallback para tipos de bloque no reconocidos
   */
  private static extractFallback(block: NotionBlock): ExtractedContent {
    const blockContent = block[block.type] as NotionBlockContent;
    let plainText = '';

    if (blockContent?.rich_text) {
      plainText = blockContent.rich_text.map((t: NotionRichText) => t.plain_text).join('');
    } else if (blockContent?.title) {
      plainText = blockContent.title.map((t: NotionRichText) => t.plain_text).join('');
    } else {
      plainText = `[${block.type.toUpperCase()}]`;
    }

    return this.createExtractedContent(plainText, `<div class="notion-${block.type}">${this.escapeHtml(plainText)}</div>`, block.type, false);
  }

  /**
   * Extrae contenido completo de una página con jerarquía
   */
  static extractPageContent(blocks: NotionBlock[]): PageContent {
    let fullText = '';
    let htmlStructure = '';
    const sections: PageSection[] = [];
    let currentSection: PageSection | null = null;
    const sectionStack: PageSection[] = [];

    for (const block of blocks) {
      const extracted = this.extractContent(block);
      fullText += extracted.plainText + '\n';
      htmlStructure += extracted.htmlContent + '\n';

      // Detectar secciones por headings
      if (extracted.metadata.type === 'heading') {
        const level = extracted.metadata.level || 1;

        // Cerrar secciones de nivel superior o igual
        while (sectionStack.length > 0 && sectionStack[sectionStack.length - 1].level >= level) {
          const closedSection = sectionStack.pop()!;
          if (sectionStack.length === 0) {
            sections.push(closedSection);
          } else {
            sectionStack[sectionStack.length - 1].subsections.push(closedSection);
          }
        }

        // Crear nueva sección
        currentSection = {
          id: block.id,
          heading: extracted.plainText,
          content: '',
          htmlContent: '',
          level,
          blockIds: [block.id],
          subsections: []
        };

        sectionStack.push(currentSection);
      } else if (currentSection) {
        // Agregar contenido a sección actual
        currentSection.content += extracted.plainText + '\n';
        currentSection.htmlContent += extracted.htmlContent + '\n';
        currentSection.blockIds.push(block.id);
      }
    }

    // Cerrar secciones restantes
    while (sectionStack.length > 0) {
      const closedSection = sectionStack.pop()!;
      if (sectionStack.length === 0) {
        sections.push(closedSection);
      } else {
        sectionStack[sectionStack.length - 1].subsections.push(closedSection);
      }
    }

    const contentHash = this.generateContentHash(fullText);
    const wordCount = this.countWords(fullText);
    const characterCount = fullText.length;

    return {
      fullText: fullText.trim(),
      htmlStructure,
      sections,
      contentHash,
      wordCount,
      characterCount
    };
  }

  /**
   * Genera chunks de texto para embeddings
   */
  static generateTextChunks(
    content: PageContent,
    maxChunkSize: number = 1000,
    overlapSize: number = 100
  ): TextChunk[] {
    const chunks: TextChunk[] = [];
    let chunkIndex = 0;

    // Chunking por secciones primero
    for (const section of content.sections) {
      const sectionText = `${section.heading}\n\n${section.content}`.trim();

      if (sectionText.length <= maxChunkSize) {
        // Sección completa cabe en un chunk
        chunks.push({
          text: sectionText,
          metadata: {
            chunkIndex: chunkIndex++,
            section: section.heading,
            blockIds: section.blockIds,
            startOffset: 0,
            endOffset: sectionText.length
          }
        });
      } else {
        // Dividir sección en múltiples chunks
        const sectionChunks = this.splitTextIntoChunks(sectionText, maxChunkSize, overlapSize);
        for (const chunk of sectionChunks) {
          chunks.push({
            text: chunk.text,
            metadata: {
              chunkIndex: chunkIndex++,
              section: section.heading,
              blockIds: section.blockIds,
              startOffset: chunk.startOffset,
              endOffset: chunk.endOffset
            }
          });
        }
      }
    }

    return chunks;
  }

  // Métodos auxiliares privados

  private static createEmptyContent(type: string): ExtractedContent {
    return this.createExtractedContent('', '', type, false);
  }

  private static createExtractedContent(
    plainText: string,
    htmlContent: string,
    type: string,
    hasFormatting: boolean,
    level?: number
  ): ExtractedContent {
    const contentHash = this.generateContentHash(plainText);
    const wordCount = this.countWords(plainText);
    const characterCount = plainText.length;

    return {
      plainText,
      htmlContent,
      contentHash,
      metadata: {
        type,
        level,
        hasFormatting,
        wordCount,
        characterCount
      }
    };
  }

  private static wrapInContainer(htmlContent: string, containerType: string, level?: number): string {
    switch (containerType) {
      case 'heading':
        return level ? `<h${level}>${htmlContent}</h${level}>` : `<h1>${htmlContent}</h1>`;
      case 'paragraph':
        return `<p>${htmlContent}</p>`;
      case 'quote':
        return `<blockquote>${htmlContent}</blockquote>`;
      case 'callout':
        return htmlContent; // Ya envuelto en extractCallout
      default:
        return htmlContent;
    }
  }

  private static escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  private static generateContentHash(content: string): string {
    // Use a simple hash for edge compatibility
    let hash = 0;
    const str = content.trim();
    if (str.length === 0) return '0';

    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }

    return Math.abs(hash).toString(16);
  }

  private static countWords(text: string): number {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  }

  private static splitTextIntoChunks(
    text: string,
    maxSize: number,
    overlapSize: number
  ): Array<{ text: string; startOffset: number; endOffset: number }> {
    const chunks: Array<{ text: string; startOffset: number; endOffset: number }> = [];
    let start = 0;

    while (start < text.length) {
      let end = Math.min(start + maxSize, text.length);

      // Intentar terminar en una palabra completa
      if (end < text.length) {
        const lastSpace = text.lastIndexOf(' ', end);
        if (lastSpace > start + maxSize * 0.8) {
          end = lastSpace;
        }
      }

      const chunkText = text.slice(start, end).trim();
      if (chunkText.length > 0) {
        chunks.push({
          text: chunkText,
          startOffset: start,
          endOffset: end
        });
      }

      start = Math.max(start + 1, end - overlapSize);
    }

    return chunks;
  }
} 