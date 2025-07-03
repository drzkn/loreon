import { Database } from '../../../domain/entities/Database';
import { Page } from '../../../domain/entities/Page';
import { User } from '../../../domain/entities/User';
import { Block } from '../../../domain/entities/Block';

export interface INotionRepository {
  getDatabase(id: string): Promise<Database>;
  getPage(id: string): Promise<Page>;
  getUser(): Promise<User>;
  queryDatabase(databaseId: string, filter?: unknown, sorts?: unknown[]): Promise<Page[]>;
  getBlockChildren(blockId: string): Promise<Block[]>;
} 