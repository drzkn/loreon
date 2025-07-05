import { Page } from '../../entities/Page';
import { INotionRepository } from '../../../ports/output/repositories/INotionRepository';

export class GetPage {
  constructor(private notionRepository: INotionRepository) { }

  async execute(pageId: string): Promise<Page> {
    if (!pageId) {
      throw new Error('Page ID es requerido');
    }

    return this.notionRepository.getPage(pageId);
  }
} 