import styled from 'styled-components';

interface NavItemProps {
  $isActive: boolean;
}

export const GlobalNavigation = styled.nav`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 70px;
  z-index: 9999;
  background: var(--background);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  padding: 0 2rem;
  display: flex;
  align-items: center;
  transition: all 0.3s ease;

  @media (max-width: 768px) {
    padding: 0 1rem;
    height: 60px;
  }
`;

export const NavContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
`;

export const NavFooterItems = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

export const NavBrand = styled.div`
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-primary);
  letter-spacing: -0.025em;
  min-width: fit-content;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  border-radius: 8px;
  transition: all 0.2s ease;
  position: relative;
  
  &:hover {
    background: rgba(255, 255, 255, 0.05);
  }
  
  @media (max-width: 768px) {
    font-size: 1.1rem;
  }
`;

export const DropdownContainer = styled.div<{ $isOpen: boolean }>`
  position: absolute;
  top: 100%;
  left: 0;
  margin-top: 0.5rem;
  background: var(--background);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 0.5rem;
  min-width: 200px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  z-index: 1000;
  opacity: ${({ $isOpen }) => $isOpen ? 1 : 0};
  visibility: ${({ $isOpen }) => $isOpen ? 'visible' : 'hidden'};
  transform: ${({ $isOpen }) => $isOpen ? 'translateY(0)' : 'translateY(-10px)'};
  transition: all 0.2s ease;
`;

export const DropdownItem = styled.button<{ $isActive: boolean }>`
  width: 100%;
  padding: 0.75rem 1rem;
  background: ${({ $isActive }) =>
    $isActive
      ? 'rgba(16, 185, 129, 0.15)'
      : 'transparent'
  };
  border: 1px solid ${({ $isActive }) =>
    $isActive
      ? 'rgba(16, 185, 129, 0.3)'
      : 'transparent'
  };
  color: ${({ $isActive }) =>
    $isActive ? '#10b981' : 'var(--text-primary)'
  };
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.25rem;
  text-align: left;
  
  &:last-child {
    margin-bottom: 0;
  }
  
  &:hover {
    background: ${({ $isActive }) =>
    $isActive
      ? 'rgba(16, 185, 129, 0.2)'
      : 'rgba(255, 255, 255, 0.05)'
  };
    border-color: ${({ $isActive }) =>
    $isActive
      ? 'rgba(16, 185, 129, 0.4)'
      : 'rgba(255, 255, 255, 0.1)'
  };
  }
`;

export const DropdownItemLabel = styled.span`
  font-size: 0.9rem;
  font-weight: 500;
`;

export const DropdownItemDescription = styled.span`
  font-size: 0.8rem;
  opacity: 0.7;
  display: block;
  margin-top: 0.25rem;
`;

export const NavItem = styled.button<NavItemProps>`
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  background: ${({ $isActive }) =>
    $isActive
      ? 'rgba(16, 185, 129, 0.15)'
      : 'transparent'
  };
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid ${({ $isActive }) =>
    $isActive
      ? 'rgba(16, 185, 129, 0.3)'
      : 'rgba(255, 255, 255, 0.1)'
  };
  color: ${({ $isActive }) =>
    $isActive ? '#10b981' : 'var(--text-primary)'
  };
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  white-space: nowrap;
  min-width: fit-content;

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(255, 255, 255, 0.1),
      transparent
    );
    transition: left 0.5s ease;
  }

  &:hover {
    background: ${({ $isActive }) =>
    $isActive
      ? 'rgba(16, 185, 129, 0.2)'
      : 'rgba(255, 255, 255, 0.05)'
  };
    border-color: ${({ $isActive }) =>
    $isActive
      ? 'rgba(16, 185, 129, 0.4)'
      : 'rgba(255, 255, 255, 0.2)'
  };
    transform: translateY(-1px);

    &::before {
      left: 100%;
    }
  }

  &:active {
    transform: translateY(0);
  }

  @media (max-width: 768px) {
    padding: 0.4rem 0.8rem;
    font-size: 0.8rem;
    gap: 0.4rem;
  }
`;
