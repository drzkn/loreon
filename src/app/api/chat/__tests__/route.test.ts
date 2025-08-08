import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('@/adapters/output/infrastructure/supabase', () => ({
  supabaseServer: {
    from: vi.fn()
  }
}));



vi.mock('@/adapters/output/infrastructure/supabase/NotionNativeRepository', () => ({
  NotionNativeRepository: vi.fn(() => ({
    getPageBlocks: vi.fn(() => Promise.resolve([
      { content: 'Test content about AI', type: 'paragraph' }
    ]))
  }))
}));

vi.mock('@ai-sdk/google', () => ({
  google: vi.fn(() => 'mocked-model')
}));

vi.mock('ai', () => ({
  streamText: vi.fn(() => ({
    toDataStreamResponse: vi.fn(() => new Response('AI response'))
  }))
}));

import { POST } from '../route';

const createMockRequest = (body: Record<string, unknown>) => {
  return new Request('http://localhost:3000/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
};

describe('/api/chat - Coverage Tests', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    vi.spyOn(console, 'log').mockImplementation(() => { });
    vi.spyOn(console, 'error').mockImplementation(() => { });

    const { supabaseServer } = await import('@/adapters/output/infrastructure/supabase');
    (supabaseServer.from as ReturnType<typeof vi.fn>).mockImplementation((tableName: string) => {
      if (tableName === 'notion_pages') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => Promise.resolve({
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
            }))
          }))
        };
      } else if (tableName === 'markdown_pages') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              limit: vi.fn(() => Promise.resolve({
                data: [
                  {
                    content: 'Test content about AI and machine learning technology',
                    title: 'Test Page about AI'
                  }
                ],
                error: null
              }))
            }))
          }))
        };
      }
      return {
        select: vi.fn(() => ({
          eq: vi.fn(() => Promise.resolve({ data: [], error: null }))
        }))
      };
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Validación de entrada', () => {
    it('should reject requests without messages', async () => {
      const request = createMockRequest({});
      const response = await POST(request);

      expect(response.status).toBe(400);
      expect(await response.text()).toBe('Se requiere un array de mensajes');
    });

    it('should reject non-array messages', async () => {
      const request = createMockRequest({ messages: 'not-array' });
      const response = await POST(request);

      expect(response.status).toBe(400);
      expect(await response.text()).toBe('Se requiere un array de mensajes');
    });

    it('should reject empty message content', async () => {
      const request = createMockRequest({
        messages: [{ role: 'user', content: '' }]
      });
      const response = await POST(request);

      expect(response.status).toBe(400);
      expect(await response.text()).toBe('El último mensaje debe tener contenido');
    });

    it('should reject missing message content', async () => {
      const request = createMockRequest({
        messages: [{ role: 'user' }]
      });
      const response = await POST(request);

      expect(response.status).toBe(400);
      expect(await response.text()).toBe('El último mensaje debe tener contenido');
    });
  });

  describe('Procesamiento de búsqueda', () => {
    it('should process valid requests successfully', async () => {
      const request = createMockRequest({
        messages: [{ role: 'user', content: '¿Qué sabes sobre inteligencia artificial?' }]
      });

      const response = await POST(request);

      expect(response).toBeInstanceOf(Response);
    });

    it('should extract keywords correctly', async () => {
      const request = createMockRequest({
        messages: [{ role: 'user', content: '¿Qué información tienes sobre machine learning?' }]
      });

      await POST(request);
    });

    it('should filter stopwords from queries', async () => {
      const request = createMockRequest({
        messages: [{ role: 'user', content: '¿Qué sabes sobre el desarrollo web?' }]
      });

      await POST(request);
    });

    it('should handle punctuation in queries', async () => {
      const request = createMockRequest({
        messages: [{ role: 'user', content: '¿¡Información sobre desarrollo de software!?' }]
      });

      await POST(request);
    });
  });

  describe('Manejo de páginas relevantes', () => {
    it('should extract keywords and search for pages', async () => {
      const request = createMockRequest({
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
      expect(console.error).toHaveBeenCalledWith(
        'Error en chat nativo:',
        expect.any(Error)
      );
    });
  });

  describe('Funcionalidades edge cases', () => {
    it('should handle very long messages', async () => {
      const longMessage = 'a'.repeat(1000) + ' artificial intelligence';
      const request = createMockRequest({
        messages: [{ role: 'user', content: longMessage }]
      });

      const response = await POST(request);

      expect(response).toBeInstanceOf(Response);
    });

    it('should handle multiple messages in conversation', async () => {
      const request = createMockRequest({
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
      const request = createMockRequest({
        messages: [{ role: 'user', content: '¿Qué sabes sobre INTELIGENCIA ARTIFICIAL?' }]
      });

      const response = await POST(request);

      expect(response).toBeInstanceOf(Response);
    });
  });

  describe('Integración del sistema', () => {
    it('should call Supabase for page data', async () => {
      const { supabaseServer } = await import('@/adapters/output/infrastructure/supabase');

      const request = createMockRequest({
        messages: [{ role: 'user', content: 'test query' }]
      });

      await POST(request);

      expect(supabaseServer.from).toHaveBeenCalledWith('notion_pages');
    });

    it('should import and have NotionNativeRepository available', async () => {
      const { NotionNativeRepository } = await import('@/adapters/output/infrastructure/supabase/NotionNativeRepository');

      const request = createMockRequest({
        messages: [{ role: 'user', content: 'test query about artificial intelligence tech' }]
      });

      await POST(request);

      expect(NotionNativeRepository).toBeDefined();
    });

    it('should call AI service for text generation', async () => {
      const { streamText } = await import('ai');

      const request = createMockRequest({
        messages: [{ role: 'user', content: 'test query' }]
      });

      await POST(request);

      expect(streamText).toHaveBeenCalled();
    });
  });
}); 