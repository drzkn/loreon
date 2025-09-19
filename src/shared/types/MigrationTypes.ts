import { NotionBlock } from '@/services/notion/NotionContentExtractor';

export interface MigrationResult {
  success: boolean;
  pageId?: string;
  blocksProcessed?: number;
  embeddingsGenerated?: number;
  errors?: string[];
  validationResult?: ValidationResult;
}

export interface ValidationResult {
  similarity: number;
  isValid: boolean;
  differences: string[];
  textLengthDiff: number;
}

export interface NotionPageData extends Record<string, unknown> {
  id: string;
  title: string;
  url?: string;
  parent?: {
    type: string;
    page_id?: string;
    database_id?: string;
  };
  icon?: {
    type: string;
    emoji?: string;
    file?: { url: string };
  };
  cover?: {
    type: string;
    file?: { url: string };
  };
  properties: Record<string, unknown>;
  created_time: string;
  last_edited_time: string;
  archived: boolean;
}

export interface NotionApiResponse {
  page: NotionPageData;
  blocks: NotionBlock[];
}

