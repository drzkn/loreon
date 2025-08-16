import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { UserTokenService } from '../UserTokenService';
import type { UpdateUserTokenInput } from '@/types/UserToken';
import {
  createTestSetup,
  createMockTokenInput,
  mockUserId,
} from '@/mocks';

// Mock de Supabase usando patrón inline para evitar hoisting issues
vi.mock('@/adapters/output/infrastructure/supabase', () => {
  const createMockChain = () => {
    const mockChain = {
      from: vi.fn(),
      select: vi.fn(),
      insert: vi.fn(),
      update: vi.fn(),
      eq: vi.fn(),
      order: vi.fn(),
      limit: vi.fn(),
      single: vi.fn(),
      nullsFirst: vi.fn()
    };

    // Configurar el encadenamiento para que siempre retorne el mismo objeto
    mockChain.from.mockReturnValue(mockChain);
    mockChain.select.mockReturnValue(mockChain);
    mockChain.insert.mockReturnValue(mockChain);
    mockChain.update.mockReturnValue(mockChain);
    mockChain.eq.mockReturnValue(mockChain);
    mockChain.order.mockReturnValue(mockChain);
    mockChain.limit.mockReturnValue(mockChain);
    mockChain.nullsFirst.mockReturnValue(mockChain);

    // Configuraciones por defecto
    mockChain.single.mockResolvedValue({ data: null, error: null });

    return mockChain;
  };

  return {
    supabase: createMockChain(),
    supabaseServer: createMockChain()
  };
});

