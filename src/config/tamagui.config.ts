import { config } from '@tamagui/config/v3';
import { createTamagui } from '@tamagui/core';

// Configuración personalizada para Loreon
const customConfig = createTamagui({
  ...config,
  // Extendemos la configuración base con nuestros colores del sistema
  themes: {
    ...config.themes,
    // Tema personalizado basado en nuestro sistema de colores
    loreon_light: {
      background: '#ffffff',
      backgroundHover: '#f5f5f5',
      backgroundPress: '#eeeeee',
      backgroundFocus: '#e0e0e0',
      backgroundStrong: '#000000',
      backgroundTransparent: 'rgba(0,0,0,0)',
      color: '#000000',
      colorHover: '#1a1a1a',
      colorPress: '#333333',
      colorFocus: '#666666',
      colorTransparent: 'rgba(0,0,0,0)',
      borderColor: '#e0e0e0',
      borderColorHover: '#cccccc',
      borderColorPress: '#b3b3b3',
      borderColorFocus: '#999999',
      placeholderColor: '#999999',
      // Colores del sistema Loreon
      primary: '#00CFFF',
      primaryHover: '#00b8e6',
      primaryPress: '#009fcc',
      secondary: '#6B2FFF',
      secondaryHover: '#5f29e6',
      secondaryPress: '#5223cc',
      success: '#10b981',
      successHover: '#059669',
      successPress: '#047857',
      warning: '#f59e0b',
      warningHover: '#d97706',
      warningPress: '#b45309',
      error: '#ef4444',
      errorHover: '#dc2626',
      errorPress: '#b91c1c',
      info: '#3b82f6',
      infoHover: '#2563eb',
      infoPress: '#1d4ed8',
    },
    loreon_dark: {
      background: '#0a0a0a',
      backgroundHover: '#1a1a1a',
      backgroundPress: '#2d2d2d',
      backgroundFocus: '#404040',
      backgroundStrong: '#ffffff',
      backgroundTransparent: 'rgba(255,255,255,0)',
      color: '#ffffff',
      colorHover: '#f0f0f0',
      colorPress: '#e0e0e0',
      colorFocus: '#cccccc',
      colorTransparent: 'rgba(255,255,255,0)',
      borderColor: 'rgba(255, 255, 255, 0.1)',
      borderColorHover: 'rgba(255, 255, 255, 0.2)',
      borderColorPress: 'rgba(255, 255, 255, 0.3)',
      borderColorFocus: 'rgba(255, 255, 255, 0.4)',
      placeholderColor: '#6b7280',
      // Colores del sistema Loreon
      primary: '#00CFFF',
      primaryHover: '#00b8e6',
      primaryPress: '#009fcc',
      secondary: '#6B2FFF',
      secondaryHover: '#5f29e6',
      secondaryPress: '#5223cc',
      success: '#10b981',
      successHover: '#059669',
      successPress: '#047857',
      warning: '#f59e0b',
      warningHover: '#d97706',
      warningPress: '#b45309',
      error: '#ef4444',
      errorHover: '#dc2626',
      errorPress: '#b91c1c',
      info: '#3b82f6',
      infoHover: '#2563eb',
      infoPress: '#1d4ed8',
    },
  },
  // Configuración de medios responsive
  media: {
    ...config.media,
    xs: { maxWidth: 479 },
    sm: { maxWidth: 639 },
    md: { maxWidth: 767 },
    lg: { maxWidth: 1023 },
    xl: { maxWidth: 1279 },
    xxl: { minWidth: 1280 },
  },
});

export default customConfig;
export type Conf = typeof customConfig;

declare module '@tamagui/core' {
  interface TamaguiCustomConfig extends Conf {}
}
