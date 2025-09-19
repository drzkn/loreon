import { INotionRepository } from '@/ports/output/repositories/INotionRepository';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { GetBlockChildren } from '../GetBlockChildren';
import { Block } from '@/domain/entities/Block';

// Mock del repositorio
const createMockNotionRepository = (): INotionRepository => ({
  getDatabase: vi.fn(),
  getPage: vi.fn(),
  queryDatabase: vi.fn(),
  getBlockChildren: vi.fn(),
});

describe('GetBlockChildrenUseCase', () => {
  let getBlockChildrenUseCase: GetBlockChildren;
  let mockNotionRepository: INotionRepository;

  beforeEach(() => {
    mockNotionRepository = createMockNotionRepository();
    getBlockChildrenUseCase = new GetBlockChildren(mockNotionRepository);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('execute', () => {
    it('should successfully get block children when valid block ID is provided', async () => {
      // Arrange
      const blockId = 'test-block-id';
      const mockChildren = [
        new Block(
          'child-1',
          'paragraph',
          { paragraph: { rich_text: [{ plain_text: 'Child 1' }] } },
          '2023-01-01T00:00:00.000Z',
          '2023-01-01T00:00:00.000Z',
          false,
          []
        ),
        new Block(
          'child-2',
          'heading_2',
          { heading_2: { rich_text: [{ plain_text: 'Child 2' }] } },
          '2023-01-01T00:00:00.000Z',
          '2023-01-01T00:00:00.000Z',
          true,
          []
        )
      ];
      vi.mocked(mockNotionRepository.getBlockChildren).mockResolvedValue(mockChildren);

      // Act
      const result = await getBlockChildrenUseCase.execute(blockId);

      // Assert
      expect(mockNotionRepository.getBlockChildren).toHaveBeenCalledWith(blockId);
      expect(result).toBe(mockChildren);
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('child-1');
      expect(result[0].type).toBe('paragraph');
      expect(result[1].id).toBe('child-2');
      expect(result[1].type).toBe('heading_2');
    });

    it('should return empty array when block has no children', async () => {
      // Arrange
      const blockId = 'block-without-children';
      const mockChildren: Block[] = [];
      vi.mocked(mockNotionRepository.getBlockChildren).mockResolvedValue(mockChildren);

      // Act
      const result = await getBlockChildrenUseCase.execute(blockId);

      // Assert
      expect(mockNotionRepository.getBlockChildren).toHaveBeenCalledWith(blockId);
      expect(result).toBe(mockChildren);
      expect(result).toHaveLength(0);
    });

    it('should throw error when block ID is empty string', async () => {
      // Arrange
      const blockId = '';

      // Act & Assert
      await expect(getBlockChildrenUseCase.execute(blockId)).rejects.toThrow('Block ID es requerido');
      expect(mockNotionRepository.getBlockChildren).not.toHaveBeenCalled();
    });

    it('should throw error when block ID is null', async () => {
      // Arrange
      const blockId = null as unknown as string;

      // Act & Assert
      await expect(getBlockChildrenUseCase.execute(blockId)).rejects.toThrow('Block ID es requerido');
      expect(mockNotionRepository.getBlockChildren).not.toHaveBeenCalled();
    });

    it('should throw error when block ID is undefined', async () => {
      // Arrange
      const blockId = undefined as unknown as string;

      // Act & Assert
      await expect(getBlockChildrenUseCase.execute(blockId)).rejects.toThrow('Block ID es requerido');
      expect(mockNotionRepository.getBlockChildren).not.toHaveBeenCalled();
    });

    it('should propagate repository errors', async () => {
      // Arrange
      const blockId = 'test-block-id';
      const mockError = new Error('API Error: Block not found');
      vi.mocked(mockNotionRepository.getBlockChildren).mockRejectedValue(mockError);

      // Act & Assert
      await expect(getBlockChildrenUseCase.execute(blockId)).rejects.toThrow('API Error: Block not found');
      expect(mockNotionRepository.getBlockChildren).toHaveBeenCalledWith(blockId);
    });

    it('should handle blocks with children flag', async () => {
      // Arrange
      const blockId = 'parent-block-id';
      const mockChildren = [
        new Block(
          'child-with-children',
          'toggle',
          { toggle: { rich_text: [{ plain_text: 'Toggle block' }] } },
          '2023-01-01T00:00:00.000Z',
          '2023-01-01T00:00:00.000Z',
          true, // has children
          []
        )
      ];
      vi.mocked(mockNotionRepository.getBlockChildren).mockResolvedValue(mockChildren);

      // Act
      const result = await getBlockChildrenUseCase.execute(blockId);

      // Assert
      expect(result[0].hasChildren).toBe(true);
      expect(mockNotionRepository.getBlockChildren).toHaveBeenCalledWith(blockId);
    });
  });
}); 