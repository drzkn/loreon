'use client';

import { useState } from 'react';
import {
  Container,
  Title,
  ButtonContainer,
  TestButton,
  SupabaseButton,
  ResultDisplay
} from './TempDebug.styles';

export const TempDebug = () => {
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
    <Container>
      <Title>🛠️ DEBUG TEMPORAL</Title>
      <ButtonContainer>
        <TestButton onClick={testEnvVars}>
          🔍 Test Variables
        </TestButton>
        <SupabaseButton onClick={testSupabase}>
          🧪 Test Supabase
        </SupabaseButton>
      </ButtonContainer>
      <ResultDisplay>
        {testResult}
      </ResultDisplay>
    </Container>
  );
} 