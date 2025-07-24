"use client";

import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { Icon } from '../Icon';
import { navigationItems } from './Navigation.constants';
import {
  GlobalNavigation,
  NavContainer,
  NavBrand,
  NavMainItems,
  NavFooterItems,
  NavItem,
} from './Navigation.styles';

export const Navigation: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    document.documentElement.style.setProperty('--nav-height', '70px');
    document.documentElement.style.setProperty('--nav-width', '0px');
  }, []);

  return (
    <GlobalNavigation>
      <NavContainer>
        <NavBrand>Loreon AI</NavBrand>

        <NavMainItems>
          {navigationItems.map((item) => {
            const isActive = pathname === item.path || pathname.startsWith(item.path + '/');
            return (
              <NavItem
                key={item.path}
                onClick={() => router.push(item.path)}
                $isActive={isActive}
                data-active={isActive}
                title={`${item.label} - ${item.description}`}
              >
                {<Icon name={item.icon} size="md" />}
              </NavItem>
            );
          })}
        </NavMainItems>

        <NavFooterItems>
          <NavItem
            onClick={() => router.push('/settings/connect')}
            $isActive={pathname.startsWith('/settings')}
            data-active={pathname.startsWith('/settings')}
            title="Configuración - Configuración de la aplicación"
          >
            <Icon name="settings" size="md" />
          </NavItem>
        </NavFooterItems>
      </NavContainer>
    </GlobalNavigation>
  );
}; 