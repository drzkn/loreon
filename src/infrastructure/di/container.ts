import { NotionRepository } from '../../adapters/output/infrastructure/notion/NotionRepository/NotionRepository';
import { SupabaseMarkdownRepository } from '../../adapters/output/infrastructure/supabase';
import { MarkdownConverterService } from '../../services/markdownConverter/MarkdownConverter';
import { getEnvVar } from '@/utils/getEnvVar';
import { AxiosHttpClient } from '@/adapters/output/infrastructure/http/AxiosHttpClient';
import { GetUser } from '@/domain/usecases/GetUser';
import { GetPage } from '@/domain/usecases/GetPage';
import { GetBlockChildrenRecursive } from '@/domain/usecases/GetBlockChildrenRecursive';
import { SupabaseMarkdownService } from '@/services/supabase';
import { GetBlockChildren, GetDatabase, QueryDatabaseUseCase } from '@/domain/usecases';

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
// En el navegador, el proxy se encarga de los headers usando las variables VITE_

// Crear instancias
const httpClient = new AxiosHttpClient(baseURL, defaultHeaders);
const notionRepository = new NotionRepository(httpClient);

// Casos de uso
const getDatabaseUseCase = new GetDatabase(notionRepository);
const getUserUseCase = new GetUser(notionRepository);
const queryDatabaseUseCase = new QueryDatabaseUseCase(notionRepository);
const getPageUseCase = new GetPage(notionRepository);
const getBlockChildrenUseCase = new GetBlockChildren(notionRepository);
const getBlockChildrenRecursiveUseCase = new GetBlockChildrenRecursive(notionRepository);

// Servicios
const markdownConverterService = new MarkdownConverterService();
const supabaseMarkdownRepository = new SupabaseMarkdownRepository();
const supabaseMarkdownService = new SupabaseMarkdownService(supabaseMarkdownRepository, markdownConverterService);

export const container = {
  // Repositorios
  notionRepository,
  supabaseMarkdownRepository,

  // Casos de uso
  getDatabaseUseCase,
  getUserUseCase,
  queryDatabaseUseCase,
  getPageUseCase,
  getBlockChildrenUseCase,
  getBlockChildrenRecursiveUseCase,

  // Servicios
  markdownConverterService,
  supabaseMarkdownService,
}; 