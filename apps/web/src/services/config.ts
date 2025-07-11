import axios from 'axios';

// Función para obtener variables de entorno compatibles con Vite y Node.js
const getEnvVar = (key: string): string | undefined => {
  // En Vite, usar import.meta.env
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    return import.meta.env[key];
  }
  // En Node.js, usar process.env
  return process.env[key];
};

// Detectar si estamos en Node.js o en el navegador
const isNode = typeof process !== 'undefined' && process.versions && process.versions.node;
const isBrowser = typeof window !== 'undefined';
const isDev = isBrowser ? import.meta.env.DEV : process.env.NODE_ENV === 'development';

// Validación de variables de entorno requeridas
const requiredEnvVars = {
  NOTION_API_KEY: getEnvVar('VITE_NOTION_API_KEY') || getEnvVar('NOTION_API_KEY'),
  NOTION_BASE_URL: getEnvVar('VITE_NOTION_BASE_URL') || getEnvVar('NOTION_BASE_URL'),
  NOTION_API_VERSION: getEnvVar('VITE_NOTION_API_VERSION') || getEnvVar('NOTION_API_VERSION'),
};

// Verificar que todas las variables necesarias estén presentes
Object.entries(requiredEnvVars).forEach(([key, value]) => {
  if (!value) {
    throw new Error(`La variable de entorno ${key} es requerida pero no está definida`);
  }
});

// Determinar la URL base según el entorno
let baseURL: string;
if (isNode) {
  // En Node.js (test:connection), usar la URL directa de Notion
  baseURL = 'https://api.notion.com/v1';
} else if (isBrowser && isDev) {
  // En el navegador en desarrollo, usar el proxy
  baseURL = '/api/notion/v1';
} else {
  // En producción o otros casos, usar la URL directa
  baseURL = 'https://api.notion.com/v1';
}

const notionApiClient = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Agregar headers de autenticación según el entorno
if (isNode || !isDev) {
  // En Node.js o producción, agregar headers directamente
  notionApiClient.defaults.headers.common['Authorization'] = `Bearer ${requiredEnvVars.NOTION_API_KEY}`;
  notionApiClient.defaults.headers.common['Notion-Version'] = '2022-06-28';
}
// En desarrollo en el navegador, el proxy se encarga de los headers

notionApiClient.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

notionApiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.error('Error de autenticación (401): Verifica que tu NOTION_API_KEY sea válida');
      console.error('Headers enviados:', error.config?.headers);
    }
    console.error('Error en la llamada a Notion:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export default notionApiClient;
