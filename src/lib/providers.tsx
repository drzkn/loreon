'use client';

import React from 'react';
import { ThemeProvider } from 'styled-components';
import StyledComponentsRegistry from './styled-components';
import { theme } from './theme';

interface ClientProvidersProps {
  children: React.ReactNode;
}

export const ClientProviders: React.FC<ClientProvidersProps> = ({ children }) => {
  return (
    <StyledComponentsRegistry>
      <ThemeProvider theme={theme}>
        {children}
      </ThemeProvider>
    </StyledComponentsRegistry>
  );
};

export default ClientProviders; 