'use client';

import { LoginContainer, LoginCard, LoginTitle, Logo } from '../login/page.styles';
import { Icon } from '@/components';
import {
  InstructionsContainer,
  Step,
  StepNumber,
  StepTitle,
  StepDescription,
  CodeBlock,
  BackButton,
  ExternalLink,
  InfoBox,
  InfoHeader,
  InfoTitle,
  InfoText,
  StepList
} from './page.styles';

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
                Haz clic en <strong>&quot;+ Nueva integración&quot;</strong> y rellena la información:
              </StepDescription>
              <StepList>
                <li><strong>Nombre:</strong> Loreon AI (o el nombre que prefieras)</li>
                <li><strong>Espacio de trabajo:</strong> Selecciona tu espacio de trabajo</li>
                <li><strong>Tipo:</strong> Integración interna</li>
              </StepList>
            </Step>

            <Step>
              <StepNumber>3</StepNumber>
              <StepTitle>Copia tu token</StepTitle>
              <StepDescription>
                Una vez creada la integración, verás una sección llamada <strong>&quot;Secrets&quot;</strong>.
                Copia el token que aparece ahí. Normalmente empieza con <CodeBlock>secret_</CodeBlock> o <CodeBlock>ntn_</CodeBlock>
              </StepDescription>
            </Step>

            <Step>
              <StepNumber>4</StepNumber>
              <StepTitle>Conecta tus páginas (opcional)</StepTitle>
              <StepDescription>
                Para que Loreon pueda acceder a tus páginas de Notion, ve a las páginas que quieras compartir,
                haz clic en los tres puntos (⋯) → <strong>&quot;Agregar conexiones&quot;</strong> → busca y selecciona tu integración.
              </StepDescription>
            </Step>

            <InfoBox>
              <InfoHeader>
                <Icon name="info" size="sm" />
                <InfoTitle>Información importante</InfoTitle>
              </InfoHeader>
              <InfoText>
                Tu token se guarda únicamente en tu navegador y nunca se envía a nuestros servidores.
                Solo se usa para conectar directamente con la API de Notion.
              </InfoText>
            </InfoBox>

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