import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import ConnectPage from '../page';

// Mock para fetch global
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock para ReadableStream
const createMockReader = (chunks: string[]) => {
  let index = 0;
  return {
    read: vi.fn().mockImplementation(() => {
      if (index < chunks.length) {
        const chunk = chunks[index];
        index++;
        return Promise.resolve({
          done: false,
          value: new TextEncoder().encode(chunk)
        });
      }
      return Promise.resolve({ done: true });
    })
  };
};



// Mock para console.error
const mockConsoleError = vi.spyOn(console, 'error').mockImplementation(() => { });

// Mock para alert
const mockAlert = vi.spyOn(window, 'alert').mockImplementation(() => { });

// Mock para scrollIntoView
const mockScrollIntoView = vi.fn();
Element.prototype.scrollIntoView = mockScrollIntoView;

// Mock para Date
const mockDate = new Date('2023-01-01T12:00:00.000Z');
vi.setSystemTime(mockDate);

describe('ConnectPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe('Initial Render', () => {
    it('should render page with correct title and description', () => {
      render(<ConnectPage />);

      expect(screen.getByText('🔌 Connect & Sync')).toBeInTheDocument();
      expect(screen.getByText('Sincronización con la base de datos')).toBeInTheDocument();
      expect(screen.getByText('🔄 Opciones de Sincronización')).toBeInTheDocument();
    });

    it('should render sync button in initial state', () => {
      render(<ConnectPage />);

      const syncButton = screen.getByText('🚀 Sincronizar');
      expect(syncButton).toBeInTheDocument();
      expect(syncButton).not.toBeDisabled();
    });

    it('should render terminal with initial message', () => {
      render(<ConnectPage />);

      expect(screen.getByText('🖥️ Terminal de Sincronización')).toBeInTheDocument();
      expect(screen.getByText('Esperando logs de sincronización...')).toBeInTheDocument();
    });

    it('should render clear button', () => {
      render(<ConnectPage />);

      const clearButton = screen.getByText('🗑️ Limpiar');
      expect(clearButton).toBeInTheDocument();
    });

    it('should show correct initial status', () => {
      render(<ConnectPage />);

      expect(screen.getByText('Logs: 0')).toBeInTheDocument();
      expect(screen.getByText('⏸️ Inactivo')).toBeInTheDocument();
    });
  });

  describe('Terminal Functionality', () => {
    it('should add log with timestamp when using addLog', async () => {
      render(<ConnectPage />);

      const clearButton = screen.getByText('🗑️ Limpiar');
      fireEvent.click(clearButton);

      // Simular agregar un log indirectamente a través del sync
      const mockReader = createMockReader(['data: {"message":"Test log"}\n']);
      mockFetch.mockResolvedValueOnce({
        ok: true,
        body: { getReader: () => mockReader }
      });

      const syncButton = screen.getByText('🚀 Sincronizar');
      fireEvent.click(syncButton);

      await waitFor(() => {
        expect(screen.getByText(/Test log/)).toBeInTheDocument();
      });

      expect(screen.getByText('Logs: 1')).toBeInTheDocument();
    });

    it('should clear logs when clear button is clicked', async () => {
      render(<ConnectPage />);

      // Agregar un log primero
      const mockReader = createMockReader(['data: {"message":"Test log"}\n']);
      mockFetch.mockResolvedValueOnce({
        ok: true,
        body: { getReader: () => mockReader }
      });

      const syncButton = screen.getByText('🚀 Sincronizar');
      fireEvent.click(syncButton);

      await waitFor(() => {
        expect(screen.getByText(/Test log/)).toBeInTheDocument();
      });

      // Limpiar logs
      const clearButton = screen.getByText('🗑️ Limpiar');
      fireEvent.click(clearButton);

      expect(screen.getByText('Esperando logs de sincronización...')).toBeInTheDocument();
      expect(screen.getByText('Logs: 0')).toBeInTheDocument();
    });

    it('should auto-scroll to bottom when logs are added', async () => {
      render(<ConnectPage />);

      const mockReader = createMockReader(['data: {"message":"Test log"}\n']);
      mockFetch.mockResolvedValueOnce({
        ok: true,
        body: { getReader: () => mockReader }
      });

      const syncButton = screen.getByText('🚀 Sincronizar');
      fireEvent.click(syncButton);

      await waitFor(() => {
        expect(mockScrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth' });
      });
    });

    it('should display logs with different colors based on content', async () => {
      render(<ConnectPage />);

      const mockReader = createMockReader([
        'data: {"message":"❌ Error message"}\n',
        'data: {"message":"✅ Success message"}\n',
        'data: {"message":"📊 Info message"}\n',
        'data: {"message":"Normal message"}\n'
      ]);
      mockFetch.mockResolvedValueOnce({
        ok: true,
        body: { getReader: () => mockReader }
      });

      const syncButton = screen.getByText('🚀 Sincronizar');
      fireEvent.click(syncButton);

      await waitFor(() => {
        expect(screen.getByText(/❌ Error message/)).toBeInTheDocument();
        expect(screen.getByText(/✅ Success message/)).toBeInTheDocument();
        expect(screen.getByText(/📊 Info message/)).toBeInTheDocument();
        expect(screen.getByText(/Normal message/)).toBeInTheDocument();
      });
    });
  });

  describe('Sync Functionality', () => {
    it('should handle successful sync with basic message', async () => {
      render(<ConnectPage />);

      const mockReader = createMockReader(['data: {"message":"Sync started"}\n']);
      mockFetch.mockResolvedValueOnce({
        ok: true,
        body: { getReader: () => mockReader }
      });

      const syncButton = screen.getByText('🚀 Sincronizar');
      fireEvent.click(syncButton);

      // Verificar estado durante procesamiento
      expect(screen.getByText('🔄 Sincronizando...')).toBeInTheDocument();
      expect(screen.getByText('🔄 Procesando...')).toBeInTheDocument();
      expect(screen.getByText('🔄 Sincronización en progreso...')).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.getByText(/Sync started/)).toBeInTheDocument();
      });

      // Verificar estado después del procesamiento
      await waitFor(() => {
        expect(screen.getByText('🚀 Sincronizar')).toBeInTheDocument();
        expect(screen.getByText('⏸️ Inactivo')).toBeInTheDocument();
      });
    });

    it('should handle sync completion message', async () => {
      render(<ConnectPage />);

      const mockReader = createMockReader([
        'data: {"message":"SYNC_COMPLETE:{}"}\n'
      ]);
      mockFetch.mockResolvedValueOnce({
        ok: true,
        body: { getReader: () => mockReader }
      });

      const syncButton = screen.getByText('🚀 Sincronizar');
      fireEvent.click(syncButton);

      await waitFor(() => {
        expect(screen.getByText(/🎉 ¡Sincronización completada exitosamente!/)).toBeInTheDocument();
      });
    });

    it('should handle multiple SSE messages', async () => {
      render(<ConnectPage />);

      const mockReader = createMockReader([
        'data: {"message":"Starting sync"}\n',
        'data: {"message":"Processing database 1"}\n',
        'data: {"message":"Processing database 2"}\n',
        'data: {"message":"Sync finished"}\n'
      ]);
      mockFetch.mockResolvedValueOnce({
        ok: true,
        body: { getReader: () => mockReader }
      });

      const syncButton = screen.getByText('🚀 Sincronizar');
      fireEvent.click(syncButton);

      await waitFor(() => {
        expect(screen.getByText(/Starting sync/)).toBeInTheDocument();
        expect(screen.getByText(/Processing database 1/)).toBeInTheDocument();
        expect(screen.getByText(/Processing database 2/)).toBeInTheDocument();
        expect(screen.getByText(/Sync finished/)).toBeInTheDocument();
      });

      expect(screen.getByText('Logs: 4')).toBeInTheDocument();
    });

    it('should ignore invalid JSON lines', async () => {
      render(<ConnectPage />);

      const mockReader = createMockReader([
        'data: {"message":"Valid message"}\n',
        'data: invalid json\n',
        'data: {"message":"Another valid message"}\n'
      ]);
      mockFetch.mockResolvedValueOnce({
        ok: true,
        body: { getReader: () => mockReader }
      });

      const syncButton = screen.getByText('🚀 Sincronizar');
      fireEvent.click(syncButton);

      await waitFor(() => {
        expect(screen.getByText(/Valid message/)).toBeInTheDocument();
        expect(screen.getByText(/Another valid message/)).toBeInTheDocument();
      });

      expect(screen.getByText('Logs: 2')).toBeInTheDocument();
    });

    it('should disable sync button during processing', async () => {
      render(<ConnectPage />);

      const mockReader = createMockReader(['data: {"message":"Processing"}\n']);
      mockFetch.mockResolvedValueOnce({
        ok: true,
        body: { getReader: () => mockReader }
      });

      const syncButton = screen.getByText('🚀 Sincronizar');
      fireEvent.click(syncButton);

      const processingButton = screen.getByText('🔄 Sincronizando...');
      expect(processingButton).toBeDisabled();

      // Intentar hacer click mientras está procesando
      fireEvent.click(processingButton);

      // Verificar que no se hace otra llamada
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('Error Handling', () => {
    it('should handle fetch HTTP errors', async () => {
      render(<ConnectPage />);

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500
      });

      const syncButton = screen.getByText('🚀 Sincronizar');
      fireEvent.click(syncButton);

      await waitFor(() => {
        expect(screen.getByText(/❌ Error en la sincronización: Error HTTP: 500/)).toBeInTheDocument();
      });

      expect(mockConsoleError).toHaveBeenCalled();
      expect(mockAlert).toHaveBeenCalledWith('❌ Error en la sincronización: Error HTTP: 500');
    });

    it('should handle network errors', async () => {
      render(<ConnectPage />);

      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const syncButton = screen.getByText('🚀 Sincronizar');
      fireEvent.click(syncButton);

      await waitFor(() => {
        expect(screen.getByText(/❌ Error en la sincronización: Network error/)).toBeInTheDocument();
      });

      expect(mockConsoleError).toHaveBeenCalled();
      expect(mockAlert).toHaveBeenCalledWith('❌ Error en la sincronización: Network error');
    });

    it('should handle unknown errors', async () => {
      render(<ConnectPage />);

      mockFetch.mockRejectedValueOnce('Unknown error');

      const syncButton = screen.getByText('🚀 Sincronizar');
      fireEvent.click(syncButton);

      await waitFor(() => {
        expect(screen.getByText(/❌ Error en la sincronización: Error desconocido/)).toBeInTheDocument();
      });

      expect(mockAlert).toHaveBeenCalledWith('❌ Error en la sincronización: Error desconocido');
    });

    it('should handle response without body', async () => {
      render(<ConnectPage />);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        body: null
      });

      const syncButton = screen.getByText('🚀 Sincronizar');
      fireEvent.click(syncButton);

      await waitFor(() => {
        expect(screen.getByText('🚀 Sincronizar')).toBeInTheDocument();
      });

      // No debería haber logs ya que no hay body
      expect(screen.getByText('Logs: 0')).toBeInTheDocument();
    });

    it('should handle reader errors', async () => {
      render(<ConnectPage />);

      const mockReader = {
        read: vi.fn().mockRejectedValueOnce(new Error('Reader error'))
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        body: { getReader: () => mockReader }
      });

      const syncButton = screen.getByText('🚀 Sincronizar');
      fireEvent.click(syncButton);

      await waitFor(() => {
        expect(screen.getByText(/❌ Error en la sincronización: Reader error/)).toBeInTheDocument();
      });
    });
  });

  describe('API Integration', () => {
    it('should make correct API call', async () => {
      render(<ConnectPage />);

      const mockReader = createMockReader(['data: {"message":"Test"}\n']);
      mockFetch.mockResolvedValueOnce({
        ok: true,
        body: { getReader: () => mockReader }
      });

      const syncButton = screen.getByText('🚀 Sincronizar');
      fireEvent.click(syncButton);

      expect(mockFetch).toHaveBeenCalledWith('/api/sync-supabase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
    });

    it('should handle empty response chunks', async () => {
      render(<ConnectPage />);

      const mockReader = createMockReader(['', 'data: {"message":"Test"}\n', '']);
      mockFetch.mockResolvedValueOnce({
        ok: true,
        body: { getReader: () => mockReader }
      });

      const syncButton = screen.getByText('🚀 Sincronizar');
      fireEvent.click(syncButton);

      await waitFor(() => {
        expect(screen.getByText(/Test/)).toBeInTheDocument();
      });

      expect(screen.getByText('Logs: 1')).toBeInTheDocument();
    });

    it('should handle malformed SSE data', async () => {
      render(<ConnectPage />);

      const mockReader = createMockReader([
        'data: {"message":"Valid message"}\n',
        'event: message\n',
        'data: {"message":"Another valid message"}\n'
      ]);
      mockFetch.mockResolvedValueOnce({
        ok: true,
        body: { getReader: () => mockReader }
      });

      const syncButton = screen.getByText('🚀 Sincronizar');
      fireEvent.click(syncButton);

      await waitFor(() => {
        expect(screen.getByText(/Valid message/)).toBeInTheDocument();
      });

      // Verificar que al menos se procesó un mensaje válido
      expect(screen.getByText('Logs: 2')).toBeInTheDocument();
    });
  });

  describe('User Interface', () => {
    it('should show processing state correctly', async () => {
      render(<ConnectPage />);

      const mockReader = createMockReader(['data: {"message":"Processing"}\n']);
      mockFetch.mockResolvedValueOnce({
        ok: true,
        body: { getReader: () => mockReader }
      });

      const syncButton = screen.getByText('🚀 Sincronizar');
      fireEvent.click(syncButton);

      // Verificar elementos de estado de procesamiento
      expect(screen.getByText('🔄 Sincronizando...')).toBeInTheDocument();
      expect(screen.getByText('🔄 Procesando...')).toBeInTheDocument();
      expect(screen.getByText('🔄 Sincronización en progreso...')).toBeInTheDocument();
      expect(screen.getByText('📄 Procesando múltiples databases')).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.getByText('🚀 Sincronizar')).toBeInTheDocument();
        expect(screen.getByText('⏸️ Inactivo')).toBeInTheDocument();
      });
    });

    it('should handle rapid consecutive clicks', async () => {
      render(<ConnectPage />);

      const mockReader = createMockReader(['data: {"message":"Test"}\n']);
      mockFetch.mockResolvedValueOnce({
        ok: true,
        body: { getReader: () => mockReader }
      });

      const syncButton = screen.getByText('🚀 Sincronizar');

      // Clicks rápidos consecutivos
      fireEvent.click(syncButton);
      fireEvent.click(syncButton);
      fireEvent.click(syncButton);

      // Solo debería hacer una llamada
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should maintain proper UI state during error recovery', async () => {
      render(<ConnectPage />);

      // Primera llamada falla
      mockFetch.mockRejectedValueOnce(new Error('First error'));

      const syncButton = screen.getByText('🚀 Sincronizar');
      fireEvent.click(syncButton);

      await waitFor(() => {
        expect(screen.getByText('🚀 Sincronizar')).toBeInTheDocument();
        expect(screen.getByText('⏸️ Inactivo')).toBeInTheDocument();
      });

      // Después del error, se puede intentar de nuevo
      expect(syncButton).not.toBeDisabled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle sync completion with malformed JSON', async () => {
      render(<ConnectPage />);

      const mockReader = createMockReader([
        'data: {"message":"Simple completion message"}\n'
      ]);
      mockFetch.mockResolvedValueOnce({
        ok: true,
        body: { getReader: () => mockReader }
      });

      const syncButton = screen.getByText('🚀 Sincronizar');
      fireEvent.click(syncButton);

      await waitFor(() => {
        expect(screen.getByText(/Simple completion message/)).toBeInTheDocument();
      });

      // Se agrega el log del mensaje
      expect(screen.getByText('Logs: 1')).toBeInTheDocument();
    });

    it('should handle empty logs array correctly', () => {
      render(<ConnectPage />);

      expect(screen.getByText('Logs: 0')).toBeInTheDocument();
      expect(screen.getByText('Esperando logs de sincronización...')).toBeInTheDocument();
    });

    it('should handle SSE with only line breaks', async () => {
      render(<ConnectPage />);

      const mockReader = createMockReader(['\n\n\n']);
      mockFetch.mockResolvedValueOnce({
        ok: true,
        body: { getReader: () => mockReader }
      });

      const syncButton = screen.getByText('🚀 Sincronizar');
      fireEvent.click(syncButton);

      await waitFor(() => {
        expect(screen.getByText('🚀 Sincronizar')).toBeInTheDocument();
      });

      // El estado debe volver a inactivo sin procesar logs
      expect(screen.getByText('⏸️ Inactivo')).toBeInTheDocument();
    });

    it('should handle reader that returns done immediately', async () => {
      render(<ConnectPage />);

      const mockReader = {
        read: vi.fn().mockResolvedValue({ done: true })
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        body: { getReader: () => mockReader }
      });

      const syncButton = screen.getByText('🚀 Sincronizar');
      fireEvent.click(syncButton);

      await waitFor(() => {
        expect(screen.getByText('🚀 Sincronizar')).toBeInTheDocument();
      });

      // El estado debe volver a inactivo
      expect(screen.getByText('⏸️ Inactivo')).toBeInTheDocument();
    });
  });
});
