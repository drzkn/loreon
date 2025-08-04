'use client'

import styled from 'styled-components';
import { IconSize } from './Icon.types';


interface IconContainerProps {
  $size: IconSize;
  $color?: string;
  $clickable: boolean;
}

const sizeMap: Record<IconSize, string> = {
  xs: '0.75rem',
  sm: '1rem',
  md: '1.25rem',
  lg: '1.5rem',
  xl: '2rem',
  xxl: '2.5rem'
};

export const IconContainer = styled.div<IconContainerProps>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  
  svg {
    width: ${props => sizeMap[props.$size]};
    height: ${props => sizeMap[props.$size]};
    color: ${props => props.$color || 'currentColor'};
    transition: all 0.2s ease;
  }
  
  ${props => props.$clickable && `
    cursor: pointer;
    border-radius: 0.25rem;
    transition: all 0.2s ease;
    
    &:hover svg {
      opacity: 0.8;
      transform: scale(1.05);
    }
    
    &:active svg {
      transform: scale(0.95);
    }
    
    &:focus {
      outline: 2px solid rgba(16, 185, 129, 0.4);
      outline-offset: 2px;
    }
  `}
`; 