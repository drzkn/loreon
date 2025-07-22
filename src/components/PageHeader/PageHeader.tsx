'use client';

import { Header, Title, Description } from './PageHeader.styles';

interface PageHeaderProps {
  title: string;
  description: string;
}

export const PageHeader = ({ title, description }: PageHeaderProps) => {
  return (
    <Header>
      <Title>
        {title}
      </Title>
      <Description>
        {description}
      </Description>
    </Header>
  );
}; 