import { supabase } from '../../adapters/output/infrastructure/supabase/SupabaseClient/SupabaseClient';

export class SupabaseAuthService {

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