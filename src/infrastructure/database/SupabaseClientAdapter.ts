import { ISupabaseClient } from './interfaces/ISupabaseClient';
import { supabase } from '@/adapters/output/infrastructure/supabase/SupabaseClient';

export class SupabaseClientAdapter implements ISupabaseClient {
  from(table: string) {
    return supabase.from(table);
  }

  get auth() {
    return supabase.auth;
  }
}
