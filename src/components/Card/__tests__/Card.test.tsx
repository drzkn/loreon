import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Card } from '../Card';

describe('Card', () => {
  const defaultProps = {
    title: "📋 Manual",
    description: "Control total sobre cuándo sincronizar"
  };

  it('should render title and description', () => {
    render(<Card {...defaultProps} />);

    expect(screen.getByText('📋 Manual')).toBeInTheDocument();
    expect(screen.getByText('Control total sobre cuándo sincronizar')).toBeInTheDocument();
  });

  it('should render with custom title and description', () => {
    const customProps = {
      title: "📊 Automático",
      description: "Sincronización automática configurada"
    };

    render(<Card {...customProps} />);

    expect(screen.getByText('📊 Automático')).toBeInTheDocument();
    expect(screen.getByText('Sincronización automática configurada')).toBeInTheDocument();
  });

  it('should render children when provided', () => {
    render(
      <Card {...defaultProps}>
        <button>Test Button</button>
      </Card>
    );

    expect(screen.getByText('📋 Manual')).toBeInTheDocument();
    expect(screen.getByText('Control total sobre cuándo sincronizar')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Test Button' })).toBeInTheDocument();
  });

  it('should render without children', () => {
    render(<Card {...defaultProps} />);

    expect(screen.getByText('📋 Manual')).toBeInTheDocument();
    expect(screen.getByText('Control total sobre cuándo sincronizar')).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('should render with multiple children', () => {
    render(
      <Card {...defaultProps}>
        <button>Primary Action</button>
        <button>Secondary Action</button>
        <p>Additional content</p>
      </Card>
    );

    expect(screen.getByText('📋 Manual')).toBeInTheDocument();
    expect(screen.getByText('Control total sobre cuándo sincronizar')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Primary Action' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Secondary Action' })).toBeInTheDocument();
    expect(screen.getByText('Additional content')).toBeInTheDocument();
  });
}); 