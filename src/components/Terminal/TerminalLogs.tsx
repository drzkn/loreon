"use client"
import { useRef, useEffect } from 'react';
import { LogsContainer, LogsEmptyState, LogsEntry } from './Terminal.styles';

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

  const getLogType = (log: string): 'error' | 'success' | 'info' | 'default' => {
    if (log.includes('❌')) return 'error';
    if (log.includes('✅')) return 'success';
    if (log.includes('📊')) return 'info';
    return 'default';
  };

  return (
    <LogsContainer>
      {logs.length === 0 ? (
        <LogsEmptyState>
          Esperando logs de sincronización...
        </LogsEmptyState>
      ) : (
        logs.map((log, index) => (
          <LogsEntry key={index} logType={getLogType(log)}>
            {log}
          </LogsEntry>
        ))
      )}
      <div ref={terminalEndRef} />
    </LogsContainer>
  );
}; 