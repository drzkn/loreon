import styled from 'styled-components';

export const Header = styled.header`
  margin-bottom: 3rem;
`;

export const Title = styled.h1`
  font-size: 3rem;
  font-weight: bold;
  margin-bottom: 1rem;
  background: var(--gradient-green);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;

  @media (max-width: 768px) {
    font-size: 2.5rem;
  }
`;

export const Description = styled.p`
  font-size: 1.2rem;
  color: var(--text-secondary);
  opacity: 0.8;
  line-height: 1.6;

  @media (max-width: 768px) {
    font-size: 1rem;
  }
`; 