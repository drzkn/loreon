import styles from './Card.module.css';

interface CarProps {
  children?: React.ReactNode;
  title: string;
  description?: string;
  titleAs?: 'h2' | 'h3';
}

export const Card = ({
  title,
  description,
  children,
  titleAs = 'h3',
}: CarProps) => {
  const TitleAs = titleAs;

  const titleStyles = {
    h2: styles.title_h2,
    h3: styles.title_h3,
  };

  return (
    <div className={`${styles.container} `}>
      <section className={styles.section}>
        <TitleAs className={titleStyles[titleAs]}>{title}</TitleAs>
        {description && <p className={styles.description}>{description}</p>}
      </section>

      {children}
    </div>
  );
};
