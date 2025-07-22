import styled, { css } from 'styled-components';

interface GlobalNavigationProps {
  $isExpanded: boolean;
}

interface NavItemProps {
  $isActive: boolean;
}

export const GlobalNavigation = styled.nav<GlobalNavigationProps>`
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  width: ${({ $isExpanded }) => $isExpanded ? '200px' : '60px'};
  z-index: 9999;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-right: 1px solid rgba(255, 255, 255, 0.2);
  padding: ${({ $isExpanded }) => $isExpanded ? '2rem 1rem' : '2rem 0.5rem'};
  display: flex;
  flex-direction: column;
  transition: all 0.3s ease;
  overflow: hidden;

  @media (max-width: 768px) {
    width: 100%;
    height: 80px;
    bottom: auto;
    top: 0;
    left: 0;
    right: 0;
    padding: 1rem;
    border-right: none;
    border-bottom: 1px solid rgba(255, 255, 255, 0.2);
    overflow: visible;
  }
`;

export const NavContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  align-items: stretch;
  height: 100%;

  @media (max-width: 768px) {
    flex-direction: row;
    justify-content: center;
    height: auto;
    gap: 0.5rem;
  }
`;

export const NavMainItems = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  align-items: stretch;
  flex-grow: 1;

  @media (max-width: 768px) {
    flex-direction: row;
    justify-content: center;
    gap: 0.5rem;
    flex-grow: 1;
  }
`;

export const NavFooterItems = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  align-items: stretch;
  margin-top: auto;
  padding-top: 1rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);

  @media (max-width: 768px) {
    flex-direction: row;
    margin-top: 0;
    padding-top: 0;
    border-top: none;
    border-left: 1px solid rgba(255, 255, 255, 0.1);
    padding-left: 0.5rem;
  }
`;

export const NavItem = styled.button<NavItemProps & GlobalNavigationProps>`
  padding: 0.5rem;
  font-size: 0.9rem;
  font-weight: 600;
  background: ${({ $isActive }) =>
    $isActive
      ? 'rgba(16, 185, 129, 0.2)'
      : 'rgba(255, 255, 255, 0.1)'
  };
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid ${({ $isActive }) =>
    $isActive
      ? 'rgba(16, 185, 129, 0.4)'
      : 'rgba(255, 255, 255, 0.2)'
  };
  color: white;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: ${({ $isActive }) =>
    $isActive
      ? '0 4px 16px rgba(16, 185, 129, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.3), inset 0 -1px 0 rgba(0, 0, 0, 0.1)'
      : '0 4px 16px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.2), inset 0 -1px 0 rgba(0, 0, 0, 0.1)'
  };
  position: relative;
  overflow: hidden;
  min-height: 50px;
  display: flex;
  align-items: center;
  justify-content: ${({ $isExpanded }) => $isExpanded ? 'flex-start' : 'center'};
  gap: 0.75rem;

  &::before {
    content: "";
    position: absolute;
    top: -100%;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(
      180deg,
      transparent,
      rgba(255, 255, 255, 0.2),
      transparent
    );
    transition: top 0.5s ease;
  }

  &:hover {
    transform: translateX(4px);
    background: ${({ $isActive }) =>
    $isActive
      ? 'rgba(16, 185, 129, 0.25)'
      : 'rgba(255, 255, 255, 0.15)'
  };
    border-color: ${({ $isActive }) =>
    $isActive
      ? 'rgba(16, 185, 129, 0.5)'
      : 'rgba(255, 255, 255, 0.3)'
  };
    box-shadow: ${({ $isActive }) =>
    $isActive
      ? '0 8px 24px rgba(16, 185, 129, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.3), inset 0 -1px 0 rgba(0, 0, 0, 0.1)'
      : '0 8px 24px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.3), inset 0 -1px 0 rgba(0, 0, 0, 0.1)'
  };

    &::before {
      top: 100%;
    }
  }

  &:active {
    transform: translateX(2px);
    background: rgba(255, 255, 255, 0.08);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1),
      inset 0 1px 0 rgba(255, 255, 255, 0.1), inset 0 -1px 0 rgba(0, 0, 0, 0.2);
  }

  @media (max-width: 768px) {
    padding: 0.5rem 0.8rem;
    font-size: 0.8rem;
    min-height: auto;
    flex: 1;
    max-width: 120px;
    justify-content: center;
    gap: 0.5rem;

    &:hover {
      transform: translateY(-2px);
    }

    &:active {
      transform: translateY(0);
    }

    ${({ $isActive }) => $isActive && css`
      transform: translateY(-4px);

      &:hover {
        transform: translateY(-6px);
      }
    `}
  }
`;

export const NavIcon = styled.span`
  font-size: 1.2rem;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;

  @media (max-width: 768px) {
    font-size: 1rem;
    width: 20px;
    height: 20px;
  }
`;

export const NavLabel = styled.span<GlobalNavigationProps>`
  font-size: 0.9rem;
  font-weight: 600;
  opacity: ${({ $isExpanded }) => $isExpanded ? '1' : '0'};
  transform: ${({ $isExpanded }) => $isExpanded ? 'translateX(0)' : 'translateX(-10px)'};
  transition: all 0.3s ease;
  white-space: nowrap;
  overflow: hidden;

  @media (max-width: 768px) {
    opacity: 1;
    transform: translateX(0);
    font-size: 0.7rem;
  }
`; 