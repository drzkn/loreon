let renderCount = 0;

export const logRender = (componentName: string, props?: Record<string, number | string | boolean | null>) => {
  if (process.env.NODE_ENV !== 'development') return;

  renderCount++;

  const timestamp = new Date().toISOString().split('T')[1].split('.')[0];

  console.group(`🔍 [RENDER #${renderCount}] ${componentName} @ ${timestamp}`);

  if (props) {
    Object.entries(props).forEach(([key, value]) => {
      console.log(`  ${key}:`, value);
    });
  }

  console.groupEnd();
};

export const resetRenderCount = () => {
  renderCount = 0;
};
