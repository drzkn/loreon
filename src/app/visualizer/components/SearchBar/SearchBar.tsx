import { SearchContainer, SearchInput } from './SearchBar.styles';

interface SearchBarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  placeholder?: string;
}

export function SearchBar({
  searchTerm,
  onSearchChange,
  placeholder = "Buscar páginas..."
}: SearchBarProps) {
  return (
    <SearchContainer>
      <SearchInput
        type="text"
        placeholder={placeholder}
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
      />
    </SearchContainer>
  );
}
