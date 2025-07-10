"use client";

import { Card, Terminal } from '@/components';
import { useSyncToSupabase } from '../hooks/useSyncToSupabase';
import styles from './ConnectionContent.module.css';


export const ConnectionContent = () => {
  const { isProcessing, logs, syncToSupabase, clearLogs } = useSyncToSupabase();

  return (
    <div style={{
      maxWidth: '100%',
      maxHeight: '100%',
      margin: '0 auto',
      color: 'white',
      fontFamily: 'var(--font-geist-sans)'
    }}>
      <section style={{
        background: 'rgba(16, 185, 129, 0.1)',
        backdropFilter: 'blur(10px)',
        padding: '2rem',
        border: '1px solid rgba(16, 185, 129, 0.3)',
      }}>
        <h2 style={{
          fontSize: '2rem',
          marginBottom: '1rem',
          color: '#10b981'
        }}>
          🔄 Opciones de Sincronización
        </h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1.5rem',
          marginTop: '2rem'
        }}>
          <Card
            title="📋 Manual"
            description="Control total sobre cuándo sincronizar"
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