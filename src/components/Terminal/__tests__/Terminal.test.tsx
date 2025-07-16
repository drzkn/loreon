import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Terminal } from '../Terminal';

// Mock scrollIntoView
const mockScrollIntoView = vi.fn();
Element.prototype.scrollIntoView = mockScrollIntoView;

describe('Terminal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render terminal with empty logs', () => {
    const mockOnClearLogs = vi.fn();

    render(<Terminal logs={[]} isProcessing={false} onClearLogs={mockOnClearLogs} />);

    expect(screen.getByText('🖥️ Terminal de Sincronización')).toBeInTheDocument();
    expect(screen.getByText('Esperando logs de sincronización...')).toBeInTheDocument();
    expect(screen.getByText('Logs: 0')).toBeInTheDocument();
    expect(screen.getByText('⏸️ Inactivo')).toBeInTheDocument();
  });

  it('should render terminal with logs', () => {
    const mockOnClearLogs = vi.fn();
    const logs = ['Log 1', 'Log 2', 'Log 3'];

    render(<Terminal logs={logs} isProcessing={false} onClearLogs={mockOnClearLogs} />);

    expect(screen.getByText('Log 1')).toBeInTheDocument();
    expect(screen.getByText('Log 2')).toBeInTheDocument();
    expect(screen.getByText('Log 3')).toBeInTheDocument();
    expect(screen.getByText('Logs: 3')).toBeInTheDocument();
  });

  it('should render processing state correctly', () => {
    const mockOnClearLogs = vi.fn();

    render(<Terminal logs={[]} isProcessing={true} onClearLogs={mockOnClearLogs} />);

    expect(screen.getByText('🔄 Procesando...')).toBeInTheDocument();
    expect(screen.queryByText('⏸️ Inactivo')).not.toBeInTheDocument();
  });

  it('should render inactive state correctly', () => {
    const mockOnClearLogs = vi.fn();

    render(<Terminal logs={[]} isProcessing={false} onClearLogs={mockOnClearLogs} />);

    expect(screen.getByText('⏸️ Inactivo')).toBeInTheDocument();
    expect(screen.queryByText('🔄 Procesando...')).not.toBeInTheDocument();
  });

  it('should call onClearLogs when clear button is clicked', () => {
    const mockOnClearLogs = vi.fn();

    render(<Terminal logs={['Log 1']} isProcessing={false} onClearLogs={mockOnClearLogs} />);

    const clearButton = screen.getByText('🗑️ Limpiar');
    fireEvent.click(clearButton);

    expect(mockOnClearLogs).toHaveBeenCalledTimes(1);
  });

  it('should render clear button', () => {
    const mockOnClearLogs = vi.fn();

    render(<Terminal logs={[]} isProcessing={false} onClearLogs={mockOnClearLogs} />);

    const clearButton = screen.getByText('🗑️ Limpiar');
    expect(clearButton).toBeInTheDocument();
    expect(clearButton.tagName).toBe('BUTTON');
  });

  it('should update log count correctly', () => {
    const mockOnClearLogs = vi.fn();

    const { rerender } = render(<Terminal logs={[]} isProcessing={false} onClearLogs={mockOnClearLogs} />);
    expect(screen.getByText('Logs: 0')).toBeInTheDocument();

    rerender(<Terminal logs={['Log 1', 'Log 2']} isProcessing={false} onClearLogs={mockOnClearLogs} />);
    expect(screen.getByText('Logs: 2')).toBeInTheDocument();

    rerender(<Terminal logs={['Log 1', 'Log 2', 'Log 3', 'Log 4']} isProcessing={false} onClearLogs={mockOnClearLogs} />);
    expect(screen.getByText('Logs: 4')).toBeInTheDocument();
  });

  it('should handle empty logs array', () => {
    const mockOnClearLogs = vi.fn();

    render(<Terminal logs={[]} isProcessing={false} onClearLogs={mockOnClearLogs} />);

    expect(screen.getByText('Esperando logs de sincronización...')).toBeInTheDocument();
    expect(screen.queryByText('Log 1')).not.toBeInTheDocument();
  });

  it('should render terminal structure correctly', () => {
    const mockOnClearLogs = vi.fn();

    render(<Terminal logs={['Test log']} isProcessing={false} onClearLogs={mockOnClearLogs} />);

    // Verificar que todos los componentes internos están presentes
    expect(screen.getByText('🖥️ Terminal de Sincronización')).toBeInTheDocument();
    expect(screen.getByText('🗑️ Limpiar')).toBeInTheDocument();
    expect(screen.getByText('Test log')).toBeInTheDocument();
    expect(screen.getByText('Logs: 1')).toBeInTheDocument();
    expect(screen.getByText('⏸️ Inactivo')).toBeInTheDocument();
  });
}); 