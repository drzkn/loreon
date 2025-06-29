import { Block } from '../domain/entities/Block';

/**
 * Opciones para la conversión de bloques a Markdown
 */
export interface BlockToMarkdownOptions {
  /** Nivel de indentación inicial */
  initialIndentLevel?: number;
  /** Espacios por nivel de indentación */
  indentSpaces?: number;
  /** Incluir comentarios HTML para bloques no soportados */
  includeUnsupportedComments?: boolean;
}

/**
 * Tipo para rich text de Notion
 */
export interface NotionRichText {
  plain_text?: string;
  text?: { content?: string };
}

/**
 * Función tipo para convertir un bloque específico
 */
export type BlockConverter = (block: Block, indent: string) => string;

/**
 * Mapa de convertidores por tipo de bloque
 */
const blockConverters: Record<string, BlockConverter> = {
  'image': convertImageBlockToMarkdown,
  'paragraph': convertParagraphBlockToMarkdown,
  'heading_1': (block, indent) => convertHeadingBlockToMarkdown(block, 1, indent),
  'heading_2': (block, indent) => convertHeadingBlockToMarkdown(block, 2, indent),
  'heading_3': (block, indent) => convertHeadingBlockToMarkdown(block, 3, indent),
  'bulleted_list_item': convertBulletedListItemBlockToMarkdown,
  'numbered_list_item': convertNumberedListItemBlockToMarkdown,
  'to_do': convertTodoBlockToMarkdown,
  'divider': (_, indent) => `${indent}---\n\n`,
  'quote': convertQuoteBlockToMarkdown,
  'code': convertCodeBlockToMarkdown,
  'toggle': convertToggleBlockToMarkdown,
};

/**
 * Convierte una lista de bloques de Notion a formato Markdown
 */
export function convertBlocksToMarkdown(
  blocks: Block[],
  level: number = 0,
  options: BlockToMarkdownOptions = {}
): string {
  const {
    indentSpaces = 2
  } = options;

  let markdown = '';

  for (const block of blocks) {
    const blockMarkdown = convertBlockToMarkdown(block, level, {
      ...options,
      indentSpaces
    });

    if (blockMarkdown) {
      markdown += blockMarkdown;
    }

    // Procesar bloques hijos recursivamente
    if (block.children && block.children.length > 0) {
      if (isToggleElement(block)) {
        // Para toggle elements, añadir contenido anidado y cerrar el details
        const indent = ' '.repeat(indentSpaces).repeat(level);
        markdown += convertBlocksToMarkdown(block.children, level + 1, options);
        markdown += `${indent}</details>\n\n`;
      } else {
        // Para otros bloques con hijos, procesar normalmente
        markdown += convertBlocksToMarkdown(block.children, level + 1, options);
      }
    } else {
      // Si es un toggle sin hijos, cerrar el details de inmediato
      if (isToggleElement(block)) {
        const indent = ' '.repeat(indentSpaces).repeat(level);
        markdown += `${indent}</details>\n\n`;
      }
    }
  }

  return markdown;
}

/**
 * Convierte un bloque individual de Notion a formato Markdown
 */
export function convertBlockToMarkdown(
  block: Block,
  level: number = 0,
  options: BlockToMarkdownOptions = {}
): string {
  const {
    indentSpaces = 2,
    includeUnsupportedComments = true
  } = options;

  const indent = ' '.repeat(indentSpaces).repeat(level);

  try {
    // Buscar el convertidor específico para este tipo de bloque
    const converter = blockConverters[block.type];

    if (converter) {
      return converter(block, indent);
    } else {
      // Manejar tipos de bloque no soportados
      return convertUnsupportedBlockToMarkdown(block, indent, includeUnsupportedComments);
    }
  } catch (error) {
    console.error(`Error al convertir bloque ${block.id}:`, error);

    if (includeUnsupportedComments) {
      return `${indent}<!-- Error al convertir bloque ${block.type}: ${block.id} -->\n\n`;
    }

    return '';
  }
}

/**
 * Convierte un bloque de imagen a Markdown
 */
