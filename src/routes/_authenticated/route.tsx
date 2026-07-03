// Integration-managed shape: redirects unauthenticated users to /auth.
import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { checkIsPlatformAdmin } from "@/lib/auth-routing";
import { clearActiveOrgId } from "@/lib/org-context";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });

    if (await checkIsPlatformAdmin(data.user.id)) {
      clearActiveOrgId();
      throw redirect({ to: "/platform" });
    }

    const { data: memberships } = await supabase
      .from("organization_members")
      .select("organization_id")
      .eq("user_id", data.user.id)
      .limit(1);

    if (!memberships?.length) throw redirect({ to: "/onboarding" });

    return { user: data.user };
  },
  component: () => <Outlet />,
});
