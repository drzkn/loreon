"use client"
import { useRef, useEffect } from 'react';
import styles from './Terminal.module.css';

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

  const getLogClassName = (log: string) => {
    if (log.includes('❌')) return `${styles.logsEntry} ${styles.logsError}`;
    if (log.includes('✅')) return `${styles.logsEntry} ${styles.logsSuccess}`;
    if (log.includes('📊')) return `${styles.logsEntry} ${styles.logsInfo}`;
    return `${styles.logsEntry} ${styles.logsDefault}`;
  };

  return (
    <div className={styles.logsContainer}>
      {logs.length === 0 ? (
        <div className={styles.logsEmptyState}>
          Esperando logs de sincronización...
        </div>
      ) : (
        logs.map((log, index) => (
          <div key={index} className={getLogClassName(log)}>
            {log}
          </div>
        ))
      )}
      <div ref={terminalEndRef} />
    </div>
  );
}; 