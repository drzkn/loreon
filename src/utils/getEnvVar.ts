export const getEnvVar = (key: string): string | undefined => {
  return process.env[key];
};