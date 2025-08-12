import { useState } from 'react';

export interface SyncState {
  isProcessing: boolean;
  logs: string[];
}

export interface SyncActions {
  syncToSupabase: (tokenId: string) => Promise<void>;
  addLog: (message: string) => void;
  clearLogs: () => void;
}

export const useSyncToSupabaseByToken = (): SyncState & SyncActions => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
  };

  const clearLogs = () => {
    setLogs([]);
  };



  const syncToSupabase = async (tokenId: string) => {
    if (isProcessing) {
      console.log('🔄 [SYNC] Ya está en progreso, ignorando nueva solicitud');
      return;
    }

    try {
      setIsProcessing(true);
      clearLogs();

      addLog(`🔑 Iniciando sincronización con token: ${tokenId}`);

      const response = await fetch('/api/sync-supabase-by-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tokenId }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error HTTP ${response.status}: ${errorText}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (reader) {
        let finalResult = null;

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) {
              console.log('✅ [SYNC] Stream terminado');
              break;
            }

            const chunk = decoder.decode(value);
            const lines = chunk.split('\n');

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                try {
                  const data = JSON.parse(line.slice(6));

                  if (data.message.startsWith('SYNC_COMPLETE:')) {
                    finalResult = JSON.parse(data.message.slice(14));
                    addLog('🎉 ¡Sincronización completada exitosamente!');
                    console.log('✅ [SYNC] Sincronización completada con éxito');

                    console.log('🏁 [SYNC] Reseteando estado inmediatamente después de completar');
                    setIsProcessing(false);
                  } else {
                    addLog(data.message);
                  }
                } catch {
                }
              }
            }
          }
        } finally {
          reader.releaseLock();
        }

        if (finalResult) {
          setTimeout(() => {
            addLog('📊 Resumen:');
            addLog(`💿 Total de databases: ${finalResult.summary.total || 0}`);
            addLog(`✅ Exitosas: ${finalResult.summary.successful || 0}`);
            addLog(`❌ Errores: ${finalResult.summary.errors || 0}`);
          }, 500);
        }
      } else {
        throw new Error('No se pudo obtener el stream de respuesta');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      addLog(`❌ Error en la sincronización: ${errorMessage}`);
      console.error('❌ [SYNC] Error en la sincronización:', error);
    } finally {
      console.log('🏁 [SYNC] Finalizando sincronización, reseteando estado');
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