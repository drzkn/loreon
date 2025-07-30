export const getEnvVar = (key: string): string | undefined => {
  const isClient = typeof window !== 'undefined';

  if (typeof process !== 'undefined' && process.env) {
    let value = process.env[key];

    if (isClient && key.startsWith('NEXT_PUBLIC_')) {
      value = value || process.env[key.replace('NEXT_PUBLIC_', '')];
    }

    if (isClient && !key.startsWith('NEXT_PUBLIC_')) {
      value = value || process.env[`NEXT_PUBLIC_${key}`];
    }

    if (value) {
      return value;
    }
  }

  if (isClient) {
    try {
      const nextData = (window as unknown as {
        __NEXT_DATA__?: { env?: Record<string, string> }
      }).__NEXT_DATA__;

      if (nextData?.env) {
        let value = nextData.env[key];

        if (!value && !key.startsWith('NEXT_PUBLIC_')) {
          value = nextData.env[`NEXT_PUBLIC_${key}`];
        }

        if (!value && key.startsWith('NEXT_PUBLIC_')) {
          value = nextData.env[key.replace('NEXT_PUBLIC_', '')];
        }

        return value;
      }
    } catch (error) {
      console.warn('Error accessing __NEXT_DATA__:', error);
    }
  }

  return undefined;
};