"use client";

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { PageHeader } from '../../components';
import { ConnectionContent } from './components/ConnectionContent';
import {
  SettingsContainer,
  TabsContainer,
  TabsHeader,
  TabButton,
  TabIcon,
  TabLabel,
  DefaultContent
} from './page.styles';

interface TabConfig {
  id: string;
  label: string;
  icon: string;
}

const tabs: TabConfig[] = [
  {
    id: 'connection',
    label: 'Conexión',
    icon: '🔌'
  }
  // Más pestañas se agregarán aquí en el futuro
];

export default function SettingsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const [activeTab, setActiveTab] = useState(tabs[0].id);

  // Determinar el tab activo basado en la URL
  useEffect(() => {
    if (pathname === '/settings/connect') {
      setActiveTab('connection');
    } else {
      setActiveTab(tabs[0].id);
    }
  }, [pathname]);

  const handleTabClick = (tab: TabConfig) => {
    setActiveTab(tab.id);

    // Cambiar la URL según el tab seleccionado
    if (tab.id === 'connection') {
      router.push('/settings/connect');
    } else {
      router.push('/settings');
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'connection':
        return <ConnectionContent />;
      default:
        return (
          <DefaultContent>
            Selecciona una pestaña para configurar las opciones correspondientes
          </DefaultContent>
        );
    }
  };

  return (
    <SettingsContainer>
      <PageHeader
        title="Configuración"
        description="Configura las diferentes opciones de la aplicación"
      />

      <TabsContainer>
        <TabsHeader>
          {tabs.map((tab) => (
            <TabButton
              key={tab.id}
              onClick={() => handleTabClick(tab)}
              $isActive={activeTab === tab.id}
            >
              <TabIcon>{tab.icon}</TabIcon>
              <TabLabel>{tab.label}</TabLabel>
            </TabButton>
          ))}
        </TabsHeader>

        {renderTabContent()}
      </TabsContainer>
    </SettingsContainer>
  );
} 