'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useTokens } from '@/contexts/TokenContext/TokenContext';

export const useSettingsTokens = () => {
  const { userProfile, isAuthenticated } = useAuth();
  const { tokens, isLoadingTokens, hasLoadedTokens, loadTokens, addToken, deleteToken, clearTokens } = useTokens();

  const [selectedTokenId, setSelectedTokenId] = useState<string | null>(null);
  const hasInitializedRef = useRef(false);
  const previousUserIdRef = useRef<string | null>(null);

  const memoizedAddToken = useCallback(addToken, [addToken]);
  const memoizedDeleteToken = useCallback(deleteToken, [deleteToken]);
  const memoizedClearTokens = useCallback(clearTokens, [clearTokens]);

  useEffect(() => {
    const currentUserId = userProfile?.id || null;

    if (previousUserIdRef.current && previousUserIdRef.current !== currentUserId) {
      console.log('👤 [SETTINGS_TOKENS] Usuario cambió, reseteando estado');
      hasInitializedRef.current = false;
      setSelectedTokenId(null);
    }

    previousUserIdRef.current = currentUserId;
  }, [userProfile?.id]);

  useEffect(() => {
    if (!isAuthenticated) {
      console.log('🧹 [SETTINGS_TOKENS] Usuario deslogueado, limpiando');
      memoizedClearTokens();
      setSelectedTokenId(null);
      hasInitializedRef.current = false;
      previousUserIdRef.current = null;
    }
  }, [isAuthenticated, memoizedClearTokens]);

  useEffect(() => {
    if (isAuthenticated && userProfile?.id && !hasInitializedRef.current) {
      console.log('🎯 [SETTINGS_TOKENS] Inicializando carga de tokens para:', userProfile.id);
      loadTokens(userProfile.id);
      hasInitializedRef.current = true;
    }
  }, [isAuthenticated, userProfile?.id, loadTokens]);

  useEffect(() => {
    if (tokens.length > 0 && !selectedTokenId) {
      const firstTokenId = tokens[0].id;
      setSelectedTokenId(firstTokenId);
      console.log('🎯 [SETTINGS_TOKENS] Token seleccionado automáticamente:', firstTokenId);
    } else if (tokens.length === 0 && selectedTokenId) {
      setSelectedTokenId(null);
    }
  }, [tokens, selectedTokenId]);

  return useMemo(() => ({
    tokens,
    isLoadingTokens,
    hasLoadedTokens,
    selectedTokenId,
    setSelectedTokenId,
    addToken: memoizedAddToken,
    deleteToken: memoizedDeleteToken,
    clearTokens: memoizedClearTokens
  }), [
    tokens,
    isLoadingTokens,
    hasLoadedTokens,
    selectedTokenId,
    memoizedAddToken,
    memoizedDeleteToken,
    memoizedClearTokens
  ]);
};