import { createBrowserClient } from '@supabase/ssr';
import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '../types';

let _supabaseClient: SupabaseClient<Database> | null = null;

const createSupabaseClient = () => {
  if (_supabaseClient) {
    return _supabaseClient;
  }

  const isClient = typeof window !== 'undefined';

  if (!isClient) {
    throw new Error('SupabaseClient should only be used on client side. Use server client for server-side operations.');
  }

  const { supabaseKey, supabaseUrl } = getKeys();

  _supabaseClient = createBrowserClient<Database>(supabaseUrl, supabaseKey);
  return _supabaseClient;
}

const getKeys = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl) {
    throw new Error(`❌ La variable de entorno NEXT_PUBLIC_SUPABASE_URL es requerida`);
  }

  if (!supabaseKey) {
    throw new Error(`❌ La variable de entorno NEXT_PUBLIC_SUPABASE_ANON_KEY es requerida`);
  }

  return { supabaseKey, supabaseUrl };
}

export const supabase = new Proxy({} as SupabaseClient<Database>, {
  get(_, prop) {
    const client = createSupabaseClient();
    const value = client[prop as keyof typeof client];
    return typeof value === 'function' ? value.bind(client) : value;
  }
});

export default supabase; 