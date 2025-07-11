import styles from './Terminal.module.css';

interface TerminalHeaderProps {
  onClearLogs: () => void;
}

export const TerminalHeader = ({ onClearLogs }: TerminalHeaderProps) => {
  return (
    <div className={styles.headerContainer}>
      <div className={styles.headerLeftSection}>
        <div className={`${styles.headerDot} ${styles.headerDotRed}`}></div>
        <div className={`${styles.headerDot} ${styles.headerDotYellow}`}></div>
        <div className={`${styles.headerDot} ${styles.headerDotGreen}`}></div>
        <span className={styles.headerTitle}>
          🖥️ Terminal de Sincronización
        </span>
      </div>
      <div className={styles.headerRightSection}>
        <button
          onClick={onClearLogs}
          className={styles.headerButton}
        >
          🗑️ Limpiar
        </button>
      </div>
    </div>
  );
}; 