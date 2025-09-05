import type { SupabaseClient } from '@supabase/supabase-js';

export interface ISupabaseClient {
  from(table: string): ReturnType<SupabaseClient['from']>;
  auth: SupabaseClient['auth'];
}
