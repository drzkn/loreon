import { Database } from "../../../../../domain/entities/Database";
import { Page } from "../../../../../domain/entities/Page";
import { User } from "../../../../../domain/entities/User";
import { Block } from "../../../../../domain/entities/Block";
import { INotionRepository } from "../../../../../ports/output/repositories/INotionRepository";
import { IHttpClient } from "../../../../../ports/output/services/IHttpClient";
import { NotionDatabaseResponse, NotionPageResponse, NotionUserResponse, NotionBlockResponse } from "../../../../../shared/types/notion.types";

interface NotionError {
  response?: {
    status?: number;
    data?: {
      message?: string;
      code?: string;
      request_id?: string;
    };
  };
}

export class NotionRepository implements INotionRepository {
  constructor(private httpClient: IHttpClient) { }

  async getDatabase(id: string): Promise<Database> {
    try {
      const response = await this.httpClient.get<NotionDatabaseResponse>(`/databases/${id}`);
      return Database.fromNotionResponse(response.data);
    } catch (error: unknown) {
      const notionError = error as NotionError;
      console.error('Error al obtener la base de datos:', {
        status: notionError.response?.status,
        message: notionError.response?.data?.message,
        code: notionError.response?.data?.code,
        requestId: notionError.response?.data?.request_id
      });
      throw error;
    }
  }

  async getPage(id: string): Promise<Page> {
    try {
      const response = await this.httpClient.get<NotionPageResponse>(`/pages/${id}`);
      return Page.fromNotionResponse(response.data);
    } catch (error: unknown) {
      console.error('Error al obtener la página:', error);
      throw error;
    }
  }

  async getUser(): Promise<User> {
    try {
      const response = await this.httpClient.get<NotionUserResponse>('/users/me');
      return User.fromNotionResponse(response.data);
    } catch (error: unknown) {
      console.error('Error al obtener el usuario:', error);
      throw error;
    }
  }

  async queryDatabase(databaseId: string, filter?: unknown, sorts?: unknown[]): Promise<Page[]> {
    try {
      const requestBody: Record<string, unknown> = {};

      if (filter) {
        requestBody.filter = filter;
      }

      if (sorts && sorts.length > 0) {
        requestBody.sorts = sorts;
      }

      const response = await this.httpClient.post<{ results: NotionPageResponse[] }>(
        `/databases/${databaseId}/query`,
        requestBody
      );

      return response.data.results.map(pageData => Page.fromNotionResponse(pageData));
    } catch (error: unknown) {
      console.error('Error al consultar la base de datos:', error);
      throw error;
    }
  }

  async getBlockChildren(blockId: string): Promise<Block[]> {
    try {
      const response = await this.httpClient.get<{ results: NotionBlockResponse[] }>(
        `/blocks/${blockId}/children`
      );

      return response.data.results.map(blockData => Block.fromNotionResponse(blockData));
    } catch (error: unknown) {
      console.error('Error al obtener los bloques hijos:', error);
      throw error;
    }
  }
} 