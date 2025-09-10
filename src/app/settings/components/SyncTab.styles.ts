import styled from 'styled-components';

export const SyncContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2rem;
`;

export const SyncSection = styled.div`
  background: ${({ theme }) => theme.colors.bgSecondary};
  border-radius: 12px;
  border: 1px solid ${({ theme }) => theme.colors.glassMedium};
  padding: 2rem;
`;

export const SectionTitle = styled.h2`
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0 0 0.5rem 0;
  color: ${({ theme }) => theme.colors.textPrimary};
`;

export const SectionDescription = styled.p`
  color: ${({ theme }) => theme.colors.textSecondary};
  margin: 0 0 1.5rem 0;
  line-height: 1.5;
`;

export const SyncCard = styled.div`
  background: ${({ theme }) => theme.colors.bgTertiary};
  border: 1px solid ${({ theme }) => theme.colors.glassLight};
  border-radius: 8px;
  overflow: hidden;
`;

export const SyncCardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 1.5rem 1.5rem 1rem 1.5rem;
  border-bottom: 1px solid ${({ theme }) => theme.colors.glassMedium};
`;

export const SyncCardTitle = styled.h3`
  font-size: 1rem;
  font-weight: 600;
  margin: 0 0 0.25rem 0;
  color: ${({ theme }) => theme.colors.textPrimary};
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

export const SyncCardDescription = styled.p`
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.textSecondary};
  margin: 0;
`;

export const SyncCardContent = styled.div`
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

export const DatabaseInputContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

export const DatabaseLabel = styled.label`
  font-size: 0.875rem;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.textPrimary};
`;

export const DatabaseInput = styled.input`
  padding: 0.75rem;
  border: 1px solid ${({ theme }) => theme.colors.glassMedium};
  border-radius: 6px;
  background: ${({ theme }) => theme.colors.bgPrimary};
  color: ${({ theme }) => theme.colors.textPrimary};
  font-size: 0.875rem;
  transition: all 0.2s ease;

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary500};
    box-shadow: 0 0 0 2px ${({ theme }) => theme.colors.primary500}20;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &::placeholder {
    color: ${({ theme }) => theme.colors.textMuted};
  }
`;

export const SyncButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, ${({ theme }) => theme.colors.primary500}, ${({ theme }) => theme.colors.secondary500});
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  align-self: flex-start;

  &:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px ${({ theme }) => theme.colors.primary500}40;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`;

export const StatusBadge = styled.span<{ $isActive: boolean }>`
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 500;
  background: ${({ $isActive, theme }) =>
    $isActive ? theme.colors.warning : theme.colors.success};
  color: ${({ theme }) => theme.colors.bgPrimary};
`;

export const ProgressContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

export const ProgressText = styled.div`
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.textSecondary};
  text-align: center;
`;

export const ProgressBar = styled.div`
  width: 100%;
  height: 8px;
  background: ${({ theme }) => theme.colors.glassMedium};
  border-radius: 4px;
  overflow: hidden;
`;

export const LogContainer = styled.div`
  max-height: 300px;
  overflow-y: auto;
  background: ${({ theme }) => theme.colors.bgPrimary};
  border: 1px solid ${({ theme }) => theme.colors.glassMedium};
  border-radius: 6px;
  padding: 1rem;
  
  /* Custom scrollbar */
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: ${({ theme }) => theme.colors.glassMedium};
    border-radius: 3px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: ${({ theme }) => theme.colors.textMuted};
    border-radius: 3px;
  }
`;

export const LogEntry = styled.div<{ $type: 'info' | 'success' | 'error' | 'warning' }>`
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0.5rem 0;
  border-bottom: 1px solid ${({ theme }) => theme.colors.glassMedium};
  
  &:last-child {
    border-bottom: none;
  }
  
  svg {
    margin-top: 0.125rem;
    color: ${({ $type, theme }) => {
    switch ($type) {
      case 'success': return theme.colors.success;
      case 'error': return theme.colors.error;
      case 'warning': return theme.colors.warning;
      default: return theme.colors.info;
    }
  }};
  }
  
  div {
    flex: 1;
    font-size: 0.875rem;
    line-height: 1.4;
    color: ${({ theme }) => theme.colors.textPrimary};
    
    small {
      color: ${({ theme }) => theme.colors.textMuted};
      font-size: 0.75rem;
    }
  }
`;

export const InfoAlert = styled.div`
  background: ${({ theme }) => theme.colors.bgTertiary};
  border: 1px solid ${({ theme }) => theme.colors.info}40;
  border-radius: 8px;
  padding: 1rem;
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  
  svg {
    color: ${({ theme }) => theme.colors.info};
    margin-top: 0.125rem;
  }
  
  div {
    color: ${({ theme }) => theme.colors.textSecondary};
    font-size: 0.9rem;
    line-height: 1.5;
    
    strong {
      color: ${({ theme }) => theme.colors.textPrimary};
    }
  }
`;
