import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { EmbeddingsService } from '../EmbeddingsService';

// Usar el sistema centralizado de mocks
import {
  createTestSetup
} from '../../../mocks';

// Mocks inline para evitar problemas de hoisting
vi.mock('ai', () => ({
  embed: vi.fn(),
  embedMany: vi.fn()
}));

vi.mock('@ai-sdk/google', () => ({
  google: {
    textEmbeddingModel: vi.fn(() => 'mock-model')
  }
}));

describe('EmbeddingsService', () => {
  let service: EmbeddingsService;
  let mockEmbed: ReturnType<typeof vi.fn>;
  let mockEmbedMany: ReturnType<typeof vi.fn>;
  const { teardown } = createTestSetup();

  beforeEach(async () => {
    vi.clearAllMocks();

    mockEmbed = vi.mocked(await import('ai')).embed;
    mockEmbedMany = vi.mocked(await import('ai')).embedMany;

    service = new EmbeddingsService();
  });

  afterEach(() => {
    teardown(); // ✅ Limpieza automática
  });

  describe('Constructor', () => {
    it('debe inicializar correctamente', () => {
      expect(service).toBeInstanceOf(EmbeddingsService);
    });
  });

  describe('generateEmbedding', () => {
    it('debe generar embedding para texto válido', async () => {
      const mockEmbedding = [0.1, 0.2, 0.3, 0.4];
      mockEmbed.mockResolvedValue({
        embedding: mockEmbedding,
        value: 'test',
        usage: { tokens: 10 }
      });

      const resultado = await service.generateEmbedding('Texto de prueba');

      expect(mockEmbed).toHaveBeenCalled();
      expect(resultado).toEqual(mockEmbedding);
    });

    it('debe limpiar texto con espacios y saltos de línea', async () => {
      const mockEmbedding = [0.1, 0.2, 0.3];
      mockEmbed.mockResolvedValue({
        embedding: mockEmbedding,
        value: 'test',
        usage: { tokens: 10 }
      });

      const resultado = await service.generateEmbedding('  Texto\n\ncon   espacios\n  ');

      expect(mockEmbed).toHaveBeenCalled();
      expect(resultado).toEqual(mockEmbedding);
    });

    it('debe truncar texto muy largo', async () => {
      const mockEmbedding = [0.1, 0.2, 0.3];
      mockEmbed.mockResolvedValue({
        embedding: mockEmbedding,
        value: 'test',
        usage: { tokens: 10 }
      });

      const textoLargo = 'a'.repeat(10000);
      const resultado = await service.generateEmbedding(textoLargo);

      expect(mockEmbed).toHaveBeenCalled();
      expect(resultado).toEqual(mockEmbedding);
    });

    it('debe rechazar texto vacío', async () => {
      await expect(service.generateEmbedding('')).rejects.toThrow(
        'El texto está vacío después de la limpieza'
      );
    });

    it('debe rechazar texto que se limpia a vacío', async () => {
      await expect(service.generateEmbedding('   \n\n   ')).rejects.toThrow(
        'El texto está vacío después de la limpieza'
      );
    });

    it('debe manejar errores de la API', async () => {
      const errorAPI = new Error('API Error');
      mockEmbed.mockRejectedValue(errorAPI);

      await expect(service.generateEmbedding('Texto válido')).rejects.toThrow(
        'Error al generar embedding: API Error'
      );
    });

    it('debe manejar errores desconocidos', async () => {
      mockEmbed.mockRejectedValue('Error string');

      await expect(service.generateEmbedding('Texto válido')).rejects.toThrow(
        'Error al generar embedding: Error desconocido'
      );
    });
  });

  describe('generateEmbeddings', () => {
    it('debe generar múltiples embeddings para textos válidos', async () => {
      const mockEmbeddings = [
        [0.1, 0.2, 0.3],
        [0.4, 0.5, 0.6],
        [0.7, 0.8, 0.9]
      ];
      mockEmbedMany.mockResolvedValue({
        embeddings: mockEmbeddings,
        values: ['text1', 'text2', 'text3'],
        usage: { tokens: 30 }
      });

      const textos = ['Texto 1', 'Texto 2', 'Texto 3'];
      const resultado = await service.generateEmbeddings(textos);

      expect(mockEmbedMany).toHaveBeenCalled();
      expect(resultado).toEqual(mockEmbeddings);
    });

    it('debe filtrar textos vacíos', async () => {
      const mockEmbeddings = [
        [0.1, 0.2, 0.3],
        [0.4, 0.5, 0.6]
      ];
      mockEmbedMany.mockResolvedValue({
        embeddings: mockEmbeddings,
        values: ['text1', 'text2'],
        usage: { tokens: 20 }
      });

      const textos = ['Texto válido 1', '', '   \n   ', 'Texto válido 2'];
      const resultado = await service.generateEmbeddings(textos);

      expect(mockEmbedMany).toHaveBeenCalled();
      expect(resultado).toEqual(mockEmbeddings);
    });

    it('debe rechazar cuando todos los textos están vacíos', async () => {
      const textos = ['', '   ', '\n\n', '  \n  '];

      await expect(service.generateEmbeddings(textos)).rejects.toThrow(
        'Todos los textos están vacíos después de la limpieza'
      );
    });

    it('debe manejar errores de la API', async () => {
      const errorAPI = new Error('API Batch Error');
      mockEmbedMany.mockRejectedValue(errorAPI);

      await expect(service.generateEmbeddings(['Texto 1', 'Texto 2'])).rejects.toThrow(
        'Error al generar embeddings: API Batch Error'
      );
    });

    it('debe manejar errores desconocidos en batch', async () => {
      mockEmbedMany.mockRejectedValue('Error string batch');

      await expect(service.generateEmbeddings(['Texto 1'])).rejects.toThrow(
        'Error al generar embeddings: Error desconocido'
      );
    });
  });

  describe('Funcionalidad de limpieza', () => {
    it('debe procesar texto con limpieza completa', async () => {
      const mockEmbedding = [0.1, 0.2, 0.3, 0.4, 0.5];
      mockEmbed.mockResolvedValue({
        embedding: mockEmbedding,
        value: 'test',
        usage: { tokens: 10 }
      });

      const texto = `
        Este es un documento de prueba con:
        - Múltiples líneas
        - Espacios   extras
        - Saltos de línea

        Y contenido variado.
      `;

      const resultado = await service.generateEmbedding(texto);

      expect(resultado).toEqual(mockEmbedding);
      expect(mockEmbed).toHaveBeenCalled();
    });

    it('debe manejar batch de textos mixtos', async () => {
      const mockEmbeddings = [
        [0.1, 0.2, 0.3],
        [0.4, 0.5, 0.6]
      ];
      mockEmbedMany.mockResolvedValue({
        embeddings: mockEmbeddings,
        values: ['text1', 'text2'],
        usage: { tokens: 20 }
      });

      const textos = [
        'Texto normal',
        '',
        '  Texto con espacios  ',
        '   ',
        'Último texto válido'
      ];

      const resultado = await service.generateEmbeddings(textos);

      expect(resultado).toEqual(mockEmbeddings);
      expect(mockEmbedMany).toHaveBeenCalled();
    });
  });
}); 