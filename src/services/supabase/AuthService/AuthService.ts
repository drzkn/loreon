import { supabase } from "@/adapters/output/infrastructure/supabase";
import type { Provider } from '@supabase/supabase-js';
import { NotionAuthService } from '@/services/NotionAuthService';

export class AuthService {
  private notionAuthService = new NotionAuthService();

  // Verificar si el usuario ya tiene token configurado
  hasNotionToken(): boolean {
    return this.notionAuthService.hasUserToken();
  }

  // Configurar token personal del usuario
  async setupUserToken(token: string) {
    try {
      console.log('🔧 [AUTH] Configurando token personal del usuario...');

      // Validar y guardar token
      await this.notionAuthService.validateAndSaveUserToken(token);

      console.log('✅ [AUTH] Token personal configurado exitosamente');
      return true;
    } catch (error) {
      console.error('❌ [AUTH] Error configurando token personal:', error);
      throw error;
    }
  }

  // Autenticar con token personal ya configurado
  async signInWithPersonalToken() {
    try {
      console.log('🔐 [AUTH] Iniciando autenticación con token personal...');

      // Verificar conexión con Notion usando token personal
      const notionProfile = await this.notionAuthService.authenticateWithUserToken();

      if (!notionProfile) {
        throw new Error('No se pudo verificar la conexión con Notion');
      }

      // Crear/actualizar usuario en Supabase usando autenticación anónima
      const { data, error } = await supabase.auth.signInAnonymously({
        options: {
          data: {
            notion_user_id: notionProfile.id,
            notion_user_name: notionProfile.name,
            notion_user_email: notionProfile.email,
            notion_avatar: notionProfile.avatar,
            auth_provider: 'notion_personal',
            authenticated_at: new Date().toISOString()
          }
        }
      });

      if (error) {
        console.error('❌ Error creando sesión en Supabase:', error.message);
        throw error;
      }

      console.log('✅ Autenticación con token personal exitosa:', notionProfile.name);
      return { data, notionProfile };
    } catch (error) {
      console.error('💥 Error en autenticación con token personal:', error);
      throw error;
    }
  }

  // Método combinado: configurar token y autenticar en un paso
  async signInWithNotionToken(token: string) {
    try {
      console.log('🚀 [AUTH] Configurando token y autenticando...');

      // Primero configurar el token
      await this.setupUserToken(token);

      // Luego autenticar
      return await this.signInWithPersonalToken();
    } catch (error) {
      console.error('💥 Error en proceso completo de autenticación:', error);
      throw error;
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

      // Si es autenticación con token personal de Notion, usar esos datos
      const isNotionPersonal = user.user_metadata?.auth_provider === 'notion_personal';

      return {
        id: user.id,
        email: isNotionPersonal
          ? user.user_metadata?.notion_user_email || user.email
          : user.email,
        name: isNotionPersonal
          ? user.user_metadata?.notion_user_name
          : (user.user_metadata?.name || user.user_metadata?.full_name),
        avatar: isNotionPersonal
          ? user.user_metadata?.notion_avatar
          : (user.user_metadata?.avatar_url || user.user_metadata?.picture),
        provider: isNotionPersonal
          ? 'notion_personal'
          : user.app_metadata?.provider,
        notionUserId: user.user_metadata?.notion_user_id,
        lastSignIn: user.last_sign_in_at,
        createdAt: user.created_at,
        authenticatedAt: user.user_metadata?.authenticated_at
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

      // También limpiar datos locales del token personal
      this.notionAuthService.clearUserData();

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