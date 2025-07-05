import { User } from '../../entities/User';
import { INotionRepository } from '../../../ports/output/repositories/INotionRepository';

export class GetUser {
  constructor(private notionRepository: INotionRepository) { }

  async execute(): Promise<User> {
    return this.notionRepository.getUser();
  }
} 