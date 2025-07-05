import { Database } from '../../entities/Database';
import { INotionRepository } from '../../../ports/output/repositories/INotionRepository';

export class GetDatabase {
  constructor(private notionRepository: INotionRepository) { }

  async execute(databaseId: string): Promise<Database> {
    if (!databaseId) {
      throw new Error('Database ID es requerido');
    }

    return this.notionRepository.getDatabase(databaseId);
  }
} 