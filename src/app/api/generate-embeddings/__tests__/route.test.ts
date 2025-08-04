import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST, GET } from '../route';

// Mock dependencies
const mockRepository = {
  findById: vi.fn(),
  findAll: vi.fn(),
  update: vi.fn()
};

const mockEmbeddingsService = {
  generateEmbedding: vi.fn()
};

vi.mock('../../../../adapters/output/infrastructure/supabase', () => ({
  SupabaseMarkdownRepository: vi.fn(() => mockRepository)
}));

vi.mock('../../../../services/embeddings/EmbeddingsService', () => ({
  EmbeddingsService: vi.fn(() => mockEmbeddingsService)
}));

// Helper to create NextRequest
const createRequest = (body: Record<string, unknown> = {}, method = 'POST') => {
  return new NextRequest('http://localhost/api/generate-embeddings', {
    method,
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' }
  });
};

// Sample data
const samplePages = [
  {
    id: 'page-1',
    title: 'Test Page 1',
    content: 'Content for page 1',
    embedding: null,
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 'page-2',
    title: 'Test Page 2',
    content: 'Content for page 2',
    embedding: [0.1, 0.2, 0.3],
    updated_at: '2024-01-02T00:00:00Z'
  },
  {
    id: 'page-3',
    title: 'Test Page 3',
    content: 'Content for page 3',
    embedding: [],
    updated_at: '2024-01-03T00:00:00Z'
  }
];

const sampleEmbedding = [0.1, 0.2, 0.3, 0.4, 0.5];

