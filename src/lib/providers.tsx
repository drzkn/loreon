'use client';

import React from 'react';
import { ThemeProvider } from 'styled-components';
import StyledComponentsRegistry from './styled-components';
import { theme } from './theme';
import { TokenProvider } from '@/contexts/TokenContext/TokenContext';

interface ClientProvidersProps {
  children: React.ReactNode;
}

export const ClientProviders: React.FC<ClientProvidersProps> = ({ children }) => {
  return (
    <StyledComponentsRegistry>
      <ThemeProvider theme={theme}>
        <TokenProvider>
          {children}
        </TokenProvider>
      </ThemeProvider>
    </StyledComponentsRegistry>
  );
};

export default ClientProviders; 