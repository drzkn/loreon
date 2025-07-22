import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from '../types';
import { getEnvVar } from '@/utils/getEnvVar';

// Intentar obtener las variables de entorno tanto con prefijo VITE_ como sin él
const supabaseUrl = getEnvVar('VITE_SUPABASE_URL') || getEnvVar('SUPABASE_URL');
const supabaseKey = getEnvVar('VITE_SUPABASE_ANON_KEY') || getEnvVar('SUPABASE_ANON_KEY');

if (!supabaseUrl) {
  throw new Error('❌ Las variables de entorno VITE_SUPABASE_URL o SUPABASE_URL son requeridas');
}

if (!supabaseKey) {
  throw new Error('❌ Las variables de entorno VITE_SUPABASE_ANON_KEY o SUPABASE_ANON_KEY son requeridas');
}

// Crear cliente de Supabase
export const supabase: SupabaseClient<Database> = createClient(supabaseUrl, supabaseKey);

export default supabase; 