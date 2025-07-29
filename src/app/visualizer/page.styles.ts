import styled from 'styled-components';

export const VisualizerContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: calc(100vh - var(--nav-height, 70px));
  width: 100vw;
  position: fixed;
  top: var(--nav-height, 70px);
  left: 0;
  background: var(--background);
  font-family: var(--font-geist-sans);
  overflow: hidden;
`;

export const HeaderSection = styled.div`
  padding: 2rem 1.5rem 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  background: var(--background);
  text-align: center;
`;

export const Title = styled.h1`
  font-size: 2rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 0.5rem;
  letter-spacing: -0.025em;
  background: linear-gradient(135deg, #10b981, #059669);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;

export const Subtitle = styled.p`
  font-size: 0.95rem;
  line-height: 1.6;
  color: var(--text-secondary);
  opacity: 0.8;
  max-width: 32rem;
  margin: 0 auto;
`;

export const MainContent = styled.div`
  flex: 1;
  display: flex;
  overflow: hidden;
`;

export const SidebarSection = styled.div`
  width: 350px;
  min-width: 350px;
  background: rgba(255, 255, 255, 0.02);
  border-right: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  flex-direction: column;
  
  @media (max-width: 768px) {
    width: 100%;
    min-width: 100%;
    ${props => props.hidden && 'display: none;'}
  }
`;

export const SearchContainer = styled.div`
  padding: 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
`;

export const SearchInput = styled.input`
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.75rem;
  background: rgba(255, 255, 255, 0.03);
  color: var(--text-primary);
  font-family: var(--font-geist-sans);
  font-size: 0.9rem;
  outline: none;
  transition: all 0.2s ease;
  
  &::placeholder {
    color: var(--text-secondary);
    opacity: 0.6;
  }
  
  &:focus {
    border-color: rgba(16, 185, 129, 0.4);
    box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
    background: rgba(255, 255, 255, 0.05);
  }
`;

export const PagesList = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 0.5rem;
  
  &::-webkit-scrollbar {
    width: 3px;
  }
  
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  
  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 2px;
  }
  
  &::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.2);
  }
`;

export const PageItem = styled.div<{ $isSelected: boolean }>`
  padding: 0.75rem 1rem;
  margin-bottom: 0.5rem;
  border-radius: 0.75rem;
  cursor: pointer;
  transition: all 0.2s ease;
  background: ${props => props.$isSelected
    ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(5, 150, 105, 0.2))'
    : 'transparent'};
  border: 1px solid ${props => props.$isSelected
    ? 'rgba(16, 185, 129, 0.3)'
    : 'transparent'};
  
  &:hover {
    background: ${props => props.$isSelected
    ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.25), rgba(5, 150, 105, 0.25))'
    : 'rgba(255, 255, 255, 0.05)'};
    border-color: rgba(255, 255, 255, 0.1);
  }
`;

export const PageTitle = styled.h3`
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--text-primary);
  margin-bottom: 0.25rem;
  line-height: 1.4;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

export const PagePreview = styled.p`
  font-size: 0.8rem;
  color: var(--text-secondary);
  opacity: 0.7;
  line-height: 1.3;
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

export const PageDate = styled.div`
  font-size: 0.75rem;
  color: var(--text-secondary);
  opacity: 0.5;
  margin-top: 0.25rem;
`;

export const ContentSection = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  
  @media (max-width: 768px) {
    ${props => props.hidden && 'display: none;'}
  }
`;

export const ContentHeader = styled.div`
  padding: 1rem 1.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.02);
  display: flex;
  align-items: center;
  justify-content: space-between;
  
  @media (max-width: 768px) {
    padding: 1rem;
  }
`;

export const ContentTitle = styled.h2`
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
  line-height: 1.4;
`;

export const BackButton = styled.button`
  display: none;
  padding: 0.5rem 1rem;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 0.5rem;
  color: var(--text-primary);
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.15);
  }
  
  @media (max-width: 768px) {
    display: block;
  }
`;

