import { ILogger } from '@/application/interfaces/ILogger';
import { INotionMigrationService } from '@/application/interfaces/INotionMigrationService';
import { ChatRequestDto, ChatResponseDto } from '@/presentation/dto/ChatRequestDto';
import { google } from '@ai-sdk/google';
import { streamText } from 'ai';
import { NotionProperty } from '@/infrastructure/external-apis/interfaces/INotionApiClient';

interface NotionPage {
  notion_id: string;
  title: string;
  properties: Record<string, NotionProperty>;
  archived: boolean;
}


export class ChatController {
  constructor(
    private readonly notionMigrationService: INotionMigrationService,
    private readonly logger: ILogger
  ) { }

  async processChat(request: ChatRequestDto): Promise<Response> {
    try {
      this.logger.info('Processing chat request', {
        messagesCount: request.messages.length,
        useEmbeddings: request.options?.useEmbeddings || false
      });

      // Validar request
      if (!request.messages || !Array.isArray(request.messages)) {
        const error = 'Se requiere un array de mensajes';
        this.logger.error('Invalid chat request: missing messages', new Error(error));
        throw new Error(error);
      }

      const lastMessage = request.messages[request.messages.length - 1];
      if (!lastMessage?.content) {
        const error = 'El último mensaje debe tener contenido';
        this.logger.error('Invalid chat request: empty last message', new Error(error));
        throw new Error(error);
      }

      this.logger.debug('Extracting context for chat', {
        lastMessageLength: lastMessage.content.length,
        useEmbeddings: request.options?.useEmbeddings
      });

      // Extraer contexto basado en la consulta
      const contextResult = await this.extractContext(
        lastMessage.content,
        request.options?.useEmbeddings || false
      );

      this.logger.info('Context extracted for chat', {
        contextLength: contextResult.context.length,
        sourcesFound: contextResult.sources.length,
        searchSummary: contextResult.searchSummary.substring(0, 100)
      });

      // Crear el prompt del sistema
      console.log('🤖 ChatController: Building system prompt with context:', {
        contextLength: contextResult.context.length,
        searchSummary: contextResult.searchSummary,
        contextPreview: contextResult.context.substring(0, 200)
      });

      const systemPrompt = this.buildSystemPrompt(
        lastMessage.content,
        contextResult.context,
        contextResult.searchSummary
      );

      console.log('🤖 ChatController: System prompt length:', systemPrompt.length);

      this.logger.debug('Generating chat response with AI model');

      // Generar respuesta con el modelo AI
      const result = await streamText({
        model: google('gemini-1.5-flash'),
        messages: [
          { role: 'system', content: systemPrompt },
          ...request.messages
        ],
        temperature: request.options?.temperature || 0.7,
        maxTokens: request.options?.maxTokens || 1000,
      });

      this.logger.info('Chat response generated successfully', {
        sourcesFound: contextResult.sources.length
      });

      return result.toDataStreamResponse();

    } catch (error) {
      this.logger.error('Error processing chat request', error as Error);
      throw error;
    }
  }

