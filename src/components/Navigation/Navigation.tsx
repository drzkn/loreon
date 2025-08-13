"use client";

import { useRouter, usePathname } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { Icon } from '../Icon';
import { navigationItems } from './Navigation.constants';
import { useAuth } from '@/hooks/useAuth';
import {
  GlobalNavigation,
  NavContainer,
  NavBrand,
  NavItems,
  DropdownContainer,
  DropdownItem,
  DropdownItemLabel,
  DropdownItemDescription,
  UserSection,
  UserAvatar,
  UserDropdown,
  UserDropdownItem,
  UserInfo,
  UserName,
  UserEmail
} from './Navigation.styles';

export const Navigation: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const userDropdownRef = useRef<HTMLDivElement>(null);
  const { userProfile, isAuthenticated, signOut } = useAuth();

  useEffect(() => {
    document.documentElement.style.setProperty('--nav-height', '70px');
    document.documentElement.style.setProperty('--nav-width', '0px');
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target as Node)) {
        setIsUserDropdownOpen(false);
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

  const handleUserClick = () => {
    setIsUserDropdownOpen(!isUserDropdownOpen);
  };

  const handleLogout = async () => {
    try {
      await signOut();
      router.push('/auth/login');
    } catch (error) {
      console.error('Error durante logout:', error);
    }
  };

  const getUserInitial = () => {
    if (!userProfile?.name) return userProfile?.email?.[0]?.toUpperCase() || 'U';
    return userProfile.name[0].toUpperCase();
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

        <NavItems>
          {isAuthenticated && userProfile && (
            <UserSection ref={userDropdownRef}>
              <UserAvatar onClick={handleUserClick}>
                {getUserInitial()}
              </UserAvatar>

              <UserDropdown $isOpen={isUserDropdownOpen}>
                <UserInfo>
                  <UserName>{userProfile.name || 'Usuario'}</UserName>
                  <UserEmail>{userProfile.email}</UserEmail>
                </UserInfo>

                <UserDropdownItem onClick={() => router.push('/profile')}>
                  <Icon name="user" size="sm" />
                  Mi Perfil
                </UserDropdownItem>

                <UserDropdownItem onClick={() => router.push('/settings')}>
                  <Icon name="settings" size="sm" />
                  Configuración
                </UserDropdownItem>

                <UserDropdownItem className="danger" onClick={handleLogout}>
                  <Icon name="logout" size="sm" />
                  Cerrar Sesión
                </UserDropdownItem>
              </UserDropdown>
            </UserSection>
          )}
        </NavItems>
      </NavContainer>
    </GlobalNavigation>
  );
}; 