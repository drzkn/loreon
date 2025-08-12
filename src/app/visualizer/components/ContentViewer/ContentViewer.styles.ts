import styled from 'styled-components';

export const ContentSection = styled.div<{ hidden?: boolean }>`
  flex: 1;
  display: ${props => props.hidden ? 'none' : 'flex'};
  flex-direction: column;
  background: rgba(255, 255, 255, 0.02);
  
  @media (min-width: 768px) {
    display: flex;
  }
`;

export const ContentHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.02);
`;

export const ContentTitle = styled.h2`
  margin: 0;
  color: white;
  font-size: 1.25rem;
  font-weight: 600;
`;

export const BackButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 0.5rem;
  color: white;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.15);
    border-color: rgba(255, 255, 255, 0.3);
  }

  @media (min-width: 768px) {
    display: none;
  }
`;

export const MarkdownContent = styled.div`
  flex: 1;
  padding: 2rem;
  overflow-y: auto;
  color: white;
  line-height: 1.7;

  h1, h2, h3, h4, h5, h6 {
    margin: 2rem 0 1rem 0;
    color: white;
    line-height: 1.3;
  }

  h1 { font-size: 2rem; }
  h2 { font-size: 1.5rem; }
  h3 { font-size: 1.25rem; }

  p {
    margin: 1rem 0;
    color: rgba(255, 255, 255, 0.9);
  }

  ul, ol {
    margin: 1rem 0;
    padding-left: 2rem;
    color: rgba(255, 255, 255, 0.9);
  }

  li {
    margin: 0.5rem 0;
  }

  code {
    background: rgba(255, 255, 255, 0.1);
    padding: 0.25rem 0.5rem;
    border-radius: 0.25rem;
    font-family: 'Monaco', 'Menlo', monospace;
    font-size: 0.9em;
  }

  pre {
    background: rgba(0, 0, 0, 0.3);
    padding: 1rem;
    border-radius: 0.5rem;
    overflow-x: auto;
    margin: 1.5rem 0;
  }

  pre code {
    background: none;
    padding: 0;
  }

  blockquote {
    border-left: 4px solid #10b981;
    margin: 1.5rem 0;
    padding: 1rem 1.5rem;
    background: rgba(16, 185, 129, 0.1);
    border-radius: 0 0.5rem 0.5rem 0;
    color: rgba(255, 255, 255, 0.9);
  }

  a {
    color: #10b981;
    text-decoration: none;
    
    &:hover {
      text-decoration: underline;
    }
  }

  img {
    max-width: 100%;
    height: auto;
    border-radius: 0.5rem;
    margin: 1rem 0;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    margin: 1.5rem 0;
  }

  th, td {
    padding: 0.75rem;
    border: 1px solid rgba(255, 255, 255, 0.2);
    text-align: left;
  }

  th {
    background: rgba(255, 255, 255, 0.1);
    font-weight: 600;
  }
`;

export const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  padding: 3rem;
  text-align: center;
`;

export const EmptyTitle = styled.h3`
  margin: 1rem 0 0.5rem 0;
  color: white;
  font-size: 1.5rem;
  font-weight: 600;
`;

export const EmptyDescription = styled.p`
  margin: 0;
  color: rgba(255, 255, 255, 0.7);
  font-size: 1rem;
  line-height: 1.5;
`;
