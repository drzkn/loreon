#!/usr/bin/env npx tsx

/**
 * Script para gestionar embeddings de manera independiente
 * 
 * Uso:
 *   npx tsx scripts/manage-embeddings.ts stats
 *   npx tsx scripts/manage-embeddings.ts generate
 *   npx tsx scripts/manage-embeddings.ts generate --force
 *   npx tsx scripts/manage-embeddings.ts generate --pages "page-id-1,page-id-2"
 */

import 'dotenv/config';

const API_BASE = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : 'http://localhost:3000';

interface EmbeddingsStats {
  success: boolean;
  message: string;
  stats: {
    totalPages: number;
    pagesWithEmbeddings: number;
    pagesWithoutEmbeddings: number;
    embeddingCoverage: string;
  };
  pagesWithoutEmbeddings?: Array<{
    id: string;
    title: string;
    updated_at: string;
  }>;
}

interface GenerateResponse {
  success: boolean;
  message: string;
  stats: {
    totalPages: number;
    processedPages: number;
    embeddingsGenerated: number;
    errors: number;
    skipped: number;
  };
  errors?: string[];
}

async function getStats(): Promise<void> {
  console.log('📊 Obteniendo estadísticas de embeddings...\n');

  try {
    const response = await fetch(`${API_BASE}/api/generate-embeddings`);
    const data: EmbeddingsStats = await response.json();

    if (!data.success) {
      console.error('❌ Error:', data.message);
      return;
    }

    const { stats } = data;

    console.log('📈 ESTADÍSTICAS DE EMBEDDINGS');
    console.log('============================');
    console.log(`📄 Total de páginas: ${stats.totalPages}`);
    console.log(`✅ Con embeddings: ${stats.pagesWithEmbeddings}`);
    console.log(`❌ Sin embeddings: ${stats.pagesWithoutEmbeddings}`);
    console.log(`📊 Cobertura: ${stats.embeddingCoverage}%`);

    if (data.pagesWithoutEmbeddings && data.pagesWithoutEmbeddings.length > 0) {
      console.log('\n📋 PÁGINAS SIN EMBEDDINGS:');
      console.log('==========================');
      data.pagesWithoutEmbeddings.forEach((page, index) => {
        console.log(`${index + 1}. "${page.title}" (ID: ${page.id})`);
        console.log(`   Actualizada: ${new Date(page.updated_at).toLocaleString()}`);
      });

      console.log('\n💡 Para generar embeddings para estas páginas:');
      console.log('   npx tsx scripts/manage-embeddings.ts generate');
    } else {
      console.log('\n🎉 ¡Todas las páginas ya tienen embeddings!');
      console.log('\n💡 Para regenerar embeddings:');
      console.log('   npx tsx scripts/manage-embeddings.ts generate --force');
    }

  } catch (error) {
    console.error('❌ Error obteniendo estadísticas:', error);
  }
}

async function generateEmbeddings(options: {
  forceRegenerate?: boolean;
  pageIds?: string[];
  batchSize?: number;
}): Promise<void> {
  const { forceRegenerate = false, pageIds, batchSize = 10 } = options;

  console.log('🧠 Generando embeddings...\n');
  console.log('⚙️ CONFIGURACIÓN:');
  console.log(`   • Forzar regeneración: ${forceRegenerate ? 'Sí' : 'No'}`);
  console.log(`   • Tamaño de lote: ${batchSize}`);
  if (pageIds) {
    console.log(`   • Páginas específicas: ${pageIds.length} IDs`);
  } else {
    console.log('   • Páginas: Todas las que necesiten embeddings');
  }
  console.log('');

  try {
    const response = await fetch(`${API_BASE}/api/generate-embeddings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        forceRegenerate,
        pageIds,
        batchSize
      })
    });

    const data: GenerateResponse = await response.json();

    if (!data.success) {
      console.error('❌ Error:', data.message);
      if (data.errors) {
        console.error('\n🐛 ERRORES DETALLADOS:');
        data.errors.forEach(error => console.error(`   - ${error}`));
      }
      return;
    }

    const { stats } = data;

    console.log('🎉 GENERACIÓN COMPLETADA');
    console.log('========================');
    console.log(`📄 Páginas evaluadas: ${stats.totalPages}`);
    console.log(`⚙️ Páginas procesadas: ${stats.processedPages}`);
    console.log(`🧠 Embeddings generados: ${stats.embeddingsGenerated}`);
    console.log(`⏭️ Páginas omitidas: ${stats.skipped}`);
    console.log(`❌ Errores: ${stats.errors}`);

    if (stats.processedPages > 0) {
      const successRate = ((stats.embeddingsGenerated / stats.processedPages) * 100).toFixed(1);
      console.log(`📊 Tasa de éxito: ${successRate}%`);
    }

    if (data.errors && data.errors.length > 0) {
      console.log('\n🐛 ERRORES ENCONTRADOS:');
      data.errors.forEach(error => console.log(`   - ${error}`));
    }

    console.log(`\n✅ ${data.message}`);

  } catch (error) {
    console.error('❌ Error durante la generación:', error);
  }
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command) {
    console.log('🧠 GESTOR DE EMBEDDINGS');
    console.log('=======================\n');
    console.log('Comandos disponibles:');
    console.log('  stats                           - Ver estadísticas de embeddings');
    console.log('  generate                        - Generar embeddings faltantes');
    console.log('  generate --force                - Regenerar todos los embeddings');
    console.log('  generate --pages "id1,id2"      - Generar para páginas específicas');
    console.log('  generate --batch 5              - Usar tamaño de lote específico');
    console.log('\nEjemplos:');
    console.log('  npx tsx scripts/manage-embeddings.ts stats');
    console.log('  npx tsx scripts/manage-embeddings.ts generate');
    console.log('  npx tsx scripts/manage-embeddings.ts generate --force');
    return;
  }

  switch (command) {
    case 'stats':
      await getStats();
      break;

    case 'generate': {
      const forceIndex = args.indexOf('--force');
      const pagesIndex = args.indexOf('--pages');
      const batchIndex = args.indexOf('--batch');

      const options: Parameters<typeof generateEmbeddings>[0] = {};

      if (forceIndex !== -1) {
        options.forceRegenerate = true;
      }

      if (pagesIndex !== -1 && args[pagesIndex + 1]) {
        options.pageIds = args[pagesIndex + 1].split(',').map(id => id.trim());
      }

      if (batchIndex !== -1 && args[batchIndex + 1]) {
        options.batchSize = parseInt(args[batchIndex + 1]);
      }

      await generateEmbeddings(options);
      break;
    }

    default:
      console.error(`❌ Comando desconocido: ${command}`);
      console.log('💡 Usa sin argumentos para ver la ayuda');
  }
}

if (require.main === module) {
  main().catch(console.error);
} 