'use client';

import { Card, Terminal } from '@/components';
import { useSyncToSupabase } from '../hooks/useSyncToSupabase';
import styles from './ConnectionContent.module.css';

export const ConnectionContent = () => {
  const { isProcessing, logs, syncToSupabase, clearLogs } = useSyncToSupabase();

  return (
    <div className={`${styles.container} `}>
      <section className={styles.syncSection}>
        <h2 className={styles.syncTitle}>🔄 Opciones de sincronización</h2>
        <div className={styles.syncGrid}>
          <Card
            title='📋 Manual'
            description='Control total sobre cuándo sincronizar'
          >
            <section className={styles.section}>
              <div className={styles.buttonContainer}>
                <button
                  onClick={syncToSupabase}
                  disabled={isProcessing}
                  className={`${styles.button} ${isProcessing ? styles.buttonDisabled : styles.buttonActive}`}
                >
                  {isProcessing ? '🔄 Sincronizando...' : '🚀 Sincronizar'}
                </button>
              </div>
            </section>
          </Card>

          <Terminal
            logs={logs}
            isProcessing={isProcessing}
            onClearLogs={clearLogs}
          />
        </div>
      </section>
    </div>
  );
};
