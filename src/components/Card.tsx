'use client';

import React from 'react';
import styled from 'styled-components';

const CardContainer = styled.div`
  background: ${({ theme }) => theme.colors.glassLight};
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  padding: ${({ theme }) => theme.spacing.xl};
  min-height: 200px;
  backdrop-filter: blur(10px);
  transition: ${({ theme }) => theme.transitions.normal};
  position: relative;
  overflow: hidden;

  &:hover {
    transform: translateY(-4px);
    background: ${({ theme }) => theme.colors.glassMedium};
    border-color: rgba(255, 255, 255, 0.3);
  }

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent, ${({ theme }) => theme.colors.primary500}, transparent);
  }
`;

const CardContent = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: 100%;
`;

const CardTitle = styled.h3`
  color: ${({ theme }) => theme.colors.textPrimary};
  font-weight: 600;
  margin-bottom: ${({ theme }) => theme.spacing.sm};
  font-size: ${({ theme }) => theme.fontSize.xl};
`;

const CardDescription = styled.p`
  color: ${({ theme }) => theme.colors.textSecondary};
  line-height: 1.6;
  opacity: 0.8;
  margin-bottom: ${({ theme }) => theme.spacing.lg};
  font-size: ${({ theme }) => theme.fontSize.base};
  flex-grow: 1;
`;

const CardActions = styled.div`
  margin-top: auto;
`;

interface CardProps {
  title: string;
  description: string;
  className?: string;
  children?: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({
  title,
  description,
  className = '',
  children
}) => {
  return (
    <CardContainer className={className}>
      <CardContent>
        <div>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
        {children && <CardActions>{children}</CardActions>}
      </CardContent>
    </CardContainer>
  );
};

export default Card;
