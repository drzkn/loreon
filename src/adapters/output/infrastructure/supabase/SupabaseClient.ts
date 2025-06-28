import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from './types';

// Función para obtener variables de entorno compatibles con Vite y Node.js
const getEnvVar = (key: string): string | undefined => {
  // En Vite, usar import.meta.env
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    return import.meta.env[key];
  }
  // En Node.js, usar process.env
  return process.env[key];
};

// Configuración de Supabase
const supabaseUrl = getEnvVar('VITE_SUPABASE_URL') || getEnvVar('SUPABASE_URL');
const supabaseKey = getEnvVar('VITE_SUPABASE_ANON_KEY') || getEnvVar('SUPABASE_ANON_KEY');

if (!supabaseUrl) {
  throw new Error('❌Las variables de entorno SUPABASE_URL son requeridas');
}

if (!supabaseKey) {
  throw new Error('❌Las variables de entorno SUPABASE_ANON_KEY son requeridas');
}

// Crear cliente de Supabase
export const supabase: SupabaseClient<Database> = createClient(supabaseUrl, supabaseKey);

export default supabase; 