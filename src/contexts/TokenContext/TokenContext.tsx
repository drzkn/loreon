'use client';

import { createContext, useContext, useState, useCallback, ReactNode, useMemo, useRef } from 'react';
import { UserToken, CreateUserTokenInput } from '@/types/UserToken';
import { UserTokenService } from '@/services/UserTokenService';

interface TokenContextType {
  tokens: UserToken[];
  isLoadingTokens: boolean;
  hasLoadedTokens: boolean;
  loadTokens: (userId: string) => Promise<void>;
  addToken: (userId: string, tokenData: CreateUserTokenInput) => Promise<UserToken | null>;
  deleteToken: (tokenId: string) => Promise<void>;
  clearTokens: () => void;
}

const TokenContext = createContext<TokenContextType | undefined>(undefined);

export const useTokens = () => {
  const context = useContext(TokenContext);
  if (!context) {
    throw new Error('useTokens debe usarse dentro de un TokenProvider');
  }
  return context;
};

interface TokenProviderProps {
  children: ReactNode;
}

export const TokenProvider = ({ children }: TokenProviderProps) => {
  const [tokens, setTokens] = useState<UserToken[]>([]);
  const [isLoadingTokens, setIsLoadingTokens] = useState(false);
  const [hasLoadedTokens, setHasLoadedTokens] = useState(false);

  const currentUserIdRef = useRef<string | null>(null);
  const hasLoadedTokensRef = useRef(false);
  const isLoadingTokensRef = useRef(false);

  const userTokenService = useMemo(() => new UserTokenService(), []);

  const loadTokens = useCallback(async (userId: string) => {
    if (hasLoadedTokensRef.current && currentUserIdRef.current === userId) {
      return;
    }

    if (isLoadingTokensRef.current) {
      return;
    }

    if (currentUserIdRef.current && currentUserIdRef.current !== userId) {
      console.log('👤 [TOKEN_CONTEXT] Usuario cambió, limpiando cache anterior');
      setTokens([]);
      setHasLoadedTokens(false);
      hasLoadedTokensRef.current = false;
    }

    try {
      setIsLoadingTokens(true);
      isLoadingTokensRef.current = true;
      currentUserIdRef.current = userId;

      const userTokens = await userTokenService.getUserTokens(userId);
      setTokens(userTokens);
      setHasLoadedTokens(true);
      hasLoadedTokensRef.current = true;

    } catch (error) {
      console.error('❌ [TOKEN_CONTEXT] Error cargando tokens:', error);
    } finally {
      setIsLoadingTokens(false);
      isLoadingTokensRef.current = false;
    }
  }, [userTokenService]);

  const addToken = useCallback(async (userId: string, tokenData: CreateUserTokenInput): Promise<UserToken | null> => {
    try {
      const savedToken = await userTokenService.createToken(userId, tokenData);
      if (savedToken) {
        setTokens(prev => [...prev, savedToken]);
        return savedToken;
      }
      return null;
    } catch (error) {
      console.error('❌ [TOKEN_CONTEXT] Error añadiendo token:', error);
      throw error;
    }
  }, [userTokenService]);

  const deleteToken = useCallback(async (tokenId: string) => {
    try {
      await userTokenService.deleteToken('', tokenId);
      setTokens(prev => prev.filter(token => token.id !== tokenId));

    } catch (error) {
      console.error('❌ [TOKEN_CONTEXT] Error eliminando token:', error);
      throw error;
    }
  }, [userTokenService]);

  const clearTokens = useCallback(() => {
    console.log('🧹 [TOKEN_CONTEXT] Limpiando tokens del contexto');
    setTokens([]);
    setHasLoadedTokens(false);
    setIsLoadingTokens(false);
    currentUserIdRef.current = null;
    hasLoadedTokensRef.current = false;
    isLoadingTokensRef.current = false;
  }, []);

  const value: TokenContextType = {
    tokens,
    isLoadingTokens,
    hasLoadedTokens,
    loadTokens,
    addToken,
    deleteToken,
    clearTokens
  };

  return (
    <TokenContext.Provider value={value}>
      {children}
    </TokenContext.Provider>
  );
};