/**
 * @deprecated Use @/application/services/NotionMigrationService instead
 * This file will be removed in the next major version
 * 
 * Legacy compatibility wrapper for the old NotionMigrationService
 */

import { NotionMigrationService as NewNotionMigrationService } from '@/application/services/NotionMigrationService';
import { container } from '@/infrastructure/di/container';

export class NotionMigrationService {
  private newService: NewNotionMigrationService;

  constructor() {
    // Use the new service from the container
    this.newService = container.notionMigrationService as NewNotionMigrationService;

    console.warn('⚠️ [DEPRECATED] Using legacy NotionMigrationService. Please migrate to @/application/services/NotionMigrationService');
  }

  async migratePage(notionPageId: string) {
    return await this.newService.migratePage(notionPageId);
  }

  async migrateMultiplePages(notionPageIds: string[], batchSize: number = 5) {
    return await this.newService.migrateMultiplePages(notionPageIds, batchSize);
  }

  async getContentInFormat(pageId: string, format: 'json' | 'markdown' | 'html' | 'plain') {
    return await this.newService.getContentInFormat(pageId, format);
  }

  async searchContent(query: string, options?: { useEmbeddings?: boolean; limit?: number; threshold?: number }) {
    return await this.newService.searchContent(query, options);
  }

  async getMigrationStats() {
    return await this.newService.getMigrationStats();
  }
}
