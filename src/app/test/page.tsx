export default function TestPage() {
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
          background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text'
        }}>
          🧪 Tester de Repositorios
        </h1>
        <p style={{
          fontSize: '1.2rem',
          opacity: 0.8,
          lineHeight: '1.6'
        }}>
          Herramientas de testing para validar la integridad de tus repositorios y verificar sincronización de datos.
        </p>
      </header>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
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
            ✅ Validación de archivos
          </h2>
          <p style={{ opacity: 0.8, lineHeight: '1.6', marginBottom: '1rem' }}>
            Verifica la integridad y formato de archivos markdown.
          </p>
          <div style={{
            background: 'rgba(0, 0, 0, 0.3)',
            padding: '1rem',
            borderRadius: '8px',
            fontFamily: 'monospace',
            fontSize: '0.9rem'
          }}>
            <div style={{ color: '#10b981', marginBottom: '0.5rem' }}>✓ README.md - Válido</div>
            <div style={{ color: '#10b981', marginBottom: '0.5rem' }}>✓ guide.md - Válido</div>
            <div style={{ color: '#ef4444' }}>✗ broken.md - Error de sintaxis</div>
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
            🔗 Test de conectividad
          </h2>
          <p style={{ opacity: 0.8, lineHeight: '1.6', marginBottom: '1rem' }}>
            Verifica conexiones con bases de datos y servicios externos.
          </p>
          <div style={{
            background: 'rgba(0, 0, 0, 0.3)',
            padding: '1rem',
            borderRadius: '8px',
            fontFamily: 'monospace',
            fontSize: '0.9rem'
          }}>
            <div style={{ color: '#10b981', marginBottom: '0.5rem' }}>✓ Supabase - Conectado</div>
            <div style={{ color: '#f59e0b', marginBottom: '0.5rem' }}>⚠ Notion - Timeout</div>
            <div style={{ color: '#ef4444' }}>✗ Custom DB - Error</div>
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
            📊 Métricas de rendimiento
          </h2>
          <p style={{ opacity: 0.8, lineHeight: '1.6', marginBottom: '1rem' }}>
            Análisis de performance y tiempo de respuesta.
          </p>
          <div style={{
            background: 'rgba(0, 0, 0, 0.3)',
            padding: '1rem',
            borderRadius: '8px',
            fontFamily: 'monospace',
            fontSize: '0.9rem'
          }}>
            <div style={{ marginBottom: '0.5rem' }}>Tiempo de carga: <span style={{ color: '#10b981' }}>245ms</span></div>
            <div style={{ marginBottom: '0.5rem' }}>Archivos procesados: <span style={{ color: '#3b82f6' }}>1,247</span></div>
            <div>Memoria utilizada: <span style={{ color: '#f59e0b' }}>64MB</span></div>
          </div>
        </div>
      </div>

      <section style={{
        background: 'rgba(245, 158, 11, 0.1)',
        backdropFilter: 'blur(10px)',
        borderRadius: '16px',
        padding: '2rem',
        border: '1px solid rgba(245, 158, 11, 0.3)',
        marginBottom: '2rem'
      }}>
        <h2 style={{
          fontSize: '2rem',
          marginBottom: '1rem',
          color: '#f59e0b'
        }}>
          🔬 Tipos de Tests
        </h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '1.5rem',
          marginTop: '2rem'
        }}>
          <div>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>📝 Sintaxis Markdown</h3>
            <p style={{ opacity: 0.8 }}>Validación de formato y estructura</p>
          </div>
          <div>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>🔗 Enlaces rotos</h3>
            <p style={{ opacity: 0.8 }}>Detección de links internos y externos</p>
          </div>
          <div>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>📷 Imágenes</h3>
            <p style={{ opacity: 0.8 }}>Verificación de recursos multimedia</p>
          </div>
          <div>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>🏗️ Estructura</h3>
            <p style={{ opacity: 0.8 }}>Coherencia en la organización de archivos</p>
          </div>
          <div>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>🔄 Sincronización</h3>
            <p style={{ opacity: 0.8 }}>Consistencia entre diferentes fuentes</p>
          </div>
          <div>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>⚡ Performance</h3>
            <p style={{ opacity: 0.8 }}>Tiempo de carga y optimización</p>
          </div>
        </div>
      </section>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '2rem'
      }}>
        <div style={{
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)',
          borderRadius: '16px',
          padding: '2rem',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>🚀 Ejecutar Tests</h2>
          <p style={{ opacity: 0.8, marginBottom: '1.5rem' }}>
            Inicia una nueva sesión de testing para validar tu repositorio.
          </p>
          <button style={{
            background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
            border: 'none',
            borderRadius: '8px',
            padding: '0.75rem 1.5rem',
            color: 'white',
            fontSize: '1rem',
            fontWeight: 'bold',
            cursor: 'pointer',
            transition: 'transform 0.2s ease'
          }}>
            Ejecutar Tests Completos
          </button>
        </div>

        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(10px)',
          borderRadius: '16px',
          padding: '2rem',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>📋 Último reporte</h2>
          <p style={{ opacity: 0.8, marginBottom: '1rem' }}>
            Resultados del último análisis realizado.
          </p>
          <div style={{ fontSize: '0.9rem', opacity: 0.7 }}>
            <div>Fecha: 28/06/2024 - 14:30</div>
            <div>Duración: 2.3 segundos</div>
            <div style={{ color: '#10b981' }}>Estado: ✓ Exitoso</div>
          </div>
        </div>
      </div>
    </div>
  );
} 