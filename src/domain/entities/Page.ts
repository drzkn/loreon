import { NotionPageResponse } from '../../shared/types/notion.types';

export class Page {
  constructor(
    public readonly id: string,
    public readonly properties: Record<string, unknown>,
    public readonly createdTime?: string,
    public readonly lastEditedTime?: string,
    public readonly url?: string
  ) { }

  static fromNotionResponse(data: NotionPageResponse): Page {
    return new Page(
      data.id,
      data.properties || {},
      data.created_time,
      data.last_edited_time,
      data.url
    );
  }

  toJSON() {
    return {
      id: this.id,
      properties: this.properties,
      createdTime: this.createdTime,
      lastEditedTime: this.lastEditedTime,
      url: this.url
    };
  }
} 