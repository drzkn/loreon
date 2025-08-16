import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ThemeProvider } from 'styled-components';
import { TokenProvider } from '@/contexts/TokenContext/TokenContext';
import { ConnectionContent } from '../ConnectionContent';

// Usar el sistema centralizado de mocks
import {
  createTestSetup
} from '@/mocks';

// Mock theme para styled components
const mockTheme = {
  colors: {
    bgPrimary: '#0b0f1a',
    bgSecondary: '#0a0a0a',
    bgTertiary: '#1a1a1a',
    bgGradient: 'linear-gradient(135deg, #0f0f0f 0%, #1a1a1a 50%, #0d1117 100%)',
    glassLight: 'rgba(255, 255, 255, 0.1)',
    glassMedium: 'rgba(255, 255, 255, 0.15)',
    glassDark: 'rgba(30, 42, 63, 0.6)',
    glassDarker: 'rgba(0, 0, 0, 0.3)',
    glassBlack: 'rgba(0, 0, 0, 0.9)',
    primary50: '#e0f7ff',
    primary100: '#b3ecff',
    primary200: '#80e1ff',
    primary300: '#4dd6ff',
    primary400: '#26ccff',
    primary500: '#00cfff',
    primary600: '#00b8e6',
    primary700: '#009fcc',
    primary800: '#0086b3',
    primary900: '#006d99',
    secondary50: '#f0e6ff',
    secondary100: '#d4b3ff',
    secondary200: '#b580ff',
    secondary300: '#964dff',
    secondary400: '#7f26ff',
    secondary500: '#6b2fff',
    secondary600: '#5f29e6',
    secondary700: '#5223cc',
    secondary800: '#461db3',
    secondary900: '#3a1799',
    textPrimary: '#ffffff',
    textSecondary: '#c4cadc',
    textMuted: '#6b7280',
    textDisabled: 'rgba(255, 255, 255, 0.5)',
    success: '#10b981',
    error: '#ef4444',
    warning: '#f59e0b',
    info: '#3b82f6',
  },
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    '2xl': '3rem',
    '3xl': '4rem',
  },
  borderRadius: {
    sm: '0.25rem',
    md: '0.5rem',
    lg: '1rem',
    xl: '1.5rem',
    full: '9999px',
  },
  fontSize: {
    xs: '0.75rem',
    sm: '0.875rem',
    base: '1rem',
    lg: '1.125rem',
    xl: '1.25rem',
    '2xl': '1.5rem',
    '3xl': '1.875rem',
    '4xl': '2.25rem',
    '5xl': '3rem',
  },
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  },
  transitions: {
    fast: '0.15s ease',
    normal: '0.3s ease',
    slow: '0.5s ease',
  },
};

// Mock useAuth hook
const mockUserProfile = {
  id: 'test-user-id',
  email: 'test@example.com',
  name: 'Test User',
  avatar: null
};

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    userProfile: mockUserProfile,
    isAuthenticated: true
  })
}));

// Mock useSettingsTokens hook
const mockAddToken = vi.fn();
const mockDeleteToken = vi.fn();
const mockSetSelectedTokenId = vi.fn();

vi.mock('../hooks/useSettingsTokens', () => ({
  useSettingsTokens: () => ({
    tokens: [],
    isLoadingTokens: false,
    hasLoadedTokens: true,
    selectedTokenId: null,
    setSelectedTokenId: mockSetSelectedTokenId,
    addToken: mockAddToken,
    deleteToken: mockDeleteToken
  })
}));

// Mock the components
vi.mock('@/components', () => ({
  Button: ({ children, onClick, disabled }: { children: React.ReactNode; onClick: () => void; disabled?: boolean }) => (
    <button onClick={onClick} disabled={disabled}>
      {children}
    </button>
  ),
  Icon: ({ name }: { name: string }) => (
    <div data-testid={`icon-${name}`}>{name}</div>
  ),
}));

// Mock TokenSyncTab
vi.mock('./TokenSyncTab', () => ({
  TokenSyncTab: ({ token }: { token: { token_name: string } }) => (
    <div data-testid="token-sync-tab">
      Token Sync Tab for {token.token_name}
    </div>
  )
}));

