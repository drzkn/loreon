import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import ChatPage from '../page';
import { createTestSetup } from '../../../mocks';
import { theme } from '@/lib/theme';

// Mock @ai-sdk/react
const mockHandleSubmit = vi.fn();
const mockHandleInputChange = vi.fn();

interface MockMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt?: Date;
}

let mockUseChatReturnValue = {
  messages: [] as MockMessage[],
  input: '',
  handleInputChange: mockHandleInputChange,
  handleSubmit: mockHandleSubmit,
  status: 'idle' as 'idle' | 'streaming'
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


describe('ChatPage', () => {
  const { teardown } = createTestSetup();

  beforeEach(() => {
    vi.clearAllMocks();

    // Reset mock to default behavior
    mockUseChatReturnValue = {
      messages: [] as MockMessage[],
      input: '',
      handleInputChange: mockHandleInputChange,
      handleSubmit: mockHandleSubmit,
      status: 'idle' as 'idle' | 'streaming'
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
      expect(sendButton).toBeDisabled();
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
      mockUseChatReturnValue = {
        messages: [
          {
            id: 'msg-1',
            role: 'user',
            content: 'Test message',
            createdAt: new Date('2023-01-01T15:30:00')
          }
        ] as MockMessage[],
        input: '',
        handleInputChange: mockHandleInputChange,
        handleSubmit: mockHandleSubmit,
        status: 'idle' as 'idle' | 'streaming'
      };

      renderChatPage();

      expect(screen.getByText('15:30')).toBeInTheDocument();
    });
  });

  describe('iniciales de usuario', () => {
    it('debería mostrar "U" como inicial del usuario', () => {
      mockUseChatReturnValue = {
        messages: [
          {
            id: 'msg-1',
            role: 'user',
            content: 'Test message',
            createdAt: new Date()
          }
        ] as MockMessage[],
        input: '',
        handleInputChange: mockHandleInputChange,
        handleSubmit: mockHandleSubmit,
        status: 'idle' as 'idle' | 'streaming'
      };

      renderChatPage();

      expect(screen.getByText('U')).toBeInTheDocument();
    });
  });

  describe('estados de carga', () => {
    it('debería mostrar estado "Pensando..." durante streaming', () => {
      mockUseChatReturnValue = {
        messages: [] as MockMessage[],
        input: '',
        handleInputChange: mockHandleInputChange,
        handleSubmit: mockHandleSubmit,
        status: 'streaming' as 'idle' | 'streaming'
      };

      renderChatPage();

      expect(screen.getByText('Pensando...')).toBeInTheDocument();
      expect(screen.getByTestId('icon-brain')).toBeInTheDocument();
    });

    it('debería deshabilitar input durante streaming', () => {
      mockUseChatReturnValue = {
        messages: [] as MockMessage[],
        input: '',
        handleInputChange: mockHandleInputChange,
        handleSubmit: mockHandleSubmit,
        status: 'streaming' as 'idle' | 'streaming'
      };

      renderChatPage();

      const input = screen.getByPlaceholderText('Escribe tu pregunta aquí...');
      expect(input).toBeDisabled();
    });

    it('debería deshabilitar botón cuando no hay texto', () => {
      mockUseChatReturnValue = {
        messages: [] as MockMessage[],
        input: '',
        handleInputChange: mockHandleInputChange,
        handleSubmit: mockHandleSubmit,
        status: 'idle' as 'idle' | 'streaming'
      };

      renderChatPage();

      const sendButton = screen.getByRole('button', { name: 'Enviar mensaje' });
      expect(sendButton).toBeDisabled();
    });

    it('debería habilitar botón con texto', () => {
      mockUseChatReturnValue = {
        messages: [] as MockMessage[],
        input: 'Test message',
        handleInputChange: mockHandleInputChange,
        handleSubmit: mockHandleSubmit,
        status: 'idle' as 'idle' | 'streaming'
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
        ] as MockMessage[],
        input: '',
        handleInputChange: mockHandleInputChange,
        handleSubmit: mockHandleSubmit,
        status: 'idle' as 'idle' | 'streaming'
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
        ] as MockMessage[],
        input: '',
        handleInputChange: mockHandleInputChange,
        handleSubmit: mockHandleSubmit,
        status: 'idle' as 'idle' | 'streaming'
      };

      renderChatPage();

      expect(screen.getByText('U')).toBeInTheDocument();
      expect(screen.getByTestId('icon-bot')).toBeInTheDocument();
    });
  });

  describe('scroll automático', () => {
    it('debería hacer scroll al final cuando se agregan mensajes', async () => {
      const scrollIntoViewMock = vi.fn();

      Element.prototype.scrollIntoView = scrollIntoViewMock;

      mockUseChatReturnValue = {
        messages: [
          {
            id: 'msg-1',
            role: 'user',
            content: 'Nuevo mensaje',
            createdAt: new Date()
          }
        ] as MockMessage[],
        input: '',
        handleInputChange: mockHandleInputChange,
        handleSubmit: mockHandleSubmit,
        status: 'idle' as 'idle' | 'streaming'
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

      Object.defineProperty(input, 'scrollHeight', {
        configurable: true,
        value: 80
      });

      fireEvent.change(input, { target: { value: 'Texto largo\ncon\nmúltiples\nlíneas' } });

      expect(input.style.height).toBe('80px');
    });

    it('debería limitar altura máxima a 128px', () => {
      renderChatPage();

      const input = screen.getByPlaceholderText('Escribe tu pregunta aquí...');

      Object.defineProperty(input, 'scrollHeight', {
        configurable: true,
        value: 200
      });

      fireEvent.change(input, { target: { value: 'Texto muy largo' } });

      expect(input.style.height).toBe('128px');
    });
  });
});