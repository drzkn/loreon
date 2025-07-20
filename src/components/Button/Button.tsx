'use client';

import React from 'react';
import styled, { css } from 'styled-components';

type ButtonVariant = 'primary' | 'secondary' | 'success' | 'warning' | 'error';
type ButtonSize = 'sm' | 'md' | 'lg';

interface StyledButtonProps {
  $variant: ButtonVariant;
  $size: ButtonSize;
  $fullWidth?: boolean;
}

const getVariantStyles = (variant: ButtonVariant) => {
  const variantMap = {
    primary: css`
      background: linear-gradient(135deg, ${({ theme }) => theme.colors.primary600}, ${({ theme }) => theme.colors.primary700});
      border: 1px solid ${({ theme }) => theme.colors.primary600};
      color: white;

      &:hover:not(:disabled) {
        background: linear-gradient(135deg, ${({ theme }) => theme.colors.primary700}, ${({ theme }) => theme.colors.primary800});
        border-color: ${({ theme }) => theme.colors.primary700};
      }
    `,
    secondary: css`
      background: linear-gradient(135deg, ${({ theme }) => theme.colors.secondary600}, ${({ theme }) => theme.colors.secondary700});
      border: 1px solid ${({ theme }) => theme.colors.secondary600};
      color: white;

      &:hover:not(:disabled) {
        background: linear-gradient(135deg, ${({ theme }) => theme.colors.secondary700}, ${({ theme }) => theme.colors.secondary800});
        border-color: ${({ theme }) => theme.colors.secondary700};
      }
    `,
    success: css`
      background: ${({ theme }) => theme.colors.success};
      border: 1px solid ${({ theme }) => theme.colors.success};
      color: white;

      &:hover:not(:disabled) {
        background: #059669;
        border-color: #059669;
      }
    `,
    warning: css`
      background: ${({ theme }) => theme.colors.warning};
      border: 1px solid ${({ theme }) => theme.colors.warning};
      color: white;

      &:hover:not(:disabled) {
        background: #d97706;
        border-color: #d97706;
      }
    `,
    error: css`
      background: ${({ theme }) => theme.colors.error};
      border: 1px solid ${({ theme }) => theme.colors.error};
      color: white;

      &:hover:not(:disabled) {
        background: #dc2626;
        border-color: #dc2626;
      }
    `,
  };

  return variantMap[variant];
};

const getSizeStyles = (size: ButtonSize) => {
  const sizeMap = {
    sm: css`
      padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
      font-size: ${({ theme }) => theme.fontSize.sm};
    `,
    md: css`
      padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.lg};
      font-size: ${({ theme }) => theme.fontSize.base};
    `,
    lg: css`
      padding: ${({ theme }) => theme.spacing.md} ${({ theme }) => theme.spacing.xl};
      font-size: ${({ theme }) => theme.fontSize.lg};
    `,
  };

  return sizeMap[size];
};

const StyledButton = styled.button<StyledButtonProps>`
  border: none;
  border-radius: ${({ theme }) => theme.borderRadius.md};
  font-weight: 600;
  cursor: pointer;
  transition: ${({ theme }) => theme.transitions.fast};
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing.sm};
  text-decoration: none;
  outline: none;
  width: ${({ $fullWidth }) => $fullWidth ? '100%' : 'auto'};

  &:focus {
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  &:active {
    transform: translateY(1px);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }

  ${({ $variant }) => getVariantStyles($variant)}
  ${({ $size }) => getSizeStyles($size)}
`;

interface ButtonProps {
  children: React.ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  disabled = false,
  onClick,
  type = 'button',
  className,
}) => {
  return (
    <StyledButton
      $variant={variant}
      $size={size}
      $fullWidth={fullWidth}
      disabled={disabled}
      onClick={onClick}
      type={type}
      className={className}
    >
      {children}
    </StyledButton>
  );
};

export default Button; 