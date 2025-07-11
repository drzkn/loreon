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
    title: {
      control: 'text',
      description: 'Título de la tarjeta (emoji + texto)'
    },
    description: {
      control: 'text',
      description: 'Descripción del tipo de sincronización'
    }
  },
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Idle: Story = {
  args: {
    title: "📋 Manual",
    description: "Control total sobre cuándo sincronizar",
  },
};

export const Processing: Story = {
  args: {
    title: "📋 Manual",
    description: "Control total sobre cuándo sincronizar",
  },
};
