import { NextRequest } from 'next/server';
import 'dotenv/config';
import { ConnectionPageRepository } from '../helpers/ConnectionPageRepository';
import { UserTokenService } from '@/services/UserTokenService';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

interface SyncRequest {
  tokenId: string;
}

export async function POST(request: NextRequest) {
  const headers = new Headers({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST',
    'Access-Control-Allow-Headers': 'Content-Type',
  });

  const stream = new ReadableStream({
    start(controller) {
      let isClosed = false;

      const sendLog = (message: string) => {
        if (isClosed) return;
        const data = `data: ${JSON.stringify({ message })}\n\n`;
        controller.enqueue(new TextEncoder().encode(data));
      };

      const closeController = () => {
        if (!isClosed) {
          isClosed = true;
          closeController();
        }
      };

      const syncProcess = async () => {
        try {
          const body: SyncRequest = await request.json();
          const { tokenId } = body;

          if (!tokenId) {
            sendLog('❌ Error: Token ID no proporcionado');
            closeController();
            return;
          }

          sendLog(`🚀 Iniciando sincronización para token: ${tokenId}`);

          const cookieStore = await cookies();
          const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
              cookies: {
                getAll() {
                  return cookieStore.getAll();
                },
                setAll() {
                },
              },
            }
          );

          const { data: { session } } = await supabase.auth.getSession();
          if (!session?.user) {
            sendLog('❌ Error: Usuario no autenticado');
            closeController();
            return;
          }

          sendLog(`🔍 Buscando token con ID: ${tokenId}`);

          const userTokenService = new UserTokenService(true);

          const { data: token, error: tokenError } = await supabase
            .from('user_tokens')
            .select('*')
            .eq('id', tokenId)
            .eq('is_active', true)
            .single();

          if (tokenError || !token) {
            sendLog(`❌ Error: Token no encontrado con ID: ${tokenId}`);
            const { data: allTokens } = await supabase
              .from('user_tokens')
              .select('id, token_name, provider')
              .eq('user_id', session.user.id);
            sendLog(`🔍 Tokens disponibles para usuario: ${allTokens?.map(t => `${t.id} (${t.token_name})`).join(', ') || 'ninguno'}`);
            closeController();
            return;
          }

          if (token.user_id !== session.user.id) {
            sendLog('❌ Error: Token no pertenece al usuario actual');
            closeController();
            return;
          }

          if (token.provider !== 'notion') {
            sendLog('❌ Error: Solo se soporta sincronización de tokens de Notion');
            closeController();
            return;
          }

          sendLog(`📊 Usando token: ${token.token_name} (${token.provider})`);

          const decryptedNotionToken = userTokenService.decryptToken(token.encrypted_token);

          if (!decryptedNotionToken) {
            sendLog('❌ Error: No se pudo desencriptar el token de Notion');
            closeController();
            return;
          }

          sendLog('🔓 Token desencriptado correctamente');

          const databaseIdsStr = process.env.NOTION_DATABASE_ID;

          if (!databaseIdsStr) {
            sendLog('❌ Error: NOTION_DATABASE_ID no configurado en variables de entorno');
            closeController();
            return;
          }

          const databaseIds = databaseIdsStr.split(',').map(id => id.trim()).filter(id => id.length > 0);
          sendLog(`📊 Procesando ${databaseIds.length} database(s) con token: ${token.token_name}`);

          const results = [];

          for (let i = 0; i < databaseIds.length; i++) {
            const databaseId = databaseIds[i];
            sendLog(`📊 Procesando database ${i + 1}/${databaseIds.length}: ${databaseId}`);

            try {
              const repository = new ConnectionPageRepository(
                databaseId,
                () => { },
                () => { },
                (message: string) => sendLog(message),
                true
              );

              sendLog(`🔑 Usando token: ${token.token_name}`);
              sendLog(`📊 Database ID: ${databaseId}`);

              const originalToken = process.env.NOTION_API_KEY;
              process.env.NOTION_API_KEY = decryptedNotionToken;

              try {
                await repository.handleSyncToSupabase();

                const result = {
                  databaseId,
                  success: true,
                  summary: { total: 1, successful: 1, errors: 0 }
                };
                results.push(result);

                sendLog(`✅ Database ${databaseId} sincronizada exitosamente`);
              } finally {
                if (originalToken) {
                  process.env.NOTION_API_KEY = originalToken;
                } else {
                  delete process.env.NOTION_API_KEY;
                }
              }
            } catch (error) {
              const errorMessage = `❌ Error procesando database ${databaseId}: ${error instanceof Error ? error.message : 'Error desconocido'}`;
              sendLog(errorMessage);
              results.push({
                databaseId,
                success: false,
                error: errorMessage,
                summary: { total: 0, successful: 0, errors: 1 }
              });
            }
          }

          const totalStats = results.reduce((acc, result) => ({
            total: acc.total + (result.summary?.total || 0),
            successful: acc.successful + (result.summary?.successful || 0),
            errors: acc.errors + (result.summary?.errors || 0)
          }), { total: 0, successful: 0, errors: 0 });

          const finalResult = {
            success: true,
            results,
            summary: totalStats
          };

          sendLog(`SYNC_COMPLETE:${JSON.stringify(finalResult)}`);

        } catch (error) {
          sendLog(`❌ Error crítico: ${error instanceof Error ? error.message : 'Error desconocido'}`);
        } finally {
          closeController();
        }
      };

      syncProcess();
    }
  });

  return new Response(stream, { headers });
}