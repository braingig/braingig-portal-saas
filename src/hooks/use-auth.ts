import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

export type Profile = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  job_title: string | null;
};

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const sub = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      setUser(session?.user ?? null);
      if (session?.user) {
        // defer profile fetch
        setTimeout(() => {
          supabase.from("profiles").select("*").eq("id", session.user.id).maybeSingle()
            .then(({ data }) => mounted && setProfile(data as Profile | null));
        }, 0);
      } else {
        setProfile(null);
      }
    });
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setUser(data.session?.user ?? null);
      setLoading(false);
      if (data.session?.user) {
        supabase.from("profiles").select("*").eq("id", data.session.user.id).maybeSingle()
          .then(({ data: p }) => mounted && setProfile(p as Profile | null));
      }
    });
    return () => { mounted = false; sub.data.subscription.unsubscribe(); };
  }, []);

  return { user, profile, loading };
}

export async function signOut() {
  await supabase.auth.signOut();
  window.location.href = "/auth";
}
