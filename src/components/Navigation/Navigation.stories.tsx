import type { Meta, StoryObj } from "@storybook/nextjs";
import React from "react";
import { Navigation } from "./Navigation";

const meta: Meta<typeof Navigation> = {
  title: "🧭 Navigation",
  component: Navigation,
  parameters: {
    layout: "fullscreen",
    backgrounds: {
      default: "dark",
      values: [
        {
          name: "dark",
          value: "#1a1a1a",
        },
        {
          name: "darker",
          value: "#0d1117",
        },
        {
          name: "charcoal",
          value: "#2d3748",
        },
        {
          name: "dark-gradient",
          value: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        },
        {
          name: "purple-gradient",
          value: "linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)",
        },
        {
          name: "space-gradient",
          value: "linear-gradient(135deg, #2c3e50 0%, #3498db 100%)",
        },
        {
          name: "sunset-gradient",
          value: "linear-gradient(135deg, #ff7e5f 0%, #feb47b 100%)",
        },
      ],
    },
    nextjs: {
      appDirectory: true,
    },
  },
  argTypes: {
    currentPath: {
      control: "select",
      options: ["/", "/visualizer", "/test", "/connect"],
      description: "Ruta activa actual",
      table: {
        type: { summary: "string" },
        defaultValue: { summary: "/" },
      },
    },
  },
  decorators: [
    (Story) => {
      return (
        <div style={{ height: "100vh", position: "relative" }}>
          <Story />
        </div>
      );
    },
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

// Historia principal con controles
export const Default: Story = {
  args: {
    currentPath: "/",
  },
  parameters: {
    docs: {
      description: {
        story: "Estado por defecto con la página de inicio activa. Replica la funcionalidad exacta del componente Navigation.",
      },
    },
  },
};
