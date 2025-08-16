import { describe, it, expect, afterEach } from 'vitest';
import { getEnvVar } from '../getEnvVar';

// Usar el sistema centralizado de mocks
import {
  createTestSetup
} from '@/mocks';

describe('getEnvVar', () => {
  const { teardown } = createTestSetup(); // ✅ Console mocks centralizados

  afterEach(() => {
    teardown(); // ✅ Limpieza automática
  });

  describe('Funcionalidad básica', () => {
    it('debe ser una función', () => {
      expect(typeof getEnvVar).toBe('function');
    });

    it('debe retornar string o undefined', () => {
      const result = getEnvVar('TEST_VAR');
      expect(typeof result === 'string' || result === undefined).toBe(true);
    });

    it('debe manejar key vacía', () => {
      const result = getEnvVar('');
      expect(result).toBeUndefined();
    });

    it('debe manejar key inexistente', () => {
      const result = getEnvVar('NONEXISTENT_VARIABLE_12345');
      expect(result).toBeUndefined();
    });
  });

  describe('Comportamiento con variables reales', () => {
    it('debe funcionar con NODE_ENV si está definido', () => {
      // En el entorno de test, NODE_ENV puede estar definido
      const nodeEnv = getEnvVar('NODE_ENV');

      if (nodeEnv !== undefined) {
        expect(typeof nodeEnv).toBe('string');
      }
    });

    it('debe funcionar con variables de Vitest si están definidas', () => {
      // Probar con variables que podrían estar en el entorno de Vitest
      const vitestEnv = getEnvVar('VITEST');

      if (vitestEnv !== undefined) {
        expect(typeof vitestEnv).toBe('string');
      }
    });
  });

  describe('Casos edge de entrada', () => {
    it('debe manejar keys con caracteres especiales', () => {
      // Estas probablemente no existan, pero no deberían causar errores
      expect(() => getEnvVar('VAR-WITH-DASH')).not.toThrow();
      expect(() => getEnvVar('VAR_WITH_UNDERSCORE')).not.toThrow();
      expect(() => getEnvVar('VAR.WITH.DOTS')).not.toThrow();
    });

    it('debe ser case-sensitive', () => {
      // Si existe una variable, su versión en diferente case no debería existir
      const upperCase = getEnvVar('PATH');
      const lowerCase = getEnvVar('path');

      // Si PATH existe (común en sistemas Unix), 'path' no debería existir
      if (upperCase !== undefined) {
        expect(lowerCase).toBeUndefined();
      }
    });

    it('debe manejar keys muy largas', () => {
      const longKey = 'A'.repeat(1000);
      expect(() => getEnvVar(longKey)).not.toThrow();
      expect(getEnvVar(longKey)).toBeUndefined();
    });

    it('debe manejar keys con espacios', () => {
      expect(() => getEnvVar('VAR WITH SPACES')).not.toThrow();
      expect(getEnvVar('VAR WITH SPACES')).toBeUndefined();
    });
  });

  describe('Verificación de tipo de retorno', () => {
    it('debe retornar exactamente string o undefined', () => {
      const testKeys = [
        'NONEXISTENT_VAR',
        'PATH',
        'NODE_ENV',
        'HOME',
        '',
        'TEST_VAR_123'
      ];

      testKeys.forEach(key => {
        const result = getEnvVar(key);
        expect(
          result === undefined || typeof result === 'string'
        ).toBe(true);
      });
    });

    it('no debe retornar null', () => {
      const result = getEnvVar('DEFINITELY_NONEXISTENT_VAR_9999');
      expect(result).not.toBe(null);
      expect(result).toBeUndefined();
    });

    it('no debe retornar número o boolean', () => {
      // Incluso si una variable de entorno contiene "0" o "false",
      // debe retornar string, no el valor convertido
      const testKeys = ['NONEXISTENT_VAR', 'PATH', 'NODE_ENV'];

      testKeys.forEach(key => {
        const result = getEnvVar(key);
        expect(typeof result !== 'number').toBe(true);
        expect(typeof result !== 'boolean').toBe(true);
      });
    });
  });

  describe('Consistencia', () => {
    it('debe retornar el mismo valor en llamadas consecutivas', () => {
      const key = 'NODE_ENV';
      const first = getEnvVar(key);
      const second = getEnvVar(key);

      expect(first).toBe(second);
    });

    it('debe manejar múltiples llamadas sin efectos secundarios', () => {
      const keys = ['PATH', 'NODE_ENV', 'NONEXISTENT_VAR'];

      // Primera pasada
      const firstResults = keys.map(key => getEnvVar(key));

      // Segunda pasada
      const secondResults = keys.map(key => getEnvVar(key));

      // Los resultados deben ser idénticos
      expect(firstResults).toEqual(secondResults);
    });
  });

  describe('Robustez', () => {
    it('no debe lanzar errores con inputs válidos', () => {
      const testInputs = [
        'NORMAL_VAR',
        '',
        'VAR_WITH_NUMBERS_123',
        'var-with-dashes',
        'var.with.dots',
        'VERY_LONG_VARIABLE_NAME_THAT_PROBABLY_DOES_NOT_EXIST_IN_ANY_ENVIRONMENT'
      ];

      testInputs.forEach(input => {
        expect(() => getEnvVar(input)).not.toThrow();
      });
    });

    it('debe funcionar en diferentes contextos de ejecución', () => {
      // Simplemente verificar que la función es callable
      // sin importar si estamos en Node.js, browser, o otro entorno
      expect(() => {
        getEnvVar('TEST');
        getEnvVar('ANOTHER_TEST');
        getEnvVar('');
      }).not.toThrow();
    });
  });
});
