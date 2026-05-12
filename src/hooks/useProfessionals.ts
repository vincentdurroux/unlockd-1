import { useState, useEffect } from 'react';
import { proService } from '../services/proService';
import { isSupabaseConfigured } from '../lib/supabase';

// We import MOCK_PROS directly or define it here
// To avoid circular dependency if MOCK_PROS is in App.tsx, we'll pass it as fallback or define it in a constants file
// For simplicity, let's assume we want a clean way to handle this.

export function useProfessionals(fallbackData: any[] = []) {
  const [professionals, setProfessionals] = useState<any[]>(fallbackData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function loadPros() {
      try {
        if (!isSupabaseConfigured) {
          setProfessionals(fallbackData);
          setLoading(false);
          return;
        }

        const data = await proService.getProfessionals();
        if (data && data.length > 0) {
          setProfessionals(data);
        } else {
          setProfessionals(fallbackData);
        }
      } catch (err) {
        console.error('Failed to load professionals from Supabase:', err);
        setError(err instanceof Error ? err : new Error('Unknown error'));
        setProfessionals(fallbackData);
      } finally {
        setLoading(false);
      }
    }

    loadPros();
  }, []);

  return { professionals, loading, error };
}
