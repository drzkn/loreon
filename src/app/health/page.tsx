'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/Card';
import styled from 'styled-components';

interface SystemHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  environment: {
    nodeEnv: string;
    notionConfigured: boolean;
    supabaseConfigured: boolean;
    serviceRoleKeyAvailable: boolean;
  };
  services: {
    database: { status: string; responseTime?: number };
    notion: { status: string; responseTime?: number };
    embeddings: { status: string; responseTime?: number };
  };
  performance: {
    memoryUsage: {
      used: number;
      total: number;
      percentage: number;
    };
  };
}

const HealthDashboard: React.FC = () => {
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const fetchHealthData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/health/system');
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setSystemHealth(data);
      setLastUpdate(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error fetching health data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealthData();

    // Auto-refresh cada 30 segundos
    const interval = setInterval(fetchHealthData, 30000);
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return '#22c55e';
      case 'degraded': return '#f59e0b';
      case 'unhealthy': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return '✅';
      case 'degraded': return '⚠️';
      case 'unhealthy': return '❌';
      default: return '❓';
    }
  };

  if (loading) {
    return (
      <Container>
        <Header>
          <h1>🏥 Health Dashboard</h1>
          <p>Cargando estado del sistema...</p>
        </Header>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <Header>
          <h1>🏥 Health Dashboard</h1>
          <ErrorMessage>Error: {error}</ErrorMessage>
          <button onClick={fetchHealthData}>Reintentar</button>
        </Header>
      </Container>
    );
  }

  if (!systemHealth) {
    return (
      <Container>
        <Header>
          <h1>🏥 Health Dashboard</h1>
          <p>No hay datos disponibles</p>
        </Header>
      </Container>
    );
  }

  return (
    <Container>
      <Header>
        <h1>🏥 Health Dashboard</h1>
        <StatusOverview status={systemHealth.status}>
          {getStatusIcon(systemHealth.status)} Sistema: {systemHealth.status}
        </StatusOverview>
        <LastUpdate>
          Última actualización: {lastUpdate.toLocaleTimeString()}
          <RefreshButton onClick={fetchHealthData}>🔄 Actualizar</RefreshButton>
        </LastUpdate>
      </Header>

      <Grid>
        {/* Estado General */}
        <Card title="📊 Estado General">
          <CardHeader>
            <h3>📊 Estado General</h3>
          </CardHeader>
          <CardContent>
            <MetricRow>
              <MetricLabel>Estado:</MetricLabel>
              <MetricValue color={getStatusColor(systemHealth.status)}>
                {getStatusIcon(systemHealth.status)} {systemHealth.status}
              </MetricValue>
            </MetricRow>
            <MetricRow>
              <MetricLabel>Entorno:</MetricLabel>
              <MetricValue>{systemHealth.environment.nodeEnv}</MetricValue>
            </MetricRow>
            <MetricRow>
              <MetricLabel>Timestamp:</MetricLabel>
              <MetricValue>{new Date(systemHealth.timestamp).toLocaleString()}</MetricValue>
            </MetricRow>
          </CardContent>
        </Card>

        {/* Servicios */}
        <Card title="🔧 Servicios">
          <CardHeader>
            <h3>🔧 Servicios</h3>
          </CardHeader>
          <CardContent>
            {Object.entries(systemHealth.services).map(([service, data]) => (
              <ServiceRow key={service}>
                <ServiceName>
                  {getStatusIcon(data.status)} {service}
                </ServiceName>
                <ServiceStatus color={getStatusColor(data.status)}>
                  {data.status}
                  {data.responseTime && ` (${data.responseTime}ms)`}
                </ServiceStatus>
              </ServiceRow>
            ))}
          </CardContent>
        </Card>

        {/* Configuración */}
        <Card title="⚙️ Configuración">
          <CardHeader>
            <h3>⚙️ Configuración</h3>
          </CardHeader>
          <CardContent>
            <ConfigRow>
              <ConfigLabel>Notion:</ConfigLabel>
              <ConfigStatus configured={systemHealth.environment.notionConfigured}>
                {systemHealth.environment.notionConfigured ? '✅ Configurado' : '❌ No configurado'}
              </ConfigStatus>
            </ConfigRow>
            <ConfigRow>
              <ConfigLabel>Supabase:</ConfigLabel>
              <ConfigStatus configured={systemHealth.environment.supabaseConfigured}>
                {systemHealth.environment.supabaseConfigured ? '✅ Configurado' : '❌ No configurado'}
              </ConfigStatus>
            </ConfigRow>
            <ConfigRow>
              <ConfigLabel>Service Role Key:</ConfigLabel>
              <ConfigStatus configured={systemHealth.environment.serviceRoleKeyAvailable}>
                {systemHealth.environment.serviceRoleKeyAvailable ? '✅ Disponible' : '⚠️ No disponible'}
              </ConfigStatus>
            </ConfigRow>
          </CardContent>
        </Card>

        {/* Rendimiento */}
        <Card title="⚡ Rendimiento">
          <CardHeader>
            <h3>⚡ Rendimiento</h3>
          </CardHeader>
          <CardContent>
            <MetricRow>
              <MetricLabel>Memoria Usada:</MetricLabel>
              <MetricValue>{systemHealth.performance.memoryUsage.used} MB</MetricValue>
            </MetricRow>
            <MetricRow>
              <MetricLabel>Memoria Total:</MetricLabel>
              <MetricValue>{systemHealth.performance.memoryUsage.total} MB</MetricValue>
            </MetricRow>
            <MetricRow>
              <MetricLabel>Uso de Memoria:</MetricLabel>
              <MetricValue>
                <MemoryBar>
                  <MemoryFill percentage={systemHealth.performance.memoryUsage.percentage} />
                </MemoryBar>
                {systemHealth.performance.memoryUsage.percentage}%
              </MetricValue>
            </MetricRow>
          </CardContent>
        </Card>
      </Grid>

      <ActionsSection>
        <ActionButton onClick={() => window.open('/api/health/database', '_blank')}>
          📊 Ver Health Database
        </ActionButton>
        <ActionButton onClick={() => window.open('/api/health/embeddings', '_blank')}>
          🧠 Test Embeddings
        </ActionButton>
        <ActionButton onClick={() => window.open('/api/debug-notion-connection', '_blank')}>
          📝 Debug Notion
        </ActionButton>
      </ActionsSection>
    </Container>
  );
};

