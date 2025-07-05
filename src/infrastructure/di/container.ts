import { AxiosHttpClient } from '../../adapters/output/infrastructure/http/AxiosHttpClient.ts';
import { NotionRepository } from '../../adapters/output/infrastructure/notion/NotionRepository/NotionRepository';
import { GetDatabaseUseCase } from '../../domain/usecases/GetDatabaseUseCase';
import { GetUserUseCase } from '../../domain/usecases/GetUserUseCase';
import { QueryDatabaseUseCase } from '../../domain/usecases/QueryDatabaseUseCase';
import { GetPageUseCase } from '../../domain/usecases/GetPageUseCase';
import { GetBlockChildrenUseCase } from '../../domain/usecases/GetBlockChildrenUseCase';
import { GetBlockChildrenRecursiveUseCase } from '../../domain/usecases/GetBlockChildrenRecursiveUseCase';
import { SupabaseMarkdownRepository } from '../../adapters/output/infrastructure/supabase';
import { SupabaseMarkdownService } from '../../services/markdownConverter/SupabaseMarkdownService';
import { MarkdownConverterService } from '../../services/markdownConverter/MarkdownConverterService';
import { getEnvVar } from '@/utils/getEnvVar';

// Detectar si estamos en Node.js o en el navegador
const isNode = typeof process !== 'undefined' && process.versions && process.versions.node;
const isBrowser = typeof window !== 'undefined';

// Configurar la URL base según el entorno
const baseURL = isNode
  ? 'https://api.notion.com/v1'  // Node.js (test:connection)
  : isBrowser
    ? '/api/notion/v1'  // Navegador en desarrollo (proxy)
    : 'https://api.notion.com/v1'; // Producción

// Configurar headers según el entorno
const defaultHeaders: Record<string, string> = {};
if (isNode) {
  const notionApiKey = getEnvVar('NOTION_API_KEY');
  if (notionApiKey) {
    defaultHeaders['Authorization'] = `Bearer ${notionApiKey}`;
    defaultHeaders['Notion-Version'] = '2022-06-28';
  }
}

// Crear instancias
const httpClient = new AxiosHttpClient(baseURL, defaultHeaders);
const notionRepository = new NotionRepository(httpClient);

// Casos de uso
const getDatabaseUseCase = new GetDatabaseUseCase(notionRepository);
const getUserUseCase = new GetUserUseCase(notionRepository);
const queryDatabaseUseCase = new QueryDatabaseUseCase(notionRepository);
const getPageUseCase = new GetPageUseCase(notionRepository);
const getBlockChildrenUseCase = new GetBlockChildrenUseCase(notionRepository);
const getBlockChildrenRecursiveUseCase = new GetBlockChildrenRecursiveUseCase(notionRepository);

// Servicios
const markdownConverterService = new MarkdownConverterService();

// Registrar Supabase dependencies
const supabaseMarkdownRepository = new SupabaseMarkdownRepository();
const supabaseMarkdownService = new SupabaseMarkdownService(
  supabaseMarkdownRepository,
  markdownConverterService
);

// Contenedor de dependencias
export const container = {
  // Infraestructura
  httpClient,
  notionRepository,

  // Casos de uso
  getDatabaseUseCase,
  getUserUseCase,
  queryDatabaseUseCase,
  getPageUseCase,
  getBlockChildrenUseCase,
  getBlockChildrenRecursiveUseCase,

  // Servicios
  markdownConverterService,

  // Configuración
  config: {
    isNode,
    isBrowser,
    baseURL,
    defaultHeaders
  },

  // Supabase dependencies
  supabaseMarkdownRepository,
  supabaseMarkdownService
};

// Exportar casos de uso para uso directo
export { getDatabaseUseCase, getUserUseCase, queryDatabaseUseCase, getPageUseCase, getBlockChildrenUseCase, getBlockChildrenRecursiveUseCase, supabaseMarkdownRepository, supabaseMarkdownService }; 