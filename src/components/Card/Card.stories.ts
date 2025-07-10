import type { Meta, StoryObj } from '@storybook/nextjs';
import { Card } from './Card';

const meta = {
  title: 'Components/Card',
  component: Card,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
Tarjeta de sincronización configurable con estados idle y processing.

**Fuentes:** Este componente usa la fuente Geist de Google Fonts para una tipografía moderna y legible.

**Estados:**
- \`idle\`: Muestra el botón de acción y permite interacción
- \`processing\`: Muestra indicadores de progreso y deshabilita el botón

**Personalización:** Todos los textos son configurables a través de props obligatorias.
        `
      }
    }
  },
  tags: ['autodocs'],
  argTypes: {
    isProcessing: {
      control: 'boolean',
      description: 'Indica si la sincronización está en progreso'
    },
    onSync: {
      action: 'sync-clicked',
      description: 'Función llamada cuando se hace clic en el botón de sincronización'
    },
    title: {
      control: 'text',
      description: 'Título de la tarjeta (emoji + texto)'
    },
    description: {
      control: 'text',
      description: 'Descripción del tipo de sincronización'
    },
    processingMessagePrimary: {
      control: 'text',
      description: 'Mensaje principal mostrado durante el procesamiento'
    },
    processingMessageSecondary: {
      control: 'text',
      description: 'Mensaje secundario mostrado durante el procesamiento'
    },
    buttonTextProcessing: {
      control: 'text',
      description: 'Texto del botón cuando está procesando'
    },
    buttonTextIdle: {
      control: 'text',
      description: 'Texto del botón cuando está inactivo'
    }
  },
  args: {
    onSync: () => console.log('Sync clicked!')
  },
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Idle: Story = {
  args: {
    isProcessing: false,
    title: "📋 Manual",
    description: "Control total sobre cuándo sincronizar",
    processingMessagePrimary: "🔄 Sincronización en progreso...",
    processingMessageSecondary: "📄 Procesando múltiples databases",
    buttonTextProcessing: "🔄 Sincronizando...",
    buttonTextIdle: "🚀 Sincronizar"
  },
};

export const Processing: Story = {
  args: {
    isProcessing: true,
    title: "📋 Manual",
    description: "Control total sobre cuándo sincronizar",
    processingMessagePrimary: "🔄 Sincronización en progreso...",
    processingMessageSecondary: "📄 Procesando múltiples databases",
    buttonTextProcessing: "🔄 Sincronizando...",
    buttonTextIdle: "🚀 Sincronizar"
  },
};
