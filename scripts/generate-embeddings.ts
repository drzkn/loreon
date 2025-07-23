import 'dotenv/config';
import { EmbeddingsService } from '../src/services/embeddings/EmbeddingsService';
import { SupabaseMarkdownRepository } from '../src/adapters/output/infrastructure/supabase';

async function generateEmbeddings() {
  console.log('🟢 GENERADOR DE EMBEDDINGS CON GOOGLE GENERATIVE AI');
  console.log('==================================================\n');

  try {
    const embeddingsService = new EmbeddingsService();
    const repository = new SupabaseMarkdownRepository();

    console.log('📋 Obteniendo páginas de markdown...');
    const pages = await repository.findAll({ limit: 1000 });

    if (pages.length === 0) {
      console.log('📭 No hay páginas en la base de datos');
      return;
    }

    console.log(`📄 Encontradas ${pages.length} páginas\n`);

    let processed = 0;
    let errors = 0;

    for (const page of pages) {
      try {
        console.log(`🔄 Procesando: ${page.title}`);

        // Verificar que hay contenido válido
        const combinedText = `${page.title}\n\n${page.content}`;
        const cleanText = combinedText
          .replace(/\n+/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();

        if (cleanText.length < 10) {
          console.log(`⚠️  Contenido muy corto (${cleanText.length} chars), saltando...`);
          continue;
        }

        const embedding = await embeddingsService.generateEmbedding(combinedText);

        await repository.update(page.id, {
          embedding: embedding
        });

        processed++;
        console.log(`✅ Completado: ${page.title}`);

        if (processed % 5 === 0) {
          console.log(`📊 Progreso: ${processed}/${pages.length} páginas procesadas\n`);
          await new Promise(resolve => setTimeout(resolve, 1000));
        }

      } catch (error) {
        errors++;
        console.error(`❌ Error procesando "${page.title}":`,
          error instanceof Error ? error.message : error);
      }
    }

    console.log('\n🎉 ¡Proceso completado!');
    console.log(`✅ ${processed} páginas procesadas exitosamente`);
    if (errors > 0) {
      console.log(`❌ ${errors} errores encontrados`);
    }
    console.log('\n🚀 Tu sistema RAG está listo para usar!');

  } catch (error) {
    console.error('💥 Error en el proceso:', error);
    console.error('\n🔍 Verifica:');
    console.error('   1. OPENAI_API_KEY está configurado correctamente');
    console.error('   2. Conexión a Supabase funcionando');
    console.error('   3. Extensión pgvector habilitada');

    process.exit(1);
  }
}

generateEmbeddings(); 