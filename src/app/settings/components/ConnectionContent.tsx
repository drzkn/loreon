'use client';

import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { Button, Icon } from '@/components';
import { useAuth } from '@/hooks/useAuth';
import { CreateUserTokenInput, UserTokenProvider, UserToken } from '@/types/UserToken';
import { TokenSyncTab } from './TokenSyncTab';
import { useSettingsTokens } from '../hooks/useSettingsTokens';
import { logRender } from '@/utils/renderLogger';
import {
  Container,
  MainContent,
  ButtonContainer,
  InfoCard,
  InfoContent,
  InfoTitle,
  InfoDescription,
  TokenActionButton,
  AddTokenForm,
  FormRow,
  FormField,
  FormLabel,
  FormInput,
  FormSelect,
  FormActions,
  EmptyTokensState,
  StatusMessage,
  SubTabsContainer,
  SubTab,
  TabContent
} from './ConnectionContent.styles';

const AddTokenFormMemo = memo<{
  showAddForm: boolean;
  newToken: Partial<CreateUserTokenInput>;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  onAddToken: () => void;
  onCancel: () => void;
  isLoading: boolean;
}>(({ showAddForm, newToken, onInputChange, onAddToken, onCancel, isLoading }) => {
  logRender('AddTokenFormMemo', { showAddForm, isLoading });

  if (!showAddForm) return null;

  return (
    <AddTokenForm>
      <FormRow>
        <FormField>
          <FormLabel>Proveedor</FormLabel>
          <FormSelect
            name="provider"
            value={newToken.provider || 'notion'}
            onChange={onInputChange}
          >
            <option value="notion">Notion</option>
            <option value="slack">Slack</option>
            <option value="github">GitHub</option>
            <option value="drive">Google Drive</option>
            <option value="calendar">Google Calendar</option>
          </FormSelect>
        </FormField>
        <FormField>
          <FormLabel>Nombre del Token</FormLabel>
          <FormInput
            type="text"
            name="token_name"
            value={newToken.token_name || ''}
            onChange={onInputChange}
            placeholder="Mi token de trabajo"
          />
        </FormField>
      </FormRow>
      <FormRow>
        <FormField>
          <FormLabel>Token</FormLabel>
          <FormInput
            type="password"
            name="token"
            value={newToken.token || ''}
            onChange={onInputChange}
            placeholder="secret_..."
          />
        </FormField>
      </FormRow>
      <FormActions>
        <Button variant="secondary" onClick={onCancel} disabled={isLoading}>
          Cancelar
        </Button>
        <Button variant="primary" onClick={onAddToken} disabled={isLoading}>
          Añadir Token
        </Button>
      </FormActions>
    </AddTokenForm>
  );
});

AddTokenFormMemo.displayName = 'AddTokenFormMemo';

// Componente memoizado para la lista de tokens
const TokenListMemo = memo<{
  tokens: UserToken[];
  selectedTokenId: string | null;
  onSelectToken: (tokenId: string) => void;
  onDeleteToken: (tokenId: string) => void;
  getProviderIcon: (provider: UserTokenProvider) => 'notion' | 'user';
}>(({ tokens, selectedTokenId, onSelectToken, onDeleteToken, getProviderIcon }) => {
  logRender('TokenListMemo', { tokensCount: tokens.length, selectedTokenId });

  if (tokens.length === 0) {
    return (
      <EmptyTokensState>
        <Icon name="info" size="lg" />
        <h3>No hay tokens configurados</h3>
        <p>Añade tu primer token de integración para comenzar.</p>
      </EmptyTokensState>
    );
  }

  return (
    <SubTabsContainer>
      {tokens.map((token) => (
        <SubTab
          key={token.id}
          $isActive={selectedTokenId === token.id}
          onClick={() => onSelectToken(token.id)}
        >
          <Icon name={getProviderIcon(token.provider)} size="sm" />
          <span>{token.token_name}</span>
          <TokenActionButton
            onClick={(e) => {
              e.stopPropagation();
              onDeleteToken(token.id);
            }}
            title="Eliminar token"
          >
            <Icon name="trash" size="sm" />
          </TokenActionButton>
        </SubTab>
      ))}
    </SubTabsContainer>
  );
});

TokenListMemo.displayName = 'TokenListMemo';

// Componente memoizado para el mensaje de estado
const StatusMessageMemo = memo<{
  statusMessage: { type: 'success' | 'error'; text: string } | null;
}>(({ statusMessage }) => {
  if (!statusMessage) return null;

  return (
    <StatusMessage className={statusMessage.type}>
      {statusMessage.text}
    </StatusMessage>
  );
});

StatusMessageMemo.displayName = 'StatusMessageMemo';

