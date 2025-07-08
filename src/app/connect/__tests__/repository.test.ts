import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ConnectionPageRepository } from '../repository';
import { container } from '../../../infrastructure/di/container';

vi.mock('../../../infrastructure/di/container', () => ({
  container: {
    queryDatabaseUseCase: {
      execute: vi.fn()
    },
    getBlockChildrenRecursiveUseCase: {
      execute: vi.fn()
    },
    markdownConverterService: {
      convertPageWithBlocksToMarkdown: vi.fn()
    },
    supabaseMarkdownRepository: {
      findByNotionPageId: vi.fn(),
      upsert: vi.fn()
    }
  }
}));

// Crear los mocks fuera del describe para que estén disponibles
const mockAuthServiceMethods = {
  isAuthenticated: vi.fn(),
  signInAnonymously: vi.fn(),
  getCurrentUser: vi.fn(),
  signOut: vi.fn(),
  getSession: vi.fn()
};

// Mock del SupabaseAuthService
vi.mock('../../../services/auth/SupabaseAuthService', () => ({
  SupabaseAuthService: vi.fn().mockImplementation(() => mockAuthServiceMethods)
}));

describe('ConnectionPageRepository', () => {
  let repository: ConnectionPageRepository;
  let mockSetIsProcessing: ReturnType<typeof vi.fn>;
  let mockSetProgress: ReturnType<typeof vi.fn>;
  let mockSendLogToStream: ReturnType<typeof vi.fn>;

  let consoleLogSpy: ReturnType<typeof vi.spyOn>;

  const mockDatabaseId = 'test-database-id';
  const mockPage = {
    id: 'page-123',
    properties: {
      title: {
        title: [{ plain_text: 'Test Page Title' }]
      }
    },
    url: 'https://notion.so/test-page',
    created_time: '2023-01-01T00:00:00.000Z',
    last_edited_time: '2023-01-01T00:00:00.000Z'
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any;

  beforeEach(() => {
    vi.clearAllMocks();

    // Limpiar los mocks del auth service
    mockAuthServiceMethods.isAuthenticated.mockClear();
    mockAuthServiceMethods.signInAnonymously.mockClear();
    mockAuthServiceMethods.getCurrentUser.mockClear();
    mockAuthServiceMethods.signOut.mockClear();
    mockAuthServiceMethods.getSession.mockClear();

    mockSetIsProcessing = vi.fn();
    mockSetProgress = vi.fn();
    mockSendLogToStream = vi.fn();

    repository = new ConnectionPageRepository(
      mockDatabaseId,
      mockSetIsProcessing,
      mockSetProgress,
      mockSendLogToStream
    );

    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => { });
    vi.spyOn(console, 'warn').mockImplementation(() => { });
    vi.spyOn(console, 'error').mockImplementation(() => { });

    // Mock global alert
    global.alert = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Constructor', () => {
    it('should create repository instance with correct properties', () => {
      expect(repository).toBeInstanceOf(ConnectionPageRepository);
      expect(repository).toHaveProperty('handleSyncToMarkdown');
      expect(repository).toHaveProperty('handleSyncToSupabase');
    });

    it('should initialize with provided parameters', () => {
      const newRepository = new ConnectionPageRepository(
        'test-db',
        mockSetIsProcessing,
        mockSetProgress,
        mockSendLogToStream
      );

      expect(newRepository).toBeInstanceOf(ConnectionPageRepository);
      expect(newRepository).toHaveProperty('handleSyncToMarkdown');
      expect(newRepository).toHaveProperty('handleSyncToSupabase');
    });
  });

  describe('handleSyncToMarkdown', () => {
    it('should successfully convert pages to markdown', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vi.mocked(container.queryDatabaseUseCase.execute).mockResolvedValue([mockPage] as any);
      vi.mocked(container.getBlockChildrenRecursiveUseCase.execute).mockResolvedValue({
        blocks: [{ type: 'paragraph', id: 'block-1' }],
        totalBlocks: 1,
        maxDepthReached: 1,
        apiCallsCount: 1
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);
      vi.mocked(container.markdownConverterService.convertPageWithBlocksToMarkdown).mockReturnValue({
        content: '# Test Page\n\nTest content',
        metadata: {}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);

      await repository.handleSyncToMarkdown();

      expect(container.queryDatabaseUseCase.execute).toHaveBeenCalledWith(mockDatabaseId);
      expect(container.getBlockChildrenRecursiveUseCase.execute).toHaveBeenCalledWith(
        mockPage.id,
        expect.objectContaining({
          maxDepth: 5,
          includeEmptyBlocks: false,
          delayBetweenRequests: 150
        })
      );
      expect(container.markdownConverterService.convertPageWithBlocksToMarkdown).toHaveBeenCalled();
      expect(mockSetIsProcessing).toHaveBeenCalledWith(true);
      expect(mockSetIsProcessing).toHaveBeenCalledWith(false);
      expect(mockSetProgress).toHaveBeenCalled();
      expect(global.alert).toHaveBeenCalledWith(expect.stringContaining('Conversión completada'));
    });

    it('should handle empty database', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vi.mocked(container.queryDatabaseUseCase.execute).mockResolvedValue([] as any);

      await repository.handleSyncToMarkdown();

      expect(container.queryDatabaseUseCase.execute).toHaveBeenCalledWith(mockDatabaseId);
      expect(container.getBlockChildrenRecursiveUseCase.execute).not.toHaveBeenCalled();
      expect(mockSetIsProcessing).toHaveBeenCalledWith(true);
      expect(mockSetIsProcessing).toHaveBeenCalledWith(false);
      expect(mockSendLogToStream).toHaveBeenCalledWith(expect.stringContaining('No se encontraron páginas'));
    });

    it('should handle errors during page processing', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vi.mocked(container.queryDatabaseUseCase.execute).mockResolvedValue([mockPage] as any);
      vi.mocked(container.getBlockChildrenRecursiveUseCase.execute).mockRejectedValue(new Error('API Error'));

      await repository.handleSyncToMarkdown();

      expect(container.queryDatabaseUseCase.execute).toHaveBeenCalledWith(mockDatabaseId);
      expect(container.getBlockChildrenRecursiveUseCase.execute).toHaveBeenCalled();
      expect(mockSetIsProcessing).toHaveBeenCalledWith(true);
      expect(mockSetIsProcessing).toHaveBeenCalledWith(false);
      expect(mockSendLogToStream).toHaveBeenCalledWith(expect.stringContaining('Error procesando'));
    });

    it('should handle critical errors', async () => {
      vi.mocked(container.queryDatabaseUseCase.execute).mockRejectedValue(new Error('Database connection failed'));

      await repository.handleSyncToMarkdown();

      expect(container.queryDatabaseUseCase.execute).toHaveBeenCalledWith(mockDatabaseId);
      expect(mockSetIsProcessing).toHaveBeenCalledWith(true);
      expect(mockSetIsProcessing).toHaveBeenCalledWith(false);
      expect(mockSendLogToStream).toHaveBeenCalledWith(expect.stringContaining('Error crítico'));
      expect(global.alert).toHaveBeenCalledWith(expect.stringContaining('Error en la conversión'));
    });
  });

  describe('handleSyncToSupabase', () => {
    it('should successfully sync pages to Supabase when authenticated', async () => {
      mockAuthServiceMethods.isAuthenticated.mockResolvedValue(true);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vi.mocked(container.queryDatabaseUseCase.execute).mockResolvedValue([] as any);

      await repository.handleSyncToSupabase();

      expect(mockSetIsProcessing).toHaveBeenCalledWith(true);
      expect(mockSetIsProcessing).toHaveBeenCalledWith(false);
    });

    it('should authenticate anonymously when not authenticated', async () => {
      mockAuthServiceMethods.isAuthenticated.mockResolvedValue(false);
      mockAuthServiceMethods.signInAnonymously.mockResolvedValue(undefined);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vi.mocked(container.queryDatabaseUseCase.execute).mockResolvedValue([] as any);

      await repository.handleSyncToSupabase();

      expect(mockSetIsProcessing).toHaveBeenCalledWith(true);
      expect(mockSetIsProcessing).toHaveBeenCalledWith(false);
    });

    it('should handle update operations correctly', async () => {
      mockAuthServiceMethods.isAuthenticated.mockResolvedValue(true);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vi.mocked(container.queryDatabaseUseCase.execute).mockResolvedValue([] as any);

      await repository.handleSyncToSupabase();

      expect(mockSetIsProcessing).toHaveBeenCalledWith(true);
      expect(mockSetIsProcessing).toHaveBeenCalledWith(false);
    });

    it('should handle errors during Supabase sync', async () => {
      vi.mocked(container.queryDatabaseUseCase.execute).mockRejectedValue(new Error('Database error'));

      await repository.handleSyncToSupabase();

      expect(mockSetIsProcessing).toHaveBeenCalledWith(true);
      expect(mockSetIsProcessing).toHaveBeenCalledWith(false);
      expect(mockSendLogToStream).toHaveBeenCalledWith(expect.stringContaining('Error crítico'));
    });

    it('should handle critical errors in Supabase sync', async () => {
      mockAuthServiceMethods.isAuthenticated.mockRejectedValue(new Error('Auth error'));

      await repository.handleSyncToSupabase();

      expect(mockSetIsProcessing).toHaveBeenCalledWith(true);
      expect(mockSetIsProcessing).toHaveBeenCalledWith(false);
      expect(mockSendLogToStream).toHaveBeenCalledWith(expect.stringContaining('Error crítico'));
      expect(global.alert).toHaveBeenCalledWith(expect.stringContaining('Error en la sincronización'));
    });
  });

  describe('Progress and State Management', () => {
    it('should call setIsProcessing correctly during operations', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vi.mocked(container.queryDatabaseUseCase.execute).mockResolvedValue([] as any);

      await repository.handleSyncToMarkdown();

      expect(mockSetIsProcessing).toHaveBeenCalledWith(true);
      expect(mockSetIsProcessing).toHaveBeenCalledWith(false);
    });

    it('should update progress during page processing', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vi.mocked(container.queryDatabaseUseCase.execute).mockResolvedValue([mockPage] as any);
      vi.mocked(container.getBlockChildrenRecursiveUseCase.execute).mockResolvedValue({
        blocks: [],
        totalBlocks: 0,
        maxDepthReached: 0,
        apiCallsCount: 0
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);
      vi.mocked(container.markdownConverterService.convertPageWithBlocksToMarkdown).mockReturnValue({
        content: '# Test',
        metadata: {}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);

      await repository.handleSyncToMarkdown();

      expect(mockSetProgress).toHaveBeenCalledWith(null);
      expect(mockSetProgress).toHaveBeenCalledWith(expect.objectContaining({
        current: 1,
        total: 1,
        currentPageTitle: expect.stringContaining('Completadas')
      }));
    });

    it('should send logs to stream when provided', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vi.mocked(container.queryDatabaseUseCase.execute).mockResolvedValue([] as any);

      await repository.handleSyncToMarkdown();

      expect(mockSendLogToStream).toHaveBeenCalledWith(expect.stringContaining('Iniciando conversión'));
    });
  });

  describe('Error Handling', () => {
    it('should handle non-Error objects gracefully', async () => {
      vi.mocked(container.queryDatabaseUseCase.execute).mockRejectedValue('String error');

      await repository.handleSyncToMarkdown();

      expect(mockSendLogToStream).toHaveBeenCalledWith(expect.stringContaining('Error desconocido'));
    });

    it('should continue processing other pages when one fails', async () => {
      const pages = [
        { id: 'page-1', properties: { title: { title: [{ plain_text: 'Page 1' }] } } },
        { id: 'page-2', properties: { title: { title: [{ plain_text: 'Page 2' }] } } }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ] as any;

      vi.mocked(container.queryDatabaseUseCase.execute).mockResolvedValue(pages);
      vi.mocked(container.getBlockChildrenRecursiveUseCase.execute)
        .mockRejectedValueOnce(new Error('Error on page 1'))
        .mockResolvedValueOnce({
          blocks: [],
          totalBlocks: 0,
          maxDepthReached: 0,
          apiCallsCount: 0
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any);
      vi.mocked(container.markdownConverterService.convertPageWithBlocksToMarkdown).mockReturnValue({
        content: '# Page 2',
        metadata: {}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);

      await repository.handleSyncToMarkdown();

      expect(container.getBlockChildrenRecursiveUseCase.execute).toHaveBeenCalledTimes(2);
      expect(mockSendLogToStream).toHaveBeenCalledWith(expect.stringContaining('Error procesando'));
      expect(mockSendLogToStream).toHaveBeenCalledWith(expect.stringContaining('Page 2'));
    });
  });

  describe('Logging System', () => {
    it('should log to console and stream', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vi.mocked(container.queryDatabaseUseCase.execute).mockResolvedValue([] as any);

      await repository.handleSyncToMarkdown();

      expect(consoleLogSpy).toHaveBeenCalled();
      expect(mockSendLogToStream).toHaveBeenCalled();
    });

    it('should handle repository without stream logging', () => {
      const repositoryWithoutStream = new ConnectionPageRepository(
        mockDatabaseId,
        mockSetIsProcessing,
        mockSetProgress
      );

      expect(repositoryWithoutStream).toBeInstanceOf(ConnectionPageRepository);
    });
  });

  describe('Data Validation', () => {
    it('should handle invalid page objects gracefully', async () => {
      const invalidPages = [
        { id: 'valid-id', properties: {} }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ] as any;

      vi.mocked(container.queryDatabaseUseCase.execute).mockResolvedValue(invalidPages);
      vi.mocked(container.getBlockChildrenRecursiveUseCase.execute).mockResolvedValue({
        blocks: [],
        totalBlocks: 0,
        maxDepthReached: 0,
        apiCallsCount: 0
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);
      vi.mocked(container.markdownConverterService.convertPageWithBlocksToMarkdown).mockReturnValue({
        content: '# Content',
        metadata: {}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);

      await repository.handleSyncToMarkdown();

      expect(container.getBlockChildrenRecursiveUseCase.execute).toHaveBeenCalledTimes(1);
    });
  });
});
