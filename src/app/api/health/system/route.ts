import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

interface SystemHealthCheck {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  environment: {
    nodeEnv: string;
    notionConfigured: boolean;
    supabaseConfigured: boolean;
    serviceRoleKeyAvailable: boolean;
  };
  services: {
    database: { status: string; responseTime?: number };
    notion: { status: string; responseTime?: number };
    embeddings: { status: string; responseTime?: number };
  };
  performance: {
    memoryUsage: {
      used: number;
      total: number;
      percentage: number;
    };
  };
}

export async function GET(): Promise<NextResponse<SystemHealthCheck>> {
  const startTime = Date.now();

  try {
    // Verificar configuración del entorno
    const environment = {
      nodeEnv: process.env.NODE_ENV || 'unknown',
      notionConfigured: !!(process.env.NOTION_API_KEY && process.env.NOTION_DATABASE_ID),
      supabaseConfigured: !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
      serviceRoleKeyAvailable: !!process.env.SUPABASE_SERVICE_ROLE_KEY
    };

    // Verificar servicios
    const services: {
      database: { status: string; responseTime?: number };
      notion: { status: string; responseTime?: number };
      embeddings: { status: string; responseTime?: number };
    } = {
      database: { status: 'unknown' },
      notion: { status: 'unknown' },
      embeddings: { status: 'unknown' }
    };

    // Test de base de datos
    try {
      const dbStartTime = Date.now();
      const { supabaseServer } = await import('@/adapters/output/infrastructure/supabase/SupabaseServerClient');

      const { error } = await supabaseServer
        .from('notion_pages')
        .select('id')
        .limit(1);

      const dbResponseTime = Date.now() - dbStartTime;

      services.database = {
        status: error ? 'unhealthy' : 'healthy',
        responseTime: dbResponseTime
      };
    } catch {
      services.database.status = 'unhealthy';
    }

    // Test de Notion API
    try {
      const notionStartTime = Date.now();
      const { container } = await import('@/infrastructure/di/container');

      // Solo verificar que el servicio se puede instanciar
      void container.queryDatabaseUseCase; // Verificar que existe
      const notionResponseTime = Date.now() - notionStartTime;

      services.notion = {
        status: 'healthy',
        responseTime: notionResponseTime
      };
    } catch {
      services.notion.status = 'unhealthy';
    }

    // Test de embeddings
    try {
      const embStartTime = Date.now();
      const { container } = await import('@/infrastructure/di/container');

      // Solo verificar que el servicio se puede instanciar
      void container.embeddingsService; // Verificar que existe
      const embResponseTime = Date.now() - embStartTime;

      services.embeddings = {
        status: 'healthy',
        responseTime: embResponseTime
      };
    } catch {
      services.embeddings.status = 'unhealthy';
    }

    // Información de memoria
    const memUsage = process.memoryUsage();
    const performance = {
      memoryUsage: {
        used: Math.round(memUsage.heapUsed / 1024 / 1024), // MB
        total: Math.round(memUsage.heapTotal / 1024 / 1024), // MB
        percentage: Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100)
      }
    };

    // Determinar estado general del sistema
    const unhealthyServices = Object.values(services).filter(s => s.status === 'unhealthy').length;
    const status: SystemHealthCheck['status'] =
      unhealthyServices === 0 ? 'healthy' :
        unhealthyServices <= 1 ? 'degraded' : 'unhealthy';

    const healthCheck: SystemHealthCheck = {
      status,
      timestamp: new Date().toISOString(),
      uptime: Date.now() - startTime,
      environment,
      services,
      performance
    };

    const statusCode = status === 'healthy' ? 200 : status === 'degraded' ? 200 : 503;
    return NextResponse.json(healthCheck, { status: statusCode });

  } catch {
    const errorHealthCheck: SystemHealthCheck = {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: 0,
      environment: {
        nodeEnv: 'unknown',
        notionConfigured: false,
        supabaseConfigured: false,
        serviceRoleKeyAvailable: false
      },
      services: {
        database: { status: 'unhealthy' },
        notion: { status: 'unhealthy' },
        embeddings: { status: 'unhealthy' }
      },
      performance: {
        memoryUsage: { used: 0, total: 0, percentage: 0 }
      }
    };

    return NextResponse.json(errorHealthCheck, { status: 503 });
  }
}
