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
    <div style={{
      background: 'rgba(0, 0, 0, 0.9)',
      backdropFilter: 'blur(10px)',
      borderRadius: '12px',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      overflow: 'hidden'
    }}>
      <TerminalHeader onClearLogs={onClearLogs} />
      <TerminalLogs logs={logs} />
      <TerminalFooter logCount={logs.length} isProcessing={isProcessing} />
    </div>
  );
}; 