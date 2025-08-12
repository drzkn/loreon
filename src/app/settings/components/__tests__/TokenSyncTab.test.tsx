import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import { theme } from '@/lib/theme';
import { TokenSyncTab } from '../TokenSyncTab';
import { UserToken, UserTokenProvider } from '@/types/UserToken';

const mockSyncToSupabase = vi.fn();
const mockClearLogs = vi.fn();

vi.mock('../hooks/useSyncToSupabaseByToken', () => ({
  useSyncToSupabaseByToken: () => ({
    isProcessing: false,
    logs: [],
    syncToSupabase: mockSyncToSupabase,
    clearLogs: mockClearLogs
  })
}));

vi.mock('@/components', () => ({
  Terminal: ({ logs, isProcessing, onClearLogs }: {
    logs: string[];
    isProcessing: boolean;
    onClearLogs: () => void;
  }) => (
    <div data-testid="terminal">
      <div data-testid="terminal-logs">{Array.isArray(logs) ? logs.join('\n') : ''}</div>
      <div data-testid="terminal-processing">{String(isProcessing)}</div>
      <button onClick={onClearLogs} data-testid="clear-logs">Clear</button>
    </div>
  ),
  Button: ({ onClick, disabled, variant, children }: {
    onClick: () => void;
    disabled: boolean;
    variant: string;
    children: React.ReactNode;
  }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      data-variant={variant}
      data-testid="sync-button"
    >
      {children}
    </button>
  ),
  Icon: ({ name }: { name: string }) => (
    <span data-testid="icon" data-name={name}>[{name}]</span>
  )
}));

const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => { });

const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <ThemeProvider theme={theme}>
      {component}
    </ThemeProvider>
  );
};

