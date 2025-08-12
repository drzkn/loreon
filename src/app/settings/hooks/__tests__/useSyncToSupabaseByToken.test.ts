import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.spyOn(console, 'log').mockImplementation(() => { });
vi.spyOn(console, 'error').mockImplementation(() => { });

import { useSyncToSupabaseByToken } from '../useSyncToSupabaseByToken';

const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('useSyncToSupabaseByToken', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('debería manejar error HTTP y response sin body', async () => {
    const { result } = renderHook(() => useSyncToSupabaseByToken());

    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      text: () => Promise.resolve('Server Error')
    });

    await act(async () => {
      await result.current.syncToSupabase('error-token');
    });

    expect(result.current.isProcessing).toBe(false);
    expect(result.current.logs.some(log => log.includes('❌ Error en la sincronización'))).toBe(true);
    expect(result.current.logs.some(log => log.includes('Error HTTP 500'))).toBe(true);

    act(() => {
      result.current.clearLogs();
    });

    mockFetch.mockResolvedValueOnce({
      ok: true,
      body: null
    });

    await act(async () => {
      await result.current.syncToSupabase('no-body-token');
    });

    expect(result.current.isProcessing).toBe(false);
    expect(result.current.logs.some(log => log.includes('No se pudo obtener el stream'))).toBe(true);
  });

  it('debería manejar sincronización exitosa básica', async () => {
    const mockReader = {
      read: vi.fn()
        .mockResolvedValueOnce({ done: false, value: new TextEncoder().encode('data: {"message":"🔄 Iniciando..."}\n') })
        .mockResolvedValueOnce({ done: true, value: undefined }),
      releaseLock: vi.fn()
    };

    mockFetch.mockResolvedValue({
      ok: true,
      body: { getReader: () => mockReader }
    });

    const { result } = renderHook(() => useSyncToSupabaseByToken());

    await act(async () => {
      await result.current.syncToSupabase('success-token');
    });

    expect(mockFetch).toHaveBeenCalledWith('/api/sync-supabase-by-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tokenId: 'success-token' })
    });

    expect(result.current.isProcessing).toBe(false);
    expect(result.current.logs.some(log => log.includes('success-token'))).toBe(true);
    expect(mockReader.releaseLock).toHaveBeenCalled();
  });

  it('debería manejar errores de stream y datos malformados', async () => {
    const { result } = renderHook(() => useSyncToSupabaseByToken());

    const errorReader = {
      read: vi.fn().mockRejectedValue(new Error('Stream error')),
      releaseLock: vi.fn()
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      body: { getReader: () => errorReader }
    });

    await act(async () => {
      await result.current.syncToSupabase('stream-error-token');
    });

    expect(result.current.isProcessing).toBe(false);
    expect(result.current.logs.some(log => log.includes('Stream error'))).toBe(true);
    expect(errorReader.releaseLock).toHaveBeenCalled();

    act(() => {
      result.current.clearLogs();
    });

    const malformedReader = {
      read: vi.fn()
        .mockResolvedValueOnce({ done: false, value: new TextEncoder().encode('data: invalid json\n') })
        .mockResolvedValueOnce({ done: false, value: new TextEncoder().encode('data: {"message":"Valid"}\n') })
        .mockResolvedValueOnce({ done: true, value: undefined }),
      releaseLock: vi.fn()
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      body: { getReader: () => malformedReader }
    });

    await act(async () => {
      await result.current.syncToSupabase('malformed-token');
    });

    expect(result.current.logs.some(log => log.includes('Valid'))).toBe(true);
    expect(malformedReader.releaseLock).toHaveBeenCalled();
  });
});