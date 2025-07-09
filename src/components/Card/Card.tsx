import styles from './Card.module.css';

interface SyncCardProps {
  isProcessing: boolean;
  onSync: () => void;
  title: string;
  description: string;
  processingMessagePrimary: string;
  processingMessageSecondary: string;
  buttonTextProcessing: string;
  buttonTextIdle: string;
}

export const Card = ({
  isProcessing,
  onSync,
  title,
  description,
  processingMessagePrimary,
  processingMessageSecondary,
  buttonTextProcessing,
  buttonTextIdle
}: SyncCardProps) => {
  return (
    <div className={`${styles.container} ${isProcessing ? styles.containerProcessing : styles.containerIdle}`}>
      <section className={styles.section}>
        <h3 className={styles.title}>{title}</h3>
        <p className={styles.description}>{description}</p>
      </section>

      <section className={styles.section}>
        {isProcessing && (
          <div className={styles.processingInfo}>
            <div>{processingMessagePrimary}</div>
            <div>{processingMessageSecondary}</div>
          </div>
        )}

        <div className={styles.buttonContainer}>
          <button
            onClick={onSync}
            disabled={isProcessing}
            className={`${styles.button} ${isProcessing ? styles.buttonDisabled : styles.buttonActive}`}
          >
            {isProcessing ? buttonTextProcessing : buttonTextIdle}
          </button>
        </div>
      </section>
    </div>
  );
}; 