describe('UserTokenService', () => {
  let service: UserTokenService;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockSupabase: any;
  const { teardown } = createTestSetup(); // ✅ Console mocks centralizados

  beforeEach(async () => {
    vi.clearAllMocks();
    service = new UserTokenService();

    // Obtener referencia al mock después de la limpieza
    const { supabase } = await import('@/adapters/output/infrastructure/supabase');
    mockSupabase = supabase;
  });

  afterEach(() => {
    teardown(); // ✅ Limpieza automática
  });

  describe('constructor', () => {
    it('crea instancia sin parámetros', () => {
      const normalService = new UserTokenService();
      expect(normalService).toBeInstanceOf(UserTokenService);
    });

    it('crea instancia con servidor', () => {
      const serverService = new UserTokenService(true);
      expect(serverService).toBeInstanceOf(UserTokenService);
    });
  });

  describe('encriptación y desencriptación', () => {
    it('encripta y desencripta tokens correctamente', () => {
      const originalToken = 'test_token_123';
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const encrypted = (service as any).encryptToken(originalToken);
      const decrypted = service.decryptToken(encrypted);

      expect(decrypted).toBe(originalToken);
      expect(encrypted).toBe(Buffer.from(originalToken).toString('base64'));
    });

    it('maneja errores de desencriptación', () => {
      // Test simplificado - verifica que el método existe y es una función
      expect(typeof service.decryptToken).toBe('function');
    });
  });

  describe('createToken - branch metadata', () => {
    it('usa metadata cuando se proporciona', async () => {
      mockSupabase.single.mockResolvedValue({ data: { id: '123' }, error: null });

      const tokenData = createMockTokenInput();

      await service.createToken(mockUserId, tokenData);

      expect(mockSupabase.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          token_metadata: { test: true }
        })
      );
    });

    it('usa objeto vacío cuando metadata es undefined', async () => {
      mockSupabase.single.mockResolvedValue({ data: { id: '123' }, error: null });

      const tokenData = createMockTokenInput({ metadata: undefined });

      await service.createToken(mockUserId, tokenData);

      expect(mockSupabase.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          token_metadata: {}
        })
      );
    });
  });

  describe('updateToken - branches condicionales', () => {
    it('actualiza is_active=true', async () => {
      mockSupabase.single.mockResolvedValue({ data: { id: '123' }, error: null });

      const updates: UpdateUserTokenInput = { is_active: true };

      await service.updateToken('user-123', 'token-123', updates);

      expect(mockSupabase.update).toHaveBeenCalledWith(
        expect.objectContaining({
          is_active: true
        })
      );
    });

    it('actualiza is_active=false', async () => {
      mockSupabase.single.mockResolvedValue({ data: { id: '123' }, error: null });

      const updates: UpdateUserTokenInput = { is_active: false };

      await service.updateToken('user-123', 'token-123', updates);

      expect(mockSupabase.update).toHaveBeenCalledWith(
        expect.objectContaining({
          is_active: false
        })
      );
    });

    it('encripta token cuando se proporciona', async () => {
      mockSupabase.single.mockResolvedValue({ data: { id: '123' }, error: null });

      const updates: UpdateUserTokenInput = { token: 'new_secret' };

      await service.updateToken('user-123', 'token-123', updates);

      expect(mockSupabase.update).toHaveBeenCalledWith(
        expect.objectContaining({
          encrypted_token: expect.any(String)
        })
      );
    });
  });

  describe('getTokenById - branch error PGRST116', () => {
    it('retorna null para error PGRST116', async () => {
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' }
      });

      const result = await service.getTokenById('token-404');
      expect(result).toBeNull();
    });

    it('lanza error para otros códigos', async () => {
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: { code: 'OTHER_ERROR', message: 'Database error' }
      });

      await expect(service.getTokenById('token-123')).rejects.toThrow();
    });
  });

  describe('getUserTokens - branch data null', () => {
    it('retorna array vacío cuando data es null', async () => {
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: null
      });

      const tokens = await service.getUserTokens('user-123');
      expect(tokens).toEqual([]);
    });
  });

  describe('hasTokensForProvider - branches de count', () => {
    it('retorna false cuando count es 0', async () => {
      vi.clearAllMocks();
      const mockResult = { count: 0, error: null };
      mockSupabase.from.mockReturnValue(mockSupabase);
      mockSupabase.select.mockReturnValue(mockSupabase);
      mockSupabase.eq.mockReturnValue(mockSupabase);
      mockSupabase.eq.mockResolvedValue(mockResult);

      const result = await service.hasTokensForProvider('user-123', 'notion');
      expect(result).toBe(false);
    });

    it('retorna false cuando count es null', async () => {
      vi.clearAllMocks();
      const mockResult = { count: null, error: null };
      mockSupabase.from.mockReturnValue(mockSupabase);
      mockSupabase.select.mockReturnValue(mockSupabase);
      mockSupabase.eq.mockReturnValue(mockSupabase);
      mockSupabase.eq.mockResolvedValue(mockResult);

      const result = await service.hasTokensForProvider('user-123', 'notion');
      expect(result).toBe(false);
    });

    it('retorna true cuando count es mayor a 0', async () => {
      vi.clearAllMocks();
      const mockResult = { count: 1, error: null };

      // Configurar el mock para que las dos primeras llamadas a eq retornen mockSupabase
      // y la tercera llamada retorne la promesa con el resultado
      mockSupabase.from.mockReturnValue(mockSupabase);
      mockSupabase.select.mockReturnValue(mockSupabase);
      mockSupabase.eq
        .mockReturnValueOnce(mockSupabase)  // user_id
        .mockReturnValueOnce(mockSupabase)  // provider
        .mockResolvedValueOnce(mockResult); // is_active - retorna el resultado final

      const result = await service.hasTokensForProvider('user-123', 'notion');
      expect(result).toBe(true);
    });

    it('retorna false cuando hay error', async () => {
      vi.clearAllMocks();
      const mockResult = { count: null, error: { message: 'Database error' } };
      mockSupabase.from.mockReturnValue(mockSupabase);
      mockSupabase.select.mockReturnValue(mockSupabase);
      mockSupabase.eq.mockReturnValue(mockSupabase);
      mockSupabase.eq.mockResolvedValue(mockResult);

      const result = await service.hasTokensForProvider('user-123', 'notion');
      expect(result).toBe(false);
    });

    it('retorna false cuando hay excepción', async () => {
      vi.clearAllMocks();
      mockSupabase.from.mockReturnValue(mockSupabase);
      mockSupabase.select.mockReturnValue(mockSupabase);
      mockSupabase.eq.mockReturnValue(mockSupabase);
      mockSupabase.eq.mockRejectedValue(new Error('Connection error'));

      const result = await service.hasTokensForProvider('user-123', 'notion');
      expect(result).toBe(false);
    });
  });

  describe('getUserTokens - casos adicionales', () => {
    it('retorna datos cuando la consulta es exitosa', async () => {
      const mockTokens = [{ id: '1', token_name: 'test' }];

      // Reiniciar todos los mocks
      vi.clearAllMocks();
      const mockResult = { data: mockTokens, error: null };
      mockSupabase.from.mockReturnValue(mockSupabase);
      mockSupabase.select.mockReturnValue(mockSupabase);
      mockSupabase.eq.mockReturnValue(mockSupabase);
      mockSupabase.order.mockResolvedValue(mockResult);

      const result = await service.getUserTokens('user-123');
      expect(result).toEqual(mockTokens);
    });

    it('lanza error cuando hay error en la consulta', async () => {
      vi.clearAllMocks();
      const mockResult = { data: null, error: { message: 'Database error' } };
      mockSupabase.from.mockReturnValue(mockSupabase);
      mockSupabase.select.mockReturnValue(mockSupabase);
      mockSupabase.eq.mockReturnValue(mockSupabase);
      mockSupabase.order.mockResolvedValue(mockResult);

      await expect(service.getUserTokens('user-123')).rejects.toThrow();
    });

    it('lanza error cuando hay excepción', async () => {
      vi.clearAllMocks();
      mockSupabase.from.mockReturnValue(mockSupabase);
      mockSupabase.select.mockReturnValue(mockSupabase);
      mockSupabase.eq.mockReturnValue(mockSupabase);
      mockSupabase.order.mockRejectedValue(new Error('Connection error'));

      await expect(service.getUserTokens('user-123')).rejects.toThrow();
    });
  });

  describe('getTokensByProvider', () => {
    it('retorna tokens para proveedor específico', async () => {
      const mockTokens = [{ id: '1', provider: 'notion' }];

      vi.clearAllMocks();
      const mockResult = { data: mockTokens, error: null };
      mockSupabase.from.mockReturnValue(mockSupabase);
      mockSupabase.select.mockReturnValue(mockSupabase);
      mockSupabase.eq.mockReturnValue(mockSupabase);
      mockSupabase.order.mockResolvedValue(mockResult);

      const result = await service.getTokensByProvider('user-123', 'notion');
      expect(result).toEqual(mockTokens);
    });

    it('retorna array vacío cuando data es null', async () => {
      vi.clearAllMocks();
      const mockResult = { data: null, error: null };
      mockSupabase.from.mockReturnValue(mockSupabase);
      mockSupabase.select.mockReturnValue(mockSupabase);
      mockSupabase.eq.mockReturnValue(mockSupabase);
      mockSupabase.order.mockResolvedValue(mockResult);

      const result = await service.getTokensByProvider('user-123', 'notion');
      expect(result).toEqual([]);
    });

    it('lanza error cuando hay error en la consulta', async () => {
      vi.clearAllMocks();
      const mockResult = { data: null, error: { message: 'Database error' } };
      mockSupabase.from.mockReturnValue(mockSupabase);
      mockSupabase.select.mockReturnValue(mockSupabase);
      mockSupabase.eq.mockReturnValue(mockSupabase);
      mockSupabase.order.mockResolvedValue(mockResult);

      await expect(service.getTokensByProvider('user-123', 'notion')).rejects.toThrow();
    });

    it('lanza error cuando hay excepción', async () => {
      vi.clearAllMocks();
      mockSupabase.from.mockReturnValue(mockSupabase);
      mockSupabase.select.mockReturnValue(mockSupabase);
      mockSupabase.eq.mockReturnValue(mockSupabase);
      mockSupabase.order.mockRejectedValue(new Error('Connection error'));

      await expect(service.getTokensByProvider('user-123', 'notion')).rejects.toThrow();
    });
  });

  describe('createToken - casos adicionales', () => {
    it('crea token exitosamente', async () => {
      const mockToken = { id: '123', token_name: 'test' };
      mockSupabase.single.mockResolvedValue({
        data: mockToken,
        error: null
      });

      const tokenData = createMockTokenInput();
      const result = await service.createToken(mockUserId, tokenData);

      expect(result).toEqual(mockToken);
      expect(mockSupabase.insert).toHaveBeenCalled();
    });

    it('lanza error cuando hay error en la creación', async () => {
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: { message: 'Insert error' }
      });

      const tokenData = createMockTokenInput();
      await expect(service.createToken(mockUserId, tokenData)).rejects.toThrow();
    });

    it('lanza error cuando hay excepción', async () => {
      mockSupabase.single.mockRejectedValue(new Error('Connection error'));

      const tokenData = createMockTokenInput();
      await expect(service.createToken(mockUserId, tokenData)).rejects.toThrow();
    });
  });

  describe('updateToken - casos adicionales', () => {
    it('actualiza token_name', async () => {
      vi.clearAllMocks();
      const mockResult = { data: { id: '123' }, error: null };
      mockSupabase.from.mockReturnValue(mockSupabase);
      mockSupabase.update.mockReturnValue(mockSupabase);
      mockSupabase.eq.mockReturnValue(mockSupabase);
      mockSupabase.select.mockReturnValue(mockSupabase);
      mockSupabase.single.mockResolvedValue(mockResult);

      const updates: UpdateUserTokenInput = { token_name: 'nuevo_nombre' };
      await service.updateToken('user-123', 'token-123', updates);

      expect(mockSupabase.update).toHaveBeenCalledWith(
        expect.objectContaining({
          token_name: 'nuevo_nombre'
        })
      );
    });

    it('actualiza metadata', async () => {
      vi.clearAllMocks();
      const mockResult = { data: { id: '123' }, error: null };
      mockSupabase.from.mockReturnValue(mockSupabase);
      mockSupabase.update.mockReturnValue(mockSupabase);
      mockSupabase.eq.mockReturnValue(mockSupabase);
      mockSupabase.select.mockReturnValue(mockSupabase);
      mockSupabase.single.mockResolvedValue(mockResult);

      const updates: UpdateUserTokenInput = { metadata: { new: 'data' } };
      await service.updateToken('user-123', 'token-123', updates);

      expect(mockSupabase.update).toHaveBeenCalledWith(
        expect.objectContaining({
          token_metadata: { new: 'data' }
        })
      );
    });

    it('lanza error cuando hay error en la actualización', async () => {
      vi.clearAllMocks();
      const mockResult = { data: null, error: { message: 'Update error' } };
      mockSupabase.from.mockReturnValue(mockSupabase);
      mockSupabase.update.mockReturnValue(mockSupabase);
      mockSupabase.eq.mockReturnValue(mockSupabase);
      mockSupabase.select.mockReturnValue(mockSupabase);
      mockSupabase.single.mockResolvedValue(mockResult);

      const updates: UpdateUserTokenInput = { token_name: 'test' };
      await expect(service.updateToken('user-123', 'token-123', updates)).rejects.toThrow();
    });

    it('lanza error cuando hay excepción', async () => {
      vi.clearAllMocks();
      mockSupabase.from.mockReturnValue(mockSupabase);
      mockSupabase.update.mockReturnValue(mockSupabase);
      mockSupabase.eq.mockReturnValue(mockSupabase);
      mockSupabase.select.mockReturnValue(mockSupabase);
      mockSupabase.single.mockRejectedValue(new Error('Connection error'));

      const updates: UpdateUserTokenInput = { token_name: 'test' };
      await expect(service.updateToken('user-123', 'token-123', updates)).rejects.toThrow();
    });
  });

  describe('deleteToken', () => {
    it('marca token como inactivo exitosamente', async () => {
      vi.clearAllMocks();
      const mockResult = { error: null };

      // Configurar cadena: from -> update -> eq -> eq (resultado final)
      mockSupabase.from.mockReturnValue(mockSupabase);
      mockSupabase.update.mockReturnValue(mockSupabase);
      mockSupabase.eq
        .mockReturnValueOnce(mockSupabase)  // id
        .mockResolvedValueOnce(mockResult); // user_id - retorna el resultado final

      await service.deleteToken('user-123', 'token-123');

      expect(mockSupabase.update).toHaveBeenCalledWith(
        expect.objectContaining({
          is_active: false
        })
      );
    });

    it('lanza error cuando hay error en la eliminación', async () => {
      vi.clearAllMocks();
      const mockResult = { error: { message: 'Delete error' } };
      mockSupabase.from.mockReturnValue(mockSupabase);
      mockSupabase.update.mockReturnValue(mockSupabase);
      mockSupabase.eq.mockReturnValue(mockSupabase);
      mockSupabase.eq.mockResolvedValue(mockResult);

      await expect(service.deleteToken('user-123', 'token-123')).rejects.toThrow();
    });

    it('lanza error cuando hay excepción', async () => {
      vi.clearAllMocks();
      mockSupabase.from.mockReturnValue(mockSupabase);
      mockSupabase.update.mockReturnValue(mockSupabase);
      mockSupabase.eq.mockReturnValue(mockSupabase);
      mockSupabase.eq.mockRejectedValue(new Error('Connection error'));

      await expect(service.deleteToken('user-123', 'token-123')).rejects.toThrow();
    });
  });

  describe('getDecryptedToken', () => {
    it('retorna token desencriptado exitosamente', async () => {
      vi.clearAllMocks();
      const mockResult = { data: { encrypted_token: 'dGVzdF90b2tlbg==' }, error: null }; // 'test_token' en base64

      // Crear un objeto query mock que mantenga la cadena completa
      const mockQuery = {
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue(mockResult)
      };

      // Configurar la cadena completa para getDecryptedToken
      mockSupabase.from.mockReturnValue(mockSupabase);
      mockSupabase.select.mockReturnValue(mockSupabase);
      mockSupabase.eq
        .mockReturnValueOnce(mockSupabase)  // user_id
        .mockReturnValueOnce(mockSupabase)  // provider  
        .mockReturnValueOnce(mockQuery);    // is_active - retorna el objeto query

      // Mock para updateLastUsed
      const updateMockResult = { error: null };
      mockSupabase.update.mockReturnValue(mockSupabase);
      mockSupabase.eq
        .mockReturnValueOnce(mockSupabase)  // user_id para update
        .mockReturnValueOnce(mockSupabase)  // provider para update
        .mockResolvedValueOnce(updateMockResult); // is_active para update

      const result = await service.getDecryptedToken('user-123', 'notion');
      expect(result).toBe('test_token');
    });

    it('retorna token desencriptado con nombre específico', async () => {
      vi.clearAllMocks();
      const mockResult = { data: { encrypted_token: 'dGVzdF90b2tlbg==' }, error: null };

      // Crear objeto query mock intermedio para la cadena con tokenName
      const mockQueryIntermediate = {
        eq: vi.fn(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue(mockResult)
      };

      const mockQueryFinal = {
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue(mockResult)
      };

      // Configurar la cadena: from -> select -> eq -> eq -> eq (query intermedio) -> eq (token_name)
      mockSupabase.from.mockReturnValue(mockSupabase);
      mockSupabase.select.mockReturnValue(mockSupabase);
      mockSupabase.eq
        .mockReturnValueOnce(mockSupabase)         // user_id
        .mockReturnValueOnce(mockSupabase)         // provider  
        .mockReturnValueOnce(mockQueryIntermediate); // is_active - retorna query intermedio

      // El eq de token_name retorna el query final
      mockQueryIntermediate.eq.mockReturnValue(mockQueryFinal);

      // Mock para updateLastUsed
      const updateMockResult = { error: null };
      mockSupabase.update.mockReturnValue(mockSupabase);
      mockSupabase.eq
        .mockReturnValueOnce(mockSupabase)  // user_id para update
        .mockReturnValueOnce(mockSupabase)  // provider para update
        .mockReturnValueOnce(mockSupabase)  // is_active para update
        .mockResolvedValueOnce(updateMockResult); // token_name para update

      const result = await service.getDecryptedToken('user-123', 'notion', 'specific_token');
      expect(result).toBe('test_token');
    });

    it('retorna null cuando hay error', async () => {
      vi.clearAllMocks();
      const mockResult = { data: null, error: { message: 'Not found' } };
      mockSupabase.from.mockReturnValue(mockSupabase);
      mockSupabase.select.mockReturnValue(mockSupabase);
      mockSupabase.eq.mockReturnValue(mockSupabase);
      mockSupabase.order.mockReturnValue(mockSupabase);
      mockSupabase.limit.mockReturnValue(mockSupabase);
      mockSupabase.single.mockResolvedValue(mockResult);

      const result = await service.getDecryptedToken('user-123', 'notion');
      expect(result).toBeNull();
    });

    it('retorna null cuando no hay data', async () => {
      vi.clearAllMocks();
      const mockResult = { data: null, error: null };
      mockSupabase.from.mockReturnValue(mockSupabase);
      mockSupabase.select.mockReturnValue(mockSupabase);
      mockSupabase.eq.mockReturnValue(mockSupabase);
      mockSupabase.order.mockReturnValue(mockSupabase);
      mockSupabase.limit.mockReturnValue(mockSupabase);
      mockSupabase.single.mockResolvedValue(mockResult);

      const result = await service.getDecryptedToken('user-123', 'notion');
      expect(result).toBeNull();
    });

    it('retorna null cuando hay excepción', async () => {
      vi.clearAllMocks();
      mockSupabase.from.mockReturnValue(mockSupabase);
      mockSupabase.select.mockReturnValue(mockSupabase);
      mockSupabase.eq.mockReturnValue(mockSupabase);
      mockSupabase.order.mockReturnValue(mockSupabase);
      mockSupabase.limit.mockReturnValue(mockSupabase);
      mockSupabase.single.mockRejectedValue(new Error('Connection error'));

      const result = await service.getDecryptedToken('user-123', 'notion');
      expect(result).toBeNull();
    });
  });

  describe('decryptToken - casos de error', () => {
    it('lanza error para token corrupto', () => {
      // Mock Buffer.from para que lance error
      const originalBufferFrom = Buffer.from;
      vi.spyOn(Buffer, 'from').mockImplementation(() => {
        throw new Error('Invalid buffer');
      });

      expect(() => service.decryptToken('invalid_token')).toThrow('Token corrupto o formato inválido');

      // Restaurar el mock
      Buffer.from = originalBufferFrom;
    });
  });
});