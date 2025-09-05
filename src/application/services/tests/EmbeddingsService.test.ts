import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { EmbeddingsService } from '../EmbeddingsService';
import type { ILogger } from '@/application/interfaces/ILogger';
import { createTestSetup } from '@/mocks';

// Mock del módulo @ai-sdk/google
vi.mock('@ai-sdk/google', () => ({
  google: {
    textEmbeddingModel: vi.fn().mockReturnValue('mocked-model')
  }
}));

// Mock del módulo ai
vi.mock('ai', () => ({
  embed: vi.fn(),
  embedMany: vi.fn()
}));

import { embed, embedMany } from 'ai';

describe('EmbeddingsService', () => {
  let embeddingsService: EmbeddingsService;
  let mockLogger: ILogger;
  const { teardown } = createTestSetup();

  beforeEach(() => {
    vi.clearAllMocks();

    mockLogger = {
      info: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
      warn: vi.fn()
    };

    embeddingsService = new EmbeddingsService(mockLogger);
  });

  afterEach(() => {
    teardown();
  });

  describe('constructor', () => {
    it('debería inicializar correctamente con el modelo de Google', () => {
      expect(mockLogger.info).toHaveBeenCalledWith('EmbeddingsService initialized with Google text-embedding-004 model');
    });
  });

  describe('generateEmbedding', () => {
    it('debería generar embedding para texto válido', async () => {
      const mockEmbedding = [0.1, 0.2, 0.3, 0.4];
      (embed as vi.Mock).mockResolvedValue({ embedding: mockEmbedding });

      const result = await embeddingsService.generateEmbedding('Texto de prueba');

      expect(result).toEqual(mockEmbedding);
      expect(embed).toHaveBeenCalledWith({
        model: 'mocked-model',
        value: 'Texto de prueba'
      });
      expect(mockLogger.debug).toHaveBeenCalledWith('Generating single embedding', { textLength: 15 });
      expect(mockLogger.debug).toHaveBeenCalledWith('Single embedding generated successfully', {
        embeddingDimensions: 4,
        cleanTextLength: 15
      });
    });

    it('debería limpiar texto con espacios y saltos de línea', async () => {
      const mockEmbedding = [0.1, 0.2, 0.3];
      (embed as vi.Mock).mockResolvedValue({ embedding: mockEmbedding });

      await embeddingsService.generateEmbedding('  Texto\n\ncon    espacios  \n  ');

      expect(embed).toHaveBeenCalledWith({
        model: 'mocked-model',
        value: 'Texto con espacios'
      });
    });

    it('debería truncar texto muy largo', async () => {
      const longText = 'a'.repeat(9000);
      const mockEmbedding = [0.1, 0.2];
      (embed as vi.Mock).mockResolvedValue({ embedding: mockEmbedding });

      await embeddingsService.generateEmbedding(longText);

      expect(embed).toHaveBeenCalledWith({
        model: 'mocked-model',
        value: 'a'.repeat(8000)
      });
      expect(mockLogger.debug).toHaveBeenCalledWith('Text cleaned', {
        originalLength: 9000,
        cleanedLength: 8000,
        truncated: true
      });
    });

    it('debería rechazar texto vacío', async () => {
      await expect(embeddingsService.generateEmbedding('')).rejects.toThrow('El texto está vacío después de la limpieza');
      expect(mockLogger.error).toHaveBeenCalledWith('Failed to generate embedding: empty text after cleaning', expect.any(Error));
    });

    it('debería rechazar texto que se limpia a vacío', async () => {
      await expect(embeddingsService.generateEmbedding('   \n\n   ')).rejects.toThrow('El texto está vacío después de la limpieza');
    });

    it('debería manejar errores de la API', async () => {
      const apiError = new Error('API Error');
      (embed as vi.Mock).mockRejectedValue(apiError);

      await expect(embeddingsService.generateEmbedding('texto')).rejects.toThrow('Error al generar embedding: API Error');
      expect(mockLogger.error).toHaveBeenCalledWith('Error generating embedding with Google', apiError);
    });

    it('debería manejar errores desconocidos', async () => {
      (embed as vi.Mock).mockRejectedValue('Error string');

      await expect(embeddingsService.generateEmbedding('texto')).rejects.toThrow('Error al generar embedding: Error desconocido');
    });
  });

  describe('generateEmbeddings', () => {
    it('debería generar múltiples embeddings para textos válidos', async () => {
      const mockEmbeddings = [[0.1, 0.2], [0.3, 0.4], [0.5, 0.6]];
      (embedMany as vi.Mock).mockResolvedValue({ embeddings: mockEmbeddings });

      const texts = ['Texto 1', 'Texto 2', 'Texto 3'];
      const result = await embeddingsService.generateEmbeddings(texts);

      expect(result).toEqual(mockEmbeddings);
      expect(embedMany).toHaveBeenCalledWith({
        model: 'mocked-model',
        values: texts
      });
      expect(mockLogger.info).toHaveBeenCalledWith('Starting batch embeddings generation', { totalTexts: 3 });
      expect(mockLogger.info).toHaveBeenCalledWith('Generating 3 embeddings with Google...');
      expect(mockLogger.info).toHaveBeenCalledWith('3 embeddings generated successfully', {
        successfulEmbeddings: 3,
        originalTexts: 3,
        cleanTexts: 3,
        embeddingDimensions: 2
      });
    });

    it('debería filtrar textos vacíos', async () => {
      const mockEmbeddings = [[0.1, 0.2], [0.3, 0.4]];
      (embedMany as vi.Mock).mockResolvedValue({ embeddings: mockEmbeddings });

      const texts = ['Texto 1', '', 'Texto 2', '   \n   '];
      const result = await embeddingsService.generateEmbeddings(texts);

      expect(result).toEqual(mockEmbeddings);
      expect(embedMany).toHaveBeenCalledWith({
        model: 'mocked-model',
        values: ['Texto 1', 'Texto 2']
      });
      expect(mockLogger.info).toHaveBeenCalledWith('Generating 2 embeddings with Google...');
      expect(mockLogger.info).toHaveBeenCalledWith('2 embeddings generated successfully', {
        successfulEmbeddings: 2,
        originalTexts: 4,
        cleanTexts: 2,
        embeddingDimensions: 2
      });
    });

    it('debería rechazar cuando todos los textos están vacíos', async () => {
      const texts = ['', '   ', '\n\n\n'];

      await expect(embeddingsService.generateEmbeddings(texts)).rejects.toThrow('Todos los textos están vacíos después de la limpieza');
      expect(mockLogger.error).toHaveBeenCalledWith('Failed to generate embeddings: all texts empty after cleaning', expect.any(Error));
    });

    it('debería manejar errores de la API', async () => {
      const apiError = new Error('API Batch Error');
      (embedMany as vi.Mock).mockRejectedValue(apiError);

      const texts = ['Texto 1', 'Texto 2'];
      await expect(embeddingsService.generateEmbeddings(texts)).rejects.toThrow('Error al generar embeddings: API Batch Error');
      expect(mockLogger.error).toHaveBeenCalledWith('Error generating embeddings with Google', apiError);
    });

    it('debería manejar errores desconocidos en batch', async () => {
      (embedMany as vi.Mock).mockRejectedValue('Error string batch');

      const texts = ['Texto'];
      await expect(embeddingsService.generateEmbeddings(texts)).rejects.toThrow('Error al generar embeddings: Error desconocido');
    });

    it('debería manejar embeddings vacíos en respuesta', async () => {
      const mockEmbeddings: number[][] = [];
      (embedMany as vi.Mock).mockResolvedValue({ embeddings: mockEmbeddings });

      const texts = ['Texto 1'];
      const result = await embeddingsService.generateEmbeddings(texts);

      expect(result).toEqual([]);
      expect(mockLogger.info).toHaveBeenCalledWith('0 embeddings generated successfully', {
        successfulEmbeddings: 0,
        originalTexts: 1,
        cleanTexts: 1,
        embeddingDimensions: 0
      });
    });
  });

  describe('cleanText - funcionalidad interna', () => {
    it('debería procesar texto con limpieza completa', async () => {
      const messyText = '  \n\n  Texto con    muchos\n\nespacios y\n\nsaltos   \n\n  ';
      const mockEmbedding = [0.1];
      (embed as vi.Mock).mockResolvedValue({ embedding: mockEmbedding });

      await embeddingsService.generateEmbedding(messyText);

      expect(embed).toHaveBeenCalledWith({
        model: 'mocked-model',
        value: 'Texto con muchos espacios y saltos'
      });
    });

    it('debería manejar batch de textos mixtos', async () => {
      const texts = [
        'Texto normal',
        '  \n Texto   con\n\nespacios  \n ',
        'Otro texto normal'
      ];
      const mockEmbeddings = [[0.1], [0.2]];
      (embedMany as vi.Mock).mockResolvedValue({ embeddings: mockEmbeddings });

      await embeddingsService.generateEmbeddings(texts);

      expect(embedMany).toHaveBeenCalledWith({
        model: 'mocked-model',
        values: [
          'Texto normal',
          'Texto con espacios',
          'Otro texto normal'
        ]
      });
    });

    it('debería logear información de limpieza', async () => {
      const text = 'Texto normal';
      const mockEmbedding = [0.1];
      (embed as vi.Mock).mockResolvedValue({ embedding: mockEmbedding });

      await embeddingsService.generateEmbedding(text);

      expect(mockLogger.debug).toHaveBeenCalledWith('Text cleaned', {
        originalLength: 12,
        cleanedLength: 12,
        truncated: false
      });
    });
  });
});

