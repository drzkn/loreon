import { NotionDatabaseResponse } from "@/shared/types/notion.types";

export class Database {
  constructor(
    public readonly id: string,
    public readonly title: string,
    public readonly properties: Record<string, unknown>,
    public readonly createdTime?: string,
    public readonly lastEditedTime?: string,
    public readonly url?: string
  ) { }

  static fromNotionResponse(data: NotionDatabaseResponse): Database {
    return new Database(
      data.id,
      data.title?.[0]?.plain_text || 'Sin título',
      data.properties || {},
      data.created_time,
      data.last_edited_time,
      data.url
    );
  }

  toJSON() {
    return {
      id: this.id,
      title: this.title,
      properties: this.properties,
      createdTime: this.createdTime,
      lastEditedTime: this.lastEditedTime,
      url: this.url
    };
  }
} 