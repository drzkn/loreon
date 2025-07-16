import { Card } from '@/components';

export default function Home() {
  return (
    <div
      style={{
        maxWidth: '1200px',
        margin: '0 auto',
        color: 'white',
        fontFamily: 'var(--font-geist-sans)',
      }}
    >
      <header style={{ marginBottom: '3rem' }}>
        <h1
          style={{
            fontSize: '3rem',
            fontWeight: 'bold',
            marginBottom: '1rem',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          🚀 Bienvenido a Loreon
        </h1>
        <p
          style={{
            fontSize: '1.2rem',
            opacity: 0.8,
            lineHeight: '1.6',
          }}
        >
          Tu plataforma integral para gestión de contenido markdown y
          sincronización con bases de datos.
        </p>
      </header>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '2rem',
          marginBottom: '3rem',
        }}
      >
        <Card
          title='📚 Visualizador'
          description='Explora y visualiza archivos markdown de manera elegante.
            Renderizado en tiempo real con soporte completo de sintaxis.'
          titleAs='h2'
        />

        <Card
          title='🧪 Tester'
          description='Herramientas de testing para validar la integridad de tus
            repositorios y verificar la sincronización de datos.'
          titleAs='h2'
        />

        <Card
          title='🔌 Connect'
          description='Conecta y sincroniza con múltiples bases de datos. Soporte para
            Notion, Supabase y más integraciones.'
          titleAs='h2'
        />
      </div>

      <section
        style={{
          background: 'rgba(16, 185, 129, 0.1)',
          backdropFilter: 'blur(10px)',
          borderRadius: '16px',
          padding: '2rem',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          textAlign: 'center',
        }}
      >
        <h2
          style={{
            fontSize: '2rem',
            marginBottom: '1rem',
            color: '#10b981',
          }}
        >
          ✨ Características principales
        </h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '1.5rem',
            marginTop: '2rem',
          }}
        >
          <div>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>
              🎨 Interfaz moderna
            </h3>
            <p style={{ opacity: 0.8 }}>
              Diseño glassmorphism con navegación intuitiva
            </p>
          </div>
          <div>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>
              📱 Responsive
            </h3>
            <p style={{ opacity: 0.8 }}>Optimizado para desktop y móvil</p>
          </div>
          <div>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>
              ⚡ Rápido
            </h3>
            <p style={{ opacity: 0.8 }}>Built with Next.js 15 y React 19</p>
          </div>
          <div>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>
              🔄 Sincronización
            </h3>
            <p style={{ opacity: 0.8 }}>
              Integración en tiempo real con bases de datos
            </p>
          </div>
        </div>
      </section>

      <footer
        style={{
          textAlign: 'center',
          marginTop: '3rem',
          padding: '2rem',
          opacity: 0.6,
        }}
      >
        <p>
          Usa la navegación lateral para explorar todas las funcionalidades →
        </p>
      </footer>
    </div>
  );
}
