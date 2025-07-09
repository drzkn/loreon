interface TerminalHeaderProps {
  onClearLogs: () => void;
}

export const TerminalHeader = ({ onClearLogs }: TerminalHeaderProps) => {
  return (
    <div style={{
      background: 'rgba(255, 255, 255, 0.1)',
      padding: '0.75rem 1rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <div style={{
          width: '12px',
          height: '12px',
          background: '#ef4444',
          borderRadius: '50%'
        }}></div>
        <div style={{
          width: '12px',
          height: '12px',
          background: '#f59e0b',
          borderRadius: '50%'
        }}></div>
        <div style={{
          width: '12px',
          height: '12px',
          background: '#10b981',
          borderRadius: '50%'
        }}></div>
        <span style={{
          marginLeft: '1rem',
          fontSize: '0.9rem',
          fontWeight: 'bold',
          color: 'white'
        }}>
          🖥️ Terminal de Sincronización
        </span>
      </div>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button
          onClick={onClearLogs}
          style={{
            background: 'rgba(255, 255, 255, 0.1)',
            border: 'none',
            borderRadius: '4px',
            padding: '0.25rem 0.5rem',
            color: 'white',
            fontSize: '0.8rem',
            cursor: 'pointer'
          }}
        >
          🗑️ Limpiar
        </button>
      </div>
    </div>
  );
}; 