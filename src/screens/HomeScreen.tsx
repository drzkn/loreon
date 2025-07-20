'use client';

import React from 'react';
import styled from 'styled-components';
import { Card, Button } from '../components';

const HomeContainer = styled.div`
  min-height: 100vh;
  padding: ${({ theme }) => theme.spacing.xl};
  background: ${({ theme }) => theme.colors.bgGradient};
`;

const HomeContent = styled.div`
  max-width: 1200px;
  margin: 0 auto;
`;

const HomeHeader = styled.header`
  text-align: center;
  margin-bottom: ${({ theme }) => theme.spacing['3xl']};
`;

const HomeTitle = styled.h1`
  font-size: ${({ theme }) => theme.fontSize['5xl']};
  font-weight: bold;
  margin-bottom: ${({ theme }) => theme.spacing.md};
  color: ${({ theme }) => theme.colors.textPrimary};
  background: linear-gradient(135deg, ${({ theme }) => theme.colors.primary500}, ${({ theme }) => theme.colors.secondary500});
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;

const HomeSubtitle = styled.p`
  font-size: ${({ theme }) => theme.fontSize.xl};
  color: ${({ theme }) => theme.colors.textSecondary};
  line-height: 1.6;
`;

const FeaturesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: ${({ theme }) => theme.spacing.xl};
  margin-bottom: ${({ theme }) => theme.spacing['3xl']};

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: ${({ theme }) => theme.spacing.lg};
  }
`;

const FeatureCard = styled(Card)`
  &:nth-child(1) .button {
    --variant-color: ${({ theme }) => theme.colors.primary600};
  }
  
  &:nth-child(2) .button {
    --variant-color: ${({ theme }) => theme.colors.success};
  }
  
  &:nth-child(3) .button {
    --variant-color: ${({ theme }) => theme.colors.warning};
  }
  
  &:nth-child(4) .button {
    --variant-color: ${({ theme }) => theme.colors.secondary600};
  }
`;

const ButtonGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: ${({ theme }) => theme.spacing.md};
  margin-top: ${({ theme }) => theme.spacing['2xl']};
`;

const DemoSection = styled.section`
  background: ${({ theme }) => theme.colors.glassLight};
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  padding: ${({ theme }) => theme.spacing.xl};
  backdrop-filter: blur(10px);
`;

const SectionTitle = styled.h2`
  color: ${({ theme }) => theme.colors.textPrimary};
  font-size: ${({ theme }) => theme.fontSize['2xl']};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
  text-align: center;
`;

export const HomeScreen: React.FC = () => {
  return (
    <HomeContainer>
      <HomeContent>
        <HomeHeader>
          <HomeTitle>Bienvenido a Loreon</HomeTitle>
          <HomeSubtitle>
            Tu plataforma de gestión de contenido con Notion, Supabase y Styled Components
          </HomeSubtitle>
        </HomeHeader>

        <FeaturesGrid>
          <FeatureCard
            title="Notion Integration"
            description="Conecta y sincroniza tu contenido desde Notion de forma automática"
          >
            <Button variant="primary" size="md">
              Configurar Notion
            </Button>
          </FeatureCard>

          <FeatureCard
            title="Supabase Backend"
            description="Base de datos en tiempo real con autenticación segura"
          >
            <Button variant="success" size="md">
              Ver Dashboard
            </Button>
          </FeatureCard>

          <FeatureCard
            title="Testing Suite"
            description="Suite completa de tests con cobertura del 80%+"
          >
            <Button variant="warning" size="md">
              Ejecutar Tests
            </Button>
          </FeatureCard>

          <FeatureCard
            title="Styled Components"
            description="CSS-in-JS con temas personalizados y componentes reutilizables"
          >
            <Button variant="secondary" size="md">
              Ver Componentes
            </Button>
          </FeatureCard>
        </FeaturesGrid>

        <DemoSection>
          <SectionTitle>Demostración de Styled Components</SectionTitle>
          <ButtonGrid>
            <Button variant="primary" size="sm">
              Botón Pequeño
            </Button>
            <Button variant="secondary" size="md">
              Botón Mediano
            </Button>
            <Button variant="success" size="lg">
              Botón Grande
            </Button>
            <Button variant="warning" fullWidth>
              Botón Completo
            </Button>
            <Button variant="error" disabled>
              Botón Deshabilitado
            </Button>
          </ButtonGrid>
        </DemoSection>
      </HomeContent>
    </HomeContainer>
  );
};

export default HomeScreen;
