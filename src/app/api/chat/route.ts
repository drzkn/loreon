import { google } from '@ai-sdk/google';
import { streamText } from 'ai';
import { supabase } from '@/adapters/output/infrastructure/supabase/SupabaseClient';

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
      console.log(`🔍 Búsqueda nativa directa para: "${lastMessage.content}"`);

      // 1. Obtener todas las páginas nativas con contenido
      const { data: nativePages } = await supabase
        .from('notion_pages')
        .select('*')
        .eq('archived', false);

      if (!nativePages || nativePages.length === 0) {
        searchSummary = 'No hay páginas disponibles en el sistema nativo.';
      } else {
        console.log(`📄 Páginas nativas disponibles: ${nativePages.length}`);

        // 2. Extraer palabras clave de la pregunta y buscar páginas relevantes
        const extractKeywords = (text: string): string[] => {
          // Remover palabras comunes y extraer términos significativos
          const stopWords = ['qué', 'que', 'sabes', 'sobre', 'información', 'tienes', 'conoces', 'dime', 'explica', 'cuéntame'];
          const words = text.toLowerCase()
            .replace(/[¿?¡!.,;:()]/g, ' ')
            .split(/\s+/)
            .filter(word => word.length > 2 && !stopWords.includes(word));
          return words;
        };

        const keywords = extractKeywords(lastMessage.content);
        console.log(`🔍 Palabras clave extraídas: [${keywords.join(', ')}]`);

        const relevantPages = nativePages.filter(page => {
          return keywords.some(keyword => {
            const titleMatch = page.title.toLowerCase().includes(keyword);
            const propertiesMatch = JSON.stringify(page.properties).toLowerCase().includes(keyword);
            return titleMatch || propertiesMatch;
          });
        });

        console.log(`🎯 Páginas relevantes encontradas: ${relevantPages.length}`);
        relevantPages.forEach(page => {
          console.log(`   - "${page.title}" (notion_id: ${page.notion_id})`);
        });

        if (relevantPages.length > 0) {
          // 3. Obtener contenido desde el sistema legacy para estas páginas
          const pageContents: string[] = [];

          for (const page of relevantPages.slice(0, 3)) { // Limitar a 3 páginas
            try {
              // Buscar contenido legacy por notion_id O por título
              let { data: legacyContent } = await supabase
                .from('markdown_pages')
                .select('content, title')
                .eq('notion_page_id', page.notion_id)
                .limit(1);

              // Si no se encuentra por notion_id, buscar por título exacto
              if (!legacyContent || legacyContent.length === 0) {
                const { data: contentByTitle } = await supabase
                  .from('markdown_pages')
                  .select('content, title')
                  .eq('title', page.title)
                  .limit(1);
                legacyContent = contentByTitle;
              }

              if (legacyContent && legacyContent[0]?.content) {
                const content = legacyContent[0].content;
                const cleanContent = content
                  .replace(/!\[.*?\]\(.*?\)/g, '') // Remover imágenes
                  .replace(/#{1,6}\s+/g, '') // Remover headers markdown
                  .replace(/\*\*(.*?)\*\*/g, '$1') // Remover bold
                  .trim();

                if (cleanContent.length > 50) {
                  pageContents.push(`**${page.title}**\n${cleanContent}`);
                  console.log(`📝 Contenido agregado: "${page.title}" (${cleanContent.length} caracteres)`);
                }
              } else {
                // Fallback: usar solo título y propiedades
                const propsText = Object.entries(page.properties || {})
                  .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
                  .join(', ');
                pageContents.push(`**${page.title}**\n${propsText}`);
                console.log(`📝 Fallback agregado: "${page.title}"`);
              }
            } catch (error) {
              console.log(`⚠️ Error obteniendo contenido para "${page.title}": ${error}`);
            }
          }

          if (pageContents.length > 0) {
            context = pageContents.join('\n\n---\n\n');
            searchSummary = `Se encontraron ${pageContents.length} documentos relevantes en la base de conocimientos nativa: ${relevantPages.map(p => `"${p.title}"`).join(', ')}.`;
            console.log(`✅ Contexto generado: ${context.length} caracteres`);
            console.log(`📝 Contexto: ${context.substring(0, 200)}...`);
          } else {
            searchSummary = 'Se encontraron páginas relevantes pero sin contenido suficiente.';
          }
        } else {
          searchSummary = 'No se encontraron páginas relevantes para tu consulta en el sistema nativo.';
        }
      }

    } catch (searchError) {
      console.error('❌ Error en búsqueda nativa:', searchError);
      searchSummary = 'Hubo un error técnico al buscar en la base de conocimientos nativa.';
    }

    const systemPrompt = `Eres un asistente virtual especializado en responder preguntas basándote en documentos de una base de conocimientos nativa. 

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
    console.error('Error en chat nativo:', error);
    return new Response('Error interno del servidor', { status: 500 });
  }
} 