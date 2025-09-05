export interface NotionProperty {
  id: string;
  type: string;
  [key: string]: string | number | boolean | object | null | undefined;
}

export interface NotionBlock {
  id: string;
  type: string;
  object: 'block';
  created_time: string;
  last_edited_time: string;
  has_children: boolean;
  archived: boolean;
  [key: string]: string | number | boolean | object | null | undefined;
}

export interface NotionPageResponse {
  id: string;
  title: string;
  url?: string;
  properties: Record<string, NotionProperty>;
  created_time: string;
  last_edited_time: string;
  archived: boolean;
}

export interface NotionDatabaseResponse {
  id: string;
  title: string;
  properties: Record<string, NotionProperty>;
  pages: NotionPageResponse[];
}

export interface INotionApiClient {
  getPage(pageId: string): Promise<NotionPageResponse>;
  getDatabase(databaseId: string): Promise<NotionDatabaseResponse>;
  getPageBlocks(pageId: string): Promise<NotionBlock[]>;
}
