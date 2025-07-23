import { google } from '@ai-sdk/google';
import { embed, embedMany } from 'ai';

export interface EmbeddingsServiceInterface {
  generateEmbedding(text: string): Promise<number[]>;
  generateEmbeddings(texts: string[]): Promise<number[][]>;
}

export class EmbeddingsService implements EmbeddingsServiceInterface {
  private model;

  constructor() {
    // La API key se configura automáticamente desde GOOGLE_GENERATIVE_AI_API_KEY
    this.model = google.textEmbeddingModel('text-embedding-004', {
      // Usar dimensiones nativas de Google (768)
      taskType: 'RETRIEVAL_DOCUMENT'
    });

    console.log('🟢 Usando Google Generative AI para embeddings');
    console.log('📝 Modelo: text-embedding-004');
  }

  async generateEmbedding(text: string): Promise<number[]> {
    try {
      const cleanText = this.cleanText(text);

      if (cleanText.length === 0) {
        throw new Error('El texto está vacío después de la limpieza');
      }

      const { embedding } = await embed({
        model: this.model,
        value: cleanText,
      });

      return embedding;
    } catch (error) {
      console.error('Error generando embedding con Google:', error);
      throw new Error(`Error al generar embedding: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  }

  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    try {
      const cleanTexts = texts.map(text => this.cleanText(text)).filter(text => text.length > 0);

      if (cleanTexts.length === 0) {
        throw new Error('Todos los textos están vacíos después de la limpieza');
      }

      console.log(`🟢 Generando ${cleanTexts.length} embeddings con Google...`);

      const { embeddings } = await embedMany({
        model: this.model,
        values: cleanTexts,
      });

      console.log(`✅ ${embeddings.length} embeddings generados exitosamente`);
      return embeddings;
    } catch (error) {
      console.error('Error generando embeddings con Google:', error);
      throw new Error(`Error al generar embeddings: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  }

  private cleanText(text: string): string {
    return text
      .replace(/\n+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 8000);
  }
} 