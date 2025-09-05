import { MigrationResult } from '@/services/notion/NotionMigrationService';
import { NotionBlockRow, NotionPageRow } from '@/adapters/output/infrastructure/supabase/NotionNativeRepository';

export interface INotionMigrationService {
  migratePage(pageId: string): Promise<MigrationResult>;
  migrateMultiplePages(
    pageIds: string[],
    batchSize?: number
  ): Promise<{
    results: MigrationResult[];
    summary: {
      total: number;
      successful: number;
      failed: number;
      totalBlocks: number;
      totalEmbeddings: number;
    };
  }>;
  getMigrationStats(): Promise<{
    storage: {
      totalPages: number;
      totalBlocks: number;
      totalEmbeddings: number;
      lastSync?: string;
    };
    content: {
      totalWords: number;
      averageWordsPerPage: number;
      topContentTypes: Array<{ type: string; count: number }>;
    };
  }>;
  getContentInFormat(
    pageId: string,
    format: 'json' | 'markdown' | 'html' | 'plain'
  ): Promise<string>;
  searchContent(
    query: string,
    options?: {
      useEmbeddings?: boolean;
      limit?: number;
      threshold?: number;
    }
  ): Promise<{
    textResults: NotionBlockRow[];
    pageResults: NotionPageRow[];
    embeddingResults?: Array<{ block: NotionBlockRow; similarity: number }>;
  }>;
}
