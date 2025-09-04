/**
 * @deprecated Use @/application/services/EmbeddingsService instead
 * This file will be removed in the next major version
 * 
 * Legacy compatibility wrapper for the old EmbeddingsService
 */

import { EmbeddingsService as NewEmbeddingsService } from '@/application/services/EmbeddingsService';
import { container } from '@/infrastructure/di/container';

export interface EmbeddingsServiceInterface {
  generateEmbedding(text: string): Promise<number[]>;
  generateEmbeddings(texts: string[]): Promise<number[][]>;
}

export class EmbeddingsService implements EmbeddingsServiceInterface {
  private newService: NewEmbeddingsService;

  constructor() {
    // Use the new service from the container
    this.newService = container.embeddingsService as NewEmbeddingsService;

    console.warn('⚠️ [DEPRECATED] Using legacy EmbeddingsService. Please migrate to @/application/services/EmbeddingsService');
  }

  async generateEmbedding(text: string): Promise<number[]> {
    return await this.newService.generateEmbedding(text);
  }

  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    return await this.newService.generateEmbeddings(texts);
  }
}