describe('/api/generate-embeddings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'log').mockImplementation(() => { });
    vi.spyOn(console, 'warn').mockImplementation(() => { });
    vi.spyOn(console, 'error').mockImplementation(() => { });
  });

  describe('POST - Generación de embeddings', () => {
    describe('Casos exitosos', () => {
      it('should generate embeddings for specific page IDs', async () => {
        mockRepository.findById.mockResolvedValueOnce(samplePages[0]);
        mockRepository.findById.mockResolvedValueOnce(samplePages[2]);
        mockEmbeddingsService.generateEmbedding.mockResolvedValue(sampleEmbedding);
        mockRepository.update.mockResolvedValue(undefined);

        const request = createRequest({
          pageIds: ['page-1', 'page-3'],
          batchSize: 5
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.stats.totalPages).toBe(2);
        expect(data.stats.embeddingsGenerated).toBe(2);
        expect(data.stats.errors).toBe(0);
        expect(mockRepository.findById).toHaveBeenCalledTimes(2);
        expect(mockEmbeddingsService.generateEmbedding).toHaveBeenCalledTimes(2);
      });

      it('should generate embeddings for all pages when no pageIds provided', async () => {
        mockRepository.findAll.mockResolvedValue([samplePages[0], samplePages[2]]);
        mockEmbeddingsService.generateEmbedding.mockResolvedValue(sampleEmbedding);
        mockRepository.update.mockResolvedValue(undefined);

        const request = createRequest({ batchSize: 10 });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.stats.totalPages).toBe(2);
        expect(data.stats.embeddingsGenerated).toBe(2);
        expect(mockRepository.findAll).toHaveBeenCalled();
      });

      it('should skip pages that already have embeddings unless forceRegenerate is true', async () => {
        mockRepository.findAll.mockResolvedValue(samplePages);

        const request = createRequest({ forceRegenerate: false });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.stats.totalPages).toBe(3);
        expect(data.stats.skipped).toBe(1); // page-2 has embeddings
        expect(mockEmbeddingsService.generateEmbedding).toHaveBeenCalledTimes(2);
      });

      it('should regenerate all embeddings when forceRegenerate is true', async () => {
        mockRepository.findAll.mockResolvedValue([samplePages[1]]);
        mockEmbeddingsService.generateEmbedding.mockResolvedValue(sampleEmbedding);
        mockRepository.update.mockResolvedValue(undefined);

        const request = createRequest({ forceRegenerate: true });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.stats.embeddingsGenerated).toBe(1);
        expect(mockEmbeddingsService.generateEmbedding).toHaveBeenCalledWith(
          `${samplePages[1].title}\n\n${samplePages[1].content}`
        );
      });

      it('should return success when no pages need embeddings', async () => {
        mockRepository.findAll.mockResolvedValue([samplePages[1]]);

        const request = createRequest({ forceRegenerate: false });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.message).toContain('ya tienen embeddings');
        expect(data.stats.skipped).toBe(1);
        expect(mockEmbeddingsService.generateEmbedding).not.toHaveBeenCalled();
      });

      it('should handle empty page list', async () => {
        mockRepository.findAll.mockResolvedValue([]);

        const request = createRequest({ forceRegenerate: true });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.message).toContain('No hay páginas para procesar');
        expect(data.stats.totalPages).toBe(0);
      });
    });

    describe('Manejo de errores', () => {
      it('should handle page not found in specific pageIds', async () => {
        mockRepository.findById.mockResolvedValueOnce(samplePages[0]);
        mockRepository.findById.mockResolvedValueOnce(null);
        mockEmbeddingsService.generateEmbedding.mockResolvedValue(sampleEmbedding);
        mockRepository.update.mockResolvedValue(undefined);

        const request = createRequest({ pageIds: ['page-1', 'nonexistent'] });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.stats.totalPages).toBe(1); // Only found page-1
        expect(console.warn).toHaveBeenCalledWith('⚠️ Página no encontrada: nonexistent');
      });

      it('should handle embedding generation errors', async () => {
        mockRepository.findAll.mockResolvedValue([samplePages[0]]);
        mockEmbeddingsService.generateEmbedding.mockRejectedValue(new Error('API Error'));

        const request = createRequest({});

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.stats.errors).toBe(1);
        expect(data.stats.embeddingsGenerated).toBe(0);
        expect(data.errors).toContain('Error en página "Test Page 1": API Error');
      });

      it('should handle repository update errors', async () => {
        mockRepository.findAll.mockResolvedValue([samplePages[0]]);
        mockEmbeddingsService.generateEmbedding.mockResolvedValue(sampleEmbedding);
        mockRepository.update.mockRejectedValue(new Error('Database Error'));

        const request = createRequest({});

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.stats.errors).toBe(1);
        expect(data.errors).toContain('Error en página "Test Page 1": Database Error');
      });

      it('should handle invalid JSON request', async () => {
        const request = new NextRequest('http://localhost/api/generate-embeddings', {
          method: 'POST',
          body: 'invalid json',
          headers: { 'Content-Type': 'application/json' }
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.success).toBe(false);
        expect(data.message).toContain('Error durante la generación');
      });

      it('should handle repository findAll errors', async () => {
        mockRepository.findAll.mockRejectedValue(new Error('Database Connection Error'));

        const request = createRequest({});

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.success).toBe(false);
        expect(data.message).toContain('Database Connection Error');
      });

      it('should handle unknown errors gracefully', async () => {
        mockRepository.findAll.mockResolvedValue([samplePages[0]]);
        mockEmbeddingsService.generateEmbedding.mockRejectedValue('String error');

        const request = createRequest({});

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.stats.errors).toBe(1);
        expect(data.errors[0]).toContain('Error desconocido');
      });
    });

    describe('Configuración de parámetros', () => {
      it('should use default values when parameters not provided', async () => {
        mockRepository.findAll.mockResolvedValue([]);

        const request = createRequest({});

        const response = await POST(request);

        expect(response.status).toBe(200);
        expect(console.log).toHaveBeenCalledWith('📋 Configuración: forceRegenerate=false, batchSize=10');
      });

      it('should respect custom batchSize', async () => {
        mockRepository.findAll.mockResolvedValue([]);

        const request = createRequest({ batchSize: 5 });

        await POST(request);

        expect(console.log).toHaveBeenCalledWith('📋 Configuración: forceRegenerate=false, batchSize=5');
      });

      it('should log specific pageIds information', async () => {
        mockRepository.findById.mockResolvedValue(null);

        const request = createRequest({ pageIds: ['id1', 'id2', 'id3'] });

        await POST(request);

        expect(console.log).toHaveBeenCalledWith('🎯 Páginas específicas: 3 IDs proporcionados');
      });
    });

    describe('Procesamiento en lotes', () => {
      it('should process pages in batches', async () => {
        const manyPages = Array.from({ length: 5 }, (_, i) => ({
          ...samplePages[0],
          id: `page-${i}`,
          title: `Page ${i}`
        }));

        mockRepository.findAll.mockResolvedValue(manyPages);
        mockEmbeddingsService.generateEmbedding.mockResolvedValue(sampleEmbedding);
        mockRepository.update.mockResolvedValue(undefined);

        const request = createRequest({ batchSize: 2 });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.stats.embeddingsGenerated).toBe(5);
        expect(mockEmbeddingsService.generateEmbedding).toHaveBeenCalledTimes(5);
      });
    });
  });

  describe('GET - Estadísticas de embeddings', () => {
    it('should return embedding statistics successfully', async () => {
      mockRepository.findAll.mockResolvedValue(samplePages);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Estadísticas de embeddings obtenidas');
      expect(data.stats.totalPages).toBe(3);
      expect(data.stats.pagesWithEmbeddings).toBe(1);
      expect(data.stats.pagesWithoutEmbeddings).toBe(2);
      expect(data.stats.embeddingCoverage).toBe('33.3');
    });

    it('should handle empty database', async () => {
      mockRepository.findAll.mockResolvedValue([]);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.stats.totalPages).toBe(0);
      expect(data.stats.embeddingCoverage).toBe('0');
      expect(data.pagesWithoutEmbeddings).toEqual([]);
    });

    it('should include pages without embeddings in response', async () => {
      mockRepository.findAll.mockResolvedValue(samplePages);

      const response = await GET();
      const data = await response.json();

      expect(data.pagesWithoutEmbeddings).toHaveLength(2);
      expect(data.pagesWithoutEmbeddings[0]).toEqual({
        id: 'page-1',
        title: 'Test Page 1',
        updated_at: '2024-01-01T00:00:00Z'
      });
      expect(data.pagesWithoutEmbeddings[1]).toEqual({
        id: 'page-3',
        title: 'Test Page 3',
        updated_at: '2024-01-03T00:00:00Z'
      });
    });

    it('should handle repository errors', async () => {
      mockRepository.findAll.mockRejectedValue(new Error('Database Error'));

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.message).toContain('Database Error');
    });

    it('should handle unknown errors', async () => {
      mockRepository.findAll.mockRejectedValue('String error');

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.message).toContain('Error desconocido');
    });

    it('should calculate coverage correctly with all pages having embeddings', async () => {
      const pagesWithEmbeddings = samplePages.map(page => ({
        ...page,
        embedding: [0.1, 0.2, 0.3]
      }));

      mockRepository.findAll.mockResolvedValue(pagesWithEmbeddings);

      const response = await GET();
      const data = await response.json();

      expect(data.stats.pagesWithEmbeddings).toBe(3);
      expect(data.stats.pagesWithoutEmbeddings).toBe(0);
      expect(data.stats.embeddingCoverage).toBe('100.0');
    });
  });

  describe('Logging y debugging', () => {
    it('should log comprehensive processing information', async () => {
      mockRepository.findAll.mockResolvedValue([samplePages[0]]);
      mockEmbeddingsService.generateEmbedding.mockResolvedValue(sampleEmbedding);
      mockRepository.update.mockResolvedValue(undefined);

      const request = createRequest({});

      await POST(request);

      expect(console.log).toHaveBeenCalledWith('🧠 Iniciando generación de embeddings...');
      expect(console.log).toHaveBeenCalledWith('📄 Obteniendo todas las páginas...');
      expect(console.log).toHaveBeenCalledWith('📊 Total de páginas a evaluar: 1');
      expect(console.log).toHaveBeenCalledWith('🎯 Páginas que necesitan embeddings: 1');
      expect(console.log).toHaveBeenCalledWith('🎉 Generación de embeddings completada');
    });

    it('should log batch processing information', async () => {
      mockRepository.findAll.mockResolvedValue([samplePages[0]]);
      mockEmbeddingsService.generateEmbedding.mockResolvedValue(sampleEmbedding);
      mockRepository.update.mockResolvedValue(undefined);

      const request = createRequest({ batchSize: 1 });

      await POST(request);

      expect(console.log).toHaveBeenCalledWith('📦 Procesando lote 1/1 (1 páginas)');
      expect(console.log).toHaveBeenCalledWith('🧠 [1/1] Generando embedding para: "Test Page 1"');
      expect(console.log).toHaveBeenCalledWith('✅ [1/1] Embedding generado para "Test Page 1" (5 dimensiones)');
      expect(console.log).toHaveBeenCalledWith('✅ Lote 1/1 completado');
    });

    it('should log final statistics', async () => {
      mockRepository.findAll.mockResolvedValue([samplePages[0]]);
      mockEmbeddingsService.generateEmbedding.mockResolvedValue(sampleEmbedding);
      mockRepository.update.mockResolvedValue(undefined);

      const request = createRequest({});

      await POST(request);

      expect(console.log).toHaveBeenCalledWith('📊 Estadísticas finales:');
      expect(console.log).toHaveBeenCalledWith('📊 • Total evaluado: 1 páginas');
      expect(console.log).toHaveBeenCalledWith('📊 • Procesado: 1 páginas');
      expect(console.log).toHaveBeenCalledWith('📊 • Embeddings generados: 1');
      expect(console.log).toHaveBeenCalledWith('📊 • Errores: 0');
      expect(console.log).toHaveBeenCalledWith('📊 • Omitidas: 0');
    });
  });
}); 