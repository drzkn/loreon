"use client";

import { useRouter, usePathname } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { Icon } from '../Icon';
import { navigationItems } from './Navigation.constants';
import {
  GlobalNavigation,
  NavContainer,
  NavBrand,
  NavFooterItems,
  NavItem,
  DropdownContainer,
  DropdownItem,
  DropdownItemLabel,
  DropdownItemDescription
} from './Navigation.styles';

export const Navigation: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.documentElement.style.setProperty('--nav-height', '70px');
    document.documentElement.style.setProperty('--nav-width', '0px');
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleBrandClick = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const handleItemClick = (path: string) => {
    router.push(path);
    setIsDropdownOpen(false);
  };

  return (
    <GlobalNavigation>
      <NavContainer>
        <div ref={dropdownRef} style={{ position: 'relative' }}>
          <NavBrand onClick={handleBrandClick}>
            Loreon AI
            <Icon name={isDropdownOpen ? "chevron-up" : "chevron-down"} size="sm" />
          </NavBrand>

          <DropdownContainer $isOpen={isDropdownOpen}>
            {navigationItems.map((item) => {
              const isActive = pathname === item.path || pathname.startsWith(item.path + '/');
              return (
                <DropdownItem
                  key={item.path}
                  onClick={() => handleItemClick(item.path)}
                  $isActive={isActive}
                  title={`${item.label} - ${item.description}`}
                >
                  <Icon name={item.icon} size="md" />
                  <div>
                    <DropdownItemLabel>{item.label}</DropdownItemLabel>
                    <DropdownItemDescription>{item.description}</DropdownItemDescription>
                  </div>
                </DropdownItem>
              );
            })}
          </DropdownContainer>
        </div>

        <NavFooterItems>
          <NavItem
            onClick={() => router.push('/settings')}
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