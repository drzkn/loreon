'use client';

import { useRef, useEffect } from 'react';
import { useChat } from '@ai-sdk/react';
import {
  ChatContainer,
  ChatSection,
  MessagesContainer,
  Message,
  MessageBubble,
  MessageContent,
  MessageAuthor,
  MessageTime,
  ActionsSection,
  InputContainer,
  InputWrapper,
  ChatInput,
  SendButton,
  WelcomeMessage,
  WelcomeTitle,
  WelcomeSubtitle
} from './page.styles';

export default function Home() {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Usar el hook useChat para conectar con nuestra API RAG
  const { messages, input, handleInputChange, handleSubmit, status } = useChat({
    api: '/api/chat',
    onResponse: (response) => {
      console.log('🌐 [FRONTEND] Respuesta recibida:', response.status, response.statusText);
    },
    onFinish: (message) => {
      console.log('✅ [FRONTEND] Mensaje completado:', message.content.substring(0, 100));
    },
    onError: (error) => {
      console.error('❌ [FRONTEND] Error en chat:', error);
    },
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = `${inputRef.current.scrollHeight}px`;
    }
  }, [input]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      console.log('⌨️ [FRONTEND] Enviando mensaje:', input);
      handleSubmit(e);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <ChatContainer>
      <ChatSection>
        <MessagesContainer>
          {messages.length === 0 ? (
            <WelcomeMessage>
              <WelcomeTitle>¡Bienvenido a Loreon AI! 🚀</WelcomeTitle>
              <WelcomeSubtitle>
                Tu asistente inteligente para gestión de contenido markdown,
                sincronización de datos y búsqueda vectorial. Comienza escribiendo tu primera pregunta.
              </WelcomeSubtitle>
            </WelcomeMessage>
          ) : (
            messages.map((message) => (
              <Message key={message.id} $isUser={message.role === 'user'}>
                <MessageAuthor $isUser={message.role === 'user'}>
                  {message.role === 'user' ? '👤' : '🤖'}
                </MessageAuthor>
                <MessageBubble $isUser={message.role === 'user'}>
                  <MessageContent $isUser={message.role === 'user'}>
                    {message.content}
                  </MessageContent>
                  <MessageTime $isUser={message.role === 'user'}>
                    {message.createdAt ? formatTime(message.createdAt) : ''}
                  </MessageTime>
                </MessageBubble>
              </Message>
            ))
          )}

          {(status === 'streaming' || status === 'submitted') && (
            <Message $isUser={false}>
              <MessageAuthor $isUser={false}>🤖</MessageAuthor>
              <MessageBubble $isUser={false}>
                <MessageContent $isUser={false}>
                  <span style={{ opacity: 0.6 }}>
                    {status === 'submitted' ? 'Enviando...' : 'Pensando... 🧠'}
                  </span>
                </MessageContent>
              </MessageBubble>
            </Message>
          )}

          <div ref={messagesEndRef} />
        </MessagesContainer>
      </ChatSection>

      <ActionsSection>
        <InputContainer>
          <InputWrapper>
            <ChatInput
              ref={inputRef}
              value={input}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              placeholder="Pregúntame sobre tu contenido..."
              rows={1}
              disabled={status !== 'ready'}
            />
            <SendButton
              onClick={(e) => {
                console.log('🖱️ [FRONTEND] Click en enviar:', input);
                handleSubmit(e);
              }}
              disabled={!input.trim() || status !== 'ready'}
            >
              ➤
            </SendButton>
          </InputWrapper>
        </InputContainer>
      </ActionsSection>
    </ChatContainer>
  );
}
