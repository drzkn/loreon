import { describe, it, expect, afterEach } from 'vitest';
import { Block } from '../Block';
import { NotionBlockResponse } from '../../../../shared/types/notion.types';
import { mockNotionBlockResponse, mockNotionBlockWithChildren } from '@/shared/types/__mocks__/NotionBlockResponse';

// Usar el sistema centralizado de mocks
import {
  createTestSetup
} from '@/mocks';

describe('Block', () => {
  const { teardown } = createTestSetup(); // ✅ Console mocks centralizados

  afterEach(() => {
    teardown(); // ✅ Limpieza automática
  });

  describe('Constructor', () => {
    it('should create a Block instance with all properties', () => {
      const block = new Block(
        'test-id',
        'paragraph',
        { content: 'test content' },
        '2023-01-01T00:00:00.000Z',
        '2023-01-02T00:00:00.000Z',
        false,
        []
      );

      expect(block.id).toBe('test-id');
      expect(block.type).toBe('paragraph');
      expect(block.data).toEqual({ content: 'test content' });
      expect(block.createdTime).toBe('2023-01-01T00:00:00.000Z');
      expect(block.lastEditedTime).toBe('2023-01-02T00:00:00.000Z');
      expect(block.hasChildren).toBe(false);
      expect(block.children).toEqual([]);
    });

    it('should create a Block instance with only required properties', () => {
      const block = new Block('test-id', 'paragraph', { content: 'test' });

      expect(block.id).toBe('test-id');
      expect(block.type).toBe('paragraph');
      expect(block.data).toEqual({ content: 'test' });
      expect(block.createdTime).toBeUndefined();
      expect(block.lastEditedTime).toBeUndefined();
      expect(block.hasChildren).toBeUndefined();
      expect(block.children).toBeUndefined();
    });

    it('should handle empty data object', () => {
      const block = new Block('test-id', 'paragraph', {});

      expect(block.id).toBe('test-id');
      expect(block.type).toBe('paragraph');
      expect(block.data).toEqual({});
    });
  });

  describe('fromNotionResponse', () => {
    it('should create Block from NotionBlockResponse and extract data correctly', () => {
      const block = Block.fromNotionResponse(mockNotionBlockResponse);

      expect(block.id).toBe('block-123');
      expect(block.type).toBe('paragraph');
      expect(block.createdTime).toBe('2023-01-01T00:00:00.000Z');
      expect(block.lastEditedTime).toBe('2023-01-02T00:00:00.000Z');
      expect(block.hasChildren).toBe(false);
      expect(block.children).toEqual([]);
      expect(block.data).toEqual({
        paragraph: {
          rich_text: [
            {
              type: 'text',
              text: { content: 'Hello World' },
              plain_text: 'Hello World'
            }
          ]
        }
      });
    });

    it('should handle block with children', () => {
      const block = Block.fromNotionResponse(mockNotionBlockWithChildren);

      expect(block.id).toBe('block-456');
      expect(block.type).toBe('heading_1');
      expect(block.hasChildren).toBe(true);
      expect(block.children).toEqual([]);
      expect(block.data).toEqual({
        heading_1: {
          rich_text: [
            {
              type: 'text',
              text: { content: 'Main Title' },
              plain_text: 'Main Title'
            }
          ]
        },
        children: [
          {
            id: 'child-789',
            type: 'paragraph',
            created_time: '2023-01-01T00:00:00.000Z',
            last_edited_time: '2023-01-02T00:00:00.000Z',
            has_children: false,
            paragraph: {
              rich_text: [
                {
                  type: 'text',
                  text: { content: 'Child content' },
                  plain_text: 'Child content'
                }
              ]
            }
          }
        ]
      });
    });

    it('should handle different block types', () => {
      const codeBlock: NotionBlockResponse = {
        id: 'code-123',
        type: 'code',
        created_time: '2023-01-01T00:00:00.000Z',
        last_edited_time: '2023-01-02T00:00:00.000Z',
        has_children: false,
        code: {
          caption: [],
          rich_text: [
            {
              type: 'text',
              text: { content: 'console.log("Hello")' },
              plain_text: 'console.log("Hello")'
            }
          ],
          language: 'javascript'
        }
      };

      const block = Block.fromNotionResponse(codeBlock);

      expect(block.type).toBe('code');
      expect(block.data.code).toEqual(codeBlock.code);
    });

    it('should handle minimal NotionBlockResponse', () => {
      const minimalResponse: NotionBlockResponse = {
        id: 'minimal-123',
        type: 'divider',
        created_time: '2023-01-01T00:00:00.000Z',
        last_edited_time: '2023-01-02T00:00:00.000Z',
        has_children: false
      };

      const block = Block.fromNotionResponse(minimalResponse);

      expect(block.id).toBe('minimal-123');
      expect(block.type).toBe('divider');
      expect(block.data).toEqual({});
    });
  });

  describe('toJSON', () => {
    it('should serialize Block to JSON correctly', () => {
      const block = new Block(
        'test-id',
        'paragraph',
        { content: 'test content' },
        '2023-01-01T00:00:00.000Z',
        '2023-01-02T00:00:00.000Z',
        false,
        []
      );

      const json = block.toJSON();

      expect(json).toEqual({
        id: 'test-id',
        type: 'paragraph',
        data: { content: 'test content' },
        createdTime: '2023-01-01T00:00:00.000Z',
        lastEditedTime: '2023-01-02T00:00:00.000Z',
        hasChildren: false,
        children: []
      });
    });

    it('should serialize Block with children recursively', () => {
      const childBlock = new Block('child-id', 'paragraph', { content: 'child content' });
      const parentBlock = new Block(
        'parent-id',
        'heading_1',
        { content: 'parent content' },
        '2023-01-01T00:00:00.000Z',
        '2023-01-02T00:00:00.000Z',
        true,
        [childBlock]
      );

      const json = parentBlock.toJSON();

      expect(json.children).toHaveLength(1);
      expect((json.children as Record<string, unknown>[])[0]).toEqual({
        id: 'child-id',
        type: 'paragraph',
        data: { content: 'child content' },
        createdTime: undefined,
        lastEditedTime: undefined,
        hasChildren: undefined,
        children: undefined
      });
    });

    it('should handle undefined optional properties', () => {
      const block = new Block('test-id', 'paragraph', { content: 'test' });

      const json = block.toJSON();

      expect(json).toEqual({
        id: 'test-id',
        type: 'paragraph',
        data: { content: 'test' },
        createdTime: undefined,
        lastEditedTime: undefined,
        hasChildren: undefined,
        children: undefined
      });
    });

    it('should handle empty children array', () => {
      const block = new Block(
        'test-id',
        'paragraph',
        { content: 'test' },
        undefined,
        undefined,
        false,
        []
      );

      const json = block.toJSON();

      expect(json.children).toEqual([]);
    });
  });

  describe('toNotionBlockResponse', () => {
    it('should convert Block back to NotionBlockResponse format', () => {
      const block = Block.fromNotionResponse(mockNotionBlockResponse);
      const convertedResponse = block.toNotionBlockResponse();

      expect(convertedResponse.id).toBe(mockNotionBlockResponse.id);
      expect(convertedResponse.type).toBe(mockNotionBlockResponse.type);
      expect(convertedResponse.created_time).toBe(mockNotionBlockResponse.created_time);
      expect(convertedResponse.last_edited_time).toBe(mockNotionBlockResponse.last_edited_time);
      expect(convertedResponse.has_children).toBe(mockNotionBlockResponse.has_children);
      expect(convertedResponse.paragraph).toEqual(mockNotionBlockResponse.paragraph);
    });

    it('should handle Block with custom data', () => {
      const block = new Block(
        'custom-id',
        'custom_type',
        {
          custom_property: 'custom_value',
          nested_prop: { nested: 'value' }
        },
        '2023-01-01T00:00:00.000Z',
        '2023-01-02T00:00:00.000Z',
        true
      );

      const response = block.toNotionBlockResponse();

      expect(response).toEqual({
        id: 'custom-id',
        type: 'custom_type',
        created_time: '2023-01-01T00:00:00.000Z',
        last_edited_time: '2023-01-02T00:00:00.000Z',
        has_children: true,
        custom_property: 'custom_value',
        nested_prop: { nested: 'value' }
      });
    });

    it('should handle Block with undefined optional properties', () => {
      const block = new Block('test-id', 'paragraph', { content: 'test' });

      const response = block.toNotionBlockResponse();

      expect(response).toEqual({
        id: 'test-id',
        type: 'paragraph',
        created_time: undefined,
        last_edited_time: undefined,
        has_children: undefined,
        content: 'test'
      });
    });

    it('should handle empty data object', () => {
      const block = new Block(
        'empty-id',
        'divider',
        {},
        '2023-01-01T00:00:00.000Z',
        '2023-01-02T00:00:00.000Z',
        false
      );

      const response = block.toNotionBlockResponse();

      expect(response).toEqual({
        id: 'empty-id',
        type: 'divider',
        created_time: '2023-01-01T00:00:00.000Z',
        last_edited_time: '2023-01-02T00:00:00.000Z',
        has_children: false
      });
    });
  });

  describe('Round-trip conversion', () => {
    it('should maintain data integrity through fromNotionResponse -> toNotionBlockResponse', () => {
      const complexBlockResponse: NotionBlockResponse = {
        id: 'complex-123',
        type: 'code',
        created_time: '2023-01-01T00:00:00.000Z',
        last_edited_time: '2023-01-02T00:00:00.000Z',
        has_children: false,
        code: {
          caption: [],
          rich_text: [
            {
              type: 'text',
              text: { content: 'console.log("Hello")' },
              plain_text: 'console.log("Hello")'
            }
          ],
          language: 'javascript'
        },
        archived: false,
        in_trash: false
      };

      const block = Block.fromNotionResponse(complexBlockResponse);
      const convertedResponse = block.toNotionBlockResponse();

      expect(convertedResponse.id).toBe(complexBlockResponse.id);
      expect(convertedResponse.type).toBe(complexBlockResponse.type);
      expect(convertedResponse.code).toEqual(complexBlockResponse.code);
      expect(convertedResponse.archived).toBe(false);
      expect(convertedResponse.in_trash).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('should handle null/undefined values in data', () => {
      const block = new Block(
        'test-id',
        'paragraph',
        {
          nullValue: null,
          undefinedValue: undefined,
          emptyString: '',
          emptyArray: [],
          emptyObject: {}
        }
      );

      const json = block.toJSON();
      const response = block.toNotionBlockResponse();

      expect(json.data).toEqual({
        nullValue: null,
        undefinedValue: undefined,
        emptyString: '',
        emptyArray: [],
        emptyObject: {}
      });

      expect(response.nullValue).toBe(null);
      expect(response.undefinedValue).toBe(undefined);
      expect(response.emptyString).toBe('');
      expect(response.emptyArray).toEqual([]);
      expect(response.emptyObject).toEqual({});
    });

    it('should handle special characters in block content', () => {
      const specialContent = {
        content: 'Special chars: éñü 中文 🚀 <script>alert("test")</script>'
      };

      const block = new Block('special-id', 'paragraph', specialContent);
      const json = block.toJSON();
      const response = block.toNotionBlockResponse();

      expect(json.data).toEqual(specialContent);
      expect(response.content).toBe(specialContent.content);
    });
  });
});
