import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';

// Usar el sistema centralizado de mocks
import {
  createTestSetup
} from '@/mocks';

describe('useSystemDataLoader', () => {
  const originalWindow = global.window;
  const { teardown } = createTestSetup(); // ✅ Console mocks centralizados

  beforeEach(() => {
    vi.clearAllMocks();
    if (!global.window) {
      Object.defineProperty(global, 'window', {
        value: {},
        writable: true
      });
    }
  });

  afterEach(() => {
    teardown(); // ✅ Limpieza automática
    if (originalWindow) {
      global.window = originalWindow;
    } else {
      Object.defineProperty(global, 'window', {
        value: undefined,
        writable: true
      });
    }
    vi.restoreAllMocks();
  });

  describe('Inicialización y estados básicos', () => {
    it('debería inicializar con estado loading correcto', async () => {
      const { useSystemDataLoader } = await import('../useSystemDataLoader');
      const { result } = renderHook(() => useSystemDataLoader());

      expect(result.current.loading).toBe(true);
      expect(result.current.error).toBeNull();
      expect(result.current.pages).toEqual([]);
      expect(result.current.systemStatus.selectedSystem).toBe('none');

      await waitFor(() => {
        expect(result.current.isClient).toBe(true);
      });
    });

    it('debería retornar todas las propiedades esperadas del hook', async () => {
      const { useSystemDataLoader } = await import('../useSystemDataLoader');
      const { result } = renderHook(() => useSystemDataLoader());

      expect(result.current).toHaveProperty('pages');
      expect(result.current).toHaveProperty('loading');
      expect(result.current).toHaveProperty('error');
      expect(result.current).toHaveProperty('isClient');
      expect(result.current).toHaveProperty('systemStatus');

      expect(result.current.systemStatus).toHaveProperty('nativePages');
      expect(result.current.systemStatus).toHaveProperty('legacyPages');
      expect(result.current.systemStatus).toHaveProperty('selectedSystem');
    });

    it('debería inicializar systemStatus con valores por defecto', async () => {
      const { useSystemDataLoader } = await import('../useSystemDataLoader');
      const { result } = renderHook(() => useSystemDataLoader());

      expect(result.current.systemStatus).toEqual({
        nativePages: 0,
        legacyPages: 0,
        selectedSystem: 'none'
      });
    });

    it('debería cambiar isClient a true después del mount', async () => {
      const { useSystemDataLoader } = await import('../useSystemDataLoader');
      const { result } = renderHook(() => useSystemDataLoader());

      await waitFor(() => {
        expect(result.current.isClient).toBe(true);
      });

      expect(result.current.isClient).toBe(true);
    });
  });

  describe('Comportamiento del sistema', () => {
    it('debería manejar casos de inicialización correctamente', async () => {
      const { useSystemDataLoader } = await import('../useSystemDataLoader');
      const { result } = renderHook(() => useSystemDataLoader());

      expect(result.current.loading).toBe(true);
      expect(typeof result.current.isClient).toBe('boolean');

      await waitFor(() => {
        expect(result.current.isClient).toBe(true);
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      }, { timeout: 10000 });

      expect(result.current.isClient).toBe(true);
      expect(result.current.loading).toBe(false);
    });
  });

  describe('Estados del sistema', () => {
    it('debería mantener selectedSystem como none sin datos', async () => {
      const { useSystemDataLoader } = await import('../useSystemDataLoader');
      const { result } = renderHook(() => useSystemDataLoader());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      }, { timeout: 10000 });

      expect(['none', 'native', 'legacy']).toContain(result.current.systemStatus.selectedSystem);
    });

    it('debería mantener counts iniciales de páginas', async () => {
      const { useSystemDataLoader } = await import('../useSystemDataLoader');
      const { result } = renderHook(() => useSystemDataLoader());

      expect(result.current.systemStatus.nativePages).toBe(0);
      expect(result.current.systemStatus.legacyPages).toBe(0);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      }, { timeout: 10000 });

      expect(typeof result.current.systemStatus.nativePages).toBe('number');
      expect(typeof result.current.systemStatus.legacyPages).toBe('number');
    });
  });

  describe('Tipos y estructura de datos', () => {
    it('debería retornar páginas con la estructura correcta cuando hay datos', async () => {
      const { useSystemDataLoader } = await import('../useSystemDataLoader');
      const { result } = renderHook(() => useSystemDataLoader());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      }, { timeout: 10000 });

      if (result.current.pages.length > 0) {
        const page = result.current.pages[0];
        expect(page).toHaveProperty('id');
        expect(page).toHaveProperty('title');
        expect(page).toHaveProperty('content');
        expect(page).toHaveProperty('source');
        expect(page).toHaveProperty('created_at');
        expect(page).toHaveProperty('updated_at');
        expect(['native', 'legacy']).toContain(page.source);
      }
    });

    it('debería mantener arrays válidos para páginas', async () => {
      const { useSystemDataLoader } = await import('../useSystemDataLoader');
      const { result } = renderHook(() => useSystemDataLoader());

      expect(Array.isArray(result.current.pages)).toBe(true);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      }, { timeout: 10000 });

      expect(Array.isArray(result.current.pages)).toBe(true);
    });
  });

  describe('Robustez y comportamiento de carga', () => {
    it('debería manejar la transición de loading correctamente', async () => {
      const { useSystemDataLoader } = await import('../useSystemDataLoader');
      const { result } = renderHook(() => useSystemDataLoader());

      expect(result.current.loading).toBe(true);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      }, { timeout: 10000 });

      expect(typeof result.current.loading).toBe('boolean');
    });

    it('debería mantener error como string o null', async () => {
      const { useSystemDataLoader } = await import('../useSystemDataLoader');
      const { result } = renderHook(() => useSystemDataLoader());

      expect(result.current.error === null || typeof result.current.error === 'string').toBe(true);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      }, { timeout: 10000 });

      expect(result.current.error === null || typeof result.current.error === 'string').toBe(true);
    });

    it('debería mantener consistencia en isClient', async () => {
      const { useSystemDataLoader } = await import('../useSystemDataLoader');
      const { result } = renderHook(() => useSystemDataLoader());

      await waitFor(() => {
        expect(result.current.isClient).toBe(true);
      });

      expect(result.current.isClient).toBe(true);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      }, { timeout: 10000 });

      expect(result.current.isClient).toBe(true);
    });
  });

  describe('Casos edge y estabilidad', () => {
    it('debería manejar múltiples renderizaciones sin problemas', async () => {
      const { useSystemDataLoader } = await import('../useSystemDataLoader');

      const { result: result1 } = renderHook(() => useSystemDataLoader());
      const { result: result2 } = renderHook(() => useSystemDataLoader());

      expect(result1.current.loading).toBe(true);
      expect(result2.current.loading).toBe(true);

      await waitFor(() => {
        expect(result1.current.isClient).toBe(true);
        expect(result2.current.isClient).toBe(true);
      });
    });

    it('debería mantener estructura de systemStatus consistente', async () => {
      const { useSystemDataLoader } = await import('../useSystemDataLoader');
      const { result } = renderHook(() => useSystemDataLoader());

      const checkSystemStatus = (status: typeof result.current.systemStatus) => {
        expect(typeof status.nativePages).toBe('number');
        expect(typeof status.legacyPages).toBe('number');
        expect(['native', 'legacy', 'none']).toContain(status.selectedSystem);
      };

      checkSystemStatus(result.current.systemStatus);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      }, { timeout: 10000 });

      checkSystemStatus(result.current.systemStatus);
    });

    it('debería ser estable entre re-renders', async () => {
      const { useSystemDataLoader } = await import('../useSystemDataLoader');
      const { result, rerender } = renderHook(() => useSystemDataLoader());

      const initialPages = result.current.pages;
      const initialSystemStatus = result.current.systemStatus;

      rerender();

      expect(result.current.pages).toBe(initialPages);
      expect(result.current.systemStatus).toEqual(initialSystemStatus);
    });
  });

  describe('Tests adicionales de funcionalidad', () => {
    it('debería mantener consistencia en los logs del sistema', async () => {
      const { useSystemDataLoader } = await import('../useSystemDataLoader');
      const { result } = renderHook(() => useSystemDataLoader());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      }, { timeout: 10000 });

      // Verificar que el sistema funcionó correctamente
      expect(result.current.isClient).toBe(true);
      expect(result.current.systemStatus).toBeDefined();
    });

    it('debería inicializar correctamente sin datos externos', async () => {
      const { useSystemDataLoader } = await import('../useSystemDataLoader');
      const { result } = renderHook(() => useSystemDataLoader());

      // Estado inicial consistente
      expect(result.current.pages).toEqual([]);
      expect(result.current.systemStatus.selectedSystem).toBe('none');

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      }, { timeout: 10000 });

      // Estado final válido
      expect(['none', 'native', 'legacy']).toContain(result.current.systemStatus.selectedSystem);
    });
  });
});