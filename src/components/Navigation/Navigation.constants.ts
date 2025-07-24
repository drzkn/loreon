import { IconName } from "../Icon/Icon.types";

export const navigationItems = [
  {
    path: '/',
    icon: 'bot' as IconName,
    label: 'Inicio',
    description: 'Página principal'
  },
  {
    path: '/visualizer',
    icon: 'square-library' as IconName,
    label: 'Visualizador',
    description: 'Ver archivos markdown'
  },
  {
    path: '/test',
    icon: 'test-tubes' as IconName,
    label: 'Tester',
    description: 'Probar repositorio'
  }
];