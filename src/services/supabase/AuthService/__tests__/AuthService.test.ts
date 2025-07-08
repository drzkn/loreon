import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthService } from '../AuthService';

// Mock del módulo supabase
vi.mock('@/adapters/output/infrastructure/supabase', () => ({
  supabase: {
    auth: {
      signInAnonymously: vi.fn(),
      getUser: vi.fn(),
      signOut: vi.fn(),
      getSession: vi.fn(),
    }
  }
}));

// Importar el mock después de definirlo
import { supabase } from '@/adapters/output/infrastructure/supabase';

describe('SupabaseAuthService', () => {
  let authService: AuthService;
  let mockSupabaseAuth: {
    signInAnonymously: ReturnType<typeof vi.fn>;
    getUser: ReturnType<typeof vi.fn>;
    signOut: ReturnType<typeof vi.fn>;
    getSession: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockSupabaseAuth = supabase.auth as any;
    authService = new AuthService();
  });

  describe('Anonymous Authentication', () => {
    it('should sign in anonymously successfully', async () => {
      const mockUser = { id: 'user-123', email: null };
      const mockData = { user: mockUser, session: null };

      mockSupabaseAuth.signInAnonymously.mockResolvedValue({
        data: mockData,
        error: null
      });

      const result = await authService.signInAnonymously();

      expect(mockSupabaseAuth.signInAnonymously).toHaveBeenCalledOnce();
      expect(result).toEqual(mockData);
    });

    it('should handle sign in errors', async () => {
      const mockError = { message: 'Authentication failed' };

      mockSupabaseAuth.signInAnonymously.mockResolvedValue({
        data: null,
        error: mockError
      });

      await expect(authService.signInAnonymously()).rejects.toThrow();
      expect(mockSupabaseAuth.signInAnonymously).toHaveBeenCalledOnce();
    });

    it('should handle critical errors in sign in', async () => {
      mockSupabaseAuth.signInAnonymously.mockRejectedValue(new Error('Network error'));

      await expect(authService.signInAnonymously()).rejects.toThrow('Network error');
      expect(mockSupabaseAuth.signInAnonymously).toHaveBeenCalledOnce();
    });
  });

  describe('User Management', () => {
    it('should get current user successfully', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' };

      mockSupabaseAuth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      });

      const result = await authService.getCurrentUser();

      expect(mockSupabaseAuth.getUser).toHaveBeenCalledOnce();
      expect(result).toEqual(mockUser);
    });

    it('should return null when user not found', async () => {
      const mockError = { message: 'User not found' };

      mockSupabaseAuth.getUser.mockResolvedValue({
        data: { user: null },
        error: mockError
      });

      const result = await authService.getCurrentUser();

      expect(result).toBeNull();
      expect(mockSupabaseAuth.getUser).toHaveBeenCalledOnce();
    });

    it('should handle critical errors when getting user', async () => {
      mockSupabaseAuth.getUser.mockRejectedValue(new Error('Database error'));

      const result = await authService.getCurrentUser();

      expect(result).toBeNull();
      expect(mockSupabaseAuth.getUser).toHaveBeenCalledOnce();
    });
  });

  describe('Authentication State', () => {
    it('should return true when user is authenticated', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' };

      mockSupabaseAuth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      });

      const result = await authService.isAuthenticated();

      expect(result).toBe(true);
      expect(mockSupabaseAuth.getUser).toHaveBeenCalledOnce();
    });

    it('should return false when user is not authenticated', async () => {
      mockSupabaseAuth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Not authenticated' }
      });

      const result = await authService.isAuthenticated();

      expect(result).toBe(false);
      expect(mockSupabaseAuth.getUser).toHaveBeenCalledOnce();
    });

    it('should return false when there is an error checking authentication', async () => {
      mockSupabaseAuth.getUser.mockRejectedValue(new Error('Network error'));

      const result = await authService.isAuthenticated();

      expect(result).toBe(false);
      expect(mockSupabaseAuth.getUser).toHaveBeenCalledOnce();
    });
  });

  describe('Sign Out', () => {
    it('should sign out successfully', async () => {
      mockSupabaseAuth.signOut.mockResolvedValue({
        error: null
      });

      await expect(authService.signOut()).resolves.not.toThrow();
      expect(mockSupabaseAuth.signOut).toHaveBeenCalledOnce();
    });

    it('should handle sign out errors', async () => {
      const mockError = { message: 'Sign out failed' };

      mockSupabaseAuth.signOut.mockResolvedValue({
        error: mockError
      });

      await expect(authService.signOut()).rejects.toThrow();
      expect(mockSupabaseAuth.signOut).toHaveBeenCalledOnce();
    });

    it('should handle critical errors in sign out', async () => {
      mockSupabaseAuth.signOut.mockRejectedValue(new Error('Database error'));

      await expect(authService.signOut()).rejects.toThrow('Database error');
      expect(mockSupabaseAuth.signOut).toHaveBeenCalledOnce();
    });
  });

  describe('Session Management', () => {
    it('should get session successfully', async () => {
      const mockSession = {
        access_token: 'token-123',
        user: { id: 'user-123' },
        expires_at: 1234567890
      };

      mockSupabaseAuth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null
      });

      const result = await authService.getSession();

      expect(mockSupabaseAuth.getSession).toHaveBeenCalledOnce();
      expect(result).toEqual(mockSession);
    });

    it('should return null when session not found', async () => {
      const mockError = { message: 'Session not found' };

      mockSupabaseAuth.getSession.mockResolvedValue({
        data: { session: null },
        error: mockError
      });

      const result = await authService.getSession();

      expect(result).toBeNull();
      expect(mockSupabaseAuth.getSession).toHaveBeenCalledOnce();
    });

    it('should handle critical errors when getting session', async () => {
      mockSupabaseAuth.getSession.mockRejectedValue(new Error('Network error'));

      const result = await authService.getSession();

      expect(result).toBeNull();
      expect(mockSupabaseAuth.getSession).toHaveBeenCalledOnce();
    });
  });
});
