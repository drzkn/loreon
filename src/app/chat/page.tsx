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
import { Icon } from '@/components';
import { useAuth } from '@/hooks/useAuth';

export default function ChatPage() {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { userProfile } = useAuth();

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

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getUserInitial = () => {
    if (!userProfile?.name) return userProfile?.email?.[0]?.toUpperCase() || 'U';
    return userProfile.name[0].toUpperCase();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      const submitEvent = e as unknown as React.FormEvent<HTMLFormElement>;
      handleSubmit(submitEvent);
    }
  };

  const adjustTextareaHeight = () => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 128)}px`;
    }
  };

  useEffect(() => {
    adjustTextareaHeight();
  }, [input]);

  const isSubmitting = status === 'streaming';
  const isInputDisabled = isSubmitting || !input.trim();

  return (
    <ChatContainer>
      <ChatSection>
        <MessagesContainer>
          {messages.length === 0 ? (
            <WelcomeMessage>
              <WelcomeTitle>
                <Icon name="bot" size="lg" />
                ¡Hola! Soy Loreon AI
              </WelcomeTitle>
              <WelcomeSubtitle>
                Estoy aquí para ayudarte a encontrar información en tus documentos de Notion.
                <br />
                Haz una pregunta para comenzar.
              </WelcomeSubtitle>
            </WelcomeMessage>
          ) : (
            messages.map((message) => (
              <Message key={message.id} $isUser={message.role === 'user'}>
                <MessageAuthor $isUser={message.role === 'user'}>
                  {message.role === 'user' ? (
                    getUserInitial()
                  ) : (
                    <Icon name="bot" size="sm" />
                  )}
                </MessageAuthor>
                <MessageBubble $isUser={message.role === 'user'}>
                  <MessageContent $isUser={message.role === 'user'}>
                    {message.content}
                  </MessageContent>
                  <MessageTime $isUser={message.role === 'user'}>
                    {formatTime(message.createdAt || new Date())}
                  </MessageTime>
                </MessageBubble>
              </Message>
            ))
          )}

          {isSubmitting && (
            <Message $isUser={false}>
              <MessageAuthor $isUser={false}>
                <Icon name="bot" size="sm" />
              </MessageAuthor>
              <MessageBubble $isUser={false}>
                <MessageContent $isUser={false}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    opacity: 0.7
                  }}>
                    <Icon name="brain" size="sm" />
                    Pensando...
                  </div>
                </MessageContent>
              </MessageBubble>
            </Message>
          )}

          <div ref={messagesEndRef} />
        </MessagesContainer>

        <ActionsSection>
          <InputContainer>
            <form onSubmit={handleSubmit}>
              <InputWrapper>
                <ChatInput
                  ref={inputRef}
                  value={input}
                  placeholder="Escribe tu pregunta aquí..."
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                    handleInputChange(e);
                    adjustTextareaHeight();
                  }}
                  onKeyDown={handleKeyDown}
                  disabled={isSubmitting}
                  rows={1}
                />
                <SendButton
                  type="submit"
                  disabled={isInputDisabled}
                  aria-label="Enviar mensaje"
                >
                  <Icon name="send" size="sm" />
                </SendButton>
              </InputWrapper>
            </form>
          </InputContainer>
        </ActionsSection>
      </ChatSection>
    </ChatContainer>
  );
}
