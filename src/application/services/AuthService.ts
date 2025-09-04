import { IAuthService, UserProfile, OAuthResult } from '@/application/interfaces/IAuthService';
import { ISupabaseClient } from '@/infrastructure/database/interfaces/ISupabaseClient';
import { IUserTokenService } from '@/infrastructure/config/interfaces/IUserTokenService';
import { ILogger } from '@/application/interfaces/ILogger';
import type { Provider, User, Session, AuthResponse } from '@supabase/supabase-js';

export class AuthService implements IAuthService {
  constructor(
    private readonly supabaseClient: ISupabaseClient,
    private readonly userTokenService: IUserTokenService,
    private readonly logger: ILogger
  ) { }

  async signInWithGoogle(): Promise<OAuthResult> {
    try {
      this.logger.info('Iniciando autenticación con Google...');

      const { data, error } = await this.supabaseClient.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${typeof window !== 'undefined' ? window.location.origin : ''}/auth/callback`
        }
      });

      if (error) {
        this.logger.error('Error en autenticación con Google', error);
        throw error;
      }

      this.logger.info('Autenticación con Google iniciada exitosamente');
      return { data, error: error || null };
    } catch (error) {
      this.logger.error('Error crítico en autenticación con Google', error as Error);
      throw error;
    }
  }

  async signInWithProvider(provider: Provider, redirectTo?: string): Promise<OAuthResult> {
    try {
      this.logger.info(`Iniciando autenticación con ${provider}...`);

      const { data, error } = await this.supabaseClient.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: redirectTo || `${typeof window !== 'undefined' ? window.location.origin : ''}/auth/callback`
        }
      });

      if (error) {
        this.logger.error(`Error en autenticación con ${provider}`, error);
        throw error;
      }

      this.logger.info(`Autenticación con ${provider} iniciada exitosamente`);
      return { data, error: error || null };
    } catch (error) {
      this.logger.error('Error crítico en autenticación OAuth', error as Error);
      throw error;
    }
  }

  async signInAnonymously(): Promise<AuthResponse> {
    try {
      this.logger.info('Iniciando autenticación anónima...');

      const { data, error } = await this.supabaseClient.auth.signInAnonymously();

      if (error) {
        this.logger.error('Error en autenticación anónima', error);
        throw error;
      }

      this.logger.info('Autenticación anónima exitosa', { userId: data.user?.id });
      return { data, error: error || null };
    } catch (error) {
      this.logger.error('Error crítico en autenticación anónima', error as Error);
      throw error;
    }
  }

  async getCurrentUser(): Promise<User | null> {
    try {
      const { data: { user }, error } = await this.supabaseClient.auth.getUser();

      if (error) {
        this.logger.error('Error obteniendo usuario actual', error);
        return null;
      }

      return user;
    } catch (error) {
      this.logger.error('Error crítico obteniendo usuario actual', error as Error);
      return null;
    }
  }

  async getUserProfile(): Promise<UserProfile | null> {
    try {
      const user = await this.getCurrentUser();
      if (!user) return null;

      const profile: UserProfile = {
        id: user.id,
        email: user.email,
        name: user.user_metadata?.name || user.user_metadata?.full_name || user.email?.split('@')[0],
        avatar: user.user_metadata?.avatar_url || user.user_metadata?.picture,
        provider: user.app_metadata?.provider || 'google',
        lastSignIn: user.last_sign_in_at,
        createdAt: user.created_at
      };

      return profile;
    } catch (error) {
      this.logger.error('Error obteniendo perfil de usuario', error as Error);
      return null;
    }
  }

  async getSession(): Promise<Session | null> {
    try {
      const { data: { session }, error } = await this.supabaseClient.auth.getSession();

      if (error) {
        this.logger.error('Error obteniendo sesión', error);
        return null;
      }

      return session;
    } catch (error) {
      this.logger.error('Error crítico obteniendo sesión', error as Error);
      return null;
    }
  }

  async signOut(): Promise<void> {
    try {
      this.logger.info('Cerrando sesión...');

      const { error } = await this.supabaseClient.auth.signOut();

      if (error) {
        this.logger.error('Error cerrando sesión', error);
        throw error;
      }

      this.logger.info('Sesión cerrada exitosamente');
    } catch (error) {
      this.logger.error('Error crítico cerrando sesión', error as Error);
      throw error;
    }
  }

  async isAuthenticated(): Promise<boolean> {
    const user = await this.getCurrentUser();
    return user !== null;
  }

  async isAuthenticatedWithProvider(provider: string): Promise<boolean> {
    const user = await this.getCurrentUser();
    if (!user) return false;

    return user.app_metadata?.provider === provider;
  }

  async hasTokensForProvider(
    provider: 'notion' | 'slack' | 'github' | 'drive' | 'calendar',
    userId?: string
  ): Promise<boolean> {
    try {
      let userIdToUse = userId;

      if (!userIdToUse) {
        const user = await this.getCurrentUser();
        if (!user) return false;
        userIdToUse = user.id;
      }

      return await this.userTokenService.hasTokensForProvider(userIdToUse, provider);
    } catch (error) {
      this.logger.error('Error verificando tokens de proveedor', error as Error);
      return false;
    }
  }

  async getIntegrationToken(
    provider: 'notion' | 'slack' | 'github' | 'drive' | 'calendar',
    tokenName?: string,
    userId?: string
  ): Promise<string | null> {
    try {
      let userIdToUse = userId;

      if (!userIdToUse) {
        const user = await this.getCurrentUser();
        if (!user) return null;
        userIdToUse = user.id;
      }

      return await this.userTokenService.getDecryptedToken(userIdToUse, provider, tokenName);
    } catch (error) {
      this.logger.error('Error obteniendo token de integración', error as Error);
      return null;
    }
  }
}