export const MarkdownContent = styled.div`
  flex: 1;
  padding: 1.5rem;
  overflow-y: auto;
  line-height: 1.7;
  color: var(--text-primary);
  
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  
  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 3px;
  }
  
  &::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.2);
  }
  
  h1, h2, h3, h4, h5, h6 {
    color: var(--text-primary);
    margin: 1.5rem 0 0.75rem 0;
    font-weight: 600;
    line-height: 1.3;
  }
  
  h1 { 
    font-size: 2rem; 
    background: linear-gradient(135deg, #10b981, #059669);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  h2 { 
    font-size: 1.5rem; 
    color: #10b981;
  }
  h3 { font-size: 1.25rem; }
  h4 { font-size: 1.1rem; }
  h5 { font-size: 1rem; }
  h6 { font-size: 0.9rem; opacity: 0.8; }
  
  p {
    margin: 0.75rem 0;
    line-height: 1.7;
  }
  
  code {
    background: rgba(255, 255, 255, 0.1);
    padding: 0.25rem 0.5rem;
    border-radius: 0.25rem;
    font-family: 'Monaco', 'Menlo', monospace;
    font-size: 0.85rem;
  }
  
  pre {
    background: rgba(0, 0, 0, 0.3);
    padding: 1rem;
    border-radius: 0.5rem;
    overflow-x: auto;
    margin: 1rem 0;
    border: 1px solid rgba(255, 255, 255, 0.1);
    
    code {
      background: none;
      padding: 0;
      font-size: 0.85rem;
      line-height: 1.4;
    }
  }
  
  blockquote {
    border-left: 3px solid #10b981;
    padding-left: 1rem;
    margin: 1rem 0;
    opacity: 0.8;
    font-style: italic;
    background: rgba(16, 185, 129, 0.05);
    padding: 1rem;
    border-radius: 0.5rem;
  }
  
  ul, ol {
    padding-left: 1.5rem;
    margin: 0.75rem 0;
  }
  
  li {
    margin: 0.25rem 0;
    line-height: 1.6;
  }
  
  a {
    color: #10b981;
    text-decoration: none;
    border-bottom: 1px solid transparent;
    transition: all 0.2s ease;
    
    &:hover {
      border-bottom-color: #10b981;
    }
  }
  
  hr {
    border: none;
    border-top: 1px solid rgba(255, 255, 255, 0.2);
    margin: 2rem 0;
  }
  
  /* Estilos para toggle headings (details/summary) */
  details {
    margin: 1rem 0;
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.02);
    overflow: hidden;
  }
  
  summary {
    cursor: pointer;
    padding: 0.75rem 1rem;
    list-style: none;
    outline: none;
    transition: all 0.2s ease;
    position: relative;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    
    &:hover {
      background: rgba(255, 255, 255, 0.05);
    }
    
    &::-webkit-details-marker {
      display: none;
    }
    
    /* Flecha personalizada */
    &::before {
      content: '▶';
      color: #10b981;
      font-size: 0.8em;
      transition: transform 0.2s ease;
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 1.2em;
      height: 1.2em;
    }
  }
  
  details[open] summary::before {
    transform: rotate(90deg);
  }

  /* Estilos específicos para imágenes */
  .markdown-image-container {
    text-align: center;
    margin: 1.5rem 0;
  }
  
  .markdown-image-container img {
    max-width: 100%;
    height: auto;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    transition: transform 0.2s ease, box-shadow 0.2s ease;
    cursor: pointer;
    
    &:hover {
      transform: scale(1.02);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
    }
  }
  
  /* Mejorar el contraste del texto en elementos específicos */
  strong {
    color: #ffffff;
    font-weight: 600;
  }
  
  em {
    color: #e5e7eb;
    font-style: italic;
  }
  
  del {
    opacity: 0.6;
    text-decoration: line-through;
  }
  
  /* Estilos responsivos */
  @media (max-width: 768px) {
    padding: 1rem;
    
    h1 { font-size: 1.5rem; }
    h2 { font-size: 1.25rem; }
    h3 { font-size: 1.1rem; }
    
    .markdown-image-container img {
      border-radius: 6px;
      
      &:hover {
        transform: none;
      }
    }
  }
`;

export const EmptyState = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 2rem;
  color: var(--text-secondary);
`;

export const EmptyIcon = styled.div`
  font-size: 3rem;
  margin-bottom: 1rem;
  opacity: 0.5;
`;

export const EmptyTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: 500;
  margin-bottom: 0.5rem;
  color: var(--text-primary);
`;

export const EmptyDescription = styled.p`
  font-size: 0.9rem;
  opacity: 0.7;
  line-height: 1.6;
`;

export const LoadingSpinner = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  color: var(--text-secondary);
  
  &::before {
    content: '';
    width: 2rem;
    height: 2rem;
    border: 2px solid rgba(255, 255, 255, 0.1);
    border-top: 2px solid #10b981;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-right: 0.75rem;
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`; 