function convertImageBlockToMarkdown(block: Block, indent: string = ''): string {
  try {
    const imageData = block.data.image as {
      type?: string;
      file?: { url?: string };
      external?: { url?: string };
      file_upload?: { id?: string };
      caption?: Array<NotionRichText>;
    };

    if (!imageData) {
      return `${indent}<!-- Imagen sin datos -->\n\n`;
    }

    // Extraer URL de la imagen
    let imageUrl = '';
    let altText = 'Imagen';

    // Determinar la URL según el tipo
    if (imageData.type === 'external' && imageData.external?.url) {
      imageUrl = imageData.external.url;
    } else if (imageData.type === 'file' && imageData.file?.url) {
      imageUrl = imageData.file.url;
    } else if (imageData.file_upload?.id) {
      // Para file_upload, normalmente necesitarías hacer otra llamada a la API
      // Por ahora, mostramos un placeholder
      return `${indent}<!-- Imagen subida (requiere descarga): ${imageData.file_upload.id} -->\n\n`;
    }

    if (!imageUrl) {
      return `${indent}<!-- Imagen sin URL válida -->\n\n`;
    }

    // Extraer caption si existe
    let caption = '';
    if (imageData.caption && Array.isArray(imageData.caption) && imageData.caption.length > 0) {
      caption = extractPlainTextFromRichText(imageData.caption);

      if (caption) {
        altText = caption;
      }
    }

    // Generar Markdown de la imagen
    let imageMarkdown = `${indent}![${altText}](${imageUrl})`;

    // Si hay caption, añadirlo como texto debajo de la imagen
    if (caption && caption !== altText) {
      imageMarkdown += `\n\n${indent}*${caption}*`;
    }

    return `${imageMarkdown}\n\n`;

  } catch (error) {
    console.error('Error al procesar bloque de imagen:', error);
    return `${indent}<!-- Error al procesar imagen -->\n\n`;
  }
}

/**
 * Convierte un bloque de párrafo a Markdown
 */
function convertParagraphBlockToMarkdown(block: Block, indent: string = ''): string {
  const paragraphData = block.data.paragraph as {
    rich_text?: Array<NotionRichText>
  };

  if (!paragraphData?.rich_text) {
    return '';
  }

  const text = extractPlainTextFromRichText(paragraphData.rich_text);

  if (!text) {
    return '';
  }

  return `${indent}${text}\n\n`;
}

/**
 * Convierte un bloque de encabezado a Markdown
 * Maneja tanto encabezados normales como toggle headings
 */
function convertHeadingBlockToMarkdown(block: Block, level: number, indent: string = ''): string {
  const headingData = block.data[block.type] as {
    rich_text?: Array<NotionRichText>;
    is_toggleable?: boolean;
  };

  if (!headingData?.rich_text) {
    return '';
  }

  const text = extractPlainTextFromRichText(headingData.rich_text);

  if (!text) {
    return '';
  }

  const headingPrefix = '#'.repeat(level);

  // Si es un toggle heading, usar formato HTML details
  if (headingData.is_toggleable) {
    return `${indent}<details>\n${indent}<summary><strong>${headingPrefix} ${text}</strong></summary>\n\n`;
  }

  // Encabezado normal
  return `${indent}${headingPrefix} ${text}\n\n`;
}

/**
 * Convierte un bloque de lista con viñetas a Markdown
 */
function convertBulletedListItemBlockToMarkdown(block: Block, indent: string = ''): string {
  const listData = block.data.bulleted_list_item as {
    rich_text?: Array<NotionRichText>
  };

  if (!listData?.rich_text) {
    return '';
  }

  const text = extractPlainTextFromRichText(listData.rich_text);

  if (!text) {
    return '';
  }

  return `${indent}- ${text}\n`;
}

/**
 * Convierte un bloque de lista numerada a Markdown
 */
function convertNumberedListItemBlockToMarkdown(block: Block, indent: string = ''): string {
  const listData = block.data.numbered_list_item as {
    rich_text?: Array<NotionRichText>
  };

  if (!listData?.rich_text) {
    return '';
  }

  const text = extractPlainTextFromRichText(listData.rich_text);

  if (!text) {
    return '';
  }

  return `${indent}1. ${text}\n`;
}

/**
 * Convierte un bloque de tarea (to-do) a Markdown
 */
