'use client';

import { useState, useRef, useEffect } from 'react';
import {
  ChatContainer,
  ChatSection,
  ChatHeader,
  ChatTitle,
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

interface ChatMessage {
  id: string;
  content: string;
  author: 'user' | 'assistant';
  timestamp: Date;
}

export default function Home() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

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
  }, [inputValue]);

  const handleSendMessage = () => {
    if (!inputValue.trim() || isTyping) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content: inputValue,
      author: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    setTimeout(() => {
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: '¡Gracias por tu mensaje! 👋 Esta es una respuesta automática de Loreon. Estoy aquí para ayudarte con la gestión de contenido markdown, sincronización de datos y mucho más. ¿En qué puedo asistirte hoy?',
        author: 'assistant',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, assistantMessage]);
      setIsTyping(false);
    }, 1500);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
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
        <ChatHeader>
          <ChatTitle>Loreon AI</ChatTitle>
        </ChatHeader>

        <MessagesContainer>
          {messages.length === 0 ? (
            <WelcomeMessage>
              <WelcomeTitle>¡Bienvenido a Loreon AI! 🚀</WelcomeTitle>
              <WelcomeSubtitle>
                Tu asistente inteligente para gestión de contenido markdown,
                sincronización de datos y mucho más. Comienza escribiendo tu primera pregunta.
              </WelcomeSubtitle>
            </WelcomeMessage>
          ) : (
            messages.map((message) => (
              <Message key={message.id} $isUser={message.author === 'user'}>
                <MessageAuthor $isUser={message.author === 'user'}>
                  {message.author === 'user' ? '👤' : '🤖'}
                </MessageAuthor>
                <MessageBubble $isUser={message.author === 'user'}>
                  <MessageContent $isUser={message.author === 'user'}>
                    {message.content}
                  </MessageContent>
                  <MessageTime $isUser={message.author === 'user'}>
                    {formatTime(message.timestamp)}
                  </MessageTime>
                </MessageBubble>
              </Message>
            ))
          )}

          {isTyping && (
            <Message $isUser={false}>
              <MessageAuthor $isUser={false}>🤖</MessageAuthor>
              <MessageBubble $isUser={false}>
                <MessageContent $isUser={false}>
                  <span style={{ opacity: 0.6 }}>Escribiendo...</span>
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
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Envía un mensaje a Loreon AI..."
              rows={1}
              disabled={isTyping}
            />
            <SendButton
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isTyping}
            >
              ➤
            </SendButton>
          </InputWrapper>
        </InputContainer>
      </ActionsSection>
    </ChatContainer>
  );
}
