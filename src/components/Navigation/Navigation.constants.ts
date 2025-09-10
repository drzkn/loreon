import { IconName } from "../Icon/Icon.types";

export const navigationItems = [
  {
    path: '/chat',
    icon: 'bot' as IconName,
    label: 'Chat',
    description: 'Conversa con Loreon AI'
  },
  {
    path: '/visualizer',
    icon: 'square-library' as IconName,
    label: 'Visualizador',
    description: 'Ver archivos markdown'
  },
  {
    path: '/settings',
    icon: 'settings' as IconName,
    label: 'Configuración',
    description: 'Ajustes de la aplicación'
  }
];