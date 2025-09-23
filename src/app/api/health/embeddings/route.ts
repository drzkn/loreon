import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

interface EmbeddingsHealthCheck {
  success: boolean;
  serviceAvailable: boolean;
  processingTime: number;
  embeddingDimensions?: number;
  error?: string;
  timestamp: string;
}

export async function POST(request: NextRequest): Promise<NextResponse<EmbeddingsHealthCheck>> {
  const startTime = Date.now();

  try {
    const body = await request.json();
    const { testText = 'Health check test text', dryRun = true } = body;

    // Importar el servicio de embeddings
    const { container } = await import('@/infrastructure/di/container');
    const embeddingsService = container.embeddingsService;

    if (dryRun) {
      // En modo dry-run, solo verificamos que el servicio esté disponible
      const processingTime = Date.now() - startTime;

      return NextResponse.json({
        success: true,
        serviceAvailable: true,
        processingTime,
        timestamp: new Date().toISOString()
      });
    }

    // Test real de generación de embeddings
    const embeddings = await embeddingsService.generateEmbedding(testText);
    const processingTime = Date.now() - startTime;

    const healthCheck: EmbeddingsHealthCheck = {
      success: true,
      serviceAvailable: true,
      processingTime,
      embeddingDimensions: embeddings.length,
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(healthCheck);

  } catch (error) {
    const processingTime = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown embeddings error';

    const healthCheck: EmbeddingsHealthCheck = {
      success: false,
      serviceAvailable: false,
      processingTime,
      error: errorMessage,
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(healthCheck, { status: 503 });
  }
}

export async function GET(): Promise<NextResponse<EmbeddingsHealthCheck>> {
  // Para GET, hacer un test en modo dry-run
  const request = new Request('http://localhost', {
    method: 'POST',
    body: JSON.stringify({ dryRun: true })
  });

  return POST(request as NextRequest);
}
