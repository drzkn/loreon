'use client';

import { Terminal, Button, Icon } from '@/components';
import { UserToken } from '@/types/UserToken';
import { useSyncToSupabaseByToken } from '../hooks/useSyncToSupabaseByToken';
import {
  InfoCard,
  InfoContent,
  InfoTitle,
  InfoDescription,
  ButtonContainer,
  TerminalContainer
} from './ConnectionContent.styles';

interface TokenSyncTabProps {
  token: UserToken;
}

export const TokenSyncTab: React.FC<TokenSyncTabProps> = ({ token }) => {
  const { isProcessing, logs, syncToSupabase, clearLogs } = useSyncToSupabaseByToken();

  const getProviderName = (provider: string) => {
    switch (provider) {
      case 'notion': return 'Notion';
      case 'slack': return 'Slack';
      case 'github': return 'GitHub';
      case 'drive': return 'Google Drive';
      case 'calendar': return 'Google Calendar';
      default: return provider.charAt(0).toUpperCase() + provider.slice(1);
    }
  };

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case 'notion': return 'notion';
      case 'slack': return 'user';
      case 'github': return 'user';
      case 'drive': return 'user';
      case 'calendar': return 'user';
      default: return 'user';
    }
  };

  const handleSync = () => {
    console.log('🎬 [TOKEN_SYNC] Iniciando sincronización manual para token:', token.id);
    syncToSupabase(token.id);
  };

  return (
    <>
      {/* Información del Token */}
      <InfoCard>
        <InfoContent>
          <InfoTitle>
            <Icon name={getProviderIcon(token.provider)} size="md" />
            {token.token_name}
          </InfoTitle>
          <InfoDescription>
            Sincroniza tu contenido desde {getProviderName(token.provider)} usando este token.
            Este proceso conecta con la API, obtiene todas las páginas configuradas,
            las convierte a formato Markdown y las almacena en Supabase.
          </InfoDescription>
        </InfoContent>
        <ButtonContainer>
          <Button
            onClick={handleSync}
            disabled={isProcessing || token.provider !== 'notion'}
            variant={isProcessing ? "loading" : "success"}
          >
            {isProcessing ? 'Sincronizando...' : 'Iniciar Sincronización'}
          </Button>
        </ButtonContainer>
      </InfoCard>

      {/* Terminal de Logs */}
      <TerminalContainer>
        <Terminal
          logs={logs}
          isProcessing={isProcessing}
          onClearLogs={clearLogs}
        />
      </TerminalContainer>

      {/* Información del Proceso */}
      <InfoCard>
        <InfoContent>
          <InfoTitle><Icon name="info" /> Información del Token</InfoTitle>
          <InfoDescription>
            <strong>Proveedor:</strong> {getProviderName(token.provider)}<br />
            <strong>Nombre:</strong> {token.token_name}<br />
            <strong>Creado:</strong> {new Date(token.created_at).toLocaleDateString()}<br />
            {token.provider !== 'notion' && (
              <span style={{ color: 'var(--warning-color)' }}>
                ⚠️ La sincronización solo está disponible para tokens de Notion.
              </span>
            )}
          </InfoDescription>
        </InfoContent>
      </InfoCard>
    </>
  );
};