import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Usar el sistema centralizado de mocks
import {
  createTestSetup
} from '@/mocks';

// Mock del getEnvVar para evitar errores de variables de entorno
vi.mock('@/utils/getEnvVar', () => ({
  getEnvVar: vi.fn((key: string) => {
    if (key === 'VITE_SUPABASE_URL' || key === 'SUPABASE_URL') {
      return 'https://mock-supabase-url.supabase.co';
    }
    if (key === 'VITE_SUPABASE_ANON_KEY' || key === 'SUPABASE_ANON_KEY') {
      return 'mock-supabase-anon-key';
    }
    return 'mock-value';
  })
}));

// Mock del container de inyección de dependencias
const mockQueryDatabaseUseCase = {
  execute: vi.fn()
};

const mockGetBlockChildrenRecursiveUseCase = {
  execute: vi.fn()
};

vi.mock('../../../infrastructure/di/container', () => ({
  container: {
    queryDatabaseUseCase: mockQueryDatabaseUseCase,
    getBlockChildrenRecursiveUseCase: mockGetBlockChildrenRecursiveUseCase
  }
}));

// Mock del convertidor de markdown
const mockConvertBlocksToMarkdown = vi.fn();
vi.mock('../../../utils/blockToMarkdownConverter/blockToMarkdownConverter', () => ({
  convertBlocksToMarkdown: mockConvertBlocksToMarkdown
}));

// Mock del SupabaseMarkdownRepository
const mockMarkdownRepository = {
  findByNotionPageId: vi.fn(),
  save: vi.fn(),
  update: vi.fn()
};

// Mock directo del cliente Supabase ANTES de cualquier importación
vi.mock('../../../adapters/output/infrastructure/supabase', () => ({
  supabase: {
    auth: {
      signInAnonymously: vi.fn().mockResolvedValue({
        data: { user: { id: 'mock-user' } },
        error: null
      }),
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: 'mock-user' } },
        error: null
      }),
      getSession: vi.fn().mockResolvedValue({
        data: { session: null },
        error: null
      }),
      signOut: vi.fn().mockResolvedValue({ error: null })
    }
  },
  SupabaseMarkdownRepository: vi.fn().mockImplementation(() => mockMarkdownRepository)
}));

import { ConnectionPageRepository } from '../ConnectionPageRepository';

describe('ConnectionPageRepository', () => {
  let repository: ConnectionPageRepository;
  let mockSetIsProcessing: ReturnType<typeof vi.fn>;
  let mockSetProgress: ReturnType<typeof vi.fn>;
  let mockSendLogToStream: ReturnType<typeof vi.fn>;
  const { teardown } = createTestSetup(); // ✅ Console mocks centralizados

  const testDatabaseId = 'test-database-123';

  beforeEach(() => {
    mockSetIsProcessing = vi.fn();
    mockSetProgress = vi.fn();
    mockSendLogToStream = vi.fn();

    repository = new ConnectionPageRepository(
      testDatabaseId,
      mockSetIsProcessing,
      mockSetProgress,
      mockSendLogToStream
    );

    vi.clearAllMocks();
  });

  afterEach(() => {
    teardown(); // ✅ Limpieza automática
  });

  describe('🏗️ Constructor & Basic Properties', () => {
    it('should create repository with correct database ID', () => {
      expect(repository.databaseId).toBe(testDatabaseId);
    });

    it('should have required callback functions', () => {
      expect(mockSetIsProcessing).toBeDefined();
      expect(mockSetProgress).toBeDefined();
      expect(mockSendLogToStream).toBeDefined();
    });
  });

  describe('📝 Utility Functions', () => {
    describe('extractPageTitle', () => {
      it('should extract title from page properties', () => {
        const pageData = {
          properties: {
            Title: {
              type: 'title',
              title: [
                { plain_text: 'Page ' },
                { plain_text: 'Title' }
              ]
            }
          }
        };

        const title = repository.extractPageTitle(pageData);
        expect(title).toBe('Page Title');
      });

      it('should return "Sin título" when no properties', () => {
        const pageData = {};
        const title = repository.extractPageTitle(pageData);
        expect(title).toBe('Sin título');
      });

      it('should return "Sin título" when no title property', () => {
        const pageData = {
          properties: {
            Status: { type: 'select', select: { name: 'Done' } }
          }
        };

        const title = repository.extractPageTitle(pageData);
        expect(title).toBe('Sin título');
      });

      it('should handle empty title arrays', () => {
        const pageData = {
          properties: {
            Title: {
              type: 'title',
              title: []
            }
          }
        };

        const title = repository.extractPageTitle(pageData);
        expect(title).toBe('Sin título');
      });

      it('should handle missing plain_text in title elements', () => {
        const pageData = {
          properties: {
            Title: {
              type: 'title',
              title: [
                { plain_text: 'Good ' },
                {}, // Missing plain_text
                { plain_text: 'Title' }
              ]
            }
          }
        };

        const title = repository.extractPageTitle(pageData);
        expect(title).toBe('Good Title');
      });
    });

    describe('log', () => {
      it('should send logs to stream when callback is provided', () => {
        repository.log('info', 'Test message');
        expect(mockSendLogToStream).toHaveBeenCalledWith('Test message');
      });

      it('should handle logs without stream callback', () => {
        const repoWithoutStream = new ConnectionPageRepository(
          testDatabaseId,
          mockSetIsProcessing,
          mockSetProgress
        );

        const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => { });
        repoWithoutStream.log('info', 'Test message');
        expect(consoleSpy).toHaveBeenCalledWith('Test message');
        consoleSpy.mockRestore();
      });

      it('should log errors to console.error', () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
        const testError = new Error('Test error');

        repository.log('error', 'Error message', testError);
        expect(consoleSpy).toHaveBeenCalledWith('Error message', testError);
        consoleSpy.mockRestore();
      });
    });
  });








}); 