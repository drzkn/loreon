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
    const checkUser = async () => {
      try {
        const currentUser = await authService.getCurrentUser();
        const profile = await authService.getUserProfile();

        setUser(currentUser);
        setUserProfile(profile);
        setIsAuthenticated(!!currentUser);
      } catch (error) {
        console.error('Error checking auth status:', error);
        setUser(null);
        setUserProfile(null);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    // Verificar usuario inicial
    checkUser();

    // Escuchar cambios de autenticación
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔐 Auth state changed:', event);

        if (session?.user) {
          const profile = await authService.getUserProfile();
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

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  const signInWithNotion = async (token?: string) => {
    try {
      setIsLoading(true);

      if (token) {
        // Si se proporciona token, configurarlo y autenticar
        return await authService.signInWithNotionToken(token);
      } else {
        // Si ya hay token configurado, solo autenticar
        return await authService.signInWithPersonalToken();
      }
    } catch (error) {
      setIsLoading(false);
      throw error;
    }
  };

  const hasNotionToken = () => {
    return authService.hasNotionToken();
  };

  const signOut = async () => {
    try {
      setIsLoading(true);
      await authService.signOut();
      // El listener se encargará de actualizar el estado
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
    signInWithNotion,
    hasNotionToken,
    signOut,
    isAuthenticatedWithProvider
  };
};