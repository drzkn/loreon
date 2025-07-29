'use client';

import { useState } from 'react';

export function TempDebug() {
  const [testResult, setTestResult] = useState<string>('🛠️ Debug cargado - Haz clic en los botones');

  const testEnvVars = () => {
    try {
      console.log('🔍 Probando variables...');

      const envResults = {
        'NEXT_PUBLIC_SUPABASE_URL': process.env.NEXT_PUBLIC_SUPABASE_URL || 'UNDEFINED',
        'NEXT_PUBLIC_SUPABASE_ANON_KEY': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'CONFIGURADA' : 'UNDEFINED',
        'typeof window': typeof window,
        'typeof process': typeof process,
      };

      console.log('🔍 Variables env:', envResults);
      setTestResult(JSON.stringify(envResults, null, 2));

    } catch (error) {
      console.error('❌ Error en test:', error);
      setTestResult(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const testSupabase = async () => {
    try {
      console.log('🧪 Probando conexión...');
      setTestResult('🔄 Probando Supabase...');

      // Test simple de importación
      const supabaseModule = await import('@/adapters/output/infrastructure/supabase');
      console.log('✅ Módulo importado:', Object.keys(supabaseModule));

      const repo = new supabaseModule.SupabaseMarkdownRepository();
      console.log('✅ Repository creado');

      const pages = await repo.findAll({ limit: 3 });
      console.log('✅ Páginas obtenidas:', pages.length);

      setTestResult(`✅ SUPABASE OK!\n- Repository: ✓\n- Páginas: ${pages.length}\n- Primera página: ${pages[0]?.title || 'N/A'}`);

    } catch (error) {
      console.error('❌ Error Supabase:', error);
      setTestResult(`❌ ERROR SUPABASE:\n${error instanceof Error ? error.message : 'Unknown error'}\n\nStack: ${error instanceof Error ? error.stack?.substring(0, 200) : 'N/A'}`);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: '80px',
      right: '10px',
      background: 'rgba(0,0,0,0.95)',
      color: 'white',
      padding: '1rem',
      borderRadius: '8px',
      maxWidth: '450px',
      fontSize: '12px',
      zIndex: 10000,
      fontFamily: 'monospace',
      border: '2px solid #10b981'
    }}>
      <h3 style={{ margin: '0 0 1rem 0', color: '#10b981' }}>🛠️ DEBUG TEMPORAL</h3>
      <div style={{ marginBottom: '1rem' }}>
        <button onClick={testEnvVars} style={{
          background: '#10b981',
          color: 'white',
          border: 'none',
          padding: '8px 12px',
          marginRight: '8px',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '11px'
        }}>
          🔍 Test Variables
        </button>
        <button onClick={testSupabase} style={{
          background: '#3b82f6',
          color: 'white',
          border: 'none',
          padding: '8px 12px',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '11px'
        }}>
          🧪 Test Supabase
        </button>
      </div>
      <pre style={{
        background: 'rgba(255,255,255,0.1)',
        padding: '8px',
        borderRadius: '4px',
        whiteSpace: 'pre-wrap',
        maxHeight: '250px',
        overflow: 'auto',
        margin: 0,
        fontSize: '10px',
        lineHeight: '1.3'
      }}>
        {testResult}
      </pre>
    </div>
  );
} 