function convertTodoBlockToMarkdown(block: Block, indent: string = ''): string {
  const todoData = block.data.to_do as {
    rich_text?: Array<NotionRichText>;
    checked?: boolean;
  };

  if (!todoData?.rich_text) {
    return '';
  }

  const text = extractPlainTextFromRichText(todoData.rich_text);

  if (!text) {
    return '';
  }

  const checkbox = todoData.checked ? '[x]' : '[ ]';
  return `${indent}- ${checkbox} ${text}\n`;
}

/**
 * Convierte un bloque de cita a Markdown
 */
function convertQuoteBlockToMarkdown(block: Block, indent: string = ''): string {
  const quoteData = block.data.quote as {
    rich_text?: Array<NotionRichText>
  };

  if (!quoteData?.rich_text) {
    return '';
  }

  const text = extractPlainTextFromRichText(quoteData.rich_text);

  if (!text) {
    return '';
  }

  return `${indent}> ${text}\n\n`;
}

/**
 * Convierte un bloque de código a Markdown
 */
function convertCodeBlockToMarkdown(block: Block, indent: string = ''): string {
  const codeData = block.data.code as {
    rich_text?: Array<NotionRichText>;
    language?: string;
  };

  if (!codeData?.rich_text) {
    return `${indent}\`\`\`\n\n\`\`\`\n\n`;
  }

  const code = extractPlainTextFromRichText(codeData.rich_text);
  const language = codeData?.language || '';

  if (!code.trim()) {
    return `${indent}\`\`\`${language}\n\n\`\`\`\n\n`;
  }

  return `${indent}\`\`\`${language}\n${code}\n\`\`\`\n\n`;
}

/**
 * Convierte un bloque de toggle a Markdown usando HTML details
 */
function convertToggleBlockToMarkdown(block: Block, indent: string = ''): string {
  const toggleData = block.data.toggle as {
    rich_text?: Array<NotionRichText>;
  };

  if (!toggleData?.rich_text) {
    return '';
  }

  const text = extractPlainTextFromRichText(toggleData.rich_text);

  if (!text) {
    return '';
  }

  // Usar HTML details/summary para toggle blocks
  return `${indent}<details>\n${indent}<summary>${text}</summary>\n\n`;
}

/**
 * Convierte un bloque no soportado a Markdown con comentarios informativos
 */
function convertUnsupportedBlockToMarkdown(
  block: Block,
  indent: string = '',
  includeComments: boolean = true
): string {
  // Intentar extraer texto básico de rich_text si existe
  const blockData = block.data[block.type] as {
    rich_text?: Array<NotionRichText>
  };

  if (blockData?.rich_text) {
    const text = extractPlainTextFromRichText(blockData.rich_text);

    if (text) {
      if (includeComments) {
        return `${indent}${text} *(${block.type})*\n\n`;
      } else {
        return `${indent}${text}\n\n`;
      }
    }
  }

  // Si no hay texto extraíble, mostrar solo el tipo si se incluyen comentarios
  if (includeComments) {
    return `${indent}*[${block.type}]*\n\n`;
  }

  return '';
}

/**
 * Utilidad para extraer texto plano de rich_text
 */
export function extractPlainTextFromRichText(
  richText?: Array<NotionRichText>
): string {
  if (!richText || !Array.isArray(richText)) {
    return '';
  }

  return richText
    .map(item => item.plain_text || item.text?.content || '')
    .join('')
    .trim();
}

/**
 * Verifica si un bloque es un toggle heading (encabezado desplegable)
 */
function isToggleHeading(block: Block): boolean {
  return block.type.startsWith('heading_') &&
    (block.data[block.type] as { is_toggleable?: boolean })?.is_toggleable === true;
}

/**
 * Verifica si un bloque es un toggle block o toggle heading
 */
function isToggleElement(block: Block): boolean {
  return block.type === 'toggle' || isToggleHeading(block);
}

/**
 * Registra un nuevo convertidor para un tipo de bloque específico
 * Útil para extensibilidad
 */
export function registerBlockConverter(blockType: string, converter: BlockConverter): void {
  blockConverters[blockType] = converter;
}

/**
 * Obtiene la lista de tipos de bloque soportados
 */
export function getSupportedBlockTypes(): string[] {
  return Object.keys(blockConverters);
} 