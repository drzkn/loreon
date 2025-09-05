import { describe, it, expect, vi, beforeEach, afterEach, Mock } from 'vitest';
import { ChatController } from '../ChatController';
import type { ILogger } from '@/application/interfaces/ILogger';
import type { INotionMigrationService } from '@/application/interfaces/INotionMigrationService';
import type { ChatRequestDto } from '@/presentation/dto/ChatRequestDto';
import { createTestSetup } from '@/mocks';

// Mock del módulo @ai-sdk/google
vi.mock('@ai-sdk/google', () => ({
  google: vi.fn().mockReturnValue('mocked-google-model')
}));

// Mock del módulo ai
vi.mock('ai', () => ({
  streamText: vi.fn().mockReturnValue({
    toDataStreamResponse: vi.fn().mockReturnValue(new Response('mocked response'))
  })
}));

import { streamText } from 'ai';

describe('ChatController', () => {
  let chatController: ChatController;
  let mockNotionMigrationService: INotionMigrationService;
  let mockLogger: ILogger;
  const { teardown } = createTestSetup();

  beforeEach(() => {
    vi.clearAllMocks();

    mockNotionMigrationService = {
      searchContent: vi.fn()
    } as unknown as INotionMigrationService;

    mockLogger = {
      info: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
      warn: vi.fn(),
      success: vi.fn()
    };

    chatController = new ChatController(mockNotionMigrationService, mockLogger);
  });

  afterEach(() => {
    teardown();
  });

  describe('processChat', () => {
    const validRequest: ChatRequestDto = {
      messages: [
        { role: 'user', content: 'Hola' },
        { role: 'assistant', content: 'Hola! ¿En qué puedo ayudarte?' },
        { role: 'user', content: '¿Qué sabes sobre Gydu?' }
      ],
      options: {
        useEmbeddings: false,
        temperature: 0.7,
        maxTokens: 1000
      }
    };

    it('debería procesar chat exitosamente sin embeddings', async () => {
      const mockSearchResult = {
        textResults: [
          { type: 'paragraph', plain_text: 'Información sobre Gydu' }
        ],
        pageResults: [
          {
            title: 'Página de Gydu',
            raw_data: { original_content: 'Contenido completo sobre Gydu' }
          }
        ]
      };

      mockNotionMigrationService.searchContent = vi.fn().mockResolvedValue(mockSearchResult);

      const response = await chatController.processChat(validRequest);

      expect(response).toBeInstanceOf(Response);
      expect(mockLogger.info).toHaveBeenCalledWith('Processing chat request', {
        messagesCount: 3,
        useEmbeddings: false
      });
      expect(mockNotionMigrationService.searchContent).toHaveBeenCalledWith('Gydu', {
        useEmbeddings: false,
        limit: 5
      });
      expect(streamText).toHaveBeenCalledWith({
        model: 'mocked-google-model',
        messages: expect.arrayContaining([
          { role: 'system', content: expect.stringContaining('Eres un asistente virtual') },
          ...validRequest.messages
        ]),
        temperature: 0.7,
        maxTokens: 1000
      });
    });

    it('debería procesar chat con embeddings', async () => {
      const requestWithEmbeddings = {
        ...validRequest,
        options: { ...validRequest.options, useEmbeddings: true }
      };

      const mockSearchResult = {
        embeddingResults: [
          {
            block: { type: 'paragraph', plain_text: 'Resultado de embedding' },
            similarity: 0.85
          }
        ]
      };

      mockNotionMigrationService.searchContent = vi.fn().mockResolvedValue(mockSearchResult);

      await chatController.processChat(requestWithEmbeddings);

      expect(mockNotionMigrationService.searchContent).toHaveBeenCalledWith('¿Qué sabes sobre Gydu?', {
        useEmbeddings: true,
        limit: 5,
        threshold: 0.7
      });
    });

    it('debería usar nombres específicos en consultas', async () => {
      const sikaasRequest = {
        ...validRequest,
        messages: [{ role: 'user' as const, content: '¿Qué sabes sobre Sikaas?' }]
      };

      mockNotionMigrationService.searchContent = vi.fn().mockResolvedValue({
        textResults: [],
        pageResults: []
      });

      await chatController.processChat(sikaasRequest);

      expect(mockNotionMigrationService.searchContent).toHaveBeenCalledWith('Sikaas', {
        useEmbeddings: false,
        limit: 5
      });
    });

    it('debería manejar consultas sobre capitán', async () => {
      const capitanRequest = {
        ...validRequest,
        messages: [{ role: 'user' as const, content: '¿Quién es el capitán?' }]
      };

      mockNotionMigrationService.searchContent = vi.fn().mockResolvedValue({
        textResults: [],
        pageResults: []
      });

      await chatController.processChat(capitanRequest);

      expect(mockNotionMigrationService.searchContent).toHaveBeenCalledWith('capitán', {
        useEmbeddings: false,
        limit: 5
      });
    });

    it('debería validar mensajes requeridos', async () => {
      const invalidRequest = {
        messages: null,
        options: {}
      } as unknown as ChatRequestDto;

      await expect(chatController.processChat(invalidRequest)).rejects.toThrow();
      expect(mockLogger.error).toHaveBeenCalledWith('Invalid chat request: missing messages', expect.any(Error));
    });

    it('debería validar último mensaje con contenido', async () => {
      const invalidRequest = {
        messages: [
          { role: 'user', content: 'Mensaje válido' },
          { role: 'user', content: '' }
        ]
      } as ChatRequestDto;

      await expect(chatController.processChat(invalidRequest)).rejects.toThrow('El último mensaje debe tener contenido');
      expect(mockLogger.error).toHaveBeenCalledWith('Invalid chat request: empty last message', expect.any(Error));
    });

    it('debería usar configuración por defecto para opciones', async () => {
      const requestWithoutOptions = {
        messages: [{ role: 'user', content: 'Test' }]
      } as ChatRequestDto;

      mockNotionMigrationService.searchContent = vi.fn().mockResolvedValue({
        textResults: [],
        pageResults: []
      });

      await chatController.processChat(requestWithoutOptions);

      expect(streamText).toHaveBeenCalledWith(expect.objectContaining({
        temperature: 0.7,
        maxTokens: 1000
      }));
    });

    it('debería manejar errores en el procesamiento', async () => {
      const error = new Error('Processing error');
      mockNotionMigrationService.searchContent = vi.fn().mockRejectedValue(error);

      // Mock streamText para que también falle
      (streamText as Mock).mockRejectedValue(error);

      await expect(chatController.processChat(validRequest)).rejects.toThrow('Processing error');
      expect(mockLogger.error).toHaveBeenCalledWith('Error processing chat request', error);
    });
  });

  describe('processSimpleChat', () => {
    const validRequest: ChatRequestDto = {
      messages: [{ role: 'user', content: 'Test message' }]
    };

    it('debería procesar chat simple exitosamente', async () => {
      const mockSearchResult = {
        textResults: [{ type: 'paragraph', plain_text: 'Result' }],
        pageResults: []
      };

      mockNotionMigrationService.searchContent = vi.fn().mockResolvedValue(mockSearchResult);

      const result = await chatController.processSimpleChat(validRequest);

      expect(result).toEqual({
        success: true,
        message: 'Chat procesado exitosamente',
        metadata: {
          sourcesFound: 0,
          responseTime: expect.any(Number)
        }
      });
      expect(mockLogger.info).toHaveBeenCalledWith('Processing simple chat request', {
        messagesCount: 1
      });
    });

    it('debería validar mensajes en chat simple', async () => {
      const invalidRequest = {
        messages: null
      } as unknown as ChatRequestDto;

      const result = await chatController.processSimpleChat(invalidRequest);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Se requiere un array de mensajes');
    });

    it('debería validar contenido del último mensaje', async () => {
      const invalidRequest = {
        messages: [{ role: 'user', content: '' }]
      } as ChatRequestDto;

      const result = await chatController.processSimpleChat(invalidRequest);

      expect(result).toEqual({
        success: false,
        error: 'El último mensaje debe tener contenido'
      });
    });

    it('debería manejar errores y retornar respuesta de error', async () => {
      const error = new Error('Simple chat error');
      mockNotionMigrationService.searchContent = vi.fn().mockRejectedValue(error);

      const result = await chatController.processSimpleChat(validRequest);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Simple chat error');
      expect(mockLogger.error).toHaveBeenCalledWith('Error processing simple chat', error);
    });

    it('debería manejar errores desconocidos', async () => {
      mockNotionMigrationService.searchContent = vi.fn().mockRejectedValue('string error');

      const result = await chatController.processSimpleChat(validRequest);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Error desconocido');
    });
  });

  describe('extractContext - funcionalidad interna', () => {
    it('debería extraer contexto sin embeddings', async () => {
      const mockSearchResult = {
        textResults: [
          { type: 'paragraph', plain_text: 'Texto de bloque' }
        ],
        pageResults: [
          {
            title: 'Página Test',
            raw_data: { original_content: 'Contenido de la página' }
          }
        ]
      };

      mockNotionMigrationService.searchContent = vi.fn().mockResolvedValue(mockSearchResult);

      // Acceder al método privado para testing
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await (chatController as any).extractContext('test query', false);

      expect(result.context).toContain('**paragraph**\nTexto de bloque');
      expect(result.context).toContain('**Página: Página Test**');
      expect(result.searchSummary).toBe('Se encontraron 1 bloques y 1 páginas relevantes usando búsqueda por texto.');
    });

    it('debería extraer contexto con embeddings', async () => {
      const mockSearchResult = {
        embeddingResults: [
          {
            block: { type: 'heading', plain_text: 'Título importante' },
            similarity: 0.9
          }
        ]
      };

      mockNotionMigrationService.searchContent = vi.fn().mockResolvedValue(mockSearchResult);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await (chatController as any).extractContext('test query', true);

      expect(result.context).toContain('**heading** (similaridad: 90%)');
      expect(result.context).toContain('Título importante');
      expect(result.searchSummary).toBe('Se encontraron 1 bloques relevantes usando búsqueda semántica (embeddings).');
    });

    it('debería manejar resultados vacíos', async () => {
      mockNotionMigrationService.searchContent = vi.fn().mockResolvedValue({
        textResults: [],
        pageResults: []
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await (chatController as any).extractContext('test query', false);

      expect(result.context).toBe('');
      expect(result.searchSummary).toBe('No se encontraron resultados relevantes con búsqueda por texto.');
    });

    it('debería manejar errores en búsqueda', async () => {
      const searchError = new Error('Search failed');
      mockNotionMigrationService.searchContent = vi.fn().mockRejectedValue(searchError);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await (chatController as any).extractContext('test query', false);

      expect(result.context).toBe('');
      expect(result.searchSummary).toBe('Hubo un error técnico al buscar en la base de conocimientos.');
      expect(mockLogger.error).toHaveBeenCalledWith('Error in context extraction', searchError);
    });

    it('debería limpiar contenido de páginas con URLs e imágenes', async () => {
      const mockSearchResult = {
        textResults: [],
        pageResults: [
          {
            title: 'Página con contenido rico',
            raw_data: {
              original_content: 'Texto normal ![Imagen](https://example.com/image.jpg) más texto https://example.com/link y más contenido'
            }
          }
        ]
      };

      mockNotionMigrationService.searchContent = vi.fn().mockResolvedValue(mockSearchResult);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await (chatController as any).extractContext('test', false);

      expect(result.context).toContain('[Imagen]');
      expect(result.context).toContain('[URL]');
      expect(result.context).not.toContain('https://example.com');
    });
  });

  describe('extractKeywords - utilidad interna', () => {
    it('debería extraer palabras clave relevantes', () => {
      const text = '¿Qué sabes sobre Gydu y sus características importantes?';

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const keywords = (chatController as any).extractKeywords(text);

      expect(keywords).toContain('gydu');
      expect(keywords).toContain('características');
      expect(keywords).toContain('importantes');
      expect(keywords).not.toContain('qué');
      expect(keywords).not.toContain('sabes');
      expect(keywords).not.toContain('sobre');
    });

    it('debería filtrar palabras cortas y stop words', () => {
      const text = 'Dime información que tienes sobre el tema';

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const keywords = (chatController as any).extractKeywords(text);

      expect(keywords).not.toContain('el');
      expect(keywords).not.toContain('que');
      expect(keywords).not.toContain('dime');
      expect(keywords).toContain('tema');
    });

    it('debería manejar texto con signos de puntuación', () => {
      const text = '¿Conoces a Sikaas? ¡Explícame todo!';

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const keywords = (chatController as any).extractKeywords(text);

      expect(keywords).toContain('sikaas');
      expect(keywords).toContain('explícame');
      expect(keywords).toContain('todo');
    });
  });

  describe('buildSystemPrompt - construcción de prompt', () => {
    it('debería construir prompt del sistema correctamente', () => {
      const query = '¿Qué es Gydu?';
      const context = 'Información sobre Gydu...';
      const searchSummary = 'Se encontraron 3 resultados';

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const prompt = (chatController as any).buildSystemPrompt(query, context, searchSummary);

      expect(prompt).toContain('Eres un asistente virtual especializado');
      expect(prompt).toContain('Se encontraron 3 resultados');
      expect(prompt).toContain('Información sobre Gydu...');
      expect(prompt).toContain('¿Qué es Gydu?');
    });

    it('debería manejar contexto vacío', () => {
      const query = 'Test query';
      const context = '';
      const searchSummary = 'No se encontraron resultados';

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const prompt = (chatController as any).buildSystemPrompt(query, context, searchSummary);

      expect(prompt).toContain('No hay contexto específico disponible para esta consulta.');
    });
  });
});
