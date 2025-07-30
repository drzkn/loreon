'use client';

import { Terminal, Button } from '@/components';
import { useSyncToSupabase } from '../hooks/useSyncToSupabase';
import {
  Container,
  MainContent,
  ButtonContainer,
  InfoCard,
  InfoContent,
  InfoTitle,
  InfoDescription,
  TerminalContainer
} from './ConnectionContent.styles';

export const ConnectionContent = () => {
  const { isProcessing, logs, syncToSupabase, clearLogs } = useSyncToSupabase();

  return (
    <Container data-testid="connection-content">
      <MainContent>
        <InfoCard>
          <InfoContent>
            <InfoTitle>📋 Sincronización Manual</InfoTitle>
            <InfoDescription>
              Control total sobre cuándo sincronizar tu contenido desde Notion.
              Perfecto para cuando hayas realizado cambios importantes y quieras
              verlos reflejados inmediatamente en el visualizador.
            </InfoDescription>
          </InfoContent>
          <ButtonContainer>
            <Button
              onClick={syncToSupabase}
              disabled={isProcessing}
              variant={isProcessing ? "loading" : "success"}
            >
              {isProcessing ? '🔄 Sincronizando...' : '🚀 Iniciar Sincronización'}
            </Button>
          </ButtonContainer>
        </InfoCard>

        <TerminalContainer>
          <Terminal
            logs={logs}
            isProcessing={isProcessing}
            onClearLogs={clearLogs}
          />
        </TerminalContainer>

        <InfoCard>
          <InfoContent>
            <InfoTitle>ℹ️ Información del Proceso</InfoTitle>
            <InfoDescription>
              La sincronización conecta con la API de Notion, obtiene todas las páginas
              configuradas, las convierte a formato Markdown y las almacena en Supabase.
              Este proceso puede tardar unos minutos dependiendo de la cantidad de contenido.
            </InfoDescription>
          </InfoContent>
        </InfoCard>
      </MainContent>
    </Container>
  );
};
