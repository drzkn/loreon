import { TestResult } from './NotionTestPageRepository.types';
import { container } from '../../../infrastructure/di/container';

export class NotionTestPageRepository {
  private testIds: Record<string, string>;
  private setLoading: (loading: string | null) => void;
  private setResults: React.Dispatch<React.SetStateAction<TestResult[]>>;

  constructor(testIds: Record<string, string>, setLoading: (loading: string | null) => void, setResults: React.Dispatch<React.SetStateAction<TestResult[]>>) {
    this.testIds = testIds;
    this.setLoading = setLoading;
    this.setResults = setResults;
  }

  async addResult(result: TestResult) {
    this.setResults(prev => [result, ...prev]);
  };

  async execute(method: string, testFunction: () => Promise<unknown>) {
    this.setLoading(method);
    const startTime = Date.now();

    try {
      const data = await testFunction();
      const duration = Date.now() - startTime;

      console.log('Resultado de la llamada', { data })
      this.addResult({
        method,
        success: true,
        data,
        timestamp: new Date().toLocaleString('es-ES'),
        duration
      });
    } catch (error) {
      const duration = Date.now() - startTime;

      this.addResult({
        method,
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
        timestamp: new Date().toLocaleString('es-ES'),
        duration
      });
    } finally {
      this.setLoading(null);
    }
  };


  async testGetDatabase() {
    if (!this.testIds.databaseId) {
      alert('Por favor, ingresa un Database ID');
      return;
    }
    this.execute('getDatabase', () => container.getDatabaseUseCase.execute(this.testIds.databaseId));
  };

  async testQueryDatabase() {
    if (!this.testIds.databaseId) {
      alert('Por favor, ingresa un Database ID');
      return;
    }
    this.execute('queryDatabase', () => container.queryDatabaseUseCase.execute(this.testIds.databaseId));
  };

  async testQueryDatabaseWithBlocks() {
    if (!this.testIds.databaseId) {
      alert('Por favor, ingresa un Database ID');
      return;
    }

    const startTime = Date.now();
    // setLoading('queryDatabaseWithBlocks');

    try {
      // Paso 1: Obtener páginas de la base de datos
      const pages = await container.queryDatabaseUseCase.execute(this.testIds.databaseId);

      // Paso 2: Obtener bloques recursivos para cada página
      const pagesWithBlocks = await Promise.all(
        pages.map(async (page) => {
          try {
            const blocks = await container.getBlockChildrenRecursiveUseCase.execute(page.id, {
              maxDepth: 5,
              includeEmptyBlocks: false,
              delayBetweenRequests: 150
            });

            return {
              ...page,
              blocks: blocks.blocks,
              blocksStats: {
                totalBlocks: blocks.totalBlocks,
                maxDepthReached: blocks.maxDepthReached,
                totalApiCalls: blocks.apiCallsCount
              }
            };
          } catch (error) {
            console.warn(`Error obteniendo bloques para página ${page.id}:`, error);
            return {
              ...page,
              blocks: [],
              blocksStats: { totalBlocks: 0, maxDepthReached: 0, totalApiCalls: 0 },
              blocksError: error instanceof Error ? error.message : 'Error desconocido'
            };
          }
        })
      );

      const duration = Date.now() - startTime;

      // Estadísticas generales
      const totalBlocks = pagesWithBlocks.reduce((sum, page) => sum + page.blocksStats.totalBlocks, 0);
      const totalApiCalls = pagesWithBlocks.reduce((sum, page) => sum + page.blocksStats.totalApiCalls, 0);

      const result = {
        pages: pagesWithBlocks,
        summary: {
          totalPages: pages.length,
          totalBlocks,
          totalApiCalls,
          averageBlocksPerPage: Math.round(totalBlocks / pages.length * 100) / 100,
          processingTimeMs: duration
        }
      };

      this.addResult({
        method: 'queryDatabase con bloques recursivos',
        success: true,
        data: result,
        timestamp: new Date().toLocaleString('es-ES'),
        duration
      });
    } catch (error) {
      const duration = Date.now() - startTime;

      this.addResult({
        method: 'queryDatabase con bloques recursivos',
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
        timestamp: new Date().toLocaleString('es-ES'),
        duration
      });
    } finally {
      this.setLoading(null);
    }
  };

  async testGetPage() {
    if (!this.testIds.pageId) {
      alert('Por favor, ingresa un Page ID');
      return;
    }
    this.execute('getPage', () => container.getPageUseCase.execute(this.testIds.pageId));
  };

  async testGetBlockChildren() {
    if (!this.testIds.blockId) {
      alert('Por favor, ingresa un Block ID');
      return;
    }
    this.execute('getBlockChildren', () => container.getBlockChildrenUseCase.execute(this.testIds.blockId));
  };

  async testGetBlockChildrenRecursive() {
    if (!this.testIds.blockId) {
      alert('Por favor, ingresa un Block ID');
      return;
    }
    this.execute('getBlockChildren (recursivo)', () =>
      container.getBlockChildrenRecursiveUseCase.execute(this.testIds.blockId, {
        maxDepth: 3,
        includeEmptyBlocks: false,
        delayBetweenRequests: 100
      })
    );
  };
}