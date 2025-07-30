import styled from 'styled-components';

export const SettingsContainer = styled.div`
  padding: 2rem 0rem;

  @media (max-width: 768px) {
    padding: 1.5rem 0rem;
  }

  @media (max-width: 480px) {
    padding: 1rem 0rem;
  }
`;

export const TabsContainer = styled.div`
  margin-top: 2rem;

  @media (max-width: 480px) {
    margin-top: 1.5rem;
  }
`;

export const TabsHeader = styled.div`
  display: flex;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  gap: 1rem;
  overflow-x: auto;

  /* Scrollbar styling for mobile */
  &::-webkit-scrollbar {
    height: 2px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.2);
    border-radius: 1px;
  }

  @media (max-width: 768px) {
    gap: 0.5rem;
    padding-bottom: 0.5rem;
  }

  @media (max-width: 480px) {
    gap: 0.25rem;
    flex-wrap: nowrap;
  }
`;

export const TabButton = styled.button<{ $isActive: boolean }>`
  padding: 0.75rem 1.5rem;
  background: ${props => props.$isActive ? 'rgba(16, 185, 129, 0.1)' : 'transparent'};
  border: none;
  border-bottom: ${props => props.$isActive ? '2px solid #10b981' : '2px solid transparent'};
  color: ${props => props.$isActive ? '#10b981' : '#ffffff'};
  cursor: pointer;
  font-size: 1rem;
  font-weight: 500;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  white-space: nowrap;
  font-family: var(--font-geist-sans);

  &:hover {
    background: ${props => props.$isActive
    ? 'rgba(16, 185, 129, 0.15)'
    : 'rgba(255, 255, 255, 0.05)'};
    color: ${props => props.$isActive ? '#10b981' : '#e5e7eb'};
  }

  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.3);
    border-radius: 0.25rem;
  }

  @media (max-width: 768px) {
    padding: 0.6rem 1.2rem;
    font-size: 0.95rem;
  }

  @media (max-width: 480px) {
    padding: 0.5rem 1rem;
    font-size: 0.9rem;
    gap: 0.35rem;
  }
`;

export const TabIcon = styled.span`
  font-size: 1.1rem;

  @media (max-width: 480px) {
    font-size: 1rem;
  }
`;

export const TabLabel = styled.span`
  @media (max-width: 480px) {
    font-size: 0.85rem;
  }
`;

export const DefaultContent = styled.div`
  text-align: center;
  font-size: 1.1rem;
  opacity: 0.8;
  color: var(--text-secondary);
  line-height: 1.6;

  @media (max-width: 768px) {
    padding: 1.5rem;
    font-size: 1rem;
  }

  @media (max-width: 480px) {
    padding: 1rem;
    font-size: 0.9rem;
  }
`; 