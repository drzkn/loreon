export interface NotionDatabaseResponse {
  id: string;
  title: Array<{
    plain_text: string;
    href: string | undefined;
  }>;
  properties: Record<string, unknown>;
  created_time: string;
  last_edited_time: string;
  url: string;
}

export interface NotionPageResponse {
  id: string;
  properties: Record<string, unknown>;
  created_time: string;
  last_edited_time: string;
  url: string;
}

export interface NotionUserResponse {
  id: string;
  name: string;
  avatar_url: string;
  type: string;
  person: {
    email: string;
  };
}

export interface NotionBlockResponse {
  id: string;
  type: string;
  created_time: string;
  last_edited_time: string;
  has_children: boolean;
  children?: NotionBlockResponse[];
  [key: string]: unknown;
} 