import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from '../types';
import { getEnvVar } from '@/utils/getEnvVar';

// Intentar obtener las variables de entorno tanto con prefijo VITE_ como sin él
const supabaseUrl = getEnvVar('SUPABASE_URL');
const supabaseKey = getEnvVar('SUPABASE_ANON_KEY');

if (!supabaseUrl) {
  throw new Error('❌ La variable de entorno SUPABASE_URL es requerida');
}

if (!supabaseKey) {
  throw new Error('❌ La variable de entorno SUPABASE_ANON_KEY es requerida');
}

// Crear cliente de Supabase
export const supabase: SupabaseClient<Database> = createClient(supabaseUrl, supabaseKey);

export default supabase; 