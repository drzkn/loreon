/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MarkdownConverterService } from '../MarkdownConverter';
import { Page, Block } from '@/domain/entities';

// Usar el sistema centralizado de mocks
import {
  createTestSetup
} from '@/mocks';

// Helper para crear mocks de Page
const createMockPage = (partial: Partial<Page>): Page => ({
  toJSON: vi.fn(),
  toNotionPageResponse: vi.fn(),
  ...partial
} as Page);

// Helper para crear mocks de Block
const createMockBlock = (partial: Partial<Block>): Block => ({
  toJSON: vi.fn(),
  toNotionBlockResponse: vi.fn(),
  ...partial
} as Block);

describe('MarkdownConverterService', () => {
  let service: MarkdownConverterService;
  const { teardown } = createTestSetup(); // ✅ Console mocks centralizados

  beforeEach(() => {
    service = new MarkdownConverterService();
    vi.clearAllMocks();
  });

  afterEach(() => {
    teardown(); // ✅ Limpieza automática
  });

  describe('Constructor', () => {
    it('should create service instance', () => {
      expect(service).toBeInstanceOf(MarkdownConverterService);
    });
  });

  describe('convertPageToMarkdown', () => {
    it('should convert simple page with title property', () => {
      const page = createMockPage({
        id: 'page-123',
        properties: {
          title: {
            title: [{ plain_text: 'Test Page Title' }]
          }
        },
        url: 'https://notion.so/page-123',
        createdTime: '2023-01-01T00:00:00.000Z',
        lastEditedTime: '2023-01-02T00:00:00.000Z'
      });

      const result = service.convertPageToMarkdown(page);

      expect(result.filename).toBe('test-page-title.md');
      expect(result.content).toContain('# Test Page Title');
      expect(result.content).toContain('**ID de la página:** `page-123`');
      expect(result.content).toContain('[Ver en Notion](https://notion.so/page-123)');
      expect(result.metadata.id).toBe('page-123');
      expect(result.metadata.title).toBe('Test Page Title');
    });

    it('should handle page with Name property', () => {
      const page = createMockPage({
        id: 'page-456',
        properties: {
          Name: {
            title: [{ plain_text: 'Page with Name' }]
          }
        }
      });

      const result = service.convertPageToMarkdown(page);

      expect(result.metadata.title).toBe('Page with Name');
      expect(result.filename).toBe('page-with-name.md');
    });

    it('should handle page with rich_text title', () => {
      const page = createMockPage({
        id: 'page-789',
        properties: {
          title: {
            rich_text: [{ plain_text: 'Rich Text Title' }]
          }
        }
      });

      const result = service.convertPageToMarkdown(page);

      expect(result.metadata.title).toBe('Rich Text Title');
    });

    it('should fallback to page ID when no title found', () => {
      const page = createMockPage({
        id: 'page-without-title-123',
        properties: {}
      });

      const result = service.convertPageToMarkdown(page);

      expect(result.metadata.title).toBe('Página page-wit');
      expect(result.filename).toBe('pgina-page-wit.md'); // acentos se eliminan
    });

    it('should handle complex properties in content', () => {
      const page = createMockPage({
        id: 'page-complex',
        properties: {
          title: {
            title: [{ plain_text: 'Complex Page' }]
          },
          Status: {
            select: { name: 'In Progress' }
          },
          Tags: {
            multi_select: [
              { name: 'Important' },
              { name: 'Urgent' }
            ]
          },
          Priority: {
            number: 5
          },
          Completed: {
            checkbox: true
          },
          Description: {
            rich_text: [{ plain_text: 'Page description' }]
          }
        }
      });

      const result = service.convertPageToMarkdown(page);

      expect(result.content).toContain('### Status');
      expect(result.content).toContain('In Progress');
      expect(result.content).toContain('### Tags');
      expect(result.content).toContain('Important, Urgent');
      expect(result.content).toContain('### Priority');
      expect(result.content).toContain('5');
      expect(result.content).toContain('### Completed');
      expect(result.content).toContain('✅ Sí');
      expect(result.content).toContain('### Description');
      expect(result.content).toContain('Page description');
    });

    it('should handle special characters in title', () => {
      const page = createMockPage({
        id: 'page-special',
        properties: {
          title: {
            title: [{ plain_text: 'Title with @#$% Special / Characters!' }]
          }
        }
      });

      const result = service.convertPageToMarkdown(page);

      expect(result.filename).toBe('title-with-special-characters.md'); // caracteres especiales se eliminan
    });

    it('should truncate very long titles', () => {
      const longTitle = 'A'.repeat(100);
      const page = createMockPage({
        id: 'page-long',
        properties: {
          title: {
            title: [{ plain_text: longTitle }]
          }
        }
      });

      const result = service.convertPageToMarkdown(page);

      expect(result.filename.length).toBeLessThanOrEqual(53); // 50 chars + '.md'
    });
  });

  describe('convertPageWithBlocksToMarkdown', () => {
    it('should convert page with blocks', () => {
      const page = createMockPage({
        id: 'page-with-blocks',
        properties: {
          title: {
            title: [{ plain_text: 'Page with Content' }]
          }
        }
      });

      const blocks = [
        createMockBlock({
          id: 'block-1',
          type: 'paragraph',
          data: {
            paragraph: {
              rich_text: [{ plain_text: 'This is paragraph content.' }]
            }
          }
        }),
        createMockBlock({
          id: 'block-2',
          type: 'heading_1',
          data: {
            heading_1: {
              rich_text: [{ plain_text: 'Section Header' }]
            }
          }
        })
      ];

      const result = service.convertPageWithBlocksToMarkdown(page, blocks);

      expect(result.content).toContain('## Contenido');
      expect(result.content).toContain('This is paragraph content.');
      expect(result.content).toContain('# Section Header');
    });

    it('should handle page with empty blocks array', () => {
      const page = createMockPage({
        id: 'page-no-blocks',
        properties: {
          title: {
            title: [{ plain_text: 'Empty Page' }]
          }
        }
      });

      const result = service.convertPageWithBlocksToMarkdown(page, []);

      expect(result.content).toContain('*Esta página no tiene contenido de bloques.*');
    });

    it('should handle page with null blocks', () => {
      const page = createMockPage({
        id: 'page-null-blocks',
        properties: {
          title: {
            title: [{ plain_text: 'Null Blocks Page' }]
          }
        }
      });

      const result = service.convertPageWithBlocksToMarkdown(page, null as any);

      expect(result.content).toContain('*Esta página no tiene contenido de bloques.*');
    });
  });

  describe('convertPagesToMarkdown', () => {
    it('should convert multiple pages', () => {
      const pages = [
        createMockPage({
          id: 'page-1',
          properties: {
            title: { title: [{ plain_text: 'First Page' }] }
          }
        }),
        createMockPage({
          id: 'page-2',
          properties: {
            title: { title: [{ plain_text: 'Second Page' }] }
          }
        })
      ];

      const results = service.convertPagesToMarkdown(pages);

      expect(results).toHaveLength(2);
      expect(results[0].metadata.title).toBe('First Page');
      expect(results[1].metadata.title).toBe('Second Page');
    });

    it('should handle empty pages array', () => {
      const results = service.convertPagesToMarkdown([]);

      expect(results).toHaveLength(0);
    });
  });

  describe('convertPagesWithBlocksToMarkdown', () => {
    it('should convert multiple pages with blocks', () => {
      const pagesWithBlocks = [
        {
          page: createMockPage({
            id: 'page-1',
            properties: {
              title: { title: [{ plain_text: 'First Page' }] }
            }
          }),
          blocks: [
            createMockBlock({
              id: 'block-1',
              type: 'paragraph',
              data: {
                paragraph: {
                  rich_text: [{ plain_text: 'First page content' }]
                }
              }
            })
          ]
        },
        {
          page: createMockPage({
            id: 'page-2',
            properties: {
              title: { title: [{ plain_text: 'Second Page' }] }
            }
          }),
          blocks: []
        }
      ];

      const results = service.convertPagesWithBlocksToMarkdown(pagesWithBlocks);

      expect(results).toHaveLength(2);
      expect(results[0].content).toContain('First page content');
      expect(results[1].content).toContain('*Esta página no tiene contenido de bloques.*');
    });
  });

  describe('generateIndexFile', () => {
    it('should generate index with multiple pages', () => {
      const pages = [
        createMockPage({
          id: 'page-1',
          properties: {
            title: { title: [{ plain_text: 'First Page' }] }
          },
          createdTime: '2023-01-01T00:00:00.000Z',
          lastEditedTime: '2023-01-02T00:00:00.000Z'
        }),
        createMockPage({
          id: 'page-2',
          properties: {
            title: { title: [{ plain_text: 'Second Page' }] }
          },
          createdTime: '2023-01-03T00:00:00.000Z'
        })
      ];

      const result = service.generateIndexFile(pages);

      expect(result.filename).toBe('index.md');
      expect(result.metadata.id).toBe('index');
      expect(result.metadata.title).toBe('Índice de Páginas Exportadas');
      expect(result.content).toContain('# Índice de Páginas Exportadas');
      expect(result.content).toContain('**Total de páginas:** 2');
      expect(result.content).toContain('**[First Page](./first-page.md)**');
      expect(result.content).toContain('**[Second Page](./second-page.md)**');
      expect(result.content).toContain('- Creado:');
      expect(result.content).toContain('- Modificado:');
      expect(result.content).toContain('- ID: `page-1`');
    });

    it('should handle empty pages array in index', () => {
      const result = service.generateIndexFile([]);

      expect(result.content).toContain('**Total de páginas:** 0');
    });

    it('should handle pages without timestamps', () => {
      const pages = [
        createMockPage({
          id: 'page-no-time',
          properties: {
            title: { title: [{ plain_text: 'Page Without Time' }] }
          }
        })
      ];

      const result = service.generateIndexFile(pages);

      expect(result.content).toContain('**[Page Without Time](./page-without-time.md)**');
      expect(result.content).not.toContain('- Creado:');
      expect(result.content).not.toContain('- Modificado:');
    });
  });

  describe('Property Value Extraction', () => {
    it('should handle date properties', () => {
      const page = createMockPage({
        id: 'page-date',
        properties: {
          title: { title: [{ plain_text: 'Date Test' }] },
          DueDate: {
            date: { start: '2023-12-25' }
          }
        }
      });

      const result = service.convertPageToMarkdown(page);

      expect(result.content).toContain('### DueDate');
      expect(result.content).toContain('2023-12-25');
    });

    it('should handle URL properties', () => {
      const page = createMockPage({
        id: 'page-url',
        properties: {
          title: { title: [{ plain_text: 'URL Test' }] },
          Website: {
            url: 'https://example.com'
          }
        }
      });

      const result = service.convertPageToMarkdown(page);

      expect(result.content).toContain('[https://example.com](https://example.com)');
    });

    it('should handle email properties', () => {
      const page = createMockPage({
        id: 'page-email',
        properties: {
          title: { title: [{ plain_text: 'Email Test' }] },
          Contact: {
            email: 'test@example.com'
          }
        }
      });

      const result = service.convertPageToMarkdown(page);

      expect(result.content).toContain('[test@example.com](mailto:test@example.com)');
    });

    it('should handle phone properties', () => {
      const page = createMockPage({
        id: 'page-phone',
        properties: {
          title: { title: [{ plain_text: 'Phone Test' }] },
          Phone: {
            phone_number: '+1234567890'
          }
        }
      });

      const result = service.convertPageToMarkdown(page);

      expect(result.content).toContain('+1234567890');
    });

    it('should handle checkbox false', () => {
      const page = createMockPage({
        id: 'page-checkbox',
        properties: {
          title: { title: [{ plain_text: 'Checkbox Test' }] },
          IsComplete: {
            checkbox: false
          }
        }
      });

      const result = service.convertPageToMarkdown(page);

      expect(result.content).toContain('❌ No');
    });

    it('should handle empty multi-select', () => {
      const page = createMockPage({
        id: 'page-empty-multi',
        properties: {
          title: { title: [{ plain_text: 'Empty Multi Test' }] },
          Categories: {
            multi_select: []
          }
        }
      });

      const result = service.convertPageToMarkdown(page);

      expect(result.content).toContain('*Sin selecciones*');
    });

    it('should handle empty select', () => {
      const page = createMockPage({
        id: 'page-empty-select',
        properties: {
          title: { title: [{ plain_text: 'Empty Select Test' }] },
          Status: {
            select: null
          }
        }
      });

      const result = service.convertPageToMarkdown(page);

      expect(result.content).toContain('*Tipo de propiedad no soportado*'); // null select va a no soportado
    });

    it('should handle select without name', () => {
      const page = createMockPage({
        id: 'page-select-no-name',
        properties: {
          title: { title: [{ plain_text: 'Select No Name Test' }] },
          Status: {
            select: {} // select object sin name
          }
        }
      });

      const result = service.convertPageToMarkdown(page);

      expect(result.content).toContain('*Sin selección*');
    });

    it('should handle unsupported property types', () => {
      const page = createMockPage({
        id: 'page-unsupported',
        properties: {
          title: { title: [{ plain_text: 'Unsupported Test' }] },
          UnsupportedProp: {
            some_unknown_type: 'value'
          }
        }
      });

      const result = service.convertPageToMarkdown(page);

      expect(result.content).toContain('*Tipo de propiedad no soportado*');
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed page properties', () => {
      const page = createMockPage({
        id: 'page-malformed',
        properties: null as any
      });

      const result = service.convertPageToMarkdown(page);

      expect(result.content).toContain('*Error al procesar las propiedades de la página*');
    });

    it('should handle property extraction errors', () => {
      const page = createMockPage({
        id: 'page-error',
        properties: {
          title: { title: [{ plain_text: 'Error Test' }] },
          BadProperty: {
            get value() {
              throw new Error('Property access error');
            }
          }
        }
      });

      const result = service.convertPageToMarkdown(page);

      expect(result.content).toContain('*Tipo de propiedad no soportado*'); // los getters se evalúan como tipo no soportado
    });

    it('should handle value extraction errors', () => {
      const page = createMockPage({
        id: 'page-value-error',
        properties: {
          title: { title: [{ plain_text: 'Value Error Test' }] },
          ErrorProperty: {
            rich_text: [
              {
                get plain_text() {
                  throw new Error('Text access error');
                }
              }
            ]
          }
        }
      });

      const result = service.convertPageToMarkdown(page);

      expect(result.content).toContain('*Error al procesar el valor*');
    });

    it('should handle title extraction errors', () => {
      const page = {
        toJSON: vi.fn(),
        toNotionPageResponse: vi.fn(),
        id: 'page-title-error',
        get properties(): any {
          throw new Error('Properties access error');
        }
      } as Page;

      const result = service.convertPageToMarkdown(page);

      expect(result.metadata.title).toBe('Página page-tit');
    });

    it('should handle null property values', () => {
      const page = createMockPage({
        id: 'page-null-props',
        properties: {
          title: { title: [{ plain_text: 'Null Props Test' }] },
          NullProp: null,
          UndefinedProp: undefined,
          EmptyProp: ''
        }
      });

      const result = service.convertPageToMarkdown(page);

      expect(result.content).toContain('### NullProp');
      expect(result.content).toContain('*Valor no disponible*');
    });
  });

  describe('Edge Cases', () => {
    it('should handle title with only whitespace', () => {
      const page = createMockPage({
        id: 'page-whitespace',
        properties: {
          title: {
            title: [{ plain_text: '   \n\t   ' }]
          }
        }
      });

      const result = service.convertPageToMarkdown(page);

      expect(result.filename).toBe('-.md'); // espacios se convierten en guiones
    });

    it('should handle page with text fallback in title', () => {
      const page = createMockPage({
        id: 'page-text-fallback',
        properties: {
          title: {
            title: [{ text: { content: 'Text Fallback Title' } }]
          }
        }
      });

      const result = service.convertPageToMarkdown(page);

      expect(result.metadata.title).toBe('Text Fallback Title');
    });

    it('should handle rich_text with text content fallback', () => {
      const page = createMockPage({
        id: 'page-rich-fallback',
        properties: {
          title: {
            rich_text: [{ text: { content: 'Rich Text Fallback' } }]
          }
        }
      });

      const result = service.convertPageToMarkdown(page);

      expect(result.metadata.title).toBe('Rich Text Fallback');
    });

    it('should handle mixed content in rich_text array', () => {
      const page = createMockPage({
        id: 'page-mixed',
        properties: {
          title: { title: [{ plain_text: 'Mixed Content' }] },
          Description: {
            rich_text: [
              { plain_text: 'Start ' },
              { text: { content: 'middle ' } },
              { plain_text: 'end' }
            ]
          }
        }
      });

      const result = service.convertPageToMarkdown(page);

      expect(result.content).toContain('Start middle end');
    });

    it('should handle number property with zero value', () => {
      const page = createMockPage({
        id: 'page-zero',
        properties: {
          title: { title: [{ plain_text: 'Zero Test' }] },
          Count: {
            number: 0
          }
        }
      });

      const result = service.convertPageToMarkdown(page);

      expect(result.content).toContain('### Count');
      expect(result.content).toContain('0');
    });

    it('should handle date with missing start value', () => {
      const page = createMockPage({
        id: 'page-no-date',
        properties: {
          title: { title: [{ plain_text: 'No Date Test' }] },
          Date: {
            date: {}
          }
        }
      });

      const result = service.convertPageToMarkdown(page);

      expect(result.content).toContain('*Fecha no disponible*');
    });
  });
});
