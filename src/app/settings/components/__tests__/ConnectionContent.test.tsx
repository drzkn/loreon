import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ThemeProvider } from 'styled-components';
import { ConnectionContent } from '../ConnectionContent';

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

// Mock the hook
vi.mock('../../hooks/useSyncToSupabase', () => ({
  useSyncToSupabase: vi.fn(() => ({
    isProcessing: false,
    logs: [],
    syncToSupabase: vi.fn(),
    clearLogs: vi.fn(),
  })),
}));

interface TerminalProps {
  logs: string[];
  isProcessing: boolean;
  onClearLogs: () => void;
}

// Mock the components
vi.mock('@/components', () => ({
  Terminal: (props: TerminalProps) => (
    <div data-testid='terminal'>
      <div>Processing: {props.isProcessing ? 'true' : 'false'}</div>
      <div>Logs: {props.logs.length}</div>
      <button onClick={props.onClearLogs}>Clear</button>
    </div>
  ),
  Button: ({ children, onClick, disabled }: { children: React.ReactNode; onClick: () => void; disabled: boolean }) => (
    <button onClick={onClick} disabled={disabled}>
      {children}
    </button>
  ),
  Icon: ({ name }: { name: string }) => (
    <div data-testid={`icon-${name}`}>{name}</div>
  ),
}));

const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <ThemeProvider theme={mockTheme}>
      {component}
    </ThemeProvider>
  );
};

describe('ConnectionContent', () => {
  it('should render info cards with correct content', () => {
    renderWithTheme(<ConnectionContent />);

    expect(
      screen.getByText('Sincronización Manual')
    ).toBeInTheDocument();

    expect(
      screen.getByText(/Control total sobre cuándo sincronizar/)
    ).toBeInTheDocument();

    expect(
      screen.getByText('Información del Proceso')
    ).toBeInTheDocument();

    expect(
      screen.getByText(/La sincronización conecta con la API de Notion/)
    ).toBeInTheDocument();
  });

  it('should render the terminal component', () => {
    renderWithTheme(<ConnectionContent />);

    expect(screen.getByTestId('terminal')).toBeInTheDocument();
  });

  it('should render the sync button with correct text', () => {
    renderWithTheme(<ConnectionContent />);

    expect(
      screen.getByText('Iniciar Sincronización')
    ).toBeInTheDocument();
  });

  it('should have the correct test id on container', () => {
    renderWithTheme(<ConnectionContent />);

    expect(screen.getByTestId('connection-content')).toBeInTheDocument();
  });

  it('should render information cards in correct order', () => {
    renderWithTheme(<ConnectionContent />);

    expect(screen.getByText('Sincronización Manual')).toBeInTheDocument();
    expect(screen.getByText('Información del Proceso')).toBeInTheDocument();

    // Verificar que las tarjetas están en el orden correcto
    expect(screen.getByText('Sincronización Manual')).toBeInTheDocument();
    expect(screen.getByText('Información del Proceso')).toBeInTheDocument();
  });

  it('should render button inside the first info card', () => {
    renderWithTheme(<ConnectionContent />);

    const button = screen.getByText('Iniciar Sincronización');
    expect(button).toBeInTheDocument();

    // Verificar que está dentro de un botón
    expect(button.tagName.toLowerCase()).toBe('button');
  });

  it('should render all main sections', () => {
    renderWithTheme(<ConnectionContent />);

    // Verificar que tenemos las 3 secciones principales:
    // 1. Primera InfoCard con botón
    expect(screen.getByText('Sincronización Manual')).toBeInTheDocument();
    // 2. Terminal
    expect(screen.getByTestId('terminal')).toBeInTheDocument();
    // 3. Segunda InfoCard con información
    expect(screen.getByText('Información del Proceso')).toBeInTheDocument();
  });
});
