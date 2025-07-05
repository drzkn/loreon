import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GetBlockChildrenRecursive, RecursiveBlockOptions } from '../GetBlockChildrenRecursive';
import { INotionRepository } from '../../../../ports/output/repositories/INotionRepository';
import { Block } from '../../../entities/Block';

describe('GetBlockChildrenRecursiveUseCase', () => {
  let useCase: GetBlockChildrenRecursive;
  let mockRepository: INotionRepository;

  const createMockBlock = (
    id: string,
    type: string,
    hasChildren: boolean = false,
    content: string = 'Test content'
  ): Block => {
    const data = type === 'paragraph'
      ? { paragraph: { rich_text: [{ plain_text: content }] } }
      : type === 'divider'
        ? {}
        : { [type]: { rich_text: [{ plain_text: content }] } };

    return new Block(
      id,
      type,
      data,
      '2023-01-01T00:00:00.000Z',
      '2023-01-02T00:00:00.000Z',
      hasChildren,
      []
    );
  };

  beforeEach(() => {
    mockRepository = {
      getDatabase: vi.fn(),
      getPage: vi.fn(),
      getUser: vi.fn(),
      queryDatabase: vi.fn(),
      getBlockChildren: vi.fn()
    };
    useCase = new GetBlockChildrenRecursive(mockRepository);
    vi.clearAllMocks();
  });

  describe('Constructor', () => {
    it('should create instance with repository', () => {
      expect(useCase).toBeInstanceOf(GetBlockChildrenRecursive);
    });
  });

  describe('execute', () => {
    it('should throw error for empty block ID', async () => {
      await expect(useCase.execute('')).rejects.toThrow('Block ID es requerido');
    });

    it('should fetch blocks without children successfully', async () => {
      const mockBlocks = [
        createMockBlock('block-1', 'paragraph'),
        createMockBlock('block-2', 'heading_1')
      ];

      vi.mocked(mockRepository.getBlockChildren).mockResolvedValue(mockBlocks);

      const result = await useCase.execute('parent-block');

      expect(result.blocks).toEqual(mockBlocks);
      expect(result.totalBlocks).toBe(2);
      expect(result.maxDepthReached).toBe(0);
      expect(result.apiCallsCount).toBe(1);
      expect(mockRepository.getBlockChildren).toHaveBeenCalledWith('parent-block');
    });

    it('should fetch blocks recursively with children', async () => {
      const parentBlocks = [createMockBlock('parent-1', 'paragraph', true)];
      const childBlocks = [createMockBlock('child-1', 'paragraph')];

      vi.mocked(mockRepository.getBlockChildren)
        .mockResolvedValueOnce(parentBlocks)
        .mockResolvedValueOnce(childBlocks);

      const result = await useCase.execute('root-block');

      expect(result.blocks).toHaveLength(1);
      expect(result.blocks[0].children).toEqual(childBlocks);
      expect(result.totalBlocks).toBe(2);
      expect(result.maxDepthReached).toBe(1);
      expect(result.apiCallsCount).toBe(2);
    });

    it('should respect maxDepth option', async () => {
      const level1Blocks = [createMockBlock('level1', 'paragraph', true)];
      const level2Blocks = [createMockBlock('level2', 'paragraph', true)];

      vi.mocked(mockRepository.getBlockChildren)
        .mockResolvedValueOnce(level1Blocks)
        .mockResolvedValueOnce(level2Blocks);

      const options: RecursiveBlockOptions = { maxDepth: 1 };
      const result = await useCase.execute('root-block', options);

      expect(result.blocks[0].children).toEqual([]);
      expect(result.apiCallsCount).toBe(1);
      expect(result.maxDepthReached).toBe(0);
    });

    it('should filter empty blocks when includeEmptyBlocks is false', async () => {
      const mockBlocks = [
        createMockBlock('block-1', 'paragraph', false, 'Content'),
        createMockBlock('block-2', 'paragraph', false, ''),
        createMockBlock('block-3', 'divider')
      ];

      vi.mocked(mockRepository.getBlockChildren).mockResolvedValue(mockBlocks);

      const options: RecursiveBlockOptions = { includeEmptyBlocks: false };
      const result = await useCase.execute('parent-block', options);

      expect(result.blocks).toHaveLength(2); // Solo block-1 y block-3 (divider no se considera vacío)
      expect(result.blocks[0].id).toBe('block-1');
      expect(result.blocks[1].id).toBe('block-3');
    });

    it('should include empty blocks when includeEmptyBlocks is true', async () => {
      const mockBlocks = [
        createMockBlock('block-1', 'paragraph', false, 'Content'),
        createMockBlock('block-2', 'paragraph', false, '')
      ];

      vi.mocked(mockRepository.getBlockChildren).mockResolvedValue(mockBlocks);

      const options: RecursiveBlockOptions = { includeEmptyBlocks: true };
      const result = await useCase.execute('parent-block', options);

      expect(result.blocks).toHaveLength(2);
    });

    it('should handle API errors gracefully', async () => {
      vi.mocked(mockRepository.getBlockChildren).mockRejectedValue(new Error('API Error'));

      await expect(useCase.execute('block-id')).rejects.toThrow('Error en obtención recursiva: API Error');
    });

    it('should handle child block API errors and continue', async () => {
      const parentBlocks = [createMockBlock('parent-1', 'paragraph', true)];

      vi.mocked(mockRepository.getBlockChildren)
        .mockResolvedValueOnce(parentBlocks)
        .mockRejectedValueOnce(new Error('Child API Error'));

      // Mock console.error to avoid output in tests
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

      const result = await useCase.execute('root-block');

      expect(result.blocks).toHaveLength(1);
      expect(result.blocks[0].children).toEqual([]);
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Error al obtener hijos del bloque parent-1'),
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });

    it('should apply delay between requests when specified', async () => {
      const parentBlocks = [createMockBlock('parent-1', 'paragraph', true)];
      const childBlocks = [createMockBlock('child-1', 'paragraph')];

      vi.mocked(mockRepository.getBlockChildren)
        .mockResolvedValueOnce(parentBlocks)
        .mockResolvedValueOnce(childBlocks);

      // Mock setTimeout to spy on delays
      const setTimeoutSpy = vi.spyOn(global, 'setTimeout');

      const options: RecursiveBlockOptions = { delayBetweenRequests: 100 };
      await useCase.execute('root-block', options);

      expect(setTimeoutSpy).toHaveBeenCalledWith(expect.any(Function), 100);

      setTimeoutSpy.mockRestore();
    });
  });

  describe('executeFlat', () => {
    it('should return flattened structure of blocks', async () => {
      const parentBlocks = [createMockBlock('parent-1', 'paragraph', true)];
      const childBlocks = [createMockBlock('child-1', 'paragraph')];

      vi.mocked(mockRepository.getBlockChildren)
        .mockResolvedValueOnce(parentBlocks)
        .mockResolvedValueOnce(childBlocks);

      const result = await useCase.executeFlat('root-block');

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('parent-1');
      expect(result[1].id).toBe('child-1');
    });
  });

  describe('isNonEmptyBlock (through filtering)', () => {
    it('should consider paragraph with content as non-empty', async () => {
      const blocks = [createMockBlock('block-1', 'paragraph', false, 'Content')];
      vi.mocked(mockRepository.getBlockChildren).mockResolvedValue(blocks);

      const result = await useCase.execute('parent', { includeEmptyBlocks: false });

      expect(result.blocks).toHaveLength(1);
    });

    it('should consider paragraph without content as empty', async () => {
      const blocks = [createMockBlock('block-1', 'paragraph', false, '')];
      vi.mocked(mockRepository.getBlockChildren).mockResolvedValue(blocks);

      const result = await useCase.execute('parent', { includeEmptyBlocks: false });

      expect(result.blocks).toHaveLength(0);
    });

    it('should consider heading blocks correctly', async () => {
      const blocks = [
        createMockBlock('heading-1', 'heading_1', false, 'Title'),
        createMockBlock('heading-2', 'heading_2', false, ''),
        createMockBlock('heading-3', 'heading_3', false, 'Subtitle')
      ];
      vi.mocked(mockRepository.getBlockChildren).mockResolvedValue(blocks);

      const result = await useCase.execute('parent', { includeEmptyBlocks: false });

      expect(result.blocks).toHaveLength(2); // Solo heading-1 y heading-3
    });

    it('should consider list items correctly', async () => {
      const blocks = [
        createMockBlock('list-1', 'bulleted_list_item', false, 'Item 1'),
        createMockBlock('list-2', 'numbered_list_item', false, ''),
        createMockBlock('list-3', 'bulleted_list_item', false, 'Item 2')
      ];
      vi.mocked(mockRepository.getBlockChildren).mockResolvedValue(blocks);

      const result = await useCase.execute('parent', { includeEmptyBlocks: false });

      expect(result.blocks).toHaveLength(2); // Solo list-1 y list-3
    });

    it('should consider media blocks as non-empty', async () => {
      const blocks = [
        createMockBlock('image-1', 'image'),
        createMockBlock('file-1', 'file'),
        createMockBlock('video-1', 'video'),
        createMockBlock('bookmark-1', 'bookmark')
      ];
      vi.mocked(mockRepository.getBlockChildren).mockResolvedValue(blocks);

      const result = await useCase.execute('parent', { includeEmptyBlocks: false });

      expect(result.blocks).toHaveLength(4); // Todos son no vacíos
    });

    it('should consider divider as non-empty', async () => {
      const blocks = [createMockBlock('divider-1', 'divider')];
      vi.mocked(mockRepository.getBlockChildren).mockResolvedValue(blocks);

      const result = await useCase.execute('parent', { includeEmptyBlocks: false });

      expect(result.blocks).toHaveLength(1);
    });

    it('should consider blocks with children as non-empty', async () => {
      const blocks = [createMockBlock('parent-1', 'paragraph', true, '')];
      vi.mocked(mockRepository.getBlockChildren)
        .mockResolvedValueOnce(blocks)
        .mockResolvedValueOnce([]);

      const result = await useCase.execute('parent', { includeEmptyBlocks: false });

      expect(result.blocks).toHaveLength(1); // Tiene hijos, no se considera vacío
    });
  });

  describe('countTotalBlocks', () => {
    it('should count blocks correctly in complex hierarchy', async () => {
      // Crear estructura: parent -> [child1, child2] donde child1 -> [grandchild]
      const grandchild = createMockBlock('grandchild', 'paragraph');
      const child1 = new Block('child1', 'paragraph', {}, undefined, undefined, true, [grandchild]);
      const child2 = createMockBlock('child2', 'paragraph');
      const parent = new Block('parent', 'paragraph', {}, undefined, undefined, true, [child1, child2]);

      vi.mocked(mockRepository.getBlockChildren)
        .mockResolvedValueOnce([parent])
        .mockResolvedValueOnce([child1, child2])
        .mockResolvedValueOnce([grandchild]);

      const result = await useCase.execute('root');

      expect(result.totalBlocks).toBe(4); // parent + child1 + child2 + grandchild
    });
  });

  describe('Edge Cases', () => {
    it('should handle maximum depth warning', async () => {
      const blocks = [createMockBlock('block-1', 'paragraph', true)];
      vi.mocked(mockRepository.getBlockChildren).mockResolvedValue(blocks);

      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => { });

      const options: RecursiveBlockOptions = { maxDepth: 0 };
      const result = await useCase.execute('parent', options);

      expect(result.blocks).toEqual([]);
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Límite de profundidad alcanzado (0) para bloque parent')
      );

      consoleSpy.mockRestore();
    });

    it('should handle unknown block types as non-empty', async () => {
      const unknownBlock = createMockBlock('unknown-1', 'unknown_type');
      vi.mocked(mockRepository.getBlockChildren).mockResolvedValue([unknownBlock]);

      const result = await useCase.execute('parent', { includeEmptyBlocks: false });

      expect(result.blocks).toHaveLength(1); // Unknown types considered non-empty
    });

    it('should handle blocks without rich_text property', async () => {
      const blockWithoutRichText = new Block(
        'block-1',
        'paragraph',
        { paragraph: {} }, // Sin rich_text
        undefined,
        undefined,
        false,
        []
      );

      vi.mocked(mockRepository.getBlockChildren).mockResolvedValue([blockWithoutRichText]);

      const result = await useCase.execute('parent', { includeEmptyBlocks: false });

      expect(result.blocks).toHaveLength(0); // Sin contenido, se considera vacío
    });

    it('should handle deeply nested structure within limits', async () => {
      // Simular estructura profunda: root -> level1 -> level2
      const level2Blocks = [createMockBlock('level2', 'paragraph')];
      const level1Blocks = [createMockBlock('level1', 'paragraph', true)];
      const rootBlocks = [createMockBlock('root', 'paragraph', true)];

      vi.mocked(mockRepository.getBlockChildren)
        .mockResolvedValueOnce(rootBlocks)
        .mockResolvedValueOnce(level1Blocks)
        .mockResolvedValueOnce(level2Blocks);

      const options: RecursiveBlockOptions = { maxDepth: 3 };
      const result = await useCase.execute('parent', options);

      expect(result.maxDepthReached).toBe(2);
      expect(result.apiCallsCount).toBe(3);
      expect(result.totalBlocks).toBe(3);
    });
  });
});
