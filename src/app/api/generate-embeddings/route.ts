import { NextRequest, NextResponse } from 'next/server';
import { SupabaseMarkdownRepository } from '../../../adapters/output/infrastructure/supabase';
import { EmbeddingsService } from '../../../services/embeddings/EmbeddingsService';

interface GenerateEmbeddingsRequest {
  pageIds?: string[]; // IDs específicos de páginas (opcional)
  forceRegenerate?: boolean; // Regenerar incluso si ya existen (opcional)
  batchSize?: number; // Tamaño del lote (opcional, default: 10)
}

interface GenerateEmbeddingsResponse {
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

export async function POST(request: NextRequest): Promise<NextResponse<GenerateEmbeddingsResponse>> {
  try {
    const body: GenerateEmbeddingsRequest = await request.json();
    const { pageIds, forceRegenerate = false, batchSize = 10 } = body;

    console.log('🧠 Iniciando generación de embeddings...');
    console.log(`📋 Configuración: forceRegenerate=${forceRegenerate}, batchSize=${batchSize}`);

    if (pageIds) {
      console.log(`🎯 Páginas específicas: ${pageIds.length} IDs proporcionados`);
    }

    const repository = new SupabaseMarkdownRepository();
    const embeddingsService = new EmbeddingsService();

    // Obtener páginas a procesar
    let pagesToProcess;
    if (pageIds && pageIds.length > 0) {
      // Procesar páginas específicas
      pagesToProcess = [];
      for (const pageId of pageIds) {
        const page = await repository.findById(pageId);
        if (page) {
          pagesToProcess.push(page);
        } else {
          console.warn(`⚠️ Página no encontrada: ${pageId}`);
        }
      }
    } else {
      // Procesar todas las páginas
      console.log('📄 Obteniendo todas las páginas...');
      pagesToProcess = await repository.findAll();
    }

    console.log(`📊 Total de páginas a evaluar: ${pagesToProcess.length}`);

    const stats = {
      totalPages: pagesToProcess.length,
      processedPages: 0,
      embeddingsGenerated: 0,
      errors: 0,
      skipped: 0
    };

    const errors: string[] = [];

    // Filtrar páginas que necesitan embeddings
    const pagesToGenerate = forceRegenerate
      ? pagesToProcess
      : pagesToProcess.filter(page => !page.embedding || page.embedding.length === 0);

    console.log(`🎯 Páginas que necesitan embeddings: ${pagesToGenerate.length}`);

    if (pagesToGenerate.length === 0) {
      return NextResponse.json({
        success: true,
        message: forceRegenerate
          ? 'No hay páginas para procesar'
          : 'Todas las páginas ya tienen embeddings. Usa forceRegenerate=true para regenerar.',
        stats: {
          ...stats,
          skipped: pagesToProcess.length
        }
      });
    }

    // Procesar en lotes
    for (let i = 0; i < pagesToGenerate.length; i += batchSize) {
      const batch = pagesToGenerate.slice(i, i + batchSize);
      const batchNumber = Math.floor(i / batchSize) + 1;
      const totalBatches = Math.ceil(pagesToGenerate.length / batchSize);

      console.log(`📦 Procesando lote ${batchNumber}/${totalBatches} (${batch.length} páginas)`);

      // Procesar lote en paralelo
      const batchPromises = batch.map(async (page, indexInBatch) => {
        try {
          const globalIndex = i + indexInBatch + 1;
          console.log(`🧠 [${globalIndex}/${pagesToGenerate.length}] Generando embedding para: "${page.title}"`);

          // Preparar texto para embedding
          const textForEmbedding = `${page.title}\n\n${page.content}`;

          // Generar embedding
          const embedding = await embeddingsService.generateEmbedding(textForEmbedding);

          // Actualizar página con embedding
          await repository.update(page.id, {
            embedding: embedding,
            updated_at: new Date().toISOString()
          });

          stats.embeddingsGenerated++;
          console.log(`✅ [${globalIndex}/${pagesToGenerate.length}] Embedding generado para "${page.title}" (${embedding.length} dimensiones)`);

        } catch (error) {
          stats.errors++;
          const errorMessage = `Error en página "${page.title}": ${error instanceof Error ? error.message : 'Error desconocido'}`;
          console.error(`❌ ${errorMessage}`, error);
          errors.push(errorMessage);
        }

        stats.processedPages++;
      });

      // Esperar a que termine el lote
      await Promise.all(batchPromises);

      console.log(`✅ Lote ${batchNumber}/${totalBatches} completado`);

      // Pequeña pausa entre lotes para no sobrecargar la API
      if (i + batchSize < pagesToGenerate.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    // Calcular páginas omitidas
    stats.skipped = stats.totalPages - stats.processedPages;

    console.log('🎉 Generación de embeddings completada');
    console.log(`📊 Estadísticas finales:`);
    console.log(`📊 • Total evaluado: ${stats.totalPages} páginas`);
    console.log(`📊 • Procesado: ${stats.processedPages} páginas`);
    console.log(`📊 • Embeddings generados: ${stats.embeddingsGenerated}`);
    console.log(`📊 • Errores: ${stats.errors}`);
    console.log(`📊 • Omitidas: ${stats.skipped}`);

    const successRate = stats.processedPages > 0
      ? ((stats.embeddingsGenerated / stats.processedPages) * 100).toFixed(1)
      : '0';

    return NextResponse.json({
      success: true,
      message: `Generación completada. ${stats.embeddingsGenerated} embeddings generados con ${successRate}% de éxito.`,
      stats,
      ...(errors.length > 0 && { errors })
    });

  } catch (error) {
    console.error('❌ Error durante la generación de embeddings:', error);

    return NextResponse.json({
      success: false,
      message: `Error durante la generación: ${error instanceof Error ? error.message : 'Error desconocido'}`,
      stats: {
        totalPages: 0,
        processedPages: 0,
        embeddingsGenerated: 0,
        errors: 1,
        skipped: 0
      }
    }, { status: 500 });
  }
}

export async function GET(): Promise<NextResponse> {
  try {
    const repository = new SupabaseMarkdownRepository();

    // Obtener estadísticas de embeddings
    const allPages = await repository.findAll();
    const pagesWithEmbeddings = allPages.filter(page => page.embedding && page.embedding.length > 0);
    const pagesWithoutEmbeddings = allPages.filter(page => !page.embedding || page.embedding.length === 0);

    const stats = {
      totalPages: allPages.length,
      pagesWithEmbeddings: pagesWithEmbeddings.length,
      pagesWithoutEmbeddings: pagesWithoutEmbeddings.length,
      embeddingCoverage: allPages.length > 0 ? ((pagesWithEmbeddings.length / allPages.length) * 100).toFixed(1) : '0'
    };

    return NextResponse.json({
      success: true,
      message: 'Estadísticas de embeddings obtenidas',
      stats,
      pagesWithoutEmbeddings: pagesWithoutEmbeddings.map(page => ({
        id: page.id,
        title: page.title,
        updated_at: page.updated_at
      }))
    });

  } catch (error) {
    console.error('❌ Error obteniendo estadísticas:', error);

    return NextResponse.json({
      success: false,
      message: `Error obteniendo estadísticas: ${error instanceof Error ? error.message : 'Error desconocido'}`
    }, { status: 500 });
  }
} 