'use client';

import { Terminal, Card, Button } from '@/components';
import { useSyncToSupabase } from '../hooks/useSyncToSupabase';
import {
  Container,
  SyncSection,
  SyncTitle,
  SyncGrid,
  Section,
  ButtonContainer
} from './ConnectionContent.styles';

export const ConnectionContent = () => {
  const { isProcessing, logs, syncToSupabase, clearLogs } = useSyncToSupabase();

  return (
    <Container data-testid="connection-content">
      <SyncSection>
        <SyncTitle>🔄 Opciones de sincronización</SyncTitle>
        <SyncGrid>
          <Card
            title='📋 Manual'
            description='Control total sobre cuándo sincronizar'
          >
            <Section>
              <ButtonContainer>
                <Button
                  onClick={syncToSupabase}
                  disabled={isProcessing}
                  variant={isProcessing ? "loading" : "success"}
                  fullWidth
                >
                  {isProcessing ? '🔄 Sincronizando...' : '🚀 Sincronizar'}
                </Button>
              </ButtonContainer>
            </Section>
          </Card>

          <Terminal
            logs={logs}
            isProcessing={isProcessing}
            onClearLogs={clearLogs}
          />
        </SyncGrid>
      </SyncSection>
    </Container>
  );
};
