"use client";

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { PageHeader } from '../../components';
import { ConnectionContent } from './components/ConnectionContent';

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
          <div style={{
            padding: '2rem',
            textAlign: 'center',
            fontSize: '1.1rem',
            opacity: 0.8
          }}>
            Selecciona una pestaña para configurar las opciones correspondientes
          </div>
        );
    }
  };

  return (
    <div style={{ padding: '2rem' }}>
      <PageHeader
        title="Configuración"
        description="Configura las diferentes opciones de la aplicación"
      />

      <div style={{ marginTop: '2rem' }}>
        <div style={{
          display: 'flex',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          gap: '1rem'
        }}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab)}
              style={{
                padding: '0.75rem 1.5rem',
                background: activeTab === tab.id ? 'rgba(16, 185, 129, 0.1)' : 'transparent',
                border: 'none',
                borderBottom: activeTab === tab.id ? '2px solid #10b981' : '2px solid transparent',
                color: activeTab === tab.id ? '#10b981' : '#ffffff',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: '500',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        <section style={{
          marginTop: '2rem',
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '8px',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          {renderTabContent()}
        </section>
      </div>
    </div>
  );
} 