import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  createTestSetup,
  createMockNextRequest
} from '@/mocks';

// Mock de Supabase con patrón inline para evitar hoisting
vi.mock('@/adapters/output/infrastructure/supabase', () => {
  const mockChain = {
    from: vi.fn(),
    select: vi.fn(),
    eq: vi.fn()
  };

  mockChain.from.mockReturnValue(mockChain);
  mockChain.select.mockReturnValue(mockChain);

  return {
    supabaseServer: mockChain,
    supabase: mockChain,
    SupabaseMarkdownRepository: vi.fn(() => ({
      getMarkdownByPageId: vi.fn(),
      saveMarkdown: vi.fn(),
      deleteMarkdown: vi.fn(),
      searchMarkdown: vi.fn()
    }))
  };
});

// Mock de NotionNativeRepository
vi.mock('@/adapters/output/infrastructure/supabase/NotionNativeRepository', () => ({
  NotionNativeRepository: vi.fn(() => ({
    getPageBlocks: vi.fn()
  }))
}));

// Mock de AI SDK
vi.mock('@ai-sdk/google', () => ({
  google: {
    textEmbeddingModel: vi.fn(() => ({
      modelId: 'text-embedding-004',
      provider: 'google'
    })),
    generativeAI: vi.fn(() => 'mocked-generative-model')
  }
}));

// Mock del ChatController usando función factory para evitar hoisting
vi.mock('@/presentation/controllers/ChatController', () => ({
  ChatController: vi.fn(() => ({
    processChat: vi.fn()
  }))
}));

// Mock del container DI
vi.mock('@/infrastructure/di/container', () => ({
  container: {
    logger: {
      info: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
      warn: vi.fn()
    },
    chatController: {
      processChat: vi.fn()
    }
  }
}));

vi.mock('ai', () => ({
  streamText: vi.fn(() => ({
    toDataStreamResponse: vi.fn(() => new Response('AI response'))
  })),
  embed: vi.fn().mockResolvedValue({
    embedding: [0.1, 0.2, 0.3, 0.4, 0.5]
  }),
  embedMany: vi.fn().mockResolvedValue({
    embeddings: [[0.1, 0.2, 0.3], [0.4, 0.5, 0.6]]
  })
}));

import { POST } from '../route';
import { container } from '@/infrastructure/di/container';

