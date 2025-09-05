import { IEmbeddingsService } from '@/application/interfaces/IEmbeddingsService';
import { ILogger } from '@/application/interfaces/ILogger';
import { google } from '@ai-sdk/google';
import { embed, embedMany } from 'ai';

export class EmbeddingsService implements IEmbeddingsService {
  private model;

  constructor(private readonly logger: ILogger) {
    this.model = google.textEmbeddingModel('text-embedding-004', {
      taskType: 'RETRIEVAL_DOCUMENT'
    });
    this.logger.info('EmbeddingsService initialized with Google text-embedding-004 model');
  }

  async generateEmbedding(text: string): Promise<number[]> {
    try {
      this.logger.debug('Generating single embedding', { textLength: text.length });

      const cleanText = this.cleanText(text);

      if (cleanText.length === 0) {
        const error = new Error('El texto está vacío después de la limpieza');
        this.logger.error('Failed to generate embedding: empty text after cleaning', error);
        throw error;
      }

      const { embedding } = await embed({
        model: this.model,
        value: cleanText,
      });

      this.logger.debug('Single embedding generated successfully', {
        embeddingDimensions: embedding.length,
        cleanTextLength: cleanText.length
      });

      return embedding;
    } catch (error) {
      this.logger.error('Error generating embedding with Google', error as Error);
      throw new Error(`Error al generar embedding: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  }

  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    try {
      this.logger.info('Starting batch embeddings generation', {
        totalTexts: texts.length
      });

      const cleanTexts = texts.map(text => this.cleanText(text)).filter(text => text.length > 0);

      if (cleanTexts.length === 0) {
        const error = new Error('Todos los textos están vacíos después de la limpieza');
        this.logger.error('Failed to generate embeddings: all texts empty after cleaning', error);
        throw error;
      }

      this.logger.info(`Generating ${cleanTexts.length} embeddings with Google...`);

      const { embeddings } = await embedMany({
        model: this.model,
        values: cleanTexts,
      });

      this.logger.info(`${embeddings.length} embeddings generated successfully`, {
        successfulEmbeddings: embeddings.length,
        originalTexts: texts.length,
        cleanTexts: cleanTexts.length,
        embeddingDimensions: embeddings[0]?.length || 0
      });

      return embeddings;
    } catch (error) {
      this.logger.error('Error generating embeddings with Google', error as Error);
      throw new Error(`Error al generar embeddings: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  }

  private cleanText(text: string): string {
    const cleaned = text
      .replace(/\n+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 8000);

    this.logger.debug('Text cleaned', {
      originalLength: text.length,
      cleanedLength: cleaned.length,
      truncated: text.length > 8000
    });

    return cleaned;
  }
}
