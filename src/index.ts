// Configuración de Tamagui
export { default as tamaguiConfig } from './config/tamagui.config';
export type { Conf as TamaguiConfig } from './config/tamagui.config';

// Componentes
export { Card } from './components/Card';

// Re-export de tipos de Tamagui comunes
export type { TamaguiComponent, GetProps } from '@tamagui/core';

// Navegación y providers
export {
  NavigationProvider,
  useNavigationStack,
} from './providers/NavigationProvider';
export type { RootStackParamList } from './providers/NavigationProvider';

// Pantallas
export { HomeScreen } from './screens/HomeScreen';
