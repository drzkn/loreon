import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Card } from '../Card';

describe('Card', () => {
  const defaultProps = {
    title: "📋 Manual",
    description: "Control total sobre cuándo sincronizar",
    processingMessagePrimary: "🔄 Sincronización en progreso...",
    processingMessageSecondary: "📄 Procesando múltiples databases",
    buttonTextProcessing: "🔄 Sincronizando...",
    buttonTextIdle: "🚀 Sincronizar"
  };

  it('should render sync button in initial state', () => {
    const mockOnSync = vi.fn();

    render(<Card isProcessing={false} onSync={mockOnSync} {...defaultProps} />);

    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent('🚀 Sincronizar');
    expect(button).not.toBeDisabled();
  });

  it('should render sync button in processing state', () => {
    const mockOnSync = vi.fn();

    render(<Card isProcessing={true} onSync={mockOnSync} {...defaultProps} />);

    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent('🔄 Sincronizando...');
    expect(button).toBeDisabled();
  });

  it('should show processing indicator when processing', () => {
    const mockOnSync = vi.fn();

    render(<Card isProcessing={true} onSync={mockOnSync} {...defaultProps} />);

    expect(screen.getByText('🔄 Sincronización en progreso...')).toBeInTheDocument();
    expect(screen.getByText('📄 Procesando múltiples databases')).toBeInTheDocument();
  });

  it('should not show processing indicator when not processing', () => {
    const mockOnSync = vi.fn();

    render(<Card isProcessing={false} onSync={mockOnSync} {...defaultProps} />);

    expect(screen.queryByText('🔄 Sincronización en progreso...')).not.toBeInTheDocument();
    expect(screen.queryByText('📄 Procesando múltiples databases')).not.toBeInTheDocument();
  });

  it('should call onSync when button is clicked', () => {
    const mockOnSync = vi.fn();

    render(<Card isProcessing={false} onSync={mockOnSync} {...defaultProps} />);

    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(mockOnSync).toHaveBeenCalledTimes(1);
  });

  it('should not call onSync when button is disabled', () => {
    const mockOnSync = vi.fn();

    render(<Card isProcessing={true} onSync={mockOnSync} {...defaultProps} />);

    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(mockOnSync).not.toHaveBeenCalled();
  });

  it('should render manual sync description', () => {
    const mockOnSync = vi.fn();

    render(<Card isProcessing={false} onSync={mockOnSync} {...defaultProps} />);

    expect(screen.getByText('📋 Manual')).toBeInTheDocument();
    expect(screen.getByText('Control total sobre cuándo sincronizar')).toBeInTheDocument();
  });

  it('should render correctly in both states', () => {
    const mockOnSync = vi.fn();

    const { rerender } = render(<Card isProcessing={false} onSync={mockOnSync} {...defaultProps} />);

    // Estado inicial
    expect(screen.getByText('🚀 Sincronizar')).toBeInTheDocument();
    expect(screen.queryByText('🔄 Sincronización en progreso...')).not.toBeInTheDocument();

    rerender(<Card isProcessing={true} onSync={mockOnSync} {...defaultProps} />);

    // Estado de procesamiento
    expect(screen.getByText('🔄 Sincronizando...')).toBeInTheDocument();
    expect(screen.getByText('🔄 Sincronización en progreso...')).toBeInTheDocument();
  });

  it('should render with custom text props', () => {
    const mockOnSync = vi.fn();
    const customProps = {
      title: "📊 Automático",
      description: "Sincronización automática configurada",
      processingMessagePrimary: "⏳ Procesando datos...",
      processingMessageSecondary: "🔄 Actualizando registros",
      buttonTextProcessing: "⏳ Procesando...",
      buttonTextIdle: "▶️ Iniciar"
    };

    render(<Card isProcessing={false} onSync={mockOnSync} {...customProps} />);

    // Verificar textos personalizados en estado idle
    expect(screen.getByText('📊 Automático')).toBeInTheDocument();
    expect(screen.getByText('Sincronización automática configurada')).toBeInTheDocument();
    expect(screen.getByText('▶️ Iniciar')).toBeInTheDocument();
    expect(screen.queryByText('⏳ Procesando datos...')).not.toBeInTheDocument();
  });

  it('should render with custom text props when processing', () => {
    const mockOnSync = vi.fn();
    const customProps = {
      title: "📊 Automático",
      description: "Sincronización automática configurada",
      processingMessagePrimary: "⏳ Procesando datos...",
      processingMessageSecondary: "🔄 Actualizando registros",
      buttonTextProcessing: "⏳ Procesando...",
      buttonTextIdle: "▶️ Iniciar"
    };

    render(<Card isProcessing={true} onSync={mockOnSync} {...customProps} />);

    // Verificar textos personalizados en estado processing
    expect(screen.getByText('📊 Automático')).toBeInTheDocument();
    expect(screen.getByText('Sincronización automática configurada')).toBeInTheDocument();
    expect(screen.getByText('⏳ Procesando...')).toBeInTheDocument();
    expect(screen.getByText('⏳ Procesando datos...')).toBeInTheDocument();
    expect(screen.getByText('🔄 Actualizando registros')).toBeInTheDocument();
  });
}); 