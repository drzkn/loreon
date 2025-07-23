import { describe, it, expect, vi, beforeEach } from 'vitest';

// Configurar variables de entorno
process.env.SUPABASE_URL = 'https://test.supabase.co';
process.env.SUPABASE_ANON_KEY = 'test-key';
process.env.GOOGLE_GENERATIVE_AI_API_KEY = 'test-key';

// Mocks simples
vi.mock('ai', () => ({
  streamText: vi.fn(() => ({
    toDataStreamResponse: vi.fn(() => new Response('Mock response'))
  }))
}));

vi.mock('@ai-sdk/google', () => ({
  google: vi.fn(() => 'mock-model')
}));

vi.mock('@/services/embeddings/EmbeddingsService', () => ({
  EmbeddingsService: vi.fn(() => ({
    generateEmbedding: vi.fn(() => Promise.resolve([0.1, 0.2, 0.3]))
  }))
}));

vi.mock('@/adapters/output/infrastructure/supabase', () => ({
  SupabaseMarkdownRepository: vi.fn(() => ({
    searchByVector: vi.fn(() => Promise.resolve([]))
  }))
}));

import { POST } from '../route';

describe('Endpoint /api/chat', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Validación básica', () => {
    it('debe validar que se envíen mensajes', async () => {
      const request = new Request('http://localhost/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
      const text = await response.text();
      expect(text).toBe('Se requiere un array de mensajes');
    });

    it('debe validar que los mensajes sean un array', async () => {
      const request = new Request('http://localhost/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: 'invalid' })
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
      const text = await response.text();
      expect(text).toBe('Se requiere un array de mensajes');
    });

    it('debe validar que el último mensaje tenga contenido', async () => {
      const request = new Request('http://localhost/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: '' }]
        })
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
      const text = await response.text();
      expect(text).toBe('El último mensaje debe tener contenido');
    });

    it('debe manejar JSON inválido', async () => {
      const request = new Request('http://localhost/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'invalid json'
      });

      const response = await POST(request);

      expect(response.status).toBe(500);
      const text = await response.text();
      expect(text).toBe('Error interno del servidor');
    });
  });

  describe('Procesamiento de mensajes', () => {
    it('debe procesar mensajes válidos exitosamente', async () => {
      const request = new Request('http://localhost/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'Pregunta de prueba' }]
        })
      });

      const response = await POST(request);

      // Debe retornar una respuesta válida
      expect(response).toBeInstanceOf(Response);
      expect(response.status).not.toBe(400);
      expect(response.status).not.toBe(500);
    });

    it('debe aceptar múltiples mensajes en el historial', async () => {
      const request = new Request('http://localhost/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            { role: 'user', content: 'Primera pregunta' },
            { role: 'assistant', content: 'Primera respuesta' },
            { role: 'user', content: 'Segunda pregunta' }
          ]
        })
      });

      const response = await POST(request);

      // Debe procesar el historial sin errores
      expect(response).toBeInstanceOf(Response);
      expect(response.status).not.toBe(400);
      expect(response.status).not.toBe(500);
    });
  });
}); 