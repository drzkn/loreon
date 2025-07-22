import 'dotenv/config';
import { container } from '../infrastructure/di/container';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { getEnvVar } from '@/utils/getEnvVar';

const getDirname = () => {
  return path.dirname(fileURLToPath(import.meta.url));
};

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

async function testNotionConnection() {
  try {
    const databaseIdsStr = getEnvVar('NOTION_DATABASE_ID');
    const apiKey = getEnvVar('NOTION_API_KEY');

    console.log('API Key configurada:', apiKey ? 'Sí' : 'No');
    console.log('Database IDs configurados:', databaseIdsStr ? 'Sí' : 'No');

    if (!databaseIdsStr) {
      throw new Error('NOTION_DATABASE_ID no está configurado en las variables de entorno');
    }

    if (!apiKey) {
      throw new Error('NOTION_API_KEY no está configurado en las variables de entorno');
    }

    // Parsear los database IDs (separados por comas)
    const databaseIds = databaseIdsStr.split(',').map(id => id.trim()).filter(id => id.length > 0);
    console.log(`📊 Se encontraron ${databaseIds.length} base(s) de datos para procesar`);

    // Obtener información del usuario usando el caso de uso (solo una vez)
    const userInfo = await container.getUserUseCase.execute();
    console.log('✅GetUserUseCase');

    // Arrays para consolidar todos los resultados
    const allDatabasesInfo = [];
    const allDatabaseQueries = [];
    const allPagesInfo = [];

    // Iterar sobre cada database ID
    for (let i = 0; i < databaseIds.length; i++) {
      const databaseId = databaseIds[i];
      console.log(`\n🔄 Procesando base de datos ${i + 1}/${databaseIds.length}: ${databaseId}`);

      try {
        // Obtener información de la base de datos usando el caso de uso
        const databaseInfo = await container.getDatabaseUseCase.execute(databaseId);
        console.log(`✅GetDatabaseUseCase para ${databaseInfo.title || databaseId}`);
        allDatabasesInfo.push(databaseInfo);

        // Consultar la base de datos usando el caso de uso
        const databaseQuery = await container.queryDatabaseUseCase.execute(databaseId);
        console.log(`✅QueryDatabaseUseCase - ${databaseQuery.length} páginas encontradas`);
        allDatabaseQueries.push(...databaseQuery);

        // Obtener una página específica usando el caso de uso (ejemplo con la primera página)
        if (databaseQuery.length > 0) {
          const firstPageId = databaseQuery[0].id;
          const pageInfo = await container.getPageUseCase.execute(firstPageId);
          console.log(`✅GetPageUseCase para página ${firstPageId}`);
          allPagesInfo.push(pageInfo);
        }

      } catch (dbError) {
        console.error(`❌ Error procesando base de datos ${databaseId}:`, dbError);
        // Continuar con la siguiente base de datos en caso de error
      }
    }

    // Guardar los resultados en un archivo JSON
    const outputDir = path.join(getDirname(), '../../output');

    console.log('\n💾 Volcando el contenido ⏳⏳⏳⏳⏳⏳')
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const outputPath = path.join(outputDir, `notion-query.json`);

    const outputData = {
      'userInfo': userInfo.toJSON(),
      'databasesInfo': allDatabasesInfo.map(db => db.toJSON()),
      'allDatabaseQueries': allDatabaseQueries.map(page => page.toJSON()),
      'samplePagesInfo': allPagesInfo.map(page => page.toJSON()),
      'summary': {
        totalDatabases: allDatabasesInfo.length,
        totalPages: allDatabaseQueries.length,
        samplePages: allPagesInfo.length,
        databaseIds: databaseIds
      },
      timestamp: new Date().toISOString()
    };

    fs.writeFileSync(outputPath, JSON.stringify(outputData, null, 2));
    console.log(`\n💾 Resultados guardados en: ${outputPath}`);

    console.log('\n📊 Resumen de la conexión:');
    console.log(`- Usuario: ${userInfo.name || 'Sin nombre'} (${userInfo.id})`);
    console.log(`- Bases de datos procesadas: ${allDatabasesInfo.length}`);
    allDatabasesInfo.forEach((db, index) => {
      console.log(`  ${index + 1}. ${db.title || 'Sin título'} (${db.id})`);
    });
    console.log(`- Total de páginas encontradas: ${allDatabaseQueries.length}`);
    console.log(`- Páginas de muestra obtenidas: ${allPagesInfo.length}`);

  } catch (error) {
    console.error('Error en la prueba:', error);

    if (error && typeof error === 'object' && 'response' in error) {
      const notionError = error as NotionError;
      console.error('Detalles del error de Notion:');
      console.error(`- Status: ${notionError.response?.status}`);
      console.error(`- Mensaje: ${notionError.response?.data?.message}`);
      console.error(`- Código: ${notionError.response?.data?.code}`);
      console.error(`- Request ID: ${notionError.response?.data?.request_id}`);
    }
  }
}

// Ejecutar la prueba
testNotionConnection(); 