import 'dotenv/config';
import { SupabaseMarkdownRepository } from '../src/adapters/output/infrastructure/supabase';
import { supabase } from '../src/adapters/output/infrastructure/supabase/SupabaseClient';

interface SystemStatus {
  legacy: {
    available: boolean;
    pageCount: number;
    error?: string;
    samplePages?: Array<{ id: string; title: string; updated_at: string }>;
  };
  native: {
    available: boolean;
    pageCount: number;
    blockCount: number;
    embeddingCount: number;
    error?: string;
    samplePages?: Array<{ id: string; title: string; updated_at: string }>;
  };
  recommendation: string;
}

async function checkSystemsStatus(): Promise<SystemStatus> {
  console.log('🔍 VERIFICACIÓN DEL ESTADO DE LOS SISTEMAS');
  console.log('==========================================\n');

  const status: SystemStatus = {
    legacy: {
      available: false,
      pageCount: 0
    },
    native: {
      available: false,
      pageCount: 0,
      blockCount: 0,
      embeddingCount: 0
    },
    recommendation: ''
  };

  // Verificar sistema legacy
  console.log('📚 Verificando sistema legacy (Markdown)...');
  try {
    const legacyRepository = new SupabaseMarkdownRepository();
    const legacyPages = await legacyRepository.findAll({ limit: 5 });

    status.legacy.available = true;
    status.legacy.pageCount = legacyPages.length;
    status.legacy.samplePages = legacyPages.map(page => ({
      id: page.id,
      title: page.title,
      updated_at: page.updated_at
    }));

    if (legacyPages.length > 0) {
      console.log(`✅ Sistema legacy: ${legacyPages.length} páginas encontradas`);
      console.log(`   Ejemplos: ${legacyPages.slice(0, 3).map(p => `"${p.title}"`).join(', ')}`);
    } else {
      console.log('📭 Sistema legacy: Sin páginas');
    }
  } catch (error) {
    status.legacy.error = error instanceof Error ? error.message : 'Error desconocido';
    console.log(`❌ Sistema legacy: Error - ${status.legacy.error}`);
  }

  // Verificar sistema nativo
  console.log('\n🚀 Verificando sistema nativo (JSON)...');
  try {
    // Verificar páginas
    const { data: nativePages, error: pagesError } = await supabase
      .from('notion_pages')
      .select('id, title, updated_at')
      .eq('archived', false)
      .limit(5);

    if (pagesError) {
      throw new Error(`Error obteniendo páginas: ${pagesError.message}`);
    }

    status.native.pageCount = nativePages?.length || 0;
    if (nativePages && nativePages.length > 0) {
      status.native.available = true;
      status.native.samplePages = nativePages.map(page => ({
        id: page.id,
        title: page.title,
        updated_at: page.updated_at
      }));

      console.log(`✅ Sistema nativo: ${nativePages.length} páginas encontradas`);
      console.log(`   Ejemplos: ${nativePages.slice(0, 3).map(p => `"${p.title}"`).join(', ')}`);
    } else {
      console.log('📭 Sistema nativo: Sin páginas');
    }

    // Verificar bloques
    const { data: blocks, error: blocksError } = await supabase
      .from('notion_blocks')
      .select('id')
      .limit(1);

    if (!blocksError && blocks) {
      status.native.blockCount = blocks.length;
    }

    // Verificar embeddings
    const { data: embeddings, error: embeddingsError } = await supabase
      .from('notion_embeddings')
      .select('id')
      .limit(1);

    if (!embeddingsError && embeddings) {
      status.native.embeddingCount = embeddings.length;
    }

    console.log(`   Bloques: ${status.native.blockCount > 0 ? '✅' : '❌'} ${status.native.blockCount}`);
    console.log(`   Embeddings: ${status.native.embeddingCount > 0 ? '✅' : '❌'} ${status.native.embeddingCount}`);

  } catch (error) {
    status.native.error = error instanceof Error ? error.message : 'Error desconocido';
    console.log(`❌ Sistema nativo: Error - ${status.native.error}`);
  }

  // Generar recomendación
  console.log('\n💡 RECOMENDACIONES');
  console.log('===================');

  if (status.native.available && status.native.pageCount > 0) {
    status.recommendation = 'optimal_native';
    console.log('🚀 ¡Perfecto! Tu sistema nativo está funcionando.');
    console.log('   El visualizador usará automáticamente el sistema nativo.');
    console.log('   Beneficios: Mejor rendimiento, contenido más rico, búsqueda avanzada.');
  }
  else if (status.legacy.available && status.legacy.pageCount > 0) {
    status.recommendation = 'fallback_legacy';
    console.log('📚 Tu sistema legacy está funcionando como fallback.');
    console.log('   El visualizador mostrará contenido del sistema legacy.');
    console.log('   Para mejorar: Migra contenido al sistema nativo usando:');
    console.log('   - POST /api/sync-notion con pageIds específicos');
    console.log('   - O ejecuta scripts de migración');
  }
  else if (status.legacy.available || status.native.available) {
    status.recommendation = 'partial_data';
    console.log('⚠️  Tienes datos parciales en los sistemas.');
    console.log('   Para un mejor funcionamiento, asegúrate de tener contenido:');
    if (!status.legacy.available) {
      console.log('   1. Sincroniza desde Notion: Ve a /settings → Sincronizar');
    }
    if (!status.native.available) {
      console.log('   2. Migra al sistema nativo: POST /api/sync-notion');
    }
  }
  else {
    status.recommendation = 'no_data';
    console.log('❌ No hay datos en ningún sistema.');
    console.log('   Para empezar:');
    console.log('   1. Ve a /settings y configura la conexión con Notion');
    console.log('   2. Ejecuta la sincronización para poblar el sistema legacy');
    console.log('   3. Opcionalmente, migra al sistema nativo para mejor rendimiento');
  }

  return status;
}

async function main() {
  try {
    const status = await checkSystemsStatus();

    console.log('\n📊 RESUMEN EJECUTIVO');
    console.log('====================');
    console.log(`Legacy (Markdown): ${status.legacy.available ? '✅' : '❌'} ${status.legacy.pageCount} páginas`);
    console.log(`Nativo (JSON): ${status.native.available ? '✅' : '❌'} ${status.native.pageCount} páginas`);
    console.log(`Recomendación: ${status.recommendation}`);

    console.log('\n🎯 PRÓXIMOS PASOS');
    console.log('=================');

    switch (status.recommendation) {
      case 'optimal_native':
        console.log('✅ Tu sistema está perfectamente configurado.');
        console.log('   Abre /visualizer para ver tu contenido.');
        break;

      case 'fallback_legacy':
        console.log('1. Abre /visualizer para ver tu contenido legacy');
        console.log('2. Para mejorar: Migra contenido al sistema nativo');
        console.log('   curl -X POST /api/sync-notion -H "Content-Type: application/json" -d \'{"pageIds":["page-id-1","page-id-2"]}\'');
        break;

      case 'partial_data':
      case 'no_data':
        console.log('1. Ve a /settings para configurar Notion');
        console.log('2. Ejecuta sincronización para obtener datos');
        console.log('3. Abre /visualizer para verificar');
        break;
    }

    console.log('\n🚀 ¡Listo! Tu visualizador híbrido está preparado para funcionar.');

  } catch (error) {
    console.error('❌ Error durante la verificación:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(console.error);
}

export { checkSystemsStatus }; 