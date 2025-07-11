import styles from './Terminal.module.css';

interface TerminalFooterProps {
  logCount: number;
  isProcessing: boolean;
}

export const TerminalFooter = ({ logCount, isProcessing }: TerminalFooterProps) => {
  return (
    <div className={styles.footerContainer}>
      <span>
        Logs: {logCount}
      </span>
      <span>
        {isProcessing ? '🔄 Procesando...' : '⏸️ Inactivo'}
      </span>
    </div>
  );
}; 