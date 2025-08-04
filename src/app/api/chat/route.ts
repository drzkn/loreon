import { google } from '@ai-sdk/google';
import { streamText } from 'ai';
import { SupabaseMarkdownRepository } from '@/adapters/output/infrastructure/supabase';
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
      const embeddingsService = new EmbeddingsService();
      const repository = new SupabaseMarkdownRepository();

      console.log(`🔍 Búsqueda vectorial para: "${lastMessage.content}"`);

      const queryEmbedding = await embeddingsService.generateEmbedding(lastMessage.content);
      console.log(`🧠 Embedding generado: ${queryEmbedding.length} dimensiones`);

      const documents = await repository.searchByVector(queryEmbedding, {
        matchThreshold: 0.6, // Threshold optimizado: 60% similitud (balance entre precisión y recall)
        matchCount: 5
      });

      console.log(`📄 Documentos encontrados: ${documents.length}`);

      if (documents.length > 0) {
        context = documents
          .map((doc) => `**${doc.title}**\n${doc.content}`)
          .join('\n\n---\n\n');

        const similarities = documents.map((doc) => `${(doc.similarity * 100).toFixed(1)}%`);
        searchSummary = `Se revisaron documentos en la base de conocimientos. Los más relevantes: ${documents.map((doc, i) => `"${doc.title}" (${similarities[i]} similitud)`).join(', ')}.`;

        console.log(`📊 Documentos relevantes:`, documents.map((doc, i) => `"${doc.title}" (${similarities[i]})`));
      } else {
        searchSummary = 'Se revisaron todos los documentos disponibles pero ninguno está relacionado con tu consulta.';
        console.log('📭 No se encontraron documentos relevantes');
      }

    } catch (searchError) {
      console.error('❌ Error en búsqueda vectorial:', searchError);
      searchSummary = 'Hubo un error técnico al buscar en la base de conocimientos.';
    }

    const systemPrompt = `Eres un asistente virtual especializado en responder preguntas basándote en documentos de una base de conocimientos. 

IMPORTANTE: ${searchSummary}

CONTEXTO DISPONIBLE:
${context || 'No hay contexto específico disponible para esta consulta.'}

INSTRUCCIONES:
- Responde únicamente basándote en la información del contexto proporcionado
- Si la información no está en el contexto, indícalo claramente
- Sé específico y cita información relevante del contexto
- Mantén un tono natural y conversacional
- Si no tienes suficiente información, sugiérele al usuario que reformule su pregunta

PREGUNTA DEL USUARIO: ${lastMessage.content}`;

    const result = await streamText({
      model: google('gemini-1.5-flash'),
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages
      ],
      temperature: 0.7,
      maxTokens: 1000,
    });

    return result.toDataStreamResponse();

  } catch (error) {
    console.error('Error en chat:', error);
    return new Response('Error interno del servidor', { status: 500 });
  }
} 