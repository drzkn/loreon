import axios, { AxiosResponse } from 'axios';
import { IHttpClient, HttpRequestConfig, HttpResponse } from '../../../../ports/output/services/IHttpClient';

export class AxiosHttpClient implements IHttpClient {
  private client: ReturnType<typeof axios.create>;

  constructor(baseURL?: string, defaultHeaders?: Record<string, string>) {
    this.client = axios.create({
      baseURL,
      headers: {
        'Content-Type': 'application/json',
        ...defaultHeaders
      }
    });
  }

  async get<T = unknown>(url: string, config?: HttpRequestConfig): Promise<HttpResponse<T>> {
    const response = await this.client.get<T>(url, config);
    return this.mapResponse(response);
  }

  async post<T = unknown>(url: string, data?: unknown, config?: HttpRequestConfig): Promise<HttpResponse<T>> {
    const response = await this.client.post<T>(url, data, config);
    return this.mapResponse(response);
  }

  async put<T = unknown>(url: string, data?: unknown, config?: HttpRequestConfig): Promise<HttpResponse<T>> {
    const response = await this.client.put<T>(url, data, config);
    return this.mapResponse(response);
  }

  async delete<T = unknown>(url: string, config?: HttpRequestConfig): Promise<HttpResponse<T>> {
    const response = await this.client.delete<T>(url, config);
    return this.mapResponse(response);
  }

  private mapResponse<T>(response: AxiosResponse<T>): HttpResponse<T> {
    return {
      data: response.data,
      status: response.status,
      statusText: response.statusText,
      headers: response.headers as Record<string, string>
    };
  }
} 