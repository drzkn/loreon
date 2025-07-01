"use client";

import { useState, useRef, useEffect } from 'react';

export default function ConnectPage() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [terminalLogs, setTerminalLogs] = useState<string[]>([]);
  const terminalEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [terminalLogs]);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setTerminalLogs(prev => [...prev, `[${timestamp}] ${message}`]);
  };

  const clearLogs = () => {
    setTerminalLogs([]);
  };

  const handleSyncToSupabase = async () => {
    if (isProcessing) return;

    try {
      setIsProcessing(true);
      clearLogs();

      const [response] = await Promise.all([
        fetch('/api/sync-supabase', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        })
      ]);

      const result = await response.json();

      if (!response.ok) {
        addLog(`❌ Error HTTP: ${response.status} - ${result.error}`);
        throw new Error(result.error || `Error HTTP: ${response.status}`);
      }

      addLog('🎉 ¡Sincronización completada exitosamente!');
      console.log('✅ Sincronización completada:', result);

      setTimeout(() => {
        addLog('📊 Resumen:');
        addLog(`💿 Total de databases: ${result.summary.total}`);
        addLog(`✅ Exitosas: ${result.summary.successful}`);
        addLog(`❌ Errores: ${result.summary.errors}`);
      }, 500);

    } catch (error) {
      addLog(`❌ Error en la sincronización: ${error instanceof Error ? error.message : 'Error desconocido'}`);
      console.error('❌ Error en la sincronización:', error);
      alert(`❌ Error en la sincronización: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      setIsProcessing(false);
    }
  };



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
          Sincronización con la base de datos
        </p>
      </header>

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
            border: '1px solid rgba(255, 255, 255, 0.1)',
            height: isProcessing ? '230px' : '185px'
          }}>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>📋 Manual</h3>
            <p style={{ opacity: 0.8 }}>Control total sobre cuándo sincronizar</p>

            {isProcessing && (
              <div style={{
                marginTop: '1rem',
                padding: '0.5rem',
                background: 'rgba(16, 185, 129, 0.1)',
                borderRadius: '6px',
                fontSize: '0.8rem'
              }}>
                <div>🔄 Sincronización en progreso...</div>
                <div>📄 Procesando múltiples databases</div>
              </div>
            )}

            <button
              onClick={handleSyncToSupabase}
              disabled={isProcessing}
              style={{
                marginTop: '1rem',
                padding: '0.5rem 1rem',
                background: isProcessing ? '#6b7280' : '#10b981',
                border: 'none',
                borderRadius: '6px',
                color: 'white',
                fontSize: '0.9rem',
                cursor: isProcessing ? 'not-allowed' : 'pointer',
                opacity: isProcessing ? 0.7 : 1,
                transition: 'all 0.2s ease',
                width: '100%'
              }}
            >
              {isProcessing ? '🔄 Sincronizando...' : '🚀 Sincronizar Ahora'}
            </button>
          </div>

          <div style={{
            background: 'rgba(0, 0, 0, 0.9)',
            backdropFilter: 'blur(10px)',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            overflow: 'hidden'
          }}>
            {/* Terminal Header */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.1)',
              padding: '0.75rem 1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{
                  width: '12px',
                  height: '12px',
                  background: '#ef4444',
                  borderRadius: '50%'
                }}></div>
                <div style={{
                  width: '12px',
                  height: '12px',
                  background: '#f59e0b',
                  borderRadius: '50%'
                }}></div>
                <div style={{
                  width: '12px',
                  height: '12px',
                  background: '#10b981',
                  borderRadius: '50%'
                }}></div>
                <span style={{
                  marginLeft: '1rem',
                  fontSize: '0.9rem',
                  fontWeight: 'bold',
                  color: 'white'
                }}>
                  🖥️ Terminal de Sincronización
                </span>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  onClick={clearLogs}
                  style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: 'none',
                    borderRadius: '4px',
                    padding: '0.25rem 0.5rem',
                    color: 'white',
                    fontSize: '0.8rem',
                    cursor: 'pointer'
                  }}
                >
                  🗑️ Limpiar
                </button>
              </div>
            </div>

            {/* Terminal Content */}
            <div style={{
              padding: '1rem',
              maxHeight: '300px',
              overflowY: 'auto',
              fontFamily: 'Monaco, Consolas, "Courier New", monospace',
              fontSize: '0.85rem',
              lineHeight: '1.4',
              color: '#00ff00'
            }}>
              {terminalLogs.length === 0 ? (
                <div style={{ color: '#6b7280' }}>
                  Esperando logs de sincronización...
                </div>
              ) : (
                terminalLogs.map((log, index) => (
                  <div key={index} style={{
                    marginBottom: '0.25rem',
                    color: log.includes('❌') ? '#ef4444' :
                      log.includes('✅') ? '#10b981' :
                        log.includes('📊') ? '#3b82f6' : '#00ff00'
                  }}>
                    {log}
                  </div>
                ))
              )}
              <div ref={terminalEndRef} />
            </div>

            {/* Terminal Footer */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.05)',
              padding: '0.5rem 1rem',
              borderTop: '1px solid rgba(255, 255, 255, 0.1)',
              fontSize: '0.8rem',
              color: '#6b7280',
              display: 'flex',
              justifyContent: 'space-between'
            }}>
              <span>
                Logs: {terminalLogs.length}
              </span>
              <span>
                {isProcessing ? '🔄 Procesando...' : '⏸️ Inactivo'}
              </span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
} 