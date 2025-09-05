import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { UserTokenServiceAdapter } from '../UserTokenServiceAdapter';
import { UserTokenService } from '@/services/UserTokenService';
import { createTestSetup } from '@/mocks';

// Mock del UserTokenService
vi.mock('@/services/UserTokenService', () => ({
  UserTokenService: vi.fn(() => ({
    hasTokensForProvider: vi.fn(),
    getDecryptedToken: vi.fn()
  }))
}));

describe('UserTokenServiceAdapter', () => {
  let adapter: UserTokenServiceAdapter;
  let mockUserTokenService: UserTokenService;
  const { teardown } = createTestSetup();

  beforeEach(() => {
    vi.clearAllMocks();
    adapter = new UserTokenServiceAdapter();
    mockUserTokenService = (adapter as any).userTokenService;
  });

  afterEach(() => {
    teardown();
  });

  describe('Constructor', () => {
    it('should create adapter with default clientSide=false', () => {
      const newAdapter = new UserTokenServiceAdapter();
      
      expect(UserTokenService).toHaveBeenCalledWith(false);
      expect(newAdapter).toBeInstanceOf(UserTokenServiceAdapter);
    });

    it('should create adapter with clientSide=true when specified', () => {
      const newAdapter = new UserTokenServiceAdapter(true);
      
      expect(UserTokenService).toHaveBeenCalledWith(true);
      expect(newAdapter).toBeInstanceOf(UserTokenServiceAdapter);
    });

    it('should create adapter with clientSide=false when explicitly specified', () => {
      const newAdapter = new UserTokenServiceAdapter(false);
      
      expect(UserTokenService).toHaveBeenCalledWith(false);
      expect(newAdapter).toBeInstanceOf(UserTokenServiceAdapter);
    });
  });

  describe('hasTokensForProvider', () => {
    const userId = 'test-user-123';
    
    it('should return true when user has tokens for notion provider', async () => {
      vi.mocked(mockUserTokenService.hasTokensForProvider).mockResolvedValue(true);

      const result = await adapter.hasTokensForProvider(userId, 'notion');

      expect(result).toBe(true);
      expect(mockUserTokenService.hasTokensForProvider).toHaveBeenCalledWith(userId, 'notion');
    });

    it('should return false when user has no tokens for slack provider', async () => {
      vi.mocked(mockUserTokenService.hasTokensForProvider).mockResolvedValue(false);

      const result = await adapter.hasTokensForProvider(userId, 'slack');

      expect(result).toBe(false);
      expect(mockUserTokenService.hasTokensForProvider).toHaveBeenCalledWith(userId, 'slack');
    });

    it('should work with all supported providers', async () => {
      const providers: Array<'notion' | 'slack' | 'github' | 'drive' | 'calendar'> = [
        'notion', 'slack', 'github', 'drive', 'calendar'
      ];

      vi.mocked(mockUserTokenService.hasTokensForProvider).mockResolvedValue(true);

      for (const provider of providers) {
        const result = await adapter.hasTokensForProvider(userId, provider);
        
        expect(result).toBe(true);
        expect(mockUserTokenService.hasTokensForProvider).toHaveBeenCalledWith(userId, provider);
      }

      expect(mockUserTokenService.hasTokensForProvider).toHaveBeenCalledTimes(providers.length);
    });

    it('should handle errors from underlying service', async () => {
      const error = new Error('Database connection failed');
      vi.mocked(mockUserTokenService.hasTokensForProvider).mockRejectedValue(error);

      await expect(adapter.hasTokensForProvider(userId, 'notion')).rejects.toThrow('Database connection failed');
      
      expect(mockUserTokenService.hasTokensForProvider).toHaveBeenCalledWith(userId, 'notion');
    });

    it('should handle different user IDs correctly', async () => {
      const userIds = ['user-1', 'user-2', 'user-3'];
      vi.mocked(mockUserTokenService.hasTokensForProvider).mockResolvedValue(true);

      for (const id of userIds) {
        await adapter.hasTokensForProvider(id, 'notion');
        expect(mockUserTokenService.hasTokensForProvider).toHaveBeenCalledWith(id, 'notion');
      }

      expect(mockUserTokenService.hasTokensForProvider).toHaveBeenCalledTimes(userIds.length);
    });
  });

  describe('getDecryptedToken', () => {
    const userId = 'test-user-123';
    
    it('should return decrypted token when available', async () => {
      const expectedToken = 'secret_decrypted_token_123';
      vi.mocked(mockUserTokenService.getDecryptedToken).mockResolvedValue(expectedToken);

      const result = await adapter.getDecryptedToken(userId, 'notion');

      expect(result).toBe(expectedToken);
      expect(mockUserTokenService.getDecryptedToken).toHaveBeenCalledWith(userId, 'notion', undefined);
    });

    it('should return null when no token available', async () => {
      vi.mocked(mockUserTokenService.getDecryptedToken).mockResolvedValue(null);

      const result = await adapter.getDecryptedToken(userId, 'slack');

      expect(result).toBeNull();
      expect(mockUserTokenService.getDecryptedToken).toHaveBeenCalledWith(userId, 'slack', undefined);
    });

    it('should pass tokenName parameter correctly', async () => {
      const tokenName = 'api_key';
      const expectedToken = 'named_token_value';
      vi.mocked(mockUserTokenService.getDecryptedToken).mockResolvedValue(expectedToken);

      const result = await adapter.getDecryptedToken(userId, 'github', tokenName);

      expect(result).toBe(expectedToken);
      expect(mockUserTokenService.getDecryptedToken).toHaveBeenCalledWith(userId, 'github', tokenName);
    });

    it('should work with all supported providers', async () => {
      const providers: Array<'notion' | 'slack' | 'github' | 'drive' | 'calendar'> = [
        'notion', 'slack', 'github', 'drive', 'calendar'
      ];
      const expectedToken = 'provider_token';

      vi.mocked(mockUserTokenService.getDecryptedToken).mockResolvedValue(expectedToken);

      for (const provider of providers) {
        const result = await adapter.getDecryptedToken(userId, provider);
        
        expect(result).toBe(expectedToken);
        expect(mockUserTokenService.getDecryptedToken).toHaveBeenCalledWith(userId, provider, undefined);
      }

      expect(mockUserTokenService.getDecryptedToken).toHaveBeenCalledTimes(providers.length);
    });

    it('should handle errors from underlying service', async () => {
      const error = new Error('Decryption failed');
      vi.mocked(mockUserTokenService.getDecryptedToken).mockRejectedValue(error);

      await expect(adapter.getDecryptedToken(userId, 'notion')).rejects.toThrow('Decryption failed');
      
      expect(mockUserTokenService.getDecryptedToken).toHaveBeenCalledWith(userId, 'notion', undefined);
    });

    it('should handle undefined tokenName parameter', async () => {
      const expectedToken = 'default_token';
      vi.mocked(mockUserTokenService.getDecryptedToken).mockResolvedValue(expectedToken);

      const result = await adapter.getDecryptedToken(userId, 'drive', undefined);

      expect(result).toBe(expectedToken);
      expect(mockUserTokenService.getDecryptedToken).toHaveBeenCalledWith(userId, 'drive', undefined);
    });

    it('should handle empty string tokenName parameter', async () => {
      const expectedToken = 'empty_name_token';
      vi.mocked(mockUserTokenService.getDecryptedToken).mockResolvedValue(expectedToken);

      const result = await adapter.getDecryptedToken(userId, 'calendar', '');

      expect(result).toBe(expectedToken);
      expect(mockUserTokenService.getDecryptedToken).toHaveBeenCalledWith(userId, 'calendar', '');
    });
  });

  describe('Integration tests', () => {
    it('should properly delegate all calls to underlying service', async () => {
      const userId = 'integration-user';
      
      // Test hasTokensForProvider
      vi.mocked(mockUserTokenService.hasTokensForProvider).mockResolvedValue(true);
      await adapter.hasTokensForProvider(userId, 'notion');
      
      // Test getDecryptedToken without tokenName
      vi.mocked(mockUserTokenService.getDecryptedToken).mockResolvedValue('token1');
      await adapter.getDecryptedToken(userId, 'notion');
      
      // Test getDecryptedToken with tokenName
      vi.mocked(mockUserTokenService.getDecryptedToken).mockResolvedValue('token2');
      await adapter.getDecryptedToken(userId, 'notion', 'special_token');

      expect(mockUserTokenService.hasTokensForProvider).toHaveBeenCalledWith(userId, 'notion');
      expect(mockUserTokenService.getDecryptedToken).toHaveBeenCalledWith(userId, 'notion', undefined);
      expect(mockUserTokenService.getDecryptedToken).toHaveBeenCalledWith(userId, 'notion', 'special_token');
    });

    it('should maintain independence between different adapter instances', async () => {
      const adapter1 = new UserTokenServiceAdapter(true);
      const adapter2 = new UserTokenServiceAdapter(false);

      expect(UserTokenService).toHaveBeenCalledWith(true);
      expect(UserTokenService).toHaveBeenCalledWith(false);
      
      // Each adapter should have its own service instance
      expect(adapter1).not.toBe(adapter2);
    });
  });

  describe('Error handling and edge cases', () => {
    it('should propagate specific error types correctly', async () => {
      const authError = new Error('Authentication failed');
      authError.name = 'AuthError';
      
      vi.mocked(mockUserTokenService.hasTokensForProvider).mockRejectedValue(authError);

      await expect(adapter.hasTokensForProvider('user', 'notion')).rejects.toThrow('Authentication failed');
    });

    it('should handle network timeout errors', async () => {
      const timeoutError = new Error('Request timeout');
      timeoutError.name = 'TimeoutError';
      
      vi.mocked(mockUserTokenService.getDecryptedToken).mockRejectedValue(timeoutError);

      await expect(adapter.getDecryptedToken('user', 'slack')).rejects.toThrow('Request timeout');
    });

    it('should handle async errors correctly', async () => {
      vi.mocked(mockUserTokenService.hasTokensForProvider).mockImplementation(async () => {
        throw new Error('Async error');
      });

      await expect(adapter.hasTokensForProvider('user', 'github')).rejects.toThrow('Async error');
    });
  });
});
