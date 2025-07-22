import styled from 'styled-components';

export const HomeContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  color: var(--text-primary);
  font-family: var(--font-geist-sans);
`;

export const Header = styled.header`
  margin-bottom: 3rem;
`;

export const MainTitle = styled.h1`
  font-size: 3rem;
  font-weight: bold;
  margin-bottom: 1rem;
  background: var(--gradient-surface);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;

  @media (max-width: 768px) {
    font-size: 2.5rem;
  }
`;

export const Subtitle = styled.p`
  font-size: 1.2rem;
  color: var(--text-secondary);
  line-height: 1.6;
`;

export const FeaturesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
  margin-bottom: 3rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

export const MainSection = styled.section`
  background: var(--nav-active);
  backdrop-filter: blur(var(--backdrop-blur));
  border-radius: 16px;
  padding: 2rem;
  border: 1px solid var(--nav-active-border);
  text-align: center;
`;

export const SectionTitle = styled.h2`
  font-size: 2rem;
  margin-bottom: 1rem;
  color: var(--success-500);
`;

export const CharacteristicsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-top: 2rem;
`;

export const CharacteristicItem = styled.div`
  text-align: center;
`;

export const CharacteristicTitle = styled.h3`
  font-size: 1.2rem;
  margin-bottom: 0.5rem;
  color: var(--text-primary);
`;

export const CharacteristicDescription = styled.p`
  color: var(--text-secondary);
  opacity: 0.8;
`;

export const Footer = styled.footer`
  text-align: center;
  margin-top: 3rem;
  padding: 2rem;
  opacity: 0.6;
`;

export const FooterText = styled.p`
  color: var(--text-secondary);
`; 