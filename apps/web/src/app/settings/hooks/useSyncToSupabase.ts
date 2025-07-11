import { useState } from 'react';

export interface SyncState {
  isProcessing: boolean;
  logs: string[];
}

export interface SyncActions {
  syncToSupabase: () => Promise<void>;
  addLog: (message: string) => void;
  clearLogs: () => void;
}

export const useSyncToSupabase = (): SyncState & SyncActions => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
  };

  const clearLogs = () => {
    setLogs([]);
  };

  const syncToSupabase = async () => {
    if (isProcessing) return;

    try {
      setIsProcessing(true);
      clearLogs();

      // Usar Server-Sent Events para logs en tiempo real
      const response = await fetch('/api/sync-supabase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (reader) {
        let finalResult = null;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));

                // Verificar si es el resultado final
                if (data.message.startsWith('SYNC_COMPLETE:')) {
                  finalResult = JSON.parse(data.message.slice(14));
                  addLog('🎉 ¡Sincronización completada exitosamente!');
                } else {
                  addLog(data.message);
                }
              } catch {
                // Ignorar líneas que no sean JSON válido
              }
            }
          }
        }

        // Mostrar resumen final si está disponible
        if (finalResult) {
          setTimeout(() => {
            addLog('📊 Resumen:');
            addLog(`💿 Total de databases: ${finalResult.summary.total}`);
            addLog(`✅ Exitosas: ${finalResult.summary.successful}`);
            addLog(`❌ Errores: ${finalResult.summary.errors}`);
          }, 500);
        }
      }
    } catch (error) {
      addLog(`❌ Error en la sincronización: ${error instanceof Error ? error.message : 'Error desconocido'}`);
      console.error('❌ Error en la sincronización:', error);
      alert(`❌ Error en la sincronización: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    isProcessing,
    logs,
    syncToSupabase,
    addLog,
    clearLogs
  };
}; 