export default function VisualizerPage() {
  return (
    <div style={{
      maxWidth: '1200px',
      margin: '0 auto',
      color: 'white',
      fontFamily: 'var(--font-geist-sans)'
    }}>
      <header style={{ marginBottom: '3rem' }}>
        <h1 style={{
          fontSize: '3rem',
          fontWeight: 'bold',
          marginBottom: '1rem',
          background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text'
        }}>
          📚 Visualizador Markdown
        </h1>
        <p style={{
          fontSize: '1.2rem',
          opacity: 0.8,
          lineHeight: '1.6'
        }}>
          Explora, renderiza y visualiza archivos markdown con soporte completo de sintaxis.
        </p>
      </header>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '2rem',
        marginBottom: '3rem'
      }}>
        <div style={{
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)',
          borderRadius: '16px',
          padding: '2rem',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          <h2 style={{
            fontSize: '1.5rem',
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            📂 Explorador de archivos
          </h2>
          <p style={{ opacity: 0.8, lineHeight: '1.6', marginBottom: '1rem' }}>
            Navega por tu estructura de archivos markdown de manera intuitiva.
          </p>
          <div style={{
            background: 'rgba(0, 0, 0, 0.3)',
            padding: '1rem',
            borderRadius: '8px',
            fontFamily: 'monospace',
            fontSize: '0.9rem'
          }}>
            📁 docs/<br />
            ├── 📄 README.md<br />
            ├── 📄 guide.md<br />
            └── 📁 examples/<br />
            &nbsp;&nbsp;&nbsp;&nbsp;├── 📄 basic.md<br />
            &nbsp;&nbsp;&nbsp;&nbsp;└── 📄 advanced.md
          </div>
        </div>

        <div style={{
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)',
          borderRadius: '16px',
          padding: '2rem',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          <h2 style={{
            fontSize: '1.5rem',
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            🎨 Vista previa en tiempo real
          </h2>
          <p style={{ opacity: 0.8, lineHeight: '1.6', marginBottom: '1rem' }}>
            Renderizado instantáneo con soporte completo de Markdown y sintaxis extendida.
          </p>
          <div style={{
            background: 'rgba(0, 0, 0, 0.3)',
            padding: '1rem',
            borderRadius: '8px',
            fontSize: '0.9rem'
          }}>
            <h3 style={{ color: '#3b82f6', margin: '0 0 0.5rem 0' }}>Ejemplo de Markdown</h3>
            <p style={{ margin: '0 0 0.5rem 0' }}>Texto normal con <strong>negrita</strong> y <em>cursiva</em></p>
            <code style={{ background: 'rgba(255, 255, 255, 0.1)', padding: '0.2rem 0.4rem', borderRadius: '4px' }}>
              código inline
            </code>
          </div>
        </div>
      </div>

      <section style={{
        background: 'rgba(59, 130, 246, 0.1)',
        backdropFilter: 'blur(10px)',
        borderRadius: '16px',
        padding: '2rem',
        border: '1px solid rgba(59, 130, 246, 0.3)',
        marginBottom: '2rem'
      }}>
        <h2 style={{
          fontSize: '2rem',
          marginBottom: '1rem',
          color: '#3b82f6'
        }}>
          ✨ Funcionalidades
        </h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '1.5rem',
          marginTop: '2rem'
        }}>
          <div>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>📝 Sintaxis extendida</h3>
            <p style={{ opacity: 0.8 }}>Soporte para tablas, listas de tareas, código con resaltado</p>
          </div>
          <div>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>🔍 Búsqueda avanzada</h3>
            <p style={{ opacity: 0.8 }}>Encuentra contenido específico en todos tus archivos</p>
          </div>
          <div>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>📱 Responsive</h3>
            <p style={{ opacity: 0.8 }}>Visualización optimizada para cualquier dispositivo</p>
          </div>
          <div>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>🎯 Performance</h3>
            <p style={{ opacity: 0.8 }}>Renderizado rápido y eficiente de archivos grandes</p>
          </div>
        </div>
      </section>

      <div style={{
        background: 'rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(10px)',
        borderRadius: '16px',
        padding: '2rem',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        textAlign: 'center'
      }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>🚧 En desarrollo</h2>
        <p style={{ opacity: 0.8 }}>
          Esta funcionalidad está siendo desarrollada. Pronto podrás visualizar y editar archivos markdown directamente desde aquí.
        </p>
      </div>
    </div>
  );
} 