// Styled Components
const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
`;

const Header = styled.header`
  text-align: center;
  margin-bottom: 2rem;
  
  h1 {
    margin: 0 0 1rem 0;
    color: #1f2937;
  }
`;

const StatusOverview = styled.div<{ status: string }>`
  font-size: 1.25rem;
  font-weight: bold;
  color: ${props => getStatusColor(props.status)};
  margin-bottom: 1rem;
`;

const LastUpdate = styled.div`
  color: #6b7280;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
`;

const RefreshButton = styled.button`
  background: #3b82f6;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  cursor: pointer;
  
  &:hover {
    background: #2563eb;
  }
`;

const ErrorMessage = styled.div`
  color: #ef4444;
  background: #fef2f2;
  padding: 1rem;
  border-radius: 0.5rem;
  margin-bottom: 1rem;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
`;

const CardHeader = styled.div`
  border-bottom: 1px solid #e5e7eb;
  padding-bottom: 0.75rem;
  margin-bottom: 1rem;
  
  h3 {
    margin: 0;
    color: #1f2937;
  }
`;

const CardContent = styled.div`
  space-y: 0.75rem;
`;

const MetricRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
`;

const MetricLabel = styled.span`
  color: #6b7280;
  font-weight: 500;
`;

const MetricValue = styled.span<{ color?: string }>`
  font-weight: 600;
  color: ${props => props.color || '#1f2937'};
`;

const ServiceRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
  border-bottom: 1px solid #f3f4f6;
  
  &:last-child {
    border-bottom: none;
  }
`;

const ServiceName = styled.span`
  font-weight: 500;
`;

const ServiceStatus = styled.span<{ color: string }>`
  color: ${props => props.color};
  font-weight: 600;
`;

const ConfigRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
`;

const ConfigLabel = styled.span`
  color: #6b7280;
  font-weight: 500;
`;

const ConfigStatus = styled.span<{ configured: boolean }>`
  color: ${props => props.configured ? '#22c55e' : '#ef4444'};
  font-weight: 600;
`;

const MemoryBar = styled.div`
  width: 100px;
  height: 8px;
  background: #e5e7eb;
  border-radius: 4px;
  overflow: hidden;
  margin-right: 0.5rem;
`;

const MemoryFill = styled.div<{ percentage: number }>`
  width: ${props => Math.min(props.percentage, 100)}%;
  height: 100%;
  background: ${props => props.percentage > 80 ? '#ef4444' : props.percentage > 60 ? '#f59e0b' : '#22c55e'};
  transition: width 0.3s ease;
`;

const ActionsSection = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-top: 2rem;
`;

const ActionButton = styled.button`
  background: #f3f4f6;
  border: 1px solid #d1d5db;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  cursor: pointer;
  font-weight: 500;
  
  &:hover {
    background: #e5e7eb;
  }
`;

function getStatusColor(status: string): string {
  switch (status) {
    case 'healthy': return '#22c55e';
    case 'degraded': return '#f59e0b';
    case 'unhealthy': return '#ef4444';
    default: return '#6b7280';
  }
}

export default HealthDashboard;
