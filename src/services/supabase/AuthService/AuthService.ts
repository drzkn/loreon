import { supabase } from "@/adapters/output/infrastructure/supabase";
import type { Provider } from '@supabase/supabase-js';
import { UserTokenService } from '@/services/UserTokenService';

/**
 * @deprecated Use @/application/services/AuthService instead
 * This class will be removed in the next major version
 */
export class AuthService {
  private userTokenService = new UserTokenService(false); // Cliente por defecto

  async signInWithGoogle(): Promise<unknown> {
    try {
      console.warn('⚠️ [DEPRECATED] AuthService is deprecated. Please use @/application/services/AuthService');
      console.log('🔐 [AUTH] Iniciando autenticación con Google...');

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      });

      if (error) {
        console.error('❌ Error en autenticación con Google:', error.message);
        throw error;
      }

      console.log('✅ Autenticación con Google iniciada');
      return data;
    } catch (error) {
      console.error('💥 Error crítico en autenticación con Google:', error);
      throw error;
    }
  }

  async hasTokensForProvider(provider: 'notion' | 'slack' | 'github' | 'drive' | 'calendar', userId?: string): Promise<boolean> {
    try {
      let userIdToUse = userId;

      if (!userIdToUse) {
        const user = await this.getCurrentUser();
        if (!user) return false;
        userIdToUse = user.id;
      }

      return await this.userTokenService.hasTokensForProvider(userIdToUse, provider);
    } catch (error) {
      console.error('💥 Error verificando tokens de proveedor:', error);
      return false;
    }
  }

  async getIntegrationToken(provider: 'notion' | 'slack' | 'github' | 'drive' | 'calendar', tokenName?: string, userId?: string): Promise<string | null> {
    try {
      let userIdToUse = userId;

      if (!userIdToUse) {
        const user = await this.getCurrentUser();
        if (!user) return null;
        userIdToUse = user.id;
      }

      return await this.userTokenService.getDecryptedToken(userIdToUse, provider, tokenName);
    } catch (error) {
      console.error('💥 Error obteniendo token de integración:', error);
      return null;
    }
  }

  async signInWithProvider(provider: Provider, redirectTo?: string) {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: redirectTo || `${window.location.origin}/auth/callback`
        }
      });

      if (error) {
        console.error(`❌ Error en autenticación con ${provider}:`, error.message);
        throw error;
      }

      console.log(`✅ Iniciando autenticación con ${provider}...`);
      return data;
    } catch (error) {
      console.error('💥 Error crítico en autenticación OAuth:', error);
      throw error;
    }
  }

  async signInAnonymously() {
    try {
      const { data, error } = await supabase.auth.signInAnonymously();

      if (error) {
        console.error('❌ Error en autenticación anónima:', error.message);
        throw error;
      }

      console.log('✅ Autenticación anónima exitosa:', data.user?.id);
      return data;
    } catch (error) {
      console.error('💥 Error crítico en autenticación:', error);
      throw error;
    }
  }

  async getCurrentUser() {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();

      if (error) {
        console.error('❌ Error obteniendo usuario:', error.message);
        return null;
      }

      return user;
    } catch (error) {
      console.error('💥 Error crítico obteniendo usuario:', error);
      return null;
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

  async getUserProfile() {
    try {
      const user = await this.getCurrentUser();
      if (!user) return null;

      return {
        id: user.id,
        email: user.email,
        name: user.user_metadata?.name || user.user_metadata?.full_name || user.email?.split('@')[0],
        avatar: user.user_metadata?.avatar_url || user.user_metadata?.picture,
        provider: user.app_metadata?.provider || 'google',
        lastSignIn: user.last_sign_in_at,
        createdAt: user.created_at
      };
    } catch (error) {
      console.error('💥 Error obteniendo perfil de usuario:', error);
      return null;
    }
  }

  async signOut() {
    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error('❌ Error cerrando sesión:', error.message);
        throw error;
      }

      console.log('✅ Sesión cerrada exitosamente');
    } catch (error) {
      console.error('💥 Error crítico cerrando sesión:', error);
      throw error;
    }
  }

  async getSession() {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) {
        console.error('❌ Error obteniendo sesión:', error.message);
        return null;
      }

      return session;
    } catch (error) {
      console.error('💥 Error crítico obteniendo sesión:', error);
      return null;
    }
  }
} 