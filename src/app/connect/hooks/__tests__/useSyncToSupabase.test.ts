import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useSyncToSupabase } from '../useSyncToSupabase';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock console.error and alert
const mockConsoleError = vi.spyOn(console, 'error').mockImplementation(() => { });
const mockAlert = vi.spyOn(window, 'alert').mockImplementation(() => { });

// Mock ReadableStream
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

describe('useSyncToSupabase', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.setSystemTime(new Date('2023-01-01T12:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should initialize with correct default values', () => {
    const { result } = renderHook(() => useSyncToSupabase());

    expect(result.current.isProcessing).toBe(false);
    expect(result.current.logs).toEqual([]);
    expect(typeof result.current.syncToSupabase).toBe('function');
    expect(typeof result.current.addLog).toBe('function');
    expect(typeof result.current.clearLogs).toBe('function');
  });

  it('should add log with timestamp', () => {
    const { result } = renderHook(() => useSyncToSupabase());

    act(() => {
      result.current.addLog('Test message');
    });

    expect(result.current.logs).toHaveLength(1);
    expect(result.current.logs[0]).toMatch(/^\[.*\] Test message$/);
  });

  it('should clear logs', () => {
    const { result } = renderHook(() => useSyncToSupabase());

    act(() => {
      result.current.addLog('Test message 1');
      result.current.addLog('Test message 2');
    });

    expect(result.current.logs).toHaveLength(2);

    act(() => {
      result.current.clearLogs();
    });

    expect(result.current.logs).toHaveLength(0);
  });

  it('should handle successful sync', async () => {
    const mockReader = createMockReader(['data: {"message":"Test message"}\n']);
    mockFetch.mockResolvedValueOnce({
      ok: true,
      body: { getReader: () => mockReader }
    });

    const { result } = renderHook(() => useSyncToSupabase());

    await act(async () => {
      await result.current.syncToSupabase();
    });

    expect(result.current.isProcessing).toBe(false);
    expect(result.current.logs).toHaveLength(1);
    expect(result.current.logs[0]).toMatch(/Test message/);
  });

  it('should handle sync completion with summary', async () => {
    const mockReader = createMockReader([
      'data: {"message":"SYNC_COMPLETE:{\\"summary\\":{\\"total\\":3,\\"successful\\":2,\\"errors\\":1}}"}\n'
    ]);
    mockFetch.mockResolvedValueOnce({
      ok: true,
      body: { getReader: () => mockReader }
    });

    const { result } = renderHook(() => useSyncToSupabase());

    await act(async () => {
      await result.current.syncToSupabase();
    });

    // Verificar que el mensaje de éxito se agregó
    expect(result.current.logs).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/🎉 ¡Sincronización completada exitosamente!/)
      ])
    );

    // Esperar a que el setTimeout se ejecute
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 600));
    });

    // Verificar que el resumen se agregó después del setTimeout
    expect(result.current.logs).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/🎉 ¡Sincronización completada exitosamente!/),
        expect.stringMatching(/📊 Resumen:/),
        expect.stringMatching(/💿 Total de databases: 3/),
        expect.stringMatching(/✅ Exitosas: 2/),
        expect.stringMatching(/❌ Errores: 1/)
      ])
    );
  });

  it('should handle HTTP errors', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500
    });

    const { result } = renderHook(() => useSyncToSupabase());

    await act(async () => {
      await result.current.syncToSupabase();
    });

    expect(result.current.isProcessing).toBe(false);
    expect(result.current.logs).toHaveLength(1);
    expect(result.current.logs[0]).toMatch(/❌ Error en la sincronización: Error HTTP: 500/);
    expect(mockConsoleError).toHaveBeenCalled();
    expect(mockAlert).toHaveBeenCalledWith('❌ Error en la sincronización: Error HTTP: 500');
  });

  it('should handle network errors', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useSyncToSupabase());

    await act(async () => {
      await result.current.syncToSupabase();
    });

    expect(result.current.isProcessing).toBe(false);
    expect(result.current.logs).toHaveLength(1);
    expect(result.current.logs[0]).toMatch(/❌ Error en la sincronización: Network error/);
    expect(mockConsoleError).toHaveBeenCalled();
    expect(mockAlert).toHaveBeenCalledWith('❌ Error en la sincronización: Network error');
  });

  it('should handle unknown errors', async () => {
    mockFetch.mockRejectedValueOnce('Unknown error');

    const { result } = renderHook(() => useSyncToSupabase());

    await act(async () => {
      await result.current.syncToSupabase();
    });

    expect(result.current.logs).toHaveLength(1);
    expect(result.current.logs[0]).toMatch(/❌ Error en la sincronización: Error desconocido/);
    expect(mockAlert).toHaveBeenCalledWith('❌ Error en la sincronización: Error desconocido');
  });

  it('should not start sync if already processing', async () => {
    const mockReader = createMockReader(['data: {"message":"Test message"}\n']);
    mockFetch.mockResolvedValue({
      ok: true,
      body: { getReader: () => mockReader }
    });

    const { result } = renderHook(() => useSyncToSupabase());

    // Iniciar primera sincronización sin await
    act(() => {
      result.current.syncToSupabase();
    });

    // Verificar que está procesando
    expect(result.current.isProcessing).toBe(true);

    // Intentar iniciar segunda sincronización mientras la primera está en progreso
    act(() => {
      result.current.syncToSupabase();
    });

    // Esperar a que termine
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    // Solo debería haber una llamada a fetch
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('should handle response without body', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      body: null
    });

    const { result } = renderHook(() => useSyncToSupabase());

    await act(async () => {
      await result.current.syncToSupabase();
    });

    expect(result.current.isProcessing).toBe(false);
    expect(result.current.logs).toHaveLength(0);
  });

  it('should ignore invalid JSON lines', async () => {
    const mockReader = createMockReader([
      'data: {"message":"Valid message"}\n',
      'data: invalid json\n',
      'data: {"message":"Another valid message"}\n'
    ]);
    mockFetch.mockResolvedValueOnce({
      ok: true,
      body: { getReader: () => mockReader }
    });

    const { result } = renderHook(() => useSyncToSupabase());

    await act(async () => {
      await result.current.syncToSupabase();
    });

    expect(result.current.logs).toHaveLength(2);
    expect(result.current.logs[0]).toMatch(/Valid message/);
    expect(result.current.logs[1]).toMatch(/Another valid message/);
  });

  it('should make correct API call', async () => {
    const mockReader = createMockReader(['data: {"message":"Test"}\n']);
    mockFetch.mockResolvedValueOnce({
      ok: true,
      body: { getReader: () => mockReader }
    });

    const { result } = renderHook(() => useSyncToSupabase());

    await act(async () => {
      await result.current.syncToSupabase();
    });

    expect(mockFetch).toHaveBeenCalledWith('/api/sync-supabase', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
  });
}); 