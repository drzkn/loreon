import styles from './Terminal.module.css';
import { TerminalHeader } from './TerminalHeader';
import { TerminalLogs } from './TerminalLogs';
import { TerminalFooter } from './TerminalFooter';

interface TerminalProps {
  logs: string[];
  isProcessing: boolean;
  onClearLogs: () => void;
}

export const Terminal = ({ logs, isProcessing, onClearLogs }: TerminalProps) => {
  return (
    <div className={styles.container}>
      <TerminalHeader onClearLogs={onClearLogs} />
      <TerminalLogs logs={logs} />
      <TerminalFooter logCount={logs.length} isProcessing={isProcessing} />
    </div>
  );
}; 