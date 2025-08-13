'use client';

import { useState, useEffect } from 'react';
import { AuthService } from '@/services/supabase/AuthService';
import { supabase } from '@/adapters/output/infrastructure/supabase';
import type { User } from '@supabase/supabase-js';

interface UserProfile {
  id: string;
  email: string | undefined;
  name?: string;
  avatar?: string;
  provider?: string;
  lastSignIn?: string;
  createdAt?: string;
}

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const authService = new AuthService();

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          const profile = {
            id: session.user.id,
            email: session.user.email,
            name: session.user.user_metadata?.name || session.user.user_metadata?.full_name || session.user.email?.split('@')[0],
            avatar: session.user.user_metadata?.avatar_url || session.user.user_metadata?.picture,
            provider: session.user.app_metadata?.provider || 'google',
            lastSignIn: session.user.last_sign_in_at,
            createdAt: session.user.created_at
          };

          setUser(session.user);
          setUserProfile(profile);
          setIsAuthenticated(true);
        } else {
          setUser(null);
          setUserProfile(null);
          setIsAuthenticated(false);
        }

        setIsLoading(false);
      }
    );

    const timeoutId = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => {
      authListener?.subscription.unsubscribe();
      clearTimeout(timeoutId);
    };
  }, []);

  const signInWithGoogle = async () => {
    try {
      setIsLoading(true);
      return await authService.signInWithGoogle();
    } catch (error) {
      setIsLoading(false);
      throw error;
    }
  };

  const hasTokensForProvider = async (provider: 'notion' | 'slack' | 'github' | 'drive' | 'calendar') => {
    const userId = user?.id;
    if (!userId) return false;
    return await authService.hasTokensForProvider(provider, userId);
  };

  const getIntegrationToken = async (provider: 'notion' | 'slack' | 'github' | 'drive' | 'calendar', tokenName?: string) => {
    const userId = user?.id;
    if (!userId) return null;
    return await authService.getIntegrationToken(provider, tokenName, userId);
  };

  const signOut = async () => {
    try {
      setIsLoading(true);
      await authService.signOut();
    } catch (error) {
      setIsLoading(false);
      throw error;
    }
  };

  const isAuthenticatedWithProvider = async (provider: string) => {
    return await authService.isAuthenticatedWithProvider(provider);
  };

  return {
    user,
    userProfile,
    isLoading,
    isAuthenticated,
    signInWithGoogle,
    hasTokensForProvider,
    getIntegrationToken,
    signOut,
    isAuthenticatedWithProvider
  };
};