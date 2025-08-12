import styled from 'styled-components';
import Link from 'next/link';

export const InstructionsContainer = styled.div`
  max-width: 600px;
  margin: 0 auto;
`;

export const Step = styled.div`
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 1rem;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
`;

export const StepNumber = styled.div`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  background: linear-gradient(135deg, #10b981, #059669);
  color: white;
  border-radius: 50%;
  font-weight: 600;
  font-size: 0.9rem;
  margin-bottom: 1rem;
`;

export const StepTitle = styled.h3`
  color: var(--text-primary);
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0 0 0.75rem 0;
`;

export const StepDescription = styled.p`
  color: var(--text-secondary);
  line-height: 1.6;
  margin: 0 0 1rem 0;
`;

export const CodeBlock = styled.code`
  background: rgba(0, 0, 0, 0.3);
  padding: 0.25rem 0.5rem;
  border-radius: 0.375rem;
  font-family: monospace;
  font-size: 0.85rem;
  color: #10b981;
`;

export const BackButton = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: rgba(255, 255, 255, 0.05);
  color: var(--text-primary);
  text-decoration: none;
  border-radius: 0.75rem;
  transition: all 0.2s ease;
  font-size: 0.9rem;
  
  &:hover {
    background: rgba(255, 255, 255, 0.08);
    transform: translateX(-2px);
  }
`;

export const ExternalLink = styled.a`
  color: #10b981;
  text-decoration: none;
  
  &:hover {
    text-decoration: underline;
  }
`;

export const InfoBox = styled.div`
  background: rgba(59, 130, 246, 0.1);
  border: 1px solid rgba(59, 130, 246, 0.2);
  padding: 1rem;
  border-radius: 0.75rem;
  margin-bottom: 2rem;
`;

export const InfoHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
`;

export const InfoTitle = styled.strong`
  color: #60a5fa;
`;

export const InfoText = styled.p`
  color: #93c5fd;
  font-size: 0.9rem;
  margin: 0;
  line-height: 1.5;
`;

export const StepList = styled.ul`
  color: var(--text-secondary);
  padding-left: 1.5rem;
`;
