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