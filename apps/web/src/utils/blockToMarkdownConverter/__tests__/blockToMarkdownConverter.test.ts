/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck - Suprimir errores de TypeScript para los mocks de Block en tests
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  convertBlocksToMarkdown,
  convertBlockToMarkdown,
  extractPlainTextFromRichText,
  registerBlockConverter,
  getSupportedBlockTypes,
  NotionRichText,
  BlockConverter
} from '../blockToMarkdownConverter';
import { Block } from '@/domain/entities';

// Helper para crear mocks de Block
const createMockBlock = (partial: Partial<Block>): Block => ({
  toJSON: vi.fn(),
  toNotionBlockResponse: vi.fn(),
  ...partial
} as Block);

describe('blockToMarkdownConverter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('extractPlainTextFromRichText', () => {
    it('should extract plain text from rich text array', () => {
      const richText: NotionRichText[] = [
        { plain_text: 'Hello ' },
        { plain_text: 'world!' }
      ];

      const result = extractPlainTextFromRichText(richText);

      expect(result).toBe('Hello world!');
    });

    it('should handle text content fallback', () => {
      const richText: NotionRichText[] = [
        { text: { content: 'Hello ' } },
        { text: { content: 'from text!' } }
      ];

      const result = extractPlainTextFromRichText(richText);

      expect(result).toBe('Hello from text!');
    });

    it('should handle mixed plain_text and text content', () => {
      const richText: NotionRichText[] = [
        { plain_text: 'Hello ' },
        { text: { content: 'mixed ' } },
        { plain_text: 'content!' }
      ];

      const result = extractPlainTextFromRichText(richText);

      expect(result).toBe('Hello mixed content!');
    });

    it('should return empty string for undefined input', () => {
      const result = extractPlainTextFromRichText(undefined);
      expect(result).toBe('');
    });

    it('should return empty string for non-array input', () => {
      const result = extractPlainTextFromRichText({} as any);
      expect(result).toBe('');
    });

    it('should handle empty array', () => {
      const result = extractPlainTextFromRichText([]);
      expect(result).toBe('');
    });

    it('should handle items with no text content', () => {
      const richText: NotionRichText[] = [
        {},
        { plain_text: 'valid text' },
        {}
      ];

      const result = extractPlainTextFromRichText(richText);
      expect(result).toBe('valid text');
    });
  });

  describe('convertBlockToMarkdown', () => {
    it('should convert paragraph block', () => {
      const block = createMockBlock({
        id: 'block-1',
        type: 'paragraph',
        data: {
          paragraph: {
            rich_text: [{ plain_text: 'This is a paragraph.' }]
          }
        }
      });

      const result = convertBlockToMarkdown(block);

      expect(result).toBe('This is a paragraph.\n\n');
    });

    it('should apply indentation correctly', () => {
      const block = createMockBlock({
        id: 'block-1',
        type: 'paragraph',
        data: {
          paragraph: {
            rich_text: [{ plain_text: 'Indented paragraph.' }]
          }
        }
      });

      const result = convertBlockToMarkdown(block, 1, { indentSpaces: 2 });

      expect(result).toBe('  Indented paragraph.\n\n');
    });

    it('should handle unsupported block type with comments', () => {
      const block = createMockBlock({
        id: 'block-1',
        type: 'unsupported_type',
        data: {
          unsupported_type: {
            rich_text: [{ plain_text: 'Some content' }]
          }
        }
      });

      const result = convertBlockToMarkdown(block, 0, { includeUnsupportedComments: true });

      expect(result).toBe('Some content *(unsupported_type)*\n\n');
    });

    it('should handle unsupported block type without comments', () => {
      const block = createMockBlock({
        id: 'block-1',
        type: 'unsupported_type',
        data: {
          unsupported_type: {
            rich_text: [{ plain_text: 'Some content' }]
          }
        }
      });

      const result = convertBlockToMarkdown(block, 0, { includeUnsupportedComments: false });

      expect(result).toBe('Some content\n\n');
    });

    it('should handle conversion errors gracefully', () => {
      const block = createMockBlock({
        id: 'block-1',
        type: 'paragraph',
        data: null as any
      });

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

      const result = convertBlockToMarkdown(block, 0, { includeUnsupportedComments: true });

      expect(result).toBe('<!-- Error al convertir bloque paragraph: block-1 -->\n\n');
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('convertBlocksToMarkdown', () => {
    it('should convert multiple blocks', () => {
      const blocks = [
        createMockBlock({
          id: 'block-1',
          type: 'paragraph',
          data: {
            paragraph: {
              rich_text: [{ plain_text: 'First paragraph.' }]
            }
          }
        }),
        createMockBlock({
          id: 'block-2',
          type: 'paragraph',
          data: {
            paragraph: {
              rich_text: [{ plain_text: 'Second paragraph.' }]
            }
          }
        })
      ];

      const result = convertBlocksToMarkdown(blocks);

      expect(result).toBe('First paragraph.\n\nSecond paragraph.\n\n');
    });

    it('should handle blocks with children', () => {
      const blocks = [
        createMockBlock({
          id: 'block-1',
          type: 'bulleted_list_item',
          data: {
            bulleted_list_item: {
              rich_text: [{ plain_text: 'Parent item' }]
            }
          },
          children: [
            createMockBlock({
              id: 'block-2',
              type: 'bulleted_list_item',
              data: {
                bulleted_list_item: {
                  rich_text: [{ plain_text: 'Child item' }]
                }
              }
            })
          ]
        })
      ];

      const result = convertBlocksToMarkdown(blocks);

      expect(result).toBe('- Parent item\n  - Child item\n');
    });

    it('should handle toggle blocks with children', () => {
      const blocks = [
        createMockBlock({
          id: 'block-1',
          type: 'toggle',
          data: {
            toggle: {
              rich_text: [{ plain_text: 'Toggle title' }]
            }
          },
          children: [
            createMockBlock({
              id: 'block-2',
              type: 'paragraph',
              data: {
                paragraph: {
                  rich_text: [{ plain_text: 'Toggle content' }]
                }
              }
            })
          ]
        })
      ];

      const result = convertBlocksToMarkdown(blocks);

      expect(result).toBe('<details>\n<summary>Toggle title</summary>\n\n  Toggle content\n\n</details>\n\n');
    });

    it('should handle toggle blocks without children', () => {
      const blocks = [
        createMockBlock({
          id: 'block-1',
          type: 'toggle',
          data: {
            toggle: {
              rich_text: [{ plain_text: 'Empty toggle' }]
            }
          }
        })
      ];

      const result = convertBlocksToMarkdown(blocks);

      expect(result).toBe('<details>\n<summary>Empty toggle</summary>\n\n</details>\n\n');
    });

    it('should handle empty blocks array', () => {
      const result = convertBlocksToMarkdown([]);
      expect(result).toBe('');
    });
  });

  describe('Image Block Conversion', () => {
    it('should convert external image block', () => {
      const block = createMockBlock({
        id: 'block-1',
        type: 'image',
        data: {
          image: {
            type: 'external',
            external: {
              url: 'https://example.com/image.jpg'
            }
          }
        }
      });

      const result = convertBlockToMarkdown(block);

      expect(result).toBe('![Imagen](https://example.com/image.jpg)\n\n');
    });

    it('should convert file image block', () => {
      const block = createMockBlock({
        id: 'block-1',
        type: 'image',
        data: {
          image: {
            type: 'file',
            file: {
              url: 'https://notion.so/image.jpg'
            }
          }
        }
      });

      const result = convertBlockToMarkdown(block);

      expect(result).toBe('![Imagen](https://notion.so/image.jpg)\n\n');
    });

    it('should handle image with caption', () => {
      const block = createMockBlock({
        id: 'block-1',
        type: 'image',
        data: {
          image: {
            type: 'external',
            external: {
              url: 'https://example.com/image.jpg'
            },
            caption: [
              { plain_text: 'Image caption' }
            ]
          }
        }
      });

      const result = convertBlockToMarkdown(block);

      expect(result).toBe('![Image caption](https://example.com/image.jpg)\n\n');
    });

    it('should handle file upload image', () => {
      const block = createMockBlock({
        id: 'block-1',
        type: 'image',
        data: {
          image: {
            file_upload: {
              id: 'file-123'
            }
          }
        }
      });

      const result = convertBlockToMarkdown(block);

      expect(result).toBe('<!-- Imagen subida (requiere descarga): file-123 -->\n\n');
    });

    it('should handle image without valid URL', () => {
      const block = createMockBlock({
        id: 'block-1',
        type: 'image',
        data: {
          image: {
            type: 'unknown'
          }
        }
      });

      const result = convertBlockToMarkdown(block);

      expect(result).toBe('<!-- Imagen sin URL válida -->\n\n');
    });

    it('should handle image without data', () => {
      const block = createMockBlock({
        id: 'block-1',
        type: 'image',
        data: {
          image: null
        }
      });

      const result = convertBlockToMarkdown(block);

      expect(result).toBe('<!-- Imagen sin datos -->\n\n');
    });
  });

  describe('Heading Block Conversion', () => {
    it('should convert heading_1 block', () => {
      const block = createMockBlock({
        id: 'block-1',
        type: 'heading_1',
        data: {
          heading_1: {
            rich_text: [{ plain_text: 'Main Title' }]
          }
        }
      });

      const result = convertBlockToMarkdown(block);

      expect(result).toBe('# Main Title\n\n');
    });

    it('should convert heading_2 block', () => {
      const block = createMockBlock({
        id: 'block-1',
        type: 'heading_2',
        data: {
          heading_2: {
            rich_text: [{ plain_text: 'Subtitle' }]
          }
        }
      });

      const result = convertBlockToMarkdown(block);

      expect(result).toBe('## Subtitle\n\n');
    });

    it('should convert heading_3 block', () => {
      const block = createMockBlock({
        id: 'block-1',
        type: 'heading_3',
        data: {
          heading_3: {
            rich_text: [{ plain_text: 'Sub-subtitle' }]
          }
        }
      });

      const result = convertBlockToMarkdown(block);

      expect(result).toBe('### Sub-subtitle\n\n');
    });

    it('should convert toggle heading', () => {
      const block = createMockBlock({
        id: 'block-1',
        type: 'heading_2',
        data: {
          heading_2: {
            rich_text: [{ plain_text: 'Toggle Heading' }],
            is_toggleable: true
          }
        }
      });

      const result = convertBlockToMarkdown(block);

      expect(result).toBe('<details>\n<summary><strong>## Toggle Heading</strong></summary>\n\n');
    });

    it('should handle heading without text', () => {
      const block = createMockBlock({
        id: 'block-1',
        type: 'heading_1',
        data: {
          heading_1: {}
        }
      });

      const result = convertBlockToMarkdown(block);

      expect(result).toBe('');
    });
  });

  describe('List Block Conversion', () => {
    it('should convert bulleted list item', () => {
      const block = createMockBlock({
        id: 'block-1',
        type: 'bulleted_list_item',
        data: {
          bulleted_list_item: {
            rich_text: [{ plain_text: 'Bullet point' }]
          }
        }
      });

      const result = convertBlockToMarkdown(block);

      expect(result).toBe('- Bullet point\n');
    });

    it('should convert numbered list item', () => {
      const block = createMockBlock({
        id: 'block-1',
        type: 'numbered_list_item',
        data: {
          numbered_list_item: {
            rich_text: [{ plain_text: 'Numbered item' }]
          }
        }
      });

      const result = convertBlockToMarkdown(block);

      expect(result).toBe('1. Numbered item\n');
    });

    it('should handle empty list items', () => {
      const block = createMockBlock({
        id: 'block-1',
        type: 'bulleted_list_item',
        data: {
          bulleted_list_item: {}
        }
      });

      const result = convertBlockToMarkdown(block);

      expect(result).toBe('');
    });
  });

  describe('Todo Block Conversion', () => {
    it('should convert checked todo', () => {
      const block = createMockBlock({
        id: 'block-1',
        type: 'to_do',
        data: {
          to_do: {
            rich_text: [{ plain_text: 'Completed task' }],
            checked: true
          }
        }
      });

      const result = convertBlockToMarkdown(block);

      expect(result).toBe('- [x] Completed task\n');
    });

    it('should convert unchecked todo', () => {
      const block = createMockBlock({
        id: 'block-1',
        type: 'to_do',
        data: {
          to_do: {
            rich_text: [{ plain_text: 'Pending task' }],
            checked: false
          }
        }
      });

      const result = convertBlockToMarkdown(block);

      expect(result).toBe('- [ ] Pending task\n');
    });

    it('should handle todo without checked property', () => {
      const block = createMockBlock({
        id: 'block-1',
        type: 'to_do',
        data: {
          to_do: {
            rich_text: [{ plain_text: 'Task without status' }]
          }
        }
      });

      const result = convertBlockToMarkdown(block);

      expect(result).toBe('- [ ] Task without status\n');
    });
  });

  describe('Other Block Types', () => {
    it('should convert divider block', () => {
      const block = createMockBlock({
        id: 'block-1',
        type: 'divider',
        data: {}
      });

      const result = convertBlockToMarkdown(block);

      expect(result).toBe('---\n\n');
    });

    it('should convert quote block', () => {
      const block = createMockBlock({
        id: 'block-1',
        type: 'quote',
        data: {
          quote: {
            rich_text: [{ plain_text: 'This is a quote' }]
          }
        }
      });

      const result = convertBlockToMarkdown(block);

      expect(result).toBe('> This is a quote\n\n');
    });

    it('should convert code block with language', () => {
      const block = createMockBlock({
        id: 'block-1',
        type: 'code',
        data: {
          code: {
            rich_text: [{ plain_text: 'console.log("Hello");' }],
            language: 'javascript'
          }
        }
      });

      const result = convertBlockToMarkdown(block);

      expect(result).toBe('```javascript\nconsole.log("Hello");\n```\n\n');
    });

    it('should convert code block without language', () => {
      const block = createMockBlock({
        id: 'block-1',
        type: 'code',
        data: {
          code: {
            rich_text: [{ plain_text: 'some code' }]
          }
        }
      });

      const result = convertBlockToMarkdown(block);

      expect(result).toBe('```\nsome code\n```\n\n');
    });

    it('should handle empty code block', () => {
      const block = createMockBlock({
        id: 'block-1',
        type: 'code',
        data: {
          code: {}
        }
      });

      const result = convertBlockToMarkdown(block);

      expect(result).toBe('```\n\n```\n\n');
    });

    it('should convert toggle block', () => {
      const block = createMockBlock({
        id: 'block-1',
        type: 'toggle',
        data: {
          toggle: {
            rich_text: [{ plain_text: 'Click to expand' }]
          }
        }
      });

      const result = convertBlockToMarkdown(block);

      expect(result).toBe('<details>\n<summary>Click to expand</summary>\n\n');
    });
  });

  describe('Options and Configuration', () => {
    it('should use custom indent spaces', () => {
      const block = createMockBlock({
        id: 'block-1',
        type: 'paragraph',
        data: {
          paragraph: {
            rich_text: [{ plain_text: 'Indented text' }]
          }
        }
      });

      const result = convertBlockToMarkdown(block, 1, { indentSpaces: 4 });

      expect(result).toBe('    Indented text\n\n');
    });

    it('should handle deep nesting with multiple blocks', () => {
      const blocks = [
        createMockBlock({
          id: 'block-1',
          type: 'bulleted_list_item',
          data: {
            bulleted_list_item: {
              rich_text: [{ plain_text: 'Level 1' }]
            }
          },
          children: [
            createMockBlock({
              id: 'block-2',
              type: 'bulleted_list_item',
              data: {
                bulleted_list_item: {
                  rich_text: [{ plain_text: 'Level 2' }]
                }
              },
              children: [
                createMockBlock({
                  id: 'block-3',
                  type: 'paragraph',
                  data: {
                    paragraph: {
                      rich_text: [{ plain_text: 'Level 3 paragraph' }]
                    }
                  }
                })
              ]
            })
          ]
        })
      ];

      const result = convertBlocksToMarkdown(blocks, 0, { indentSpaces: 2 });

      expect(result).toBe('- Level 1\n  - Level 2\n    Level 3 paragraph\n\n');
    });
  });

  describe('Utility Functions', () => {
    it('should register new block converter', () => {
      const customConverter: BlockConverter = (block, indent) => {
        return `${indent}Custom: ${block.id}\n\n`;
      };

      registerBlockConverter('custom_type', customConverter);

      const block = createMockBlock({
        id: 'block-1',
        type: 'custom_type',
        data: {}
      });

      const result = convertBlockToMarkdown(block);

      expect(result).toBe('Custom: block-1\n\n');
    });

    it('should get supported block types', () => {
      const supportedTypes = getSupportedBlockTypes();

      expect(supportedTypes).toContain('paragraph');
      expect(supportedTypes).toContain('heading_1');
      expect(supportedTypes).toContain('bulleted_list_item');
      expect(supportedTypes).toContain('image');
      expect(Array.isArray(supportedTypes)).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle blocks with malformed data', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

      // Create a block that will cause an error during conversion
      // Using a getter that throws an error
      const block: any = {
        id: 'block-1',
        type: 'paragraph',
        get data() {
          throw new Error('Test error');
        }
      };

      const result = convertBlockToMarkdown(block);

      // Should handle gracefully and return error comment
      expect(result).toContain('Error al convertir bloque');
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('should handle missing data property', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

      const block = createMockBlock({
        id: 'block-1',
        type: 'paragraph',
        data: undefined as any
      });

      const result = convertBlockToMarkdown(block);

      expect(result).toContain('Error al convertir bloque');
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('Edge Cases', () => {
    it('should handle blocks with empty string content', () => {
      const block = createMockBlock({
        id: 'block-1',
        type: 'paragraph',
        data: {
          paragraph: {
            rich_text: [{ plain_text: '' }]
          }
        }
      });

      const result = convertBlockToMarkdown(block);

      expect(result).toBe('');
    });

    it('should handle blocks with only whitespace', () => {
      const block = createMockBlock({
        id: 'block-1',
        type: 'paragraph',
        data: {
          paragraph: {
            rich_text: [{ plain_text: '   \n\t   ' }]
          }
        }
      });

      const result = convertBlockToMarkdown(block);

      expect(result).toBe('');
    });

    it('should handle complex rich text structures', () => {
      const richText: NotionRichText[] = [
        { plain_text: 'Bold text' },
        { text: { content: ' and ' } },
        { plain_text: 'italic text' },
        {},
        { plain_text: '!' }
      ];

      const result = extractPlainTextFromRichText(richText);

      expect(result).toBe('Bold text and italic text!');
    });

    it('should maintain proper line endings and spacing', () => {
      const blocks = [
        createMockBlock({
          id: 'block-1',
          type: 'heading_1',
          data: {
            heading_1: {
              rich_text: [{ plain_text: 'Title' }]
            }
          }
        }),
        createMockBlock({
          id: 'block-2',
          type: 'paragraph',
          data: {
            paragraph: {
              rich_text: [{ plain_text: 'Paragraph content.' }]
            }
          }
        }),
        createMockBlock({
          id: 'block-3',
          type: 'divider',
          data: {}
        })
      ];

      const result = convertBlocksToMarkdown(blocks);

      expect(result).toBe('# Title\n\nParagraph content.\n\n---\n\n');
    });
  });
});
