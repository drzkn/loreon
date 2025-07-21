'use client';

import { Container, Section, Description, titleComponents } from './Card.styles';

interface CardProps {
  children?: React.ReactNode;
  title: string;
  description?: string;
  titleAs?: 'h2' | 'h3';
}

export const Card = ({
  title,
  description,
  children,
  titleAs = 'h3',
}: CardProps) => {
  const TitleComponent = titleComponents[titleAs];

  return (
    <Container>
      <Section>
        <TitleComponent>{title}</TitleComponent>
        {description && <Description>{description}</Description>}
      </Section>
      {children}
    </Container>
  );
};
