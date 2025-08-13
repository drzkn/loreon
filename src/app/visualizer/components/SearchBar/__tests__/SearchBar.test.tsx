import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { SearchBar } from '../SearchBar';

describe('SearchBar', () => {
  it('debería renderizar correctamente con props básicas', () => {
    const mockOnChange = vi.fn();

    render(
      <SearchBar
        searchTerm="test"
        onSearchChange={mockOnChange}
      />
    );

    const input = screen.getByPlaceholderText('Buscar páginas...');
    expect(input).toBeInTheDocument();
    expect(input).toHaveValue('test');
  });

  it('debería manejar cambios en el input', () => {
    const mockOnChange = vi.fn();

    render(
      <SearchBar
        searchTerm=""
        onSearchChange={mockOnChange}
      />
    );

    const input = screen.getByPlaceholderText('Buscar páginas...');
    fireEvent.change(input, { target: { value: 'nuevo valor' } });

    expect(mockOnChange).toHaveBeenCalledWith('nuevo valor');
  });

  it('debería usar placeholder personalizado', () => {
    const mockOnChange = vi.fn();

    render(
      <SearchBar
        searchTerm=""
        onSearchChange={mockOnChange}
        placeholder="Buscar archivos..."
      />
    );

    expect(screen.getByPlaceholderText('Buscar archivos...')).toBeInTheDocument();
  });

  it('debería manejar términos de búsqueda vacíos y con espacios', () => {
    const mockOnChange = vi.fn();

    render(
      <SearchBar
        searchTerm="   "
        onSearchChange={mockOnChange}
      />
    );

    const input = screen.getByPlaceholderText('Buscar páginas...');
    expect(input).toHaveValue('   ');

    fireEvent.change(input, { target: { value: '' } });
    expect(mockOnChange).toHaveBeenCalledWith('');
  });
});