export const ConnectionContent = memo(() => {
  const { userProfile } = useAuth();
  const {
    tokens,
    isLoadingTokens,
    hasLoadedTokens,
    selectedTokenId,
    setSelectedTokenId,
    addToken,
    deleteToken
  } = useSettingsTokens();

  // Debug: Log para ver re-renderizados (solo en desarrollo)
  logRender('ConnectionContent', {
    userId: userProfile?.id ?? '',
    userName: userProfile?.name ?? '',
    tokensCount: tokens.length,
    hasLoadedTokens,
    selectedTokenId
  });

  // Estados locales para UI
  const [showAddForm, setShowAddForm] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [newToken, setNewToken] = useState<Partial<CreateUserTokenInput>>({
    provider: 'notion',
    token_name: '',
    token: '',
    metadata: {}
  });

  // Memoizar funciones para evitar re-renders de componentes hijos
  const getProviderIcon = useCallback((provider: UserTokenProvider): 'notion' | 'user' => {
    switch (provider) {
      case 'notion': return 'notion';
      case 'slack': return 'user';
      case 'github': return 'user';
      case 'drive': return 'user';
      case 'calendar': return 'user';
    }
  }, []);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewToken(prev => ({ ...prev, [name]: value }));
  }, []);

  const handleAddToken = useCallback(async () => {
    if (!userProfile || !newToken.provider || !newToken.token_name || !newToken.token) {
      setStatusMessage({ type: 'error', text: 'Todos los campos son obligatorios.' });
      return;
    }

    try {
      console.log('➕ [SETTINGS] Añadiendo token via contexto');
      const savedToken = await addToken(userProfile.id, newToken as CreateUserTokenInput);
      if (savedToken) {
        setNewToken({ provider: 'notion', token_name: '', token: '', metadata: {} });
        setShowAddForm(false);
        setStatusMessage({ type: 'success', text: 'Token añadido exitosamente.' });
        setSelectedTokenId(savedToken.id);
      }
    } catch (error) {
      console.error('❌ [SETTINGS] Error adding token:', error);
      setStatusMessage({ type: 'error', text: 'Error al añadir el token. Asegúrate de que sea válido y único.' });
    }
  }, [userProfile, newToken, addToken, setSelectedTokenId]);

  const handleDeleteToken = useCallback(async (tokenId: string) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar este token?')) return;

    try {
      console.log('🗑️ [SETTINGS] Eliminando token via contexto:', tokenId);
      await deleteToken(tokenId);
      setStatusMessage({ type: 'success', text: 'Token eliminado exitosamente.' });

      if (selectedTokenId === tokenId) {
        const remainingTokens = tokens.filter(token => token.id !== tokenId);
        setSelectedTokenId(remainingTokens.length > 0 ? remainingTokens[0].id : null);
      }
    } catch (error) {
      console.error('❌ [SETTINGS] Error deleting token:', error);
      setStatusMessage({ type: 'error', text: 'Error al eliminar el token.' });
    }
  }, [deleteToken, selectedTokenId, tokens, setSelectedTokenId]);

  const handleSelectToken = useCallback((tokenId: string) => {
    setSelectedTokenId(tokenId);
  }, [setSelectedTokenId]);

  const handleShowAddForm = useCallback(() => {
    setShowAddForm(true);
  }, []);

  const handleCancelAddForm = useCallback(() => {
    setShowAddForm(false);
    setNewToken({ provider: 'notion', token_name: '', token: '', metadata: {} });
  }, []);

  // Auto-hide status message
  useEffect(() => {
    if (statusMessage) {
      const timer = setTimeout(() => setStatusMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [statusMessage]);

  // Memoizar el token seleccionado
  const selectedToken = useMemo(() => {
    return tokens.find(token => token.id === selectedTokenId) || null;
  }, [tokens, selectedTokenId]);

  return (
    <Container>
      <MainContent>
        <InfoCard>
          <InfoContent>
            <InfoTitle>
              <Icon name="plug" />
              Tokens de Integración
            </InfoTitle>
            <InfoDescription>
              Gestiona tus tokens de API para conectar diferentes servicios.
              Cada token permite sincronizar contenido desde la plataforma correspondiente.
            </InfoDescription>
          </InfoContent>
          <ButtonContainer>
            <Button onClick={handleShowAddForm}>
              <Icon name="plus" />
              Añadir Token
            </Button>
          </ButtonContainer>
        </InfoCard>

        <StatusMessageMemo statusMessage={statusMessage} />

        <AddTokenFormMemo
          showAddForm={showAddForm}
          newToken={newToken}
          onInputChange={handleInputChange}
          onAddToken={handleAddToken}
          onCancel={handleCancelAddForm}
          isLoading={isLoadingTokens}
        />

        <TokenListMemo
          tokens={tokens}
          selectedTokenId={selectedTokenId}
          onSelectToken={handleSelectToken}
          onDeleteToken={handleDeleteToken}
          getProviderIcon={getProviderIcon}
        />

        {selectedToken && (
          <TabContent>
            <TokenSyncTab token={selectedToken} />
          </TabContent>
        )}
      </MainContent>
    </Container>
  );
});

ConnectionContent.displayName = 'ConnectionContent';