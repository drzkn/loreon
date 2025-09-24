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
  const [diagnosticResults, setDiagnosticResults] = useState<{
    status: string;
    checks: {
      notion: boolean;
      supabase: boolean;
      embeddings: boolean;
    };
    systemData: {
      success: boolean;
      databases?: Array<{
        title?: string;
        pagesCount?: number;
        pages?: Array<{ id: string }>;
      }>;
      error?: string;
    };
  } | null>(null);

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

  const handleProductionDiagnostic = async () => {
    setIsDiagnosticRunning(true);
    setDiagnosticResults(null);

    try {
      addLog('🔍 Iniciando diagnóstico completo de producción...');

      // 1. Verificar estado del sistema
      addLog('📊 Verificando estado del sistema...');
      const systemResponse = await fetch('/api/debug-notion-connection');
      const systemData = await systemResponse.json();

      if (systemData.success) {
        addLog('✅ Conexión con Notion: OK');
        addLog(`📚 Databases encontradas: ${systemData.databases?.length || 0}`);

        if (systemData.databases?.length > 0) {
          systemData.databases.forEach((db: { title?: string; pagesCount?: number }, index: number) => {
            addLog(`  ${index + 1}. ${db.title || 'Sin título'} (${db.pagesCount || 0} páginas)`);
          });
        }
      } else {
        addLog(`❌ Error conexión Notion: ${systemData.error || 'Error desconocido'}`);
      }

      // 2. Verificar variables de entorno críticas
      addLog('🔐 Verificando configuración...');
      const envCheck = {
        notion: !!(systemData.success),
        supabase: false,
        embeddings: false
      };

      // 3. Test de base de datos
      addLog('🗄️ Probando conexión a base de datos...');
      try {
        const dbTestResponse = await fetch('/api/sync-notion?stats=true');
        if (dbTestResponse.ok) {
          addLog('✅ Base de datos: Accesible');
          envCheck.supabase = true;
        } else {
          addLog(`❌ Base de datos: Error ${dbTestResponse.status}`);
        }
      } catch {
        addLog(`❌ Base de datos: Error de conexión`);
      }

      // 4. Test de migración con una página
      addLog('🧪 Probando migración con datos reales...');
      if (systemData.databases?.length > 0) {
        const firstDb = systemData.databases[0];
        if (firstDb.pages?.length > 0) {
          const testPageId = firstDb.pages[0].id;
          addLog(`📝 Probando con página: ${testPageId.substring(0, 8)}...`);

          try {
            const testMigrationResponse = await fetch('/api/sync-notion', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                pageIds: [testPageId],
                dryRun: false
              })
            });

            const testMigrationData = await testMigrationResponse.json();

            if (testMigrationData.success) {
              addLog('✅ Test de migración: EXITOSO');
              addLog(`📊 Estadísticas: ${testMigrationData.stats?.pagesProcessed || 0} páginas, ${testMigrationData.stats?.embeddingsGenerated || 0} embeddings`);
              envCheck.embeddings = (testMigrationData.stats?.embeddingsGenerated || 0) > 0;
            } else {
              addLog(`❌ Test de migración: FALLÓ`);
              addLog(`🔍 Errores: ${testMigrationData.errors?.join(', ') || 'Sin detalles'}`);
            }
          } catch (err) {
            addLog(`💥 Error en test de migración: ${err instanceof Error ? err.message : 'Error desconocido'}`);
          }
        } else {
          addLog('⚠️ No hay páginas disponibles para test');
        }
      }

      // 5. Resumen final
      addLog('📋 RESUMEN DEL DIAGNÓSTICO:');
      addLog(`${envCheck.notion ? '✅' : '❌'} Conexión Notion: ${envCheck.notion ? 'OK' : 'FALLO'}`);
      addLog(`${envCheck.supabase ? '✅' : '❌'} Base de datos: ${envCheck.supabase ? 'OK' : 'FALLO'}`);
      addLog(`${envCheck.embeddings ? '✅' : '⚠️'} Embeddings: ${envCheck.embeddings ? 'OK' : 'NO GENERADOS'}`);

      const overallStatus = envCheck.notion && envCheck.supabase ? 'FUNCIONAL' : 'CON PROBLEMAS';
      addLog(`🎯 Estado general: ${overallStatus}`);

      setDiagnosticResults({
        status: overallStatus,
        checks: envCheck,
        systemData
      });

    } catch (error) {
      addLog(`💥 Error crítico en diagnóstico: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      setIsDiagnosticRunning(false);
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

      <SyncSection>
        <SectionTitle>🩺 Diagnósticos de Producción</SectionTitle>
        <SectionDescription>
          Herramientas para identificar problemas de volcado de datos en producción.
        </SectionDescription>

        <SyncCard>
          <SyncCardHeader>
            <div>
              <SyncCardTitle>
                <Icon name="settings" size="md" />
                Diagnóstico Completo
              </SyncCardTitle>
              <SyncCardDescription>
                Verifica conexiones, base de datos y prueba migración real
              </SyncCardDescription>
            </div>
            <StatusBadge $isActive={isDiagnosticRunning}>
              {diagnosticResults?.status || (isDiagnosticRunning ? 'Analizando...' : 'Listo')}
            </StatusBadge>
          </SyncCardHeader>

          <SyncCardContent>
            <SyncButton
              onClick={handleProductionDiagnostic}
              disabled={isDiagnosticRunning || isSyncing}
            >
              {isDiagnosticRunning ? (
                <>
                  <Icon name="settings" size="sm" />
                  Diagnosticando...
                </>
              ) : (
                <>
                  <Icon name="settings" size="sm" />
                  Ejecutar Diagnóstico
                </>
              )}
            </SyncButton>
          </SyncCardContent>
        </SyncCard>
      </SyncSection>

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

      {diagnosticResults && (
        <SyncSection>
          <SectionTitle>📊 Resumen de Diagnóstico</SectionTitle>
          <SectionDescription>
            Estado actual del sistema según el último diagnóstico.
          </SectionDescription>

          <SyncCard>
            <SyncCardHeader>
              <div>
                <SyncCardTitle>
                  <Icon name="info" size="md" />
                  Estado General: {diagnosticResults.status}
                </SyncCardTitle>
                <SyncCardDescription>
                  {diagnosticResults.status === 'FUNCIONAL'
                    ? 'Sistema operativo - Listo para sincronizar'
                    : 'Sistema con problemas - Revisar logs para detalles'
                  }
                </SyncCardDescription>
              </div>
              <StatusBadge $isActive={diagnosticResults.status === 'FUNCIONAL'}>
                {diagnosticResults.status === 'FUNCIONAL' ? '✅ OK' : '⚠️ Problemas'}
              </StatusBadge>
            </SyncCardHeader>

            <SyncCardContent>
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <div style={{
                  padding: '0.5rem',
                  borderRadius: '4px',
                  backgroundColor: diagnosticResults.checks.notion ? '#dcfce7' : '#fef2f2',
                  border: `1px solid ${diagnosticResults.checks.notion ? '#22c55e' : '#ef4444'}`
                }}>
                  {diagnosticResults.checks.notion ? '✅' : '❌'} Notion API
                </div>
                <div style={{
                  padding: '0.5rem',
                  borderRadius: '4px',
                  backgroundColor: diagnosticResults.checks.supabase ? '#dcfce7' : '#fef2f2',
                  border: `1px solid ${diagnosticResults.checks.supabase ? '#22c55e' : '#ef4444'}`
                }}>
                  {diagnosticResults.checks.supabase ? '✅' : '❌'} Base de Datos
                </div>
                <div style={{
                  padding: '0.5rem',
                  borderRadius: '4px',
                  backgroundColor: diagnosticResults.checks.embeddings ? '#dcfce7' : '#fef9c3',
                  border: `1px solid ${diagnosticResults.checks.embeddings ? '#22c55e' : '#eab308'}`
                }}>
                  {diagnosticResults.checks.embeddings ? '✅' : '⚠️'} Embeddings
                </div>
              </div>
            </SyncCardContent>
          </SyncCard>
        </SyncSection>
      )}

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