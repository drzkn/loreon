import { google } from '@ai-sdk/google';
import { streamText } from 'ai';
import { SupabaseMarkdownRepository } from '@/adapters/output/infrastructure/supabase';
import { MarkdownPageWithSimilarity } from '@/adapters/output/infrastructure/supabase/types';
import { EmbeddingsService } from '@/services/embeddings/EmbeddingsService';

export const runtime = 'edge';

export async function POST(req: Request) {
  try {
    console.log('🚀 [CHAT API] Recibida petición');

    const { messages } = await req.json();
    console.log('📨 [CHAT API] Mensajes recibidos:', messages?.length || 0);

    if (!messages || !Array.isArray(messages)) {
      console.log('❌ [CHAT API] Error: Mensajes inválidos');
      return new Response('Se requiere un array de mensajes', { status: 400 });
    }

    const lastMessage = messages[messages.length - 1];
    console.log('💬 [CHAT API] Último mensaje:', lastMessage?.content?.substring(0, 50) + '...');

    if (!lastMessage?.content) {
      console.log('❌ [CHAT API] Error: Último mensaje sin contenido');
      return new Response('El último mensaje debe tener contenido', { status: 400 });
    }

    let context = '';
    let searchSummary = '';

    try {
      console.log('🔍 [RAG] Iniciando búsqueda vectorial para:', lastMessage.content.substring(0, 100));

      console.log('🤖 [RAG] Creando servicio de embeddings...');
      const embeddingsService = new EmbeddingsService();

      console.log('🗄️ [RAG] Creando repositorio...');
      const repository = new SupabaseMarkdownRepository();

      console.log('⚡ [RAG] Generando embedding de la query...');
      const queryEmbedding = await embeddingsService.generateEmbedding(lastMessage.content);
      console.log('✅ [RAG] Embedding generado:', queryEmbedding.length, 'dimensiones');

      console.log('🔎 [RAG] Buscando documentos similares...');
      const documents = await repository.searchByVector(queryEmbedding, {
        matchThreshold: 0.78,
        matchCount: 5
      });

      console.log(`📄 [RAG] Documentos encontrados: ${documents.length}`);

      if (documents.length > 0) {
        context = documents
          .map((doc: MarkdownPageWithSimilarity) => `**${doc.title}**\n${doc.content}`)
          .join('\n\n---\n\n');

        const similarities = documents.map((doc: MarkdownPageWithSimilarity) => `${(doc.similarity * 100).toFixed(1)}%`);
        searchSummary = `Se revisaron documentos en la base de conocimientos. Los más relevantes: ${documents.map((doc: MarkdownPageWithSimilarity, i: number) => `"${doc.title}" (${similarities[i]} similitud)`).join(', ')}.`;
      } else {
        searchSummary = 'Se revisaron todos los documentos disponibles pero ninguno está relacionado con tu consulta.';
      }

    } catch (searchError) {
      console.error('Error en búsqueda vectorial:', searchError);
      searchSummary = 'Hubo un error técnico al buscar en la base de conocimientos.';
    }

    let systemPrompt = '';

    if (context) {
      systemPrompt = `Eres Loreon AI, un asistente especializado en la gestión de la base de conocimientos personal del usuario.

IMPORTANTE: Tu función es EXCLUSIVAMENTE proporcionar información de la base de conocimientos interna del usuario. NO sugieras fuentes externas como internet, redes sociales, o motores de búsqueda.

CONTEXTO ENCONTRADO EN LA BASE DE CONOCIMIENTOS:
${context}

INFORMACIÓN DE BÚSQUEDA:
${searchSummary}

INSTRUCCIONES:
- Usa ÚNICAMENTE el contexto proporcionado para responder la pregunta del usuario
- Si el contexto no es completamente relevante, menciona qué información específica no está disponible en la base de conocimientos
- Mantén un tono amigable y profesional
- Proporciona respuestas claras basadas en el contenido personal del usuario
- SIEMPRE menciona el título de la fuente cuando cites información
- Si la respuesta es parcial, sugiere que el usuario añada más documentación a su base de conocimientos
- NO sugieras buscar en fuentes externas, internet, redes sociales o motores de búsqueda
- Enfócate exclusivamente en el contenido personal disponible`;

    } else {
      const userQuery = lastMessage.content;

      systemPrompt = `Eres Loreon AI, un asistente especializado en la gestión de tu base de conocimientos personal.

IMPORTANTE: Tu función es EXCLUSIVAMENTE buscar y proporcionar información de la base de conocimientos interna del usuario. NO sugieras fuentes externas como internet, redes sociales, o motores de búsqueda.

CONSULTA DEL USUARIO: "${userQuery}"
RESULTADO DE BÚSQUEDA: ${searchSummary}

RESPONDE EXACTAMENTE CON ESTE MENSAJE (sin añadir nada más):

❌ **No se encontró información relacionada**

Lo siento, no he encontrado información específica sobre "${userQuery}" en tu base de conocimientos actual.

**Detalles de la búsqueda:**
${searchSummary}

**Sugerencias para mejorar tu búsqueda:**
• Reformula tu pregunta usando palabras clave diferentes
• Verifica si tienes contenido similar en Notion que no esté sincronizado
• Considera agregar documentación sobre este tema a tu base de conocimientos

**Recuerda:** Solo puedo buscar en tu contenido personal, no en fuentes externas.

¿Hay algo más de tu base de conocimientos en lo que pueda ayudarte?

NO agregues sugerencias sobre buscar en internet, redes sociales o fuentes externas.`;
    }

    console.log('🧠 [GEMINI] Prompt del sistema:', systemPrompt.substring(0, 200) + '...');
    console.log('💭 [GEMINI] Contexto encontrado:', context ? 'SÍ (' + context.length + ' chars)' : 'NO');
    console.log('🚀 [GEMINI] Enviando a Gemini 1.5 Flash...');

    const result = streamText({
      model: google('gemini-1.5-flash'),
      system: systemPrompt,
      messages: context ? messages : [{ role: 'user', content: lastMessage.content }],
      temperature: 0.7,
      maxTokens: 500,
    });

    console.log('📤 [GEMINI] Respuesta iniciada, enviando stream...');
    return result.toDataStreamResponse();

  } catch (error) {
    console.error('Error en /api/chat:', error);
    return new Response('Error interno del servidor', { status: 500 });
  }
} 