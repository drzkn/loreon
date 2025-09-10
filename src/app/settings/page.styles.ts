import styled from 'styled-components';

export const SettingsContainer = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: ${({ theme }) => theme.colors.bgPrimary};
  color: ${({ theme }) => theme.colors.textPrimary};
`;

export const SettingsHeader = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2rem;
  padding: 2rem;
  border-bottom: 1px solid ${({ theme }) => theme.colors.glassMedium};
  background: ${({ theme }) => theme.colors.bgSecondary};
`;

export const SettingsTitle = styled.h1`
  font-size: 2rem;
  font-weight: 600;
  margin: 0;
  color: ${({ theme }) => theme.colors.textPrimary};
`;

export const TabsContainer = styled.div`
  display: flex;
  gap: 0.5rem;
`;

export const Tab = styled.button<{ $isActive?: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.875rem 1.25rem;
  border: none;
  border-radius: 8px;
  background: ${({ $isActive, theme }) =>
    $isActive ? theme.colors.bgPrimary : 'transparent'};
  color: ${({ $isActive, theme }) =>
    $isActive ? theme.colors.textPrimary : theme.colors.textSecondary};
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 140px;
  justify-content: flex-start;

  &:hover {
    background: ${({ theme }) => theme.colors.bgPrimary};
    color: ${({ theme }) => theme.colors.textPrimary};
  }

  &:focus {
    outline: 2px solid ${({ theme }) => theme.colors.primary500};
    outline-offset: 2px;
  }
`;

export const TabIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
`;

export const TabLabel = styled.span`
  white-space: nowrap;
`;

export const ContentContainer = styled.div`
  flex: 1;
  padding: 2rem;
`;

export const SettingsSection = styled.div`
  background: ${({ theme }) => theme.colors.bgSecondary};
  border-radius: 12px;
  border: 1px solid ${({ theme }) => theme.colors.glassMedium};
  padding: 2rem;
  margin-bottom: 2rem;
`;

export const SectionTitle = styled.h2`
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0 0 1rem 0;
  color: ${({ theme }) => theme.colors.textPrimary};
`;

export const SectionDescription = styled.p`
  color: ${({ theme }) => theme.colors.textSecondary};
  margin: 0 0 1.5rem 0;
  line-height: 1.5;
`;

export const SettingItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 0;
  border-bottom: 1px solid ${({ theme }) => theme.colors.glassMedium};

  &:last-child {
    border-bottom: none;
  }
`;

export const SettingLabel = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

export const SettingTitle = styled.h3`
  font-size: 0.95rem;
  font-weight: 500;
  margin: 0;
  color: ${({ theme }) => theme.colors.textPrimary};
`;

export const SettingDescription = styled.p`
  font-size: 0.85rem;
  color: ${({ theme }) => theme.colors.textSecondary};
  margin: 0;
`;

export const SettingControl = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

export const InfoCard = styled.div`
  background: ${({ theme }) => theme.colors.bgTertiary};
  border: 1px solid ${({ theme }) => theme.colors.glassLight};
  border-radius: 8px;
  padding: 1.5rem;
  display: flex;
  align-items: flex-start;
  gap: 1rem;
`;

export const InfoContent = styled.div`
  flex: 1;
`;

export const InfoTitle = styled.h3`
  font-size: 1rem;
  font-weight: 600;
  margin: 0 0 0.5rem 0;
  color: ${({ theme }) => theme.colors.textPrimary};
`;

export const InfoDescription = styled.p`
  font-size: 0.9rem;
  color: ${({ theme }) => theme.colors.textSecondary};
  margin: 0;
  line-height: 1.5;
`;
