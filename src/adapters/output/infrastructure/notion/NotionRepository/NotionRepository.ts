import { Page, User, Database, Block } from "@/domain/entities";
import { INotionRepository } from "@/ports/output/repositories/INotionRepository";
import { IHttpClient } from "@/ports/output/services/IHttpClient";
import { NotionBlockResponse, NotionDatabaseResponse, NotionPageResponse, NotionUserResponse } from "@/shared/types/notion.types";

export class NotionRepository implements INotionRepository {
  constructor(private httpClient: IHttpClient) { }

  async getDatabase(id: string): Promise<Database> {
    try {
      const response = await this.httpClient.get<NotionDatabaseResponse>(`/databases/${id}`);
      return Database.fromNotionResponse(response.data);
    } catch (error: unknown) {
      console.error('Error al obtener la base de datos:', error);
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

      if (filter && typeof filter === 'object' && filter !== null) {
        const filterObj = filter as Record<string, unknown>;
        const hasValidProperties = Object.keys(filterObj).length > 0;

        if (hasValidProperties) {
          requestBody.filter = filter;
        }
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
      console.error(`Error al consultar la base de datos ${databaseId}:`, error);

      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { status?: number; data?: { message?: string; code?: string } } };
        const status = axiosError.response?.status;
        const responseData = axiosError.response?.data;

        if (status && responseData?.message) {
          console.error(`HTTP ${status}: ${responseData.message}`);
        }
      }

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