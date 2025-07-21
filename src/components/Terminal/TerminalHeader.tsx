import {
  HeaderContainer,
  HeaderLeftSection,
  HeaderDot,
  HeaderTitle,
  HeaderRightSection,
  HeaderButton
} from './Terminal.styles';

interface TerminalHeaderProps {
  onClearLogs: () => void;
}

export const TerminalHeader = ({ onClearLogs }: TerminalHeaderProps) => {
  return (
    <HeaderContainer>
      <HeaderLeftSection>
        <HeaderDot color="red" />
        <HeaderDot color="yellow" />
        <HeaderDot color="green" />
        <HeaderTitle>
          🖥️ Terminal de Sincronización
        </HeaderTitle>
      </HeaderLeftSection>
      <HeaderRightSection>
        <HeaderButton onClick={onClearLogs}>
          🗑️ Limpiar
        </HeaderButton>
      </HeaderRightSection>
    </HeaderContainer>
  );
}; 