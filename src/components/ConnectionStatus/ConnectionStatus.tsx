'use client';

import React from 'react';
import styled from 'styled-components';
import { getEnvVar } from '@/utils/getEnvVar';

const StatusContainer = styled.div`
  background: ${({ theme }) => theme.colors.glassLight};
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  padding: ${({ theme }) => theme.spacing.xl};
  margin-bottom: ${({ theme }) => theme.spacing.xl};
`;

const StatusTitle = styled.h3`
  color: ${({ theme }) => theme.colors.textPrimary};
  font-size: ${({ theme }) => theme.fontSize.lg};
  font-weight: 600;
  margin-bottom: ${({ theme }) => theme.spacing.lg};
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const StatusList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const StatusItem = styled.div<{ $status: 'success' | 'error' | 'warning' }>`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  padding: ${({ theme }) => theme.spacing.sm};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  background: rgba(0, 0, 0, 0.2);
  color: ${({ theme, $status }) =>
    $status === 'success'
      ? theme.colors.success
      : $status === 'error'
        ? theme.colors.error
        : theme.colors.warning};
`;

const StatusIcon = styled.span<{ $status: 'success' | 'error' | 'warning' }>`
  font-size: 1.2rem;
`;

const StatusText = styled.span`
  flex: 1;
  font-family: monospace;
  font-size: ${({ theme }) => theme.fontSize.sm};
`;

const InstructionsContainer = styled.div`
  background: ${({ theme }) => theme.colors.glassDark};
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  padding: ${({ theme }) => theme.spacing.xl};
  margin-top: ${({ theme }) => theme.spacing.lg};
`;

const InstructionsTitle = styled.h4`
  color: ${({ theme }) => theme.colors.textPrimary};
  font-size: ${({ theme }) => theme.fontSize.base};
  font-weight: 600;
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

const CodeBlock = styled.pre`
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: ${({ theme }) => theme.borderRadius.md};
  padding: ${({ theme }) => theme.spacing.md};
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.fontSize.sm};
  overflow-x: auto;
  white-space: pre-wrap;
`;

interface EnvVar {
  key: string;
  displayName: string;
  required: boolean;
  description: string;
}

const requiredEnvVars: EnvVar[] = [
  {
    key: 'VITE_SUPABASE_URL',
    displayName: 'Supabase URL',
    required: true,
    description: 'URL de tu proyecto de Supabase'
  },
  {
    key: 'VITE_SUPABASE_ANON_KEY',
    displayName: 'Supabase Anon Key',
    required: true,
    description: 'Clave anónima de Supabase'
  },
  {
    key: 'VITE_NOTION_API_KEY',
    displayName: 'Notion API Key',
    required: true,
    description: 'Token de API de Notion'
  },
  {
    key: 'VITE_NOTION_DATABASE_ID',
    displayName: 'Notion Database ID',
    required: true,
    description: 'ID de la base de datos de Notion'
  }
];

export const ConnectionStatus: React.FC = () => {
  const getStatus = (envVar: EnvVar) => {
    const value = getEnvVar(envVar.key);

    if (!value && envVar.required) {
      return 'error';
    }

    if (!value && !envVar.required) {
      return 'warning';
    }

    return 'success';
  };

  const getIcon = (status: 'success' | 'error' | 'warning') => {
    switch (status) {
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      case 'warning':
        return '⚠️';
    }
  };

  const getStatusText = (envVar: EnvVar, status: 'success' | 'error' | 'warning') => {
    const value = getEnvVar(envVar.key);

    if (status === 'success') {
      return `${envVar.displayName}: Configurado`;
    }

    if (status === 'error') {
      return `${envVar.displayName}: No configurado (Requerido)`;
    }

    return `${envVar.displayName}: Opcional`;
  };

  const hasErrors = requiredEnvVars.some(envVar => getStatus(envVar) === 'error');

  return (
    <StatusContainer>
      <StatusTitle>
        🔧 Estado de Configuración
      </StatusTitle>

      <StatusList>
        {requiredEnvVars.map((envVar) => {
          const status = getStatus(envVar);
          return (
            <StatusItem key={envVar.key} $status={status}>
              <StatusIcon $status={status}>
                {getIcon(status)}
              </StatusIcon>
              <StatusText>
                {getStatusText(envVar, status)}
              </StatusText>
            </StatusItem>
          );
        })}
      </StatusList>

      {hasErrors && (
        <InstructionsContainer>
          <InstructionsTitle>📋 Configuración requerida</InstructionsTitle>
          <p style={{ marginBottom: '1rem', color: '#c4cadc' }}>
            Para usar la funcionalidad de conexión, necesitas configurar las siguientes variables de entorno:
          </p>

          <InstructionsTitle>1. Crea un archivo .env en la raíz del proyecto:</InstructionsTitle>
          <CodeBlock>
            {`# Configuración de Supabase
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu_anon_key_de_supabase_aqui

# Configuración de Notion
VITE_NOTION_API_KEY=secret_tu_api_key_de_notion_aqui
VITE_NOTION_DATABASE_ID=tu_database_id_aqui`}
          </CodeBlock>

          <InstructionsTitle>2. Obtener las credenciales:</InstructionsTitle>
          <p style={{ color: '#c4cadc', marginBottom: '0.5rem' }}>
            <strong>Supabase:</strong> Ve a tu proyecto en supabase.com {'>'} Settings {'>'} API
          </p>
          <p style={{ color: '#c4cadc', marginBottom: '0.5rem' }}>
            <strong>Notion:</strong> Ve a notion.so/my-integrations para crear una integración
          </p>

          <InstructionsTitle>3. Reinicia el servidor después de configurar:</InstructionsTitle>
          <CodeBlock>npm run dev</CodeBlock>
        </InstructionsContainer>
      )}
    </StatusContainer>
  );
};

export default ConnectionStatus; 