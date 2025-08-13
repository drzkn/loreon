import { supabase, supabaseServer } from '@/adapters/output/infrastructure/supabase';
import { UserToken, CreateUserTokenInput, UpdateUserTokenInput } from '@/types/UserToken';

export class UserTokenService {
  private supabaseClient: typeof supabase;

  constructor(useServerClient = false) {
    this.supabaseClient = useServerClient ? supabaseServer : supabase;
  }

  async getUserTokens(userId: string): Promise<UserToken[]> {
    try {
      const { data, error } = await this.supabaseClient
        .from('user_tokens')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ [USER_TOKENS] Error obteniendo tokens:', error);
        throw error;
      }
      return data || [];
    } catch (error) {
      console.error('💥 [USER_TOKENS] Error crítico:', error);
      throw error;
    }
  }

  async getTokenById(tokenId: string): Promise<UserToken | null> {
    try {
      const { data, error } = await this.supabaseClient
        .from('user_tokens')
        .select('*')
        .eq('id', tokenId)
        .eq('is_active', true)
        .single();

      if (error) {
        if (error.code === 'PGRST116') { // No rows found
          return null;
        }
        console.error('❌ [USER_TOKENS] Error obteniendo token por ID:', error);
        throw error;
      }
      return data;
    } catch (error) {
      console.error('💥 [USER_TOKENS] Error crítico:', error);
      throw error;
    }
  }

  async getTokensByProvider(userId: string, provider: UserToken['provider']): Promise<UserToken[]> {
    try {
      const { data, error } = await this.supabaseClient
        .from('user_tokens')
        .select('*')
        .eq('user_id', userId)
        .eq('provider', provider)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ [USER_TOKENS] Error obteniendo tokens por proveedor:', error);
        throw error;
      }
      return data || [];
    } catch (error) {
      console.error('💥 [USER_TOKENS] Error crítico:', error);
      throw error;
    }
  }

  async createToken(userId: string, tokenData: CreateUserTokenInput): Promise<UserToken> {
    try {
      const encryptedToken = this.encryptToken(tokenData.token);

      const { data, error } = await this.supabaseClient
        .from('user_tokens')
        .insert({
          user_id: userId,
          provider: tokenData.provider,
          token_name: tokenData.token_name,
          encrypted_token: encryptedToken,
          token_metadata: tokenData.metadata || {},
          is_active: true
        })
        .select()
        .single();

      if (error) {
        console.error('❌ [USER_TOKENS] Error creando token:', error);
        throw error;
      }
      return data;
    } catch (error) {
      console.error('💥 [USER_TOKENS] Error crítico creando token:', error);
      throw error;
    }
  }

  async updateToken(userId: string, tokenId: string, updates: UpdateUserTokenInput): Promise<UserToken> {
    try {
      const updateData: Partial<UserToken> = {
        updated_at: new Date().toISOString()
      };

      if (updates.token_name) updateData.token_name = updates.token_name;
      if (updates.metadata) updateData.token_metadata = updates.metadata;
      if (updates.is_active !== undefined) updateData.is_active = updates.is_active;
      if (updates.token) updateData.encrypted_token = this.encryptToken(updates.token);

      const { data, error } = await this.supabaseClient
        .from('user_tokens')
        .update(updateData)
        .eq('id', tokenId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        console.error('❌ [USER_TOKENS] Error actualizando token:', error);
        throw error;
      }
      return data;
    } catch (error) {
      console.error('💥 [USER_TOKENS] Error crítico actualizando token:', error);
      throw error;
    }
  }

  async deleteToken(userId: string, tokenId: string): Promise<void> {
    try {
      const { error } = await this.supabaseClient
        .from('user_tokens')
        .update({
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', tokenId)
        .eq('user_id', userId);

      if (error) {
        console.error('❌ [USER_TOKENS] Error eliminando token:', error);
        throw error;
      }
    } catch (error) {
      console.error('💥 [USER_TOKENS] Error crítico eliminando token:', error);
      throw error;
    }
  }

  async getDecryptedToken(userId: string, provider: UserToken['provider'], tokenName?: string): Promise<string | null> {
    try {
      let query = this.supabaseClient
        .from('user_tokens')
        .select('encrypted_token')
        .eq('user_id', userId)
        .eq('provider', provider)
        .eq('is_active', true);

      if (tokenName) {
        query = query.eq('token_name', tokenName);
      }

      const { data, error } = await query
        .order('last_used_at', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error || !data) {
        return null;
      }
      await this.updateLastUsed(userId, provider, tokenName);

      return this.decryptToken(data.encrypted_token);
    } catch (error) {
      console.error('💥 [USER_TOKENS] Error obteniendo token desencriptado:', error);
      return null;
    }
  }

  private async updateLastUsed(userId: string, provider: UserToken['provider'], tokenName?: string): Promise<void> {
    try {
      let query = this.supabaseClient
        .from('user_tokens')
        .update({
          last_used_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('provider', provider)
        .eq('is_active', true);

      if (tokenName) {
        query = query.eq('token_name', tokenName);
      }

      await query;
    } catch (error) {
      console.error('⚠️ [USER_TOKENS] Error actualizando last_used_at:', error);
    }
  }

  private encryptToken(token: string): string {
    return Buffer.from(token).toString('base64');
  }

  public decryptToken(encryptedToken: string): string {
    try {
      return Buffer.from(encryptedToken, 'base64').toString('utf-8');
    } catch (error) {
      console.error('❌ [USER_TOKENS] Error desencriptando token:', error);
      throw new Error('Token corrupto o formato inválido');
    }
  }

  async hasTokensForProvider(userId: string, provider: UserToken['provider']): Promise<boolean> {
    try {
      const { count, error } = await this.supabaseClient
        .from('user_tokens')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('provider', provider)
        .eq('is_active', true);

      if (error) {
        console.error('❌ [USER_TOKENS] Error verificando tokens:', error);
        return false;
      }

      return (count || 0) > 0;
    } catch (error) {
      console.error('💥 [USER_TOKENS] Error crítico verificando tokens:', error);
      return false;
    }
  }
}