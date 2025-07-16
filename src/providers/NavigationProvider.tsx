import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useMemo } from 'react';

// Definimos los tipos de rutas disponibles
export type RootStackParamList = {
  Home: undefined;
  Settings: undefined;
  Visualizer: undefined;
  Test: undefined;
  Connect: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

interface NavigationProviderProps {
  children: React.ReactNode;
}

export function NavigationProvider({ children }: NavigationProviderProps) {
  return <NavigationContainer>{children}</NavigationContainer>;
}

// Hook para obtener el stack navigator
export function useNavigationStack() {
  return useMemo(() => Stack, []);
}
