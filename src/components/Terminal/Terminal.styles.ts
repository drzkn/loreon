import styled from 'styled-components';

export const Container = styled.div`
  background: rgba(0, 0, 0, 0.9);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  overflow: hidden;
`;

export const HeaderContainer = styled.div`
  background: rgba(255, 255, 255, 0.1);
  padding: 0.75rem 1rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
`;

export const HeaderLeftSection = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

export const HeaderDot = styled.div<{ color: 'red' | 'yellow' | 'green' }>`
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: ${props =>
    props.color === 'red' ? '#ef4444' :
      props.color === 'yellow' ? '#f59e0b' : '#10b981'
  };
`;

export const HeaderTitle = styled.span`
  margin-left: 1rem;
  font-size: 0.9rem;
  font-weight: bold;
  color: white;
`;

export const HeaderRightSection = styled.div`
  display: flex;
  gap: 0.5rem;
`;

export const HeaderButton = styled.button`
  background: rgba(255, 255, 255, 0.1);
  border: none;
  border-radius: 4px;
  padding: 0.25rem 0.5rem;
  color: white;
  font-size: 0.8rem;
  cursor: pointer;
  
  &:hover {
    background: rgba(255, 255, 255, 0.2);
  }
`;

export const LogsContainer = styled.div`
  padding: 1rem;
  height: 300px;
  overflow-y: auto;
  font-family: Monaco, Consolas, "Courier New", monospace;
  font-size: 0.85rem;
  line-height: 1.4;
  color: #00ff00;
`;

export const LogsEmptyState = styled.div`
  color: #6b7280;
`;

export const LogsEntry = styled.div<{ logType: 'error' | 'success' | 'info' | 'default' }>`
  margin-bottom: 0.25rem;
  color: ${props =>
    props.logType === 'error' ? '#ef4444' :
      props.logType === 'success' ? '#10b981' :
        props.logType === 'info' ? '#3b82f6' : '#00ff00'
  };
`;

export const FooterContainer = styled.div`
  background: rgba(255, 255, 255, 0.05);
  padding: 0.5rem 1rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  font-size: 0.8rem;
  color: #6b7280;
  display: flex;
  justify-content: space-between;
`; 