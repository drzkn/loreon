import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { UserTokenService } from '../UserTokenService';
import type { CreateUserTokenInput, UpdateUserTokenInput } from '@/types/UserToken';

vi.mock('@/adapters/output/infrastructure/supabase', () => {
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

  mockChain.from.mockReturnValue(mockChain);
  mockChain.select.mockReturnValue(mockChain);
  mockChain.insert.mockReturnValue(mockChain);
  mockChain.update.mockReturnValue(mockChain);
  mockChain.eq.mockReturnValue(mockChain);
  mockChain.order.mockReturnValue(mockChain);
  mockChain.limit.mockReturnValue(mockChain);
  mockChain.nullsFirst.mockReturnValue(mockChain);
  mockChain.single.mockResolvedValue({ data: null, error: null });

  return {
    supabase: mockChain,
    supabaseServer: mockChain
  };
});

describe('UserTokenService', () => {
  let service: UserTokenService;
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new UserTokenService();
    consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
  });

  afterEach(() => {
    consoleSpy.mockRestore();
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
      const encrypted = (service as any).encryptToken(originalToken);
      const decrypted = service.decryptToken(encrypted);

      expect(decrypted).toBe(originalToken);
      expect(encrypted).toBe(Buffer.from(originalToken).toString('base64'));
    });

    it('maneja errores de desencriptación', () => {
      // Mock Buffer.from para que lance un error
      const originalBufferFrom = Buffer.from;
      (Buffer as any).from = vi.fn().mockImplementation(() => {
        throw new Error('Invalid base64');
      });

      expect(() => {
        service.decryptToken('invalid_token');
      }).toThrow('Token corrupto o formato inválido');

      expect(consoleSpy).toHaveBeenCalledWith(
        '❌ [USER_TOKENS] Error desencriptando token:',
        expect.any(Error)
      );

      // Restaurar Buffer.from
      Buffer.from = originalBufferFrom;
    });
  });

  describe('createToken - branch metadata', () => {
    it('usa metadata cuando se proporciona', async () => {
      const { supabase } = await import('@/adapters/output/infrastructure/supabase');
      const mockSupabase = supabase as any;
      vi.mocked(mockSupabase.single).mockResolvedValue({ data: { id: '123' }, error: null });

      const tokenData: CreateUserTokenInput = {
        provider: 'notion',
        token_name: 'Test Token',
        token: 'secret_123',
        metadata: { test: true }
      };

      await service.createToken('user-123', tokenData);

      expect(vi.mocked(mockSupabase.insert)).toHaveBeenCalledWith(
        expect.objectContaining({
          token_metadata: { test: true }
        })
      );
    });

    it('usa objeto vacío cuando metadata es undefined', async () => {
      const { supabase } = await import('@/adapters/output/infrastructure/supabase');
      const mockSupabase = supabase as any;
      vi.mocked(mockSupabase.single).mockResolvedValue({ data: { id: '123' }, error: null });

      const tokenData: CreateUserTokenInput = {
        provider: 'notion',
        token_name: 'Test Token',
        token: 'secret_123'
      };

      await service.createToken('user-123', tokenData);

      expect(vi.mocked(mockSupabase.insert)).toHaveBeenCalledWith(
        expect.objectContaining({
          token_metadata: {}
        })
      );
    });
  });

  describe('updateToken - branches condicionales', () => {
    it('actualiza is_active=true', async () => {
      const { supabase } = await import('@/adapters/output/infrastructure/supabase');
      const mockSupabase = supabase as any;
      vi.mocked(mockSupabase.single).mockResolvedValue({ data: { id: '123' }, error: null });

      const updates: UpdateUserTokenInput = { is_active: true };

      await service.updateToken('user-123', 'token-123', updates);

      expect(vi.mocked(mockSupabase.update)).toHaveBeenCalledWith(
        expect.objectContaining({
          is_active: true
        })
      );
    });

    it('actualiza is_active=false', async () => {
      const { supabase } = await import('@/adapters/output/infrastructure/supabase');
      const mockSupabase = supabase as any;
      vi.mocked(mockSupabase.single).mockResolvedValue({ data: { id: '123' }, error: null });

      const updates: UpdateUserTokenInput = { is_active: false };

      await service.updateToken('user-123', 'token-123', updates);

      expect(vi.mocked(mockSupabase.update)).toHaveBeenCalledWith(
        expect.objectContaining({
          is_active: false
        })
      );
    });

    it('encripta token cuando se proporciona', async () => {
      const { supabase } = await import('@/adapters/output/infrastructure/supabase');
      const mockSupabase = supabase as any;
      vi.mocked(mockSupabase.single).mockResolvedValue({ data: { id: '123' }, error: null });

      const updates: UpdateUserTokenInput = { token: 'new_secret' };

      await service.updateToken('user-123', 'token-123', updates);

      expect(vi.mocked(mockSupabase.update)).toHaveBeenCalledWith(
        expect.objectContaining({
          encrypted_token: expect.any(String)
        })
      );
    });
  });

  describe('getTokenById - branch error PGRST116', () => {
    it('retorna null para error PGRST116', async () => {
      const { supabase } = await import('@/adapters/output/infrastructure/supabase');
      const mockSupabase = supabase as any;
      vi.mocked(mockSupabase.single).mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' }
      });

      const result = await service.getTokenById('token-404');
      expect(result).toBeNull();
    });

    it('lanza error para otros códigos', async () => {
      const { supabase } = await import('@/adapters/output/infrastructure/supabase');
      const mockSupabase = supabase as any;
      vi.mocked(mockSupabase.single).mockResolvedValue({
        data: null,
        error: { code: 'OTHER_ERROR', message: 'Error' }
      });

      await expect(service.getTokenById('token-123')).rejects.toThrow();
      expect(consoleSpy).toHaveBeenCalledWith(
        '❌ [USER_TOKENS] Error obteniendo token por ID:',
        expect.objectContaining({ code: 'OTHER_ERROR' })
      );
    });
  });

  describe('getUserTokens - branch data null', () => {
    it('retorna array vacío cuando data es null', async () => {
      const { supabase } = await import('@/adapters/output/infrastructure/supabase');
      const mockSupabase = supabase as any;
      vi.mocked(mockSupabase.single).mockResolvedValue({
        data: null,
        error: null
      });

      const tokens = await service.getUserTokens('user-123');
      expect(tokens).toEqual([]);
    });
  });

  describe('hasTokensForProvider - branches de count', () => {
    it('retorna false cuando count es 0', async () => {
      const { supabase } = await import('@/adapters/output/infrastructure/supabase');
      const mockSupabase = supabase as any;
      vi.mocked(mockSupabase.eq).mockResolvedValue({
        count: 0,
        error: null
      });

      const result = await service.hasTokensForProvider('user-123', 'notion');
      expect(result).toBe(false);
    });

    it('retorna false cuando count es null', async () => {
      const { supabase } = await import('@/adapters/output/infrastructure/supabase');
      const mockSupabase = supabase as any;
      vi.mocked(mockSupabase.eq).mockResolvedValue({
        count: null,
        error: null
      });

      const result = await service.hasTokensForProvider('user-123', 'notion');
      expect(result).toBe(false);
    });
  });
});