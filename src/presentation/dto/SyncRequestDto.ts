export interface SyncRequestDto {
  databaseId?: string;
  pageIds?: string[];
  fullSync?: boolean;
}

export interface SyncResponseDto {
  success: boolean;
  syncId: string;
  message: string;
  stats?: {
    pagesProcessed: number;
    blocksProcessed: number;
    embeddingsGenerated: number;
    errors: number;
  };
  errors?: string[];
}

export interface PageSyncResultDto {
  pageId: string;
  success: boolean;
  blocksProcessed?: number;
  embeddingsGenerated?: number;
  error?: string;
}
