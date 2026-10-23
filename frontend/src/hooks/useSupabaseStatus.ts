import { useMemo } from 'react';
import { isSupabaseConfigured, SUPABASE_URL } from '../services/supabase';

export function useSupabaseStatus() {
  const isConfigured = useMemo(() => isSupabaseConfigured(), []);

  return {
    isConfigured,
    supabaseUrl: SUPABASE_URL,
  };
}
