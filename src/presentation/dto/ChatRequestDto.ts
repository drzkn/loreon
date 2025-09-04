export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: string;
}

export interface ChatRequestDto {
  messages: ChatMessage[];
  options?: {
    useEmbeddings?: boolean;
    maxTokens?: number;
    temperature?: number;
    stream?: boolean;
  };
}

export interface ChatResponseDto {
  success: boolean;
  message?: string;
  conversationId?: string;
  metadata?: {
    tokensUsed?: number;
    responseTime?: number;
    sourcesFound?: number;
  };
  error?: string;
}