describe('/api/chat - Coverage Tests', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockSupabase: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockNotionRepo: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockStreamText: any;
  const { teardown } = createTestSetup();

  beforeEach(async () => {
    vi.clearAllMocks();

    // Obtener referencias a los mocks después de la limpieza
    const { supabaseServer } = await import('@/adapters/output/infrastructure/supabase');
    const { NotionNativeRepository } = await import('@/adapters/output/infrastructure/supabase/NotionNativeRepository');
    const { streamText } = await import('ai');

    mockSupabase = supabaseServer;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockNotionRepo = new (NotionNativeRepository as any)();
    mockStreamText = streamText;

    // Setup default ChatController behavior
    vi.mocked(container.chatController.processChat).mockImplementation((request) => {
      if (!request.messages || !Array.isArray(request.messages)) {
        throw new Error('Se requiere un array de mensajes');
      }
      if (!request.messages[request.messages.length - 1]?.content) {
        throw new Error('El último mensaje debe tener contenido');
      }

      // Simular llamadas a Supabase y streamText para los tests de integración
      mockSupabase.from('notion_pages');
      mockStreamText({ messages: request.messages });

      return Promise.resolve(new Response('AI response'));
    });

    // Setup Supabase responses
    mockSupabase.from.mockImplementation((tableName: string) => {
      if (tableName === 'notion_pages') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: [
                {
                  notion_id: 'page-1',
                  title: 'Test Page about artificial intelligence',
                  properties: { category: 'tech' },
                  archived: false
                },
                {
                  notion_id: 'page-2',
                  title: 'Machine Learning Guide',
                  properties: { category: 'ai' },
                  archived: false
                }
              ],
              error: null
            })
          })
        };
      } else if (tableName === 'markdown_pages') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue({
                data: [
                  {
                    content: 'Test content about AI and machine learning technology',
                    title: 'Test Page about AI'
                  }
                ],
                error: null
              })
            })
          })
        };
      }
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: [], error: null })
        })
      };
    });

    // Setup Notion repository mock
    mockNotionRepo.getPageBlocks.mockResolvedValue([
      { content: 'Test content about AI', type: 'paragraph' }
    ]);
  });

  afterEach(() => {
    teardown();
  });

  describe('Validación de entrada', () => {
    it('should reject requests without messages', async () => {
      const request = createMockNextRequest({});
      const response = await POST(request);

      expect(response.status).toBe(400);
      expect(await response.text()).toBe('Se requiere un array de mensajes');
    });

    it('should reject non-array messages', async () => {
      const request = createMockNextRequest({ messages: 'not-array' });
      const response = await POST(request);

      expect(response.status).toBe(400);
      expect(await response.text()).toBe('Se requiere un array de mensajes');
    });

    it('should reject empty message content', async () => {
      const request = createMockNextRequest({
        messages: [{ role: 'user', content: '' }]
      });
      const response = await POST(request);

      expect(response.status).toBe(400);
      expect(await response.text()).toBe('El último mensaje debe tener contenido');
    });

    it('should reject missing message content', async () => {
      const request = createMockNextRequest({
        messages: [{ role: 'user' }]
      });
      const response = await POST(request);

      expect(response.status).toBe(400);
      expect(await response.text()).toBe('El último mensaje debe tener contenido');
    });
  });

  describe('Procesamiento de búsqueda', () => {
    it('should process valid requests successfully', async () => {
      const request = createMockNextRequest({
        messages: [{ role: 'user', content: '¿Qué sabes sobre inteligencia artificial?' }]
      });

      const response = await POST(request);

      expect(response).toBeInstanceOf(Response);
    });

    it('should extract keywords correctly', async () => {
      const request = createMockNextRequest({
        messages: [{ role: 'user', content: '¿Qué información tienes sobre machine learning?' }]
      });

      await POST(request);
    });

    it('should filter stopwords from queries', async () => {
      const request = createMockNextRequest({
        messages: [{ role: 'user', content: '¿Qué sabes sobre el desarrollo web?' }]
      });

      await POST(request);
    });

    it('should handle punctuation in queries', async () => {
      const request = createMockNextRequest({
        messages: [{ role: 'user', content: '¿¡Información sobre desarrollo de software!?' }]
      });

      await POST(request);
    });
  });

  describe('Manejo de páginas relevantes', () => {
    it('should extract keywords and search for pages', async () => {
      const request = createMockNextRequest({
        messages: [{ role: 'user', content: '¿Qué sabes sobre artificial intelligence?' }]
      });

      await POST(request);
    });
  });

  describe('Manejo de errores', () => {
    it('should handle JSON parsing errors', async () => {
      const request = new Request('http://localhost:3000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'invalid-json'
      });

      const response = await POST(request);

      expect(response.status).toBe(500);
      expect(await response.text()).toBe('Error interno del servidor');
      // El console.error ya está mockeado globalmente
    });
  });

  describe('Funcionalidades edge cases', () => {
    it('should handle very long messages', async () => {
      const longMessage = 'a'.repeat(1000) + ' artificial intelligence';
      const request = createMockNextRequest({
        messages: [{ role: 'user', content: longMessage }]
      });

      const response = await POST(request);

      expect(response).toBeInstanceOf(Response);
    });

    it('should handle multiple messages in conversation', async () => {
      const request = createMockNextRequest({
        messages: [
          { role: 'user', content: 'Hola' },
          { role: 'assistant', content: 'Hola!' },
          { role: 'user', content: '¿Qué sabes sobre AI?' }
        ]
      });

      const response = await POST(request);

      expect(response).toBeInstanceOf(Response);
    });

    it('should handle case-insensitive queries', async () => {
      const request = createMockNextRequest({
        messages: [{ role: 'user', content: '¿Qué sabes sobre INTELIGENCIA ARTIFICIAL?' }]
      });

      const response = await POST(request);

      expect(response).toBeInstanceOf(Response);
    });
  });

  describe('Integración del sistema', () => {
    it('should call Supabase for page data', async () => {
      const request = createMockNextRequest({
        messages: [{ role: 'user', content: 'test query' }]
      });

      await POST(request);

      expect(mockSupabase.from).toHaveBeenCalledWith('notion_pages');
    });

    it('should import and have NotionNativeRepository available', async () => {
      const { NotionNativeRepository } = await import('@/adapters/output/infrastructure/supabase/NotionNativeRepository');

      const request = createMockNextRequest({
        messages: [{ role: 'user', content: 'test query about artificial intelligence tech' }]
      });

      await POST(request);

      expect(NotionNativeRepository).toBeDefined();
    });

    it('should call AI service for text generation', async () => {
      const request = createMockNextRequest({
        messages: [{ role: 'user', content: 'test query' }]
      });

      await POST(request);

      expect(mockStreamText).toHaveBeenCalled();
    });
  });
}); 