describe('TokenSyncTab', () => {
  const mockToken: UserToken = {
    id: 'token-123',
    user_id: 'user-456',
    provider: 'notion',
    token_name: 'Mi Token de Notion',
    encrypted_token: 'encrypted-value',
    token_metadata: {},
    is_active: true,
    created_at: '2023-01-01T10:00:00.000Z',
    updated_at: '2023-01-01T10:00:00.000Z'
  };

  beforeEach(() => {
    vi.clearAllMocks();
    consoleSpy.mockClear();
  });

  describe('Renderizado y contenido básico', () => {
    it('debería mostrar información esencial del token', () => {
      renderWithTheme(<TokenSyncTab token={mockToken} />);

      expect(screen.getByText('Mi Token de Notion')).toBeInTheDocument();
      expect(screen.getByText('Información del Token')).toBeInTheDocument();
      expect(screen.getByText('Proveedor:')).toBeInTheDocument();
      expect(screen.getByText('Nombre:')).toBeInTheDocument();
      expect(screen.getByText('Creado:')).toBeInTheDocument();

      expect(screen.getByTestId('sync-button')).toBeInTheDocument();
      expect(screen.getByTestId('terminal')).toBeInTheDocument();

      const icons = screen.getAllByTestId('icon');
      expect(icons.length).toBeGreaterThanOrEqual(2);
    });

    it('debería mostrar warning para providers no-notion', () => {
      const slackToken: UserToken = { ...mockToken, provider: 'slack', token_name: 'Token de Slack' };
      renderWithTheme(<TokenSyncTab token={slackToken} />);

      expect(screen.getByText('Token de Slack')).toBeInTheDocument();
      expect(screen.getByText(/⚠️ La sincronización solo está disponible para tokens de Notion/))
        .toBeInTheDocument();
    });
  });

  describe('Estados del botón', () => {
    it('debería habilitar botón para tokens de Notion', () => {
      renderWithTheme(<TokenSyncTab token={mockToken} />);

      const button = screen.getByTestId('sync-button');
      expect(button).not.toBeDisabled();
      expect(button).toHaveTextContent('Iniciar Sincronización');
    });

    it('debería deshabilitar botón para providers no-notion', () => {
      const slackToken: UserToken = { ...mockToken, provider: 'slack' };
      renderWithTheme(<TokenSyncTab token={slackToken} />);

      const button = screen.getByTestId('sync-button');
      expect(button).toBeDisabled();
    });

    it('debería logear al hacer click en sincronizar', () => {
      renderWithTheme(<TokenSyncTab token={mockToken} />);

      const button = screen.getByTestId('sync-button');
      fireEvent.click(button);

      expect(consoleSpy).toHaveBeenCalledWith(
        '🎬 [TOKEN_SYNC] Iniciando sincronización manual para token:',
        'token-123'
      );
    });

    it('debería renderizar terminal con botón de limpiar', () => {
      renderWithTheme(<TokenSyncTab token={mockToken} />);

      const clearButton = screen.getByTestId('clear-logs');
      expect(clearButton).toBeInTheDocument();
      expect(clearButton).toHaveTextContent('Clear');
    });
  });

  describe('Mapeo de providers', () => {
    it('debería manejar diferentes providers correctamente', () => {
      const providers: Array<{ provider: UserTokenProvider; expectedName: string }> = [
        { provider: 'notion', expectedName: 'Notion' },
        { provider: 'slack', expectedName: 'Slack' },
        { provider: 'github', expectedName: 'GitHub' },
        { provider: 'drive', expectedName: 'Google Drive' },
        { provider: 'calendar', expectedName: 'Google Calendar' }
      ];

      providers.forEach(({ provider, expectedName }) => {
        const token: UserToken = {
          ...mockToken,
          provider,
          token_name: `Token de ${expectedName}`
        };

        const { unmount } = renderWithTheme(<TokenSyncTab token={token} />);

        expect(screen.getByText(`Token de ${expectedName}`)).toBeInTheDocument();

        const button = screen.getByTestId('sync-button');
        if (provider === 'notion') {
          expect(button).not.toBeDisabled();
        } else {
          expect(button).toBeDisabled();
        }

        unmount();
      });
    });
  });

  describe('Funciones helper del componente', () => {
    it('debería manejar iconos de providers correctamente', () => {
      renderWithTheme(<TokenSyncTab token={mockToken} />);

      const notionIcons = screen.getAllByTestId('icon').filter(icon =>
        icon.getAttribute('data-name') === 'notion'
      );
      expect(notionIcons.length).toBeGreaterThan(0);
    });

    it('debería formatear fechas correctamente', () => {
      const tokenWithDate: UserToken = {
        ...mockToken,
        created_at: '2023-12-25T15:30:45.123Z'
      };

      renderWithTheme(<TokenSyncTab token={tokenWithDate} />);

      const dateText = screen.getByText(/25\/12\/2023|12\/25\/2023/);
      expect(dateText).toBeInTheDocument();
    });
  });

  describe('Robustez y casos edge', () => {
    it('debería manejar metadata compleja del token', () => {
      const complexToken: UserToken = {
        ...mockToken,
        token_metadata: {
          lastSync: '2023-01-01',
          customField: 'value',
          nested: { deep: { value: 'test' } }
        },
        is_active: false
      };

      expect(() => {
        renderWithTheme(<TokenSyncTab token={complexToken} />);
      }).not.toThrow();

      expect(screen.getByText('Mi Token de Notion')).toBeInTheDocument();
    });

    it('debería ser resiliente a diferentes formatos de fecha', () => {
      const tokenWithISODate: UserToken = {
        ...mockToken,
        created_at: '2023-01-15T08:30:00.000Z'
      };

      expect(() => {
        renderWithTheme(<TokenSyncTab token={tokenWithISODate} />);
      }).not.toThrow();
    });

    it('debería mantener estructura correcta de elementos', () => {
      renderWithTheme(<TokenSyncTab token={mockToken} />);

      expect(screen.getByTestId('sync-button')).toBeInTheDocument();
      expect(screen.getByTestId('terminal')).toBeInTheDocument();
      expect(screen.getByTestId('clear-logs')).toBeInTheDocument();

      expect(screen.getByText(/Sincroniza tu contenido desde/)).toBeInTheDocument();
    });
  });
});