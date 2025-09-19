import { Database } from '../../../domain/entities/Database';
import { Page } from '../../../domain/entities/Page';
import { Block } from '../../../domain/entities/Block/Block';

export interface INotionRepository {
  getDatabase(id: string): Promise<Database>;
  getPage(id: string): Promise<Page>;
  queryDatabase(databaseId: string, filter?: unknown, sorts?: unknown[]): Promise<Page[]>;
  getBlockChildren(blockId: string): Promise<Block[]>;
} 