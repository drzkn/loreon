interface TerminalFooterProps {
  logCount: number;
  isProcessing: boolean;
}

export const TerminalFooter = ({ logCount, isProcessing }: TerminalFooterProps) => {
  return (
    <div style={{
      background: 'rgba(255, 255, 255, 0.05)',
      padding: '0.5rem 1rem',
      borderTop: '1px solid rgba(255, 255, 255, 0.1)',
      fontSize: '0.8rem',
      color: '#6b7280',
      display: 'flex',
      justifyContent: 'space-between'
    }}>
      <span>
        Logs: {logCount}
      </span>
      <span>
        {isProcessing ? '🔄 Procesando...' : '⏸️ Inactivo'}
      </span>
    </div>
  );
}; 