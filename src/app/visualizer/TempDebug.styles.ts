import styled from 'styled-components';

export const Container = styled.div`
  position: fixed;
  top: 80px;
  right: 10px;
  background: rgba(0, 0, 0, 0.95);
  color: white;
  padding: 1rem;
  border-radius: 8px;
  max-width: 450px;
  font-size: 12px;
  z-index: 10000;
  font-family: monospace;
  border: 2px solid #10b981;
`;

export const Title = styled.h3`
  margin: 0 0 1rem 0;
  color: #10b981;
`;

export const ButtonContainer = styled.div`
  margin-bottom: 1rem;
`;

export const TestButton = styled.button`
  background: #10b981;
  color: white;
  border: none;
  padding: 8px 12px;
  margin-right: 8px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 11px;
`;

export const SupabaseButton = styled.button`
  background: #3b82f6;
  color: white;
  border: none;
  padding: 8px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 11px;
`;

export const ResultDisplay = styled.pre`
  background: rgba(255, 255, 255, 0.1);
  padding: 8px;
  border-radius: 4px;
  white-space: pre-wrap;
  max-height: 250px;
  overflow: auto;
  margin: 0;
  font-size: 10px;
  line-height: 1.3;
`; 