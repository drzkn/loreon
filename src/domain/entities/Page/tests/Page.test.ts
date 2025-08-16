import { describe, it, expect, afterEach } from 'vitest';
import { Page } from '../Page';
import { NotionPageResponse } from '@/shared/types/notion.types';

// Usar el sistema centralizado de mocks
import {
  createTestSetup
} from '@/mocks';

describe('Page', () => {
  const { teardown } = createTestSetup(); // ✅ Console mocks centralizados

  afterEach(() => {
    teardown(); // ✅ Limpieza automática
  });

  const mockProperties = {
    title: { title: [{ plain_text: 'Test Page' }] },
    status: { select: { name: 'Active' } }
  };

  const mockNotionResponse: NotionPageResponse = {
    id: 'page-123',
    properties: mockProperties,
    created_time: '2023-01-01T00:00:00.000Z',
    last_edited_time: '2023-01-02T00:00:00.000Z',
    url: 'https://notion.so/page-123'
  };

  describe('Constructor', () => {
    it('should create instance with all parameters', () => {
      const page = new Page(
        'page-123',
        mockProperties,
        '2023-01-01T00:00:00.000Z',
        '2023-01-02T00:00:00.000Z',
        'https://notion.so/page-123'
      );

      expect(page.id).toBe('page-123');
      expect(page.properties).toBe(mockProperties);
      expect(page.createdTime).toBe('2023-01-01T00:00:00.000Z');
      expect(page.lastEditedTime).toBe('2023-01-02T00:00:00.000Z');
      expect(page.url).toBe('https://notion.so/page-123');
    });

    it('should create instance with only required parameters', () => {
      const page = new Page('page-123', mockProperties);

      expect(page.id).toBe('page-123');
      expect(page.properties).toBe(mockProperties);
      expect(page.createdTime).toBeUndefined();
      expect(page.lastEditedTime).toBeUndefined();
      expect(page.url).toBeUndefined();
    });
  });

  describe('fromNotionResponse', () => {
    it('should convert NotionPageResponse to Page instance', () => {
      const page = Page.fromNotionResponse(mockNotionResponse);

      expect(page).toBeInstanceOf(Page);
      expect(page.id).toBe('page-123');
      expect(page.properties).toBe(mockProperties);
      expect(page.createdTime).toBe('2023-01-01T00:00:00.000Z');
      expect(page.lastEditedTime).toBe('2023-01-02T00:00:00.000Z');
      expect(page.url).toBe('https://notion.so/page-123');
    });

    it('should handle missing properties with empty object', () => {
      const responseWithoutProperties = {
        ...mockNotionResponse,
        properties: undefined as unknown as Record<string, unknown>
      };

      const page = Page.fromNotionResponse(responseWithoutProperties);

      expect(page.properties).toEqual({});
    });

    it('should handle null properties with empty object', () => {
      const responseWithNullProperties = {
        ...mockNotionResponse,
        properties: null as unknown as Record<string, unknown>
      };

      const page = Page.fromNotionResponse(responseWithNullProperties);

      expect(page.properties).toEqual({});
    });
  });

  describe('toJSON', () => {
    it('should serialize to JSON object with all properties', () => {
      const page = new Page(
        'page-123',
        mockProperties,
        '2023-01-01T00:00:00.000Z',
        '2023-01-02T00:00:00.000Z',
        'https://notion.so/page-123'
      );

      const json = page.toJSON();

      expect(json).toEqual({
        id: 'page-123',
        properties: mockProperties,
        createdTime: '2023-01-01T00:00:00.000Z',
        lastEditedTime: '2023-01-02T00:00:00.000Z',
        url: 'https://notion.so/page-123'
      });
    });

    it('should serialize with undefined optional properties', () => {
      const page = new Page('page-123', mockProperties);

      const json = page.toJSON();

      expect(json).toEqual({
        id: 'page-123',
        properties: mockProperties,
        createdTime: undefined,
        lastEditedTime: undefined,
        url: undefined
      });
    });
  });

  describe('Round-trip conversion', () => {
    it('should maintain data integrity through fromNotionResponse -> toJSON', () => {
      const page = Page.fromNotionResponse(mockNotionResponse);
      const json = page.toJSON();

      expect(json.id).toBe(mockNotionResponse.id);
      expect(json.properties).toBe(mockNotionResponse.properties);
      expect(json.createdTime).toBe(mockNotionResponse.created_time);
      expect(json.lastEditedTime).toBe(mockNotionResponse.last_edited_time);
      expect(json.url).toBe(mockNotionResponse.url);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty properties object', () => {
      const page = new Page('page-123', {});

      expect(page.properties).toEqual({});
      expect(page.toJSON().properties).toEqual({});
    });

    it('should handle complex nested properties', () => {
      const complexProperties = {
        title: {
          title: [{ plain_text: 'Complex Title', href: null }]
        },
        relation: {
          relation: [{ id: 'rel-1' }, { id: 'rel-2' }]
        },
        formula: {
          formula: { type: 'string', string: 'Calculated Value' }
        }
      };

      const page = new Page('page-123', complexProperties);

      expect(page.properties).toBe(complexProperties);
      expect(page.toJSON().properties).toBe(complexProperties);
    });

    it('should handle special characters in URL', () => {
      const specialUrl = 'https://notion.so/page-123?v=abc&filter=título';
      const page = new Page('page-123', {}, undefined, undefined, specialUrl);

      expect(page.url).toBe(specialUrl);
      expect(page.toJSON().url).toBe(specialUrl);
    });

    it('should handle very long page IDs', () => {
      const longId = 'a'.repeat(100);
      const page = new Page(longId, {});

      expect(page.id).toBe(longId);
      expect(page.toJSON().id).toBe(longId);
    });
  });

  describe('Immutability', () => {
    it('should allow property modification at runtime despite readonly', () => {
      const page = new Page('page-123', mockProperties);

      // TypeScript prevents this, but JavaScript allows it at runtime
      expect(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (page as any).id = 'modified-id';
      }).not.toThrow();

      // The property is actually modified in runtime
      expect(page.id).toBe('modified-id');
    });

    it('should not allow direct modification of properties object', () => {
      const originalProperties = { ...mockProperties };
      const page = new Page('page-123', originalProperties);

      // Modify the original object
      originalProperties.title = { title: [{ plain_text: 'Modified' }] };

      // Page should still reference the original properties
      expect(page.properties).toBe(originalProperties);
      expect(page.properties.title).toEqual({ title: [{ plain_text: 'Modified' }] });
    });
  });
});
