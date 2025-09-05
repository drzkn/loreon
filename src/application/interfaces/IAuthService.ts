import type { Provider, User, Session, AuthResponse } from '@supabase/supabase-js';

export interface AuthResult {
  success: boolean;
  user?: User;
  session?: Session;
  error?: string;
}

export interface OAuthResult {
  data: {
    url?: string;
    provider?: Provider;
  };
  error: Error | null;
}

export interface UserProfile {
  id: string;
  email?: string;
  name?: string;
  avatar?: string;
  provider?: string;
  lastSignIn?: string;
  createdAt?: string;
}

export interface IAuthService {
  signInWithGoogle(): Promise<OAuthResult>;
  signInWithProvider(provider: Provider, redirectTo?: string): Promise<OAuthResult>;
  signInAnonymously(): Promise<AuthResponse>;
  getCurrentUser(): Promise<User | null>;
  getUserProfile(): Promise<UserProfile | null>;
  getSession(): Promise<Session | null>;
  signOut(): Promise<void>;
  isAuthenticated(): Promise<boolean>;
  isAuthenticatedWithProvider(provider: string): Promise<boolean>;
  hasTokensForProvider(
    provider: 'notion' | 'slack' | 'github' | 'drive' | 'calendar',
    userId?: string
  ): Promise<boolean>;
  getIntegrationToken(
    provider: 'notion' | 'slack' | 'github' | 'drive' | 'calendar',
    tokenName?: string,
    userId?: string
  ): Promise<string | null>;
}
