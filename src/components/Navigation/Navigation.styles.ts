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

export const NavMainItems = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  flex: 1;
  justify-content: center;

  @media (max-width: 768px) {
    gap: 0.5rem;
    justify-content: flex-start;
    overflow-x: auto;
    padding: 0 0.5rem;
    
    &::-webkit-scrollbar {
      display: none;
    }
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
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
  
  @media (max-width: 768px) {
    font-size: 1.1rem;
  }
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
