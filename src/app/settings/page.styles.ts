import styled from 'styled-components';

export const SettingsContainer = styled.div`
  min-height: calc(100vh - var(--nav-height, 70px));
  background: var(--background);
  font-family: var(--font-geist-sans);
`;

export const SettingsHeader = styled.div`
  background: var(--background-light);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  padding: 2rem 2rem 0 2rem;
  
  @media (max-width: 768px) {
    padding: 1.5rem 1rem 0 1rem;
  }
`;

export const SettingsTitle = styled.h1`
  font-size: 2rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 1.5rem 0;
  font-family: var(--font-geist-sans);
  
  @media (max-width: 768px) {
    font-size: 1.75rem;
    margin: 0 0 1rem 0;
  }
`;

export const TabsContainer = styled.div`
  display: flex;
  gap: 0.25rem;
  margin-bottom: 0;
`;

export const Tab = styled.div<{ $isActive: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.875rem 1.25rem;
  border-radius: 0.5rem 0.5rem 0 0;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid transparent;
  border-bottom: none;
  position: relative;
  
  ${({ $isActive }) => $isActive ? `
    background: var(--background);
    border-color: rgba(255, 255, 255, 0.08);
    color: var(--text-primary);
    
    &::after {
      content: '';
      position: absolute;
      bottom: -1px;
      left: 0;
      right: 0;
      height: 1px;
      background: var(--background);
    }
  ` : `
    background: rgba(255, 255, 255, 0.02);
    color: var(--text-secondary);
    
    &:hover {
      background: rgba(255, 255, 255, 0.05);
      color: var(--text-primary);
    }
  `}
  
  @media (max-width: 768px) {
    padding: 0.75rem 1rem;
    gap: 0.375rem;
  }
`;

export const TabIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`;

export const TabLabel = styled.span`
  font-size: 0.9rem;
  font-weight: 500;
  white-space: nowrap;
  
  @media (max-width: 768px) {
    font-size: 0.85rem;
  }
`;

export const ContentContainer = styled.div`
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
  
  @media (max-width: 768px) {
    padding: 1.5rem 1rem;
  }
`;