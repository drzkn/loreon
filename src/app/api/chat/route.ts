import { container } from '@/infrastructure/di/container';
import { ChatRequestDto } from '@/presentation/dto/ChatRequestDto';

export const runtime = 'edge';

export async function POST(req: Request) {
  try {
    container.logger.info('Chat API endpoint called');

    const requestData = await req.json();

    const chatRequest: ChatRequestDto = {
      messages: requestData.messages,
      options: {
        useEmbeddings: requestData.options?.useEmbeddings || false,
        maxTokens: requestData.options?.maxTokens || 1000,
        temperature: requestData.options?.temperature || 0.7,
        stream: true
      }
    };

    // Delegate to controller
    const chatController = container.chatController;
    const result = await chatController.processChat(chatRequest);

    return result;

  } catch (error) {
    container.logger.error('Error in chat API endpoint', error as Error);

    if (error instanceof Error && error.message.includes('array de mensajes')) {
      return new Response(error.message, { status: 400 });
    }

    if (error instanceof Error && error.message.includes('contenido')) {
      return new Response(error.message, { status: 400 });
    }

    return new Response('Error interno del servidor', { status: 500 });
  }
} 