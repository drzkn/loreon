import React from 'react';
import { IconContainer } from './Icon.styles';
import { IconName, IconSize } from './Icon.types';
import { iconMapper } from './Icon.mapper';

export interface IconProps {
  name: IconName;
  size?: IconSize;
  color?: string;
  className?: string;
  onClick?: () => void;
}

export const Icon: React.FC<IconProps> = ({
  name,
  size = 'md',
  color,
  className,
  onClick
}) => {
  const IconComponent = iconMapper[name];

  if (!IconComponent) {
    console.warn(`Icon "${name}" not found`);
    return null;
  }

  return (
    <IconContainer
      $size={size}
      $color={color}
      $clickable={!!onClick}
      className={className}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <IconComponent />
    </IconContainer>
  );
}; 