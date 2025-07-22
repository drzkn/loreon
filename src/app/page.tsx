'use client';

import { useState, useRef, useEffect } from 'react';
import {
  ChatContainer,
  ChatHeader,
  ChatTitle,
  MessagesContainer,
  Message,
  MessageContent,
  MessageAuthor,
  MessageTime,
  InputContainer,
  ChatInput,
  SendButton
} from './page.styles';

interface ChatMessage {
  id: string;
  content: string;
  author: 'user' | 'assistant';
  timestamp: Date;
}

export default function Home() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      content: '¡Hola! Soy tu asistente de Loreon. ¿En qué puedo ayudarte hoy?',
      author: 'assistant',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content: inputValue,
      author: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');

    setTimeout(() => {
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: '¡Gracias por tu mensaje! Esta es una respuesta automática. Estoy aquí para ayudarte con Loreon. 🚀',
        author: 'assistant',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, assistantMessage]);
    }, 1000);
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
      <ChatHeader>
        <ChatTitle>💬 Chat con Loreon</ChatTitle>
      </ChatHeader>

      <MessagesContainer>
        {messages.map((message) => (
          <Message key={message.id} $isUser={message.author === 'user'}>
            <MessageAuthor $isUser={message.author === 'user'}>
              {message.author === 'user' ? '👤 Tú' : '🤖 Loreon'}
            </MessageAuthor>
            <MessageContent $isUser={message.author === 'user'}>
              {message.content}
            </MessageContent>
            <MessageTime>
              {formatTime(message.timestamp)}
            </MessageTime>
          </Message>
        ))}
        <div ref={messagesEndRef} />
      </MessagesContainer>

      <InputContainer>
        <ChatInput
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Escribe tu mensaje..."
          rows={1}
        />
        <SendButton
          onClick={handleSendMessage}
          disabled={!inputValue.trim()}
        >
          📤
        </SendButton>
      </InputContainer>
    </ChatContainer>
  );
}
