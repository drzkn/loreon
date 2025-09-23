import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

interface DatabaseHealthCheck {
  tablesAccessible: boolean;
  tablesStatus: Record<string, { accessible: boolean; error?: string }>;
  connectionTime: number;
  timestamp: string;
}

export async function POST(): Promise<NextResponse<DatabaseHealthCheck | { error: string }>> {
  const startTime = Date.now();

  try {
    const { supabaseServer } = await import('@/adapters/output/infrastructure/supabase/SupabaseServerClient');

    const tables = ['notion_pages', 'notion_blocks', 'notion_embeddings'];
    const tablesStatus: Record<string, { accessible: boolean; error?: string }> = {};
    let allTablesAccessible = true;

    // Verificar cada tabla
    for (const table of tables) {
      try {
        const { error } = await supabaseServer
          .from(table)
          .select('id')
          .limit(1);

        if (error) {
          tablesStatus[table] = {
            accessible: false,
            error: error.message
          };
          allTablesAccessible = false;
        } else {
          tablesStatus[table] = { accessible: true };
        }
      } catch (err) {
        tablesStatus[table] = {
          accessible: false,
          error: err instanceof Error ? err.message : 'Unknown error'
        };
        allTablesAccessible = false;
      }
    }

    const connectionTime = Date.now() - startTime;

    const healthCheck: DatabaseHealthCheck = {
      tablesAccessible: allTablesAccessible,
      tablesStatus,
      connectionTime,
      timestamp: new Date().toISOString()
    };

    const statusCode = allTablesAccessible ? 200 : 503;
    return NextResponse.json(healthCheck, { status: statusCode });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown database error';

    return NextResponse.json(
      { error: `Database health check failed: ${errorMessage}` },
      { status: 503 }
    );
  }
}

export async function GET(): Promise<NextResponse> {
  return POST(); // Reutilizar la misma lógica para GET
}
