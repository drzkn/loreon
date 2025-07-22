export const getEnvVar = (key: string): string | undefined => {
  // En Vite (navegador), usar import.meta.env
  if (typeof import.meta !== 'undefined' && (import.meta as unknown as { env?: Record<string, string> }).env) {
    return (import.meta as unknown as { env: Record<string, string> }).env[key];
  }
  // En Node.js, usar process.env
  if (typeof process !== 'undefined' && process.env) {
    return process.env[key];
  }
  return undefined;
};