import { useRef, useEffect } from 'react';

interface TerminalLogsProps {
  logs: string[];
}

export const TerminalLogs = ({ logs }: TerminalLogsProps) => {
  const terminalEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  return (
    <div style={{
      padding: '1rem',
      height: '300px',
      overflowY: 'auto',
      fontFamily: 'Monaco, Consolas, "Courier New", monospace',
      fontSize: '0.85rem',
      lineHeight: '1.4',
      color: '#00ff00'
    }}>
      {logs.length === 0 ? (
        <div style={{ color: '#6b7280' }}>
          Esperando logs de sincronización...
        </div>
      ) : (
        logs.map((log, index) => (
          <div key={index} style={{
            marginBottom: '0.25rem',
            color: log.includes('❌') ? '#ef4444' :
              log.includes('✅') ? '#10b981' :
                log.includes('📊') ? '#3b82f6' : '#00ff00'
          }}>
            {log}
          </div>
        ))
      )}
      <div ref={terminalEndRef} />
    </div>
  );
}; 