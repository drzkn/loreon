import { describe, it, expect } from 'vitest';
import { Database } from '../Database';
import { NotionDatabaseResponse } from '../../../../shared/types/notion.types';

describe('Database', () => {
  const mockNotionDatabaseResponse: NotionDatabaseResponse = {
    id: 'db-123',
    title: [
      {
        plain_text: 'Test Database',
        href: undefined
      }
    ],
    properties: {
      Title: {
        id: 'title',
        name: 'Title',
        type: 'title',
        title: {}
      },
      Status: {
        id: '%3AsOp',
        name: 'Status',
        type: 'select',
        select: {
          options: [
            {
              id: 'opt1',
              name: 'Active',
              color: 'green'
            }
          ]
        }
      }
    },
    created_time: '2023-01-01T00:00:00.000Z',
    last_edited_time: '2023-01-02T00:00:00.000Z',
    url: 'https://notion.so/db-123'
  };

  describe('Constructor', () => {
    it('should create a Database instance with all properties', () => {
      const database = new Database(
        'test-id',
        'Test Database',
        { property1: 'value1' },
        '2023-01-01T00:00:00.000Z',
        '2023-01-02T00:00:00.000Z',
        'https://notion.so/test-id'
      );

      expect(database.id).toBe('test-id');
      expect(database.title).toBe('Test Database');
      expect(database.properties).toEqual({ property1: 'value1' });
      expect(database.createdTime).toBe('2023-01-01T00:00:00.000Z');
      expect(database.lastEditedTime).toBe('2023-01-02T00:00:00.000Z');
      expect(database.url).toBe('https://notion.so/test-id');
    });

    it('should create a Database instance with only required properties', () => {
      const database = new Database('test-id', 'Test Database', {});

      expect(database.id).toBe('test-id');
      expect(database.title).toBe('Test Database');
      expect(database.properties).toEqual({});
      expect(database.createdTime).toBeUndefined();
      expect(database.lastEditedTime).toBeUndefined();
      expect(database.url).toBeUndefined();
    });
  });

  describe('fromNotionResponse', () => {
    it('should create Database from NotionDatabaseResponse', () => {
      const database = Database.fromNotionResponse(mockNotionDatabaseResponse);

      expect(database.id).toBe('db-123');
      expect(database.title).toBe('Test Database');
      expect(database.properties).toEqual(mockNotionDatabaseResponse.properties);
      expect(database.createdTime).toBe('2023-01-01T00:00:00.000Z');
      expect(database.lastEditedTime).toBe('2023-01-02T00:00:00.000Z');
      expect(database.url).toBe('https://notion.so/db-123');
    });

    it('should handle database with empty title array', () => {
      const emptyTitleResponse: NotionDatabaseResponse = {
        ...mockNotionDatabaseResponse,
        title: []
      };

      const database = Database.fromNotionResponse(emptyTitleResponse);

      expect(database.title).toBe('Sin título');
    });

    it('should handle database with undefined title', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const undefinedTitleResponse: NotionDatabaseResponse = {
        ...mockNotionDatabaseResponse,
        title: undefined as any
      };

      const database = Database.fromNotionResponse(undefinedTitleResponse);

      expect(database.title).toBe('Sin título');
    });

    it('should handle database with null title content', () => {
      const nullTitleResponse: NotionDatabaseResponse = {
        ...mockNotionDatabaseResponse,
        title: [
          {
            plain_text: '',
            href: undefined
          }
        ]
      };

      const database = Database.fromNotionResponse(nullTitleResponse);

      expect(database.title).toBe('Sin título');
    });

    it('should handle database with multiple title elements', () => {
      const multipleTitleResponse: NotionDatabaseResponse = {
        ...mockNotionDatabaseResponse,
        title: [
          {
            plain_text: 'First Title',
            href: undefined
          },
          {
            plain_text: 'Second Title',
            href: undefined
          }
        ]
      };

      const database = Database.fromNotionResponse(multipleTitleResponse);

      expect(database.title).toBe('First Title');
    });

    it('should handle database with title containing href', () => {
      const titleWithHrefResponse: NotionDatabaseResponse = {
        ...mockNotionDatabaseResponse,
        title: [
          {
            plain_text: 'Linked Database',
            href: 'https://example.com'
          }
        ]
      };

      const database = Database.fromNotionResponse(titleWithHrefResponse);

      expect(database.title).toBe('Linked Database');
    });

    it('should handle database with empty properties', () => {
      const emptyPropsResponse: NotionDatabaseResponse = {
        ...mockNotionDatabaseResponse,
        properties: {}
      };

      const database = Database.fromNotionResponse(emptyPropsResponse);

      expect(database.properties).toEqual({});
    });

    it('should handle database with undefined properties', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const undefinedPropsResponse: NotionDatabaseResponse = {
        ...mockNotionDatabaseResponse,
        properties: undefined as any
      };

      const database = Database.fromNotionResponse(undefinedPropsResponse);

      expect(database.properties).toEqual({});
    });
  });

  describe('toJSON', () => {
    it('should serialize Database to JSON correctly', () => {
      const database = new Database(
        'test-id',
        'Test Database',
        { property1: 'value1' },
        '2023-01-01T00:00:00.000Z',
        '2023-01-02T00:00:00.000Z',
        'https://notion.so/test-id'
      );

      const json = database.toJSON();

      expect(json).toEqual({
        id: 'test-id',
        title: 'Test Database',
        properties: { property1: 'value1' },
        createdTime: '2023-01-01T00:00:00.000Z',
        lastEditedTime: '2023-01-02T00:00:00.000Z',
        url: 'https://notion.so/test-id'
      });
    });

    it('should serialize Database with undefined optional properties', () => {
      const database = new Database('test-id', 'Test Database', {});

      const json = database.toJSON();

      expect(json).toEqual({
        id: 'test-id',
        title: 'Test Database',
        properties: {},
        createdTime: undefined,
        lastEditedTime: undefined,
        url: undefined
      });
    });

    it('should serialize Database with complex properties', () => {
      const complexProperties = {
        Title: {
          id: 'title',
          type: 'title'
        },
        Tags: {
          id: 'tags',
          type: 'multi_select',
          options: ['tag1', 'tag2']
        },
        Date: {
          id: 'date',
          type: 'date'
        }
      };

      const database = new Database('test-id', 'Complex Database', complexProperties);

      const json = database.toJSON();

      expect(json.properties).toEqual(complexProperties);
    });
  });

  describe('Round-trip conversion', () => {
    it('should maintain data integrity through fromNotionResponse -> toJSON', () => {
      const database = Database.fromNotionResponse(mockNotionDatabaseResponse);
      const json = database.toJSON();

      expect(json.id).toBe(mockNotionDatabaseResponse.id);
      expect(json.title).toBe('Test Database');
      expect(json.properties).toEqual(mockNotionDatabaseResponse.properties);
      expect(json.createdTime).toBe(mockNotionDatabaseResponse.created_time);
      expect(json.lastEditedTime).toBe(mockNotionDatabaseResponse.last_edited_time);
      expect(json.url).toBe(mockNotionDatabaseResponse.url);
    });
  });

  describe('Edge Cases', () => {
    it('should handle special characters in title', () => {
      const specialTitleResponse: NotionDatabaseResponse = {
        ...mockNotionDatabaseResponse,
        title: [
          {
            plain_text: 'Special chars: éñü 中文 🚀 <script>alert("test")</script>',
            href: undefined
          }
        ]
      };

      const database = Database.fromNotionResponse(specialTitleResponse);

      expect(database.title).toBe('Special chars: éñü 中文 🚀 <script>alert("test")</script>');
    });

    it('should handle null/undefined values in properties', () => {
      const database = new Database(
        'test-id',
        'Test Database',
        {
          nullValue: null,
          undefinedValue: undefined,
          emptyString: '',
          emptyArray: [],
          emptyObject: {},
          nestedObject: {
            nested: 'value',
            deepNested: {
              value: 123
            }
          }
        }
      );

      const json = database.toJSON();

      expect(json.properties).toEqual({
        nullValue: null,
        undefinedValue: undefined,
        emptyString: '',
        emptyArray: [],
        emptyObject: {},
        nestedObject: {
          nested: 'value',
          deepNested: {
            value: 123
          }
        }
      });
    });

    it('should handle very long titles', () => {
      const longTitle = 'A'.repeat(1000);
      const longTitleResponse: NotionDatabaseResponse = {
        ...mockNotionDatabaseResponse,
        title: [
          {
            plain_text: longTitle,
            href: undefined
          }
        ]
      };

      const database = Database.fromNotionResponse(longTitleResponse);

      expect(database.title).toBe(longTitle);
      expect(database.title.length).toBe(1000);
    });
  });
});
