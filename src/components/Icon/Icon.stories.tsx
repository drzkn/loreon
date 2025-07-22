import type { Meta, StoryObj } from '@storybook/nextjs';
import { Icon, type IconName } from './Icon';

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
      options: [
        'send', 'user', 'bot', 'settings', 'home', 'menu', 'close',
        'chevron-down', 'chevron-up', 'chevron-left', 'chevron-right',
        'search', 'plus', 'edit', 'trash', 'save', 'copy', 'eye', 'eye-off'
      ],
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
    name: 'home',
  },
};

export const AllSizes: Story = {
  args: {
    name: 'user',
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
    onClick: () => alert('Icon clicked!'),
  },
};

export const CommonIcons: Story = {
  render: () => (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))',
      gap: '1rem',
      textAlign: 'center'
    }}>
      {[
        'send', 'user', 'bot', 'settings', 'home', 'menu', 'close',
        'search', 'plus', 'edit', 'trash', 'save', 'copy', 'eye'
      ].map((iconName) => (
        <div key={iconName} style={{ padding: '0.5rem' }}>
          <Icon name={iconName as IconName} size="lg" />
          <div style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>{iconName}</div>
        </div>
      ))}
    </div>
  ),
};

export const Navigation: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
      <Icon name="chevron-left" size="md" />
      <Icon name="home" size="md" />
      <Icon name="chevron-right" size="md" />
    </div>
  ),
}; 