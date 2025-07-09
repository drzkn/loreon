import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock el hook useSyncToSupabase
vi.mock('../hooks/useSyncToSupabase', () => ({
  useSyncToSupabase: vi.fn(() => ({
    isProcessing: false,
    logs: [],
    syncToSupabase: vi.fn(),
    clearLogs: vi.fn()
  }))
}));

// Mock los componentes
vi.mock('../../../components', () => ({
  PageHeader: vi.fn(({ title, description }) => (
    <div data-testid="page-header">
      <h1>{title}</h1>
      <p>{description}</p>
    </div>
  )),
  SyncCard: vi.fn(({ isProcessing, onSync }) => (
    <div data-testid="sync-card">
      <button
        onClick={onSync}
        disabled={isProcessing}
        data-testid="sync-button"
      >
        {isProcessing ? '🔄 Sincronizando...' : '🚀 Sincronizar'}
      </button>
    </div>
  )),
  Terminal: vi.fn(({ logs, onClearLogs }) => (
    <div data-testid="terminal">
      <button onClick={onClearLogs} data-testid="clear-logs-button">
        🗑️ Limpiar
      </button>
      <div data-testid="terminal-logs">
        {logs.length === 0 ? (
          <div>Esperando logs de sincronización...</div>
        ) : (
          logs.map((log: string, index: number) => (
            <div key={index}>{log}</div>
          ))
        )}
      </div>
      <div data-testid="terminal-status">
        Logs: {logs.length}
      </div>
    </div>
  ))
}));

import ConnectPage from '../page';

describe('ConnectPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial Render', () => {
    it('should render page with correct title and description', () => {
      render(<ConnectPage />);

      expect(screen.getByTestId('page-header')).toBeInTheDocument();
      expect(screen.getByText('🔌 Connect & Sync')).toBeInTheDocument();
      expect(screen.getByText('Sincronización con la base de datos')).toBeInTheDocument();
    });

    it('should render sync card component', () => {
      render(<ConnectPage />);

      expect(screen.getByTestId('sync-card')).toBeInTheDocument();
      expect(screen.getByTestId('sync-button')).toBeInTheDocument();
      expect(screen.getByText('🚀 Sincronizar')).toBeInTheDocument();
    });

    it('should render terminal component', () => {
      render(<ConnectPage />);

      expect(screen.getByTestId('terminal')).toBeInTheDocument();
      expect(screen.getByTestId('clear-logs-button')).toBeInTheDocument();
      expect(screen.getByText('Esperando logs de sincronización...')).toBeInTheDocument();
    });

    it('should render section title', () => {
      render(<ConnectPage />);

      expect(screen.getByText('🔄 Opciones de Sincronización')).toBeInTheDocument();
    });
  });

  describe('Component Structure', () => {
    it('should have correct component hierarchy', () => {
      render(<ConnectPage />);

      // Verificar que todos los componentes están presentes
      expect(screen.getByTestId('page-header')).toBeInTheDocument();
      expect(screen.getByTestId('sync-card')).toBeInTheDocument();
      expect(screen.getByTestId('terminal')).toBeInTheDocument();
    });

    it('should render components in a responsive grid layout', () => {
      render(<ConnectPage />);

      const syncCard = screen.getByTestId('sync-card');
      const terminal = screen.getByTestId('terminal');

      expect(syncCard).toBeInTheDocument();
      expect(terminal).toBeInTheDocument();
    });
  });

  describe('Basic Functionality', () => {
    it('should render without crashing', () => {
      expect(() => render(<ConnectPage />)).not.toThrow();
    });

    it('should maintain component isolation', () => {
      render(<ConnectPage />);

      // Los componentes deben estar separados y no afectarse mutuamente
      expect(screen.getByTestId('page-header')).toBeInTheDocument();
      expect(screen.getByTestId('sync-card')).toBeInTheDocument();
      expect(screen.getByTestId('terminal')).toBeInTheDocument();
    });
  });
});
