'use client';

import { useRouter, usePathname } from 'next/navigation';
import { Icon } from '@/components';
import { SyncTab } from './components/SyncTab';
import {
  SettingsContainer,
  SettingsHeader,
  SettingsTitle,
  TabsContainer,
  Tab,
  TabIcon,
  TabLabel,
  ContentContainer,
  SettingsSection,
  SectionTitle,
  SectionDescription,
  SettingItem,
  SettingLabel,
  SettingTitle,
  SettingDescription,
  SettingControl,
  InfoCard,
  InfoContent,
  InfoTitle,
  InfoDescription
} from './page.styles';

export default function SettingsPage() {
  const router = useRouter();
  const pathname = usePathname();

  const isGeneralTab = pathname === '/settings' || pathname === '/settings/general';
  const isSyncTab = pathname === '/settings/sync';

  const handleTabClick = (path: string) => {
    router.push(path);
  };

  return (
    <SettingsContainer>
      <SettingsHeader>
        <SettingsTitle>Configuración</SettingsTitle>
        <TabsContainer>
          <Tab
            onClick={() => handleTabClick('/settings/general')}
            $isActive={isGeneralTab}
            role="button"
            aria-label="General"
          >
            <TabIcon>
              <Icon name="settings" size="md" />
            </TabIcon>
            <TabLabel>General</TabLabel>
          </Tab>
          <Tab
            onClick={() => handleTabClick('/settings/sync')}
            $isActive={isSyncTab}
            role="button"
            aria-label="Sincronización"
          >
            <TabIcon>
              <Icon name="settings" size="md" />
            </TabIcon>
            <TabLabel>Sincronización</TabLabel>
          </Tab>
        </TabsContainer>
      </SettingsHeader>

      <ContentContainer>
        {isGeneralTab && (
          <>
            <SettingsSection>
              <SectionTitle>Configuración General</SectionTitle>
              <SectionDescription>
                Ajustes básicos de la aplicación Loreon AI.
              </SectionDescription>

              <SettingItem>
                <SettingLabel>
                  <SettingTitle>Tema de la aplicación</SettingTitle>
                  <SettingDescription>
                    Personaliza la apariencia de la interfaz
                  </SettingDescription>
                </SettingLabel>
                <SettingControl>
                  <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                    Oscuro
                  </span>
                </SettingControl>
              </SettingItem>

              <SettingItem>
                <SettingLabel>
                  <SettingTitle>Idioma de la interfaz</SettingTitle>
                  <SettingDescription>
                    Idioma predeterminado para la aplicación
                  </SettingDescription>
                </SettingLabel>
                <SettingControl>
                  <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                    Español
                  </span>
                </SettingControl>
              </SettingItem>
            </SettingsSection>

            <SettingsSection>
              <SectionTitle>Chat y Conversaciones</SectionTitle>
              <SectionDescription>
                Configuración relacionada con el chat y las conversaciones con Loreon AI.
              </SectionDescription>

              <SettingItem>
                <SettingLabel>
                  <SettingTitle>Usar embeddings</SettingTitle>
                  <SettingDescription>
                    Habilitar búsqueda semántica en documentos
                  </SettingDescription>
                </SettingLabel>
                <SettingControl>
                  <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                    Habilitado
                  </span>
                </SettingControl>
              </SettingItem>

              <SettingItem>
                <SettingLabel>
                  <SettingTitle>Temperatura del modelo</SettingTitle>
                  <SettingDescription>
                    Controla la creatividad de las respuestas (0.1 - 1.0)
                  </SettingDescription>
                </SettingLabel>
                <SettingControl>
                  <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                    0.7
                  </span>
                </SettingControl>
              </SettingItem>
            </SettingsSection>

            <InfoCard>
              <div>
                <Icon name="info" size="md" />
              </div>
              <InfoContent>
                <InfoTitle>Información de la Aplicación</InfoTitle>
                <InfoDescription>
                  Loreon AI es tu asistente inteligente para consultar documentos de Notion.
                  Utiliza inteligencia artificial para proporcionarte respuestas precisas
                  basadas en tu conocimiento almacenado.
                </InfoDescription>
              </InfoContent>
            </InfoCard>
          </>
        )}

        {isSyncTab && <SyncTab />}
      </ContentContainer>
    </SettingsContainer>
  );
}
