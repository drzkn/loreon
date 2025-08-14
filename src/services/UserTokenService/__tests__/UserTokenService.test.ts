import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { UserTokenService } from '../UserTokenService';
import type { UpdateUserTokenInput } from '@/types/UserToken';
import {
  createTestSetup,
  createMockTokenInput,
  mockUserId,
  createSupabaseChainMock,
  mockErrors
} from '@/mocks';

const mockSupabaseChain = createSupabaseChainMock();

vi.mock('@/adapters/output/infrastructure/supabase', () => ({
  supabase: mockSupabaseChain,
  supabaseServer: mockSupabaseChain
}));

describe('UserTokenService', () => {
  let service: UserTokenService;
  const { teardown } = createTestSetup(); // ✅ Console mocks centralizados

  beforeEach(() => {
    vi.clearAllMocks();
    service = new UserTokenService();
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
      const originalBufferFrom = Buffer.from;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (Buffer as any).from = vi.fn().mockImplementation(() => {
        throw new Error('Invalid base64');
      });

      expect(() => {
        service.decryptToken('invalid_token');
      }).toThrow('Token corrupto o formato inválido');

      Buffer.from = originalBufferFrom;
    });
  });

  describe('createToken - branch metadata', () => {
    it('usa metadata cuando se proporciona', async () => {
      mockSupabaseChain.single.mockResolvedValue({ data: { id: '123' }, error: null });

      const tokenData = createMockTokenInput();

      await service.createToken(mockUserId, tokenData);

      expect(mockSupabaseChain.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          token_metadata: { test: true }
        })
      );
    });

    it('usa objeto vacío cuando metadata es undefined', async () => {
      mockSupabaseChain.single.mockResolvedValue({ data: { id: '123' }, error: null });

      const tokenData = createMockTokenInput({ metadata: undefined });

      await service.createToken(mockUserId, tokenData);

      expect(mockSupabaseChain.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          token_metadata: {}
        })
      );
    });
  });

  describe('updateToken - branches condicionales', () => {
    it('actualiza is_active=true', async () => {
      mockSupabaseChain.single.mockResolvedValue({ data: { id: '123' }, error: null });

      const updates: UpdateUserTokenInput = { is_active: true };

      await service.updateToken('user-123', 'token-123', updates);

      expect(mockSupabaseChain.update).toHaveBeenCalledWith(
        expect.objectContaining({
          is_active: true
        })
      );
    });

    it('actualiza is_active=false', async () => {
      mockSupabaseChain.single.mockResolvedValue({ data: { id: '123' }, error: null });

      const updates: UpdateUserTokenInput = { is_active: false };

      await service.updateToken('user-123', 'token-123', updates);

      expect(mockSupabaseChain.update).toHaveBeenCalledWith(
        expect.objectContaining({
          is_active: false
        })
      );
    });

    it('encripta token cuando se proporciona', async () => {
      mockSupabaseChain.single.mockResolvedValue({ data: { id: '123' }, error: null });

      const updates: UpdateUserTokenInput = { token: 'new_secret' };

      await service.updateToken('user-123', 'token-123', updates);

      expect(mockSupabaseChain.update).toHaveBeenCalledWith(
        expect.objectContaining({
          encrypted_token: expect.any(String)
        })
      );
    });
  });

  describe('getTokenById - branch error PGRST116', () => {
    it('retorna null para error PGRST116', async () => {
      mockSupabaseChain.single.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' }
      });

      const result = await service.getTokenById('token-404');
      expect(result).toBeNull();
    });

    it('lanza error para otros códigos', async () => {
      mockSupabaseChain.single.mockResolvedValue({
        data: null,
        error: mockErrors.supabaseError
      });

      await expect(service.getTokenById('token-123')).rejects.toThrow();
    });
  });

  describe('getUserTokens - branch data null', () => {
    it('retorna array vacío cuando data es null', async () => {
      mockSupabaseChain.single.mockResolvedValue({
        data: null,
        error: null
      });

      const tokens = await service.getUserTokens('user-123');
      expect(tokens).toEqual([]);
    });
  });

  describe('hasTokensForProvider - branches de count', () => {
    it('retorna false cuando count es 0', async () => {
      mockSupabaseChain.eq.mockResolvedValue({
        count: 0,
        error: null
      });

      const result = await service.hasTokensForProvider('user-123', 'notion');
      expect(result).toBe(false);
    });

    it('retorna false cuando count es null', async () => {
      mockSupabaseChain.eq.mockResolvedValue({
        count: null,
        error: null
      });

      const result = await service.hasTokensForProvider('user-123', 'notion');
      expect(result).toBe(false);
    });
  });
});