// Mock renderLogger
vi.mock('@/utils/renderLogger', () => ({
  logRender: vi.fn()
}));

// Mock TokenContext to prevent the context error
vi.mock('@/contexts/TokenContext/TokenContext', () => ({
  useTokens: () => ({
    tokens: [],
    isLoadingTokens: false,
    hasLoadedTokens: true,
    loadTokens: vi.fn(),
    addToken: vi.fn(),
    deleteToken: vi.fn(),
    clearTokens: vi.fn()
  }),
  TokenProvider: ({ children }: { children: React.ReactNode }) => children
}));

const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <TokenProvider>
      <ThemeProvider theme={mockTheme}>
        {component}
      </ThemeProvider>
    </TokenProvider>
  );
};

describe('ConnectionContent', () => {
  const { teardown } = createTestSetup(); // ✅ Console mocks centralizados

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    teardown(); // ✅ Limpieza automática
  });

  it('should render main info card with correct content', () => {
    renderWithTheme(<ConnectionContent />);

    expect(screen.getByText('Tokens de Integración')).toBeInTheDocument();
    expect(screen.getByText(/Gestiona tus tokens de API para conectar diferentes servicios/)).toBeInTheDocument();
  });

  it('should render the add token button', () => {
    renderWithTheme(<ConnectionContent />);

    const addButton = screen.getByText('Añadir Token');
    expect(addButton).toBeInTheDocument();
    expect(addButton.tagName.toLowerCase()).toBe('button');
  });

  it('should render plug icon in the title', () => {
    renderWithTheme(<ConnectionContent />);

    expect(screen.getByTestId('icon-plug')).toBeInTheDocument();
  });

  it('should render plus icon in the add button', () => {
    renderWithTheme(<ConnectionContent />);

    expect(screen.getByTestId('icon-plus')).toBeInTheDocument();
  });

  it('should show empty state when no tokens are available', () => {
    renderWithTheme(<ConnectionContent />);

    expect(screen.getByText('No hay tokens configurados')).toBeInTheDocument();
    expect(screen.getByText('Añade tu primer token de integración para comenzar.')).toBeInTheDocument();
    expect(screen.getByTestId('icon-info')).toBeInTheDocument();
  });

  it('should show add token form when add button is clicked', () => {
    renderWithTheme(<ConnectionContent />);

    const addButton = screen.getByText('Añadir Token');
    fireEvent.click(addButton);

    // El formulario debería aparecer
    expect(screen.getByText('Proveedor')).toBeInTheDocument();
    expect(screen.getByText('Nombre del Token')).toBeInTheDocument();
    expect(screen.getByText('Token')).toBeInTheDocument();
  });

  it('should render form fields correctly when form is shown', () => {
    renderWithTheme(<ConnectionContent />);

    // Abrir formulario
    fireEvent.click(screen.getByText('Añadir Token'));

    // Verificar campos del formulario
    const providerSelect = screen.getByRole('combobox');
    expect(providerSelect).toBeInTheDocument();
    expect(providerSelect).toHaveAttribute('name', 'provider');
    expect(screen.getByPlaceholderText('Mi token de trabajo')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('secret_...')).toBeInTheDocument();
  });

  it('should render form action buttons when form is shown', () => {
    renderWithTheme(<ConnectionContent />);

    // Abrir formulario
    fireEvent.click(screen.getByText('Añadir Token'));

    // Verificar botones de acción
    expect(screen.getByText('Cancelar')).toBeInTheDocument();

    // Verificar que hay múltiples botones "Añadir Token" (principal + formulario)
    const addTokenButtons = screen.getAllByText('Añadir Token');
    expect(addTokenButtons).toHaveLength(2);
  });

  it('should close form when cancel button is clicked', () => {
    renderWithTheme(<ConnectionContent />);

    // Abrir formulario
    fireEvent.click(screen.getByText('Añadir Token'));
    expect(screen.getByText('Proveedor')).toBeInTheDocument();

    // Cerrar formulario
    fireEvent.click(screen.getByText('Cancelar'));
    expect(screen.queryByText('Proveedor')).not.toBeInTheDocument();
  });
});
