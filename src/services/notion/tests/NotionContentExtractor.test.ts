import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NotionContentExtractor, NotionBlock, NotionRichText } from '../NotionContentExtractor';

// Usar el sistema centralizado de mocks
import {
  createTestSetup
} from '@/mocks';

// Mock del módulo crypto
vi.mock('crypto', async (importOriginal) => {
  const actual = await importOriginal<typeof import('crypto')>();
  return {
    ...actual,
    createHash: vi.fn(() => ({
      update: vi.fn().mockReturnThis(),
      digest: vi.fn(() => 'mock-hash-123')
    }))
  };
});

describe('NotionContentExtractor', () => {
  const { teardown } = createTestSetup(); // ✅ Console mocks centralizados

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    teardown(); // ✅ Limpieza automática
  });

  describe('extractContent - Tipos básicos de bloques', () => {
    it('should extract paragraph content', () => {
      const mockBlock: NotionBlock = {
        object: 'block',
        id: 'block-123',
        parent: { type: 'page_id', page_id: 'page-123' },
        created_time: '2024-01-01T00:00:00Z',
        last_edited_time: '2024-01-01T00:00:00Z',
        created_by: { object: 'user', id: 'user-123' },
        last_edited_by: { object: 'user', id: 'user-123' },
        has_children: false,
        archived: false,
        type: 'paragraph',
        paragraph: {
          rich_text: [
            {
              type: 'text',
              text: { content: 'Este es un párrafo de prueba' },
              annotations: {
                bold: false,
                italic: false,
                strikethrough: false,
                underline: false,
                code: false,
                color: 'default'
              },
              plain_text: 'Este es un párrafo de prueba'
            }
          ]
        }
      };

      const result = NotionContentExtractor.extractContent(mockBlock);

      expect(result.plainText).toBe('Este es un párrafo de prueba');
      expect(result.htmlContent).toBe('<p>Este es un párrafo de prueba</p>');
      expect(result.metadata.type).toBe('paragraph');
      expect(result.metadata.wordCount).toBe(6);
    });

    it('should extract heading content with levels', () => {
      const mockBlock: NotionBlock = {
        object: 'block',
        id: 'block-123',
        parent: { type: 'page_id', page_id: 'page-123' },
        created_time: '2024-01-01T00:00:00Z',
        last_edited_time: '2024-01-01T00:00:00Z',
        created_by: { object: 'user', id: 'user-123' },
        last_edited_by: { object: 'user', id: 'user-123' },
        has_children: false,
        archived: false,
        type: 'heading_2',
        heading_2: {
          rich_text: [
            {
              type: 'text',
              text: { content: 'Título de Sección' },
              annotations: {
                bold: false,
                italic: false,
                strikethrough: false,
                underline: false,
                code: false,
                color: 'default'
              },
              plain_text: 'Título de Sección'
            }
          ]
        }
      };

      const result = NotionContentExtractor.extractContent(mockBlock);

      expect(result.plainText).toBe('Título de Sección');
      expect(result.htmlContent).toBe('<h2>Título de Sección</h2>');
      expect(result.metadata.type).toBe('heading');
      expect(result.metadata.level).toBe(2);
    });

    it('should extract rich text with formatting', () => {
      const mockRichText: NotionRichText[] = [
        {
          type: 'text',
          text: { content: 'Texto con ' },
          annotations: {
            bold: false,
            italic: false,
            strikethrough: false,
            underline: false,
            code: false,
            color: 'default'
          },
          plain_text: 'Texto con '
        },
        {
          type: 'text',
          text: { content: 'formato' },
          annotations: {
            bold: true,
            italic: true,
            strikethrough: false,
            underline: false,
            code: false,
            color: 'default'
          },
          plain_text: 'formato'
        }
      ];

      const mockBlock: NotionBlock = {
        object: 'block',
        id: 'block-123',
        parent: { type: 'page_id', page_id: 'page-123' },
        created_time: '2024-01-01T00:00:00Z',
        last_edited_time: '2024-01-01T00:00:00Z',
        created_by: { object: 'user', id: 'user-123' },
        last_edited_by: { object: 'user', id: 'user-123' },
        has_children: false,
        archived: false,
        type: 'paragraph',
        paragraph: { rich_text: mockRichText }
      };

      const result = NotionContentExtractor.extractContent(mockBlock);

      expect(result.plainText).toBe('Texto con formato');
      expect(result.htmlContent).toBe('<p>Texto con <em><strong>formato</strong></em></p>');
      expect(result.metadata.hasFormatting).toBe(true);
    });

    it('should extract code block content', () => {
      const mockBlock: NotionBlock = {
        object: 'block',
        id: 'block-123',
        parent: { type: 'page_id', page_id: 'page-123' },
        created_time: '2024-01-01T00:00:00Z',
        last_edited_time: '2024-01-01T00:00:00Z',
        created_by: { object: 'user', id: 'user-123' },
        last_edited_by: { object: 'user', id: 'user-123' },
        has_children: false,
        archived: false,
        type: 'code',
        code: {
          rich_text: [
            {
              type: 'text',
              text: { content: 'const x = 42;' },
              annotations: {
                bold: false,
                italic: false,
                strikethrough: false,
                underline: false,
                code: false,
                color: 'default'
              },
              plain_text: 'const x = 42;'
            }
          ],
          language: 'javascript'
        }
      };

      const result = NotionContentExtractor.extractContent(mockBlock);

      expect(result.plainText).toBe('const x = 42;');
      expect(result.htmlContent).toBe('<pre><code class="language-javascript">const x = 42;</code></pre>');
      expect(result.metadata.type).toBe('code');
    });

    it('should extract list items', () => {
      const mockBlock: NotionBlock = {
        object: 'block',
        id: 'block-123',
        parent: { type: 'page_id', page_id: 'page-123' },
        created_time: '2024-01-01T00:00:00Z',
        last_edited_time: '2024-01-01T00:00:00Z',
        created_by: { object: 'user', id: 'user-123' },
        last_edited_by: { object: 'user', id: 'user-123' },
        has_children: false,
        archived: false,
        type: 'bulleted_list_item',
        bulleted_list_item: {
          rich_text: [
            {
              type: 'text',
              text: { content: 'Elemento de lista' },
              annotations: {
                bold: false,
                italic: false,
                strikethrough: false,
                underline: false,
                code: false,
                color: 'default'
              },
              plain_text: 'Elemento de lista'
            }
          ]
        }
      };

      const result = NotionContentExtractor.extractContent(mockBlock);

      expect(result.plainText).toBe('Elemento de lista');
      expect(result.htmlContent).toBe('<li>Elemento de lista</li>');
      expect(result.metadata.listType).toBe('bulleted');
    });
  });

  describe('extractContent - Tipos especiales', () => {
    it('should extract callout content', () => {
      const mockBlock: NotionBlock = {
        object: 'block',
        id: 'block-123',
        parent: { type: 'page_id', page_id: 'page-123' },
        created_time: '2024-01-01T00:00:00Z',
        last_edited_time: '2024-01-01T00:00:00Z',
        created_by: { object: 'user', id: 'user-123' },
        last_edited_by: { object: 'user', id: 'user-123' },
        has_children: false,
        archived: false,
        type: 'callout',
        callout: {
          rich_text: [
            {
              type: 'text',
              text: { content: 'Información importante' },
              annotations: {
                bold: false,
                italic: false,
                strikethrough: false,
                underline: false,
                code: false,
                color: 'default'
              },
              plain_text: 'Información importante'
            }
          ],
          icon: { emoji: '💡' }
        }
      };

      const result = NotionContentExtractor.extractContent(mockBlock);

      expect(result.plainText).toBe('Información importante');
      expect(result.htmlContent).toContain('💡');
      expect(result.htmlContent).toContain('notion-callout');
      expect(result.metadata.type).toBe('callout');
    });

    it('should extract to-do content', () => {
      const mockBlock: NotionBlock = {
        object: 'block',
        id: 'block-123',
        parent: { type: 'page_id', page_id: 'page-123' },
        created_time: '2024-01-01T00:00:00Z',
        last_edited_time: '2024-01-01T00:00:00Z',
        created_by: { object: 'user', id: 'user-123' },
        last_edited_by: { object: 'user', id: 'user-123' },
        has_children: false,
        archived: false,
        type: 'to_do',
        to_do: {
          rich_text: [
            {
              type: 'text',
              text: { content: 'Tarea completada' },
              annotations: {
                bold: false,
                italic: false,
                strikethrough: false,
                underline: false,
                code: false,
                color: 'default'
              },
              plain_text: 'Tarea completada'
            }
          ],
          checked: true
        }
      };

      const result = NotionContentExtractor.extractContent(mockBlock);

      expect(result.plainText).toBe('☑️ Tarea completada');
      expect(result.htmlContent).toContain('checked');
      expect(result.metadata.type).toBe('todo');
    });

    it('should handle unknown block types', () => {
      const mockBlock: NotionBlock = {
        object: 'block',
        id: 'block-123',
        parent: { type: 'page_id', page_id: 'page-123' },
        created_time: '2024-01-01T00:00:00Z',
        last_edited_time: '2024-01-01T00:00:00Z',
        created_by: { object: 'user', id: 'user-123' },
        last_edited_by: { object: 'user', id: 'user-123' },
        has_children: false,
        archived: false,
        type: 'unknown_type'
      };

      const result = NotionContentExtractor.extractContent(mockBlock);

      // El comportamiento actual retorna contenido vacío para tipos desconocidos
      expect(result.plainText).toBe('');
      expect(result.htmlContent).toBe('');
      expect(result.metadata.type).toBe('unknown_type');
    });

    it('should handle empty content', () => {
      const mockBlock: NotionBlock = {
        object: 'block',
        id: 'block-123',
        parent: { type: 'page_id', page_id: 'page-123' },
        created_time: '2024-01-01T00:00:00Z',
        last_edited_time: '2024-01-01T00:00:00Z',
        created_by: { object: 'user', id: 'user-123' },
        last_edited_by: { object: 'user', id: 'user-123' },
        has_children: false,
        archived: false,
        type: 'paragraph'
      };

      const result = NotionContentExtractor.extractContent(mockBlock);

      expect(result.plainText).toBe('');
      expect(result.htmlContent).toBe('');
      expect(result.metadata.wordCount).toBe(0);
    });
  });

  describe('extractPageContent - Procesamiento de página completa', () => {
    it('should extract page content with hierarchy', () => {
      const mockBlocks: NotionBlock[] = [
        {
          object: 'block',
          id: 'block-1',
          parent: { type: 'page_id', page_id: 'page-123' },
          created_time: '2024-01-01T00:00:00Z',
          last_edited_time: '2024-01-01T00:00:00Z',
          created_by: { object: 'user', id: 'user-123' },
          last_edited_by: { object: 'user', id: 'user-123' },
          has_children: false,
          archived: false,
          type: 'heading_1',
          heading_1: {
            rich_text: [{ type: 'text', text: { content: 'Introducción' }, annotations: { bold: false, italic: false, strikethrough: false, underline: false, code: false, color: 'default' }, plain_text: 'Introducción' }]
          }
        },
        {
          object: 'block',
          id: 'block-2',
          parent: { type: 'page_id', page_id: 'page-123' },
          created_time: '2024-01-01T00:00:00Z',
          last_edited_time: '2024-01-01T00:00:00Z',
          created_by: { object: 'user', id: 'user-123' },
          last_edited_by: { object: 'user', id: 'user-123' },
          has_children: false,
          archived: false,
          type: 'paragraph',
          paragraph: {
            rich_text: [{ type: 'text', text: { content: 'Este es el contenido de la introducción.' }, annotations: { bold: false, italic: false, strikethrough: false, underline: false, code: false, color: 'default' }, plain_text: 'Este es el contenido de la introducción.' }]
          }
        }
      ];

      const result = NotionContentExtractor.extractPageContent(mockBlocks);

      expect(result.sections).toHaveLength(1);
      expect(result.sections[0].heading).toBe('Introducción');
      expect(result.sections[0].content).toContain('Este es el contenido de la introducción.');
      expect(result.sections[0].level).toBe(1);
      expect(result.wordCount).toBeGreaterThan(0);
      // El hash se genera dinámicamente, verificamos que existe
      expect(result.contentHash).toBeDefined();
      expect(typeof result.contentHash).toBe('string');
      expect(result.contentHash.length).toBeGreaterThan(0);
    });

    it('should handle nested sections', () => {
      const mockBlocks: NotionBlock[] = [
        {
          object: 'block',
          id: 'block-1',
          parent: { type: 'page_id', page_id: 'page-123' },
          created_time: '2024-01-01T00:00:00Z',
          last_edited_time: '2024-01-01T00:00:00Z',
          created_by: { object: 'user', id: 'user-123' },
          last_edited_by: { object: 'user', id: 'user-123' },
          has_children: false,
          archived: false,
          type: 'heading_1',
          heading_1: {
            rich_text: [{ type: 'text', text: { content: 'Capítulo 1' }, annotations: { bold: false, italic: false, strikethrough: false, underline: false, code: false, color: 'default' }, plain_text: 'Capítulo 1' }]
          }
        },
        {
          object: 'block',
          id: 'block-2',
          parent: { type: 'page_id', page_id: 'page-123' },
          created_time: '2024-01-01T00:00:00Z',
          last_edited_time: '2024-01-01T00:00:00Z',
          created_by: { object: 'user', id: 'user-123' },
          last_edited_by: { object: 'user', id: 'user-123' },
          has_children: false,
          archived: false,
          type: 'heading_2',
          heading_2: {
            rich_text: [{ type: 'text', text: { content: 'Sección 1.1' }, annotations: { bold: false, italic: false, strikethrough: false, underline: false, code: false, color: 'default' }, plain_text: 'Sección 1.1' }]
          }
        }
      ];

      const result = NotionContentExtractor.extractPageContent(mockBlocks);

      expect(result.sections).toHaveLength(1);
      expect(result.sections[0].heading).toBe('Capítulo 1');
      expect(result.sections[0].subsections).toHaveLength(1);
      expect(result.sections[0].subsections[0].heading).toBe('Sección 1.1');
    });
  });

  describe('generateTextChunks - División en chunks', () => {
    it('should generate text chunks from page content', () => {
      const mockPageContent = {
        fullText: 'Texto completo de la página con mucho contenido para dividir en chunks.',
        htmlStructure: '<h1>Título</h1><p>Contenido</p>',
        sections: [
          {
            id: 'section-1',
            heading: 'Título Principal',
            content: 'Contenido de la sección principal con información relevante.',
            htmlContent: '<h1>Título Principal</h1><p>Contenido de la sección principal con información relevante.</p>',
            level: 1,
            blockIds: ['block-1', 'block-2'],
            subsections: []
          }
        ],
        contentHash: 'hash-123',
        wordCount: 15,
        characterCount: 150
      };

      const chunks = NotionContentExtractor.generateTextChunks(mockPageContent, 100, 20);

      expect(chunks.length).toBeGreaterThan(0);
      expect(chunks[0].metadata.section).toBe('Título Principal');
      expect(chunks[0].metadata.chunkIndex).toBe(0);
      expect(chunks[0].metadata.blockIds).toEqual(['block-1', 'block-2']);
    });

    it('should handle large sections that need splitting', () => {
      const longContent = 'Este es un contenido muy largo que necesita ser dividido en múltiples chunks para mantener el tamaño adecuado. '.repeat(20);

      const mockPageContent = {
        fullText: longContent,
        htmlStructure: '<p>' + longContent + '</p>',
        sections: [
          {
            id: 'section-1',
            heading: 'Sección Larga',
            content: longContent,
            htmlContent: '<p>' + longContent + '</p>',
            level: 1,
            blockIds: ['block-1'],
            subsections: []
          }
        ],
        contentHash: 'hash-456',
        wordCount: 200,
        characterCount: 2000
      };

      const chunks = NotionContentExtractor.generateTextChunks(mockPageContent, 500, 50);

      expect(chunks.length).toBeGreaterThan(1);
      chunks.forEach(chunk => {
        expect(chunk.text.length).toBeLessThanOrEqual(500);
        expect(chunk.metadata.section).toBe('Sección Larga');
      });
    });

    it('should handle empty page content', () => {
      const mockPageContent = {
        fullText: '',
        htmlStructure: '',
        sections: [],
        contentHash: 'empty-hash',
        wordCount: 0,
        characterCount: 0
      };

      const chunks = NotionContentExtractor.generateTextChunks(mockPageContent);

      expect(chunks).toHaveLength(0);
    });
  });

  describe('Métodos auxiliares', () => {
    it('should escape HTML correctly', () => {
      const mockBlock: NotionBlock = {
        object: 'block',
        id: 'block-123',
        parent: { type: 'page_id', page_id: 'page-123' },
        created_time: '2024-01-01T00:00:00Z',
        last_edited_time: '2024-01-01T00:00:00Z',
        created_by: { object: 'user', id: 'user-123' },
        last_edited_by: { object: 'user', id: 'user-123' },
        has_children: false,
        archived: false,
        type: 'paragraph',
        paragraph: {
          rich_text: [
            {
              type: 'text',
              text: { content: '<script>alert("test")</script>' },
              annotations: {
                bold: false,
                italic: false,
                strikethrough: false,
                underline: false,
                code: false,
                color: 'default'
              },
              plain_text: '<script>alert("test")</script>'
            }
          ]
        }
      };

      const result = NotionContentExtractor.extractContent(mockBlock);

      expect(result.htmlContent).not.toContain('<script>');
      expect(result.htmlContent).toContain('&lt;script&gt;');
    });

    it('should count words correctly', () => {
      const mockBlock: NotionBlock = {
        object: 'block',
        id: 'block-123',
        parent: { type: 'page_id', page_id: 'page-123' },
        created_time: '2024-01-01T00:00:00Z',
        last_edited_time: '2024-01-01T00:00:00Z',
        created_by: { object: 'user', id: 'user-123' },
        last_edited_by: { object: 'user', id: 'user-123' },
        has_children: false,
        archived: false,
        type: 'paragraph',
        paragraph: {
          rich_text: [
            {
              type: 'text',
              text: { content: 'Esto tiene exactamente cinco palabras.' },
              annotations: {
                bold: false,
                italic: false,
                strikethrough: false,
                underline: false,
                code: false,
                color: 'default'
              },
              plain_text: 'Esto tiene exactamente cinco palabras.'
            }
          ]
        }
      };

      const result = NotionContentExtractor.extractContent(mockBlock);

      expect(result.metadata.wordCount).toBe(5);
      // Verificamos que el conteo de caracteres es del texto plano, no del HTML
      expect(result.metadata.characterCount).toBe(result.plainText.length);
      expect(result.plainText).toBe('Esto tiene exactamente cinco palabras.');
    });
  });
}); 