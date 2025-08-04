import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { POST } from '../route';

// Mock del EmbeddingsService
vi.mock('@/services/embeddings/EmbeddingsService', () => ({
  EmbeddingsService: vi.fn(() => ({
    generateEmbedding: vi.fn(() => Promise.resolve([0.1, 0.2, 0.3]))
  }))
}));

// Mock del SupabaseMarkdownRepository
vi.mock('@/adapters/output/infrastructure/supabase', () => ({
  SupabaseMarkdownRepository: vi.fn(() => ({
    searchByVector: vi.fn(() => Promise.resolve([]))
  }))
}));

// Mock del Google AI SDK
vi.mock('@ai-sdk/google', () => ({
  google: vi.fn(() => 'mocked-model')
}));

// Mock del AI SDK
vi.mock('ai', () => ({
  streamText: vi.fn(() => ({
    toDataStreamResponse: vi.fn(() => new Response('Mocked response'))
  }))
}));

describe('/api/chat', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('debería procesar correctamente una solicitud válida', async () => {
    const requestBody = {
      messages: [
        { role: 'user', content: '¿Qué información tienes sobre inteligencia artificial?' }
      ]
    };

    const request = new Request('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    const response = await POST(request);

    expect(response).toBeInstanceOf(Response);
  });

  it('debería retornar error 400 si no se proporcionan mensajes', async () => {
    const request = new Request('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
    expect(await response.text()).toBe('Se requiere un array de mensajes');
  });

  it('debería retornar error 400 si el último mensaje no tiene contenido', async () => {
    const requestBody = {
      messages: [
        { role: 'user', content: '' }
      ]
    };

    const request = new Request('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
    expect(await response.text()).toBe('El último mensaje debe tener contenido');
  });
}); 