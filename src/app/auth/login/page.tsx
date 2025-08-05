'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import {
  LoginContainer,
  LoginCard,
  LoginTitle,
  LoginButton,
  Logo,
  ErrorMessage,
  TokenInput,
  InputLabel,
  InstructionsLink,
  ExistingTokenButton
} from './page.styles';
import { Icon } from '@/components';

export default function LoginPage() {
  const router = useRouter();
  const [token, setToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showTokenInput, setShowTokenInput] = useState(false);

  const { isAuthenticated, signInWithNotion, hasNotionToken } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    // Si ya hay token configurado, mostrar opción de login directo
    if (hasNotionToken()) {
      setShowTokenInput(false);
    } else {
      setShowTokenInput(true);
    }
  }, []);

  const handleTokenLogin = async () => {
    console.log('🚀 [LOGIN] Iniciando proceso de login...');

    if (!token.trim()) {
      console.log('❌ [LOGIN] Token vacío');
      setError('Por favor, introduce tu token personal de Notion');
      return;
    }

    console.log('🔍 [LOGIN] Token recibido:', token.substring(0, 10) + '...');
    setIsLoading(true);
    setError(null);

    try {
      console.log('🔐 [LOGIN] Llamando a signInWithNotion...');
      await signInWithNotion(token.trim());
      console.log('✅ [LOGIN] Login exitoso, redirigiendo...');
      router.push('/');
    } catch (error) {
      console.error('Error en login:', error);

      let errorMessage = 'Error al conectar con Notion. ';

      if (error instanceof Error) {
        if (error.message.includes('Formato de token inválido')) {
          errorMessage = 'El token debe empezar con "secret_" o "ntn_". Verifica que hayas copiado el token completo.';
        } else if (error.message.includes('Token inválido')) {
          errorMessage = 'Token inválido. Verifica que el token sea correcto y tenga permisos.';
        } else {
          errorMessage += error.message;
        }
      } else {
        errorMessage += 'Por favor, inténtalo de nuevo.';
      }

      setError(errorMessage);
      setIsLoading(false);
    }
  };

  const handleExistingTokenLogin = async () => {
    console.log('🔄 [LOGIN] Iniciando login con token existente...');
    setIsLoading(true);
    setError(null);

    try {
      console.log('🔐 [LOGIN] Usando token guardado...');
      await signInWithNotion(); // Sin token, usa el existente
      console.log('✅ [LOGIN] Login con token existente exitoso...');
      router.push('/');
    } catch (error) {
      console.error('Error en login:', error);

      let errorMessage = 'Error al conectar con el token guardado. ';

      if (error instanceof Error) {
        if (error.message.includes('No hay token personal configurado')) {
          errorMessage = 'No hay token configurado. Introduce tu token personal.';
          setShowTokenInput(true);
        } else {
          errorMessage += error.message;
        }
      }

      setError(errorMessage);
      setIsLoading(false);
    }
  };

  return (
    <LoginContainer>
      <LoginCard>
        <Logo>
          <Icon name="rocket" size="2xl" />
          <LoginTitle>Loreon AI</LoginTitle>
        </Logo>

        <div>
          <p style={{
            textAlign: 'center',
            marginBottom: '2rem',
            color: 'var(--text-secondary)',
            fontSize: '0.95rem'
          }}>
            {showTokenInput
              ? 'Conecta tu espacio de trabajo de Notion'
              : 'Bienvenido de vuelta'}
          </p>

          {error && <ErrorMessage>{error}</ErrorMessage>}

          {showTokenInput ? (
            // Mostrar formulario de token para nuevos usuarios
            <>
              <div style={{ marginBottom: '1.5rem' }}>
                <InputLabel>Token Personal de Notion</InputLabel>
                <TokenInput
                  type="password"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="secret_... o ntn_..."
                  disabled={isLoading}
                />
              </div>

              <LoginButton
                onClick={handleTokenLogin}
                disabled={isLoading || !token.trim()}
              >
                <Icon name="rocket" size="lg" />
                {isLoading ? 'Validando token...' : 'Conectar con Notion'}
              </LoginButton>

              <InstructionsLink href="/auth/instructions" target="_blank">
                <Icon name="info" size="sm" />
                ¿Cómo obtengo mi token?
              </InstructionsLink>
            </>
          ) : (
            // Mostrar botón de login directo para usuarios existentes
            <>
              <ExistingTokenButton
                onClick={handleExistingTokenLogin}
                disabled={isLoading}
              >
                <Icon name="rocket" size="lg" />
                {isLoading ? 'Conectando...' : 'Conectar con Notion'}
              </ExistingTokenButton>

              <button
                onClick={() => setShowTokenInput(true)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  marginTop: '1rem',
                  width: '100%'
                }}
              >
                Usar un token diferente
              </button>
            </>
          )}
        </div>

        <p style={{
          textAlign: 'center',
          fontSize: '0.8rem',
          color: 'var(--text-secondary)',
          opacity: 0.7
        }}>
          {showTokenInput
            ? 'Tu token se guarda de forma segura en tu navegador'
            : 'Usamos tu token guardado para conectar automáticamente'}
        </p>
      </LoginCard>
    </LoginContainer>
  );
}