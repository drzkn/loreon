'use client';

import Link from 'next/link';
import { LoginContainer, LoginCard, LoginTitle, Logo } from '../login/page.styles';
import { Icon } from '@/components';
import styled from 'styled-components';

const InstructionsContainer = styled.div`
  max-width: 600px;
  margin: 0 auto;
`;

const Step = styled.div`
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 1rem;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
`;

const StepNumber = styled.div`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  background: linear-gradient(135deg, #10b981, #059669);
  color: white;
  border-radius: 50%;
  font-weight: 600;
  font-size: 0.9rem;
  margin-bottom: 1rem;
`;

const StepTitle = styled.h3`
  color: var(--text-primary);
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0 0 0.75rem 0;
`;

const StepDescription = styled.p`
  color: var(--text-secondary);
  line-height: 1.6;
  margin: 0 0 1rem 0;
`;

const CodeBlock = styled.code`
  background: rgba(0, 0, 0, 0.3);
  padding: 0.25rem 0.5rem;
  border-radius: 0.375rem;
  font-family: monospace;
  font-size: 0.85rem;
  color: #10b981;
`;

const BackButton = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: rgba(255, 255, 255, 0.05);
  color: var(--text-primary);
  text-decoration: none;
  border-radius: 0.75rem;
  transition: all 0.2s ease;
  font-size: 0.9rem;
  
  &:hover {
    background: rgba(255, 255, 255, 0.08);
    transform: translateX(-2px);
  }
`;

const ExternalLink = styled.a`
  color: #10b981;
  text-decoration: none;
  
  &:hover {
    text-decoration: underline;
  }
`;

export default function InstructionsPage() {
  return (
    <LoginContainer>
      <InstructionsContainer>
        <LoginCard>
          <Logo>
            <Icon name="info" size="xl" />
            <LoginTitle>Cómo obtener tu Token de Notion</LoginTitle>
          </Logo>

          <div>
            <Step>
              <StepNumber>1</StepNumber>
              <StepTitle>Ve a tus integraciones de Notion</StepTitle>
              <StepDescription>
                Abre <ExternalLink href="https://www.notion.so/my-integrations" target="_blank">
                  notion.so/my-integrations
                </ExternalLink> en tu navegador e inicia sesión con tu cuenta de Notion.
              </StepDescription>
            </Step>

            <Step>
              <StepNumber>2</StepNumber>
              <StepTitle>Crea una nueva integración</StepTitle>
              <StepDescription>
                Haz clic en <strong>"+ Nueva integración"</strong> y rellena la información:
              </StepDescription>
              <ul style={{ color: 'var(--text-secondary)', paddingLeft: '1.5rem' }}>
                <li><strong>Nombre:</strong> Loreon AI (o el nombre que prefieras)</li>
                <li><strong>Espacio de trabajo:</strong> Selecciona tu espacio de trabajo</li>
                <li><strong>Tipo:</strong> Integración interna</li>
              </ul>
            </Step>

            <Step>
              <StepNumber>3</StepNumber>
              <StepTitle>Copia tu token</StepTitle>
              <StepDescription>
                Una vez creada la integración, verás una sección llamada <strong>"Secrets"</strong>.
                Copia el token que aparece ahí. Normalmente empieza con <CodeBlock>secret_</CodeBlock> o <CodeBlock>ntn_</CodeBlock>
              </StepDescription>
            </Step>

            <Step>
              <StepNumber>4</StepNumber>
              <StepTitle>Conecta tus páginas (opcional)</StepTitle>
              <StepDescription>
                Para que Loreon pueda acceder a tus páginas de Notion, ve a las páginas que quieras compartir,
                haz clic en los tres puntos (⋯) → <strong>"Agregar conexiones"</strong> → busca y selecciona tu integración.
              </StepDescription>
            </Step>

            <div style={{
              background: 'rgba(59, 130, 246, 0.1)',
              border: '1px solid rgba(59, 130, 246, 0.2)',
              padding: '1rem',
              borderRadius: '0.75rem',
              marginBottom: '2rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <Icon name="info" size="sm" />
                <strong style={{ color: '#60a5fa' }}>Información importante</strong>
              </div>
              <p style={{ color: '#93c5fd', fontSize: '0.9rem', margin: 0, lineHeight: 1.5 }}>
                Tu token se guarda únicamente en tu navegador y nunca se envía a nuestros servidores.
                Solo se usa para conectar directamente con la API de Notion.
              </p>
            </div>

            <BackButton href="/auth/login">
              <Icon name="chevron-left" size="sm" />
              Volver al login
            </BackButton>
          </div>
        </LoginCard>
      </InstructionsContainer>
    </LoginContainer>
  );
}