interface SyncCardProps {
  isProcessing: boolean;
  onSync: () => void;
}

export const SyncCard = ({ isProcessing, onSync }: SyncCardProps) => {
  return (
    <div style={{
      background: 'rgba(255, 255, 255, 0.1)',
      padding: '1.5rem',
      borderRadius: '12px',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      height: isProcessing ? '230px' : '185px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-around',
    }}>
      <section>
        <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>📋 Manual</h3>
        <p style={{ opacity: 0.8 }}>Control total sobre cuándo sincronizar</p>
      </section>

      <section>
        {isProcessing && (
          <div style={{
            marginTop: '1rem',
            padding: '0.5rem',
            background: 'rgba(16, 185, 129, 0.1)',
            borderRadius: '6px',
            fontSize: '0.8rem'
          }}>
            <div>🔄 Sincronización en progreso...</div>
            <div>📄 Procesando múltiples databases</div>
          </div>
        )}

        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
          <button
            onClick={onSync}
            disabled={isProcessing}
            style={{
              padding: '0.5rem 1rem',
              background: isProcessing ? '#6b7280' : '#10b981',
              border: 'none',
              borderRadius: '6px',
              color: 'white',
              fontSize: '0.9rem',
              cursor: isProcessing ? 'not-allowed' : 'pointer',
              opacity: isProcessing ? 0.7 : 1,
              transition: 'all 0.2s ease',
              flex: 1
            }}
          >
            {isProcessing ? '🔄 Sincronizando...' : '🚀 Sincronizar'}
          </button>
        </div>
      </section>
    </div>
  );
}; 