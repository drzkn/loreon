import styled, { css } from 'styled-components';

export const Container = styled.div`
  background: var(--glass-light);
  padding: 2rem;
  border-radius: 12px;
  border: 1px solid var(--border-glass);
  display: flex;
  flex-direction: column;
  height: 230px;
`;

export const Section = styled.section`
  display: flex;
  flex-direction: column;
  flex: 1;
`;

const titleBaseStyles = css`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--text-primary);
  font-weight: 600;
`;

export const TitleH2 = styled.h2`
  ${titleBaseStyles}
  font-size: 1.5rem;
  margin-bottom: 1rem;
`;

export const TitleH3 = styled.h3`
  ${titleBaseStyles}
  font-size: 1.2rem;
  margin-bottom: 0.5rem;
`;

export const Description = styled.p`
  opacity: 0.8;
  line-height: 1.6;
  color: var(--text-secondary);
  flex: 1;
`;

export const titleComponents = {
  h2: TitleH2,
  h3: TitleH3,
}; 