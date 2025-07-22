"use client";

import { useRouter, usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { navigationItems } from './Navigation.constants';
import {
  GlobalNavigation,
  NavContainer,
  NavMainItems,
  NavFooterItems,
  NavItem,
  NavIcon,
  NavLabel
} from './Navigation.styles';

export const Navigation: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();
  const [isExpanded, setIsExpanded] = useState(false);

  // Actualizar variable CSS global cuando cambia el estado
  useEffect(() => {
    document.documentElement.style.setProperty(
      '--nav-expanded',
      isExpanded ? '1' : '0'
    );
    document.documentElement.style.setProperty(
      '--nav-width',
      isExpanded ? '200px' : '60px'
    );
  }, [isExpanded]);

  return (
    <GlobalNavigation
      $isExpanded={isExpanded}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      <NavContainer>
        <NavMainItems>
          {navigationItems.map((item) => {
            const isActive = pathname === item.path || pathname.startsWith(item.path + '/');
            return (
              <NavItem
                key={item.path}
                onClick={() => router.push(item.path)}
                $isActive={isActive}
                $isExpanded={isExpanded}
                data-active={isActive}
                title={isExpanded ? item.description : `${item.label} - ${item.description}`}
              >
                <NavIcon>{item.icon}</NavIcon>
                <NavLabel $isExpanded={isExpanded}>{item.label}</NavLabel>
              </NavItem>
            );
          })}
        </NavMainItems>

        <NavFooterItems>
          <NavItem
            onClick={() => router.push('/settings/connect')}
            $isActive={pathname.startsWith('/settings')}
            $isExpanded={isExpanded}
            data-active={pathname.startsWith('/settings')}
            title={isExpanded ? 'Configuración de la aplicación' : 'Configuración - Configuración de la aplicación'}
          >
            <NavIcon>⚙️</NavIcon>
            <NavLabel $isExpanded={isExpanded}>Configuración</NavLabel>
          </NavItem>
        </NavFooterItems>
      </NavContainer>
    </GlobalNavigation>
  );
}; 