import { Page } from '../../entities/Page';
import { INotionRepository } from '../../../ports/output/repositories/INotionRepository';

export class QueryDatabaseUseCase {
  constructor(private notionRepository: INotionRepository) { }

  async execute(databaseId: string, filter?: unknown, sorts?: unknown[]): Promise<Page[]> {
    if (!databaseId) {
      throw new Error('Database ID es requerido');
    }

    return this.notionRepository.queryDatabase(databaseId, filter, sorts);
  }
} 