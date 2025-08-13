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
  ErrorMessage
} from './page.styles';
import { Icon } from '@/components';

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { isAuthenticated, signInWithGoogle } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, router]);


  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError(null);

    try {
      await signInWithGoogle();
    } catch (error) {
      console.error('Error en login:', error);

      let errorMessage = 'Error al conectar con Google. ';

      if (error instanceof Error) {
        errorMessage += error.message;
      } else {
        errorMessage += 'Por favor, inténtalo de nuevo.';
      }

      setError(errorMessage);
      setIsLoading(false);
    }
  };

  return (
    <LoginContainer>
      <LoginCard>
        <Logo>
          <Icon name="rocket" size="xxl" />
          <LoginTitle>Loreon AI</LoginTitle>
        </Logo>

        <div>
          <p style={{
            textAlign: 'center',
            marginBottom: '2rem',
            color: 'var(--text-secondary)',
            fontSize: '0.95rem'
          }}>
            Inicia sesión para continuar
          </p>

          {error && <ErrorMessage>{error}</ErrorMessage>}

          <LoginButton
            onClick={handleGoogleLogin}
            disabled={isLoading}
          >
            {isLoading ? 'Conectando...' : (
              <>
                Continuar con Google <Icon name='google' />
              </>
            )}
          </LoginButton>
        </div>

        <p style={{
          textAlign: 'center',
          fontSize: '0.8rem',
          color: 'var(--text-secondary)',
          opacity: 0.7
        }}>
          Después podrás configurar tus integraciones en Ajustes
        </p>
      </LoginCard>
    </LoginContainer>
  );
}