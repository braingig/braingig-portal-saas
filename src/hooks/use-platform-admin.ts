import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./use-auth";

export function usePlatformAdmin() {
  const { user } = useAuth();
  const [isPlatformAdmin, setIsPlatformAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setIsPlatformAdmin(false);
      setLoading(false);
      return;
    }
    supabase.from("platform_admins").select("user_id").eq("user_id", user.id).maybeSingle()
      .then(({ data }) => {
        setIsPlatformAdmin(!!data);
        setLoading(false);
      });
  }, [user]);

  return { isPlatformAdmin, loading };
}
