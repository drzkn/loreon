export type UserTokenProvider = 'notion' | 'slack' | 'github' | 'drive' | 'calendar';

export interface UserToken {
  id: string;
  user_id: string;
  provider: UserTokenProvider;
  token_name: string;
  encrypted_token: string;
  token_metadata: Record<string, unknown>;
  is_active: boolean;
  last_used_at?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateUserTokenInput {
  provider: UserToken['provider'];
  token_name: string;
  token: string;
  metadata?: Record<string, unknown>;
}

export interface UpdateUserTokenInput {
  token_name?: string;
  token?: string;
  metadata?: Record<string, unknown>;
  is_active?: boolean;
}