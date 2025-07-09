import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { SyncCard } from '../SyncCard';

describe('SyncCard', () => {
  it('should render sync button in initial state', () => {
    const mockOnSync = vi.fn();

    render(<SyncCard isProcessing={false} onSync={mockOnSync} />);

    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent('🚀 Sincronizar');
    expect(button).not.toBeDisabled();
  });

  it('should render sync button in processing state', () => {
    const mockOnSync = vi.fn();

    render(<SyncCard isProcessing={true} onSync={mockOnSync} />);

    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent('🔄 Sincronizando...');
    expect(button).toBeDisabled();
  });

  it('should show processing indicator when processing', () => {
    const mockOnSync = vi.fn();

    render(<SyncCard isProcessing={true} onSync={mockOnSync} />);

    expect(screen.getByText('🔄 Sincronización en progreso...')).toBeInTheDocument();
    expect(screen.getByText('📄 Procesando múltiples databases')).toBeInTheDocument();
  });

  it('should not show processing indicator when not processing', () => {
    const mockOnSync = vi.fn();

    render(<SyncCard isProcessing={false} onSync={mockOnSync} />);

    expect(screen.queryByText('🔄 Sincronización en progreso...')).not.toBeInTheDocument();
    expect(screen.queryByText('📄 Procesando múltiples databases')).not.toBeInTheDocument();
  });

  it('should call onSync when button is clicked', () => {
    const mockOnSync = vi.fn();

    render(<SyncCard isProcessing={false} onSync={mockOnSync} />);

    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(mockOnSync).toHaveBeenCalledTimes(1);
  });

  it('should not call onSync when button is disabled', () => {
    const mockOnSync = vi.fn();

    render(<SyncCard isProcessing={true} onSync={mockOnSync} />);

    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(mockOnSync).not.toHaveBeenCalled();
  });

  it('should render manual sync description', () => {
    const mockOnSync = vi.fn();

    render(<SyncCard isProcessing={false} onSync={mockOnSync} />);

    expect(screen.getByText('📋 Manual')).toBeInTheDocument();
    expect(screen.getByText('Control total sobre cuándo sincronizar')).toBeInTheDocument();
  });

  it('should render correctly in both states', () => {
    const mockOnSync = vi.fn();

    const { rerender } = render(<SyncCard isProcessing={false} onSync={mockOnSync} />);

    // Estado inicial
    expect(screen.getByText('🚀 Sincronizar')).toBeInTheDocument();
    expect(screen.queryByText('🔄 Sincronización en progreso...')).not.toBeInTheDocument();

    rerender(<SyncCard isProcessing={true} onSync={mockOnSync} />);

    // Estado de procesamiento
    expect(screen.getByText('🔄 Sincronizando...')).toBeInTheDocument();
    expect(screen.getByText('🔄 Sincronización en progreso...')).toBeInTheDocument();
  });
}); 