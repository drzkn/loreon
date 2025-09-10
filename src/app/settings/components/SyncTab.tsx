'use client';

import React, { useState } from 'react';
import { Icon, Terminal } from '@/components';
import {
  SyncContainer,
  SyncSection,
  SectionTitle,
  SectionDescription,
  SyncCard,
  SyncCardHeader,
  SyncCardTitle,
  SyncCardDescription,
  SyncCardContent,
  SyncButton,
  ProgressContainer,
  ProgressBar,
  ProgressText,
  StatusBadge,
  InfoAlert,
  DatabaseInputContainer,
  DatabaseInput,
  DatabaseLabel
} from './SyncTab.styles';

// Eliminamos SyncLog interface ya que ahora usamos strings simples

interface SyncProgress {
  current: number;
  total: number;
  percentage: number;
}

export const SyncTab: React.FC = () => {
  const [isNotionSyncing, setIsNotionSyncing] = useState(false);
  const [isSupabaseSyncing, setIsSupabaseSyncing] = useState(false);
  const [notionProgress, setNotionProgress] = useState<SyncProgress | null>(null);
  const [supabaseProgress, setSupabaseProgress] = useState<SyncProgress | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [pageIds, setPageIds] = useState('');

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const logWithTimestamp = `[${timestamp}] ${message}`;
    setLogs(prev => [...prev, logWithTimestamp]);
  };

  const clearLogs = () => {
    setLogs([]);
  };

  const handleNotionSync = async () => {
    if (!pageIds.trim()) {
      addLog('❌ Error: Debes especificar al menos un Page ID para sincronizar');
      return;
    }

    setIsNotionSyncing(true);
    setNotionProgress({ current: 0, total: 0, percentage: 0 });

    try {
      addLog('🚀 Iniciando sincronización de páginas específicas de Notion...');

      const pageIdsArray = pageIds.split(',').map(id => id.trim()).filter(id => id.length > 0);

      const response = await fetch('/api/sync-notion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pageIds: pageIdsArray
        }),
      });

      const result = await response.json();

      if (result.success) {
        addLog(`✅ Sincronización completada: ${result.stats?.pagesProcessed || 0} páginas procesadas`);
        if (result.stats?.embeddingsGenerated) {
          addLog(`🧠 Embeddings generados: ${result.stats.embeddingsGenerated}`);
        }
      } else {
        addLog(`❌ Error en sincronización: ${result.message}`);
        if (result.errors) {
          result.errors.forEach((error: string) => addLog(`  • ${error}`));
        }
      }

    } catch (error) {
      addLog(`❌ Error crítico: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      setIsNotionSyncing(false);
      setNotionProgress(null);
    }
  };

  const handleSupabaseSync = async () => {
    setIsSupabaseSyncing(true);
    setSupabaseProgress({ current: 0, total: 0, percentage: 0 });

    try {
      addLog('🚀 Iniciando sincronización completa con Supabase...');

      const response = await fetch('/api/sync-supabase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Handle Server-Sent Events
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (reader) {
        let done = false;
        while (!done) {
          const { value, done: readerDone } = await reader.read();
          done = readerDone;

          if (value) {
            const chunk = decoder.decode(value);
            const lines = chunk.split('\n');

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const message = line.slice(6);
                if (message.trim()) {
                  addLog(message);
                }
              }
            }
          }
        }
      }

    } catch (error) {
      addLog(`❌ Error crítico: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      setIsSupabaseSyncing(false);
      setSupabaseProgress(null);
    }
  };

  // getLogIcon eliminado - el componente Terminal maneja esto automáticamente

  return (
    <SyncContainer>
      <InfoAlert>
        <Icon name="info" size="md" />
        <div>
          <strong>Sincronización de Datos</strong>
          <br />
          Aquí puedes sincronizar tu contenido de Notion con Supabase y generar embeddings para búsqueda semántica.
        </div>
      </InfoAlert>

      {/* <SyncSection> 
        <SectionTitle>Sincronización de Páginas Específicas</SectionTitle>
        <SectionDescription>
          Sincroniza páginas específicas de Notion proporcionando sus Page IDs.
        </SectionDescription>

        <SyncCard>
          <SyncCardHeader>
            <div>
              <SyncCardTitle>
                <Icon name="bot" size="md" />
                Notion → Supabase (Páginas)
              </SyncCardTitle>
              <SyncCardDescription>
                Sincroniza páginas específicas y genera embeddings
              </SyncCardDescription>
            </div>
            <StatusBadge $isActive={isNotionSyncing}>
              {isNotionSyncing ? 'Sincronizando...' : 'Listo'}
            </StatusBadge>
          </SyncCardHeader>

          <SyncCardContent>
            <DatabaseInputContainer>
              <DatabaseLabel>Page IDs (separados por comas):</DatabaseLabel>
              <DatabaseInput
                type="text"
                value={pageIds}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPageIds(e.target.value)}
                placeholder="ej: page-id-1, page-id-2, page-id-3"
                disabled={isNotionSyncing}
              />
            </DatabaseInputContainer>

            {notionProgress && (
              <ProgressContainer>
                <ProgressText>
                  {notionProgress.current} de {notionProgress.total} páginas ({notionProgress.percentage}%)
                </ProgressText>
                <ProgressBar>
                  <div
                    style={{
                      width: `${notionProgress.percentage}%`,
                      background: 'linear-gradient(90deg, #00cfff, #6b2fff)',
                      height: '100%',
                      borderRadius: '4px',
                      transition: 'width 0.3s ease'
                    }}
                  />
                </ProgressBar>
              </ProgressContainer>
            )}

            <SyncButton
              onClick={handleNotionSync}
              disabled={isNotionSyncing || !pageIds.trim()}
            >
              {isNotionSyncing ? (
                <>
                  <Icon name="settings" size="sm" />
                  Sincronizando...
                </>
              ) : (
                <>
                  <Icon name="bot" size="sm" />
                  Sincronizar Páginas
                </>
              )}
            </SyncButton>
          </SyncCardContent>
        </SyncCard>
      </SyncSection> */}

      <SyncSection>
        <SectionTitle>Sincronización Completa de Databases</SectionTitle>
        <SectionDescription>
          Sincroniza databases completas de Notion configuradas en las variables de entorno.
        </SectionDescription>

        <SyncCard>
          <SyncCardHeader>
            <div>
              <SyncCardTitle>
                <Icon name="notebook" size="md" />
                Notion → Supabase (Completo)
              </SyncCardTitle>
              <SyncCardDescription>
                Sincroniza todas las databases configuradas
              </SyncCardDescription>
            </div>
            <StatusBadge $isActive={isSupabaseSyncing}>
              {isSupabaseSyncing ? 'Sincronizando...' : 'Listo'}
            </StatusBadge>
          </SyncCardHeader>

          <SyncCardContent>
            {supabaseProgress && (
              <ProgressContainer>
                <ProgressText>
                  {supabaseProgress.current} de {supabaseProgress.total} databases ({supabaseProgress.percentage}%)
                </ProgressText>
                <ProgressBar>
                  <div
                    style={{
                      width: `${supabaseProgress.percentage}%`,
                      background: 'linear-gradient(90deg, #10b981, #3b82f6)',
                      height: '100%',
                      borderRadius: '4px',
                      transition: 'width 0.3s ease'
                    }}
                  />
                </ProgressBar>
              </ProgressContainer>
            )}

            <SyncButton
              onClick={handleSupabaseSync}
              disabled={isSupabaseSyncing}
            >
              {isSupabaseSyncing ? (
                <>
                  <Icon name="settings" size="sm" />
                  Sincronizando...
                </>
              ) : (
                <>
                  <Icon name="rocket" size="sm" />
                  Sincronizar Todo
                </>
              )}
            </SyncButton>
          </SyncCardContent>
        </SyncCard>
      </SyncSection>

      <SyncSection>
        <SectionTitle>Terminal de Sincronización</SectionTitle>
        <Terminal
          logs={logs}
          isProcessing={isNotionSyncing || isSupabaseSyncing}
          onClearLogs={clearLogs}
        />
      </SyncSection>
    </SyncContainer>
  );
};
