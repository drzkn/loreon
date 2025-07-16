import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ConnectionContent } from '../ConnectionContent';

// Mock the hook
vi.mock('../../hooks/useSyncToSupabase', () => ({
  useSyncToSupabase: vi.fn(() => ({
    isProcessing: false,
    logs: [],
    syncToSupabase: vi.fn(),
    clearLogs: vi.fn(),
  })),
}));

interface SyncCardProps {
  isProcessing: boolean;
  onSync: () => void;
  title: string;
  description: string;
  processingMessagePrimary: string;
  processingMessageSecondary: string;
  buttonTextProcessing: string;
  buttonTextIdle: string;
}

interface TerminalProps {
  logs: string[];
  isProcessing: boolean;
  onClearLogs: () => void;
}

// Mock the components
vi.mock('../../../../components', () => ({
  Card: (props: SyncCardProps) => (
    <div data-testid='sync-card'>
      <h3>{props.title}</h3>
      <p>{props.description}</p>
      <button onClick={props.onSync} disabled={props.isProcessing}>
        {props.isProcessing ? props.buttonTextProcessing : props.buttonTextIdle}
      </button>
      {props.isProcessing && (
        <div>
          <div>{props.processingMessagePrimary}</div>
          <div>{props.processingMessageSecondary}</div>
        </div>
      )}
    </div>
  ),
  Terminal: (props: TerminalProps) => (
    <div data-testid='terminal'>
      <div>Processing: {props.isProcessing ? 'true' : 'false'}</div>
      <div>Logs: {props.logs.length}</div>
      <button onClick={props.onClearLogs}>Clear</button>
    </div>
  ),
}));

describe('ConnectionContent', () => {
  it('should render the connection content correctly', () => {
    render(<ConnectionContent />);

    expect(
      screen.getByText('🔄 Opciones de sincronización')
    ).toBeInTheDocument();
    expect(screen.getByTestId('sync-card')).toBeInTheDocument();
    expect(screen.getByTestId('terminal')).toBeInTheDocument();
  });
});
