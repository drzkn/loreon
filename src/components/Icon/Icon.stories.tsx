import type { Meta, StoryObj } from '@storybook/nextjs';
import { Icon } from './Icon';
import { iconMapper } from './Icon.mapper';

const meta: Meta<typeof Icon> = {
  title: 'Components/Icon',
  component: Icon,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Componente de iconos que abstrae la librería Lucide para evitar acoplamiento directo.'
      }
    }
  },
  tags: ['autodocs'],
  argTypes: {
    name: {
      control: 'select',
      options: Object.keys(iconMapper),
      description: 'Nombre del icono a mostrar'
    },
    size: {
      control: 'select',
      options: ['xs', 'sm', 'md', 'lg', 'xl'],
      description: 'Tamaño del icono'
    },
    color: {
      control: 'color',
      description: 'Color personalizado del icono'
    },
    onClick: {
      action: 'clicked',
      description: 'Función que se ejecuta al hacer click'
    }
  }
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    name: 'bot',
    color: '#10b981',
  },
};

export const AllSizes: Story = {
  args: {
    name: 'bot',
    color: '#10b981',
  },
  render: (args) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
      <Icon {...args} size="xs" />
      <Icon {...args} size="sm" />
      <Icon {...args} size="md" />
      <Icon {...args} size="lg" />
      <Icon {...args} size="xl" />
    </div>
  ),
};

export const WithCustomColor: Story = {
  args: {
    name: 'bot',
    color: '#10b981',
    size: 'lg',
  },
};

export const Clickable: Story = {
  args: {
    name: 'settings',
    size: 'md',
    color: '#10b981',
    onClick: () => alert('Icon clicked!'),
  },
};