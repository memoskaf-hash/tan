import { useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { isSupabaseConfigured, supabase } from "@/integrations/supabase/client";

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setLoading(false);
      return;
    }

    const sessionRequest = supabase.auth.getSession();
    const timeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), 8000));
    Promise.race([sessionRequest, timeout]).then((result) => {
      if (result) setSession(result.data.session);
      setLoading(false);
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setLoading(false);
    });
    return () => subscription.unsubscribe();
  }, []);

  const user: User | null = session?.user ?? null;

  return {
    session,
    user,
    loading,
    signOut: () => (isSupabaseConfigured() ? supabase.auth.signOut() : Promise.resolve()),
  };
}
