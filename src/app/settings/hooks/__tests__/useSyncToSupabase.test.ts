import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useSyncToSupabase } from '../useSyncToSupabase';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock getEnvVar
vi.mock('../../../../utils/getEnvVar', () => ({
  getEnvVar: vi.fn(() => 'test-database-id')
}));

describe('useSyncToSupabase', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with default values', () => {
    const { result } = renderHook(() => useSyncToSupabase());

    expect(result.current.isProcessing).toBe(false);
    expect(result.current.logs).toEqual([]);
    expect(typeof result.current.syncToSupabase).toBe('function');
    expect(typeof result.current.clearLogs).toBe('function');
  });

  it('should clear logs when clearLogs is called', () => {
    const { result } = renderHook(() => useSyncToSupabase());

    // Simulate adding logs (this would be done internally)
    act(() => {
      result.current.clearLogs();
    });

    expect(result.current.logs).toEqual([]);
  });

  it('should set isProcessing to true when syncToSupabase is called', async () => {
    // Mock fetch to return a readable stream
    const mockReader = {
      read: vi.fn().mockResolvedValue({ done: true, value: undefined })
    };

    const mockResponse = {
      ok: true,
      body: { getReader: () => mockReader }
    };

    mockFetch.mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useSyncToSupabase());

    await act(async () => {
      const promise = result.current.syncToSupabase();

      // Check that isProcessing becomes true
      expect(result.current.isProcessing).toBe(true);

      await promise;
    });

    // After completion, isProcessing should be false
    expect(result.current.isProcessing).toBe(false);
  });
}); 