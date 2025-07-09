"use client";

import { PageHeader, SyncCard, Terminal } from '../../components';
import { useSyncToSupabase } from './hooks/useSyncToSupabase';

export default function ConnectPage() {
  const { isProcessing, logs, syncToSupabase, clearLogs } = useSyncToSupabase();

  return (
    <div style={{
      maxWidth: '1200px',
      margin: '0 auto',
      color: 'white',
      fontFamily: 'var(--font-geist-sans)'
    }}>
      <PageHeader
        title="🔌 Connect & Sync"
        description="Sincronización con la base de datos"
      />

      <section style={{
        background: 'rgba(16, 185, 129, 0.1)',
        backdropFilter: 'blur(10px)',
        borderRadius: '16px',
        padding: '2rem',
        border: '1px solid rgba(16, 185, 129, 0.3)',
        marginBottom: '2rem'
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
          <SyncCard
            isProcessing={isProcessing}
            onSync={syncToSupabase}
          />

          <Terminal
            logs={logs}
            isProcessing={isProcessing}
            onClearLogs={clearLogs}
          />
        </div>
      </section>
    </div>
  );
} 