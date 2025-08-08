import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from '../types';

let _supabaseServerClient: SupabaseClient<Database> | null = null;

const createSupabaseServerClient = () => {
  if (_supabaseServerClient) {
    return _supabaseServerClient;
  }

  const isClient = typeof window !== 'undefined';

  if (isClient) {
    throw new Error('SupabaseServerClient should only be used on server side. Use client for client-side operations.');
  }

  const { supabaseKey, supabaseUrl } = getServerKeys();

  _supabaseServerClient = createClient<Database>(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  return _supabaseServerClient;
}

const getServerKeys = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl) {
    throw new Error(`❌ La variable de entorno NEXT_PUBLIC_SUPABASE_URL es requerida`);
  }

  if (!supabaseKey) {
    throw new Error(`❌ La variable de entorno NEXT_PUBLIC_SUPABASE_ANON_KEY es requerida`);
  }

  return { supabaseKey, supabaseUrl }
}

export const supabaseServer = new Proxy({} as SupabaseClient<Database>, {
  get(target, prop) {
    const client = createSupabaseServerClient();
    const value = client[prop as keyof typeof client];
    return typeof value === 'function' ? value.bind(client) : value;
  }
});

export default supabaseServer;