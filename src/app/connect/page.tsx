export default function ConnectPage() {
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
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text'
        }}>
          🔌 Connect & Sync
        </h1>
        <p style={{
          fontSize: '1.2rem',
          opacity: 0.8,
          lineHeight: '1.6'
        }}>
          Conecta y sincroniza con múltiples bases de datos y servicios en la nube.
        </p>
      </header>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
            <div style={{
              width: '48px',
              height: '48px',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.5rem'
            }}>
              🗄️
            </div>
            <div>
              <h2 style={{ fontSize: '1.3rem', margin: 0 }}>Supabase</h2>
              <div style={{
                display: 'inline-block',
                background: '#10b981',
                color: 'white',
                padding: '0.2rem 0.6rem',
                borderRadius: '12px',
                fontSize: '0.8rem',
                fontWeight: 'bold',
                marginTop: '0.3rem'
              }}>
                CONECTADO
              </div>
            </div>
          </div>
          <p style={{ opacity: 0.8, lineHeight: '1.6', marginBottom: '1rem' }}>
            Base de datos PostgreSQL con autenticación y API en tiempo real.
          </p>
          <div style={{
            background: 'rgba(0, 0, 0, 0.3)',
            padding: '1rem',
            borderRadius: '8px',
            fontFamily: 'monospace',
            fontSize: '0.85rem'
          }}>
            <div>Última sincronización: 2 min ago</div>
            <div>Registros: 1,247 documentos</div>
            <div>Estado: ✅ Operativo</div>
          </div>
        </div>

        <div style={{
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)',
          borderRadius: '16px',
          padding: '2rem',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
            <div style={{
              width: '48px',
              height: '48px',
              background: 'linear-gradient(135deg, #000000 0%, #434343 100%)',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.5rem'
            }}>
              📝
            </div>
            <div>
              <h2 style={{ fontSize: '1.3rem', margin: 0 }}>Notion</h2>
              <div style={{
                display: 'inline-block',
                background: '#f59e0b',
                color: 'white',
                padding: '0.2rem 0.6rem',
                borderRadius: '12px',
                fontSize: '0.8rem',
                fontWeight: 'bold',
                marginTop: '0.3rem'
              }}>
                CONFIGURANDO
              </div>
            </div>
          </div>
          <p style={{ opacity: 0.8, lineHeight: '1.6', marginBottom: '1rem' }}>
            Workspace colaborativo para documentos y bases de datos.
          </p>
          <div style={{
            background: 'rgba(0, 0, 0, 0.3)',
            padding: '1rem',
            borderRadius: '8px',
            fontFamily: 'monospace',
            fontSize: '0.85rem'
          }}>
            <div>API Key: Configurando...</div>
            <div>Workspace: No configurado</div>
            <div>Estado: ⚠️ Pendiente</div>
          </div>
        </div>

        <div style={{
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)',
          borderRadius: '16px',
          padding: '2rem',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
            <div style={{
              width: '48px',
              height: '48px',
              background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.5rem'
            }}>
              🔗
            </div>
            <div>
              <h2 style={{ fontSize: '1.3rem', margin: 0 }}>API Custom</h2>
              <div style={{
                display: 'inline-block',
                background: '#6b7280',
                color: 'white',
                padding: '0.2rem 0.6rem',
                borderRadius: '12px',
                fontSize: '0.8rem',
                fontWeight: 'bold',
                marginTop: '0.3rem'
              }}>
                NO CONFIGURADO
              </div>
            </div>
          </div>
          <p style={{ opacity: 0.8, lineHeight: '1.6', marginBottom: '1rem' }}>
            Conecta con tu propia API o servicio personalizado.
          </p>
          <div style={{
            background: 'rgba(0, 0, 0, 0.3)',
            padding: '1rem',
            borderRadius: '8px',
            fontFamily: 'monospace',
            fontSize: '0.85rem'
          }}>
            <div>Endpoint: No configurado</div>
            <div>Autenticación: Pendiente</div>
            <div>Estado: ⭕ Desconectado</div>
          </div>
        </div>
      </div>

      <section style={{
        background: 'rgba(16, 185, 129, 0.1)',
        backdropFilter: 'blur(10px)',
        borderRadius: '16px',
        padding: '2rem',
        border: '1px solid rgba(16, 185, 129, 0.3)',
        marginBottom: '2rem'
      }}>
        <h2 style={{
          fontSize: '2rem',
          marginBottom: '1rem',
          color: '#10b981'
        }}>
          🔄 Opciones de Sincronización
        </h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1.5rem',
          marginTop: '2rem'
        }}>
          <div style={{
            background: 'rgba(255, 255, 255, 0.1)',
            padding: '1.5rem',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>⚡ Tiempo Real</h3>
            <p style={{ opacity: 0.8 }}>Sincronización instantánea de cambios</p>
            <div style={{
              marginTop: '1rem',
              padding: '0.5rem',
              background: 'rgba(16, 185, 129, 0.2)',
              borderRadius: '6px',
              fontSize: '0.9rem'
            }}>
              Activo en Supabase
            </div>
          </div>
          <div style={{
            background: 'rgba(255, 255, 255, 0.1)',
            padding: '1.5rem',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>🕐 Programada</h3>
            <p style={{ opacity: 0.8 }}>Sincronización en intervalos específicos</p>
            <div style={{
              marginTop: '1rem',
              padding: '0.5rem',
              background: 'rgba(245, 158, 11, 0.2)',
              borderRadius: '6px',
              fontSize: '0.9rem'
            }}>
              Cada 15 minutos
            </div>
          </div>
          <div style={{
            background: 'rgba(255, 255, 255, 0.1)',
            padding: '1.5rem',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>📋 Manual</h3>
            <p style={{ opacity: 0.8 }}>Control total sobre cuándo sincronizar</p>
            <button style={{
              marginTop: '1rem',
              padding: '0.5rem 1rem',
              background: '#10b981',
              border: 'none',
              borderRadius: '6px',
              color: 'white',
              fontSize: '0.9rem',
              cursor: 'pointer'
            }}>
              Sincronizar Ahora
            </button>
          </div>
        </div>
      </section>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '2fr 1fr',
        gap: '2rem'
      }}>
        <div style={{
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)',
          borderRadius: '16px',
          padding: '2rem',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>📊 Estadísticas de Sync</h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '1rem',
            marginBottom: '1.5rem'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#10b981' }}>1,247</div>
              <div style={{ opacity: 0.7, fontSize: '0.9rem' }}>Documentos sincronizados</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#3b82f6' }}>98.7%</div>
              <div style={{ opacity: 0.7, fontSize: '0.9rem' }}>Tasa de éxito</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#f59e0b' }}>2.3s</div>
              <div style={{ opacity: 0.7, fontSize: '0.9rem' }}>Tiempo promedio</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#ef4444' }}>3</div>
              <div style={{ opacity: 0.7, fontSize: '0.9rem' }}>Errores hoy</div>
            </div>
          </div>
        </div>

        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(10px)',
          borderRadius: '16px',
          padding: '2rem',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>⚙️ Configuración</h2>
          <div style={{ fontSize: '0.9rem', opacity: 0.8 }}>
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>Conexiones activas</div>
              <div>• Supabase: ✅ Activa</div>
              <div>• Notion: ⚠️ Configurando</div>
              <div>• Custom API: ❌ Inactiva</div>
            </div>
            <button style={{
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              border: 'none',
              borderRadius: '8px',
              padding: '0.75rem 1rem',
              color: 'white',
              fontSize: '0.9rem',
              fontWeight: 'bold',
              cursor: 'pointer',
              width: '100%'
            }}>
              Gestionar Conexiones
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 