export async function GET() {
  const checks = {
    timestamp: new Date().toISOString(),
    environment: 'vercel',
    checks: {} as Record<string, { status: 'ok' | 'error', message: string }>
  };

  // 1. Verificar variables de entorno
  try {
    const requiredEnvVars = [
      'SUPABASE_URL',
      'SUPABASE_ANON_KEY',
      'GOOGLE_GENERATIVE_AI_API_KEY'
    ];

    for (const envVar of requiredEnvVars) {
      const value = process.env[envVar];
      checks.checks[`env_${envVar}`] = {
        status: value ? 'ok' : 'error',
        message: value ? 'Configurada' : 'No configurada'
      };
    }
  } catch (error) {
    checks.checks.env_check = {
      status: 'error',
      message: `Error verificando variables de entorno: ${error instanceof Error ? error.message : 'Error desconocido'}`
    };
  }

  // 2. Verificar Google AI
  try {
    const { google } = await import('@ai-sdk/google');
    google('gemini-1.5-flash'); // Solo para verificar que no hay error
    checks.checks.google_ai_import = {
      status: 'ok',
      message: 'Google AI SDK importado correctamente'
    };
  } catch (error) {
    checks.checks.google_ai_import = {
      status: 'error',
      message: `Error importando Google AI: ${error instanceof Error ? error.message : 'Error desconocido'}`
    };
  }

  // 3. Verificar Supabase
  try {
    const { SupabaseMarkdownRepository } = await import('@/adapters/output/infrastructure/supabase');
    new SupabaseMarkdownRepository(); // Solo para verificar que no hay error
    checks.checks.supabase_connection = {
      status: 'ok',
      message: 'Supabase repository inicializado'
    };
  } catch (error) {
    checks.checks.supabase_connection = {
      status: 'error',
      message: `Error conectando a Supabase: ${error instanceof Error ? error.message : 'Error desconocido'}`
    };
  }

  // 4. Verificar EmbeddingsService
  try {
    const { EmbeddingsService } = await import('@/services/embeddings/EmbeddingsService');
    new EmbeddingsService(); // Solo para verificar que no hay error
    checks.checks.embeddings_service = {
      status: 'ok',
      message: 'EmbeddingsService inicializado'
    };
  } catch (error) {
    checks.checks.embeddings_service = {
      status: 'error',
      message: `Error inicializando EmbeddingsService: ${error instanceof Error ? error.message : 'Error desconocido'}`
    };
  }

  // 5. Test básico de Google AI
  try {
    if (process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      checks.checks.google_ai_test = {
        status: 'ok',
        message: 'API Key presente (test completo requiere llamada real)'
      };
    } else {
      checks.checks.google_ai_test = {
        status: 'error',
        message: 'GOOGLE_GENERATIVE_AI_API_KEY no configurada'
      };
    }
  } catch (error) {
    checks.checks.google_ai_test = {
      status: 'error',
      message: `Error en test de Google AI: ${error instanceof Error ? error.message : 'Error desconocido'}`
    };
  }

  // Calcular estado general
  const hasErrors = Object.values(checks.checks).some(check => check.status === 'error');
  const overallStatus = hasErrors ? 'error' : 'ok';

  return Response.json({
    status: overallStatus,
    ...checks
  }, {
    status: hasErrors ? 500 : 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache'
    }
  });
} 