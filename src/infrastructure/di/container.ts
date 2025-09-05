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

// New application layer imports
import { ILogger } from '@/application/interfaces/ILogger';
import { IAuthService } from '@/application/interfaces/IAuthService';
import { IEmbeddingsService } from '@/application/interfaces/IEmbeddingsService';
import { INotionMigrationService } from '@/application/interfaces/INotionMigrationService';
import { ISupabaseClient } from '@/infrastructure/database/interfaces/ISupabaseClient';
import { IUserTokenService } from '@/infrastructure/config/interfaces/IUserTokenService';

// New implementations
import { ConsoleLogger } from '@/infrastructure/logging/ConsoleLogger';
import { AuthService } from '@/application/services/AuthService';
import { EmbeddingsService } from '@/application/services/EmbeddingsService';
import { NotionMigrationService } from '@/application/services/NotionMigrationService';
import { SupabaseClientAdapter } from '@/infrastructure/database/SupabaseClientAdapter';
import { UserTokenServiceAdapter } from '@/infrastructure/config/UserTokenServiceAdapter';

// Controllers
import { SyncController } from '@/presentation/controllers/SyncController';
import { AuthController } from '@/presentation/controllers/AuthController';
import { ChatController } from '@/presentation/controllers/ChatController';

// Repository dependencies
import { NotionNativeRepository } from '@/adapters/output/infrastructure/supabase/NotionNativeRepository';
import { supabaseServer } from '@/adapters/output/infrastructure/supabase/SupabaseServerClient';

interface Container {
  // Existing repositories and use cases
  notionRepository: NotionRepository;
  supabaseMarkdownRepository: SupabaseMarkdownRepository;
  getDatabaseUseCase: GetDatabase;
  getUserUseCase: GetUser;
  queryDatabaseUseCase: QueryDatabaseUseCase;
  getPageUseCase: GetPage;
  getBlockChildrenUseCase: GetBlockChildren;
  getBlockChildrenRecursiveUseCase: GetBlockChildrenRecursive;
  markdownConverterService: MarkdownConverterService;
  supabaseMarkdownService: SupabaseMarkdownService;

  // New infrastructure services
  logger: ILogger;
  supabaseClient: ISupabaseClient;
  userTokenService: IUserTokenService;

  // New application services
  authService: IAuthService;
  embeddingsService: IEmbeddingsService;
  notionMigrationService: INotionMigrationService;

  // New repositories
  notionNativeRepository: NotionNativeRepository;

  // New controllers
  syncController: SyncController;
  authController: AuthController;
  chatController: ChatController;
}

let _container: Container | null = null;

const createContainer = () => {
  if (_container) return _container;

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

  // Servicios existentes
  const markdownConverterService = new MarkdownConverterService();
  const supabaseMarkdownRepository = new SupabaseMarkdownRepository();
  const supabaseMarkdownService = new SupabaseMarkdownService(supabaseMarkdownRepository, markdownConverterService);

  // Nuevos servicios de infraestructura
  const logger = new ConsoleLogger();
  const supabaseClientAdapter = new SupabaseClientAdapter();
  const userTokenServiceAdapter = new UserTokenServiceAdapter(false);

  // Nuevos repositorios
  const notionNativeRepository = new NotionNativeRepository(supabaseServer);

  // Nuevos servicios de aplicación
  const authService = new AuthService(
    supabaseClientAdapter,
    userTokenServiceAdapter,
    logger
  );

  const embeddingsService = new EmbeddingsService(logger);

  const notionMigrationService = new NotionMigrationService(
    notionNativeRepository,
    embeddingsService,
    getPageUseCase,
    getBlockChildrenRecursiveUseCase,
    logger
  );

  // Nuevos controllers
  const syncController = new SyncController(notionMigrationService, logger);
  const authController = new AuthController(authService, logger);
  const chatController = new ChatController(notionMigrationService, logger);

  _container = {
    // Repositorios existentes
    notionRepository,
    supabaseMarkdownRepository,

    // Casos de uso existentes
    getDatabaseUseCase,
    getUserUseCase,
    queryDatabaseUseCase,
    getPageUseCase,
    getBlockChildrenUseCase,
    getBlockChildrenRecursiveUseCase,

    // Servicios existentes
    markdownConverterService,
    supabaseMarkdownService,

    // Nuevos servicios de infraestructura
    logger,
    supabaseClient: supabaseClientAdapter,
    userTokenService: userTokenServiceAdapter,

    // Nuevos servicios de aplicación
    authService,
    embeddingsService,
    notionMigrationService,

    // Nuevos repositorios
    notionNativeRepository,

    // Nuevos controllers
    syncController,
    authController,
    chatController,
  };

  return _container;
};

export const container = new Proxy({} as Container, {
  get(target, prop) {
    const actualContainer = createContainer();
    return actualContainer[prop as keyof Container];
  }
});

// Export para casos que necesitan la información del sistema sin crear instancias
export const getSystemInfo = () => {
  const isNode = typeof process !== 'undefined' && process.versions && process.versions.node;
  const isBrowser = typeof window !== 'undefined';

  return {
    isNode,
    isBrowser,
    runtime: isNode ? 'nodejs' : isBrowser ? 'browser' : 'unknown'
  };
}; 