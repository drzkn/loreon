import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ConnectionContent } from '../ConnectionContent';

// Mock the hook
vi.mock('../../hooks/useSyncToSupabase', () => ({
  useSyncToSupabase: vi.fn(() => ({
    isProcessing: false,
    logs: [],
    syncToSupabase: vi.fn(),
    clearLogs: vi.fn()
  }))
}));

// Mock the components
vi.mock('../../../../components', () => ({
  SyncCard: vi.fn(({ isProcessing, onSync }) => (
    <div data-testid="sync-card">
      <button onClick={onSync} disabled={isProcessing}>
        {isProcessing ? 'Processing...' : 'Sync'}
      </button>
    </div>
  )),
  Terminal: vi.fn(({ logs, isProcessing, onClearLogs }) => (
    <div data-testid="terminal">
      <div>Processing: {isProcessing ? 'true' : 'false'}</div>
      <div>Logs: {logs.length}</div>
      <button onClick={onClearLogs}>Clear</button>
    </div>
  ))
}));

describe('ConnectionContent', () => {
  it('should render the connection content correctly', () => {
    render(<ConnectionContent />);

    expect(screen.getByText('🔄 Opciones de Sincronización')).toBeInTheDocument();
    expect(screen.getByTestId('sync-card')).toBeInTheDocument();
    expect(screen.getByTestId('terminal')).toBeInTheDocument();
  });

  it('should have the correct styling and structure', () => {
    render(<ConnectionContent />);

    const heading = screen.getByText('🔄 Opciones de Sincronización');
    expect(heading).toBeInTheDocument();
    expect(heading.tagName).toBe('H2');
  });
}); 