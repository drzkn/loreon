import styled from 'styled-components';

export const PagesListContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 0.5rem;
`;

export const PageItem = styled.div<{ $isSelected?: boolean }>`
  padding: 1rem;
  margin-bottom: 0.5rem;
  background: ${props => props.$isSelected
    ? 'rgba(16, 185, 129, 0.1)'
    : 'rgba(255, 255, 255, 0.03)'};
  border: 1px solid ${props => props.$isSelected
    ? 'rgba(16, 185, 129, 0.3)'
    : 'rgba(255, 255, 255, 0.1)'};
  border-radius: 0.75rem;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: ${props => props.$isSelected
    ? 'rgba(16, 185, 129, 0.15)'
    : 'rgba(255, 255, 255, 0.05)'};
    border-color: ${props => props.$isSelected
    ? 'rgba(16, 185, 129, 0.4)'
    : 'rgba(255, 255, 255, 0.2)'};
  }
`;

export const PageTitle = styled.h3`
  margin: 0 0 0.5rem 0;
  color: white;
  font-size: 1rem;
  font-weight: 600;
  line-height: 1.4;
`;

export const PagePreview = styled.p`
  margin: 0 0 0.75rem 0;
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.875rem;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

export const PageDate = styled.div`
  color: rgba(255, 255, 255, 0.5);
  font-size: 0.75rem;
  font-weight: 500;
`;

export const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1.5rem;
  text-align: center;
  height: 100%;
  min-height: 300px;
`;

export const EmptyTitle = styled.h3`
  margin: 1rem 0 0.5rem 0;
  color: white;
  font-size: 1.125rem;
  font-weight: 600;
`;

export const EmptyDescription = styled.p`
  margin: 0;
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.875rem;
  line-height: 1.5;
  max-width: 400px;

  strong {
    color: white;
  }

  code {
    background: rgba(255, 255, 255, 0.1);
    padding: 0.25rem 0.5rem;
    border-radius: 0.25rem;
    font-family: 'Monaco', 'Menlo', monospace;
    font-size: 0.8rem;
  }
`;

export const LoadingSpinner = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.875rem;
`;

