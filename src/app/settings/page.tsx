'use client';

import { useRouter, usePathname } from 'next/navigation';
import { ConnectionContent } from './components/ConnectionContent';
import { Icon } from '@/components';
import {
  SettingsContainer,
  SettingsHeader,
  SettingsTitle,
  TabsContainer,
  Tab,
  TabIcon,
  TabLabel,
  ContentContainer
} from './page.styles';

export default function SettingsPage() {
  const router = useRouter();
  const pathname = usePathname();

  const isConnectionTab = pathname === '/settings' || pathname === '/settings/connect';

  const handleTabClick = (path: string) => {
    router.push(path);
  };

  return (
    <SettingsContainer>
      <SettingsHeader>
        <SettingsTitle>Configuración</SettingsTitle>
        <TabsContainer>
          <Tab
            onClick={() => handleTabClick('/settings/connect')}
            $isActive={isConnectionTab}
            role="button"
            aria-label="Conexión"
          >
            <TabIcon>
              <Icon name="plug" size="md" />
            </TabIcon>
            <TabLabel>Conexión</TabLabel>
          </Tab>
        </TabsContainer>
      </SettingsHeader>

      <ContentContainer>
        {isConnectionTab && <ConnectionContent />}
      </ContentContainer>
    </SettingsContainer>
  );
}