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
  StatusBadge,
  InfoAlert,
} from './SyncTab.styles';

export const SyncTab: React.FC = () => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [isDiagnosticRunning, setIsDiagnosticRunning] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  const isDebugMode = process.env.NEXT_PUBLIC_DEBUG_MODE === 'true';

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const logWithTimestamp = `[${timestamp}] ${message}`;
    setLogs(prev => [...prev, logWithTimestamp]);
  };

  const clearLogs = () => {
    setLogs([]);
  };

  const handleSync = async () => {
    setIsSyncing(true);

    try {
      addLog('🚀 Iniciando sincronización inteligente (IA Adaptiva)...');

      const response = await fetch('/api/sync-supabase-adaptive', {
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
      setIsSyncing(false);
    }
  };

  const handleNotionDiagnostic = async () => {
    setIsDiagnosticRunning(true);

    try {
      addLog('🔍 Iniciando diagnóstico de conexión con Notion API...');

      const response = await fetch('/api/debug-notion-connection', {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

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
              if (line.trim()) {
                addLog(line);
              }
            }
          }
        }
      }

    } catch (error) {
      addLog(`❌ Error en diagnóstico: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      setIsDiagnosticRunning(false);
    }
  };

  return (
    <SyncContainer>
      <InfoAlert>
        <Icon name="info" size="md" />
        <div>
          <strong>Sincronización Inteligente</strong>
          <br />
          Sistema con IA que adapta automáticamente la paralelización según el tamaño de tus databases y genera embeddings para búsqueda semántica.
        </div>
      </InfoAlert>

      {isDebugMode && (
        <SyncSection>
          <SectionTitle>Diagnóstico y Verificación</SectionTitle>
          <SectionDescription>
            Verifica la configuración y conexión con Notion antes de sincronizar.
          </SectionDescription>

          <SyncCard>
            <SyncCardHeader>
              <div>
                <SyncCardTitle>
                  <Icon name="settings" size="md" />
                  Diagnóstico de Conexión
                </SyncCardTitle>
                <SyncCardDescription>
                  Verifica la configuración y conexión con Notion API
                </SyncCardDescription>
              </div>
              <StatusBadge $isActive={isDiagnosticRunning}>
                {isDiagnosticRunning ? 'Analizando...' : 'Listo'}
              </StatusBadge>
            </SyncCardHeader>

            <SyncCardContent>
              <SyncButton
                onClick={handleNotionDiagnostic}
                disabled={isDiagnosticRunning || isSyncing}
              >
                {isDiagnosticRunning ? (
                  <>
                    <Icon name="settings" size="sm" />
                    Diagnosticando...
                  </>
                ) : (
                  <>
                    <Icon name="info" size="sm" />
                    Ejecutar Diagnóstico
                  </>
                )}
              </SyncButton>
            </SyncCardContent>
          </SyncCard>
        </SyncSection>
      )}

      <SyncSection>
        <SectionTitle>Sincronización Completa</SectionTitle>
        <SectionDescription>
          Sincroniza tus databases de Notion con Supabase usando inteligencia artificial adaptiva.
        </SectionDescription>

        <SyncCard>
          <SyncCardHeader>
            <div>
              <SyncCardTitle>
                <Icon name="brain" size="md" />
                Sincronización Inteligente
              </SyncCardTitle>
              <SyncCardDescription>
                IA Adaptiva: paralelización óptima según tamaño + embeddings automáticos
              </SyncCardDescription>
            </div>
            <StatusBadge $isActive={isSyncing}>
              {isSyncing ? 'Sincronizando...' : 'Listo'}
            </StatusBadge>
          </SyncCardHeader>

          <SyncCardContent>
            <SyncButton
              onClick={handleSync}
              disabled={isSyncing}
            >
              {isSyncing ? (
                <>
                  <Icon name="settings" size="sm" />
                  IA Procesando...
                </>
              ) : (
                <>
                  <Icon name="brain" size="sm" />
                  Sincronizar con IA 🧠
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
          isProcessing={isSyncing || (isDebugMode && isDiagnosticRunning)}
          onClearLogs={clearLogs}
        />
      </SyncSection>
    </SyncContainer>
  );
};