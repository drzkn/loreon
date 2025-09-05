'use client';

import { useState, useEffect } from 'react';
// Usar directamente el cliente de Supabase para evitar problemas con servicios deprecated
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

  // Usar directamente el cliente de Supabase

  useEffect(() => {
    const checkAndFixAuthState = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();

        // NO hacer auto-logout si ya estamos en páginas de auth
        const isAuthPage = window.location.pathname.startsWith('/auth');

        // Si no hay sesión en el cliente pero el middleware dejó pasar, 
        // significa que hay desincronización (pero solo si NO estamos en auth)
        if ((!session || error) && !isAuthPage) {
          console.log('🔧 [useAuth] Detectada desincronización de auth, forzando logout...');

          // Limpiar cookies manualmente
          document.cookie.split(";").forEach(cookie => {
            const eqPos = cookie.indexOf("=");
            const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
            if (name.startsWith('sb-')) {
              document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
            }
          });

          // Forzar redirección al login
          window.location.href = '/auth/login?force=true';
          return;
        }

        // Si hay sesión válida, procesarla
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
      } catch (error) {
        console.error('❌ [useAuth] Error en checkAndFixAuthState:', error);
        // En caso de error, también forzar logout
        window.location.href = '/auth/login?error=auth_check_failed';
      }
    };

    // Ejecutar verificación inicial
    checkAndFixAuthState();

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
      console.log('🔐 [AUTH] Iniciando autenticación con Google...');

      const redirectUrl = `${window.location.origin}/auth/callback`;
      console.log('🔗 [AUTH] Redirect URL:', redirectUrl);
      console.log('🌐 [AUTH] Window origin:', window.location.origin);

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl
        }
      });

      if (data?.url) {
        console.log('🚀 [AUTH] OAuth URL generada:', data.url);
      }

      if (error) {
        console.error('❌ Error en autenticación con Google:', error.message);
        setIsLoading(false);
        throw error;
      }

      console.log('✅ Autenticación con Google iniciada');
      return data;
    } catch (error) {
      console.error('💥 Error crítico en autenticación con Google:', error);
      setIsLoading(false);
      throw error;
    }
  };

  const hasTokensForProvider = async (_provider: 'notion' | 'slack' | 'github' | 'drive' | 'calendar') => { // eslint-disable-line @typescript-eslint/no-unused-vars
    const userId = user?.id;
    if (!userId) return false;

    // TODO: Implementar verificación de tokens cuando se implemente el nuevo sistema
    console.warn('⚠️ hasTokensForProvider: Implementación temporal - siempre devuelve false');
    return false;
  };

  const getIntegrationToken = async (_provider: 'notion' | 'slack' | 'github' | 'drive' | 'calendar', _tokenName?: string) => { // eslint-disable-line @typescript-eslint/no-unused-vars
    const userId = user?.id;
    if (!userId) return null;

    // TODO: Implementar obtención de tokens cuando se implemente el nuevo sistema
    console.warn('⚠️ getIntegrationToken: Implementación temporal - siempre devuelve null');
    return null;
  };

  const signOut = async () => {
    try {
      setIsLoading(true);
      console.log('🚪 [AUTH] Cerrando sesión...');

      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error('❌ Error al cerrar sesión:', error.message);
        setIsLoading(false);
        throw error;
      }

      console.log('✅ Sesión cerrada correctamente');
      setUser(null);
      setUserProfile(null);
      setIsAuthenticated(false);
      setIsLoading(false);
    } catch (error) {
      console.error('💥 Error crítico al cerrar sesión:', error);
      setIsLoading(false);
      throw error;
    }
  };

  const isAuthenticatedWithProvider = async (_provider: string) => { // eslint-disable-line @typescript-eslint/no-unused-vars
    // TODO: Implementar verificación de autenticación con proveedor específico
    console.warn('⚠️ isAuthenticatedWithProvider: Implementación temporal - usa isAuthenticated general');
    return isAuthenticated;
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