  async processSimpleChat(request: ChatRequestDto): Promise<ChatResponseDto> {
    try {
      this.logger.info('Processing simple chat request', {
        messagesCount: request.messages.length
      });

      // Validar request
      if (!request.messages || !Array.isArray(request.messages)) {
        return {
          success: false,
          error: 'Se requiere un array de mensajes'
        };
      }

      const lastMessage = request.messages[request.messages.length - 1];
      if (!lastMessage?.content) {
        return {
          success: false,
          error: 'El último mensaje debe tener contenido'
        };
      }

      // Extraer contexto
      const contextResult = await this.extractContext(
        lastMessage.content,
        request.options?.useEmbeddings || false
      );

      // Para respuesta simple, podríamos usar generateText en lugar de streamText
      // Pero por ahora, devolvemos la metadata del proceso

      return {
        success: true,
        message: 'Chat procesado exitosamente',
        metadata: {
          sourcesFound: contextResult.sources.length,
          responseTime: Date.now() // placeholder
        }
      };

    } catch (error) {
      this.logger.error('Error processing simple chat', error as Error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }

  private async extractContext(
    query: string,
    useEmbeddings: boolean = false
  ): Promise<{
    context: string;
    searchSummary: string;
    sources: NotionPage[];
  }> {
    let context = '';
    let searchSummary = '';
    let sources: NotionPage[] = [];

    try {
      this.logger.info('Starting context extraction', { query: query.substring(0, 50), useEmbeddings });
      console.log('🔍 ChatController: Starting context extraction for:', query.substring(0, 50));

      if (useEmbeddings) {
        // Usar búsqueda por embeddings
        this.logger.debug('Using embeddings search');

        const searchResult = await this.notionMigrationService.searchContent(query, {
          useEmbeddings: true,
          limit: 5,
          threshold: 0.7
        });

        if (searchResult.embeddingResults && searchResult.embeddingResults.length > 0) {
          const pageContents = searchResult.embeddingResults.map(result => {
            return `**${result.block.type}** (similaridad: ${Math.round(result.similarity * 100)}%)\n${result.block.plain_text}`;
          });

          context = pageContents.join('\n\n---\n\n');
          searchSummary = `Se encontraron ${searchResult.embeddingResults.length} bloques relevantes usando búsqueda semántica (embeddings).`;
          sources = []; // Los bloques no tienen páginas directas en este caso
        } else {
          searchSummary = 'No se encontraron resultados relevantes con búsqueda semántica.';
        }

      } else {
        // Usar búsqueda por palabras clave (método legacy)
        this.logger.debug('Using keyword search');

        // Buscar nombres importantes directamente en la consulta
        let cleanQuery = query;
        if (query.toLowerCase().includes('gydu')) {
          cleanQuery = 'Gydu';
        } else if (query.toLowerCase().includes('sikaas')) {
          cleanQuery = 'Sikaas';
        } else if (query.toLowerCase().includes('capitán')) {
          cleanQuery = 'capitán';
        } else {
          // Extraer palabras clave relevantes
          const keywords = this.extractKeywords(query);
          cleanQuery = keywords.length > 0 ? keywords[0] : query;
        }

        console.log('🔍 ChatController: Query cleaning:', {
          original: query,
          clean: cleanQuery,
          searchTerm: cleanQuery || query
        });

        const searchResult = await this.notionMigrationService.searchContent(cleanQuery || query, {
          useEmbeddings: false,
          limit: 5
        });

        this.logger.info('Search results received', {
          textResultsCount: searchResult.textResults?.length || 0,
          pageResultsCount: searchResult.pageResults?.length || 0,
          query: query.substring(0, 50)
        });

        console.log('🔍 ChatController: Search results:', {
          textResultsCount: searchResult.textResults?.length || 0,
          pageResultsCount: searchResult.pageResults?.length || 0,
          pageResults: searchResult.pageResults?.map(p => p.title).slice(0, 3)
        });

        // Combinar resultados de bloques y páginas
        const allResults = [];

        if (searchResult.textResults && searchResult.textResults.length > 0) {
          const blockContents = searchResult.textResults.map(block => {
            return `**${block.type}**\n${block.plain_text}`;
          });
          allResults.push(...blockContents);
        }

        if (searchResult.pageResults && searchResult.pageResults.length > 0) {
          const pageContents = searchResult.pageResults.map(page => {
            // Extraer contenido del raw_data si existe
            let content = `**Página: ${page.title}**\n`;

            if (page.raw_data?.original_content && typeof page.raw_data.original_content === 'string') {
              // Limpiar el contenido markdown/HTML básico
              const cleanContent = page.raw_data.original_content
                .replace(/!\[.*?\]\(.*?\)/g, '[Imagen]') // Reemplazar imágenes
                .replace(/https?:\/\/[^\s]+/g, '[URL]') // Reemplazar URLs largas
                .substring(0, 500); // Limitar longitud
              content += cleanContent;
            } else {
              content += `[Información disponible sobre: ${page.title}]`;
            }

            return content;
          });
          allResults.push(...pageContents);
        }

        if (allResults.length > 0) {
          context = allResults.join('\n\n---\n\n');
          const blockCount = searchResult.textResults?.length || 0;
          const pageCount = searchResult.pageResults?.length || 0;
          searchSummary = `Se encontraron ${blockCount} bloques y ${pageCount} páginas relevantes usando búsqueda por texto.`;
          sources = [];
        } else {
          searchSummary = 'No se encontraron resultados relevantes con búsqueda por texto.';
        }
      }

    } catch (searchError) {
      this.logger.error('Error in context extraction', searchError as Error);
      searchSummary = 'Hubo un error técnico al buscar en la base de conocimientos.';
    }

    return {
      context,
      searchSummary,
      sources
    };
  }

  private extractKeywords(text: string): string[] {
    const stopWords = ['qué', 'que', 'sabes', 'sobre', 'información', 'tienes', 'conoces', 'dime', 'explica', 'cuéntame'];
    const words = text.toLowerCase()
      .replace(/[¿?¡!.,;:()]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2 && !stopWords.includes(word));

    this.logger.debug('Keywords extracted', { keywords: words.slice(0, 5) });
    return words;
  }

  private buildSystemPrompt(query: string, context: string, searchSummary: string): string {
    return `Eres un asistente virtual especializado en responder preguntas basándote en documentos de una base de conocimientos nativa. 

IMPORTANTE: ${searchSummary}

CONTEXTO DISPONIBLE:
${context || 'No hay contexto específico disponible para esta consulta.'}

INSTRUCCIONES:
- Responde únicamente basándote en la información del contexto proporcionado
- Si la información no está en el contexto, indícalo claramente
- Sé específico y cita información relevante del contexto
- Mantén un tono natural y conversacional
- Si no tienes suficiente información, sugiérele al usuario que reformule su pregunta

PREGUNTA DEL USUARIO: ${query}`;
  }
}
