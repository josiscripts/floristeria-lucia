import { useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";

import { supabase } from "@/integrations/supabase/client";

let authStateChangeCount = 0;
let getSessionCount = 0;

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log("[useAuth] Mount - initializing");

    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      authStateChangeCount += 1;
      console.log(
        `[useAuth] onAuthStateChange #${authStateChangeCount} - event=${_event}, hasSession=${!!next}, hasToken=${!!next?.access_token}`
      );
      setSession(next);
      setLoading(false);
    });

    supabase.auth.getSession().then(({ data }) => {
      getSessionCount += 1;
      console.log(
        `[useAuth] getSession #${getSessionCount} - hasSession=${!!data.session}, hasToken=${!!data.session?.access_token}`
      );
      setSession(data.session);
      setLoading(false);
    });

    return () => {
      console.log("[useAuth] Unmount - unsubscribing");
      sub.subscription.unsubscribe();
    };
  }, []);

  return { session, user: (session?.user ?? null) as User | null, loading };
}
