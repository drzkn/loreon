export const getEnvVar = (key: string): string | undefined => {
  const isClient = typeof window !== 'undefined';

  // Primero intentar obtener desde process.env
  if (typeof process !== 'undefined' && process.env) {
    let value = process.env[key];

    // Si estamos en el cliente y la variable empieza con NEXT_PUBLIC_, 
    // también intentar sin el prefijo en caso de que esté duplicada
    if (isClient && key.startsWith('NEXT_PUBLIC_')) {
      value = value || process.env[key.replace('NEXT_PUBLIC_', '')];
    }

    // Si estamos en el cliente y la variable NO empieza con NEXT_PUBLIC_,
    // también intentar con el prefijo para variables de cliente
    if (isClient && !key.startsWith('NEXT_PUBLIC_')) {
      value = value || process.env[`NEXT_PUBLIC_${key}`];
    }

    if (value) {
      return value;
    }
  }

  // En el cliente, intentar obtener desde window.__NEXT_DATA__ como fallback
  if (isClient) {
    try {
      const nextData = (window as unknown as {
        __NEXT_DATA__?: { env?: Record<string, string> }
      }).__NEXT_DATA__;

      if (nextData?.env) {
        // Buscar la variable tal como se solicita
        let value = nextData.env[key];

        // Si no se encuentra y no tiene prefijo, buscar con NEXT_PUBLIC_
        if (!value && !key.startsWith('NEXT_PUBLIC_')) {
          value = nextData.env[`NEXT_PUBLIC_${key}`];
        }

        // Si no se encuentra y tiene prefijo, buscar sin prefijo
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