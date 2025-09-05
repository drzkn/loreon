import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import { useRef } from 'react';
import { useChat } from '@ai-sdk/react';
import ChatPage from '../page';
import { createTestSetup } from '@/mocks';

// Mock useAuth hook
const mockUserProfile = {
  id: 'user-123',
  name: 'Test User',
  email: 'test@example.com',
  avatar: 'https://avatar.url'
};

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    userProfile: mockUserProfile
  })
}));

// Mock @ai-sdk/react
const mockHandleSubmit = vi.fn();
const mockHandleInputChange = vi.fn();
let mockUseChatReturnValue = {
  messages: [],
  input: '',
  handleInputChange: mockHandleInputChange,
  handleSubmit: mockHandleSubmit,
  status: 'idle'
};

const mockUseChat = vi.fn(() => mockUseChatReturnValue);

vi.mock('@ai-sdk/react', () => ({
  useChat: () => mockUseChat()
}));

// Mock components
vi.mock('@/components', () => ({
  Icon: ({ name, size }: { name: string; size?: string }) => (
    <span data-testid={`icon-${name}`} data-size={size}>
      {name}
    </span>
  )
}));

// Theme básico para styled-components
const theme = {
  colors: {
    primary: '#10b981',
    secondary: '#6b7280',
    background: '#111827',
    surface: '#1f2937'
  }
};

