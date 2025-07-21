import { FooterContainer } from './Terminal.styles';

interface TerminalFooterProps {
  logCount: number;
  isProcessing: boolean;
}

export const TerminalFooter = ({ logCount, isProcessing }: TerminalFooterProps) => {
  return (
    <FooterContainer>
      <span>
        Logs: {logCount}
      </span>
      <span>
        {isProcessing ? '🔄 Procesando...' : '⏸️ Inactivo'}
      </span>
    </FooterContainer>
  );
}; 