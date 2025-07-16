import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from '../types';
import { getEnvVar } from '@/utils/getEnvVar';

const supabaseUrl = getEnvVar('SUPABASE_URL');
const supabaseKey = getEnvVar('SUPABASE_ANON_KEY');

if (!supabaseUrl) {
  throw new Error('❌Las variables de entorno SUPABASE_URL son requeridas');
}

if (!supabaseKey) {
  throw new Error('❌Las variables de entorno SUPABASE_ANON_KEY son requeridas');
}

// Crear cliente de Supabase
export const supabase: SupabaseClient<Database> = createClient(supabaseUrl, supabaseKey);

export default supabase; 