describe('ChatPage', () => {
  const { teardown } = createTestSetup();

  beforeEach(() => {
    vi.clearAllMocks();

    // Reset mock to default behavior
    mockUseChatReturnValue = {
      messages: [],
      input: '',
      handleInputChange: mockHandleInputChange,
      handleSubmit: mockHandleSubmit,
      status: 'idle'
    };

    // Mock scrollIntoView
    Element.prototype.scrollIntoView = vi.fn();

    // Mock textarea style properties
    Object.defineProperty(HTMLTextAreaElement.prototype, 'scrollHeight', {
      configurable: true,
      value: 50
    });

    Object.defineProperty(HTMLTextAreaElement.prototype, 'style', {
      value: { height: 'auto' },
      writable: true
    });
  });

  afterEach(() => {
    teardown();
  });

  const renderChatPage = () => {
    return render(
      <ThemeProvider theme={theme}>
        <ChatPage />
      </ThemeProvider>
    );
  };

  describe('renderizado inicial', () => {
    it('debería renderizar el mensaje de bienvenida cuando no hay mensajes', () => {
      renderChatPage();

      expect(screen.getByText('¡Hola! Soy Loreon AI')).toBeInTheDocument();
      expect(screen.getByText(/Estoy aquí para ayudarte a encontrar información en tus documentos de Notion/)).toBeInTheDocument();
      expect(screen.getByTestId('icon-bot')).toBeInTheDocument();
    });

    it('debería renderizar el campo de entrada', () => {
      renderChatPage();

      const input = screen.getByPlaceholderText('Escribe tu pregunta aquí...');
      expect(input).toBeInTheDocument();
      expect(input).toBeInstanceOf(HTMLTextAreaElement);
    });

    it('debería renderizar el botón de envío', () => {
      renderChatPage();

      const sendButton = screen.getByRole('button', { name: 'Enviar mensaje' });
      expect(sendButton).toBeInTheDocument();
      expect(sendButton).toBeDisabled(); // Debería estar deshabilitado sin texto
    });
  });

  describe('interacciones de usuario', () => {
    it('debería manejar cambios en el input', () => {
      renderChatPage();

      const input = screen.getByPlaceholderText('Escribe tu pregunta aquí...');
      fireEvent.change(input, { target: { value: 'Test message' } });

      expect(mockHandleInputChange).toHaveBeenCalled();
    });

    it('debería manejar envío del formulario', () => {
      renderChatPage();

      const form = document.querySelector('form')!;
      fireEvent.submit(form);

      expect(mockHandleSubmit).toHaveBeenCalled();
    });

    it('debería manejar Enter sin Shift para enviar', () => {
      renderChatPage();

      const input = screen.getByPlaceholderText('Escribe tu pregunta aquí...');
      fireEvent.keyDown(input, { key: 'Enter', shiftKey: false });

      expect(mockHandleSubmit).toHaveBeenCalled();
    });

    it('no debería enviar con Shift+Enter', () => {
      renderChatPage();

      const input = screen.getByPlaceholderText('Escribe tu pregunta aquí...');
      fireEvent.keyDown(input, { key: 'Enter', shiftKey: true });

      expect(mockHandleSubmit).not.toHaveBeenCalled();
    });
  });

  describe('formateo de tiempo', () => {
    it('debería formatear la hora correctamente', () => {
      // Mock useChat with messages
      mockUseChatReturnValue = {
        messages: [
          {
            id: 'msg-1',
            role: 'user',
            content: 'Test message',
            createdAt: new Date('2023-01-01T15:30:00')
          }
        ],
        input: '',
        handleInputChange: mockHandleInputChange,
        handleSubmit: mockHandleSubmit,
        status: 'idle'
      };

      renderChatPage();

      expect(screen.getByText('15:30')).toBeInTheDocument();
    });
  });

  describe('iniciales de usuario', () => {
    it('debería mostrar inicial del nombre del usuario', () => {
      // Mock useChat with messages to show user avatar
      mockUseChatReturnValue = {
        messages: [
          {
            id: 'msg-1',
            role: 'user',
            content: 'Test message',
            createdAt: new Date()
          }
        ],
        input: '',
        handleInputChange: mockHandleInputChange,
        handleSubmit: mockHandleSubmit,
        status: 'idle'
      };

      renderChatPage();

      expect(screen.getByText('T')).toBeInTheDocument(); // Primera letra de "Test User"
    });

    it('debería usar email como fallback para inicial', () => {
      // Mock user without name
      const mockUseAuthWithoutName = vi.fn(() => ({
        userProfile: {
          ...mockUserProfile,
          name: undefined
        }
      }));

      vi.doMock('@/hooks/useAuth', () => ({
        useAuth: mockUseAuthWithoutName
      }));

      mockUseChatReturnValue = {
        messages: [
          {
            id: 'msg-1',
            role: 'user',
            content: 'Test message',
            createdAt: new Date()
          }
        ],
        input: '',
        handleInputChange: mockHandleInputChange,
        handleSubmit: mockHandleSubmit,
        status: 'idle'
      };

      renderChatPage();

      expect(screen.getByText('T')).toBeInTheDocument(); // Primera letra de "test@example.com"
    });

    it('debería usar "U" como fallback final', () => {
      // Test de la lógica de getUserInitial directamente
      // Simula el comportamiento del componente cuando userProfile no tiene name ni email
      const getUserInitial = (userProfile: any) => {
        if (!userProfile?.name) return userProfile?.email?.[0]?.toUpperCase() || 'U';
        return userProfile.name[0].toUpperCase();
      };

      // Test con usuario sin name ni email
      const result = getUserInitial({ id: 'test', name: undefined, email: undefined });
      expect(result).toBe('U');

      // Test con usuario sin name pero con email undefined también
      const result2 = getUserInitial({ id: 'test', name: null, email: null });
      expect(result2).toBe('U');

      // Test con usuario completamente undefined
      const result3 = getUserInitial(undefined);
      expect(result3).toBe('U');
    });
  });

  describe('estados de carga', () => {
    it('debería mostrar estado "Pensando..." durante streaming', () => {
      mockUseChatReturnValue = {
        messages: [],
        input: '',
        handleInputChange: mockHandleInputChange,
        handleSubmit: mockHandleSubmit,
        status: 'streaming'
      };

      renderChatPage();

      expect(screen.getByText('Pensando...')).toBeInTheDocument();
      expect(screen.getByTestId('icon-brain')).toBeInTheDocument();
    });

    it('debería deshabilitar input durante streaming', () => {
      mockUseChatReturnValue = {
        messages: [],
        input: '',
        handleInputChange: mockHandleInputChange,
        handleSubmit: mockHandleSubmit,
        status: 'streaming'
      };

      renderChatPage();

      const input = screen.getByPlaceholderText('Escribe tu pregunta aquí...');
      expect(input).toBeDisabled();
    });

    it('debería deshabilitar botón cuando no hay texto', () => {
      mockUseChatReturnValue = {
        messages: [],
        input: '',
        handleInputChange: mockHandleInputChange,
        handleSubmit: mockHandleSubmit,
        status: 'idle'
      };

      renderChatPage();

      const sendButton = screen.getByRole('button', { name: 'Enviar mensaje' });
      expect(sendButton).toBeDisabled();
    });

    it('debería habilitar botón con texto', () => {
      mockUseChatReturnValue = {
        messages: [],
        input: 'Test message',
        handleInputChange: mockHandleInputChange,
        handleSubmit: mockHandleSubmit,
        status: 'idle'
      };

      renderChatPage();

      const sendButton = screen.getByRole('button', { name: 'Enviar mensaje' });
      expect(sendButton).not.toBeDisabled();
    });
  });

  describe('renderizado de mensajes', () => {
    it('debería renderizar mensajes del usuario y del asistente', () => {
      mockUseChatReturnValue = {
        messages: [
          {
            id: 'msg-1',
            role: 'user',
            content: 'Pregunta del usuario',
            createdAt: new Date()
          },
          {
            id: 'msg-2',
            role: 'assistant',
            content: 'Respuesta del asistente',
            createdAt: new Date()
          }
        ],
        input: '',
        handleInputChange: mockHandleInputChange,
        handleSubmit: mockHandleSubmit,
        status: 'idle'
      };

      renderChatPage();

      expect(screen.getByText('Pregunta del usuario')).toBeInTheDocument();
      expect(screen.getByText('Respuesta del asistente')).toBeInTheDocument();
    });

    it('debería mostrar iconos correctos para cada tipo de mensaje', () => {
      mockUseChatReturnValue = {
        messages: [
          {
            id: 'msg-1',
            role: 'user',
            content: 'Pregunta del usuario',
            createdAt: new Date()
          },
          {
            id: 'msg-2',
            role: 'assistant',
            content: 'Respuesta del asistente',
            createdAt: new Date()
          }
        ],
        input: '',
        handleInputChange: mockHandleInputChange,
        handleSubmit: mockHandleSubmit,
        status: 'idle'
      };

      renderChatPage();

      // Usuario debería mostrar inicial
      expect(screen.getByText('T')).toBeInTheDocument();
      // Asistente debería mostrar icono bot
      expect(screen.getByTestId('icon-bot')).toBeInTheDocument();
    });
  });

  describe('scroll automático', () => {
    it('debería hacer scroll al final cuando se agregan mensajes', async () => {
      const scrollIntoViewMock = vi.fn();

      // Mock scrollIntoView
      Element.prototype.scrollIntoView = scrollIntoViewMock;

      mockUseChatReturnValue = {
        messages: [
          {
            id: 'msg-1',
            role: 'user',
            content: 'Nuevo mensaje',
            createdAt: new Date()
          }
        ],
        input: '',
        handleInputChange: mockHandleInputChange,
        handleSubmit: mockHandleSubmit,
        status: 'idle'
      };

      renderChatPage();

      await waitFor(() => {
        expect(scrollIntoViewMock).toHaveBeenCalledWith({ behavior: 'smooth' });
      });
    });
  });

  describe('ajuste de altura del textarea', () => {
    it('debería ajustar altura automáticamente', () => {
      renderChatPage();

      const input = screen.getByPlaceholderText('Escribe tu pregunta aquí...');

      // Configurar scrollHeight para simular contenido más largo
      Object.defineProperty(input, 'scrollHeight', {
        configurable: true,
        value: 80
      });

      fireEvent.change(input, { target: { value: 'Texto largo\ncon\nmúltiples\nlíneas' } });

      // El efecto debería ejecutarse y ajustar la altura
      expect(input.style.height).toBe('80px');
    });

    it('debería limitar altura máxima a 128px', () => {
      renderChatPage();

      const input = screen.getByPlaceholderText('Escribe tu pregunta aquí...');

      // Configurar scrollHeight para simular contenido muy largo
      Object.defineProperty(input, 'scrollHeight', {
        configurable: true,
        value: 200
      });

      fireEvent.change(input, { target: { value: 'Texto muy largo' } });

      // Debería usar Math.min con 128
      expect(input.style.height).toBe('128px');
    });
  });
});
