import styles from './Card.module.css';

interface SyncCardProps {
  children?: React.ReactNode;
  title: string;
  description: string;
}

export const Card = ({
  title,
  description,
  children
}: SyncCardProps) => {
  return (
    <div className={`${styles.container} `}>
      <section className={styles.section}>
        <h3 className={styles.title}>{title}</h3>
        <p className={styles.description}>{description}</p>
      </section>

      {children}
    </div>
  );
}; 