import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from '../types';

let _supabaseClient: SupabaseClient<Database> | null = null;

const createSupabaseClient = (): SupabaseClient<Database> => {
  if (_supabaseClient) {
    return _supabaseClient;
  }

  const isClient = typeof window !== 'undefined';

  const { supabaseKey, supabaseUrl } = getKeys(isClient)

  console.log('✅ [SupabaseClient] Creando cliente Supabase...');
  _supabaseClient = createClient(supabaseUrl, supabaseKey);
  return _supabaseClient;
}

const getKeys = (isClient: boolean) => {
  let supabaseUrl: string | undefined;
  let supabaseKey: string | undefined;

  if (isClient) {
    supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    console.log('🔍 [SupabaseClient] Cliente - Variables disponibles:', {
      'NEXT_PUBLIC_SUPABASE_URL': supabaseUrl ? 'CONFIGURADA' : 'UNDEFINED',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY': supabaseKey ? 'CONFIGURADA' : 'UNDEFINED'
    });

  } else {
    supabaseUrl = process.env.SUPABASE_URL;
    supabaseKey = process.env.SUPABASE_ANON_KEY;

    console.log('🔍 [SupabaseClient] Servidor - Variables disponibles:', {
      'SUPABASE_URL': supabaseUrl ? 'CONFIGURADA' : 'UNDEFINED',
      'SUPABASE_ANON_KEY': supabaseKey ? 'CONFIGURADA' : 'UNDEFINED'
    });
  }

  if (!supabaseUrl) {
    const envVarName = isClient ? 'NEXT_PUBLIC_SUPABASE_URL' : 'SUPABASE_URL';
    throw new Error(`❌ La variable de entorno ${envVarName} es requerida`);
  }

  if (!supabaseKey) {
    const envVarName = isClient ? 'NEXT_PUBLIC_SUPABASE_ANON_KEY' : 'SUPABASE_ANON_KEY';
    throw new Error(`❌ La variable de entorno ${envVarName} es requerida`);
  }

  return { supabaseKey, supabaseUrl }
}

export const supabase = new Proxy({} as SupabaseClient<Database>, {
  get(target, prop) {
    const client = createSupabaseClient();
    const value = client[prop as keyof SupabaseClient<Database>];
    return typeof value === 'function' ? value.bind(client) : value;
  }
});

export default supabase; 