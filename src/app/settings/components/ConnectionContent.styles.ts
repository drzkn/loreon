import styled from 'styled-components';

export const Container = styled.div`
  max-width: 100%;
  max-height: 100%;
  margin: 0 auto;
  color: var(--text-primary);
  font-family: var(--font-geist-sans);
  border-radius: 8px;
`;

export const SyncSection = styled.section`
  background: var(--nav-active);
  backdrop-filter: blur(var(--backdrop-blur));
  -webkit-backdrop-filter: blur(var(--backdrop-blur));
  padding: 2rem;
  border: 1px solid var(--nav-active-border);
  border-radius: 8px;
`;

export const SyncTitle = styled.h2`
  font-size: 2rem;
  margin-bottom: 1rem;
  color: var(--success-500);
`;

export const SyncGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
  margin-top: 2rem;
`;

export const Section = styled.section`
  margin-top: 1rem;
`;

export const ProcessingInfo = styled.div`
  margin-top: 1rem;
  padding: 0.5rem;
  background: var(--nav-active);
  border-radius: 6px;
  font-size: 0.8rem;
`;

export const ButtonContainer = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
`; 