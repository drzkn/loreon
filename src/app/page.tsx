'use client';

import { Card } from '@/components';
import {
  HomeContainer,
  Header,
  MainTitle,
  Subtitle,
  FeaturesGrid,
  MainSection,
  SectionTitle,
  CharacteristicsGrid,
  CharacteristicItem,
  CharacteristicTitle,
  CharacteristicDescription,
  Footer,
  FooterText
} from './page.styles';

export default function Home() {
  return (
    <HomeContainer>
      <Header>
        <MainTitle>
          🚀 Bienvenido a Loreon
        </MainTitle>
        <Subtitle>
          Tu plataforma integral para gestión de contenido markdown y
          sincronización con bases de datos.
        </Subtitle>
      </Header>

      <FeaturesGrid>
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
      </FeaturesGrid>

      <MainSection>
        <SectionTitle>
          ✨ Características principales
        </SectionTitle>
        <CharacteristicsGrid>
          <CharacteristicItem>
            <CharacteristicTitle>
              🎨 Interfaz moderna
            </CharacteristicTitle>
            <CharacteristicDescription>
              Diseño glassmorphism con navegación intuitiva
            </CharacteristicDescription>
          </CharacteristicItem>
          <CharacteristicItem>
            <CharacteristicTitle>
              📱 Responsive
            </CharacteristicTitle>
            <CharacteristicDescription>
              Optimizado para desktop y móvil
            </CharacteristicDescription>
          </CharacteristicItem>
          <CharacteristicItem>
            <CharacteristicTitle>
              ⚡ Rápido
            </CharacteristicTitle>
            <CharacteristicDescription>
              Built with Next.js 15 y React 19
            </CharacteristicDescription>
          </CharacteristicItem>
          <CharacteristicItem>
            <CharacteristicTitle>
              🔄 Sincronización
            </CharacteristicTitle>
            <CharacteristicDescription>
              Integración en tiempo real con bases de datos
            </CharacteristicDescription>
          </CharacteristicItem>
        </CharacteristicsGrid>
      </MainSection>

      <Footer>
        <FooterText>
          Usa la navegación lateral para explorar todas las funcionalidades →
        </FooterText>
      </Footer>
    </HomeContainer>
  );
}
