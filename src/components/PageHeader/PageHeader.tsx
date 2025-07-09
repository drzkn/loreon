interface PageHeaderProps {
  title: string;
  description: string;
}

export const PageHeader = ({ title, description }: PageHeaderProps) => {
  return (
    <header style={{ marginBottom: '3rem' }}>
      <h1 style={{
        fontSize: '3rem',
        fontWeight: 'bold',
        marginBottom: '1rem',
        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text'
      }}>
        {title}
      </h1>
      <p style={{
        fontSize: '1.2rem',
        opacity: 0.8,
        lineHeight: '1.6'
      }}>
        {description}
      </p>
    </header>
  );
}; 