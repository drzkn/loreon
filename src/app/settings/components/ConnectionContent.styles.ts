import styled from 'styled-components';

export const Container = styled.div`
  display: flex;
  flex-direction: column;
  font-family: var(--font-geist-sans);
`;

export const MainContent = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1rem; 
  padding-top: 2rem; 
`;

export const ProcessingInfo = styled.div`
  margin-top: 1rem;
  padding: 0.75rem 1rem;
  background: rgba(16, 185, 129, 0.1);
  border: 1px solid rgba(16, 185, 129, 0.2);
  border-radius: 0.5rem;
  font-size: 0.85rem;
  color: var(--text-secondary);
  line-height: 1.4;

  @media (max-width: 480px) {
    padding: 0.5rem 0.75rem;
    font-size: 0.8rem;
  }
`;

export const ButtonContainer = styled.div`
  display: flex;
  gap: 0.75rem;
  flex-shrink: 0;
  
  /* En desktop, el botón mantiene su tamaño natural */
  & > button {
    min-width: 200px;
    white-space: nowrap;
  }
  
  @media (max-width: 768px) {
    width: 100%;
    gap: 0.5rem;
    
    /* En tablet y mobile, el botón ocupa todo el ancho */
    & > button {
      width: 100%;
      min-width: unset;
    }
  }

  @media (max-width: 480px) {
    gap: 0.5rem;
    
    /* En mobile, el botón ocupa todo el ancho */
    & > button {
      width: 100%;
      min-width: unset;
    }
  }
`;

export const InfoCard = styled.div`
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 0.75rem;
  padding: 1.25rem;
  display: flex;
  align-items: center;
  gap: 2rem;
  
  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
    padding: 1rem;
    border-radius: 0.5rem;
  }

  @media (max-width: 480px) {
    padding: 0.75rem;
    gap: 0.75rem;
  }
`;

export const InfoContent = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

export const InfoTitle = styled.h3`
  font-size: 1rem;
  font-weight: 500;
  color: var(--text-primary);
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;

  @media (max-width: 768px) {
    font-size: 0.95rem;
  }

  @media (max-width: 480px) {
    font-size: 0.9rem;
  }
`;

export const InfoDescription = styled.p`
  font-size: 0.85rem;
  color: var(--text-secondary);
  line-height: 1.6;
  opacity: 0.8;
  margin: 0;

  @media (max-width: 480px) {
    font-size: 0.8rem;
    line-height: 1.5;
  }
`;

export const TerminalContainer = styled.div`
  @media (max-width: 480px) {
    /* Asegurar que el Terminal use todo el ancho */
    & > div {
      border-radius: 0.5rem;
    }
  }
`;

/* === ESTILOS PARA GESTIÓN DE TOKENS === */

export const TokenSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

export const TokenList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-top: 1rem;
`;

export const TokenItem = styled.div`
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 0.5rem;
  padding: 1rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  
  @media (max-width: 768px) {
    gap: 0.75rem;
  }
`;

export const TokenInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  flex: 1;
`;

export const TokenName = styled.span`
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--text-primary);
`;

export const TokenProvider = styled.span`
  font-size: 0.75rem;
  color: var(--text-secondary);
  opacity: 0.7;
  text-transform: capitalize;
`;

export const TokenActions = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-left: auto;
  flex-shrink: 0;
  
  @media (max-width: 768px) {
    margin-left: auto;
  }
`;

export const TokenActionButton = styled.button`
  background: none;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 0.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.1);
    color: var(--text-primary);
  }
  
  &.delete {
    color: #ef4444;
    &:hover {
      background: rgba(239, 68, 68, 0.1);
    }
  }
`;

export const AddTokenForm = styled.div`
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 0.5rem;
  padding: 1.25rem;
  margin-top: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

export const FormRow = styled.div`
  display: flex;
  gap: 1rem;
  
  @media (max-width: 768px) {
    flex-direction: column;
    gap: 0.75rem;
  }
`;

export const FormField = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

export const FormLabel = styled.label`
  font-size: 0.85rem;
  color: var(--text-secondary);
  font-weight: 500;
`;

export const FormInput = styled.input`
  padding: 0.75rem;
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 0.375rem;
  background: rgba(0, 0, 0, 0.2);
  color: var(--text-primary);
  font-size: 0.9rem;
  
  &:focus {
    outline: none;
    border-color: var(--accent-color);
    box-shadow: 0 0 0 2px rgba(var(--accent-color-rgb), 0.2);
  }
  
  &::placeholder {
    color: var(--text-secondary);
    opacity: 0.5;
  }
`;

export const FormSelect = styled.select`
  padding: 0.75rem;
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 0.375rem;
  background: rgba(0, 0, 0, 0.2);
  color: var(--text-primary);
  font-size: 0.9rem;
  cursor: pointer;
  
  &:focus {
    outline: none;
    border-color: var(--accent-color);
    box-shadow: 0 0 0 2px rgba(var(--accent-color-rgb), 0.2);
  }
`;

export const FormActions = styled.div`
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
  margin-top: 0.5rem;
  
  @media (max-width: 768px) {
    gap: 0.5rem;
  }
`;

export const EmptyTokensState = styled.div`
  text-align: center;
  padding: 2rem 1rem;
  color: var(--text-secondary);
  opacity: 0.7;
  
  h4 {
    margin: 0 0 0.5rem 0;
    font-size: 1rem;
    color: var(--text-primary);
  }
  
  p {
    margin: 0;
    font-size: 0.85rem;
    line-height: 1.5;
  }
`;

export const StatusMessage = styled.div`
  padding: 0.75rem 1rem;
  border-radius: 0.375rem;
  font-size: 0.85rem;
  margin-bottom: 1rem;
  
  &.success {
    background: rgba(16, 185, 129, 0.1);
    border: 1px solid rgba(16, 185, 129, 0.2);
    color: #10b981;
  }
  
  &.error {
    background: rgba(239, 68, 68, 0.1);
    border: 1px solid rgba(239, 68, 68, 0.2);
    color: #ef4444;
  }
`;

/* === ESTILOS PARA SUB-PESTAÑAS === */

export const SubTabsContainer = styled.div`
  display: flex;
  gap: 0.25rem;
  margin: 1.5rem 0 1rem 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  overflow-x: auto;
  
  @media (max-width: 768px) {
    gap: 0.125rem;
  }
`;

export const SubTab = styled.button<{ $isActive: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border: none;
  background: none;
  cursor: pointer;
  border-radius: 0.375rem 0.375rem 0 0;
  transition: all 0.2s ease;
  white-space: nowrap;
  min-width: fit-content;
  position: relative;
  
  ${({ $isActive }) => $isActive ? `
    background: rgba(255, 255, 255, 0.05);
    color: var(--text-primary);
    border-bottom: 2px solid var(--accent-color);
  ` : `
    color: var(--text-secondary);
    
    &:hover {
      background: rgba(255, 255, 255, 0.03);
      color: var(--text-primary);
    }
  `}
  
  @media (max-width: 768px) {
    padding: 0.625rem 0.75rem;
    gap: 0.375rem;
    font-size: 0.85rem;
  }
`;

export const TabContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-top: 1.5rem;
`; 