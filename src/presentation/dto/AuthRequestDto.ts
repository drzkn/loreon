import type { Provider } from '@supabase/supabase-js';

export interface SignInRequestDto {
  provider: Provider;
  redirectTo?: string;
}

export interface AuthResponseDto {
  success: boolean;
  user?: {
    id: string;
    email?: string;
    name?: string;
    avatar?: string;
    provider?: string;
  };
  session?: {
    access_token: string;
    refresh_token: string;
    expires_at?: number;
  };
  error?: string;
}

export interface UserProfileResponseDto {
  success: boolean;
  profile?: {
    id: string;
    email?: string;
    name?: string;
    avatar?: string;
    provider?: string;
    lastSignIn?: string;
    createdAt?: string;
  };
  error?: string;
}
