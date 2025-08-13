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

export default function Home() {
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

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = `${inputRef.current.scrollHeight}px`;
    }
  }, [input]);

  useEffect(() => {
    const handleInputFocus = () => {
      const isMobile = window.innerWidth <= 768;
      if (isMobile) {
        setTimeout(() => {
          if (inputRef.current) {
            inputRef.current.scrollIntoView({
              behavior: 'smooth',
              block: 'end',
              inline: 'nearest'
            });
          }
        }, 300);
      }
    };

    const handleResize = () => {
      const isMobile = window.innerWidth <= 768;
      if (isMobile && document.activeElement === inputRef.current) {
        setTimeout(() => {
          if (inputRef.current) {
            inputRef.current.scrollIntoView({
              behavior: 'smooth',
              block: 'end',
              inline: 'nearest'
            });
          }
        }, 150);
      }
    };

    const inputElement = inputRef.current;
    if (inputElement) {
      inputElement.addEventListener('focus', handleInputFocus);
      window.addEventListener('resize', handleResize);
      window.addEventListener('orientationchange', handleResize);

      return () => {
        inputElement.removeEventListener('focus', handleInputFocus);
        window.removeEventListener('resize', handleResize);
        window.removeEventListener('orientationchange', handleResize);
      };
    }
  }, []);

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
              <WelcomeTitle>¡Bienvenido a Loreon AI! <Icon name="rocket" size="lg" /></WelcomeTitle>
              <WelcomeSubtitle>
                Tu asistente inteligente para gestión de contenido,
                sincronización de datos y búsqueda semántica. Comienza escribiendo tu primera pregunta.
              </WelcomeSubtitle>
              {userProfile && (
                <p style={{ color: 'var(--accent-color)', margin: '1rem 0 0 0', fontSize: '0.9rem', display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
                  ¡Hola, {userProfile.name}! <Icon name="party-popper" size="sm" />
                </p>
              )}
            </WelcomeMessage>
          ) : (
            messages.map((message) => (
              <Message key={message.id} $isUser={message.role === 'user'}>
                <MessageAuthor $isUser={message.role === 'user'}>
                  {message.role === 'user' ? <Icon name="user" /> : <Icon name="bot" />}
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
              <MessageAuthor $isUser={false}><Icon name="bot" /></MessageAuthor>
              <MessageBubble $isUser={false}>
                <MessageContent $isUser={false}>
                  <span style={{ opacity: 0.6 }}>
                    {status === 'submitted' ? 'Enviando...' : 'Pensando...'}
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
    </ChatContainer >
  );
}
