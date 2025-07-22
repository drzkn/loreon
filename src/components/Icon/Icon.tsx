import React from 'react';
import {
  Send,
  User,
  Bot,
  Settings,
  Home,
  Menu,
  X,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Search,
  Plus,
  Edit,
  Trash2,
  Save,
  Copy,
  Eye,
  EyeOff,
  type LucideIcon
} from 'lucide-react';
import { IconContainer } from './Icon.styles';

export type IconName =
  | 'send'
  | 'user'
  | 'bot'
  | 'settings'
  | 'home'
  | 'menu'
  | 'close'
  | 'chevron-down'
  | 'chevron-up'
  | 'chevron-left'
  | 'chevron-right'
  | 'search'
  | 'plus'
  | 'edit'
  | 'trash'
  | 'save'
  | 'copy'
  | 'eye'
  | 'eye-off';

export type IconSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface IconProps {
  name: IconName;
  size?: IconSize;
  color?: string;
  className?: string;
  onClick?: () => void;
}

const iconMap: Record<IconName, LucideIcon> = {
  send: Send,
  user: User,
  bot: Bot,
  settings: Settings,
  home: Home,
  menu: Menu,
  close: X,
  'chevron-down': ChevronDown,
  'chevron-up': ChevronUp,
  'chevron-left': ChevronLeft,
  'chevron-right': ChevronRight,
  search: Search,
  plus: Plus,
  edit: Edit,
  trash: Trash2,
  save: Save,
  copy: Copy,
  eye: Eye,
  'eye-off': EyeOff,
};

export const Icon: React.FC<IconProps> = ({
  name,
  size = 'md',
  color,
  className,
  onClick
}) => {
  const IconComponent = iconMap[name];

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