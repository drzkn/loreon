import { google } from '@ai-sdk/google';
import { streamText } from 'ai';
import { SupabaseMarkdownRepository } from '@/adapters/output/infrastructure/supabase';
import { MarkdownPageWithSimilarity } from '@/adapters/output/infrastructure/supabase/types';
import { EmbeddingsService } from '@/services/embeddings/EmbeddingsService';

export const runtime = 'edge';

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return new Response('Se requiere un array de mensajes', { status: 400 });
    }

    const lastMessage = messages[messages.length - 1];
    if (!lastMessage?.content) {
      return new Response('El último mensaje debe tener contenido', { status: 400 });
    }

    let context = '';
    let searchSummary = '';

    try {
      console.log('🔍 Iniciando búsqueda vectorial para:', lastMessage.content);

      const embeddingsService = new EmbeddingsService();
      const repository = new SupabaseMarkdownRepository();

      const queryEmbedding = await embeddingsService.generateEmbedding(lastMessage.content);

      const documents = await repository.searchByVector(queryEmbedding, {
        matchThreshold: 0.78,
        matchCount: 5
      });

      console.log(`📄 Documentos encontrados: ${documents.length}`);

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
      systemPrompt = `Eres Loreon AI, un asistente inteligente especializado en gestión de contenido markdown y bases de conocimiento.

CONTEXTO ENCONTRADO:
${context}

INFORMACIÓN DE BÚSQUEDA:
${searchSummary}

INSTRUCCIONES:
- Usa el contexto proporcionado para responder la pregunta del usuario
- Si el contexto no es completamente relevante, menciona qué información específica no pudiste encontrar
- Mantén un tono amigable y profesional
- Proporciona respuestas claras y útiles
- Si citas información del contexto, menciona el título de la fuente
- Si la respuesta es parcial, sugiere cómo el usuario podría obtener información más completa`;

    } else {
      const userQuery = lastMessage.content;

      systemPrompt = `Eres Loreon AI, un asistente especializado en gestión de contenido markdown.

CONSULTA: "${userQuery}"
ESTADO: ${searchSummary}

RESPONDE EXACTAMENTE CON ESTE FORMATO:

❌ **No se encontró información relacionada**

Lo siento, no he encontrado información específica sobre "${userQuery}" en la base de conocimientos actual.

**Detalles de la búsqueda:**
${searchSummary}

**Sugerencias:**
• Prueba reformular tu pregunta con términos diferentes
• Verifica si tienes contenido relacionado en Notion que no esté sincronizado
• Considera agregar documentación sobre este tema a tu base de conocimientos

¿Hay algo más en lo que pueda ayudarte?`;
    }

    const result = await streamText({
      model: google('gemini-1.5-flash'),
      system: systemPrompt,
      messages: context ? messages : [{ role: 'user', content: lastMessage.content }],
      temperature: 0.7,
      maxTokens: 500,
    });

    return result.toDataStreamResponse();

  } catch (error) {
    console.error('Error en /api/chat:', error);
    return new Response('Error interno del servidor', { status: 500 });
  }
} 